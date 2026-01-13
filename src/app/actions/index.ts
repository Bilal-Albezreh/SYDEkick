"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// --- HELPER: SECURITY BARRIER ---
// Validates Auth AND Approval Status (Optional)
// Usage: const { supabase, user } = await validateUser(true);
async function validateUser(requireApproval = true) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Unauthorized");

  if (requireApproval) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_approved")
      .eq("id", user.id)
      .single();

    if (!profile?.is_approved) {
      throw new Error("Forbidden: Account not approved.");
    }
  }

  return { supabase, user };
}

// --- 1. GRADE CALCULATOR ---

export async function updateAssessmentScore(assessmentId: string, score: number | null) {
  // SAFETY 1: Enforce Approval
  const { supabase } = await validateUser(true);

  // SAFETY 2: Input Validation
  if (score !== null) {
    if (score < 0 || score > 100) {
      throw new Error("Invalid Score: Must be between 0 and 100.");
    }
  }

  // LOGIC: If a score is set, mark as completed. If cleared, unmark.
  const { error } = await supabase
    .from("assessments")
    .update({ 
      score: score,
      is_completed: score !== null 
    })
    .eq("id", assessmentId);

  if (error) {
    console.error("Error updating score:", error);
    throw new Error("Failed to save grade");
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/grades");
}

// Needed for Calendar Checkboxes
export async function toggleAssessmentCompletion(assessmentId: string, isCompleted: boolean) {
  // SAFETY: Enforce Approval
  const { supabase } = await validateUser(true);

  await supabase
    .from("assessments")
    .update({ is_completed: isCompleted })
    .eq("id", assessmentId);
    
  revalidatePath("/dashboard/calendar");
}

// --- 2. CHAT (WITH AUTO-CLEANUP) ---

export async function postMessage(content: string) {
  // SAFETY: Enforce Approval (No spam from unapproved users)
  const { supabase, user } = await validateUser(true);

  // Auto-delete messages older than 48 hours
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("messages")
    .delete()
    .lt("created_at", cutoff);

  // Insert new message
  const { error } = await supabase
    .from("messages")
    .insert({
      user_id: user.id,
      content: content.trim().slice(0, 500), // Max 500 chars
    });

  if (error) console.error("Chat error:", error);
  revalidatePath("/dashboard");
}

// --- 3. LEADERBOARD CALCULATIONS ---

export async function getLeaderboardData() {
  // SAFETY: Enforce Approval (Privacy - don't show stats to unapproved users)
  const { supabase, user } = await validateUser(true);

  // A. Fetch Participating Profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, is_anonymous, is_participating")
    .eq("is_participating", true);

  // B. Fetch All Assessments
  const { data: assessments } = await supabase
    .from("assessments")
    .select(`
      user_id, score, weight,
      courses (course_code)
    `)
    .not("score", "is", null);

  // C. Calculation Engine
  const userStats = new Map();
  const courseStats = new Map();

  assessments?.forEach((a: any) => {
    // Safety Check: Skip if course data is null (RLS or deleted course)
    if (!a.courses) return;

    // User Totals
    if (!userStats.has(a.user_id)) userStats.set(a.user_id, { earned: 0, attempted: 0 });
    const u = userStats.get(a.user_id);
    u.earned += (a.score / 100) * a.weight;
    u.attempted += a.weight;

    // Course Totals (For Radar & Specialists)
    const code = a.courses.course_code;
    if (!courseStats.has(code)) courseStats.set(code, new Map());
    const courseMap = courseStats.get(code);
    
    if (!courseMap.has(a.user_id)) courseMap.set(a.user_id, { earned: 0, attempted: 0 });
    const cUser = courseMap.get(a.user_id);
    cUser.earned += (a.score / 100) * a.weight;
    cUser.attempted += a.weight;
  });

  // D. Generate Rankings
  let rankings = profiles?.map(p => {
    const stats = userStats.get(p.id) || { earned: 0, attempted: 0 };
    const avg = stats.attempted === 0 ? 0 : (stats.earned / stats.attempted) * 100;
    
    const isMe = p.id === user.id;
    return {
      user_id: p.id,
      full_name: (p.is_anonymous && !isMe) ? "Anonymous User" : p.full_name,
      avatar_url: (p.is_anonymous && !isMe) ? null : p.avatar_url,
      is_anonymous: p.is_anonymous,
      current_average: avg,
      trend: 0 
    };
  })
  .filter(u => u.current_average > 0)
  .sort((a, b) => b.current_average - a.current_average)
  .map((u, i) => ({ ...u, rank: i + 1 })) || [];

  // E. Generate Specialists
  const specialists = Array.from(courseStats.entries()).map(([subject, userMap]: [string, any]) => {
    let bestScore = -1;
    let holderId = "";
    
    userMap.forEach((stats: any, uid: string) => {
       const avg = stats.attempted === 0 ? 0 : (stats.earned / stats.attempted) * 100;
       if (avg > bestScore) {
         bestScore = avg;
         holderId = uid;
       }
    });

    const holderProfile = profiles?.find(p => p.id === holderId);
    const isMe = holderId === user.id;

    return {
      subject,
      best_score: bestScore,
      holder_id: holderId,
      holder_name: (holderProfile?.is_anonymous && !isMe) ? "Anonymous" : (holderProfile?.full_name?.split(' ')[0] || "Unknown"),
      avatar_url: holderProfile?.avatar_url
    };
  });

  // F. Generate Radar Data
  const radarData = Array.from(courseStats.keys()).map(subject => {
     const userMap = courseStats.get(subject);
     let totalClassAvg = 0;
     let count = 0;
     let myScore = 0;

     userMap.forEach((stats: any, uid: string) => {
       const avg = stats.attempted === 0 ? 0 : (stats.earned / stats.attempted) * 100;
       totalClassAvg += avg;
       count++;
       if (uid === user.id) myScore = avg;
     });

     return {
       subject,
       A: myScore, 
       B: count === 0 ? 0 : totalClassAvg / count, 
       fullMark: 100
     };
  });

  return { rankings, radarData, specialists };
}

// --- 4. PROFILE MANAGEMENT ---

export async function updateProfile(fullName: string) {
  // SAFETY: Allow unapproved users to fix their name (pass false)
  const { supabase, user } = await validateUser(false);

  await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id);
    
  revalidatePath("/dashboard/profile");
}

export async function updateUserPassword(password: string) {
  // SAFETY: Allow unapproved users to change password (pass false)
  const { supabase } = await validateUser(false);
  
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
}

export async function togglePrivacy(isAnonymous: boolean) {
  // SAFETY: Enforce Approval
  const { supabase, user } = await validateUser(true);

  await supabase
    .from("profiles")
    .update({ is_anonymous: isAnonymous })
    .eq("id", user.id);
  
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/leaderboard");
}

export async function toggleParticipation(isParticipating: boolean) {
  // SAFETY: Enforce Approval
  const { supabase, user } = await validateUser(true);

  await supabase
    .from("profiles")
    .update({ is_participating: isParticipating })
    .eq("id", user.id);
    
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/leaderboard");
}

export async function uploadAvatar(formData: FormData) {
  // SAFETY: Allow unapproved users to upload avatar (pass false)
  const { supabase, user } = await validateUser(false);

  const file = formData.get("file") as File;
  const fileExt = file.name.split(".").pop();
  const filePath = `${user.id}-${Math.random()}.${fileExt}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("avatars") 
    .upload(filePath, file);

  if (uploadError) throw new Error("Upload failed");

  // Get Public URL
  const { data: { publicUrl } } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  // Save to Profile
  await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/leaderboard"); // Update leaderboard to show new pic
  return { publicUrl };
}