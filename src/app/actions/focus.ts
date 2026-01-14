"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getUpcomingTasks() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { assignments: [], career: [] };

  // 1. Precise Date Logic (Matches your Widget)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of day (catch 9AM assignments even if it's 2PM)

  const futureWindow = new Date();
  futureWindow.setDate(today.getDate() + 14); // Look 2 weeks ahead

  // --- A. Fetch Academic Assignments ---
  // [FIX] Table name is 'assessments' based on your screenshot
  const { data: assignments, error: assignmentError } = await supabase
    .from("assessments") 
    .select(`
      id, 
      name, 
      due_date, 
      weight, 
      is_completed,
      courses (
        course_code,
        color
      )
    `)
    .eq("user_id", user.id) // [RESTORED] Personal data filter
    .or("is_completed.eq.false,is_completed.is.null") 
    .gte("due_date", today.toISOString())
    .lte("due_date", futureWindow.toISOString())
    .order("due_date", { ascending: true });

  if (assignmentError) {
      console.error("❌ Error fetching assignments:", assignmentError.message);
  }

  // Flatten the structure for the UI
  const formattedAssignments = assignments?.map((a: any) => ({
      ...a,
      course_code: a.courses?.course_code || "General",
      color: a.courses?.color || "#555"
  })) || [];

  // --- B. Fetch Career (OAs AND Interviews) ---
  const { data: career, error: careerError } = await supabase
    .from("interviews")
    .select("id, role_title, company_name, interview_date, type") 
    .eq("user_id", user.id)
    .in("type", ["oa", "interview"]) 
    .neq("status", "Done")
    .gte("interview_date", today.toISOString())
    .lte("interview_date", futureWindow.toISOString())
    .order("interview_date", { ascending: true });

  if (careerError) {
      console.error("❌ Error fetching career items:", careerError.message);
  }

  return {
    assignments: formattedAssignments,
    career: career || [] 
  };
}

// 2. Log Session
export async function logFocusSession(duration: number, objective: string, assessmentId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("focus_sessions").insert({
    user_id: user.id,
    duration_minutes: duration,
    objective_name: objective,
    linked_assessment_id: assessmentId,
    is_completed: true
  });

  const { error } = await supabase.rpc('increment_focus_minutes', { 
    user_id_input: user.id, 
    minutes: duration 
  });
  
  if (error) console.error("❌ Leaderboard update failed:", error.message);

  revalidatePath("/dashboard");
}

// 3. Mark Done
export async function completeAssessment(assessmentId: string) {
   const supabase = await createClient();
   
   // Try marking as Assignment first (using correct table name)
   const { error } = await supabase
     .from("assessments") // [FIX] Updated here too
     .update({ is_completed: true })
     .eq("id", assessmentId);

   if (error) {
     // If error (or no rows), try marking as Career
     await supabase
        .from("interviews")
        .update({ status: "Done" })
        .eq("id", assessmentId);
   }
   
   revalidatePath("/dashboard");
}
// --- Add this to src/app/actions/focus.ts ---

export async function getSquadStatus() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // 1. Fetch all participating profiles (exclude self)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .neq("id", user.id) // Don't show myself
    .eq("is_participating", true)
    .limit(10); // Limit to close circle

  if (!profiles) return [];

  // 2. Check who is CURRENTLY working
  // Logic: Find sessions started in the last 120 minutes that aren't 'completed' or just check recent activity
  // For MVP: We will check if they logged a session in the last 30 minutes
  const now = new Date();
  const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();

  const { data: activeSessions } = await supabase
    .from("focus_sessions")
    .select("user_id, objective_name")
    .gte("started_at", thirtyMinsAgo)
    .order("started_at", { ascending: false });

  // 3. Merge Data
  const squad = profiles.map(p => {
    const activeSession = activeSessions?.find(s => s.user_id === p.id);
    return {
      id: p.id,
      name: p.full_name?.split(' ')[0] || "Friend", // First name only
      avatar_url: p.avatar_url,
      is_locked_in: !!activeSession,
      current_task: activeSession?.objective_name || null
    };
  });

  // Sort: Active users first
  return squad.sort((a, b) => Number(b.is_locked_in) - Number(a.is_locked_in));
}