import { createClient } from "@/utils/supabase/server";
import { checkApproval } from "@/utils/check-approval";
import GradeCalculator from "@/components/GradeCalculator";
import { seedUserCourses } from "@/app/actions/seed"; // Ensure this path is correct
import { Button } from "@/components/ui/button";

export default async function GradesPage() {
  const user = await checkApproval();
  const supabase = await createClient();

  const { data: courses, error } = await supabase
    .from("courses")
    .select(`
      id,
      course_code,
      course_name,
      grading_rules,
      color,
      assessments (
        id,
        name,
        weight,
        score,
        total_marks,
        group_tag
      )
    `)
    .eq("user_id", user.id)
    .order("course_code", { ascending: true });

  if (error) {
    console.error("Error fetching grades:", error);
    return <div className="text-red-500 p-8">Error loading grades.</div>;
  }

  return (
    <main className="min-h-screen p-8 bg-[#111] text-gray-200">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">Grade Calculator</h1>
          <p className="text-gray-400">Manage your performance across all courses.</p>
        </div>
        
        {courses && courses.length > 0 ? (
          <GradeCalculator initialData={courses as any} />
        ) : (
          <div className="text-center py-20 bg-[#191919] rounded-lg border border-dashed border-gray-800 flex flex-col items-center gap-4">
            <p className="text-gray-500">No courses found in your account.</p>
            
            {/* --- FIX APPLIED HERE --- */}
            <form action={seedUserCourses}>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8">
                Setup SYDE 2A Dashboard
              </Button>
            </form>
            
            <p className="text-xs text-gray-600">This will generate your personal tracking data for the term.</p>
          </div>
        )}
      </div>
    </main>
  );
}