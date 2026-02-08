import { createClient } from "@/utils/supabase/server";
import CourseManagerPanel from "@/components/courses/CourseManagerPanel";
import AddCourseButton from "@/components/dashboard/AddCourseButton";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CoursesPage({
    searchParams,
}: {
    searchParams: Promise<{ course?: string }>;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const params = await searchParams;
    const selectedCourseId = params.course;

    // Fetch all courses
    const { data: courses } = await supabase
        .from("courses")
        .select("id, course_code, course_name, color")
        .eq("user_id", user.id)
        .order("course_code", { ascending: true });

    return (
        <div className="space-y-6">
            {/* Header with Add Course Button */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Course Management</h1>
                    <p className="text-gray-500">
                        Edit course details, customize colors, and manage your curriculum.
                    </p>
                </div>
                <AddCourseButton buttonText="Add Course" />
            </div>

            {/* Empty State - No Courses */}
            {courses && courses.length === 0 ? (
                <div className="h-[700px] flex items-center justify-center bg-black/30 backdrop-blur-md border border-white/10 rounded-xl">
                    <div className="text-center px-8 max-w-md">
                        <div className="mb-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg
                                    className="w-10 h-10 text-cyan-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Your term is ready</h2>
                            <p className="text-gray-400">
                                Add your first course to get started with grade tracking, scheduling, and more.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                const addButton = document.querySelector('[class*="from-cyan-600"]') as HTMLButtonElement;
                                addButton?.click();
                            }}
                            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90 text-white font-bold rounded-lg transition-all shadow-lg shadow-cyan-500/25 animate-pulse"
                        >
                            <Plus className="w-5 h-5" />
                            Add Your First Course
                        </button>
                    </div>
                </div>
            ) : (
                /* Content Area - Two Column Layout */
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[700px]">
                    {/* Sidebar */}
                    <div className="lg:col-span-1 bg-black/30 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-gray-800 bg-white/[0.02]">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                Your Courses
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {courses && courses.length > 0 && (
                                courses.map((course) => {
                                    const isSelected = selectedCourseId === course.id;
                                    return (
                                        <Link
                                            key={course.id}
                                            href={`/dashboard/courses?course=${course.id}`}
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
                            )}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-3">
                        {selectedCourseId ? (
                            <CourseManagerPanel courseId={selectedCourseId} />
                        ) : (
                            <div className="h-full flex items-center justify-center bg-black/30 backdrop-blur-md border border-white/10 rounded-xl">
                                <div className="text-center text-gray-400">
                                    <p className="text-lg mb-2">Select a course to manage</p>
                                    <p className="text-sm text-gray-600">Click a course from the sidebar to edit its details</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
