import { createClient } from "@/utils/supabase/server";
import { getLeaderboardData, togglePrivacy } from "@/app/actions";
import LeaderboardTable from "@/components/LeaderboardTable";
import LeaderboardPodium from "@/components/LeaderboardPodium";
import SkillRadar from "@/components/SkillRadar";
import { Eye, EyeOff, Info, Medal } from "lucide-react";
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
    <main className="min-h-screen bg-[#111] text-gray-200 p-8">
      
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
           <SkillRadar data={radarData} />

           {/* 2. Specialists (Mini Cards) */}
           <div className="bg-[#191919] rounded-xl border border-gray-800 p-4">
              <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Subject Specialists</h3>
              <div className="space-y-3">
                 {specialists.map((spec: any) => (
                    <div key={spec.subject} className="flex items-center justify-between p-2 rounded-lg bg-[#222] border border-gray-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-amber-900/20 flex items-center justify-center text-amber-500">
                                <Medal className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-gray-300">{spec.subject}</div>
                                <div className="text-[10px] text-gray-500">Held by {spec.holder_id === user.id ? "You" : spec.holder_name}</div>
                            </div>
                        </div>
                        <div className="text-sm font-mono font-bold text-white">{Math.round(spec.best_score)}%</div>
                    </div>
                 ))}
                 {specialists.length === 0 && <div className="text-xs text-gray-600 italic">No data available yet.</div>}
              </div>
           </div>

        </div>

      </div>
    </main>
  );
}