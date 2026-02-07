"use client";

import { cn } from "@/lib/utils";
import { Crown, Medal, Users, Trophy } from "lucide-react";

interface SquadMember {
    user_id: string;
    display_name: string;
    avatar_url: string | null;
    xp: number;
    role: string;
    privacy_status: string;
    is_me: boolean;
}

export default function SquadLeaderboardTable({
    data,
    currentUserId
}: {
    data: SquadMember[],
    currentUserId: string
}) {
    return (
        <div className="w-full">
            <div className="p-4 border-b border-white/10 bg-white/5">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Squad Rankings</h3>
            </div>
            <table className="w-full">
                <thead className="bg-black/20 text-xs uppercase text-gray-500">
                    <tr>
                        <th className="px-4 py-3 text-left font-medium tracking-wider">Rank</th>
                        <th className="px-4 py-3 text-left font-medium tracking-wider">Member</th>
                        <th className="px-4 py-3 text-left font-medium tracking-wider">Role</th>
                        <th className="px-4 py-3 text-right font-medium tracking-wider">XP</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                    {data.map((member, index) => (
                        <tr
                            key={member.user_id}
                            className={cn(
                                "transition-all border-b border-white/5",
                                member.is_me
                                    ? "bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:bg-indigo-500/20 relative z-10"
                                    : "hover:bg-white/5"
                            )}
                        >
                            {/* Rank */}
                            <td className="px-4 py-4">
                                <div className="flex items-center">
                                    {index === 0 && <Crown className="w-5 h-5 text-yellow-400" />}
                                    {index === 1 && <Medal className="w-5 h-5 text-gray-400" />}
                                    {index === 2 && <Medal className="w-5 h-5 text-amber-700" />}
                                    {index > 2 && (
                                        <span className="text-gray-500 font-mono text-xs">#{index + 1}</span>
                                    )}
                                </div>
                            </td>

                            {/* Member */}
                            <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                    {/* Avatar */}
                                    <div className={cn(
                                        "w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0",
                                        member.is_me ? "border-2 border-indigo-400 bg-indigo-900/20" : "border border-gray-700 bg-gray-800"
                                    )}>
                                        {member.avatar_url ? (
                                            <img src={member.avatar_url} alt="User" className="w-full h-full object-cover" />
                                        ) : (
                                            <Users className={cn("w-5 h-5", member.is_me ? "text-indigo-400" : "text-gray-500")} />
                                        )}
                                    </div>

                                    {/* Name */}
                                    <div className="flex flex-col">
                                        <span className={cn(
                                            "text-sm",
                                            member.is_me ? "font-bold text-white" : "text-gray-300"
                                        )}>
                                            {member.is_me ? "You" : member.display_name}
                                        </span>
                                        {member.is_me && member.privacy_status !== 'public' && (
                                            <span className="text-[9px] text-gray-500 uppercase tracking-wider">
                                                {member.privacy_status === 'incognito' ? 'Incognito' : 'Hidden'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </td>

                            {/* Role */}
                            <td className="px-4 py-4">
                                <span className={cn(
                                    "text-xs px-2 py-1 rounded",
                                    member.role === 'leader'
                                        ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                        : "bg-white/5 text-gray-400"
                                )}>
                                    {member.role === 'leader' ? '👑 Leader' : 'Member'}
                                </span>
                            </td>

                            {/* XP */}
                            <td className="px-4 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <Trophy className={cn(
                                        "w-4 h-4",
                                        member.is_me ? "text-indigo-400" : "text-yellow-500/50"
                                    )} />
                                    <span className={cn(
                                        "font-mono font-bold text-lg",
                                        member.xp > 1000 ? "text-yellow-400" :
                                            member.xp > 500 ? "text-green-400" : "text-gray-400"
                                    )}>
                                        {member.xp.toLocaleString()}
                                    </span>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {data.length === 0 && (
                <div className="p-8 text-center text-gray-500 text-sm">
                    No members in your squad yet
                </div>
            )}
        </div>
    );
}
