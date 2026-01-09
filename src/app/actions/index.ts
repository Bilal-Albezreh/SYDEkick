"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { subDays } from "date-fns";

// --- TYPE DEFINITIONS ---
// This stops all the "Property 'rank' does not exist" errors
export interface LeaderboardStudent {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  is_anonymous: boolean;
  current_average: number;
  last_week_average: number;
  course_breakdown: Record<string, number>;
  rank: number; // Required
  trend: number; // Required
}

// =========================================================
// 1. GRADES & ASSESSMENTS
// =========================================================

export async function toggleAssessmentCompletion(assessmentId: string, isCompleted: boolean) {
  const supabase = await createClient(); 
  
  const { error } = await supabase
    .from("assessments")
    .update({ is_completed: isCompleted })
    .eq("id", assessmentId);

  if (error) {
    console.error("Error updating assessment:", error);
    throw new Error("Failed to update assessment status");
  }

  revalidatePath("/grades");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}

export async function updateAssessmentScore(assessmentId: string, score: number | null) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("assessments")
    .update({ score: score })
    .eq("id", assessmentId);

  if (error) {
    console.error("Error updating score:", error);
    throw new Error("Failed to save grade");
  }

  revalidatePath("/grades");
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
}


// =========================================================
// 2. REMINDERS (Sidebar Widget)
// =========================================================

export async function addReminder(title: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("reminders").insert({
    user_id: user.id,
    title,
    is_completed: false
  });
  revalidatePath("/calendar");
}

export async function toggleReminder(id: string, isCompleted: boolean) {
  const supabase = await createClient();
  await supabase.from("reminders").update({ is_completed: isCompleted }).eq("id", id);
  revalidatePath("/calendar");
}

export async function deleteReminder(id: string) {
  const supabase = await createClient();
  await supabase.from("reminders").delete().eq("id", id);
  revalidatePath("/calendar");
}


// =========================================================
// 3. LEADERBOARD & SOCIAL
// =========================================================

export async function togglePrivacy(isAnonymous: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("profiles").update({ is_anonymous: isAnonymous }).eq("id", user.id);
  revalidatePath("/leaderboard");
}

export async function toggleParticipation(isParticipating: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({ is_participating: isParticipating })
    .eq("id", user.id);

  revalidatePath("/profile");
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
}

export async function getLeaderboardData() {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  const { data: rawData } = await supabase
    .from("profiles")
    .select(`
      id, 
      full_name, 
      avatar_url,
      is_anonymous,
      is_participating,
      courses (
        course_code,
        assessments (
          score,
          weight,
          due_date
        )
      )
    `)
    .eq("is_participating", true);

  if (!rawData) return { rankings: [] as LeaderboardStudent[], radarData: [], specialists: [] };

  const calculateAverage = (courses: any[], dateLimit?: Date) => {
    let totalWeightedScore = 0;
    let totalWeight = 0;
    courses.forEach((c: any) => {
      c.assessments.forEach((a: any) => {
        if (dateLimit && new Date(a.due_date) > dateLimit) return;
        if (a.score === null) return;
        totalWeightedScore += (a.score / 100) * a.weight;
        totalWeight += a.weight;
      });
    });
    return totalWeight === 0 ? 0 : (totalWeightedScore / totalWeight) * 100;
  };

  const getCourseAverages = (courses: any[]) => {
    const stats: Record<string, number> = {};
    courses.forEach((c: any) => {
      let wScore = 0;
      let wTotal = 0;
      c.assessments.forEach((a: any) => {
        if (a.score === null) return;
        wScore += (a.score / 100) * a.weight;
        wTotal += a.weight;
      });
      if (wTotal > 0) stats[c.course_code] = (wScore / wTotal) * 100;
    });
    return stats;
  };

  const oneWeekAgo = subDays(new Date(), 7);
  
  // Create base stats
  let userStats = rawData.map((profile: any) => {
    return {
      user_id: profile.id,
      full_name: profile.full_name,
      is_anonymous: profile.is_anonymous,
      avatar_url: profile.avatar_url,
      current_average: calculateAverage(profile.courses),
      last_week_average: calculateAverage(profile.courses, oneWeekAgo),
      course_breakdown: getCourseAverages(profile.courses)
    };
  });

  // Calculate Ranks
  userStats.sort((a, b) => b.current_average - a.current_average);
  
  // Calculate Old Ranks for Trend
  const oldRankMap = new Map();
  [...userStats]
    .sort((a, b) => b.last_week_average - a.last_week_average)
    .forEach((u, index) => oldRankMap.set(u.user_id, index + 1));

  // Build Final Rankings with Rank and Trend properties
  const finalRankings: LeaderboardStudent[] = userStats.map((u, index) => {
    const currentRank = index + 1;
    const oldRank = oldRankMap.get(u.user_id) || currentRank;
    return { 
      ...u, 
      rank: currentRank, 
      trend: oldRank - currentRank 
    };
  });

  // Radar Data
  const courseSums: any = {};
  const courseCounts: any = {};
  finalRankings.forEach(u => {
    Object.entries(u.course_breakdown).forEach(([code, score]) => {
      if (!courseSums[code]) { courseSums[code] = 0; courseCounts[code] = 0; }
      courseSums[code] += score;
      courseCounts[code] += 1;
    });
  });

  const myProfile = finalRankings.find(u => u.user_id === currentUser?.id);
  const radarData = Object.keys(courseSums).map(code => ({
    subject: code,
    classAvg: Math.round(courseSums[code] / courseCounts[code]),
    userAvg: myProfile?.course_breakdown[code] ? Math.round(myProfile.course_breakdown[code]) : 0,
    fullMark: 100
  }));

  // Specialists
  const specialists = Object.keys(courseSums).map(code => {
    const topUser = finalRankings.reduce((prev, curr) => {
        const currScore = curr.course_breakdown[code] || 0;
        const prevScore = prev.course_breakdown[code] || 0;
        return currScore > prevScore ? curr : prev;
    });

    return {
        subject: code,
        best_score: topUser.course_breakdown[code],
        holder_name: topUser.is_anonymous && topUser.user_id !== currentUser?.id 
            ? "Anonymous" 
            : topUser.full_name,
        holder_id: topUser.user_id
    };
  });

  return { rankings: finalRankings, radarData, specialists };
}


// =========================================================
// 4. DASHBOARD
// =========================================================

export async function getDashboardData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);

  // 1. UPCOMING DEADLINES
  const { data: upcoming } = await supabase
    .from("assessments")
    .select(`id, name, due_date, weight, courses ( course_code, color )`)
    .eq("is_completed", false)
    .gte("due_date", now.toISOString())
    .lte("due_date", nextWeek.toISOString())
    .order("due_date", { ascending: true })
    .limit(5);

  // 2. COURSE PROGRESS
  const { data: allAssessments } = await supabase
    .from("assessments")
    .select(`weight, is_completed, courses ( course_code, color )`)
    .not("weight", "is", null);

  const progressMap: any = {};
  allAssessments?.forEach((a: any) => {
    const code = a.courses.course_code;
    if (!progressMap[code]) {
      progressMap[code] = { name: code, color: a.courses.color, totalWeight: 0, completedWeight: 0 };
    }
    progressMap[code].totalWeight += a.weight; 
    if (a.is_completed) progressMap[code].completedWeight += a.weight;
  });
  
  const courseProgress = Object.values(progressMap).map((c: any) => ({
    ...c,
    percentage: Math.min(100, Math.round(c.completedWeight)) 
  }));

  // 3. LEADERBOARD LOGIC
  const { rankings } = await getLeaderboardData();
  
  const myIndex = rankings.findIndex((r) => r.user_id === user.id);
  const myRank = myIndex !== -1 ? rankings[myIndex] : null;
  
  const personAhead = myIndex > 0 ? rankings[myIndex - 1] : null;
  const personBehind = rankings.length > 1 && myIndex === 0 ? rankings[1] : null;

  let gap = 0;
  let gapMessage = "";

  if (myRank) {
      if (myRank.rank === 1 && personBehind) {
          gap = myRank.current_average - personBehind.current_average;
          gapMessage = `Lead over #${personBehind.rank}`;
      } else if (personAhead) {
          gap = personAhead.current_average - myRank.current_average;
          gapMessage = `to reach #${personAhead.rank}`;
      }
  }

 // 4. CHAT MESSAGES (The piece you need to add)
  const { data: messages } = await supabase
    .from("messages")
    .select(`
      id, 
      content, 
      created_at, 
      user_id,
      profiles ( full_name, avatar_url, is_anonymous )
    `)
    .order("created_at", { ascending: false })
    .limit(20);

  // RETURN EVERYTHING
  return { 
      upcoming, 
      courseProgress, 
      myRank: myRank ? { ...myRank, gap, gapMessage, totalStudents: rankings.length } : null,
      topRank: rankings.slice(0, 3),
      messages: messages || [] 
  };
}
// --- CHAT SYSTEM ---

export async function postMessage(content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // 1. Insert New Message
  const { error } = await supabase.from("messages").insert({
    user_id: user.id,
    content: content.trim()
  });

  if (error) {
    console.error("Error posting message:", error);
    throw new Error("Failed to send message");
  }

  // 2. SELF-DESTRUCT LOGIC: Delete messages older than 48 hours
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  
  await supabase
    .from("messages")
    .delete()
    .lt("created_at", fortyEightHoursAgo);

  revalidatePath("/dashboard");
}

// =========================================================
// 5. PROFILE SETTINGS
// =========================================================

export async function updateProfile(fullName: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);
  if (error) throw new Error("Failed to update profile");

  revalidatePath("/profile");
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
}

export async function updateUserPassword(password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file uploaded");

  const fileExt = file.name.split(".").pop();
  const filePath = `public/${user.id}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw new Error("Failed to upload image");

  const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);

  const { error: dbError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (dbError) throw new Error("Failed to save avatar link to database");

  revalidatePath("/profile");
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
}