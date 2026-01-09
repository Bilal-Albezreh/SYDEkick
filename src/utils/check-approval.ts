import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function checkApproval() {
  const supabase = await createClient();
  
  // 1. Get User
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/"); // Not logged in -> Home

  // 2. Check Profile Approval Status
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_approved")
    .eq("id", user.id)
    .single();

  // 3. If not approved, kick to Waiting Room
  if (!profile || !profile.is_approved) {
    redirect("/pending");
  }

  // 4. Return user if safe
  return user;
}