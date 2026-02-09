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

  // Only filter by term if we have a valid term_id
  if (activeTermId) {
    coursesQuery.eq("term_id", activeTermId);
  }

  const { data: courses } = await coursesQuery;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-start justify-between">
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

      {/* Grade Calculator */}
      <GradeCalculator initialData={courses || []} />
    </div>
  );
}