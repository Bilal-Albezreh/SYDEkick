"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Get all terms for the current user
 */
export async function getTerms() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: "Not authenticated", data: null };
    }

    const { data: terms, error } = await supabase
        .from("terms")
        .select("id, label, season, start_date, end_date, is_current")
        .eq("user_id", user.id)
        .order("start_date", { ascending: false });

    if (error) {
        console.error("Error fetching terms:", error);
        return { success: false, error: "Failed to fetch terms", data: null };
    }

    return { success: true, data: terms || [] };
}

/**
 * Get the current active term for the user
 */
export async function getCurrentTerm() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: "Not authenticated", data: null };
    }

    const { data: term, error } = await supabase
        .from("terms")
        .select("id, label, season, start_date, end_date, is_current")
        .eq("user_id", user.id)
        .eq("is_current", true)
        .maybeSingle();

    if (error) {
        console.error("Error fetching current term:", error);
        return { success: false, error: "Failed to fetch current term", data: null };
    }

    return { success: true, data: term };
}
