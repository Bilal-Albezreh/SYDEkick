"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { updateAssessmentScore } from "@/app/actions/index";
import { Loader2, TrendingUp, RotateCcw, BarChart3, Calculator, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";

export default function GradeCalculator({ initialData }: { initialData: any[] }) {
  // 1. Initialize State
  const [courses, setCourses] = useState<any[]>(initialData || []);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialData?.[0]?.id || "");
  const [viewMode, setViewMode] = useState<"overview" | "detail">("detail");
  const [isHypothetical, setIsHypothetical] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showChart, setShowChart] = useState(false); 

  useEffect(() => {
    if (initialData) {
      setCourses(initialData);
      if (!selectedCourseId && initialData.length > 0) {
        setSelectedCourseId(initialData[0].id);
      }
    }
  }, [initialData]);

  // --- MATH ENGINE ---
  const getCourseStats = (course: any) => {
    const assessments = course.assessments || [];
    let earnedWeight = 0;
    let attemptedWeight = 0;
    let totalPossibleWeight = 0;

    assessments.forEach((a: any) => {
      totalPossibleWeight += a.weight;
      if (a.score !== null) {
        earnedWeight += (a.score / 100) * a.weight;
        attemptedWeight += a.weight;
      }
    });

    const average = attemptedWeight === 0 ? 0 : (earnedWeight / attemptedWeight) * 100;
    const progress = totalPossibleWeight === 0 ? 0 : (attemptedWeight / totalPossibleWeight) * 100;
    
    return { earnedWeight, attemptedWeight, totalPossibleWeight, average, progress };
  };

  const termStats = useMemo(() => {
    if (!courses.length) return { average: 0 };
    let totalAvg = 0;
    courses.forEach(c => {
      const stats = getCourseStats(c);
      totalAvg += stats.average;
    });
    return { average: totalAvg / courses.length };
  }, [courses]);

  // --- CHART DATA TRANSFORM ---
  const chartData = useMemo(() => {
    return courses.map(course => {
      const originalCourse = initialData.find((c: any) => c.id === course.id);
      let locked = 0;    // Green
      let forecast = 0;  // Purple
      let lost = 0;      // Red
      let remaining = 0; // Gray

      course.assessments.forEach((assess: any) => {
        const originalAssess = originalCourse?.assessments.find((a: any) => a.id === assess.id);
        const weight = assess.weight;
        
        if (originalAssess && originalAssess.score !== null) {
          locked += (originalAssess.score / 100) * weight;
          lost += ((100 - originalAssess.score) / 100) * weight;
        } else if (assess.score !== null) {
          forecast += (assess.score / 100) * weight;
          lost += ((100 - assess.score) / 100) * weight;
        } else {
          remaining += weight;
        }
      });

      return {
        name: course.course_code,
        locked,
        forecast,
        remaining,
        lost,
      };
    });
  }, [courses, initialData]);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const selectedCourseStats = selectedCourse ? getCourseStats(selectedCourse) : null;

  // --- STABLE SORTING LOGIC (FIXED) ---
  const sortedAssessments = useMemo(() => {
    if (!selectedCourse) return [];
    
    return [...selectedCourse.assessments].sort((a, b) => {
        // Parse dates safely
        const dateA = a.due_date ? new Date(a.due_date).getTime() : null;
        const dateB = b.due_date ? new Date(b.due_date).getTime() : null;

        // Check if dates are valid numbers
        const validA = dateA !== null && !isNaN(dateA);
        const validB = dateB !== null && !isNaN(dateB);

        // 1. Handling "No Valid Date" (Move to BOTTOM)
        // If A has no date, it goes after B (return 1)
        if (!validA && validB) return 1; 
        // If B has no date, A goes before B (return -1)
        if (validA && !validB) return -1;

        // 2. Both have dates: Sort Ascending (Earliest First)
        if (validA && validB && dateA !== dateB) {
            return dateA - dateB;
        }

        // 3. Fallback: Sort by Name (Numeric Aware)
        // This handles "Quiz 2" vs "Quiz 10" correctly
        return (a.name || "").localeCompare(b.name || "", undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [selectedCourse]);


  const getGradeColor = (stats: any) => {
    if (stats.progress > 40 && stats.average < 50) return "text-red-500";
    if (stats.average >= 80) return "text-green-500";
    return "text-white";
  };

  // --- HANDLERS ---
  const handleModeToggle = (checked: boolean) => {
    setIsHypothetical(checked);
    if (!checked) setCourses(initialData); 
  };

  const handleScoreChange = async (assessmentId: string, newVal: string) => {
    if (newVal === "") {
        updateLocalState(assessmentId, null);
        if (!isHypothetical) syncToDb(assessmentId, null);
        return;
    }
    const numVal = parseFloat(newVal);
    if (isNaN(numVal) || numVal < 0 || numVal > 100) return;

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

  return (
    <div className="flex flex-col gap-6">
      {/* CSS TO HIDE ARROWS */}
      <style jsx>{`
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        input[type=number] {
            -moz-appearance: textfield;
        }
      `}</style>

      {/* 1. INTERACTIVE HEADER */}
      <div 
        onClick={() => setViewMode("overview")}
        className={cn(
          "relative border rounded-xl p-6 flex flex-col md:flex-row items-center justify-between transition-all cursor-pointer group overflow-hidden",
          viewMode === "overview" 
            ? "bg-blue-900/10 border-blue-500/50 ring-1 ring-blue-500/50" 
            : "bg-[#191919] border-gray-800 hover:border-gray-700"
        )}
      >
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-blue-400 font-bold uppercase tracking-widest">
            Click to expand
        </div>
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
              <TrendingUp className="w-6 h-6" />
           </div>
           <div>
             <h2 className="text-2xl font-bold text-white">Term Performance</h2>
             <p className="text-gray-500 text-sm">
               Cumulative GPA • <span className="text-gray-400 font-mono">{courses.length} Courses</span>
             </p>
           </div>
        </div>
        <div className="flex items-center gap-8 mt-4 md:mt-0">
           <div 
             className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-full border border-white/5"
             onClick={(e) => e.stopPropagation()} 
           >
              <div className="flex flex-col items-end">
                 <span className={cn("text-[10px] font-bold uppercase", isHypothetical ? "text-purple-400" : "text-gray-400")}>
                    {isHypothetical ? "Simulator Active" : "Real Grades"}
                 </span>
              </div>
              <Switch checked={isHypothetical} onCheckedChange={handleModeToggle} />
              {isHypothetical && (
                <Button size="icon" variant="ghost" onClick={resetHypothetical} className="h-6 w-6 text-gray-400 hover:text-white">
                   <RotateCcw className="w-3 h-3" />
                </Button>
              )}
           </div>
           <div className="text-right">
              <div className={cn("text-4xl font-black tabular-nums", termStats.average >= 80 ? "text-green-500" : "text-white")}>
                {termStats.average.toFixed(1)}%
              </div>
           </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[650px]">
        
        {/* SIDEBAR */}
        <div className="lg:col-span-1 bg-[#191919] border border-gray-800 rounded-xl overflow-hidden flex flex-col">
           <div className="p-4 border-b border-gray-800 bg-white/[0.02] flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Navigation</span>
           </div>
           
           <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <button
                 onClick={() => setViewMode("overview")}
                 className={cn(
                   "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all",
                   viewMode === "overview" ? "bg-blue-600/10 text-blue-400 font-bold" : "text-gray-400 hover:bg-white/5"
                 )}
              >
                 <BarChart3 className="w-4 h-4" />
                 <span>Term Overview</span>
              </button>
              <div className="h-px bg-gray-800 my-2 mx-2" />
              {courses.map((course) => {
                 const stats = getCourseStats(course);
                 const isSelected = viewMode === "detail" && selectedCourseId === course.id;
                 return (
                    <button
                      key={course.id}
                      onClick={() => { setSelectedCourseId(course.id); setViewMode("detail"); }}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-lg text-left transition-all border",
                        isSelected 
                          ? "bg-blue-600/10 border-blue-500/50" 
                          : "bg-transparent border-transparent hover:bg-white/5 text-gray-400"
                      )}
                    >
                        <div className="flex items-center gap-3">
                           <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: course.color }} />
                           <div className="min-w-0">
                             <div className={cn("font-bold text-sm truncate", isSelected ? "text-white" : "text-gray-300")}>
                                 {course.course_code}
                             </div>
                           </div>
                        </div>
                        <div className={cn("text-sm font-mono font-bold", getGradeColor(stats))}>
                           {stats.average.toFixed(0)}%
                        </div>
                    </button>
                 );
              })}
           </div>
        </div>

        {/* VIEW AREA */}
        <div className="lg:col-span-3 bg-[#191919] border border-gray-800 rounded-xl flex flex-col overflow-hidden relative">
           
           {/* --- OVERVIEW MODE --- */}
           {viewMode === "overview" && (
             <div className="absolute inset-0 overflow-y-auto p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Calculator className="w-6 h-6 text-gray-400" />
                        Complete Term Breakdown
                    </h2>
                    
                    {/* VIEW TOGGLE */}
                    <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                        <button 
                            onClick={() => setShowChart(false)}
                            className={cn("p-2 rounded-md transition-all", !showChart ? "bg-white/10 text-white" : "text-gray-500 hover:text-white")}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setShowChart(true)}
                            className={cn("p-2 rounded-md transition-all", showChart ? "bg-white/10 text-white" : "text-gray-500 hover:text-white")}
                        >
                            <BarChart3 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* CHART RENDER */}
                {showChart ? (
                    <div className="h-[400px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={chartData} 
                                layout="vertical" 
                                margin={{ left: 0, right: 30, top: 20, bottom: 20 }}
                            >
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    width={80} 
                                    tick={{fill: '#9ca3af', fontSize: 12, fontWeight: 600}} 
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #374151', borderRadius: '8px' }}
                                    itemStyle={{ color: '#e5e7eb' }}
                                    cursor={{fill: 'transparent'}}
                                />
                                <Legend wrapperStyle={{paddingTop: '20px'}} iconType="circle" />
                                
                                <ReferenceLine x={50} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideBottom', value: '50% PASS', fill: '#ef4444', fontSize: 10, fontWeight: 'bold', dy: 15 }} />
                                <ReferenceLine x={80} stroke="#22c55e" strokeDasharray="3 3" label={{ position: 'insideBottom', value: '80% GOAL', fill: '#22c55e', fontSize: 10, fontWeight: 'bold', dy: 15 }} />
                                
                                <Bar name="Secured" dataKey="locked" stackId="a" fill="#22c55e" radius={[0,0,0,0]} barSize={30} />
                                <Bar name="Projected" dataKey="forecast" stackId="a" fill="#a855f7" radius={[0,0,0,0]} barSize={30} />
                                <Bar name="Potential" dataKey="remaining" stackId="a" fill="#374151" radius={[0,0,0,0]} barSize={30} />
                                <Bar name="Lost" dataKey="lost" stackId="a" fill="#ef4444" radius={[0,4,4,0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    // GRID RENDER
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {courses.map(course => {
                            const stats = getCourseStats(course);
                            return (
                                <div 
                                    key={course.id} 
                                    onClick={() => { setSelectedCourseId(course.id); setViewMode("detail"); }}
                                    className="bg-black/20 border border-white/5 p-5 rounded-xl hover:border-gray-600 transition-all cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{course.course_code}</div>
                                            <div className="text-xs text-gray-500">{course.course_name}</div>
                                        </div>
                                        <div className={cn("text-2xl font-black", getGradeColor(stats))}>
                                            {stats.average.toFixed(1)}%
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-mono text-gray-400">
                                            <span>Weight Achieved</span>
                                            <span>{stats.earnedWeight.toFixed(1)} / {stats.attemptedWeight.toFixed(0)}</span>
                                        </div>
                                        <Progress value={stats.average} className="h-2 bg-gray-800" indicatorColor={course.color} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
             </div>
           )}

           {/* --- DETAIL MODE --- */}
           {viewMode === "detail" && selectedCourse && selectedCourseStats && (
             <div className="flex flex-col h-full animate-in fade-in duration-300">
                <div className="p-6 border-b border-gray-800 bg-white/[0.02] flex justify-between items-end">
                   <div>
                      <div className="flex items-center gap-2 mb-1">
                         <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white border border-white/10">
                            COURSE DETAIL
                         </span>
                      </div>
                      <h1 className="text-3xl font-bold text-white">{selectedCourse.course_code}</h1>
                      <p className="text-gray-400">{selectedCourse.course_name}</p>
                   </div>
                   
                   <div className="flex items-end gap-6 text-right">
                      <div>
                         <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Weight Achieved</div>
                         <div className="text-xl font-mono font-bold text-gray-300">
                            <span className="text-white">{selectedCourseStats.earnedWeight.toFixed(1)}</span>
                            <span className="text-gray-600 mx-1">/</span>
                            <span>{selectedCourseStats.attemptedWeight.toFixed(0)}</span>
                         </div>
                      </div>
                      <div>
                         <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Current Grade</div>
                         <div className={cn("text-5xl font-black", getGradeColor(selectedCourseStats))}>
                             {selectedCourseStats.average.toFixed(1)}%
                         </div>
                      </div>
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                   <div className="space-y-3">
                      {sortedAssessments.map((assess: any) => (
                         <div key={assess.id} className="flex items-center gap-4 bg-black/20 p-4 rounded-xl border border-white/5 hover:border-gray-700 transition-colors group">
                            <div className="flex-1">
                               <div className="font-medium text-gray-200">{assess.name}</div>
                               <div className="flex items-center gap-2 mt-1">
                                   <div className="text-xs font-bold px-1.5 py-0.5 bg-white/10 rounded text-gray-400">
                                      Weight: {assess.weight}%
                                   </div>
                                   {/* Date Display */}
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
                                     max="100"
                                     placeholder="-"
                                     value={assess.score ?? ""}
                                     onChange={(e) => handleScoreChange(assess.id, e.target.value)}
                                     className={cn(
                                        "w-20 h-12 text-center text-xl font-bold rounded-lg transition-all duration-200",
                                        "border-2 focus:ring-0 focus:ring-offset-0 placeholder:text-gray-700",
                                        isHypothetical 
                                            ? "bg-purple-500/10 border-purple-500/20 text-purple-300 focus:border-purple-400 focus:bg-purple-500/20" 
                                            : "bg-black/40 border-white/5 text-white focus:border-blue-500/50 focus:bg-black/60",
                                        parseFloat(assess.score) >= 100 && "border-green-500/30 text-green-400 bg-green-500/5"
                                     )}
                                  />
                                  {!isHypothetical && loadingId === assess.id && (
                                     <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg backdrop-blur-[1px]">
                                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                     </div>
                                  )}
                               </div>
                               <span className="text-gray-600 font-medium text-sm">/ 100</span>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}