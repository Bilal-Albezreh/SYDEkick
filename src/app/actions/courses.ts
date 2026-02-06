"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Create a new course for the current user's active term
 * 
 * @param code - Course code (e.g., "SYDE 101")
 * @param name - Course name (e.g., "Introduction to Systems Design")
 * @param color - Hex color code (e.g., "#3b82f6")
 * @returns Success status and optional error message
 */
export async function createCourse(
    code: string,
    name: string,
    color: string
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
        // STEP 2: FIND CURRENT TERM
        // ==========================================
        const { data: currentTerm, error: termError } = await supabase
            .from("terms")
            .select("id")
            .eq("user_id", user.id)
            .eq("is_current", true)
            .maybeSingle();

        if (termError) {
            console.error("❌ Error fetching current term:", termError);
            return { success: false, error: "Failed to find active term" };
        }

        if (!currentTerm) {
            return { success: false, error: "No active term found. Please set up a term first." };
        }

        // ==========================================
        // STEP 3: INSERT COURSE
        // ==========================================
        const { data: newCourse, error: insertError } = await supabase
            .from("courses")
            .insert({
                user_id: user.id,
                term_id: currentTerm.id,
                course_code: code.trim(),
                course_name: name.trim(), // ✅ FIXED: Map to 'course_name' column
                color: color
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
