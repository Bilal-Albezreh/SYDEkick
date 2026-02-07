import { getSquadLeaderboard } from "@/app/actions/leaderboard";
import Link from "next/link";
import { ArrowRight, Trophy, Users, Crown, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function LeaderboardWidget() {
    const { status, rankings, stats } = await getSquadLeaderboard();

    // Widget: No Squad State
    if (status === "no_squad") {
        return (
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6 h-full flex flex-col items-center justify-center text-center">
                <Trophy className="w-8 h-8 text-white/20 mb-2" />
                <p className="text-sm text-gray-400 mb-4">Join a squad to see rankings.</p>
                <Link href="/dashboard/groups" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    Find Squad <ArrowRight className="w-3 h-3" />
                </Link>
            </div>
        );
    }

    // Widget: Active State (Top 5 only)
    return (
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Squad Ranking</h3>
                    <p className="text-xs text-white/40 mt-0.5 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Avg: {stats.average} XP
                    </p>
                </div>
                <Link href="/dashboard/leaderboard" className="text-xs text-white/50 hover:text-white">
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
                {rankings.slice(0, 5).map((user: any, i: number) => (
                    <div
                        key={user.user_id}
                        className={cn(
                            "flex items-center justify-between p-2.5 rounded-lg transition-all",
                            user.is_me ? 'bg-indigo-500/10 border border-indigo-500/20 shadow-lg' : 'bg-white/5 hover:bg-white/10'
                        )}
                    >
                        <div className="flex items-center gap-3">
                            {/* Rank Badge */}
                            <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                                i === 0 ? 'bg-yellow-500 text-black' :
                                    i === 1 ? 'bg-gray-400 text-black' :
                                        i === 2 ? 'bg-amber-700 text-white' :
                                            'bg-white/10 text-white'
                            )}>
                                {i === 0 && <Crown className="w-3 h-3" />}
                                {i === 1 && <Medal className="w-3 h-3" />}
                                {i === 2 && <Medal className="w-3 h-3" />}
                                {i > 2 && (i + 1)}
                            </div>

                            {/* Avatar */}
                            <div className={cn(
                                "w-7 h-7 rounded-full flex items-center justify-center shrink-0 overflow-hidden",
                                user.is_me ? 'border-2 border-indigo-400' : 'border border-white/10 bg-white/5'
                            )}>
                                {user.avatar_url ? (
                                    <img
                                        src={user.avatar_url}
                                        alt={user.display_name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Users className={cn("w-4 h-4", user.is_me ? "text-indigo-300" : "text-white/30")} />
                                )}
                            </div>

                            {/* Name */}
                            <span className={cn(
                                "text-sm truncate max-w-[100px]",
                                user.is_me ? 'text-indigo-300 font-bold' : 'text-gray-300'
                            )}>
                                {user.is_me ? 'You' : user.display_name}
                            </span>
                        </div>

                        {/* XP */}
                        <span className={cn(
                            "text-xs font-mono font-bold",
                            user.is_me ? 'text-indigo-300' : 'text-gray-500'
                        )}>
                            {user.xp} XP
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
