"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Create a new personal task (personal or course work)
 * 
 * CRITICAL: Returns the FULL database object including UUID
 * This prevents "ghost items" in the UI
 */
export async function createPersonalTask(data: {
    title: string;
    description?: string;
    due_date: string;
    type: 'personal' | 'course_work';
    course_id?: string;
}) {
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
        // STEP 2: VALIDATION
        // ==========================================
        if (!data.title.trim()) {
            return { success: false, error: "Title is required" };
        }

        if (data.type === 'course_work' && !data.course_id) {
            return { success: false, error: "Course selection is required for course work" };
        }

        // ==========================================
        // STEP 3: INSERT PERSONAL TASK
        // ==========================================
        const { data: newTask, error: insertError } = await supabase
            .from("personal_tasks")
            .insert({
                user_id: user.id,
                title: data.title.trim(),
                description: data.description?.trim() || null,
                due_date: data.due_date,
                type: data.type,
                course_id: data.type === 'course_work' ? data.course_id : null,
                is_completed: false
            })
            .select("*")  // CRITICAL: Return full object with UUID
            .single();

        if (insertError) {
            console.error("❌ Personal task insert error:", insertError);
            return { success: false, error: `Failed to create task: ${insertError.message}` };
        }

        // ==========================================
        // STEP 4: REVALIDATE PATHS
        // ==========================================
        revalidatePath("/dashboard");
        revalidatePath("/dashboard/calendar");
        revalidatePath("/dashboard/grades");

        return {
            success: true,
            task: newTask,  // CRITICAL: Return full DB object with real UUID
            message: "Task created successfully"
        };

    } catch (error: any) {
        console.error("❌ createPersonalTask error:", error);
        return {
            success: false,
            error: error.message || "An unexpected error occurred"
        };
    }
}

/**
 * Toggle personal task completion status
 */
export async function togglePersonalTaskComplete(taskId: string, isCompleted: boolean) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated" };
        }

        const { error: updateError } = await supabase
            .from("personal_tasks")
            .update({ is_completed: isCompleted })
            .eq("id", taskId)
            .eq("user_id", user.id);

        if (updateError) {
            console.error("❌ Toggle task error:", updateError);
            return { success: false, error: `Failed to update task: ${updateError.message}` };
        }

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/calendar");

        return {
            success: true,
            message: "Task status updated"
        };

    } catch (error: any) {
        console.error("❌ togglePersonalTaskComplete error:", error);
        return {
            success: false,
            error: error.message || "An unexpected error occurred"
        };
    }
}

/**
 * Update personal task date (for drag-and-drop)
 */
export async function updatePersonalTaskDate(taskId: string, newDate: string) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated" };
        }

        const { error: updateError } = await supabase
            .from("personal_tasks")
            .update({ due_date: newDate })
            .eq("id", taskId)
            .eq("user_id", user.id);

        if (updateError) {
            console.error("❌ Update task date error:", updateError);
            return { success: false, error: `Failed to update date: ${updateError.message}` };
        }

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/calendar");

        return {
            success: true,
            message: "Date updated successfully"
        };

    } catch (error: any) {
        console.error("❌ updatePersonalTaskDate error:", error);
        return {
            success: false,
            error: error.message || "An unexpected error occurred"
        };
    }
}

/**
 * Delete a personal task
 */
export async function deletePersonalTask(taskId: string) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated" };
        }

        const { error: deleteError } = await supabase
            .from("personal_tasks")
            .delete()
            .eq("id", taskId)
            .eq("user_id", user.id);

        if (deleteError) {
            console.error("❌ Delete task error:", deleteError);
            return { success: false, error: `Failed to delete task: ${deleteError.message}` };
        }

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/calendar");

        return {
            success: true,
            message: "Task deleted successfully"
        };

    } catch (error: any) {
        console.error("❌ deletePersonalTask error:", error);
        return {
            success: false,
            error: error.message || "An unexpected error occurred"
        };
    }
}
