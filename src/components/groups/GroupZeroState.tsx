"use client";

import { useState } from "react";
import { Sparkles, Users, Trophy, ArrowRight, Loader2 } from "lucide-react";
import { joinSquad } from "@/app/actions/squads";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import CreateSquadModal from "@/components/squads/CreateSquadModal";

export default function GroupZeroState() {
    const router = useRouter();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [inviteCode, setInviteCode] = useState("");
    const [isJoining, setIsJoining] = useState(false);

    const handleJoinGroup = async () => {
        if (!inviteCode.trim()) {
            toast.error("Please enter an invite code");
            return;
        }

        setIsJoining(true);
        const result = await joinSquad({ invite_code: inviteCode.toLowerCase().trim() });
        setIsJoining(false);

        if (result.success) {
            toast.success("Welcome to the group!");
            router.refresh();
        } else {
            toast.error(result.error || "Failed to join group");
        }
    };

    return (
        <>
            {/* Hero Container - Clean transparent wrapper */}
            <div className="min-h-screen flex items-center justify-center p-6">
                {/* Main Glass Card */}
                <div className="w-full max-w-2xl bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-12 text-center">
                    {/* Icon */}
                    <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10">
                        <Users className="w-10 h-10 text-indigo-400" />
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl font-bold text-white mb-4 font-heading">
                        Find Your Academic Group.
                    </h1>

                    {/* Subtext */}
                    <p className="text-xl text-white/60 mb-10 max-w-md mx-auto">
                        Sync calendars, crush exams, and climb the ranks together.
                    </p>

                    {/* Features Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-10">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/5 rounded-xl p-4">
                            <Sparkles className="w-6 h-6 text-cyan-400 mb-2 mx-auto" />
                            <p className="text-sm text-white/70">Shared Calendar</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/5 rounded-xl p-4">
                            <Trophy className="w-6 h-6 text-yellow-400 mb-2 mx-auto" />
                            <p className="text-sm text-white/70">Team Leaderboard</p>
                        </div>
                    </div>

                    {/* Primary Action: Create Group */}
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="w-full bg-indigo-500/80 hover:bg-indigo-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-indigo-500/50 mb-6 font-heading"
                    >
                        Create Group
                    </button>

                    {/* Divider */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-4 text-sm text-white/40 bg-black/20">or</span>
                        </div>
                    </div>

                    {/* Secondary Action: Join Group */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Enter Invite Code"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleJoinGroup()}
                            className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-4 pr-14 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/20 transition-all uppercase tracking-wider"
                            maxLength={8}
                        />
                        <button
                            onClick={handleJoinGroup}
                            disabled={isJoining}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-500/80 hover:bg-indigo-500 text-white p-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isJoining ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <ArrowRight className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Create Squad Modal with Curriculum Selection */}
            <CreateSquadModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            />
        </>
    );
}
