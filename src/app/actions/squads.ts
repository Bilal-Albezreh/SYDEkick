"use server";


console.log("------------------------------------------------");
console.log("DEBUG ENV CHECK:");
console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "Exists" : "Missing");
console.log("KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "Exists" : "Missing");
console.log("------------------------------------------------");


import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from "next/cache";
import {
    createSquadSchema,
    joinSquadSchema,
    createTaskSchema,
    createSquadEventSchema,
    type CreateSquadInput,
    type JoinSquadInput,
    type CreateTaskInput,
    type CreateSquadEventInput
} from "@/lib/validations/squads";

// =====================================================
// ADMIN CLIENT (Service Role - bypasses RLS)
// =====================================================
// CRITICAL: Only use for operations that REQUIRE admin access
// (e.g., adding members to squad_memberships)
function getAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseServiceKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    }

    return createSupabaseClient(supabaseUrl, supabaseServiceKey);
}

// =====================================================
// CREATE SQUAD
// =====================================================
/**
 * Create a new squad and automatically make the creator a leader
 * 
 * @returns {success, squad, error}
 */
export async function createSquad(input: CreateSquadInput) {
    try {
        // Validate input
        const validatedData = createSquadSchema.parse(input);

        // Get authenticated user
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated" };
        }

        // CRITICAL: Check if user is already in a squad
        const { data: existingMembership, error: checkError } = await supabase
            .from("squad_memberships")
            .select("squad_id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (checkError) {
            console.error("[createSquad] Error checking membership:", checkError);
            return { success: false, error: "Failed to check squad membership" };
        }

        if (existingMembership) {
            return { success: false, error: "You must leave your current squad first" };
        }

        // Create squad
        const { data: squad, error: squadError } = await supabase
            .from("squads")
            .insert({
                name: validatedData.name,
                description: validatedData.description,
                program: validatedData.program,
                term: validatedData.term,
                owner_id: user.id,
                is_official: validatedData.is_official || false,
            })
            .select("*")
            .single();

        if (squadError || !squad) {
            console.error("[createSquad] Error creating squad:", squadError);
            return { success: false, error: squadError?.message || "Failed to create squad" };
        }

        // CRITICAL: Use admin client to add creator as leader
        // This bypasses RLS which would otherwise prevent self-insertion
        const adminClient = getAdminClient();
        const { error: membershipError } = await adminClient
            .from("squad_memberships")
            .insert({
                user_id: user.id,
                squad_id: squad.id,
                role: "leader",
            });

        if (membershipError) {
            console.error("[createSquad] Error adding leader:", membershipError);
            // Rollback: Delete the squad using admin client
            await adminClient.from("squads").delete().eq("id", squad.id);
            return { success: false, error: "Failed to assign group leader" };
        }

        revalidatePath("/dashboard/groups");
        return { success: true, squad };

    } catch (error: any) {
        console.error("[createSquad] Unexpected error:", error);
        return {
            success: false,
            error: error.message || "An unexpected error occurred"
        };
    }
}

// =====================================================
// JOIN SQUAD (via invite code)
// =====================================================
/**
 * Join a squad using an invite code
 * 
 * SECURITY NOTE: Uses admin client to bypass RLS policy
 * (RLS prevents users from directly inserting into squad_memberships)
 * 
 * @returns {success, squad, error}
 */
export async function joinSquad(input: JoinSquadInput) {
    try {
        // Validate input
        const validatedData = joinSquadSchema.parse(input);

        // Get authenticated user
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated" };
        }

        // Find squad by invite code
        const { data: squad, error: squadError } = await supabase
            .from("squads")
            .select("*")
            .eq("invite_code", validatedData.invite_code)
            .single();

        if (squadError || !squad) {
            console.error("[joinSquad] Squad not found:", squadError);
            return { success: false, error: "Invalid invite code" };
        }

        // CRITICAL: Check if user is already in ANY squad (single squad enforcement)
        const { data: existingMembership, error: checkError } = await supabase
            .from("squad_memberships")
            .select("squad_id, squads(name)")
            .eq("user_id", user.id)
            .maybeSingle();

        if (checkError) {
            console.error("[joinSquad] Error checking membership:", checkError);
            return { success: false, error: "Failed to check squad membership" };
        }

        if (existingMembership) {
            const currentSquadName = (existingMembership as any).squads?.name || "a squad";
            return {
                success: false,
                error: `You are already in ${currentSquadName}. Leave it to join this one.`
            };
        }

        // CRITICAL: Use admin client to insert membership
        // (bypasses RLS policy that prevents self-insertion)
        const adminClient = getAdminClient();
        const { error: membershipError } = await adminClient
            .from("squad_memberships")
            .insert({
                user_id: user.id,
                squad_id: squad.id,
                role: "member",
            });

        if (membershipError) {
            console.error("[joinSquad] Error adding member:", membershipError);
            return { success: false, error: "Failed to join squad" };
        }

        revalidatePath("/dashboard/squads");
        revalidatePath("/dashboard/calendar");
        return { success: true, squad };

    } catch (error: any) {
        console.error("[joinSquad] Unexpected error:", error);
        return {
            success: false,
            error: error.message || "An unexpected error occurred"
        };
    }
}

// =====================================================
// CREATE TASK TEMPLATE (Squad Leaders Only)
// =====================================================
/**
 * Create a task template for a squad
 * Only squad leaders can create templates
 * 
 * @returns {success, template, error}
 */
export async function createTaskTemplate(input: CreateTaskInput) {
    try {
        // Validate input
        const validatedData = createTaskSchema.parse(input);

        // Get authenticated user
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated" };
        }

        // Verify user is a leader of this squad
        const { data: membership } = await supabase
            .from("squad_memberships")
            .select("role")
            .eq("user_id", user.id)
            .eq("squad_id", validatedData.squad_id)
            .single();

        if (!membership || membership.role !== "leader") {
            return { success: false, error: "Only squad leaders can create templates" };
        }

        // Create template (RLS policy will validate leader permission)
        const { data: template, error: templateError } = await supabase
            .from("squad_templates")
            .insert({
                squad_id: validatedData.squad_id,
                title: validatedData.title,
                description: validatedData.description,
                due_date: validatedData.due_date,
                weight: validatedData.weight,
                type: validatedData.type,
                category: validatedData.category,
                is_archived: false,
            })
            .select("*")
            .single();

        if (templateError || !template) {
            console.error("[createTaskTemplate] Error:", templateError);
            return { success: false, error: templateError?.message || "Failed to create template" };
        }

        revalidatePath("/dashboard/calendar");
        return { success: true, template };

    } catch (error: any) {
        console.error("[createTaskTemplate] Unexpected error:", error);
        return {
            success: false,
            error: error.message || "An unexpected error occurred"
        };
    }
}

// =====================================================
// GET MY SQUADS
// =====================================================
/**
 * Get all squads the current user is a member of
 * 
 * @returns {success, squads, error}
 */
export async function getMySquads() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated" };
        }

        // Get user's squad membership (single squad only)
        const { data: membership, error: membershipError } = await supabase
            .from("squad_memberships")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

        // Handle RLS edge case: Empty error object {} means no access or no data
        // This can happen when table exists but user has no memberships
        if (membershipError) {
            // If it's an empty object or a "no rows" type error, treat as no membership
            const errorMsg = membershipError.message || "";
            const errorCode = (membershipError as any).code;

            console.error("[getMySquads] Membership query error:", {
                message: errorMsg,
                code: errorCode,
                full: membershipError
            });

            // If error is about missing table or permissions, return error
            // Otherwise (empty object, no rows), treat as no membership
            if (errorMsg.includes("does not exist") || errorMsg.includes("permission denied")) {
                return { success: false, error: "Database not set up. Please run migrations." };
            }

            // For other errors (like empty object {}), assume no membership
            console.log("[getMySquads] Assuming no membership due to error:", membershipError);
        }

        // If no membership, return empty array
        if (!membership) {
            return { success: true, squads: [] };
        }

        // Fetch the squad details
        const { data: squad, error: squadError } = await supabase
            .from("squads")
            .select("*")
            .eq("id", membership.squad_id)
            .single();

        if (squadError || !squad) {
            console.error("[getMySquads] Error fetching squad:", squadError);
            return { success: false, error: "Failed to fetch squad details" };
        }

        // Combine membership role with squad data
        const squadWithRole = {
            ...squad,
            my_role: membership.role as 'leader' | 'member',
            joined_at: membership.joined_at,
        };

        return { success: true, squads: [squadWithRole] };

    } catch (error: any) {
        console.error("[getMySquads] Unexpected error:", error);
        return {
            success: false,
            error: error.message || "An unexpected error occurred"
        };
    }
}

// =====================================================
// LEAVE SQUAD
// =====================================================
/**
 * Leave a squad (delete membership)
 * 
 * @returns {success, error}
 */
export async function leaveSquad(squadId: string) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated" };
        }

        // Check if user is the owner
        const { data: squad } = await supabase
            .from("squads")
            .select("owner_id")
            .eq("id", squadId)
            .single();

        if (squad?.owner_id === user.id) {
            return { success: false, error: "Squad owners cannot leave. Delete the squad instead." };
        }

        // Delete membership (RLS allows users to delete their own)
        const { error: deleteError } = await supabase
            .from("squad_memberships")
            .delete()
            .eq("user_id", user.id)
            .eq("squad_id", squadId);

        if (deleteError) {
            console.error("[leaveSquad] Error:", deleteError);
            return { success: false, error: "Failed to leave squad" };
        }

        revalidatePath("/dashboard/squads");
        revalidatePath("/dashboard/calendar");
        return { success: true };

    } catch (error: any) {
        console.error("[leaveSquad] Unexpected error:", error);
        return {
            success: false,
            error: error.message || "An unexpected error occurred"
        };
    }
}

// =====================================================
// CREATE SQUAD WITH CURRICULUM (SNAPSHOT & CLONE)
// =====================================================
/**
 * Creates a new squad and snapshots selected courses into master templates.
 * The leader's original courses are then linked to these templates.
 * When new members join, the trigger auto-clones these templates.
 */
export async function createSquadWithCurriculum({
    squadName,
    description = "",
    courseIds
}: {
    squadName: string;
    description?: string;
    courseIds: string[]; // UUIDs of leader's existing courses to snapshot
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    try {
        // =====================================================
        // STEP 1: Create the Squad
        // =====================================================
        const { data: newSquad, error: squadError } = await supabase
            .from("squads")
            .insert({
                name: squadName,
                description,
                owner_id: user.id
            })
            .select()
            .single();

        if (squadError || !newSquad) {
            console.error("[createSquadWithCurriculum] Squad creation error:", squadError);
            return { success: false, error: "Failed to create squad" };
        }

        const squadId = newSquad.id;

        // =====================================================
        // STEP 2: Add Leader to Squad Memberships
        // =====================================================
        const adminClient = getAdminClient();
        const { error: membershipError } = await adminClient
            .from("squad_memberships")
            .insert({
                squad_id: squadId,
                user_id: user.id,
                role: "leader"
            });

        if (membershipError) {
            console.error("[createSquadWithCurriculum] Membership error:", membershipError);
            // Rollback: Delete the squad
            await supabase.from("squads").delete().eq("id", squadId);
            return { success: false, error: "Failed to add leader to squad" };
        }

        // =====================================================
        // STEP 3: Snapshot Selected Courses into Master Templates
        // =====================================================
        if (courseIds.length > 0) {
            // Fetch leader's selected courses
            const { data: selectedCourses, error: coursesError } = await supabase
                .from("courses")
                .select("*")
                .in("id", courseIds)
                .eq("user_id", user.id);

            if (coursesError || !selectedCourses) {
                console.error("[createSquadWithCurriculum] Courses fetch error:", coursesError);
                return { success: false, error: "Failed to fetch selected courses" };
            }

            // For each course, create master template and link
            for (const course of selectedCourses) {
                // Create master course template
                const { data: masterCourse, error: masterCourseError } = await supabase
                    .from("master_courses")
                    .insert({
                        squad_id: squadId,
                        code: course.course_code,
                        name: course.course_name,
                        color: course.color,
                        default_credits: course.credits || 0.5,
                        created_by: user.id
                    })
                    .select()
                    .single();

                if (masterCourseError || !masterCourse) {
                    console.error("[createSquadWithCurriculum] Master course error:", masterCourseError);
                    continue; // Skip this course but continue with others
                }

                // Fetch assessments for this course
                const { data: assessments, error: assessmentsError } = await supabase
                    .from("assessments")
                    .select("*")
                    .eq("course_id", course.id)
                    .eq("user_id", user.id);

                if (assessments && !assessmentsError) {
                    // Create master assessments
                    const masterAssessments = assessments.map(assessment => ({
                        master_course_id: masterCourse.id,
                        title: assessment.name,
                        weight: assessment.weight,
                    }));

                    if (masterAssessments.length > 0) {
                        const { data: createdMasterAssessments, error: masterAssessmentsError } = await supabase
                            .from("master_assessments")
                            .insert(masterAssessments)
                            .select();

                        if (masterAssessmentsError) {
                            console.error("[createSquadWithCurriculum] Master assessments error:", masterAssessmentsError);
                        } else if (createdMasterAssessments) {
                            // Update leader's original assessments to link to master
                            for (let i = 0; i < assessments.length; i++) {
                                await supabase
                                    .from("assessments")
                                    .update({ master_assessment_id: createdMasterAssessments[i].id })
                                    .eq("id", assessments[i].id);
                            }
                        }
                    }
                }

                // CRITICAL: Update leader's original course to link to master
                const { error: updateCourseError } = await supabase
                    .from("courses")
                    .update({
                        master_course_id: masterCourse.id,
                        squad_id: squadId // Also set squad_id for backward compatibility
                    })
                    .eq("id", course.id);

                if (updateCourseError) {
                    console.error("[createSquadWithCurriculum] Course update error:", updateCourseError);
                }
            }
        }

        revalidatePath("/dashboard/groups");
        revalidatePath("/dashboard/courses");

        return {
            success: true,
            squad: newSquad,
            message: `Squad "${squadName}" created with ${courseIds.length} course templates`
        };

    } catch (error: any) {
        console.error("[createSquadWithCurriculum] Unexpected error:", error);
        return { success: false, error: error.message || "An unexpected error occurred" };
    }
}
