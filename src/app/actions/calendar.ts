"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

async function validateUser() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    return { supabase, user };
}

export async function createPersonalTask(data: {
    title: string;
    description?: string;
    due_date: string; // ISO string
    type: "personal" | "course_work";
    course_id?: string;
    course_code?: string; // For UI update if needed, but DB checks id
}) {
    const { supabase, user } = await validateUser();

    const { error } = await supabase.from("personal_tasks").insert({
        user_id: user.id,
        title: data.title,
        description: data.description,
        due_date: data.due_date,
        type: data.type,
        course_id: data.course_id || null,
        is_completed: false
    });

    if (error) {
        console.error("Error creating personal task:", error);
        throw new Error("Failed to create task");
    }

    revalidatePath("/dashboard/calendar");
    revalidatePath("/dashboard");
}

export async function togglePersonalTaskCompletion(id: string, isCompleted: boolean) {
    const { supabase, user } = await validateUser();

    const { error } = await supabase
        .from("personal_tasks")
        .update({ is_completed: isCompleted })
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) throw new Error("Failed to update task");

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/calendar");
}

export async function deletePersonalTask(id: string) {
    const { supabase, user } = await validateUser();

    const { error } = await supabase
        .from("personal_tasks")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) throw new Error("Failed to delete task");

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/calendar");
}
