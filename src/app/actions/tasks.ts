"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// ─── READ ──────────────────────────────────────────────────

/**
 * Fetch all task lists with their nested tasks for the current user.
 * Tasks are returned unsorted — the UI handles sort order.
 */
export async function getTaskListsWithTasks() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        console.log("[TASKS] getTaskListsWithTasks — user:", user?.id ?? "NO USER", "authError:", authError?.message ?? "none");

        if (authError || !user) {
            return { success: false, error: "Not authenticated", lists: [] };
        }

        // Fetch lists
        const { data: lists, error: listsError } = await supabase
            .from("task_lists")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true });

        if (listsError) {
            console.error("❌ [TASKS] Fetch task_lists FAILED:", listsError.message, listsError.code, listsError.details);
            return { success: false, error: listsError.message, lists: [] };
        }

        // Fetch all tasks for this user
        const { data: tasks, error: tasksError } = await supabase
            .from("tasks")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (tasksError) {
            console.error("❌ [TASKS] Fetch tasks FAILED:", tasksError.message, tasksError.code, tasksError.details);
            return { success: false, error: tasksError.message, lists: [] };
        }

        // Nest tasks under their lists
        const listsWithTasks = (lists || []).map((list) => ({
            ...list,
            tasks: (tasks || []).filter((t) => t.list_id === list.id),
        }));

        console.log("[TASKS] getTaskListsWithTasks — fetched", listsWithTasks.length, "lists");
        return { success: true, lists: listsWithTasks };
    } catch (error: any) {
        console.error("❌ [TASKS] getTaskListsWithTasks EXCEPTION:", error);
        return { success: false, error: error.message, lists: [] };
    }
}

/**
 * Fetch tasks for the Calendar: only incomplete tasks with a due_date.
 * Joins the parent list's color_hex for Neural Link visual coloring.
 */
export async function getCalendarTasks() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, tasks: [] };
        }

        // Fetch tasks with due dates
        const { data: tasks, error: tasksError } = await supabase
            .from("tasks")
            .select("id, title, due_date, is_completed, priority, notes, course_id, list_id")
            .eq("user_id", user.id)
            .eq("is_completed", false)
            .not("due_date", "is", null);

        if (tasksError) {
            console.error("❌ [TASKS] getCalendarTasks FAILED:", tasksError.message);
            return { success: false, tasks: [] };
        }

        // Fetch all lists for color lookup
        const { data: lists } = await supabase
            .from("task_lists")
            .select("id, color_hex, name")
            .eq("user_id", user.id);

        const listMap = new Map((lists || []).map(l => [l.id, l]));

        // Attach list color to each task
        const enriched = (tasks || []).map(t => ({
            ...t,
            list_color: listMap.get(t.list_id)?.color_hex ?? "#6366f1",
            list_name: listMap.get(t.list_id)?.name ?? "Tasks",
        }));

        return { success: true, tasks: enriched };
    } catch (error: any) {
        console.error("❌ [TASKS] getCalendarTasks EXCEPTION:", error);
        return { success: false, tasks: [] };
    }
}

// ─── TASK LISTS CRUD ───────────────────────────────────────

/**
 * Create a new task list.
 * Returns the full database object including UUID.
 */
export async function createTaskList(data: { name: string; color_hex: string }) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        console.log("[TASKS] createTaskList — user:", user?.id ?? "NO USER", "payload:", data);

        if (authError || !user) {
            console.error("❌ [TASKS] createTaskList — NOT AUTHENTICATED");
            return { success: false, error: "Not authenticated" };
        }

        if (!data.name.trim()) {
            return { success: false, error: "List name is required" };
        }

        const { data: newList, error: insertError } = await supabase
            .from("task_lists")
            .insert({
                user_id: user.id,
                name: data.name.trim(),
                color_hex: data.color_hex,
            })
            .select("*")
            .single();

        if (insertError) {
            console.error("❌ [TASKS] createTaskList INSERT FAILED:", insertError.message, insertError.code, insertError.details);
            return { success: false, error: insertError.message };
        }

        console.log("✅ [TASKS] createTaskList SUCCESS — id:", newList?.id);
        revalidatePath("/dashboard/tasks");
        return { success: true, list: newList };
    } catch (error: any) {
        console.error("❌ [TASKS] createTaskList EXCEPTION:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete a task list and all its tasks (cascade via FK).
 */
export async function deleteTaskList(listId: string) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated" };
        }

        const { error: deleteError } = await supabase
            .from("task_lists")
            .delete()
            .eq("id", listId)
            .eq("user_id", user.id);

        if (deleteError) {
            console.error("❌ Delete task_list error:", deleteError);
            return { success: false, error: deleteError.message };
        }

        revalidatePath("/dashboard/tasks");
        return { success: true };
    } catch (error: any) {
        console.error("❌ deleteTaskList error:", error);
        return { success: false, error: error.message };
    }
}

// ─── TASKS CRUD ────────────────────────────────────────────

/**
 * Create a new task in a list.
 * Returns the full database object including UUID.
 */
export async function createTask(data: {
    list_id?: string;
    title: string;
    due_date?: string | null;
    priority?: string;
    course_id?: string | null;
    notes?: string | null;
}) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        console.log("[TASKS] createTask — user:", user?.id ?? "NO USER", "payload:", data);

        if (authError || !user) {
            console.error("❌ [TASKS] createTask — NOT AUTHENTICATED");
            return { success: false, error: "Not authenticated" };
        }

        if (!data.title.trim()) {
            return { success: false, error: "Title is required" };
        }

        let targetListId = data.list_id;

        // [NEW] 'Inbox' Fallback Logic
        if (!targetListId) {
            // Find existing Inbox
            const { data: inbox } = await supabase
                .from("task_lists")
                .select("id")
                .eq("user_id", user.id)
                .eq("name", "Inbox")
                .limit(1)
                .single();

            if (inbox) {
                targetListId = inbox.id;
            } else {
                // Create Inbox
                const { data: newInbox, error: inboxError } = await supabase
                    .from("task_lists")
                    .insert({
                        user_id: user.id,
                        name: "Inbox",
                        color_hex: "#6366f1" // Neural Link Indigo
                    })
                    .select("id")
                    .single();

                if (inboxError || !newInbox) {
                    return { success: false, error: "Failed to create Inbox task list" };
                }
                targetListId = newInbox.id;
            }
        }

        const { data: newTask, error: insertError } = await supabase
            .from("tasks")
            .insert({
                user_id: user.id,
                list_id: targetListId,
                title: data.title.trim(),
                priority: data.priority || "medium",
                due_date: data.due_date || null,
                course_id: data.course_id || null,
                notes: data.notes || null,
            })
            .select("*")
            .single();

        if (insertError) {
            console.error("❌ [TASKS] createTask INSERT FAILED:", insertError.message, insertError.code, insertError.details);
            return { success: false, error: insertError.message };
        }

        console.log("✅ [TASKS] createTask SUCCESS — id:", newTask?.id);
        revalidatePath("/dashboard/tasks");
        return { success: true, task: newTask };
    } catch (error: any) {
        console.error("❌ [TASKS] createTask EXCEPTION:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Toggle task completion — backend for optimistic UI.
 */
export async function toggleTaskComplete(taskId: string, isCompleted: boolean) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated" };
        }

        const { error: updateError } = await supabase
            .from("tasks")
            .update({ is_completed: isCompleted })
            .eq("id", taskId)
            .eq("user_id", user.id);

        if (updateError) {
            console.error("❌ Toggle task error:", updateError);
            return { success: false, error: updateError.message };
        }

        revalidatePath("/dashboard/tasks");
        revalidatePath("/dashboard/calendar");
        return { success: true };
    } catch (error: any) {
        console.error("❌ toggleTaskComplete error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Update task fields (priority, course_id, due_date, description, notes).
 */
export async function updateTask(
    taskId: string,
    fields: {
        title?: string;
        description?: string | null;
        due_date?: string | null;
        priority?: "low" | "medium" | "high";
        course_id?: string | null;
        notes?: string | null;
        position?: number;
    }
) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated" };
        }

        const { error: updateError } = await supabase
            .from("tasks")
            .update(fields)
            .eq("id", taskId)
            .eq("user_id", user.id);

        if (updateError) {
            console.error("❌ Update task error:", updateError);
            return { success: false, error: updateError.message };
        }

        revalidatePath("/dashboard/tasks");
        revalidatePath("/dashboard/calendar");
        return { success: true };
    } catch (error: any) {
        console.error("❌ updateTask error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete a single task.
 */
export async function deleteTask(taskId: string) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated" };
        }

        const { error: deleteError } = await supabase
            .from("tasks")
            .delete()
            .eq("id", taskId)
            .eq("user_id", user.id);

        if (deleteError) {
            console.error("❌ Delete task error:", deleteError);
            return { success: false, error: deleteError.message };
        }

        revalidatePath("/dashboard/tasks");
        revalidatePath("/dashboard/calendar");
        return { success: true };
    } catch (error: any) {
        console.error("❌ deleteTask error:", error);
        return { success: false, error: error.message };
    }
}
