"use server";

import { createClient } from "@/utils/supabase/server";
// import { revalidatePath } from "next/cache"; <--- REMOVE THIS IMPORT

// SYDE 2A CURRICULUM TEMPLATE
const MASTER_COURSES = [
  {
    course_code: "SYDE 261",
    course_name: "Design Structures & Theories",
    color: "#06b6d4", // Cyan
    assessments: [
      { name: "Design Journal", weight: 20 },
      { name: "Midterm Project", weight: 30 },
      { name: "Final Portfolio", weight: 50 },
    ]
  },
  {
    course_code: "SYDE 211",
    course_name: "Calculus III",
    color: "#3b82f6", // Blue
    assessments: [
      { name: "Assignments", weight: 15 },
      { name: "Midterm Exam", weight: 35 },
      { name: "Final Exam", weight: 50 },
    ]
  },
  {
    course_code: "SYDE 285",
    course_name: "Physics 2",
    color: "#a855f7", // Purple
    assessments: [
      { name: "Tutorial Tests", weight: 20 },
      { name: "Midterm Exam", weight: 30 },
      { name: "Final Exam", weight: 50 },
    ]
  },
  {
    course_code: "SYDE 263",
    course_name: "Cognitive Ergonomics",
    color: "#f97316", // Orange
    assessments: [
      { name: "Lab Reports", weight: 25 },
      { name: "Design Project", weight: 35 },
      { name: "Final Exam", weight: 40 },
    ]
  },
  {
    course_code: "SYDE 283",
    course_name: "Mechanical Systems",
    color: "#22c55e", // Green
    assessments: [
      { name: "Problem Sets", weight: 10 },
      { name: "Midterm", weight: 30 },
      { name: "Final Exam", weight: 60 },
    ]
  },
  {
    course_code: "SYDE 182",
    course_name: "Economics",
    color: "#ec4899", // Pink
    assessments: [
      { name: "Quizzes", weight: 20 },
      { name: "Midterm", weight: 30 },
      { name: "Final Exam", weight: 50 },
    ]
  }
];

export async function seedUserCourses() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Unauthorized");

  // 1. Loop through the template and insert data
  for (const course of MASTER_COURSES) {
    // Insert Course
    const { data: newCourse, error: courseError } = await supabase
      .from("courses")
      .insert({
        user_id: user.id,
        course_code: course.course_code,
        course_name: course.course_name,
        color: course.color,
      })
      .select()
      .single();

    if (courseError || !newCourse) {
        console.error("Error seeding course:", course.course_code, courseError);
        continue;
    }

    // Prepare Assessments Payload
    const assessmentsPayload = course.assessments.map(a => ({
      course_id: newCourse.id,
      user_id: user.id, // Explicitly linking to user for RLS
      name: a.name,
      weight: a.weight,
      total_marks: 100,
      score: null,      // Empty by default
      is_completed: false,
      // Default due date: 1 month from now (placeholder)
      due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString() 
    }));

    // Insert Assessments
    const { error: assessError } = await supabase
      .from("assessments")
      .insert(assessmentsPayload);
      
    if (assessError) console.error("Error seeding assessments:", assessError);
  }

  // 2. Return Success (No Revalidate Needed)
  // The page that calls this function performs a redirect, which forces a fresh fetch automatically.
  return { success: true };
}