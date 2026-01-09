import { createClient } from "@/utils/supabase/server";
import { checkApproval } from "@/utils/check-approval";
import CalendarView from "@/components/CalendarView";
import CourseLegend from "@/components/CourseLegend";
import ReminderList from "@/components/ReminderList";

export default async function CalendarPage() {
  const user = await checkApproval();
  const supabase = await createClient();

  // 1. Fetch Assessments (Only valid dates)
  const { data: assessments, error } = await supabase
    .from("assessments")
    .select(`
      id, 
      name, 
      due_date, 
      weight, 
      is_completed, 
      group_tag,
      courses (
        course_code,
        course_name,
        color
      )
    `)
    .not("due_date", "is", null);

  if (error) {
    console.error("Error fetching assessments:", error);
  }

  // 2. Fetch Reminders (FIXED: Added Privacy Filter)
  const { data: reminders } = await supabase
    .from("reminders")
    .select("*")
    .eq("user_id", user.id) // <--- CRITICAL FIX
    .order("created_at", { ascending: true });

  // Process Courses for Legend
  const courseMap = new Map();
  assessments?.forEach((a: any) => {
    if (a.courses) {
      courseMap.set(a.courses.course_code, {
        code: a.courses.course_code,
        name: a.courses.course_name,
        color: a.courses.color
      });
    }
  });
  const uniqueCourses = Array.from(courseMap.values());

  // Process Events
  const events = assessments?.map((a: any) => {
    const dateStr = a.due_date; 
    const dateObj = new Date(dateStr + "T12:00:00"); 

    return {
      id: a.id,
      title: a.name,
      start: dateObj,
      end: dateObj,
      allDay: true,
      resource: {
        courseCode: a.courses?.course_code || "N/A",
        color: a.courses?.color || "#6b7280",
        type: a.group_tag || "Event",
        weight: a.weight,
        isCompleted: a.is_completed 
      }
    };
  }) || [];

  return (
    <main className="min-h-screen bg-[#191919] text-gray-200 pt-6 px-6 pb-0">
      <div className="grid grid-cols-5 gap-6 h-full">
        {/* Calendar / List Area */}
        <div className="col-span-4">
          <CalendarView events={events} />
        </div>

        {/* Sidebar */}
        <div className="col-span-1 hidden lg:flex flex-col h-[calc(100vh-85px)]">
           <div className="flex-none">
              <CourseLegend courses={uniqueCourses} />
           </div>
           <div className="flex-1 overflow-hidden">
              <ReminderList initialReminders={reminders || []} />
           </div>
        </div>
      </div>
    </main>
  );
}