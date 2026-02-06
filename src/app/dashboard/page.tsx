import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import DashboardGrid from "@/components/DashboardWidgets";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ==========================================
  // STEP 1: GET THE TRUE ACTIVE TERM
  // ==========================================
  // First, check if user has a preference set
  const { data: userPreference } = await supabase
    .from("preferences")
    .select("active_term_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let activeTerm = null;

  if (userPreference?.active_term_id) {
    // Use the user's preferred term
    const { data: preferredTerm } = await supabase
      .from("terms")
      .select("id, label, season, start_date")
      .eq("id", userPreference.active_term_id)
      .single();
    activeTerm = preferredTerm;
  }

  // If no preference or preferred term not found, use smart selection
  if (!activeTerm) {
    const { data: allTerms } = await supabase
      .from("terms")
      .select("id, label, season, start_date")
      .eq("user_id", user.id)
      .order("start_date", { ascending: false });

    if (allTerms && allTerms.length > 0) {
      // Prioritize terms that are NOT named "Personal" or have actual courses
      const { data: termsWithCourses } = await supabase
        .from("courses")
        .select("term_id")
        .eq("user_id", user.id);

      const termIdsWithCourses = new Set(termsWithCourses?.map(c => c.term_id) || []);

      // Find the most recent term that has courses
      const academicTerm = allTerms.find(t =>
        termIdsWithCourses.has(t.id) && !t.label.toLowerCase().includes("personal")
      );

      // Use academic term if found, otherwise use most recent term
      activeTerm = academicTerm || allTerms[0];
    }
  }

  // Fallback: If still no term, redirect to onboarding
  if (!activeTerm) {
    redirect("/");
  }

  console.log("🔍 DEBUG: Active Term Selected:", activeTerm);

  // ==========================================
  // STEP 2: FETCH COURSES FOR THAT TERM
  // ==========================================
  const { data: rawCourses, error: coursesError } = await supabase
    .from("courses")
    .select(`
      id,
      course_code,
      course_name,
      color,
      assessments(id, name, weight, score, due_date, is_completed)
    `)
    .eq("user_id", user.id)
    .eq("term_id", activeTerm.id);

  console.log("🔍 DEBUG: Courses fetched:", rawCourses?.length || 0);
  console.log("🔍 DEBUG: Courses data:", rawCourses);
  if (coursesError) console.error("❌ Courses error:", coursesError);

  // ==========================================
  // STEP 3: FETCH UPCOMING ASSESSMENTS (NEXT 7 DAYS)
  // ==========================================
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const { data: upcomingAssessments } = await supabase
    .from("assessments")
    .select(`
      id,
      name,
      due_date,
      weight,
      is_completed,
      courses!inner(course_code, color)
    `)
    .eq("user_id", user.id)
    .gte("due_date", today.toISOString())
    .lte("due_date", nextWeek.toISOString())
    .order("due_date", { ascending: true });

  // Fetch Personal Tasks for "Next 7 Days" widget
  const { data: upcomingPersonalTasks } = await supabase
    .from("personal_tasks")
    .select("id, title, due_date, is_completed, type, description")
    .eq("user_id", user.id)
    .eq("is_completed", false)
    .gte("due_date", today.toISOString())
    .lte("due_date", nextWeek.toISOString())
    .order("due_date", { ascending: true });

  // ==========================================
  // STEP 4: DATA MAPPING & STANDARDIZATION
  // ==========================================

  // Map courses with calculated progress
  const mappedCourses = (rawCourses || []).map(course => {
    const assessments = course.assessments || [];
    const completed = assessments.filter(a => a.is_completed && a.score !== null);
    const totalWeight = assessments.reduce((sum, a) => sum + (a.weight || 0), 0);
    const completedWeight = completed.reduce((sum, a) => sum + (a.weight || 0), 0);
    const earnedPoints = completed.reduce((sum, a) => sum + ((a.score || 0) / 100) * (a.weight || 0), 0);
    const percentage = completedWeight > 0 ? (earnedPoints / completedWeight) * 100 : 0;

    return {
      id: course.id,
      course_code: course.course_code,
      name: course.course_name,  // Map course_name to name for widget compatibility
      color: course.color,
      assessments: course.assessments,
      totalWeight,
      completedWeight,
      percentage
    };
  });

  // Map upcoming assessments with course data
  const mappedUpcoming = [
    ...(upcomingAssessments || []).map(a => ({
      id: a.id,
      name: a.name,
      due_date: a.due_date,
      is_completed: a.is_completed,
      courses: {
        course_code: (a.courses as any)?.course_code || "Unknown",
        color: (a.courses as any)?.color || "#888888"
      },
      type: "assessment"
    })),
    ...(upcomingPersonalTasks || []).map(t => ({
      id: `personal-${t.id}`,
      name: t.title,
      due_date: t.due_date,
      is_completed: t.is_completed,
      courses: {
        course_code: "PERSONAL",
        color: "#888888"
      },
      type: t.type || "personal"
    }))
  ].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  console.log("🔍 DEBUG: Mapped Courses:", mappedCourses);
  console.log("🔍 DEBUG: Mapped Upcoming:", mappedUpcoming.length);

  // ==========================================
  // LEADERBOARD & CHAT DATA (Unchanged)
  // ==========================================
  const { data: messages } = await supabase
    .from("messages")
    .select(`
      id, content, created_at, user_id,
      profiles(full_name, is_anonymous, avatar_url)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, is_anonymous, avatar_url")
    .eq("is_participating", true);

  const { data: allAssessments } = await supabase
    .from("assessments")
    .select("user_id, score, weight")
    .not("score", "is", null);

  const userAverages = new Map<string, { earned: number; attempted: number }>();
  allAssessments?.forEach((a) => {
    if (!userAverages.has(a.user_id)) userAverages.set(a.user_id, { earned: 0, attempted: 0 });
    const u = userAverages.get(a.user_id)!;
    u.earned += (a.score / 100) * a.weight;
    u.attempted += a.weight;
  });

  const rankedUsers = Array.from(userAverages.entries())
    .map(([uid, stats]) => {
      const avg = stats.attempted === 0 ? 0 : (stats.earned / stats.attempted) * 100;
      const profile = allProfiles?.find((p) => p.id === uid);
      if (!profile) return null;
      return {
        user_id: uid,
        current_average: avg,
        full_name: profile.full_name || "Unknown",
        is_anonymous: profile.is_anonymous || false,
        avatar_url: profile.avatar_url,
      };
    })
    .filter((u) => u !== null)
    .sort((a, b) => b!.current_average - a!.current_average);

  const myIndex = rankedUsers.findIndex((u) => u?.user_id === user.id);
  const myRankData = myIndex !== -1 && rankedUsers[myIndex] ? {
    rank: myIndex + 1,
    trend: 0,
    current_average: rankedUsers[myIndex]!.current_average,
    totalStudents: rankedUsers.length,
    gap: myIndex > 0 ? (rankedUsers[myIndex - 1]!.current_average - rankedUsers[myIndex]!.current_average) : 0,
    gapMessage: "to overtake",
    user_id: user.id
  } : null;

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("avatar_url, full_name")
    .eq("id", user.id)
    .single();

  const currentUser = {
    id: user.id,
    name: myProfile?.full_name || user.user_metadata.full_name || "Agent",
    avatar: myProfile?.avatar_url || user.user_metadata.avatar_url || null,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Command Center</h1>
        <p className="text-gray-500">
          {activeTerm.season} - {activeTerm.label} · Welcome back, {currentUser.name.split(' ')[0]}.
        </p>
      </div>

      <DashboardGrid
        courses={mappedCourses}
        upcomingAssessments={mappedUpcoming}
        messages={messages || []}
        rankData={{ myRank: myRankData, topRank: rankedUsers as any }}
        currentUser={currentUser}
      />
    </div>
  );
}