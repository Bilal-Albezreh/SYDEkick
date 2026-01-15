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

  // --- C. Fetch Personal Tasks [NEW] ---
  const { data: personalTasks } = await supabase
    .from("personal_tasks")
    .select(`
        id, title, due_date, type, description, is_completed, 
        courses (course_code, color)
    `)
    .eq("user_id", user.id)
    .eq("is_completed", false)
    .gte("due_date", today.toISOString())
    .lte("due_date", futureWindow.toISOString()) // Matches the 2-week window
    .order("due_date", { ascending: true });

  // Map to unified format for UI
  const formatPersonal = personalTasks?.map((t: any) => ({
    id: t.id,
    name: t.title,
    due_date: t.due_date,
    weight: 0, // No weight for personal tasks
    is_completed: t.is_completed,
    course_code: t.type === 'course_work' ? t.courses?.course_code : 'Personal',
    color: t.type === 'course_work' ? t.courses?.color : '#888888',
    type: 'personal_task',
    description: t.description
  })) || [];

  // Merge Assignments and Personal Tasks for the main list
  const combinedAssignments = [...formattedAssignments, ...formatPersonal].sort((a, b) =>
    new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );

  return {
    assignments: combinedAssignments,
    career: career || []
  };
}

// 2. Start Session (Signals "I am working")
export async function startFocusSession(duration: number, objective: string, assessmentId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.from("focus_sessions").insert({
    user_id: user.id,
    duration_minutes: duration,
    objective_name: objective,
    linked_assessment_id: assessmentId,
    is_completed: false, // Currently Active
    started_at: new Date().toISOString()
  }).select("id").single();

  if (error) {
    console.error("Failed to start session:", error);
    return null;
  }
  return data.id;
}

// 3. End Session (Finalizes "I am done")
// Renamed from logFocusSession to better reflect the new flow
export async function endFocusSession(sessionId: string, duration: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Update status to completed
  await supabase.from("focus_sessions").update({
    is_completed: true,
    // Optional: Update duration if they stopped early? For now keep original duration or passed one.
    // duration_minutes: duration 
  }).eq("id", sessionId);

  // Increment Leaderboard
  const { error } = await supabase.rpc('increment_focus_minutes', {
    user_id_input: user.id,
    minutes: duration
  });

  if (error) console.error("❌ Leaderboard update failed:", error.message);

  revalidatePath("/dashboard");
}

// 4. Mark Assessment/Task Done (Unchanged)
export async function completeAssessment(assessmentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Try marking as Assignment first
  const { error } = await supabase
    .from("assessments")
    .update({ is_completed: true })
    .eq("id", assessmentId)
    .eq("user_id", user.id);

  if (error) {
    // If error (or no rows), try marking as Career
    const { error: interviewError } = await supabase
      .from("interviews")
      .update({ status: "Done" })
      .eq("id", assessmentId)
      .eq("user_id", user.id);

    if (interviewError) {
      // Finally check Personal Tasks
      await supabase
        .from("personal_tasks")
        .update({ is_completed: true })
        .eq("id", assessmentId)
        .eq("user_id", user.id);
    }
  }

  revalidatePath("/dashboard");
}
// [REMOVED] getSquadStatus function as per user request to remove Squad Widget

// 5. Update Item Date (Reschedule Support)
export async function updateItemDate(
  id: string,
  type: 'assessment' | 'interview' | 'personal' | 'oa' | 'course_work',
  newDateString: string // Expecting "YYYY-MM-DD" or ISO string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  console.log(`[updateItemDate] Request: ID=${id} Type=${type} DateStr=${newDateString}`);

  // 1. Safe Date Construction
  // Interviews/OA: Respect exact timestamp (Frontend sends full UTC ISO)
  // Tasks/Assessments: Force Noon UTC to prevent Day Drift
  let isoDate: string;

  if (type === 'interview' || type === 'oa') {
    // TRUST the frontend to have converted to UTC ISO
    isoDate = newDateString.endsWith('Z') ? newDateString : new Date(newDateString).toISOString();
  } else {
    try {
      const datePart = newDateString.includes('T') ? newDateString.split('T')[0] : newDateString;
      isoDate = `${datePart}T12:00:00Z`;
    } catch (e) {
      console.error("[updateItemDate] Date Parsing Error:", e);
      throw new Error("Invalid Date Format");
    }
  }

  console.log(`[updateItemDate] Saving to DB: ${isoDate}`);

  let error: any;

  if (type === 'assessment') {
    const { error: err } = await supabase
      .from("assessments")
      .update({ due_date: isoDate })
      .eq("id", id)
      .eq("user_id", user.id);
    error = err;
  }
  else if (type === 'interview' || type === 'oa') {
    const { error: err } = await supabase
      .from("interviews")
      .update({ interview_date: isoDate })
      .eq("id", id)
      .eq("user_id", user.id);
    error = err;
  }
  else if (type === 'personal' || type === 'course_work') {
    const { error: err } = await supabase
      .from("personal_tasks")
      .update({ due_date: isoDate })
      .eq("id", id)
      .eq("user_id", user.id);
    error = err;
  }

  if (error) {
    console.error("[updateItemDate] Supabase Error:", error);
    throw new Error(`Failed to update ${type}: ${error.message}`);
  }

  console.log("[updateItemDate] Success");

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/calendar");
}