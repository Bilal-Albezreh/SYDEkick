import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import DashboardGrid from "@/components/DashboardWidgets";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  // 1. Fetch User Data (Courses + Assessments)
  const { data: courses } = await supabase
    .from("courses")
    .select(`
      id, course_code, course_name, color,
      assessments (id, name, weight, score, due_date, is_completed)
    `)
    .eq("user_id", user.id);

  // 2. Fetch Chat Messages (Recent 50)
  const { data: messages } = await supabase
    .from("messages")
    .select(`
      id, content, created_at, user_id,
      profiles (full_name, is_anonymous, avatar_url)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  // 3. Leaderboard Logic
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, is_anonymous")
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

  // 4. Current User Profile
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
        <p className="text-gray-500">Welcome back, {currentUser.name.split(' ')[0]}.</p>
      </div>

      <DashboardGrid 
          courses={courses || []} 
          messages={messages || []}
          rankData={{ myRank: myRankData, topRank: rankedUsers as any }}
          currentUser={currentUser}
      />
    </div>
  );
}