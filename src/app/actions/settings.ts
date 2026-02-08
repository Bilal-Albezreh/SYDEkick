"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Update Academic Profile Information
 * Updates the user's university, program, and current term label
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

        // Update profiles table with academic information
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

        // Revalidate the profile page
        revalidatePath("/dashboard/profile");

        return { success: true };

    } catch (error: any) {
        console.error("updateAcademicProfile error:", error);
        return { success: false, error: error.message || "An unexpected error occurred" };
    }
}
