import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Calendar from "@/components/Calendar";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch Courses + Assessments (Existing)
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

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
       <div className="flex-1 min-h-0">
          {/* 3. Pass both to the Component */}
          <Calendar 
            initialData={courses || []} 
            initialInterviews={interviews || []} 
          />
       </div>
    </div>
  );
}