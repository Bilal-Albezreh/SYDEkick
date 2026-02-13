"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Update Academic Profile Information
 * Updates the user's university, program, and current term label
 * Also syncs the current term with the terms table (UPSERT)
 */
export async function updateAcademicProfile(
    universityId: string,
    programId: string,
    termLabel: string
) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated" };
        }

        // ==========================================
        // STEP 1: Update profiles table with academic information
        // ==========================================
        const { error: profileError } = await supabase
            .from("profiles")
            .update({
                university_id: universityId,
                program_id: programId,
                current_term_label: termLabel,
            })
            .eq("id", user.id);

        if (profileError) {
            console.error("Profile update error:", profileError);
            return { success: false, error: "Failed to update academic profile" };
        }

        // ==========================================
        // STEP 2: Sync with terms table (UPSERT logic)
        // This ensures is_current flag is set correctly
        // ==========================================

        // Check if term already exists for this user
        const { data: existingTerm } = await supabase
            .from("terms")
            .select("id")
            .eq("user_id", user.id)
            .eq("label", termLabel)
            .maybeSingle();

        if (existingTerm) {
            // Term exists - just update is_current to true
            const { error: updateError } = await supabase
                .from("terms")
                .update({ is_current: true })
                .eq("id", existingTerm.id);

            if (updateError) {
                console.error("Term update error:", updateError);
                // Don't fail the entire operation, just log it
            }
        } else {
            // Term doesn't exist - create it with is_current = true
            const { error: insertError } = await supabase
                .from("terms")
                .insert({
                    user_id: user.id,
                    label: termLabel,
                    season: `${termLabel} Term`, // Placeholder
                    start_date: null, // Leave as null
                    end_date: null,   // Leave as null
                    is_current: true
                });

            if (insertError) {
                console.error("Term insert error:", insertError);
                // Don't fail the entire operation, just log it
            }
        }

        // Note: Database trigger 'trigger_single_current_term' will automatically
        // set all other terms for this user to is_current = false

        // ==========================================
        // STEP 3: Revalidate paths so UI updates immediately
        // ==========================================
        revalidatePath("/dashboard");
        revalidatePath("/dashboard/profile");
        revalidatePath("/dashboard/courses");
        revalidatePath("/dashboard/grades");

        return { success: true };

    } catch (error: any) {
        console.error("updateAcademicProfile error:", error);
        return { success: false, error: error.message || "An unexpected error occurred" };
    }
}
