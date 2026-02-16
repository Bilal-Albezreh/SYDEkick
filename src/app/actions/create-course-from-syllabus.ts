"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

interface AssessmentData {
    name: string;
    weight: number | string;
    date?: string;
}

interface CourseInfoData {
    code?: string;
    name?: string;
    color?: string;
}

interface SyllabusData {
    courseInfo: CourseInfoData;
    assessments: AssessmentData[];
}

export async function createCourseFromSyllabus(data: SyllabusData) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "Not authenticated" };
        }

        // 1. Get current active term
        // First try to find a term marked as current
        const { data: currentTerm } = await supabase
            .from("terms")
            .select("id")
            .eq("user_id", user.id)
            .eq("is_current", true)
            .maybeSingle();

        // If no current term, just grab the most recent one
        let termId = currentTerm?.id;
        if (!termId) {
            const { data: recentTerm } = await supabase
                .from("terms")
                .select("id")
                .eq("user_id", user.id)
                .order("start_date", { ascending: false })
                .limit(1)
                .maybeSingle();
            termId = recentTerm?.id;
        }

        if (!termId) {
            return { success: false, error: "No active term found. Please create a term first." };
        }

        // 2. Insert Course
        const courseInfo = data.courseInfo;
        const { data: newCourse, error: courseError } = await supabase
            .from("courses")
            .insert({
                user_id: user.id,
                term_id: termId,
                course_code: courseInfo.code || "UNKNOWN",
                course_name: courseInfo.name || "Untitled Course",
                color: courseInfo.color || "#10B981",
                credits: 0.5, // Default
            })
            .select()
            .single();

        if (courseError) {
            console.error("Error creating course:", courseError);
            return { success: false, error: "Failed to create course" };
        }

        // 3. Insert Assessments
        if (data.assessments && data.assessments.length > 0) {
            const assessmentsToInsert = data.assessments.map((a) => ({
                user_id: user.id,
                course_id: newCourse.id,
                name: a.name,
                type: "Assignment", // Default type for now, or infer if possible
                weight: typeof a.weight === 'number' ? a.weight : 0,
                total_marks: 100,
                due_date: a.date ? new Date(a.date).toISOString() : null,
                is_completed: false,
            }));

            const { error: assessmentsError } = await supabase
                .from("assessments")
                .insert(assessmentsToInsert);

            if (assessmentsError) {
                console.error("Error creating assessments:", assessmentsError);
                // Note: Course was created, but assessments failed. 
                // We could delete the course here to be atomic, but for now just warn.
                return { success: true, warning: "Course created but assessments failed to save." };
            }
        }

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/courses");

        return { success: true };

    } catch (error) {
        console.error("createCourseFromSyllabus error:", error);
        return { success: false, error: (error as Error).message };
    }
}
