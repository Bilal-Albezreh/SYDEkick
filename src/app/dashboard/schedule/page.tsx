import { getScheduleItems } from "@/app/actions/schedule";
import { createClient } from "@/utils/supabase/server";
import ScheduleClient from "./ScheduleClient";

export default async function SchedulePage() {
    // Fetch schedule items with course data
    const scheduleResult = await getScheduleItems();

    // Fetch user's courses for the "Add Class" modal
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let courses: { id: string; course_code: string; course_name: string; color: string;[key: string]: unknown }[] = [];
    if (user) {
        const { data } = await supabase
            .from("courses")
            .select("*")
            .eq("user_id", user.id)
            .order("course_code");
        courses = data || [];
    }

    const scheduleItems = scheduleResult.success ? scheduleResult.data || [] : [];

    return <ScheduleClient initialScheduleItems={scheduleItems} courses={courses} />;
}
