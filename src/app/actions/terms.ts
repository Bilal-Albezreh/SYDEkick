"use server";

import { createClient } from "@/utils/supabase/server";
import { ACADEMIC_TERMS } from "@/lib/constants";

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

/**
 * Ensure a term exists by label - creates it if it doesn't exist
 * Returns the term ID (existing or newly created)
 */
export async function ensureTermExists(label: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: "Not authenticated", data: null };
    }

    // Check if the label is valid
    if (!ACADEMIC_TERMS.includes(label as any)) {
        return { success: false, error: "Invalid term label", data: null };
    }

    // Check if term already exists
    const { data: existingTerm } = await supabase
        .from("terms")
        .select("id")
        .eq("user_id", user.id)
        .eq("label", label)
        .maybeSingle();

    if (existingTerm) {
        return { success: true, data: existingTerm.id };
    }

    // Create new term with placeholder dates
    const { data: newTerm, error } = await supabase
        .from("terms")
        .insert({
            user_id: user.id,
            label,
            season: `${label} Term`,
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date().toISOString().split('T')[0],
            is_current: false
        })
        .select("id")
        .single();

    if (error) {
        console.error("Error creating term:", error);
        return { success: false, error: "Failed to create term", data: null };
    }

    return { success: true, data: newTerm.id };
}

