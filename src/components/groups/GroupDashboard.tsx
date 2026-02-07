"use client";

import { useState } from "react";
import {
    Copy,
    Crown,
    LogOut,
    Trash2,
    Send,
    Users,
    User,
    Check,
    MessageCircle
} from "lucide-react";
import { leaveSquad } from "@/app/actions/squads";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface GroupMember {
    id: string;
    name?: string;
    email?: string;
    role: 'leader' | 'member';
    joined_at: string;
}

interface Group {
    id: string;
    name: string;
    description?: string;
    program?: string;
    term?: string;
    invite_code: string;
    my_role: 'leader' | 'member';
    members?: GroupMember[];
}

interface GroupDashboardProps {
    group: Group;
}

export default function GroupDashboard({ group }: GroupDashboardProps) {
    const router = useRouter();
    const [copied, setCopied] = useState(false);
    const [chatMessage, setChatMessage] = useState("");
    const [isLeaving, setIsLeaving] = useState(false);

    const isLeader = group.my_role === 'leader';

    // Mock members for now (will be fetched from squad_memberships)
    const mockMembers: GroupMember[] = [
        { id: '1', name: 'You', email: 'you@example.com', role: group.my_role, joined_at: new Date().toISOString() },
        { id: '2', name: 'Alex Chen', email: 'alex@example.com', role: 'member', joined_at: new Date().toISOString() },
        { id: '3', name: 'Jordan Smith', email: 'jordan@example.com', role: 'member', joined_at: new Date().toISOString() },
    ];

    const members = group.members || mockMembers;

    const handleCopyInviteCode = () => {
        navigator.clipboard.writeText(group.invite_code);
        setCopied(true);
        toast.success("Invite code copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLeaveGroup = async () => {
        if (!confirm("Are you sure you want to leave this group?")) return;

        setIsLeaving(true);
        const result = await leaveSquad(group.id);
        setIsLeaving(false);

        if (result.success) {
            toast.success("You've left the group");
            router.refresh();
        } else {
            toast.error(result.error || "Failed to leave group");
        }
    };

    const handleKickMember = (memberId: string, memberName: string) => {
        // TODO: Implement kick member action
        toast.info(`Kick feature coming soon for ${memberName}`);
    };

    const handleSendMessage = () => {
        if (!chatMessage.trim()) return;
        // TODO: Implement real-time chat
        toast.info("Chat feature coming soon!");
        setChatMessage("");
    };

    return (
        <div className="p-6">
            <div className="max-w-7xl mx-auto">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2 font-heading flex items-center gap-3">
                        <Users className="w-8 h-8 text-indigo-400" />
                        {group.name}
                    </h1>
                    <div className="flex items-center gap-2">
                        {group.program && (
                            <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-sm text-indigo-300 font-medium">
                                {group.program}
                            </span>
                        )}
                        {group.term && (
                            <span className="px-3 py-1 bg-purple-500/20 border border-purple-400/30 rounded-full text-sm text-purple-300 font-medium">
                                {group.term}
                            </span>
                        )}
                        {isLeader && (
                            <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-400/30 rounded-full text-sm text-yellow-300 font-medium flex items-center gap-1.5">
                                <Crown className="w-3.5 h-3.5" />
                                Leader
                            </span>
                        )}
                    </div>
                </div>

                {/* Split View Layout with proper height */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
                    {/* Left Panel: Command Center */}
                    <div className="lg:col-span-2 space-y-6 overflow-y-auto">
                        {/* Invite Code Card (Leader Only) */}
                        {isLeader && (
                            <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-lg font-semibold text-white font-heading">Invite Code</h2>
                                    <Crown className="w-5 h-5 text-yellow-400" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-400/30 rounded-xl px-6 py-4">
                                        <p className="text-2xl font-bold text-white tracking-widest font-mono">
                                            {group.invite_code.toUpperCase()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleCopyInviteCode}
                                        className="bg-indigo-500/80 hover:bg-indigo-500 text-white p-4 rounded-xl transition-all"
                                    >
                                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                    </button>
                                </div>
                                <p className="text-sm text-white/40 mt-3">Share this code with your group members</p>
                            </div>
                        )}

                        {/* Group Description */}
                        {group.description && (
                            <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
                                <h2 className="text-lg font-semibold text-white mb-3 font-heading">About</h2>
                                <p className="text-white/70">{group.description}</p>
                            </div>
                        )}

                        {/* Roster Card */}
                        <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4 font-heading flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-400" />
                                Group Roster ({members.length})
                            </h2>

                            {/* Members Table */}
                            <div className="space-y-2">
                                {members.map((member) => (
                                    <div
                                        key={member.id}
                                        className="group flex items-center justify-between p-3 bg-white/5 backdrop-blur-sm border border-white/5 rounded-xl hover:bg-white/10 transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Avatar */}
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center">
                                                <User className="w-5 h-5 text-white" />
                                            </div>

                                            {/* Info */}
                                            <div>
                                                <p className="text-white font-medium">{member.name || member.email}</p>
                                                <p className="text-xs text-white/40">{member.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Role Badge */}
                                            {member.role === 'leader' ? (
                                                <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-400/30 rounded-full text-xs text-yellow-300 font-medium flex items-center gap-1.5">
                                                    <Crown className="w-3 h-3" />
                                                    Leader
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/50">
                                                    Member
                                                </span>
                                            )}

                                            {/* Kick Button (Leader only, for non-leaders) */}
                                            {isLeader && member.role !== 'leader' && (
                                                <button
                                                    onClick={() => handleKickMember(member.id, member.name || 'member')}
                                                    className="opacity-0 group-hover:opacity-100 text-red-400/70 hover:text-red-400 transition-all p-2 rounded-lg hover:bg-red-500/10"
                                                    title="Kick member"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Leave Group Button (For non-leaders) */}
                            {!isLeader && (
                                <button
                                    onClick={handleLeaveGroup}
                                    disabled={isLeaving}
                                    className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-400/20 text-red-400/70 hover:text-red-400 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Leave Group
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Group Chat Preview */}
                    <div className="lg:col-span-1">
                        <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl h-full flex flex-col">
                            {/* Chat Header */}
                            <div className="p-4 border-b border-white/10">
                                <h2 className="text-lg font-semibold text-white font-heading flex items-center gap-2">
                                    <MessageCircle className="w-5 h-5 text-cyan-400" />
                                    Group Chat
                                </h2>
                                <p className="text-xs text-white/40 mt-1">Real-time messaging</p>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 p-4 overflow-y-auto flex flex-col-reverse">
                                {/* Placeholder */}
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <MessageCircle className="w-12 h-12 text-white/20 mx-auto mb-3" />
                                        <p className="text-white/40 text-sm">Group Chat initialized...</p>
                                        <p className="text-white/20 text-xs mt-1">Messages will appear here</p>
                                    </div>
                                </div>
                            </div>

                            {/* Chat Input */}
                            <div className="p-4 border-t border-white/10">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Send a message..."
                                        value={chatMessage}
                                        onChange={(e) => setChatMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-cyan-500/80 hover:bg-cyan-500 text-white p-2 rounded-lg transition-all"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
