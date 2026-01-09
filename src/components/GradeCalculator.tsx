"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { updateAssessmentScore } from "@/app/actions/index";
import { Loader2, Beaker, RotateCcw, TrendingUp, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function GradeCalculator({ initialData }: { initialData: any[] }) {
  // SAFETY: Prevent crash on load
  const safeData = Array.isArray(initialData) ? initialData : [];
  
  const [courses, setCourses] = useState<any[]>(safeData);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(safeData[0]?.id || "");
  const [isHypothetical, setIsHypothetical] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Sync initial data
  useEffect(() => {
    if (initialData && Array.isArray(initialData)) {
      setCourses(initialData);
      if (!selectedCourseId && initialData.length > 0) {
        setSelectedCourseId(initialData[0].id);
      }
    }
  }, [initialData]);

  // --- CALCULATIONS ---
  const calculateAverage = (course: any) => {
    const assessments = course.assessments || [];
    let earned = 0;
    let attempted = 0;

    assessments.forEach((a: any) => {
      if (a.score !== null) {
        earned += (a.score / 100) * a.weight;
        attempted += a.weight;
      }
    });

    return attempted === 0 ? 0 : (earned / attempted) * 100;
  };

  const termAverage = useMemo(() => {
    if (!courses.length) return 0;
    const totalAvg = courses.reduce((acc, curr) => acc + calculateAverage(curr), 0);
    return totalAvg / courses.length;
  }, [courses]);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  // --- HANDLERS ---
  const handleScoreChange = async (assessmentId: string, newVal: string) => {
    const numVal = newVal === "" ? null : parseFloat(newVal);

    // Update Local State Immediately
    setCourses((prev) =>
      prev.map((c) => ({
        ...c,
        assessments: c.assessments.map((a: any) =>
          a.id === assessmentId ? { ...a, score: numVal } : a
        ),
      }))
    );

    // If NOT hypothetical, save to DB
    if (!isHypothetical) {
      setLoadingId(assessmentId);
      try {
        await updateAssessmentScore(assessmentId, numVal);
      } catch (error) {
        console.error("Failed to save grade", error);
      } finally {
        setLoadingId(null);
      }
    }
  };

  const resetHypothetical = () => {
    // Revert to initialData (Database values)
    if (initialData && Array.isArray(initialData)) {
      setCourses(initialData);
    }
    setIsHypothetical(false);
  };

  if (!courses.length) return <div className="text-gray-500 text-center py-10">No courses found.</div>;

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. OVERALL TERM PERFORMANCE HEADER */}
      <div className="bg-[#191919] border border-gray-800 rounded-xl p-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-500" />
            Term Performance
          </h2>
          <p className="text-gray-500 text-sm">Cumulative Average across {courses.length} courses</p>
        </div>
        <div className="flex items-center gap-6">
           {/* Hypothetical Toggle */}
           <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-lg border border-white/5">
              <div className="flex flex-col items-end">
                 <span className={cn("text-xs font-bold uppercase", isHypothetical ? "text-purple-400" : "text-gray-400")}>
                    {isHypothetical ? "Simulator Mode" : "Real Grades"}
                 </span>
                 {isHypothetical && <span className="text-[10px] text-gray-600">Changes are not saved</span>}
              </div>
              <Switch checked={isHypothetical} onCheckedChange={setIsHypothetical} />
              {isHypothetical && (
                <Button size="icon" variant="ghost" onClick={resetHypothetical} className="h-8 w-8 text-gray-400 hover:text-white">
                   <RotateCcw className="w-4 h-4" />
                </Button>
              )}
           </div>

           {/* Big Average Number */}
           <div className="text-right">
              <div className="text-4xl font-black text-white">{termAverage.toFixed(1)}%</div>
              <div className="text-xs text-gray-500 uppercase tracking-widest">Term Avg</div>
           </div>
        </div>
      </div>

      {/* 2. MAIN LAYOUT: SIDEBAR + CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
        
        {/* SIDEBAR: Course List */}
        <div className="lg:col-span-1 bg-[#191919] border border-gray-800 rounded-xl overflow-hidden flex flex-col">
           <div className="p-4 border-b border-gray-800 bg-white/[0.02]">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Your Courses</span>
           </div>
           <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {courses.map((course) => {
                 const avg = calculateAverage(course);
                 const isSelected = selectedCourseId === course.id;
                 return (
                    <button
                      key={course.id}
                      onClick={() => setSelectedCourseId(course.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-lg text-left transition-all border",
                        isSelected 
                          ? "bg-blue-600/10 border-blue-500/50" 
                          : "bg-transparent border-transparent hover:bg-white/5 text-gray-400"
                      )}
                    >
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-8 rounded-full" style={{ backgroundColor: course.color }} />
                          <div>
                             <div className={cn("font-bold text-sm", isSelected ? "text-white" : "text-gray-300")}>
                                {course.course_code}
                             </div>
                             <div className="text-[10px] text-gray-500">
                                {course.assessments.length} items
                             </div>
                          </div>
                       </div>
                       <div className={cn("text-sm font-bold", avg >= 80 ? "text-green-400" : "text-white")}>
                          {avg.toFixed(0)}%
                       </div>
                    </button>
                 );
              })}
           </div>
        </div>

        {/* MAIN CONTENT: Selected Course Details */}
        <div className="lg:col-span-3 bg-[#191919] border border-gray-800 rounded-xl flex flex-col overflow-hidden">
           {selectedCourse && (
             <>
               {/* Course Header */}
               <div className="p-6 border-b border-gray-800 bg-white/[0.02] flex justify-between items-end">
                  <div>
                     <h1 className="text-3xl font-bold text-white mb-1">{selectedCourse.course_code}</h1>
                     <p className="text-gray-400">{selectedCourse.course_name}</p>
                  </div>
                  <div className="text-right">
                     <div className="text-5xl font-black text-white">{calculateAverage(selectedCourse).toFixed(1)}%</div>
                     <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Current Average</div>
                  </div>
               </div>

               {/* Assessment List */}
               <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-3">
                     {selectedCourse.assessments.map((assess: any) => (
                        <div key={assess.id} className="flex items-center gap-4 bg-black/20 p-4 rounded-xl border border-white/5 hover:border-gray-700 transition-colors">
                           <div className="flex-1">
                              <div className="font-medium text-gray-200">{assess.name}</div>
                              <div className="text-xs text-gray-500 mt-1">Weight: {assess.weight}%</div>
                           </div>

                           {/* Input Area */}
                           <div className="flex items-center gap-3">
                              <div className="relative">
                                 <Input
                                    type="number"
                                    placeholder="-"
                                    value={assess.score ?? ""}
                                    onChange={(e) => handleScoreChange(assess.id, e.target.value)}
                                    className={cn(
                                       "w-24 h-10 text-right pr-3 font-mono text-lg bg-[#0a0a0a] border-gray-800",
                                       isHypothetical ? "text-purple-400 border-purple-500/30 focus:border-purple-500" : "text-white focus:border-blue-500"
                                    )}
                                 />
                                 {!isHypothetical && loadingId === assess.id && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
                                       <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                    </div>
                                 )}
                              </div>
                              <span className="text-gray-600 font-medium">/ 100</span>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
             </>
           )}
        </div>

      </div>
    </div>
  );
}