"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Create a new assessment for a specific course
 * 
 * @param courseId - The course ID to add the assessment to
 * @param name - Assessment name (e.g., "Midterm Exam")
 * @param weight - Assessment weight (e.g., 20 for 20%)
 * @param total - Total marks for this assessment (default 100)
 * @param dueDate - Due date for the assessment (optional)
 * @returns Success status and optional error message
 */
export async function createAssessment(
    courseId: string,
    name: string,
    weight: number,
    total: number = 100,
    dueDate?: string
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
        // STEP 2: VERIFY COURSE OWNERSHIP
        // ==========================================
        const { data: course, error: courseError } = await supabase
            .from("courses")
            .select("id")
            .eq("id", courseId)
            .eq("user_id", user.id)
            .maybeSingle();

        if (courseError) {
            console.error("❌ Error verifying course:", courseError);
            return { success: false, error: "Failed to verify course ownership" };
        }

        if (!course) {
            return { success: false, error: "Course not found or access denied" };
        }

        // ==========================================
        // STEP 3: INSERT ASSESSMENT
        // ==========================================
        const { data: newAssessment, error: insertError } = await supabase
            .from("assessments")
            .insert({
                user_id: user.id,
                course_id: courseId,
                name: name.trim(),
                weight: weight,
                total_marks: total,
                due_date: dueDate || null,
                score: null,
                is_completed: false
            })
            .select("id")
            .single();

        if (insertError) {
            // Check for specific errors
            if (insertError.message.includes("Maximum 25 assessments")) {
                return { success: false, error: "Maximum 25 assessments allowed per course" };
            }
            console.error("❌ Assessment insert error:", insertError);
            return { success: false, error: `Failed to create assessment: ${insertError.message}` };
        }

        // ==========================================
        // STEP 4: REVALIDATE PATHS
        // ==========================================
        revalidatePath("/dashboard/grades");

        return {
            success: true,
            assessmentId: newAssessment.id,
            message: "Assessment created successfully"
        };

    } catch (error: any) {
        console.error("❌ createAssessment error:", error);
        return {
            success: false,
            error: error.message || "An unexpected error occurred"
        };
    }
}

/**
 * Delete an assessment
 * 
 * @param assessmentId - The assessment ID to delete
 * @returns Success status and optional error message
 */
export async function deleteAssessment(assessmentId: string) {
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
        // STEP 2: DELETE ASSESSMENT (RLS ensures ownership)
        // ==========================================
        const { error: deleteError } = await supabase
            .from("assessments")
            .delete()
            .eq("id", assessmentId)
            .eq("user_id", user.id);

        if (deleteError) {
            console.error("❌ Assessment delete error:", deleteError);
            return { success: false, error: `Failed to delete assessment: ${deleteError.message}` };
        }

        // ==========================================
        // STEP 3: REVALIDATE PATHS
        // ==========================================
        revalidatePath("/dashboard/grades");

        return {
            success: true,
            message: "Assessment deleted successfully"
        };

    } catch (error: any) {
        console.error("❌ deleteAssessment error:", error);
        return {
            success: false,
            error: error.message || "An unexpected error occurred"
        };
    }
}

/**
 * Update assessment details (date and/or score and/or name) - Unified Edit Modal
 * 
 * @param assessmentId - The assessment ID to update
 * @param dueDate - Optional new due date
 * @param score - Optional new score (0-100)
 * @param name - Optional new name
 * @returns Success status and optional error message
 */
export async function updateAssessmentDetails(
    assessmentId: string,
    dueDate?: string,
    score?: number | null,
    name?: string
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
        // STEP 2: BUILD UPDATE PAYLOAD
        // ==========================================
        const updatePayload: any = {};

        if (dueDate !== undefined) {
            updatePayload.due_date = dueDate;
        }

        if (name !== undefined && name.trim() !== "") {
            updatePayload.name = name.trim();
        }

        if (score !== undefined && score !== null) {
            // Validate score range
            if (score < 0 || score > 100) {
                return { success: false, error: "Score must be between 0 and 100" };
            }
            updatePayload.score = score;
            updatePayload.is_completed = true; // Mark as completed when score is entered
        }

        // If nothing to update, return early
        if (Object.keys(updatePayload).length === 0) {
            return { success: true, message: "No changes made" };
        }

        // ==========================================
        // STEP 3: UPDATE ASSESSMENT
        // ==========================================
        const { error: updateError } = await supabase
            .from("assessments")
            .update(updatePayload)
            .eq("id", assessmentId)
            .eq("user_id", user.id);

        if (updateError) {
            console.error("❌ Assessment update error:", updateError);
            return { success: false, error: `Failed to update assessment: ${updateError.message}` };
        }

        // ==========================================
        // STEP 4: REVALIDATE PATHS
        // ==========================================
        revalidatePath("/dashboard");
        revalidatePath("/dashboard/grades");
        revalidatePath("/dashboard/calendar");

        return {
            success: true,
            message: "Assessment updated successfully"
        };

    } catch (error: any) {
        console.error("❌ updateAssessmentDetails error:", error);
        return {
            success: false,
            error: error.message || "An unexpected error occurred"
        };
    }
}

/**
 * Update assessment date only (for drag-and-drop rescheduling)
 * 
 * @param assessmentId - The assessment ID to update
 * @param newDate - The new due date (ISO string)
 * @returns Success status and optional error message
 */
export async function updateAssessmentDate(assessmentId: string, newDate: string) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated" };
        }

        const { error: updateError } = await supabase
            .from("assessments")
            .update({ due_date: newDate })
            .eq("id", assessmentId)
            .eq("user_id", user.id);

        if (updateError) {
            console.error("❌ Assessment date update error:", updateError);
            return { success: false, error: `Failed to update date: ${updateError.message}` };
        }

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/grades");
        revalidatePath("/dashboard/calendar");

        return {
            success: true,
            message: "Date updated successfully"
        };

    } catch (error: any) {
        console.error("❌ updateAssessmentDate error:", error);
        return {
            success: false,
            error: error.message || "An unexpected error occurred"
        };
    }
}
