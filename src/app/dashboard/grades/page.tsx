import { createClient } from "@/utils/supabase/server";
import GradeCalculator from "@/components/GradeCalculator";
import { redirect } from "next/navigation";

export default async function GradesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect("/login");

  const { data: courses } = await supabase
    .from("courses")
    .select(`
      id, course_code, course_name, color,
      assessments (id, name, weight, score, total_marks)
    `)
    .eq("user_id", user.id)
    .order("course_code", { ascending: true });

  return (
    <div className="space-y-6">
       <div className="flex flex-col gap-1 mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Grade Calculator</h1>
          <p className="text-gray-500">Simulate your academic performance.</p>
       </div>
       
       <GradeCalculator initialData={courses || []} />
    </div>
  );
}