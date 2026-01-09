"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Accurate SYDE 2A Template
const MASTER_COURSES = [
  {
    course_code: "SYDE 261",
    course_name: "Design Structures & Theories",
    color: "#06b6d4",
    assessments: [
      { name: "Design Journal", weight: 20, total_marks: 100 },
      { name: "Midterm Project", weight: 30, total_marks: 100 },
      { name: "Final Portfolio", weight: 50, total_marks: 100 },
    ]
  },
  {
    course_code: "SYDE 211",
    course_name: "Calculus III",
    color: "#3b82f6",
    assessments: [
      { name: "Assignments", weight: 15, total_marks: 100 },
      { name: "Midterm Exam", weight: 35, total_marks: 100 },
      { name: "Final Exam", weight: 50, total_marks: 100 },
    ]
  },
  {
    course_code: "SYDE 285",
    course_name: "Physics 2",
    color: "#a855f7",
    assessments: [
      { name: "Tutorial Tests", weight: 20, total_marks: 100 },
      { name: "Midterm Exam", weight: 30, total_marks: 100 },
      { name: "Final Exam", weight: 50, total_marks: 100 },
    ]
  },
  {
    course_code: "SYDE 263",
    course_name: "Cognitive Ergonomics",
    color: "#f97316",
    assessments: [
      { name: "Lab Reports", weight: 25, total_marks: 100 },
      { name: "Design Project", weight: 35, total_marks: 100 },
      { name: "Final Exam", weight: 40, total_marks: 100 },
    ]
  },
  {
    course_code: "SYDE 283",
    course_name: "Mechanical Systems",
    color: "#22c55e",
    assessments: [
      { name: "Problem Sets", weight: 10, total_marks: 100 },
      { name: "Midterm", weight: 30, total_marks: 100 },
      { name: "Final Exam", weight: 60, total_marks: 100 },
    ]
  },
  {
    course_code: "SYDE 182",
    course_name: "Economics",
    color: "#ec4899",
    assessments: [
      { name: "Quizzes", weight: 20, total_marks: 100 },
      { name: "Midterm", weight: 30, total_marks: 100 },
      { name: "Final Exam", weight: 50, total_marks: 100 },
    ]
  }
];

export async function seedUserCourses() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 1. CLEANUP: Delete existing courses for this user to prevent any duplicates
  await supabase.from("courses").delete().eq("user_id", user.id);

  // 2. SEED: Loop through and insert fresh data
  for (const course of MASTER_COURSES) {
    const { data: newCourse, error: courseError } = await supabase
      .from("courses")
      .insert({
        user_id: user.id,
        course_code: course.course_code,
        course_name: course.course_name,
        color: course.color,
        grading_rules: {}
      })
      .select()
      .single();

    if (courseError || !newCourse) {
        console.error("Error seeding course:", course.course_code, courseError);
        continue;
    }

    const assessmentsPayload = course.assessments.map(a => ({
      course_id: newCourse.id,
      name: a.name,
      weight: a.weight,
      total_marks: a.total_marks,
      score: null,
      is_completed: false,
      due_date: new Date().toISOString().split('T')[0] // Use a valid date
    }));

    const { error: assessError } = await supabase
      .from("assessments")
      .insert(assessmentsPayload);
      
    if (assessError) console.error("Error seeding assessments:", assessError);
  }

  revalidatePath("/grades");
  revalidatePath("/calendar");
  return { success: true };
}