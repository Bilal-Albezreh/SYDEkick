import { createClient } from "@/utils/supabase/server";
import CourseManagerPanel from "@/components/courses/CourseManagerPanel";
import AddCourseButton from "@/components/dashboard/AddCourseButton";
import SyllabusImportButton from "@/components/dashboard/SyllabusImportButton";
import EmptyCoursesState from "@/components/courses/EmptyCoursesState";
import TermSelector from "@/components/TermSelector";
import { getTerms } from "@/app/actions/terms";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CoursesPage({
    searchParams,
}: {
    searchParams: Promise<{ course?: string; term_id?: string }>;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const params = await searchParams;
    const selectedCourseId = params.course;

    // Fetch user's terms
    const termsResult = await getTerms();
    const terms = termsResult.data || [];

    // Determine active term_id: URL param or fallback to current term
    let activeTermId = params.term_id;
    if (!activeTermId) {
        const currentTerm = terms.find(t => t.is_current);
        activeTermId = currentTerm?.id;
    }

    // Fetch courses filtered by term_id
    const coursesQuery = supabase
        .from("courses")
        .select("id, course_code, course_name, color, credits, term_id")
        .eq("user_id", user.id)
        .order("course_code", { ascending: true });

    // Only filter by term if we have a valid term_id
    if (activeTermId) {
        coursesQuery.eq("term_id", activeTermId);
    }

    const { data: courses } = await coursesQuery;

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
                <div className="flex items-center gap-3">
                    {terms.length > 0 && activeTermId && (
                        <TermSelector terms={terms} currentTermId={activeTermId} />
                    )}
                    <SyllabusImportButton />
                    <AddCourseButton buttonText="Add Course" />
                </div>
            </div>

            {/* Empty State - No Courses */}
            {courses && courses.length === 0 ? (
                <EmptyCoursesState />
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
