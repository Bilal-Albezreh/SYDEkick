"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// 1. GET STATS
export async function getCareerStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  let { data } = await supabase
    .from("career_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!data) {
    const { data: newData } = await supabase
      .from("career_stats")
      .insert({ user_id: user.id, pending_count: 0 })
      .select()
      .single();
    return newData;
  }
  return data;
}

// 2. BULK ADD
export async function addApplications(count: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: current } = await supabase
    .from("career_stats")
    .select("pending_count")
    .eq("user_id", user.id)
    .single();

  const newPending = (current?.pending_count || 0) + count;

  await supabase
    .from("career_stats")
    .update({ pending_count: newPending })
    .eq("user_id", user.id);

  revalidatePath("/dashboard/career");
}

// 3. MOVE
export async function moveApplications(targetStatus: string, count: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: stats } = await supabase
    .from("career_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!stats) return;

  const currentPending = stats.pending_count || 0;
  
  const decrementAmount = Math.min(currentPending, count);
  const newPending = currentPending - decrementAmount;
  
  const targetColumn = `${targetStatus}_count`; 
  const currentTargetValue = (stats[targetColumn as keyof typeof stats] as number) || 0;
  const newTargetValue = currentTargetValue + count;

  await supabase
    .from("career_stats")
    .update({ 
      pending_count: newPending,
      [targetColumn]: newTargetValue
    })
    .eq("user_id", user.id);

  revalidatePath("/dashboard/career");
}

// 4. ADD INTERVIEW
export async function addInterview(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  const company = formData.get("company") as string;
  const role = formData.get("role") as string;
  const date = formData.get("date") as string;

  await supabase.from("interviews").insert({
    user_id: user.id,
    company_name: company,
    role_title: role,
    interview_date: date,
    status: "Interview"
  });

  const { data: stats } = await supabase
    .from("career_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (stats) {
    const currentPending = stats.pending_count || 0;
    const decrementAmount = Math.min(currentPending, 1);
    
    await supabase.from("career_stats").update({
      pending_count: currentPending - decrementAmount,
      interview_count: (stats.interview_count || 0) + 1
    }).eq("user_id", user.id);
  }

  revalidatePath("/dashboard/career");
}

// 5. LOG OUTCOME (Fixed TypeScript Error)
export async function logInterviewOutcome(outcome: 'offer' | 'no_offer') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const column = outcome === 'offer' ? 'offer_count' : 'no_offer_count';
  
  const { data: current } = await supabase
    .from("career_stats")
    .select(column)
    .eq("user_id", user.id)
    .single();

  // FIX: Cast to unknown first to allow the conversion from a potentially undefined value
  const currentVal = (current?.[column as keyof typeof current] as unknown as number) || 0;

  await supabase
    .from("career_stats")
    .update({ [column]: currentVal + 1 })
    .eq("user_id", user.id);

  revalidatePath("/dashboard/career");
}
// 6. RESET STAT (The "Vanish" Logic)
export async function resetStat(category: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Map user-friendly names to DB columns
  const columnMap: Record<string, string> = {
    'applications': 'pending_count', // "Reset Apps" usually means clear the backlog
    'rejected': 'rejected_count',
    'ghosted': 'ghosted_count',
    'interview': 'interview_count',
    'offer': 'offer_count',
    'no_offer': 'no_offer_count'
  };

  const dbColumn = columnMap[category];
  if (!dbColumn) return;

  await supabase
    .from("career_stats")
    .update({ [dbColumn]: 0 })
    .eq("user_id", user.id);

  revalidatePath("/dashboard/career");
}
// 7. TOGGLE INTERVIEW DONE (For Calendar)
export async function toggleInterviewComplete(interviewId: string, isComplete: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // If marking as complete, set status to 'Done'. 
  // If unchecking, set back to 'Interview' (so it reappears on board).
  const newStatus = isComplete ? "Done" : "Interview";

  await supabase
    .from("interviews")
    .update({ status: newStatus })
    .eq("id", interviewId)
    .eq("user_id", user.id);

  revalidatePath("/dashboard/calendar"); // Refresh calendar
  revalidatePath("/dashboard/career");   // Refresh pipeline
}