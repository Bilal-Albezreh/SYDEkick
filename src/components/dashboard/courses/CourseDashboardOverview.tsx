"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { GraduationCap, CheckCircle2, AlertTriangle } from "lucide-react";

// Types matching Supabase response
interface Assessment {
    id: string;
    name: string;
    due_date: string | null;
    weight: number;
    is_completed: boolean;
    score?: number | null;
    total_marks?: number;
    courseId: string;
    courseCode: string;
    courseColor: string;
}

interface Course {
    id: string;
    course_code: string;
    course_name: string;
    color: string;
    credits: number;
    // current_grade is calculated client side
    assessments?: {
        id: string;
        name: string;
        due_date: string | null;
        weight: number;
        is_completed: boolean;
        score?: number | null;
        total_marks?: number;
    }[];
}

interface CourseDashboardOverviewProps {
    courses: Course[];
}

export default function CourseDashboardOverview({ courses }: CourseDashboardOverviewProps) {
    // --- 1. Data Processing ---

    // Calculate grades for each course
    const coursesWithGrades = useMemo(() => {
        return courses.map(course => {
            let currentGrade = undefined;
            if (course.assessments && course.assessments.length > 0) {
                let totalWeight = 0;
                let earnedWeight = 0;
                let hasGrades = false;

                course.assessments.forEach(a => {
                    if (a.is_completed && a.score !== null && a.score !== undefined) {
                        const totalMarks = a.total_marks || 100;
                        const weight = a.weight || 0;
                        if (weight > 0) {
                            earnedWeight += (a.score / totalMarks) * weight;
                            totalWeight += weight;
                            hasGrades = true;
                        }
                    }
                });

                if (hasGrades && totalWeight > 0) {
                    // Normalize to percentage of completed weight
                    currentGrade = (earnedWeight / totalWeight) * 100;
                }
            }
            return { ...course, calculatedGrade: currentGrade };
        });
    }, [courses]);

    // Flatten and process assessments
    const upcomingAssessments = useMemo(() => {
        const all: Assessment[] = [];
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Start of today

        courses.forEach(c => {
            if (c.assessments) {
                c.assessments.forEach(a => {
                    // Only include future or today's incomplete assessments
                    if (a.due_date) {
                        const d = new Date(a.due_date);
                        // User wants "Immediate Priorities" -> likely future items.
                        if (d >= now && !a.is_completed) {
                            all.push({
                                id: a.id,
                                name: a.name,
                                due_date: a.due_date,
                                weight: a.weight,
                                is_completed: a.is_completed,
                                score: a.score,
                                total_marks: a.total_marks,
                                courseId: c.id,
                                courseCode: c.course_code,
                                courseColor: c.color
                            });
                        }
                    }
                });
            }
        });

        // Sort by date ascending
        return all.sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()).slice(0, 5);
    }, [courses]);

    // Calculate Stats
    const stats = useMemo(() => {
        const totalCredits = courses.reduce((sum, c) => sum + (c.credits || 0.5), 0);
        const activeCourses = courses.length;
        // Next deadline
        const nextDeadline = upcomingAssessments.length > 0 ? new Date(upcomingAssessments[0].due_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "None";

        return { totalCredits, activeCourses, nextDeadline };
    }, [courses, upcomingAssessments]);

    // --- 2. Empty State (If no assessments at all) ---
    const isAllClear = upcomingAssessments.length === 0;

    return (
        <div className="h-full flex flex-col gap-6">

            {/* --- HEADER STATS --- */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-950/50 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-2xl font-bold text-white mb-1">{stats.totalCredits}</span>
                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Total Credits</span>
                </div>
                <div className="bg-zinc-950/50 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-2xl font-bold text-white mb-1">{stats.activeCourses}</span>
                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Active Courses</span>
                </div>
                <div className="bg-zinc-950/50 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-2xl font-bold text-white mb-1">{stats.nextDeadline}</span>
                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Next Deadline</span>
                </div>
            </div>

            {/* --- MAIN GRID --- */}
            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">

                {/* LEFT COLUMN: Immediate Priorities (Timeline) */}
                <div className="col-span-12 lg:col-span-5 flex flex-col min-h-0">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Immediate Priorities</h2>
                    </div>

                    <div className="flex-1 bg-zinc-950/30 backdrop-blur-xl border border-white/5 rounded-2xl p-4 overflow-y-auto custom-scrollbar space-y-3">
                        {isAllClear ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                                <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
                                <p className="text-zinc-400 font-medium">All Systems Clear</p>
                                <p className="text-xs text-zinc-600 mt-1">No upcoming assessments found.</p>
                            </div>
                        ) : (
                            upcomingAssessments.map((item) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="group relative bg-zinc-900/40 hover:bg-zinc-900/60 border border-white/5 hover:border-white/10 rounded-xl p-3 flex items-center gap-4 transition-all"
                                >
                                    {/* Color Bar */}
                                    <div className="w-1 self-stretch rounded-full" style={{ backgroundColor: item.courseColor }} />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/5">
                                                {item.courseCode}
                                            </span>
                                            <span className="text-xs font-mono text-zinc-500">
                                                {new Date(item.due_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-medium text-white truncate">{item.name}</h3>
                                        <div className="mt-1 flex items-center gap-2">
                                            <span className="text-xs text-zinc-500">Weight: {item.weight}%</span>
                                        </div>
                                    </div>

                                    {/* Glow on Hover */}
                                    <div
                                        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                                        style={{ boxShadow: `inset 0 0 20px ${item.courseColor}10` }}
                                    />
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Module Status (Grid) */}
                <div className="col-span-12 lg:col-span-7 flex flex-col min-h-0">
                    <div className="flex items-center gap-2 mb-4">
                        <GraduationCap className="w-4 h-4 text-indigo-500" />
                        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Module Status</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto pr-1 custom-scrollbar">
                        {coursesWithGrades.map((course) => (
                            <div
                                key={course.id}
                                className="group relative bg-zinc-950/30 backdrop-blur-md border border-white/5 hover:border-white/10 rounded-2xl p-4 flex flex-col justify-between aspect-[4/3] transition-all hover:scale-[1.02] hover:-translate-y-1"
                            >
                                {/* Background Glow */}
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                                    style={{ background: `radial-gradient(circle at top right, ${course.color}20, transparent 70%)` }}
                                />

                                <div className="relative z-10 flex justify-between items-start">
                                    <span className="text-lg font-bold text-white tracking-tight">{course.course_code}</span>
                                    <div
                                        className="w-2 h-2 rounded-full shadow-[0_0_8px]"
                                        style={{ backgroundColor: course.color, boxShadow: `0 0 10px ${course.color}` }}
                                    />
                                </div>

                                <div className="relative z-10">
                                    <div className="flex items-end gap-1 mb-1">
                                        <span className="text-2xl font-bold text-white">
                                            {course.calculatedGrade ? `${Math.round(course.calculatedGrade)}%` : "--"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-zinc-500">
                                        <span>Grade</span>
                                        <span>{course.credits} Credits</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
