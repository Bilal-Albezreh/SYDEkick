"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Phase 2.3: Fork Term - Clone a Master Term into User's Dashboard
 * 
 * This function:
 * 1. Updates user's profile with program identity
 * 2. Creates a new term for the user
 * 3. Clones all master courses from the template
 * 4. Clones all master assessments with calculated due dates
 * 
 * @param programId - The program ID to associate with user
 * @param masterTermId - The master term ID to clone from
 * @param startDate - The start date for the new term
 * @param termName - The season name (e.g., "Winter 2026")
 * @returns Success status and optional error message
 */
export async function setupUserTerm(
    programId: string,
    masterTermId: string,
    startDate: Date,
    termName: string,
    shouldPreload: boolean = true
) {
    try {
        // ==========================================
        // STEP 1: AUTHENTICATION CHECK
        // ==========================================
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated" };
        }

        // ==========================================
        // STEP 2: UPDATE PROFILE (IDENTITY LOCK)
        // ==========================================

        // First, fetch the university_id from the program
        const { data: program, error: programError } = await supabase
            .from("programs")
            .select("university_id")
            .eq("id", programId)
            .single();

        if (programError || !program) {
            return { success: false, error: "Program not found" };
        }

        // Update user's profile with program identity
        const { error: profileError } = await supabase
            .from("profiles")
            .update({
                program_id: programId,
                university_id: program.university_id,
            })
            .eq("id", user.id);

        if (profileError) {
            console.error("Profile update error:", profileError);
            return { success: false, error: "Failed to update profile" };
        }

        // ==========================================
        // STEP 3: CREATE USER TERM
        // ==========================================

        // Fetch the label from master_terms
        const { data: masterTerm, error: masterTermError } = await supabase
            .from("master_terms")
            .select("label")
            .eq("id", masterTermId)
            .single();

        if (masterTermError || !masterTerm) {
            return { success: false, error: "Master term not found" };
        }

        // Calculate end date (assuming 4 months = ~120 days)
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 120);

        // Insert new user term (is_current = true will auto-archive old terms via trigger)
        const { data: newTerm, error: termError } = await supabase
            .from("terms")
            .insert({
                user_id: user.id,
                label: masterTerm.label,
                season: termName,
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                is_current: true,
            })
            .select("id")
            .single();

        if (termError) {
            console.error("Term creation error:", termError);
            return { success: false, error: "Failed to create term" };
        }

        const userTermId = newTerm.id;

        // ==========================================
        // CONDITIONAL: SKIP PRELOAD IF NOT REQUESTED
        // ==========================================
        if (!shouldPreload) {
            // User wants an empty term - just return success
            revalidatePath("/dashboard");
            revalidatePath("/dashboard/grades");
            revalidatePath("/dashboard/calendar");
            revalidatePath("/dashboard/profile");

            return {
                success: true,
                termId: userTermId,
                coursesCloned: 0,
                assessmentsCloned: 0,
                message: "Empty term created successfully"
            };
        }

        // ==========================================
        // STEP 4: CLONE COURSES (THE HYDRATION)
        // ==========================================

        // Fetch all master courses for this term
        const { data: masterCourses, error: coursesError } = await supabase
            .from("master_courses")
            .select("id, code, name, color, default_credits")
            .eq("master_term_id", masterTermId);

        if (coursesError) {
            console.error("Master courses fetch error:", coursesError);
            return { success: false, error: "Failed to fetch master courses" };
        }

        if (!masterCourses || masterCourses.length === 0) {
            return { success: false, error: "No courses found in this master term" };
        }

        // Map to track Master Course ID -> New User Course ID
        const courseIdMap = new Map<string, string>();

        // Clone each course
        for (const masterCourse of masterCourses) {
            try {
                const { data: newCourse, error: insertError } = await supabase
                    .from("courses")
                    .insert({
                        user_id: user.id,
                        term_id: userTermId,
                        course_code: masterCourse.code,
                        name: masterCourse.name,
                        color: masterCourse.color,
                        // Note: default_credits maps to existing column if it exists,
                        // otherwise this will be ignored gracefully
                    })
                    .select("id")
                    .single();

                if (insertError) {
                    // Check if it's the "Max 8 courses" trigger error
                    if (insertError.message.includes("Maximum 8 courses")) {
                        return { success: false, error: "Term limit reached. Maximum 8 courses allowed per term." };
                    }
                    throw insertError;
                }

                // Store mapping for assessment cloning
                courseIdMap.set(masterCourse.id, newCourse.id);
            } catch (error: any) {
                console.error("Course insert error:", error);
                return { success: false, error: `Failed to clone course: ${masterCourse.code}` };
            }
        }

        // ==========================================
        // STEP 5: CLONE ASSESSMENTS (THE DATE MATH)
        // ==========================================

        // Fetch all master assessments for the cloned courses
        const masterCourseIds = masterCourses.map(c => c.id);
        const { data: masterAssessments, error: assessmentsError } = await supabase
            .from("master_assessments")
            .select("master_course_id, title, weight, default_due_offset_days")
            .in("master_course_id", masterCourseIds);

        if (assessmentsError) {
            console.error("Master assessments fetch error:", assessmentsError);
            // Non-fatal: courses are cloned, assessments failed
            return { success: true, error: "Courses cloned, but assessments failed to load" };
        }

        if (masterAssessments && masterAssessments.length > 0) {
            // Clone each assessment with calculated due date
            const assessmentsToInsert = masterAssessments.map((assessment) => {
                const userCourseId = courseIdMap.get(assessment.master_course_id);

                if (!userCourseId) {
                    console.warn(`No course mapping found for master_course_id: ${assessment.master_course_id}`);
                    return null;
                }

                // Calculate due date: startDate + offset_days
                const dueDate = new Date(startDate);
                dueDate.setDate(dueDate.getDate() + assessment.default_due_offset_days);

                return {
                    user_id: user.id,
                    course_id: userCourseId,
                    name: assessment.title,
                    weight: assessment.weight,
                    due_date: dueDate.toISOString().split('T')[0] + 'T12:00:00Z', // Noon UTC
                    is_completed: false,
                    score: null,
                };
            }).filter(a => a !== null); // Remove null entries

            // Batch insert assessments
            if (assessmentsToInsert.length > 0) {
                const { error: assessmentInsertError } = await supabase
                    .from("assessments")
                    .insert(assessmentsToInsert);

                if (assessmentInsertError) {
                    // Check if it's the "Max 25 assessments" trigger error
                    if (assessmentInsertError.message.includes("Maximum 25 assessments")) {
                        console.warn("Hit max assessments limit for a course");
                        return { success: true, error: "Some assessments skipped due to 25 assessment limit per course" };
                    }
                    console.error("Assessment insert error:", assessmentInsertError);
                    return { success: true, error: "Courses cloned, but some assessments failed to insert" };
                }
            }
        }

        // ==========================================
        // SUCCESS - REVALIDATE PATHS
        // ==========================================

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/grades");
        revalidatePath("/dashboard/calendar");
        revalidatePath("/dashboard/profile");

        return {
            success: true,
            termId: userTermId,
            coursesCloned: masterCourses.length,
            assessmentsCloned: masterAssessments?.length || 0
        };

    } catch (error: any) {
        console.error("setupUserTerm error:", error);
        return {
            success: false,
            error: error.message || "An unexpected error occurred"
        };
    }
}
