"use server";

import { createClient } from "@/utils/supabase/server";

export async function seedCourses(force: boolean = false) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  // --- SAFETY NET 1: PERMISSION CHECK ---
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_approved")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_approved) {
    return { error: "Forbidden: Account not approved." };
  }
  // --------------------------------------

  // 1. SAFETY CHECK (Existing Logic)
  if (!force) {
    const { count } = await supabase
      .from("courses")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (count && count > 0) {
      return { success: true, message: "Data already exists. Skipping." };
    }
  }

  // 2. CLEAR EXISTING DATA
  // thanks to ON DELETE CASCADE (Part 1), we only need to delete the parent!
  if (force) {
    await supabase.from("courses").delete().eq("user_id", user.id);
  }

  // 3. DEFINE COURSES
  const courses = [
    // --- SYDE 285 ---
    {
      course_code: "SYDE 285",
      course_name: "Material Chemistry",
      color: "#be185d",
      assessments: [
        { name: "Assignment 1", weight: 1.5, due_date: "2026-01-25" },
        { name: "Quiz 1", weight: 1, due_date: "2026-01-25" },
        { name: "Assignment 2", weight: 1.5, due_date: "2026-02-08" },
        { name: "Quiz 2", weight: 1, due_date: "2026-02-08" },
        { name: "Midterm Exam", weight: 20, due_date: "2026-02-27" },
        { name: "Assignment 3", weight: 1.5, due_date: "2026-03-08" },
        { name: "Quiz 3", weight: 1, due_date: "2026-03-08" },
        { name: "Assignment 4", weight: 1.5, due_date: "2026-03-15" },
        { name: "Quiz 4", weight: 1, due_date: "2026-03-15" },
        { name: "Case Studies / Tutorials", weight: 10, due_date: "2026-04-05" },
        { name: "Term Project", weight: 15, due_date: "2026-04-08" },
        { name: "Final Exam", weight: 45, due_date: "2026-04-20" },
      ]
    },
    // --- SYDE 283 ---
    {
      course_code: "SYDE 283",
      course_name: "Physics 2: Information Systems",
      color: "#eab308",
      assessments: [
        { name: "Topic Mastery 1", weight: 2, due_date: "2026-01-12" },
        { name: "Topic Mastery 2", weight: 2, due_date: "2026-01-19" },
        { name: "Topic Mastery 3", weight: 2, due_date: "2026-01-26" },
        { name: "Unit Test 1", weight: 20, due_date: "2026-02-02" },
        { name: "Topic Mastery 4", weight: 2, due_date: "2026-02-05" },
        { name: "Topic Mastery 5", weight: 2, due_date: "2026-02-09" },
        { name: "Mini-Project Proposal", weight: 0, due_date: "2026-02-13" },
        { name: "Topic Mastery 6", weight: 2, due_date: "2026-02-27" },
        { name: "Topic Mastery 7", weight: 2, due_date: "2026-03-06" },
        { name: "Unit Test 2", weight: 20, due_date: "2026-03-13" },
        { name: "Topic Mastery 8", weight: 2, due_date: "2026-03-16" },
        { name: "Topic Mastery 9", weight: 2, due_date: "2026-03-20" },
        { name: "Topic Mastery 10", weight: 2, due_date: "2026-03-27" },
        { name: "Mini-Project Final", weight: 10, due_date: "2026-04-03" },
        { name: "Topic Mastery 11", weight: 2, due_date: "2026-04-06" },
        { name: "Unit Test 3 (Final)", weight: 30, due_date: "2026-04-10" },
      ]
    },
    // --- SYDE 261 ---
    {
      course_code: "SYDE 261",
      course_name: "Societal Systems Design",
      color: "#10b981",
      assessments: [
        { name: "Reflection 1", weight: 1, due_date: "2026-01-09" },
        { name: "Reflection 2", weight: 1, due_date: "2026-01-16" },
        { name: "Reflection 3", weight: 1, due_date: "2026-01-23" },
        { name: "Reflection 4", weight: 1, due_date: "2026-01-30" },
        { name: "Reflection 5", weight: 1, due_date: "2026-02-06" },
        { name: "W08 Test (Midterm)", weight: 20, due_date: "2026-02-24" },
        { name: "Reflection 6", weight: 1, due_date: "2026-03-06" },
        { name: "Reflection 7", weight: 1, due_date: "2026-03-13" },
        { name: "Reflection 8", weight: 1, due_date: "2026-03-20" },
        { name: "W12 Test (Final)", weight: 20, due_date: "2026-03-24" },
        { name: "Reflection 9", weight: 1, due_date: "2026-03-27" },
        { name: "System Advocacy Project", weight: 30, due_date: "2026-04-03" },
        { name: "Reflection 10", weight: 1, due_date: "2026-04-03" },
        { name: "Participation: Take Note", weight: 10, due_date: "2026-04-06" },
        { name: "Participation: Circle", weight: 10, due_date: "2026-04-06" },
      ]
    },
    // --- SYDE 211 ---
    {
      course_code: "SYDE 211",
      course_name: "Advanced Calculus",
      color: "#06b6d4",
      assessments: [
        { name: "Quiz 1", weight: 6.25, due_date: "2026-01-22" },
        { name: "Quiz 2", weight: 6.25, due_date: "2026-01-29" },
        { name: "Quiz 3", weight: 6.25, due_date: "2026-02-12" },
        { name: "Midterm Exam", weight: 30, due_date: "2026-03-02" },
        { name: "Quiz 4", weight: 6.25, due_date: "2026-03-12" },
        { name: "Quiz 5", weight: 6.25, due_date: "2026-03-26" },
        { name: "Final Exam", weight: 45, due_date: "2026-04-15" },
      ]
    },
    // --- SYDE 182 ---
    {
      course_code: "SYDE 182",
      course_name: "Dynamics",
      color: "#8b5cf6",
      assessments: [
        { name: "Quiz 1", weight: 15, due_date: "2026-01-29" },
        { name: "Midterm Exam", weight: 35, due_date: "2026-02-26" },
        { name: "Quiz 2", weight: 15, due_date: "2026-03-19" },
        { name: "Final Exam", weight: 35, due_date: "2026-04-20" },
      ]
    },
    // --- SYDE 263 ---
    {
      course_code: "SYDE 263",
      course_name: "Design Workshops (Labs)",
      color: "#f97316",
      assessments: [
        { name: "Safety Training", weight: 0, due_date: "2026-01-09" },
        { name: "Lab 1: CAD (Req)", weight: 10, due_date: "2026-01-23" },
        { name: "Lab 2: Reverse Eng (Opt)", weight: 0, due_date: "2026-01-30" },
        { name: "Lab 3: Sensors (Req)", weight: 10, due_date: "2026-02-06" },
        { name: "Intro Fabrication Project", weight: 10, due_date: "2026-02-06" },
        { name: "Final Project Interim 1", weight: 0, due_date: "2026-02-13" },
        { name: "Lab 5: Actuators (Req)", weight: 10, due_date: "2026-02-27" },
        { name: "Lab 6: Embedded (Req)", weight: 10, due_date: "2026-03-06" },
        { name: "Final Project Interim 2", weight: 0, due_date: "2026-03-13" },
        { name: "Lab 7: 3D Printing (Opt)", weight: 0, due_date: "2026-03-13" },
        { name: "Lab 8: Sourcing (Opt)", weight: 0, due_date: "2026-03-20" },
        { name: "Lab Practice & Safety", weight: 10, due_date: "2026-04-03" },
        { name: "Final Project", weight: 40, due_date: "2026-04-03" },
      ]
    }
  ];

  // 4. INSERT DATA
  for (const course of courses) {
    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .insert({
        user_id: user.id,
        course_code: course.course_code,
        course_name: course.course_name,
        color: course.color,
      })
      .select()
      .single();

    if (courseError) {
      console.error("Failed to insert course:", course.course_code, courseError);
      continue;
    }

    if (courseData) {
      const assessmentsWithIds = course.assessments.map((a) => ({
        user_id: user.id, // <--- THIS WAS MISSING
        course_id: courseData.id,
        name: a.name,
        weight: a.weight,
        due_date: a.due_date,
        score: null,
      }));

      const { error: assessError } = await supabase.from("assessments").insert(assessmentsWithIds);
      
      if (assessError) {
         console.error("Failed to insert assessments for:", course.course_code, assessError);
      }
    }
  }

  return { success: true };
}