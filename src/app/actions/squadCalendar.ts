"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
    updateTaskStateSchema,
    type UpdateTaskStateInput
} from "@/lib/validations/squads";

// =====================================================
// TYPE DEFINITIONS
// =====================================================
interface CalendarItem {
    template_id: string;
    user_id: string;
    squad_id: string | null;
    squad_name: string | null;
    display_title: string;
    display_date: string;
    display_weight: number | null;
    type: string;
    description: string | null;
    status: 'pending' | 'completed' | 'late';
    grade: number | null;
    notes: string | null;
    completed_at: string | null;
    is_personal: boolean;
    is_archived: boolean;
    created_at: string;
    updated_at: string;
}

interface DateRange {
    start?: string; // ISO date string
    end?: string;   // ISO date string
}

// =====================================================
// GET MY CALENDAR (Smart Overlay)
// =====================================================
/**
 * Fetch the user's calendar using the master_calendar_view
 * 
 * This view automatically merges:
 * - Squad templates
 * - User task state overrides
 * - Personal tasks
 * 
 * @param range Optional date range filter
 * @returns {success, items, error}
 */
export async function getMyCalendar(range?: DateRange) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated" };
        }

        // Build query
        let query = supabase
            .from("master_calendar_view")
            .select("*")
            .eq("user_id", user.id)
            .order("display_date", { ascending: true });

        // Apply date range filter if provided
        if (range?.start) {
            query = query.gte("display_date", range.start);
        }
        if (range?.end) {
            query = query.lte("display_date", range.end);
        }

        const { data: items, error: queryError } = await query;

        if (queryError) {
            console.error("[getMyCalendar] Error:", queryError);
            return { success: false, error: "Failed to fetch calendar items" };
        }

        return {
            success: true,
            items: (items as unknown as CalendarItem[]) || []
        };

    } catch (error: any) {
        console.error("[getMyCalendar] Unexpected error:", error);
        return {
            success: false,
            error: error.message || "An unexpected error occurred"
        };
    }
}

// =====================================================
// UPDATE TASK STATUS (Smart Overlay - UPSERT)
// =====================================================
/**
 * Update a task's status (pending, completed, late)
 * 
 * SMART LOGIC: Uses UPSERT to handle overlay pattern
 * - If user_task_state exists → UPDATE status
 * - If not → INSERT new row with status
 * 
 * @returns {success, state, error}
 */
export async function updateTaskStatus(
    templateId: string,
    status: 'pending' | 'completed' | 'late'
) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated" };
        }

        // UPSERT: Insert or update based on (user_id, template_id)
        const { data: state, error: upsertError } = await supabase
            .from("user_task_states")
            .upsert({
                user_id: user.id,
                template_id: templateId,
                status: status,
                completed_at: status === 'completed' ? new Date().toISOString() : null,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id,template_id', // Update if exists
            })
            .select("*")
            .single();

        if (upsertError) {
            console.error("[updateTaskStatus] Error:", upsertError);
            return { success: false, error: upsertError.message || "Failed to update status" };
        }

        revalidatePath("/dashboard/calendar");
        return { success: true, state };

    } catch (error: any) {
        console.error("[updateTaskStatus] Unexpected error:", error);
        return {
            success: false,
            error: error.message || "An unexpected error occurred"
        };
    }
}

// =====================================================
// UPDATE TASK DETAILS (Smart Overlay - UPSERT)
// =====================================================
/**
 * Update task details (title, date, weight, grade, notes)
 * 
 * SMART LOGIC: Uses UPSERT to handle overlay pattern
 * - Custom fields override template defaults in master_calendar_view
 * - Null values = use template default
 * 
 * @returns {success, state, error}
 */
export async function updateTaskDetails(input: UpdateTaskStateInput) {
    try {
        // Validate input
        const validatedData = updateTaskStateSchema.parse(input);

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated" };
        }

        // Build update object (only include provided fields)
        const updateData: any = {
            user_id: user.id,
            template_id: validatedData.template_id,
            updated_at: new Date().toISOString(),
        };

        // Add optional fields if provided
        if (validatedData.custom_title !== undefined) {
            updateData.custom_title = validatedData.custom_title;
        }
        if (validatedData.custom_date !== undefined) {
            updateData.custom_date = validatedData.custom_date;
        }
        if (validatedData.custom_weight !== undefined) {
            updateData.custom_weight = validatedData.custom_weight;
        }
        if (validatedData.status !== undefined) {
            updateData.status = validatedData.status;
            if (validatedData.status === 'completed') {
                updateData.completed_at = new Date().toISOString();
            }
        }
        if (validatedData.grade !== undefined) {
            updateData.grade = validatedData.grade;
        }
        if (validatedData.notes !== undefined) {
            updateData.notes = validatedData.notes;
        }

        // UPSERT: Insert or update based on (user_id, template_id)
        const { data: state, error: upsertError } = await supabase
            .from("user_task_states")
            .upsert(updateData, {
                onConflict: 'user_id,template_id',
            })
            .select("*")
            .single();

        if (upsertError) {
            console.error("[updateTaskDetails] Error:", upsertError);
            return { success: false, error: upsertError.message || "Failed to update task" };
        }

        revalidatePath("/dashboard/calendar");
        return { success: true, state };

    } catch (error: any) {
        console.error("[updateTaskDetails] Unexpected error:", error);
        return {
            success: false,
            error: error.message || "An unexpected error occurred"
        };
    }
}

// =====================================================
// DELETE TASK STATE (Reset to Template)
// =====================================================
/**
 * Delete a user's task state (resets to template defaults)
 * 
 * This removes all custom overrides and private data
 * The task will still appear in calendar via template
 * 
 * @returns {success, error}
 */
export async function deleteTaskState(templateId: string) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated" };
        }

        const { error: deleteError } = await supabase
            .from("user_task_states")
            .delete()
            .eq("user_id", user.id)
            .eq("template_id", templateId);

        if (deleteError) {
            console.error("[deleteTaskState] Error:", deleteError);
            return { success: false, error: "Failed to delete task state" };
        }

        revalidatePath("/dashboard/calendar");
        return { success: true };

    } catch (error: any) {
        console.error("[deleteTaskState] Unexpected error:", error);
        return {
            success: false,
            error: error.message || "An unexpected error occurred"
        };
    }
}

// =====================================================
// GET TASK STATE (Individual)
// =====================================================
/**
 * Get a specific user task state
 * 
 * @returns {success, state, error}
 */
export async function getTaskState(templateId: string) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated" };
        }

        const { data: state, error: queryError } = await supabase
            .from("user_task_states")
            .select("*")
            .eq("user_id", user.id)
            .eq("template_id", templateId)
            .maybeSingle();

        if (queryError) {
            console.error("[getTaskState] Error:", queryError);
            return { success: false, error: "Failed to fetch task state" };
        }

        return { success: true, state };

    } catch (error: any) {
        console.error("[getTaskState] Unexpected error:", error);
        return {
            success: false,
            error: error.message || "An unexpected error occurred"
        };
    }
}
