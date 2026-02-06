import { createClient } from "@/utils/supabase/server";
import GradeCalculator from "@/components/GradeCalculator";
import CourseDetailView from "@/components/grades/CourseDetailView";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function GradesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; course?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const params = await searchParams;
  const view = params.view || "calculator"; // Default to calculator view
  const selectedCourseId = params.course;

  // Fetch courses with assessments for calculator
  const { data: courses } = await supabase
    .from("courses")
    .select(`
      id, course_code, course_name, color,
      assessments (id, name, weight, score, total_marks, due_date)
    `)
    .eq("user_id", user.id)
    .order("course_code", { ascending: true });

  // If in manager view and a course is selected, fetch its details
  let selectedCourse = null;
  if (view === "manager" && selectedCourseId) {
    const { data } = await supabase
      .from("courses")
      .select(`
        id, course_code, course_name, color,
        assessments (id, name, weight, score, total_marks, due_date)
      `)
      .eq("id", selectedCourseId)
      .eq("user_id", user.id)
      .single();

    selectedCourse = data;
  }

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="flex flex-col gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Grades & Courses</h1>
          <p className="text-gray-500">
            {view === "calculator"
              ? "Simulate your academic performance and track progress."
              : "Build and manage your course syllabi."}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-gray-800">
          <Link
            href="/dashboard/grades?view=calculator"
            className={`px-6 py-3 font-bold transition-all ${view === "calculator"
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-gray-500 hover:text-gray-300"
              }`}
          >
            Grade Calculator
          </Link>
          <Link
            href="/dashboard/grades?view=manager"
            className={`px-6 py-3 font-bold transition-all ${view === "manager"
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-gray-500 hover:text-gray-300"
              }`}
          >
            Course Manager
          </Link>
        </div>
      </div>

      {/* Content Area */}
      {view === "calculator" ? (
        <GradeCalculator initialData={courses || []} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[700px]">
          {/* Sidebar */}
          <div className="lg:col-span-1 bg-black/30 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-800 bg-white/[0.02]">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Your Courses
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {courses && courses.length > 0 ? (
                courses.map((course) => {
                  const isSelected = selectedCourseId === course.id;
                  return (
                    <Link
                      key={course.id}
                      href={`/dashboard/grades?view=manager&course=${course.id}`}
                      className={`
                        w-full flex items-center justify-between p-3 rounded-lg text-left transition-all border-l-4 group
                        ${isSelected
                          ? "border-cyan-500 bg-gradient-to-r from-cyan-500/10 to-transparent"
                          : "border-transparent hover:bg-white/5 text-gray-400"
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-1.5 h-8 rounded-full shadow-lg"
                          style={{ backgroundColor: course.color }}
                        />
                        <div className="min-w-0">
                          <div className={`font-bold text-sm truncate transition-colors ${isSelected ? "text-white" : "text-gray-300 group-hover:text-white"
                            }`}>
                            {course.course_code}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No courses yet. Add one using the "+" button in the sidebar.
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {selectedCourse ? (
              <CourseDetailView course={selectedCourse} />
            ) : (
              <div className="h-full flex items-center justify-center bg-black/30 backdrop-blur-md border border-white/10 rounded-xl">
                <div className="text-center text-gray-400">
                  <p className="text-lg mb-2">Select a course to view its syllabus</p>
                  <p className="text-sm text-gray-600">or add a new course from the calculator sidebar</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}