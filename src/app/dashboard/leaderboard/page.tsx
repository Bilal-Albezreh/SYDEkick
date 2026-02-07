import { createClient } from "@/utils/supabase/server";
import { getSquadLeaderboard, cyclePrivacyMode } from "@/app/actions/leaderboard";
import SquadLeaderboardTable from "@/components/SquadLeaderboardTable";
import LeaderboardPodium from "@/components/LeaderboardPodium";
import { Globe, Ghost, EyeOff, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="text-white p-10">Please login.</div>;

  const { status, rankings, stats } = await getSquadLeaderboard();

  // 1. NO SQUAD STATE
  if (status === "no_squad") {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12 text-white/20" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Join a Squad to Compete</h1>
          <p className="text-gray-400 mb-8">
            Leaderboards are exclusive to Squad members.
          </p>
          <Link href="/dashboard/groups">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-6">
              Find Your Squad
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  // 2. ACTIVE STATE
  const myProfile = rankings?.find((r: any) => r.is_me);
  const privacyStatus = myProfile?.privacy_status || 'public';
  const topThree = (rankings as any).slice(0, 3);

  return (
    <main className="min-h-screen bg-transparent text-gray-200 p-8">
      {/* Header with Privacy Toggle */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Squad Leaderboard</h1>
          <p className="text-gray-400 text-sm flex items-center gap-2">
            <Users className="w-4 h-4" /> Group Average:{" "}
            <span className="text-white font-mono font-bold">{stats.average} XP</span>
          </p>
        </div>
        <form action={async () => { "use server"; await cyclePrivacyMode(); }}>
          <Button
            variant="outline"
            className={`
              border-white/10 text-xs font-medium transition-all min-w-[140px]
              ${privacyStatus === 'public' ? 'bg-[#191919] text-gray-300 hover:text-white hover:bg-gray-800' : ''}
              ${privacyStatus === 'incognito' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20' : ''}
              ${privacyStatus === 'hidden' ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' : ''}
            `}
          >
            {privacyStatus === 'public' && (
              <><Globe className="w-3 h-3 mr-2" /> Public</>
            )}
            {privacyStatus === 'incognito' && (
              <><Ghost className="w-3 h-3 mr-2" /> Incognito</>
            )}
            {privacyStatus === 'hidden' && (
              <><EyeOff className="w-3 h-3 mr-2" /> Hidden</>
            )}
          </Button>
        </form>
      </div>

      {/* Podium */}
      <div className="mb-12">
        <LeaderboardPodium topThree={topThree} currentUserId={user.id} />
      </div>

      {/* Table */}
      <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
        <SquadLeaderboardTable data={rankings as any} currentUserId={user.id} />
      </div>
    </main>
  );
}