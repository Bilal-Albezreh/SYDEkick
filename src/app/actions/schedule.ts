"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { ScheduleItemInsert, ScheduleItemWithCourse } from "@/../../database.types";

/**
 * Fetch all schedule items for the current user, joined with course data
 */
export async function getScheduleItems(): Promise<{ success: boolean; data?: ScheduleItemWithCourse[]; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated" };
        }

        const { data, error } = await supabase
            .from("schedule_items")
            .select(`
                *,
                course:courses (
                    course_code,
                    course_name,
                    color
                )
            `)
            .eq("user_id", user.id)
            .order("day", { ascending: true })
            .order("start_time", { ascending: true });

        if (error) {
            console.error("❌ Error fetching schedule items:", error);
            return { success: false, error: error.message };
        }

        // Flatten the course data
        const scheduleItems = (data || []).map((item: any) => ({
            ...item,
            course: item.course || undefined
        })) as ScheduleItemWithCourse[];

        return { success: true, data: scheduleItems };
    } catch (error: any) {
        console.error("❌ getScheduleItems error:", error);
        return { success: false, error: error.message || "An unexpected error occurred" };
    }
}

/**
 * Create a new schedule item
 */
export async function createScheduleItem(data: Omit<ScheduleItemInsert, "user_id">): Promise<{ success: boolean; data?: ScheduleItemWithCourse; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated" };
        }

        // Validate required fields
        if (!data.course_id || !data.day || !data.start_time || !data.end_time || !data.type) {
            return { success: false, error: "Missing required fields" };
        }

        const { data: newItem, error: insertError } = await supabase
            .from("schedule_items")
            .insert({
                ...data,
                user_id: user.id
            })
            .select(`
                *,
                course:courses (
                    course_code,
                    course_name,
                    color
                )
            `)
            .single();

        if (insertError) {
            console.error("❌ Error creating schedule item:", insertError);
            return { success: false, error: insertError.message };
        }

        revalidatePath("/dashboard/schedule");

        return { 
            success: true, 
            data: {
                ...newItem,
                course: newItem.course || undefined
            } as ScheduleItemWithCourse
        };
    } catch (error: any) {
        console.error("❌ createScheduleItem error:", error);
        return { success: false, error: error.message || "An unexpected error occurred" };
    }
}

/**
 * Update a schedule item
 */
export async function updateScheduleItem(id: string, data: Partial<Omit<ScheduleItemInsert, "user_id">>): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated" };
        }

        const { error: updateError } = await supabase
            .from("schedule_items")
            .update(data)
            .eq("id", id)
            .eq("user_id", user.id);

        if (updateError) {
            console.error("❌ Error updating schedule item:", updateError);
            return { success: false, error: updateError.message };
        }

        revalidatePath("/dashboard/schedule");

        return { success: true };
    } catch (error: any) {
        console.error("❌ updateScheduleItem error:", error);
        return { success: false, error: error.message || "An unexpected error occurred" };
    }
}

/**
 * Delete a schedule item
 */
export async function deleteScheduleItem(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated" };
        }

        const { error: deleteError } = await supabase
            .from("schedule_items")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);

        if (deleteError) {
            console.error("❌ Error deleting schedule item:", deleteError);
            return { success: false, error: deleteError.message };
        }

        revalidatePath("/dashboard/schedule");

        return { success: true };
    } catch (error: any) {
        console.error("❌ deleteScheduleItem error:", error);
        return { success: false, error: error.message || "An unexpected error occurred" };
    }
}
