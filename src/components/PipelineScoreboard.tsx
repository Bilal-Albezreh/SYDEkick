"use client";

import { Briefcase, Frown, Ghost, Trophy, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PipelineScoreboard({ stats }: { stats: any }) {
    const pending = Number(stats?.pending_count || 0);
    const rejected = Number(stats?.rejected_count || 0);
    const ghosted = Number(stats?.ghosted_count || 0);
    const interviews = Number(stats?.interview_count || 0);
    const offers = Number(stats?.offer_count || 0);
    const total = pending + rejected + ghosted + interviews;

    return (
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col gap-3 h-full overflow-y-auto shadow-xl">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Pipeline Stats</h3>

            <StatRow label="Total Applied" value={total} icon={Briefcase} color="text-blue-400" bg="bg-white/5" border="border-white/5" />
            <StatRow label="Active Pending" value={pending} icon={Briefcase} color="text-yellow-400" bg="bg-white/5" border="border-white/5" />
            <StatRow label="Interviews" value={interviews} icon={Trophy} color="text-emerald-400" bg="bg-white/5" border="border-white/5" />
            <StatRow label="Offers" value={offers} icon={CheckCircle2} color="text-indigo-400" bg="bg-white/5" border="border-white/5" />
            <StatRow label="Rejected" value={rejected} icon={Frown} color="text-red-400" bg="bg-white/5" border="border-white/5" />
            <StatRow label="Ghosted" value={ghosted} icon={Ghost} color="text-gray-400" bg="bg-white/5" border="border-white/5" />
        </div>
    );
}

function StatRow({ label, value, icon: Icon, color, bg, border }: any) {
    return (
        <div className={cn("flex items-center justify-between p-3 rounded-xl border transition-all hover:bg-white/5", bg, border)}>
            <div className="flex items-center gap-3">
                <div className={cn("p-1.5 rounded-lg bg-black/40", color)}>
                    <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-gray-300">{label}</span>
            </div>
            <span className={cn("text-lg font-black", color)}>{value}</span>
        </div>
    )
}