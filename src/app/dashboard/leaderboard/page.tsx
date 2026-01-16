import { createClient } from "@/utils/supabase/server";
import { getLeaderboardData, togglePrivacy } from "@/app/actions";
import LeaderboardTable from "@/components/LeaderboardTable";
import LeaderboardPodium from "@/components/LeaderboardPodium";
import SkillRadar from "@/components/SkillRadar";
import { Eye, EyeOff, Info, Medal, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="text-white p-10">Please login.</div>;

  // 1. Fetch the NEW heavy data
  const { rankings, radarData, specialists } = await getLeaderboardData();

  // Find user data
  const myProfile = rankings?.find((r: any) => r.user_id === user.id);
  const isAnonymous = myProfile?.is_anonymous || false;
  const topThree = rankings.slice(0, 3);

  return (
    <main className="min-h-screen bg-transparent text-gray-200 p-8">

      {/* HEADER */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Social Leaderboard</h1>
          <p className="text-gray-400 text-sm flex items-center gap-2">
            <Info className="w-4 h-4" /> Compare your velocity with the cohort.
          </p>
        </div>

        <form action={async () => { "use server"; await togglePrivacy(!isAnonymous); }}>
          <Button variant="outline" className="bg-[#191919] border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800">
            {isAnonymous ? <EyeOff className="w-4 h-4 mr-2 text-yellow-500" /> : <Eye className="w-4 h-4 mr-2" />}
            {isAnonymous ? "You are Hidden" : "Visible to Class"}
          </Button>
        </form>
      </div>

      {/* ROW 1: PODIUM (Center Stage) */}
      <div className="mb-12">
        <LeaderboardPodium topThree={topThree} currentUserId={user.id} />
      </div>

      {/* ROW 2: DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT COL: TABLE (Takes 2 spots) */}
        <div className="lg:col-span-2">
          <LeaderboardTable data={rankings} currentUserId={user.id} />
        </div>

        {/* RIGHT COL: ANALYTICS (Takes 1 spot) */}
        <div className="lg:col-span-1 space-y-6">

          {/* 1. Radar Chart */}
          <div className="bg-black/60 backdrop-blur-2xl rounded-xl border border-white/10 p-6 shadow-2xl">
            <SkillRadar data={radarData} />
          </div>

          {/* 2. Specialists (Mini Cards) */}
          {/* 2. Specialists (Mini Cards) */}
          <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 p-6">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Medal className="w-4 h-4 text-yellow-500" /> Subject Specialists
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {specialists.map((spec: any) => (
                <div key={spec.subject} className="flex flex-col justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{spec.subject}</div>
                    <Flame className="w-3 h-3 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white truncate">{spec.holder_id === user.id ? "You" : spec.holder_name?.split(' ')[0]}</div>
                    <div className="text-xs font-mono text-gray-400 mt-0.5">{Math.round(spec.best_score)}%</div>
                  </div>
                </div>
              ))}
              {specialists.length === 0 && <div className="col-span-2 text-xs text-gray-600 italic text-center py-4">No data available yet.</div>}
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}