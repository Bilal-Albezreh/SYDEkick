"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { updateAssessmentScore } from "@/app/actions/index";
import { Loader2, RotateCcw, BarChart3, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine, Cell } from "recharts";
import { LayoutGroup } from "framer-motion";
import TermAverageBadge from "@/components/grades/TermAverageBadge";
import CountUp from "@/components/ui/CountUp";
import ElectricBorder from "@/components/ui/ElectricBorder";

// --- RULES ENGINE CONFIGURATION ---
const COURSE_RULES: Record<string, any[]> = {
  "SYDE 211": [
    {
      type: "DROP_LOWEST",
      pattern: /Quiz/i,
      keepTop: 4
    }
  ],
  "SYDE 283": [
    {
      type: "DROP_LOWEST",
      pattern: /Topic Mastery/i,
      keepTop: 10
    },
    {
      type: "DYNAMIC_WEIGHT",
      pattern: /Unit Test/i,
      weights: [30, 20, 20]
    }
  ],
  "SYDE 263": [
    {
      type: "EXCLUDE_FROM_GPA" // <--- NEW RULE
    }
  ]
};

export default function GradeCalculator({ initialData }: { initialData: any[] }) {
  // 1. Initialize State
  const [courses, setCourses] = useState<any[]>(initialData || []);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialData?.[0]?.id || "");
  const [viewMode, setViewMode] = useState<"overview" | "detail">("overview");
  const [isHypothetical, setIsHypothetical] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedSimCourse, setSelectedSimCourse] = useState<string | null>(null);
  const [simSliderValue, setSimSliderValue] = useState(70);

  useEffect(() => {
    if (initialData) {
      setCourses(initialData);
      if (!selectedCourseId && initialData.length > 0) {
        setSelectedCourseId(initialData[0].id);
      }
    }
  }, [initialData]);

  // --- LOGIC: APPLY RULES ENGINE ---
  const processAssessments = (courseCode: string, assessments: any[]) => {
    let processed = assessments.map(a => ({ ...a, effectiveWeight: a.weight, isDropped: false, isBoosted: false }));

    const rules = COURSE_RULES[courseCode];
    if (!rules) return processed;

    rules.forEach(rule => {
      // Filter items matching the rule (e.g., all "Quizzes")
      if (!rule.pattern) return; // Skip if rule doesn't have a pattern (like EXCLUDE_FROM_GPA)

      const matches = processed.filter(a => rule.pattern.test(a.name));
      if (matches.length === 0) return;

      matches.sort((a, b) => {
        const scoreA = a.score === null ? 0 : a.score;
        const scoreB = b.score === null ? 0 : b.score;
        return scoreB - scoreA;
      });

      if (rule.type === "DROP_LOWEST") {
        matches.forEach((item, index) => {
          if (index >= rule.keepTop) {
            item.effectiveWeight = 0;
            item.isDropped = true;
          }
        });
      }

      if (rule.type === "DYNAMIC_WEIGHT") {
        matches.forEach((item, index) => {
          if (rule.weights[index] !== undefined) {
            const newWeight = rule.weights[index];
            if (newWeight > item.weight) item.isBoosted = true;
            item.effectiveWeight = newWeight;
          }
        });
      }
    });

    return processed;
  };

  // --- MATH ENGINE ---
  const getCourseStats = (course: any) => {
    const rawAssessments = course.assessments || [];
    const processedAssessments = processAssessments(course.course_code, rawAssessments);

    let earnedWeight = 0;
    let attemptedWeight = 0;
    let totalPossibleWeight = 0;

    processedAssessments.forEach((a: any) => {
      totalPossibleWeight += a.effectiveWeight;
      if (a.score !== null && !a.isDropped) {
        // [FIX] Use total_marks for precision, defaulting to 100 if missing
        const maxMarks = a.total_marks || 100;
        earnedWeight += (a.score / maxMarks) * a.effectiveWeight;
        attemptedWeight += a.effectiveWeight;
      }
    });

    const average = attemptedWeight === 0 ? 0 : (earnedWeight / attemptedWeight) * 100;
    const progress = totalPossibleWeight === 0 ? 0 : (attemptedWeight / totalPossibleWeight) * 100;

    // Check if this course is Pass/Fail (Excluded from GPA)
    const rules = COURSE_RULES[course.course_code];
    const isExcluded = rules?.some(r => r.type === "EXCLUDE_FROM_GPA") || false;

    return { earnedWeight, attemptedWeight, totalPossibleWeight, average, progress, processedAssessments, isExcluded };
  };

  // --- TERM AVERAGE CALCULATION (UPDATED) ---
  const termStats = useMemo(() => {
    if (!courses.length) return { average: 0 };

    let totalAvg = 0;
    let count = 0;

    courses.forEach(c => {
      const stats = getCourseStats(c);

      // ONLY include in average if NOT excluded
      if (!stats.isExcluded) {
        totalAvg += stats.average;
        count++;
      }
    });

    return { average: count === 0 ? 0 : totalAvg / count };
  }, [courses]);

  // --- HELPER: FORMATTING ---
  const formatNum = (num: number) => {
    return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  // --- CHART DATA TRANSFORM ---
  const chartData = useMemo(() => {
    return courses.map(course => {
      const stats = getCourseStats(course);
      let locked = 0;
      let lost = 0;
      let remaining = 0;

      stats.processedAssessments.forEach((assess: any) => {
        const weight = assess.effectiveWeight;
        if (assess.isDropped) return;

        const maxMarks = assess.total_marks || 100;

        if (assess.score !== null) {
          locked += (assess.score / maxMarks) * weight;
          lost += ((maxMarks - assess.score) / maxMarks) * weight;
        } else {
          remaining += weight;
        }
      });

      return {
        name: course.course_code,
        courseId: course.id,
        color: course.color || '#6366f1',
        locked: Math.round(locked * 100) / 100,
        remaining: Math.round(remaining * 100) / 100,
        lost: Math.round(lost * 100) / 100,
        isExcluded: stats.isExcluded,
      };
    });
  }, [courses, initialData]);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const selectedCourseStats = selectedCourse ? getCourseStats(selectedCourse) : null;

  // --- STABLE SORTING LOGIC ---
  const sortedAssessments = useMemo(() => {
    if (!selectedCourseStats) return [];
    return [...selectedCourseStats.processedAssessments].sort((a, b) => {
      const dateA = a.due_date ? new Date(a.due_date).getTime() : null;
      const dateB = b.due_date ? new Date(b.due_date).getTime() : null;
      const validA = dateA !== null && !isNaN(dateA);
      const validB = dateB !== null && !isNaN(dateB);

      if (!validA && validB) return 1;
      if (validA && !validB) return -1;
      if (validA && validB && dateA !== dateB) return dateA - dateB;
      return (a.name || "").localeCompare(b.name || "", undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [selectedCourseStats]);


  const getGradeColor = (stats: any) => {
    if (stats.isExcluded) return "text-blue-400"; // Pass/Fail Color
    if (stats.progress > 40 && stats.average < 50) return "text-red-500";
    if (stats.average >= 80) return "text-green-500";
    return "text-white";
  };

  // --- HANDLERS ---
  const handleModeToggle = (checked: boolean) => {
    setIsHypothetical(checked);
    if (!checked) setCourses(initialData);
  };

  const handleScoreChange = async (assessmentId: string, newVal: string, totalMarks: number = 100) => {
    if (newVal === "") {
      updateLocalState(assessmentId, null);
      if (!isHypothetical) syncToDb(assessmentId, null);
      return;
    }
    const numVal = parseFloat(newVal);
    // [FIX] Validate against total_marks instead of hardcoded 100
    if (isNaN(numVal) || numVal < 0 || numVal > totalMarks) return;

    updateLocalState(assessmentId, numVal);
    if (!isHypothetical) syncToDb(assessmentId, numVal);
  };

  const updateLocalState = (id: string, val: number | null) => {
    setCourses((prev) =>
      prev.map((c) => ({
        ...c,
        assessments: c.assessments.map((a: any) =>
          a.id === id ? { ...a, score: val } : a
        ),
      }))
    );
  };

  const syncToDb = async (id: string, val: number | null) => {
    setLoadingId(id);
    try { await updateAssessmentScore(id, val); }
    catch (error) { console.error("Failed to save", error); }
    finally { setLoadingId(null); }
  };

  const resetHypothetical = () => { setCourses(initialData); };

  if (!courses.length) return <div className="text-gray-500">No courses found.</div>;

  const hasGradedData = courses.some(c => {
    const assessments = (c.assessments || []) as any[];
    return assessments.some((a: any) => a.score !== null);
  });

  return (
    <LayoutGroup>
      <div className="flex flex-col gap-6 h-full">
        <style jsx>{`
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; margin: 0; 
        }
        input[type=number] { -moz-appearance: textfield; }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px; height: 18px;
          border-radius: 50%;
          background: white;
          border: 2px solid rgba(255,255,255,0.3);
          box-shadow: 0 0 10px rgba(255,255,255,0.3);
          cursor: pointer;
        }
        input[type=range]::-moz-range-thumb {
          width: 18px; height: 18px;
          border-radius: 50%;
          background: white;
          border: 2px solid rgba(255,255,255,0.3);
          box-shadow: 0 0 10px rgba(255,255,255,0.3);
          cursor: pointer;
        }
      `}</style>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" style={{ minHeight: '650px', height: 'calc(100% - 1rem)' }}>
          {/* SIDEBAR */}
          <div className="lg:col-span-1 bg-black/30 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-800 bg-white/[0.02]">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Navigation</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <button onClick={() => setViewMode("overview")} className={cn("w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all border-l-4", viewMode === "overview" ? "border-cyan-500 bg-gradient-to-r from-cyan-500/10 to-transparent text-cyan-400 font-bold" : "border-transparent text-gray-400 hover:bg-white/5")}>
                <BarChart3 className="w-4 h-4" /><span>Term Overview</span>
              </button>
              <div className="h-px bg-gray-800 my-2 mx-2" />
              {courses.map((course) => {
                const stats = getCourseStats(course);
                const isSelected = viewMode === "detail" && selectedCourseId === course.id;
                return (
                  <button key={course.id} onClick={() => { setSelectedCourseId(course.id); setViewMode("detail"); }} className={cn("w-full flex items-center justify-between p-3 rounded-lg text-left transition-all border-l-4 group", isSelected ? "border-cyan-500 bg-gradient-to-r from-cyan-500/10 to-transparent" : "border-transparent hover:bg-white/5 text-gray-400")}>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-1.5 h-8 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                        style={{ backgroundColor: course.color }}
                      />
                      <div className="min-w-0">
                        <div className={cn("font-bold text-sm truncate transition-colors", isSelected ? "text-white" : "text-gray-300 group-hover:text-white")}>{course.course_code}</div>
                      </div>
                    </div>
                    <div className={cn("text-sm font-mono font-bold", getGradeColor(stats))}>
                      {stats.isExcluded ? "P/F" : `${formatNum(stats.average)}%`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* VIEW AREA */}
          <div className="lg:col-span-3 bg-black/30 backdrop-blur-md border border-white/10 rounded-xl flex flex-col overflow-hidden relative">
            {viewMode === "overview" && (
              <div className="absolute inset-0 overflow-y-auto p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col">
                {/* ── Hero Term Average Badge ── */}
                <div className="mb-4">
                  <TermAverageBadge variant="hero" average={termStats.average} hasData={hasGradedData} />
                </div>

                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2"><BarChart3 className="w-6 h-6 text-gray-400" /> Term Breakdown</h2>
                </div>

                <div className="flex-1 min-h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={{ left: 0, right: 30, top: 10, bottom: 10 }}
                    >
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis dataKey="name" type="category" width={80} tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }} />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                        wrapperStyle={{ pointerEvents: 'none' }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0]?.payload;
                          if (!d) return null;
                          return (
                            <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl min-w-[200px]">
                              <div className="text-sm font-bold text-white mb-2" style={{ color: d.color }}>{d.name}</div>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between"><span className="text-green-400">✓ Secured</span><span className="text-white font-mono font-bold">{formatNum(d.locked)}%</span></div>
                                <div className="flex justify-between"><span className="text-red-400">✗ Lost</span><span className="text-white font-mono font-bold">{formatNum(d.lost)}%</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">◻ Remaining</span><span className="text-white font-mono font-bold">{formatNum(d.remaining)}%</span></div>
                              </div>
                              <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-gray-500 text-center">Click to simulate</div>
                            </div>
                          );
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="circle" />
                      <ReferenceLine x={50} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideBottom', value: '50% PASS', fill: '#ef4444', fontSize: 10, fontWeight: 'bold', dy: 15 }} />
                      <ReferenceLine x={80} stroke="#22c55e" strokeDasharray="3 3" label={{ position: 'insideBottom', value: '80% GOAL', fill: '#22c55e', fontSize: 10, fontWeight: 'bold', dy: 15 }} />
                      <Bar name="Secured" dataKey="locked" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} barSize={30} cursor="pointer" onClick={(data: any) => { setSelectedSimCourse(data.courseId); setSimSliderValue(70); }}>
                        {chartData.map((entry: any, index: number) => (
                          <Cell key={index} fillOpacity={selectedSimCourse && entry.courseId !== selectedSimCourse ? 0.2 : 1} />
                        ))}
                      </Bar>
                      <Bar name="Potential" dataKey="remaining" stackId="a" fill="#374151" radius={[0, 0, 0, 0]} barSize={30} cursor="pointer" onClick={(data: any) => { setSelectedSimCourse(data.courseId); setSimSliderValue(70); }}>
                        {chartData.map((entry: any, index: number) => (
                          <Cell key={index} fillOpacity={selectedSimCourse && entry.courseId !== selectedSimCourse ? 0.2 : 1} />
                        ))}
                      </Bar>
                      <Bar name="Lost" dataKey="lost" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={30} cursor="pointer" onClick={(data: any) => { setSelectedSimCourse(data.courseId); setSimSliderValue(70); }}>
                        {chartData.map((entry: any, index: number) => (
                          <Cell key={index} fillOpacity={selectedSimCourse && entry.courseId !== selectedSimCourse ? 0.12 : 0.6} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* ── Quick Simulator Module ── */}
                {(() => {
                  if (!selectedSimCourse) return null;
                  const simCourse = courses.find((c: any) => c.id === selectedSimCourse);
                  if (!simCourse) return null;
                  const simData = chartData.find((d: any) => d.courseId === selectedSimCourse);
                  if (!simData) return null;

                  const currentSecured = simData.locked;
                  const remainingWeight = simData.remaining;
                  const projectedCourseGrade = currentSecured + (simSliderValue / 100) * remainingWeight;

                  // Recalculate term GPA with this course's projected grade
                  let termTotal = 0;
                  let termCount = 0;
                  courses.forEach((c: any) => {
                    const stats = getCourseStats(c);
                    if (stats.isExcluded) return;
                    if (c.id === selectedSimCourse) {
                      const totalWeight = stats.processedAssessments
                        .filter((a: any) => !a.isDropped)
                        .reduce((sum: number, a: any) => sum + a.effectiveWeight, 0);
                      termTotal += totalWeight > 0 ? projectedCourseGrade : 0;
                    } else {
                      termTotal += stats.average;
                    }
                    termCount++;
                  });
                  const projectedTermAvg = termCount > 0 ? termTotal / termCount : 0;
                  const currentTermAvg = termStats.average;
                  const gpaDelta = projectedTermAvg - currentTermAvg;
                  const gpaGlowColor = gpaDelta >= 0 ? '#22c55e' : '#ef4444';

                  // Smart Target calculation helper
                  const calcRequired = (target: number) => {
                    if (remainingWeight <= 0) return Infinity;
                    return ((target - currentSecured) / remainingWeight) * 100;
                  };
                  const targets = [50, 70, 80, 90];

                  return (
                    <div
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        boxShadow: `0 8px 32px -12px ${simCourse.color || '#6366f1'}`,
                      }}
                      className="mt-6 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative animate-in fade-in slide-in-from-bottom-4 duration-300 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"
                    >
                      {/* Color Bleed — radial glow from top edge */}
                      <div
                        className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none"
                        style={{
                          background: `radial-gradient(ellipse at top, color-mix(in srgb, ${simCourse.color || '#6366f1'} 20%, transparent), transparent 70%)`,
                        }}
                      />
                      {/* Top-right actions */}
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => { setSelectedCourseId(simCourse.id); setViewMode("detail"); setSelectedSimCourse(null); }}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 transition-colors text-xs font-semibold text-white/70 hover:text-white"
                        >
                          Go to Course
                          <ArrowRight className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setSelectedSimCourse(null)}
                          className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Header */}
                      <div className="mb-5 flex items-center justify-between pr-28">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: simCourse.color || '#6366f1' }} />
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Quick Simulator</span>
                          </div>
                          <h3 className="text-xl font-bold text-white">
                            {simCourse.course_code}
                            <span className="text-gray-500 font-normal ml-2 text-sm">
                              — {formatNum(remainingWeight)}% remaining weight
                            </span>
                          </h3>
                        </div>
                      </div>

                      {/* ── War Room Stats Row ── */}
                      <div className="grid grid-cols-3 gap-3 mb-5">
                        <div className="bg-black/30 border border-white/5 rounded-lg px-3 py-2.5">
                          <div className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-0.5">Secured</div>
                          <div className="text-lg font-black tabular-nums text-emerald-400">{formatNum(currentSecured)}%</div>
                        </div>
                        <div className="bg-black/30 border border-white/5 rounded-lg px-3 py-2.5">
                          <div className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-0.5">Lost</div>
                          <div className="text-lg font-black tabular-nums text-rose-400">{formatNum(simData.lost)}%</div>
                        </div>
                        <div className="bg-black/30 border border-white/5 rounded-lg px-3 py-2.5">
                          <div className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-0.5">Remaining</div>
                          <div className="text-lg font-black tabular-nums text-white/60">{formatNum(remainingWeight)}%</div>
                        </div>
                      </div>

                      {/* ── Course Grade Target Buttons ── */}
                      <div className="flex items-center gap-2 mb-5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mr-1">Course Grade Target:</span>
                        {targets.map((t) => {
                          const req = calcRequired(t);
                          const impossible = req > 100;
                          const achieved = req <= 0;
                          return (
                            <button
                              key={t}
                              disabled={impossible}
                              onClick={() => setSimSliderValue(achieved ? 0 : Math.min(100, req))}
                              className={cn(
                                "px-3 py-1 rounded-full text-xs font-bold border transition-all",
                                impossible
                                  ? "border-white/5 text-gray-600 cursor-not-allowed opacity-50"
                                  : achieved
                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                    : "border-white/10 text-gray-400 hover:border-white/25 hover:text-white hover:bg-white/5"
                              )}
                            >
                              {impossible ? `${t}% ✗` : achieved ? `${t}% ✓` : `${t}%`}
                            </button>
                          );
                        })}
                        {/* Custom Target Input */}
                        <div className="ml-auto flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Custom %"
                            className="bg-black/20 border border-white/10 rounded-md px-2 py-1 text-sm w-20 text-white placeholder:text-white/30 font-mono focus:outline-none focus:border-white/25 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = parseFloat((e.target as HTMLInputElement).value);
                                if (isNaN(val)) return;
                                const req = calcRequired(val);
                                setSimSliderValue(req <= 0 ? 0 : Math.min(100, req));
                              }
                            }}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value);
                              if (isNaN(val) || e.target.value === '') return;
                              const req = calcRequired(val);
                              setSimSliderValue(req <= 0 ? 0 : Math.min(100, req));
                            }}
                          />
                        </div>
                      </div>

                      {/* Slider */}
                      <div className="mb-5">
                        <p className="text-xs text-gray-400 mb-2">
                          If you average{" "}
                          <span
                            className="text-xl font-bold font-mono mx-1"
                            style={{
                              color: simCourse.color || '#a78bfa',
                              textShadow: `0 0 16px ${simCourse.color || '#a78bfa'}99`,
                            }}
                          >
                            {Number.isInteger(simSliderValue) ? simSliderValue : simSliderValue.toFixed(2)}%
                          </span>{" "}
                          on the remaining assessments...
                        </p>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={simSliderValue}
                          onChange={(e) => setSimSliderValue(parseInt(e.target.value))}
                          className="w-full h-2 rounded-full appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, ${simCourse.color || '#6366f1'} 0%, ${simCourse.color || '#6366f1'} ${simSliderValue}%, #1f2937 ${simSliderValue}%, #1f2937 100%)`,
                          }}
                        />
                        <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                          <span>0%</span><span>50%</span><span>100%</span>
                        </div>
                      </div>

                      {/* ── Projected Numbers ── */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/30 border border-white/5 rounded-xl p-4">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Projected Course Grade</div>
                          <div
                            className="flex items-baseline text-3xl font-black tabular-nums"
                            style={{
                              color: projectedCourseGrade >= 80 ? '#22c55e' : projectedCourseGrade >= 50 ? '#eab308' : '#ef4444',
                              textShadow: `0 0 20px ${projectedCourseGrade >= 80 ? '#22c55e' : projectedCourseGrade >= 50 ? '#eab308' : '#ef4444'}66`,
                            }}
                          >
                            <CountUp to={projectedCourseGrade} duration={0.8} decimals={2} startWhen={true} />
                            <span>%</span>
                          </div>
                        </div>
                        <div className="bg-black/30 border border-white/5 rounded-xl p-4">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Projected Term Avg</div>
                          <div
                            className="flex items-baseline text-3xl font-black tabular-nums"
                            style={{ color: gpaGlowColor, textShadow: `0 0 20px ${gpaGlowColor}66` }}
                          >
                            <CountUp to={projectedTermAvg} duration={0.8} decimals={2} startWhen={true} />
                            <span>%</span>
                          </div>
                          <div className="text-xs font-mono mt-1" style={{ color: gpaGlowColor }}>
                            {gpaDelta >= 0 ? '▲' : '▼'} {formatNum(Math.abs(gpaDelta))}%
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* --- DETAIL MODE --- */}
            {viewMode === "detail" && selectedCourse && selectedCourseStats && (() => {
              const courseColor = selectedCourse.color || '#6366f1';
              const DetailContent = (
                <div className="flex flex-col h-full animate-in fade-in duration-300 relative">

                  {/* ── ATMOSPHERIC BLOOM (top-right, behind everything) ── */}
                  <div
                    className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none z-0"
                    style={{ background: courseColor, opacity: 0.12, filter: 'blur(150px)' }}
                  />

                  {/*  COMMAND MODULE HEADER  */}
                  <div className="px-6 pt-6 pb-0 shrink-0 z-10">
                    <div
                      className="relative overflow-hidden bg-white/[0.04] backdrop-blur-3xl border border-white/10 rounded-3xl p-6 mb-6 shadow-lg"
                      style={{
                        backgroundImage: `radial-gradient(circle at 0% 0%, ${courseColor}30 0%, transparent 60%)`,
                        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15)',
                      }}
                    >
                      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 w-full relative z-10">
                        {/* Left: Course identity */}
                        <div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white border border-white/10 uppercase tracking-widest">Course Detail</span>
                          <h1 className="text-3xl font-bold text-white mt-2 leading-none">{selectedCourse.course_code}</h1>
                          <p className="text-white/40 mt-0.5 text-sm">{selectedCourse.course_name}</p>
                        </div>

                        {/* Right: Stats + Simulator toggle */}
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6 w-full xl:w-auto">
                          <TermAverageBadge variant="docked" average={termStats.average} hasData={hasGradedData} />
                          <div>
                            <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Weight Achieved</div>
                            <div className="text-xl font-mono font-bold">
                              <span className="text-white">{formatNum(selectedCourseStats.earnedWeight)}</span>
                              <span className="text-white/30 mx-1">/</span>
                              <span className="text-white/50">{formatNum(selectedCourseStats.attemptedWeight)}</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Current Grade</div>
                            {selectedCourseStats.isExcluded ? (
                              <div className="text-3xl font-black text-blue-400">Pass/Fail</div>
                            ) : (
                              <div className={cn("text-5xl font-black", getGradeColor(selectedCourseStats))}>{formatNum(selectedCourseStats.average)}%</div>
                            )}
                          </div>

                          {/* ── SIMULATOR TOGGLE ── */}
                          {isHypothetical ? (
                            <ElectricBorder color={courseColor} speed={0.4} chaos={0.15} borderRadius={999} className="shrink-0">
                              <button
                                onClick={() => handleModeToggle(false)}
                                className="flex items-center gap-2 bg-black/80 border border-white/10 rounded-full px-4 py-2 hover:bg-white/5 transition-colors relative z-10"
                              >
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: courseColor, boxShadow: `0 0 8px ${courseColor}` }} />
                                <span className="text-xs font-mono font-bold text-white whitespace-nowrap">SIMULATOR: ON</span>
                              </button>
                            </ElectricBorder>
                          ) : (
                            <button
                              onClick={() => handleModeToggle(true)}
                              className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-full px-4 py-2 hover:bg-white/5 transition-colors shrink-0"
                            >
                              <div className="w-2 h-2 rounded-full bg-gray-600" />
                              <span className="text-xs font-mono font-bold text-white whitespace-nowrap">SIMULATOR: OFF</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/*  TACTICAL ZONE  */}
                  <div className="relative flex-1 min-h-0 mx-6 mb-6 rounded-3xl overflow-hidden z-10">

                    {/* Static blueprint grid layer */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                      }}
                    />

                    {/* Scrollable cards */}
                    <div className="relative z-10 h-full overflow-y-auto p-2">
                      {sortedAssessments.map((assess: any) => {
                        const scoreVal = assess.score !== null ? parseFloat(assess.score) : null;
                        const maxMarks = assess.total_marks || 100;
                        const scorePct = scoreVal !== null ? (scoreVal / maxMarks) * 100 : 0;
                        const isFail = scoreVal !== null && scorePct < 50;
                        const isMid = scoreVal !== null && scorePct >= 50 && scorePct < 80;
                        const isPending = assess.score === null;

                        // Points Secured
                        const pointsSecured = scoreVal !== null ? (scoreVal / maxMarks) * assess.effectiveWeight : null;
                        const pointsPossible = assess.effectiveWeight;

                        // Dynamic neon grade color
                        const gradeColor = isPending ? null
                          : isFail ? '#FF3B30'
                            : isMid ? '#FFFFFF'
                              : '#00FFA3';

                        const scoreTextColor = isPending ? 'text-white/20'
                          : isFail ? 'text-[#FF3B30]'
                            : isMid ? 'text-white'
                              : 'text-[#00FFA3]';

                        return (
                          <div
                            key={assess.id}
                            className={cn(
                              "group relative overflow-hidden bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-2xl p-4 mb-3 z-10 shadow-lg",
                              "transition-all duration-300 ease-out",
                              "hover:bg-white/[0.04] hover:border-white/20 hover:-translate-y-[1px]",
                              assess.isDropped && "opacity-50 grayscale-[0.5]"
                            )}
                          >
                            {/* 3-column grid */}
                            <div className="grid grid-cols-[minmax(0,1fr)_140px_auto] gap-5 items-center min-h-[56px]">

                              {/* Col 1  Identity */}
                              <div>
                                <div className={cn("font-bold text-lg tracking-tight leading-snug", assess.isDropped ? "text-white/30 line-through" : "text-white")}>
                                  {assess.name}
                                </div>
                                <div className="mt-1 text-[10px] tracking-[0.2em] text-white/30 uppercase font-mono">
                                  WEIGHT: {assess.effectiveWeight}%
                                  {assess.due_date && ` \u2022 DUE: ${new Date(assess.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                                  {assess.isBoosted && <span className="text-blue-400/70 ml-2">{'\u2191'} BOOST</span>}
                                  {assess.isDropped && <span className="text-red-400/70 ml-2">DROPPED</span>}
                                </div>
                              </div>

                              {/* Col 2  Points Secured */}
                              <div className="text-right">
                                <div className="text-[9px] text-white/20 font-bold uppercase tracking-widest mb-1">Points Secured</div>
                                {isPending ? (
                                  <div className="text-xl font-mono font-medium text-white/20">
                                    {'\u2014'} <span className="text-sm text-white/15">/ {pointsPossible.toFixed(1)}</span>
                                  </div>
                                ) : (
                                  <div className="text-xl font-mono font-medium">
                                    <span style={{ color: gradeColor ?? '#ffffff', textShadow: gradeColor ? `0 0 16px ${gradeColor}80` : 'none' }}>
                                      {pointsSecured!.toFixed(1)}
                                    </span>
                                    <span className="text-white/30 text-sm"> / {pointsPossible.toFixed(1)}</span>
                                  </div>
                                )}
                              </div>

                              {/* Col 3  Recessed Score Box */}
                              <div
                                className={cn(
                                  "relative w-32 h-16 rounded-xl border flex flex-col items-center justify-center transition-all duration-200",
                                  "bg-black/40 border-white/5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]",
                                  "focus-within:border-white/20"
                                )}
                                style={gradeColor ? { borderColor: `${gradeColor}30` } : undefined}
                              >
                                <input
                                  type="number"
                                  min={0}
                                  max={maxMarks}
                                  placeholder={isPending ? "--" : undefined}
                                  value={assess.score ?? ""}
                                  onChange={(e) => handleScoreChange(assess.id, e.target.value, maxMarks)}
                                  disabled={assess.isDropped && !assess.score}
                                  className={cn(
                                    "w-full text-center text-2xl font-mono bg-transparent outline-none border-none leading-none",
                                    "placeholder:text-white/20",
                                    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                    scoreTextColor
                                  )}
                                  style={{ caretColor: gradeColor ?? courseColor }}
                                />
                                <span className="text-[9px] font-mono text-white/25 mt-0.5">/ {maxMarks}</span>
                              </div>

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              );
              return (
                <div className="flex-1 flex flex-col h-full min-h-0 relative">
                  {DetailContent}
                </div>
              );
            })()}

          </div>
        </div>
      </div>
    </LayoutGroup>
  );
}
