import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import DeadlineCalendar from "@/components/DeadlineCalendar";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch assessments with course colors attached
  const { data: assessments } = await supabase
    .from("assessments")
    .select(`
      id, name, due_date, weight, is_completed, score,
      courses (id, course_code, color)
    `)
    .eq("user_id", user.id);

  return (
    <div className="space-y-6 h-full">
      <div className="flex flex-col gap-1">
         <h1 className="text-3xl font-bold text-white tracking-tight">Deadlines</h1>
         <p className="text-gray-500">Track assignments and exams.</p>
      </div>

      <DeadlineCalendar assessments={assessments || []} />
    </div>
  );
}