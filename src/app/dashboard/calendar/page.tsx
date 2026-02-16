import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Calendar from "@/components/Calendar";
import CalendarSyncButton from "@/components/dashboard/CalendarSyncButton";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch Courses + Assessments with Course Color Join
  const { data: courses } = await supabase
    .from("courses")
    .select(`
      id, course_code, color,
      assessments (id, name, weight, due_date, is_completed)
    `)
    .eq("user_id", user.id);

  // 2. Fetch Interviews (MISSING LINK)
  const { data: interviews } = await supabase
    .from("interviews")
    .select("*")
    .eq("user_id", user.id);

  // 3. Fetch Personal Tasks [NEW]
  const { data: personalTasks } = await supabase
    .from("personal_tasks")
    .select("*")
    .eq("user_id", user.id);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-1 min-h-0 flex flex-col gap-4">
        <div className="flex justify-between items-center px-1">
          <h1 className="text-2xl font-bold text-white">Calendar</h1>
          <CalendarSyncButton userId={user.id} />
        </div>

        {/* 3. Pass both to the Component */}
        <Calendar
          initialData={courses || []}
          initialInterviews={interviews || []}
          initialPersonalTasks={personalTasks || []}
        />
      </div>
    </div>
  );
}