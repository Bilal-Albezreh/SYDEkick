"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Update course details (code, name, color)
 */
export async function updateCourse(
    courseId: string,
    courseCode: string,
    courseName: string,
    color: string
) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: "Not authenticated" };
    }

    // Update the course
    const { error } = await supabase
        .from("courses")
        .update({
            course_code: courseCode,
            course_name: courseName,
            color: color,
        })
        .eq("id", courseId)
        .eq("user_id", user.id);

    if (error) {
        console.error("Update course error:", error);
        return { success: false, error: "Failed to update course" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard/courses");
    revalidatePath("/dashboard/grades");
    revalidatePath("/dashboard");

    return { success: true };
}

/**
 * Delete a course and all its associated data
 */
export async function deleteCourse(courseId: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: "Not authenticated" };
    }

    // Delete the course (cascade will handle assessments and events)
    const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", courseId)
        .eq("user_id", user.id);

    if (error) {
        console.error("Delete course error:", error);
        return { success: false, error: "Failed to delete course" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard/courses");
    revalidatePath("/dashboard/grades");
    revalidatePath("/dashboard");

    return { success: true };
}


/**
 * Get course with all assessments for the manager panel
 */
export async function getCourseWithAssessments(courseId: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: "Not authenticated" };
    }

    // Fetch course with assessments
    const { data: course, error } = await supabase
        .from("courses")
        .select(`
            id, course_code, course_name, color, credits, term, term_id,
            assessments (id, name, weight, score, total_marks, due_date, type, is_completed)
        `)
        .eq("id", courseId)
        .eq("user_id", user.id)
        .single();

    if (error || !course) {
        console.error("Get course error:", error);
        return { success: false, error: "Course not found or access denied" };
    }

    return { success: true, data: course };
}

/**
 * Update course details (Settings tab)
 * SECURITY: Verifies course ownership
 */
export async function updateCourseDetails(
    courseId: string,
    courseData: {
        course_code: string;
        course_name: string;
        color: string;
        credits?: number;
        term_id?: string;
    }
) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: "Not authenticated" };
    }

    // SECURITY CHECK: Verify course belongs to user
    const { data: existingCourse, error: verifyError } = await supabase
        .from("courses")
        .select("id")
        .eq("id", courseId)
        .eq("user_id", user.id)
        .single();

    if (verifyError || !existingCourse) {
        return { success: false, error: "Unauthorized" };
    }

    // Build update object
    const updateData: any = {
        course_code: courseData.course_code,
        course_name: courseData.course_name,
        color: courseData.color,
    };

    if (courseData.credits !== undefined) {
        updateData.credits = courseData.credits;
    }

    // If term_id is provided, fetch term label and update both
    if (courseData.term_id) {
        const { data: termData, error: termError } = await supabase
            .from("terms")
            .select("label")
            .eq("id", courseData.term_id)
            .single();

        if (!termError && termData) {
            updateData.term_id = courseData.term_id;
            updateData.term = termData.label;
        }
    }

    // Update course
    const { error: updateError } = await supabase
        .from("courses")
        .update(updateData)
        .eq("id", courseId)
        .eq("user_id", user.id);

    if (updateError) {
        console.error("Course update error:", updateError);
        return { success: false, error: "Failed to update course" };
    }

    revalidatePath("/dashboard/courses");
    revalidatePath("/dashboard/grades");
    revalidatePath("/dashboard");

    return { success: true };
}

/**
 * Update course assessments (Content tab)
 * SECURITY: Verifies course ownership
 */
export async function updateCourseAssessments(
    courseId: string,
    assessmentsList: Array<{
        id?: string;
        name: string;
        weight: number;
        total_marks: number;
        due_date?: string | null;
    }>
) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: "Not authenticated" };
    }

    // SECURITY CHECK: Verify course belongs to user
    const { data: existingCourse, error: verifyError } = await supabase
        .from("courses")
        .select("id")
        .eq("id", courseId)
        .eq("user_id", user.id)
        .single();

    if (verifyError || !existingCourse) {
        return { success: false, error: "Unauthorized" };
    }

    // Get existing assessments to determine deletions
    const { data: existingAssessments } = await supabase
        .from("assessments")
        .select("id")
        .eq("course_id", courseId);

    const existingIds = new Set((existingAssessments || []).map(a => a.id));
    const providedIds = new Set(assessmentsList.filter(a => a.id).map(a => a.id!));
    const idsToDelete = Array.from(existingIds).filter(id => !providedIds.has(id));

    // Delete removed assessments
    if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase
            .from("assessments")
            .delete()
            .in("id", idsToDelete);

        if (deleteError) {
            console.error("Delete error:", deleteError);
            return { success: false, error: "Failed to delete assessments" };
        }
    }

    // Handle new vs existing assessments separately
    if (assessmentsList.length > 0) {
        const newAssessments = assessmentsList.filter(a => !a.id);
        const existingAssessments = assessmentsList.filter(a => a.id);

        // Insert new assessments
        if (newAssessments.length > 0) {
            const assessmentsToInsert = newAssessments.map(a => ({
                // Explicitly generate ID to avoid DB constraint issues
                // If crypto.randomUUID is not available (older node), we can rely on DB default, 
                // but since DB default is failing, we force it here.
                id: crypto.randomUUID(),
                course_id: courseId,
                user_id: user.id,
                name: a.name,
                weight: a.weight,
                total_marks: a.total_marks,
                due_date: a.due_date || null,
                score: null,
                type: (a.name.toLowerCase().includes('exam') || a.name.toLowerCase().includes('midterm')) ? 'Exam' :
                    (a.name.toLowerCase().includes('quiz')) ? 'Quiz' : 'Assignment',
            }));

            console.log("Inserting assessments:", JSON.stringify(assessmentsToInsert, null, 2));

            const { error: insertError } = await supabase
                .from("assessments")
                .insert(assessmentsToInsert);

            if (insertError) {
                console.error("Insert error:", insertError);
                return { success: false, error: "Failed to create new assessments" };
            }
        }

        // Update existing assessments
        if (existingAssessments.length > 0) {
            for (const assessment of existingAssessments) {
                const { error: updateError } = await supabase
                    .from("assessments")
                    .update({
                        name: assessment.name,
                        weight: assessment.weight,
                        total_marks: assessment.total_marks,
                        due_date: assessment.due_date || null,
                    })
                    .eq("id", assessment.id!)
                    .eq("course_id", courseId);

                if (updateError) {
                    console.error("Update error:", updateError);
                    return { success: false, error: "Failed to update assessments" };
                }
            }
        }
    }

    revalidatePath("/dashboard/courses");
    revalidatePath("/dashboard/grades");

    return { success: true };
}


/**
 * Create a new course for a specific term
 * Uses lazy term creation - if term doesn't exist, creates it automatically
 * 
 * @param code - Course code (e.g., "SYDE 101")
 * @param name - Course name (e.g., "Introduction to Systems Design")
 * @param color - Hex color code (e.g., "#3b82f6")
 * @param credits - Course credit weight (e.g., 0.5 for standard, 0.25 for lab)
 * @param termLabel - Term label from ACADEMIC_TERMS (e.g., "1A", "2B")
 * @returns Success status and optional error message
 */
export async function createCourse(
    code: string,
    name: string,
    color: string,
    credits: number = 0.5,
    termLabel: string
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
        // STEP 2: LAZY TERM CREATION
        // Check if term exists, create if it doesn't
        // ==========================================
        let termId: string;

        // Check if term with this label already exists for the user
        const { data: existingTerm } = await supabase
            .from("terms")
            .select("id")
            .eq("user_id", user.id)
            .eq("label", termLabel)
            .maybeSingle();

        if (existingTerm) {
            // Term exists, use its ID
            termId = existingTerm.id;
        } else {
            // Term doesn't exist, create it now
            const { data: newTerm, error: termCreateError } = await supabase
                .from("terms")
                .insert({
                    user_id: user.id,
                    label: termLabel,
                    season: `${termLabel} Term`, // Placeholder season
                    start_date: new Date().toISOString().split('T')[0], // Placeholder date
                    end_date: new Date().toISOString().split('T')[0], // Placeholder date
                    is_current: false // Default to not current
                })
                .select("id")
                .single();

            if (termCreateError || !newTerm) {
                console.error("❌ Error creating term:", termCreateError);
                return { success: false, error: "Failed to create term" };
            }

            termId = newTerm.id;
        }

        // ==========================================
        // STEP 3: INSERT COURSE
        // ==========================================
        const { data: newCourse, error: insertError } = await supabase
            .from("courses")
            .insert({
                user_id: user.id,
                term_id: termId,
                course_code: code.trim(),
                course_name: name.trim(),
                color: color,
                credits: credits,
                term: termLabel // Store label for quick reference
            })
            .select("id")
            .single();

        if (insertError) {
            // Check for specific errors
            if (insertError.message.includes("Maximum 8 courses")) {
                return { success: false, error: "Maximum 8 courses allowed per term" };
            }
            console.error("❌ Course insert error:", insertError);
            return { success: false, error: `Failed to create course: ${insertError.message}` };
        }

        // ==========================================
        // STEP 4: REVALIDATE PATHS
        // ==========================================
        revalidatePath("/dashboard");
        revalidatePath("/dashboard/grades");
        revalidatePath("/dashboard/courses");

        return {
            success: true,
            courseId: newCourse.id,
            message: "Course created successfully"
        };

    } catch (error: any) {
        console.error("❌ createCourse error:", error);
        return {
            success: false,
            error: error.message || "An unexpected error occurred"
        };
    }
}
