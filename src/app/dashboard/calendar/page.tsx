import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Calendar from "@/components/Calendar";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch Courses + Assessments for the Calendar
  const { data: courses } = await supabase
    .from("courses")
    .select(`
      id, course_code, color,
      assessments (id, name, weight, due_date, is_completed)
    `)
    .eq("user_id", user.id);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
       {/* Simple Header */}
       {/* <div className="mb-6 shrink-0"> */}
         {/* <h1 className="text-3xl font-bold text-white tracking-tight">Master Schedule</h1> */}
         {/* <p className="text-gray-500">Track deadlines. Stay organized.</p> */}
       {/* </div> */}

       {/* Calendar Container - Fills remaining height */}
       <div className="flex-1 min-h-0">
          <Calendar initialData={courses || []} />
       </div>
    </div>
  );
}