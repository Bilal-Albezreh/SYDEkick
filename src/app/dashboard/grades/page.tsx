import { createClient } from "@/utils/supabase/server";
import GradeCalculator from "@/components/GradeCalculator";
import TermSelector from "@/components/TermSelector";
import { getTerms } from "@/app/actions/terms";
import { redirect } from "next/navigation";

export default async function GradesPage({
  searchParams,
}: {
  searchParams: Promise<{ term_id?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const params = await searchParams;

  // Fetch user's terms
  const termsResult = await getTerms();
  const terms = termsResult.data || [];

  // Determine active term_id: URL param or fallback to current term
  let activeTermId = params.term_id;
  if (!activeTermId) {
    const currentTerm = terms.find(t => t.is_current);
    activeTermId = currentTerm?.id;
  }

  // Fetch courses with assessments for calculator, filtered by term
  const coursesQuery = supabase
    .from("courses")
    .select(`
      id, course_code, course_name, color, credits,
      assessments (id, name, weight, score, total_marks, due_date)
    `)
    .eq("user_id", user.id)
    .order("course_code", { ascending: true });

  if (activeTermId) {
    coursesQuery.eq("term_id", activeTermId);
  }

  const { data: courses } = await coursesQuery;

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Academic Performance</h1>
            <p className="text-gray-500">
              Simulate your academic performance and track progress.
            </p>
          </div>

          {terms.length > 0 && activeTermId && (
            <TermSelector terms={terms} currentTermId={activeTermId} />
          )}
        </div>
      </div>

      {/* Grade Calculator — flex-1 to fill remaining space */}
      <div className="flex-1 min-h-0">
        <GradeCalculator initialData={courses || []} />
      </div>
    </div>
  );
}
