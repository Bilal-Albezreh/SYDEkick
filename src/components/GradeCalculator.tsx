"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { updateAssessmentScore } from "@/app/actions/index";
import { Loader2, RotateCcw, BarChart3, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine, Cell } from "recharts";
import { LayoutGroup } from "framer-motion";
import TermAverageBadge from "@/components/grades/TermAverageBadge";

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
  const [viewMode, setViewMode] = useState<"overview" | "detail">("detail");
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
            <div className="p-4 border-b border-gray-800 bg-white/[0.02] flex justify-between items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Navigation</span>
              {/* Simulator Toggle moved here */}
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <span className={cn("text-[10px] font-bold uppercase hidden xl:block", isHypothetical ? "text-purple-400" : "text-gray-600")}>
                  {isHypothetical ? "Sim" : "Real"}
                </span>
                <Switch checked={isHypothetical} onCheckedChange={handleModeToggle} className="scale-75 origin-right" />
                {isHypothetical && (
                  <Button size="icon" variant="ghost" onClick={resetHypothetical} className="h-5 w-5 text-gray-400 hover:text-white">
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                )}
              </div>
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
                        '--sim-color': simCourse.color || '#6366f1',
                        backgroundImage: `
                          linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)
                        `,
                        backgroundSize: '24px 24px',
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        boxShadow: `0 0 50px -15px ${simCourse.color || '#6366f1'}30`,
                      } as React.CSSProperties}
                      className="mt-6 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative animate-in fade-in slide-in-from-bottom-4 duration-300"
                    >
                      {/* Color Bleed — radial glow from top edge */}
                      <div
                        className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none"
                        style={{
                          background: `radial-gradient(ellipse at top, color-mix(in srgb, ${simCourse.color || '#6366f1'} 20%, transparent), transparent 70%)`,
                        }}
                      />
                      {/* Close button */}
                      <button
                        onClick={() => setSelectedSimCourse(null)}
                        className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      {/* Header */}
                      <div className="mb-5">
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

                      {/* ── Smart Target Buttons ── */}
                      <div className="flex items-center gap-2 mb-5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mr-1">Target:</span>
                        {targets.map((t) => {
                          const req = calcRequired(t);
                          const impossible = req > 100;
                          const achieved = req <= 0;
                          return (
                            <button
                              key={t}
                              disabled={impossible}
                              onClick={() => setSimSliderValue(achieved ? 0 : Math.min(100, Math.round(req)))}
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
                                setSimSliderValue(req <= 0 ? 0 : Math.min(100, Math.round(req)));
                              }
                            }}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value);
                              if (isNaN(val) || e.target.value === '') return;
                              const req = calcRequired(val);
                              setSimSliderValue(req <= 0 ? 0 : Math.min(100, Math.round(req)));
                            }}
                          />
                        </div>
                      </div>

                      {/* Slider */}
                      <div className="mb-5">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-400">If you score an average of...</span>
                          <span className="text-sm font-mono font-bold text-white bg-white/10 px-2.5 py-0.5 rounded-md">{simSliderValue}%</span>
                        </div>
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
                            className="text-3xl font-black tabular-nums"
                            style={{
                              color: projectedCourseGrade >= 80 ? '#22c55e' : projectedCourseGrade >= 50 ? '#eab308' : '#ef4444',
                              textShadow: `0 0 20px ${projectedCourseGrade >= 80 ? '#22c55e' : projectedCourseGrade >= 50 ? '#eab308' : '#ef4444'}66`,
                            }}
                          >
                            {formatNum(projectedCourseGrade)}%
                          </div>
                        </div>
                        <div className="bg-black/30 border border-white/5 rounded-xl p-4">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Projected Term Avg</div>
                          <div
                            className="text-3xl font-black tabular-nums"
                            style={{
                              color: gpaGlowColor,
                              textShadow: `0 0 20px ${gpaGlowColor}66`,
                            }}
                          >
                            {formatNum(projectedTermAvg)}%
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
            {viewMode === "detail" && selectedCourse && selectedCourseStats && (
              <div className="flex flex-col h-full animate-in fade-in duration-300">
                <div className="p-6 border-b border-gray-800 bg-white/[0.02] flex justify-between items-end">
                  <div>
                    <div className="flex items-center gap-2 mb-1"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white border border-white/10">COURSE DETAIL</span></div>
                    <h1 className="text-3xl font-bold text-white">{selectedCourse.course_code}</h1>
                    <p className="text-gray-400">{selectedCourse.course_name}</p>
                  </div>
                  <div className="flex items-end gap-6 text-right">
                    {/* ── Docked Term Average Badge ── */}
                    <TermAverageBadge variant="docked" average={termStats.average} hasData={hasGradedData} />
                    <div><div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Weight Achieved</div><div className="text-xl font-mono font-bold text-gray-300"><span className="text-white">{formatNum(selectedCourseStats.earnedWeight)}</span><span className="text-gray-600 mx-1">/</span><span>{formatNum(selectedCourseStats.attemptedWeight)}</span></div></div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Current Grade</div>
                      {selectedCourseStats.isExcluded ? (
                        <div className="text-3xl font-black text-blue-400">Pass/Fail</div>
                      ) : (
                        <div className={cn("text-5xl font-black", getGradeColor(selectedCourseStats))}>{formatNum(selectedCourseStats.average)}%</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-3">
                    {sortedAssessments.map((assess: any) => {
                      const scoreVal = assess.score !== null ? parseFloat(assess.score) : 0;
                      const maxMarks = assess.total_marks || 100;

                      const isFail = assess.score !== null && (scoreVal / maxMarks) * 100 < 50;
                      const isAce = assess.score !== null && (scoreVal / maxMarks) * 100 >= 80;
                      const isPending = assess.score === null;

                      return (
                        <div key={assess.id} className={cn(
                          "flex items-center gap-4 p-4 rounded-xl border-l-4 transition-all mb-3 backdrop-blur-md shadow-sm group relative",
                          assess.isDropped
                            ? "bg-red-900/5 border-l-gray-600 border-y-white/5 border-r-white/5 opacity-50 grayscale-[0.5]"
                            : isPending
                              ? "bg-white/5 border-l-white/20 border-dashed border-y-white/20 border-r-white/20 text-gray-300 hover:bg-white/10 hover:border-solid hover:border-white/40"
                              : isFail
                                ? "bg-red-500/10 border-l-red-500 border-y-red-500/10 border-r-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                                : isAce
                                  ? "bg-yellow-500/10 border-l-yellow-400 border-y-yellow-500/10 border-r-yellow-500/10 shadow-[0_0_10px_rgba(234,179,8,0.1)]"
                                  : "bg-black/30 border-l-white/20 border-y-white/5 border-r-white/5 hover:bg-black/40 hover:border-l-white/40"
                        )}>

                          {assess.isDropped && <div className="absolute -top-2 -right-2 bg-red-900 text-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-800 shadow-sm z-10">DROPPED</div>}
                          {assess.isBoosted && <div className="absolute -top-2 -right-2 bg-blue-900 text-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-800 shadow-sm z-10">WEIGHT BOOST</div>}

                          <div className="flex-1">
                            <div className={cn("font-medium", assess.isDropped ? "text-gray-500 line-through" : "text-gray-200")}>{assess.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className={cn("text-xs font-bold px-1.5 py-0.5 rounded", assess.isBoosted ? "bg-blue-500/20 text-blue-300" : "bg-white/10 text-gray-400")}>
                                Weight: {assess.effectiveWeight}%
                              </div>
                              {assess.due_date && (
                                <div className="text-xs text-gray-500 border border-gray-700 px-1.5 py-0.5 rounded bg-black/30">
                                  {new Date(assess.due_date).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="relative group/input">
                              <Input
                                type="number"
                                min="0"
                                max={maxMarks}
                                placeholder="-"
                                value={assess.score ?? ""}
                                onChange={(e) => handleScoreChange(assess.id, e.target.value, maxMarks)}
                                disabled={assess.isDropped && !assess.score}
                                className={cn(
                                  "w-20 h-12 text-center text-xl font-bold rounded-lg transition-all duration-200",
                                  "border-2 focus:ring-0 focus:ring-offset-0 placeholder:text-gray-700",
                                  assess.isDropped
                                    ? "bg-transparent border-transparent text-gray-600"
                                    : isHypothetical
                                      ? "bg-purple-500/10 border-purple-500/20 text-purple-300 focus:border-purple-400 focus:bg-purple-500/20"
                                      : "bg-black/40 border-white/5 text-white focus:border-blue-500/50 focus:bg-black/60",
                                  parseFloat(assess.score) >= maxMarks && !assess.isDropped && "border-green-500/30 text-green-400 bg-green-500/5"
                                )}
                              />
                              {!isHypothetical && loadingId === assess.id && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg backdrop-blur-[1px]">
                                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                </div>
                              )}
                            </div>
                            <span className={cn("font-medium text-sm", assess.isDropped ? "text-gray-700" : "text-gray-600")}>/ {maxMarks}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </LayoutGroup>
  );
}