"use client";

import { useState } from "react";
import { Sparkles, Users, Trophy, ArrowRight, Loader2 } from "lucide-react";
import { createSquad, joinSquad } from "@/app/actions/squads";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SquadZeroState() {
    const router = useRouter();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [inviteCode, setInviteCode] = useState("");
    const [isJoining, setIsJoining] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Create Squad Form State
    const [squadName, setSquadName] = useState("");
    const [description, setDescription] = useState("");
    const [program, setProgram] = useState("");
    const [term, setTerm] = useState("");

    const handleJoinSquad = async () => {
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

    const handleCreateSquad = async () => {
        if (!squadName.trim()) {
            toast.error("Squad name is required");
            return;
        }

        setIsCreating(true);
        const result = await createSquad({
            name: squadName.trim(),
            description: description.trim() || null,
            program: program.trim() || null,
            term: term.trim() || null,
            is_official: false,
        });
        setIsCreating(false);

        if (result.success) {
            toast.success("Group created! Share your invite code with your team.");
            setShowCreateModal(false);
            router.refresh();
        } else {
            toast.error(result.error || "Failed to create group");
        }
    };

    return (
        <>
            {/* Hero Container */}
            <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Mesh Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/40 via-black to-purple-950/40" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.15),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.1),transparent_50%)]" />

                {/* Main Glass Card */}
                <div className="relative z-10 w-full max-w-2xl mx-4">
                    <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-12 text-center">
                        {/* Icon */}
                        <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10">
                            <Users className="w-10 h-10 text-indigo-400" />
                        </div>

                        {/* Headline */}
                        <h1 className="text-5xl font-bold text-white mb-4 font-heading">
                            Find Your Group.
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
                                onKeyDown={(e) => e.key === 'Enter' && handleJoinSquad()}
                                className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-4 pr-14 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/20 transition-all uppercase tracking-wider"
                                maxLength={8}
                            />
                            <button
                                onClick={handleJoinSquad}
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
            </div>

            {/* Create Squad Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="relative w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8">
                        {/* Close Button */}
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                        >
                            ✕
                        </button>

                        {/* Modal Header */}
                        <h2 className="text-3xl font-bold text-white mb-6 font-heading">
                            Create Your Group
                        </h2>

                        {/* Form */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-white/60 mb-2">Group Name *</label>
                                <input
                                    type="text"
                                    value={squadName}
                                    onChange={(e) => setSquadName(e.target.value)}
                                    placeholder="e.g., SYDE 2B Warriors"
                                    className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/20"
                                    maxLength={50}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-white/60 mb-2">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="What's your group about?"
                                    className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/20 resize-none"
                                    rows={3}
                                    maxLength={500}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-white/60 mb-2">Program</label>
                                    <input
                                        type="text"
                                        value={program}
                                        onChange={(e) => setProgram(e.target.value)}
                                        placeholder="e.g., SYDE"
                                        className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/20"
                                        maxLength={100}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-white/60 mb-2">Term</label>
                                    <input
                                        type="text"
                                        value={term}
                                        onChange={(e) => setTerm(e.target.value)}
                                        placeholder="e.g., 2B"
                                        className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/20"
                                        maxLength={50}
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl transition-all font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateSquad}
                                    disabled={isCreating || !squadName.trim()}
                                    className="flex-1 bg-indigo-500/80 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        "Create Group"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
