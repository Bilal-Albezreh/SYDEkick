import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getTaskListsWithTasks } from "@/app/actions/tasks";
import TasksEngine from "@/components/dashboard/tasks/TasksEngine";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Parallel fetch: task lists + user courses (for Course Tag selector)
    let taskLists: any[] = [];
    let courses: any[] = [];

    try {
        const [taskData, coursesResult] = await Promise.all([
            getTaskListsWithTasks(),
            supabase
                .from("courses")
                .select("id, course_code, course_name, color")
                .eq("user_id", user.id)
                .order("course_code"),
        ]);
        taskLists = taskData.lists || [];
        courses = coursesResult.data || [];
    } catch {
        // Tables may not exist yet — render empty state
    }

    return (
        <TasksEngine
            initialLists={taskLists}
            courses={courses}
        />
    );
}
