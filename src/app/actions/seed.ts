"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * REWRITTEN Seed Script for Phase 2 (Term-Based Architecture)
 * 
 * This function:
 * 1. Creates a "Winter 2026" term for the user (if not exists)
 * 2. Inserts SYDE 2B courses linked to that term
 * 3. Inserts assessments for each course
 */
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

  // ==========================================
  // STEP 1: CREATE OR GET WINTER 2026 TERM
  // ==========================================

  let termId: string;

  // Check if user already has a "Winter 2026" term
  const { data: existingTerm } = await supabase
    .from("terms")
    .select("id")
    .eq("user_id", user.id)
    .eq("season", "Winter 2026")
    .maybeSingle();

  if (existingTerm) {
    termId = existingTerm.id;
    console.log("✅ Using existing Winter 2026 term:", termId);
  } else {
    // Create new term
    const { data: newTerm, error: termError } = await supabase
      .from("terms")
      .insert({
        user_id: user.id,
        label: "2B",
        season: "Winter 2026",
        start_date: "2026-01-05",
        end_date: "2026-04-30",
        is_current: true,
      })
      .select("id")
      .single();

    if (termError) {
      console.error("❌ Failed to create term:", termError);
      return { error: `Failed to create term: ${termError.message}` };
    }

    termId = newTerm.id;
    console.log("✅ Created new Winter 2026 term:", termId);
  }

  // ==========================================
  // STEP 2: CLEAR EXISTING DATA (if force)
  // ==========================================

  if (force) {
    // Delete courses for this term (assessments cascade)
    const { error: deleteError } = await supabase
      .from("courses")
      .delete()
      .eq("user_id", user.id)
      .eq("term_id", termId);

    if (deleteError) {
      console.error("⚠️ Failed to clear existing courses:", deleteError);
    } else {
      console.log("🗑️ Cleared existing courses for term");
    }
  } else {
    // Safety check - if courses exist, skip
    const { count } = await supabase
      .from("courses")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("term_id", termId);

    if (count && count > 0) {
      return { success: true, message: "Courses already exist for this term. Use force=true to override." };
    }
  }

  // ==========================================
  // STEP 3: INSERT COURSES & ASSESSMENTS
  // ==========================================

  const courses = [
    {
      course_code: "SYDE 285",
      course_name: "Material Chemistry",
      name: "Material Chemistry", // Add name field
      color: "#be185d",
      assessments: [
        { name: "Assignment 1", weight: 1.5, due_date: "2026-01-25T12:00:00Z" },
        { name: "Quiz 1", weight: 1, due_date: "2026-01-25T12:00:00Z" },
        { name: "Assignment 2", weight: 1.5, due_date: "2026-02-08T12:00:00Z" },
        { name: "Quiz 2", weight: 1, due_date: "2026-02-08T12:00:00Z" },
        { name: "Midterm Exam", weight: 20, due_date: "2026-02-27T12:00:00Z" },
        { name: "Assignment 3", weight: 1.5, due_date: "2026-03-08T12:00:00Z" },
        { name: "Quiz 3", weight: 1, due_date: "2026-03-08T12:00:00Z" },
        { name: "Assignment 4", weight: 1.5, due_date: "2026-03-15T12:00:00Z" },
        { name: "Quiz 4", weight: 1, due_date: "2026-03-15T12:00:00Z" },
        { name: "Case Studies / Tutorials", weight: 10, due_date: "2026-04-05T12:00:00Z" },
        { name: "Term Project", weight: 15, due_date: "2026-04-08T12:00:00Z" },
        { name: "Final Exam", weight: 45, due_date: "2026-04-20T12:00:00Z" },
      ]
    },
    {
      course_code: "SYDE 283",
      course_name: "Physics 2: Information Systems",
      name: "Physics 2: Information Systems",
      color: "#eab308",
      assessments: [
        { name: "Topic Mastery 1", weight: 2, due_date: "2026-01-12T12:00:00Z" },
        { name: "Topic Mastery 2", weight: 2, due_date: "2026-01-19T12:00:00Z" },
        { name: "Topic Mastery 3", weight: 2, due_date: "2026-01-26T12:00:00Z" },
        { name: "Unit Test 1", weight: 20, due_date: "2026-02-02T12:00:00Z" },
        { name: "Topic Mastery 4", weight: 2, due_date: "2026-02-05T12:00:00Z" },
        { name: "Topic Mastery 5", weight: 2, due_date: "2026-02-09T12:00:00Z" },
        { name: "Mini-Project Proposal", weight: 0, due_date: "2026-02-13T12:00:00Z" },
        { name: "Topic Mastery 6", weight: 2, due_date: "2026-02-27T12:00:00Z" },
        { name: "Topic Mastery 7", weight: 2, due_date: "2026-03-06T12:00:00Z" },
        { name: "Unit Test 2", weight: 20, due_date: "2026-03-13T12:00:00Z" },
        { name: "Topic Mastery 8", weight: 2, due_date: "2026-03-16T12:00:00Z" },
        { name: "Topic Mastery 9", weight: 2, due_date: "2026-03-20T12:00:00Z" },
        { name: "Topic Mastery 10", weight: 2, due_date: "2026-03-27T12:00:00Z" },
        { name: "Mini-Project Final", weight: 10, due_date: "2026-04-03T12:00:00Z" },
        { name: "Topic Mastery 11", weight: 2, due_date: "2026-04-06T12:00:00Z" },
        { name: "Unit Test 3 (Final)", weight: 30, due_date: "2026-04-10T12:00:00Z" },
      ]
    },
    {
      course_code: "SYDE 261",
      course_name: "Societal Systems Design",
      name: "Societal Systems Design",
      color: "#10b981",
      assessments: [
        { name: "Reflection 1", weight: 1, due_date: "2026-01-09T12:00:00Z" },
        { name: "Reflection 2", weight: 1, due_date: "2026-01-16T12:00:00Z" },
        { name: "Reflection 3", weight: 1, due_date: "2026-01-23T12:00:00Z" },
        { name: "Reflection 4", weight: 1, due_date: "2026-01-30T12:00:00Z" },
        { name: "Reflection 5", weight: 1, due_date: "2026-02-06T12:00:00Z" },
        { name: "W08 Test (Midterm)", weight: 20, due_date: "2026-02-24T12:00:00Z" },
        { name: "Reflection 6", weight: 1, due_date: "2026-03-06T12:00:00Z" },
        { name: "Reflection 7", weight: 1, due_date: "2026-03-13T12:00:00Z" },
        { name: "Reflection 8", weight: 1, due_date: "2026-03-20T12:00:00Z" },
        { name: "W12 Test (Final)", weight: 20, due_date: "2026-03-24T12:00:00Z" },
        { name: "Reflection 9", weight: 1, due_date: "2026-03-27T12:00:00Z" },
        { name: "System Advocacy Project", weight: 30, due_date: "2026-04-03T12:00:00Z" },
        { name: "Reflection 10", weight: 1, due_date: "2026-04-03T12:00:00Z" },
        { name: "Participation: Take Note", weight: 10, due_date: "2026-04-06T12:00:00Z" },
        { name: "Participation: Circle", weight: 10, due_date: "2026-04-06T12:00:00Z" },
      ]
    },
    {
      course_code: "SYDE 211",
      course_name: "Advanced Calculus",
      name: "Advanced Calculus",
      color: "#06b6d4",
      assessments: [
        { name: "Quiz 1", weight: 6.25, due_date: "2026-01-22T12:00:00Z" },
        { name: "Quiz 2", weight: 6.25, due_date: "2026-01-29T12:00:00Z" },
        { name: "Quiz 3", weight: 6.25, due_date: "2026-02-12T12:00:00Z" },
        { name: "Midterm Exam", weight: 30, due_date: "2026-03-02T12:00:00Z" },
        { name: "Quiz 4", weight: 6.25, due_date: "2026-03-12T12:00:00Z" },
        { name: "Quiz 5", weight: 6.25, due_date: "2026-03-26T12:00:00Z" },
        { name: "Final Exam", weight: 45, due_date: "2026-04-15T12:00:00Z" },
      ]
    },
    {
      course_code: "SYDE 182",
      course_name: "Dynamics",
      name: "Dynamics",
      color: "#8b5cf6",
      assessments: [
        { name: "Quiz 1", weight: 15, due_date: "2026-01-29T12:00:00Z" },
        { name: "Midterm Exam", weight: 35, due_date: "2026-02-26T12:00:00Z" },
        { name: "Quiz 2", weight: 15, due_date: "2026-03-19T12:00:00Z" },
        { name: "Final Exam", weight: 35, due_date: "2026-04-20T12:00:00Z" },
      ]
    },
    {
      course_code: "SYDE 263",
      course_name: "Design Workshops (Labs)",
      name: "Design Workshops (Labs)",
      color: "#f97316",
      assessments: [
        { name: "Safety Training", weight: 0, due_date: "2026-01-09T12:00:00Z" },
        { name: "Lab 1: CAD (Req)", weight: 10, due_date: "2026-01-23T12:00:00Z" },
        { name: "Lab 2: Reverse Eng (Opt)", weight: 0, due_date: "2026-01-30T12:00:00Z" },
        { name: "Lab 3: Sensors (Req)", weight: 10, due_date: "2026-02-06T12:00:00Z" },
        { name: "Intro Fabrication Project", weight: 10, due_date: "2026-02-06T12:00:00Z" },
        { name: "Final Project Interim 1", weight: 0, due_date: "2026-02-13T12:00:00Z" },
        { name: "Lab 5: Actuators (Req)", weight: 10, due_date: "2026-02-27T12:00:00Z" },
        { name: "Lab 6: Embedded (Req)", weight: 10, due_date: "2026-03-06T12:00:00Z" },
        { name: "Final Project Interim 2", weight: 0, due_date: "2026-03-13T12:00:00Z" },
        { name: "Lab 7: 3D Printing (Opt)", weight: 0, due_date: "2026-03-13T12:00:00Z" },
        { name: "Lab 8: Sourcing (Opt)", weight: 0, due_date: "2026-03-20T12:00:00Z" },
        { name: "Lab Practice & Safety", weight: 10, due_date: "2026-04-03T12:00:00Z" },
        { name: "Final Project", weight: 40, due_date: "2026-04-03T12:00:00Z" },
      ]
    }
  ];

  let successCount = 0;
  let failCount = 0;

  for (const course of courses) {
    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .insert({
        user_id: user.id,
        term_id: termId, // ✅ NOW LINKED TO TERM
        course_code: course.course_code,
        name: course.name,
        color: course.color,
      })
      .select()
      .single();

    if (courseError) {
      console.error(`❌ Failed to insert course: ${course.course_code}`, courseError);
      failCount++;
      continue;
    }

    if (courseData) {
      const assessmentsWithIds = course.assessments.map((a) => ({
        user_id: user.id,
        course_id: courseData.id,
        name: a.name,
        weight: a.weight,
        due_date: a.due_date,
        score: null,
        is_completed: false,
      }));

      const { error: assessError } = await supabase
        .from("assessments")
        .insert(assessmentsWithIds);

      if (assessError) {
        console.error(`❌ Failed to insert assessments for: ${course.course_code}`, assessError);
        failCount++;
      } else {
        console.log(`✅ Seeded ${course.course_code} with ${course.assessments.length} assessments`);
        successCount++;
      }
    }
  }

  return {
    success: true,
    message: `Seeded ${successCount} courses (${failCount} failed) for Winter 2026 term`,
    termId
  };
}