"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getSquadLeaderboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { status: "error", error: "Not logged in", rankings: [], stats: { average: 0, totalMembers: 0 } };

    // 1. Get My Squad ID (Securely)
    const { data: squadIds, error: rpcError } = await supabase.rpc('get_my_squad_ids_secure');

    if (rpcError) {
        console.error("RPC Error:", rpcError);
        return { status: "error", error: "Failed to fetch squad", rankings: [], stats: { average: 0, totalMembers: 0 } };
    }

    const mySquadId = squadIds?.[0];

    if (!mySquadId) {
        return { status: "no_squad", rankings: [], stats: { average: 0, totalMembers: 0 } };
    }

    // 2. Fetch Squad Members (just user_ids and roles)
    const { data: memberships, error: memberError } = await supabase
        .from("squad_memberships")
        .select("user_id, role")
        .eq("squad_id", mySquadId);

    if (memberError) {
        console.error("Membership Error:", memberError);
        return { status: "error", error: "Failed to fetch members", rankings: [], stats: { average: 0, totalMembers: 0 } };
    }

    if (!memberships || memberships.length === 0) {
        return { status: "success", rankings: [], stats: { average: 0, totalMembers: 0 } };
    }

    // 3. Fetch Profiles for all members (separate query to avoid RLS issues)
    const userIds = memberships.map(m => m.user_id);
    const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, display_name, avatar_url, xp, leaderboard_privacy")
        .in("id", userIds);

    if (profileError) {
        console.error("Profile Error:", profileError);
        return { status: "error", error: "Failed to fetch profiles", rankings: [], stats: { average: 0, totalMembers: 0 } };
    }

    // 4. Combine membership data with profile data
    const memberMap = new Map(memberships.map(m => [m.user_id, m]));
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // 5. Process Privacy & Calculate Stats
    let totalXP = 0;
    let activeMemberCount = 0;

    const rankings = Array.from(memberMap.entries())
        .map(([userId, membership]) => {
            const profile = profileMap.get(userId);
            const privacy = profile?.leaderboard_privacy || 'public';
            const isMe = userId === user.id;
            const xp = profile?.xp || 0;

            // Stats Calculation (Include hidden users in average? Yes, usually fair)
            totalXP += xp;
            activeMemberCount++;

            // Privacy Filter: Hidden users vanish (unless it's ME)
            if (privacy === 'hidden' && !isMe) return null;

            // Privacy Mask: Incognito users get masked
            const isMasked = privacy === 'incognito' && !isMe;

            return {
                user_id: userId,
                display_name: isMasked ? "Anonymous Member" : (profile?.display_name || profile?.full_name || "Unknown"),
                avatar_url: isMasked ? null : profile?.avatar_url,
                xp: xp,
                role: membership.role,
                privacy_status: privacy,
                is_me: isMe
            };
        })
        .filter(Boolean) // Remove nulls
        .sort((a: any, b: any) => b.xp - a.xp); // Sort Descending

    const squadAverage = activeMemberCount > 0 ? Math.round(totalXP / activeMemberCount) : 0;

    return {
        status: "success",
        rankings,
        stats: {
            average: squadAverage,
            totalMembers: activeMemberCount
        }
    };
}

export async function cyclePrivacyMode() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data: profile } = await supabase
        .from("profiles")
        .select("leaderboard_privacy")
        .eq("id", user.id)
        .single();

    const current = profile?.leaderboard_privacy || 'public';
    let nextState = 'public';
    if (current === 'public') nextState = 'incognito';
    else if (current === 'incognito') nextState = 'hidden';
    else if (current === 'hidden') nextState = 'public';

    await supabase.from("profiles").update({ leaderboard_privacy: nextState }).eq("id", user.id);

    revalidatePath("/dashboard/leaderboard");
    revalidatePath("/dashboard");

    return { success: true, mode: nextState };
}
