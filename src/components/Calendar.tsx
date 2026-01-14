"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, Check, Clock, ExternalLink, Filter, X, Briefcase, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleAssessmentCompletion } from "@/app/actions/index";
import { toggleInterviewComplete } from "@/app/actions/career"; // Import the new action
import { Switch } from "@/components/ui/switch";

// --- CONFIGURATION ---
const TERM_START_DATE = new Date("2026-01-05T00:00:00");
const TODAY = new Date(); 

const COURSE_TITLES: Record<string, string> = {
  "SYDE 285": "Materials Chem",
  "SYDE 283": "Electricity",
  "SYDE 261": "Design, Systems",
  "SYDE 211": "Calc 3",
  "SYDE 182": "Dynamics",
  "SYDE 263": "Prototyping",
  "Interview": "Interview" // Label for the Golden Card
};

// ⚠️ TODO: REPLACE THESE NUMBERS WITH YOUR REAL LEARN IDs
const COURSE_URLS: Record<string, string> = {
  "SYDE 285": "https://learn.uwaterloo.ca/d2l/home/1229823",
  "SYDE 283": "https://learn.uwaterloo.ca/d2l/home/1223087",
  "SYDE 261": "https://learn.uwaterloo.ca/d2l/home/1221794",
  "SYDE 211": "https://learn.uwaterloo.ca/d2l/home/1222813",
  "SYDE 182": "https://learn.uwaterloo.ca/d2l/home/1240531",
  "SYDE 263": "https://learn.uwaterloo.ca/d2l/home/1243111"
};

// --- LUXURY THEME ENGINE ---
const getCourseTheme = (code: string) => {
  const themes: Record<string, string> = {
    "SYDE 285": "bg-red-950/40 border-red-500/20 text-red-100 hover:border-red-500/40 shadow-sm",
    "SYDE 283": "bg-amber-950/40 border-amber-500/20 text-amber-100 hover:border-amber-500/40 shadow-sm",
    "SYDE 261": "bg-emerald-950/40 border-emerald-500/20 text-emerald-100 hover:border-emerald-500/40 shadow-sm",
    "SYDE 211": "bg-blue-950/40 border-blue-500/20 text-blue-100 hover:border-blue-500/40 shadow-sm",
    "SYDE 182": "bg-violet-950/40 border-violet-500/20 text-violet-100 hover:border-violet-500/40 shadow-sm",
    "SYDE 263": "bg-teal-950/40 border-teal-500/20 text-teal-100 hover:border-teal-500/40 shadow-sm",
    // THE GOLDEN THEME
    "Interview":   "bg-yellow-950/40 border-yellow-500/40 text-yellow-100 hover:border-yellow-400/60 shadow-[0_0_15px_rgba(234,179,8,0.1)]", 
  };
  return themes[code] || "bg-gray-900/50 border-gray-800 text-gray-300";
};

const getCourseColor = (code: string) => {
    const colors: Record<string, string> = {
        "SYDE 285": "#ef4444", 
        "SYDE 283": "#f59e0b", 
        "SYDE 261": "#10b981", 
        "SYDE 211": "#3b82f6", 
        "SYDE 182": "#8b5cf6", 
        "SYDE 263": "#14b8a6", 
        "Interview":   "#eab308", // Golden Yellow
    };
    return colors[code] || "#9ca3af";
};

const getAssessmentType = (name: string, type?: string) => {
    if (type === "interview") return "Interview"; 
    const n = name.toLowerCase();
    if (n.includes("quiz") || n.includes("test")) return "Quiz";
    if (n.includes("lab") || n.includes("workshop")) return "Lab";
    if (n.includes("exam") || n.includes("midterm") || n.includes("final")) return "Exam";
    if (n.includes("project")) return "Project";
    return "Assignment";
};

export default function Calendar({ initialData, initialInterviews }: { initialData: any[], initialInterviews: any[] }) {
  // 1. STATE
  const [viewMode, setViewMode] = useState<"month" | "list">("month");
  const [currentDate, setCurrentDate] = useState(new Date("2026-01-01T00:00:00"));
  const [showCompleted, setShowCompleted] = useState(false);
  const [courses, setCourses] = useState(initialData);
  const [interviews, setInterviews] = useState(initialInterviews || []); // Local state for interviews
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
console.log("🔥 CALENDAR RENDER TRACE 🔥");
  console.log("1. Raw Interviews Prop:", initialInterviews);
  
  if (initialInterviews && initialInterviews.length > 0) {
      const sample = initialInterviews[0];
      console.log("2. Sample Interview Date:", sample.interview_date);
      console.log("3. Parsed Date Object:", new Date(sample.interview_date));
  } else {
      console.log("⚠️ No interviews received from server!");
  }
  // 2. DATA PROCESSING (The Adapter)
  const allItems = useMemo(() => {
    let flattened: any[] = [];

    // A. Process Courses (Assignments)
    courses.forEach(c => {
      c.assessments.forEach((a: any) => {
        const cleanDate = a.due_date ? a.due_date.split('T')[0] : null;
        flattened.push({
          ...a,
          due_date: cleanDate,
          courseCode: c.course_code,
          uniqueId: `assessment-${a.id}`, // Prefixed ID
          type: "assessment"
        });
      });
    });

    // B. Process Interviews (Golden Cards)
    if (interviews) {
        interviews.forEach((i: any) => {
            const d = new Date(i.interview_date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateKey = `${year}-${month}-${day}`;
            const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

            flattened.push({
                uniqueId: `interview-${i.id}`, // Prefixed ID
                name: i.company_name, 
                description: i.role_title,
                due_date: dateKey,
                courseCode: "Interview", 
                weight: 999, // Super high weight = Sort to TOP
                is_completed: i.status === 'Done', // "Done" status means checked off
                type: "interview",
                timeDisplay: timeStr
            });
        });
    }

    return flattened;
  }, [courses, interviews]);

  // 3. ACTIONS
  const handleToggleComplete = async (uniqueId: string, currentStatus: boolean) => {
    
    // CASE A: INTERVIEWS
    if (uniqueId.startsWith("interview-")) {
        const realId = uniqueId.replace("interview-", "");
        
        // Optimistic UI Update
        setInterviews(prev => prev.map((i: any) => 
            i.id === realId ? { ...i, status: !currentStatus ? "Done" : "Interview" } : i
        ));

        // Server Action
        await toggleInterviewComplete(realId, !currentStatus);
        return;
    }

    // CASE B: ASSESSMENTS
    const assessmentId = uniqueId.replace("assessment-", "");
    setCourses(prev => prev.map(c => ({
      ...c,
      assessments: c.assessments.map((a: any) => 
        a.id === assessmentId ? { ...a, is_completed: !currentStatus } : a
      )
    })));
    try { await toggleAssessmentCompletion(assessmentId, !currentStatus); } catch (err) {}
  };

  // 4. HELPERS
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const jumpToToday = () => setCurrentDate(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return {
        days: new Date(year, month + 1, 0).getDate(),
        firstDay: new Date(year, month, 1).getDay()
    };
  };

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
  };

  const getDaysRemaining = (dateStr: string) => {
    const parts = dateStr.split('-');
    const due = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const todayZero = new Date(TODAY.setHours(0,0,0,0));
    const dueZero = new Date(due.setHours(0,0,0,0));
    const diffTime = dueZero.getTime() - todayZero.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return `In ${diffDays} days`;
  };

  const getAcademicWeek = (dateStr: string) => {
    const parts = dateStr.split('-');
    const target = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    if (target < TERM_START_DATE) return 0;
    const diffTime = Math.abs(target.getTime() - TERM_START_DATE.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return Math.floor(diffDays / 7) + 1;
  };


  // --- RENDERERS ---

  const renderMonthView = () => {
    const { days, firstDay } = getDaysInMonth(currentDate);
    const blanks = Array(firstDay).fill(null);
    const daysArray = Array.from({ length: days }, (_, i) => i + 1);

    return (
      <div className="flex flex-col animate-in fade-in duration-500">
        <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-gray-900/20">
          {blanks.map((_, i) => <div key={`blank-${i}`} className="bg-[#050505]/50 border-b border-r border-gray-900/50 min-h-[120px]" />)}

          {daysArray.map(day => {
            const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = new Date().toDateString() === currentDayDate.toDateString();
            
            let dayItems = allItems.filter(a => a.due_date === dateStr);
            
            // SORTING: Interviews (999 weight) will naturally float to top
            dayItems.sort((a, b) => b.weight - a.weight);

            const visibleItems = showCompleted ? dayItems : dayItems.filter(a => !a.is_completed);
            const MAX_ITEMS = 3; 
            const displayItems = visibleItems.slice(0, MAX_ITEMS);
            const hiddenCount = visibleItems.length - MAX_ITEMS;

            return (
              <div 
                key={day} 
                onClick={() => { if (visibleItems.length > 0) setSelectedDay(dateStr); }}
                className={cn(
                    "relative p-1 flex flex-col gap-1.5 border-b border-r border-gray-800/80 transition-colors group/cell min-h-[160px]",
                    isToday ? "bg-blue-900/5" : "bg-transparent hover:bg-white/[0.02]",
                    visibleItems.length > 0 && "cursor-pointer"
                )}
              >
                <div className={cn("text-xs font-medium px-1 pt-1", isToday ? "text-blue-400 font-bold" : "text-gray-500")}>{day}</div>

                {displayItems.map((item: any) => {
                    const isInterview = item.type === "interview";
                    return (
                        <div 
                            key={item.uniqueId}
                            className={cn(
                                "relative flex flex-col p-2 rounded border shadow-sm transition-all",
                                getCourseTheme(item.courseCode), 
                                item.is_completed && "opacity-40 grayscale border-dashed"
                            )}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={cn("text-[10px] font-black tracking-tight uppercase opacity-95 flex items-center gap-1", isInterview && "text-yellow-400")}>
                                    {isInterview && <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />}
                                    {item.courseCode}
                                </span>
                                {isInterview ? (
                                    <span className="text-[9px] font-bold text-white bg-black/30 px-1 rounded">
                                        {item.timeDisplay}
                                    </span>
                                ) : (
                                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">
                                        {getAssessmentType(item.name, item.type)}
                                    </span>
                                )}
                            </div>

                            <div className="font-bold text-xs leading-tight line-clamp-2 pr-4 mb-1 opacity-95">
                                {item.name}
                            </div>
                            
                            <div className="text-[10px] font-medium opacity-70">
                                {isInterview ? item.description : `${item.weight}%`}
                            </div>

                            {/* CHECKBOX - Works for both now */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleComplete(item.uniqueId, item.is_completed);
                                }}
                                className={cn(
                                    "absolute bottom-2 right-2 w-5 h-5 rounded-sm border flex items-center justify-center transition-all bg-black/30",
                                    item.is_completed 
                                        ? "border-current text-current" 
                                        : "border-white/20 text-transparent hover:border-white/50"
                                )}
                            >
                                <Check className={cn("w-3.5 h-3.5 transition-transform", item.is_completed && "scale-100", !item.is_completed && "scale-0")} />
                            </button>
                        </div>
                    );
                })}
                {hiddenCount > 0 && <div className="mt-auto text-[10px] font-bold text-gray-500 text-center py-0.5 bg-gray-800/30 rounded">+{hiddenCount} More</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderListView = () => {
    const itemsByWeek = allItems.reduce((acc: any, item: any) => {
        if (!item.due_date) return acc;
        const weekNum = getAcademicWeek(item.due_date);
        if (!acc[weekNum]) acc[weekNum] = [];
        acc[weekNum].push(item);
        return acc;
    }, {});
    const sortedWeeks = Object.keys(itemsByWeek).sort((a, b) => Number(a) - Number(b));
    const uniqueCourses = Array.from(new Set(allItems.map(a => a.courseCode))).filter(c => c !== 'CAREER'); // Don't show career in quick access

    return (
      <div className="flex flex-col lg:flex-row gap-8 h-full animate-in slide-in-from-bottom-4 duration-500 p-4">
         <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-20">
            {sortedWeeks.map(weekNum => {
                const items = itemsByWeek[weekNum];
                items.sort((a: any, b: any) => a.due_date.localeCompare(b.due_date));

                // Filter based on completion
                const visibleItems = showCompleted ? items : items.filter((a: any) => !a.is_completed);
                if (visibleItems.length === 0) return null;

                return (
                    <div key={weekNum} className="mb-10">
                        <div className="relative bg-[#0a0a0a]/95 backdrop-blur-md z-10 py-4 border-b border-gray-800 mb-6 flex items-baseline gap-4">
                            <h3 className="text-2xl font-bold text-white tracking-tight">Week {weekNum}</h3>
                            <span className="text-sm text-gray-500 font-mono">Academic Term</span>
                        </div>
                        <div className="space-y-3">
                            {visibleItems.map((item: any) => {
                                const isInterview = item.type === "interview";
                                const daysMsg = getDaysRemaining(item.due_date);
                                
                                return (
                                    <div key={item.uniqueId} className={cn(
                                        "group flex items-center gap-6 p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden", 
                                        item.is_completed 
                                            ? "bg-transparent border-transparent opacity-40 hover:opacity-100" 
                                            : isInterview 
                                                ? "bg-[#1f1200] border-yellow-900/50" 
                                                : "bg-[#141414] border-gray-800"
                                    )}>
                                            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: getCourseColor(item.courseCode) }} />
                                            
                                            <button onClick={() => handleToggleComplete(item.uniqueId, item.is_completed)} className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ml-1", item.is_completed ? "bg-emerald-500 border-emerald-500 text-white scale-110" : "border-gray-600 hover:border-white text-transparent")}>
                                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                            </button>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1.5">
                                                    <span className="text-xs font-bold px-2 py-0.5 rounded-md border tracking-wide uppercase shadow-sm" style={{ borderColor: `${getCourseColor(item.courseCode)}40`, backgroundColor: `${getCourseColor(item.courseCode)}10`, color: getCourseColor(item.courseCode) }}>{item.courseCode}</span>
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span>{formatDate(item.due_date)} {isInterview && `@ ${item.timeDisplay}`}</span>
                                                    </div>
                                                </div>
                                                <div className={cn("text-lg font-medium text-gray-200", item.is_completed && "line-through text-gray-500")}>{item.name}</div>
                                                {isInterview && <div className="text-sm text-yellow-500/80">{item.description}</div>}
                                            </div>
                                            
                                            <div className={cn("text-sm font-bold px-4 py-2 rounded-lg border ml-auto shrink-0 transition-opacity", item.is_completed ? "opacity-0" : "opacity-100", isInterview ? "bg-yellow-900/20 border-yellow-500/20 text-yellow-500" : "bg-gray-800 border-gray-700 text-gray-400")}>{daysMsg}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
         </div>
         {/* Sidebar */}
         <div className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-[100px] bg-[#141414] border border-gray-800 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center gap-2 mb-4 text-gray-400"><Filter className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-widest">Quick Access</span></div>
                <div className="space-y-2">{uniqueCourses.map((code: any) => (<a key={code} href={COURSE_URLS[code] || "https://learn.uwaterloo.ca/"} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group"><div className="flex items-center gap-3"><div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: getCourseColor(code) }} /><div><div className="font-bold text-gray-200 group-hover:text-white transition-colors text-sm">{code}</div><div className="text-xs text-gray-500 font-medium">{COURSE_TITLES[code] || "Course"}</div></div></div><ExternalLink className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-all" /></a>))}</div>
            </div>
         </div>
      </div>
    );
  };

  // --- MAIN RENDER ---
  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] rounded-xl overflow-y-auto custom-scrollbar relative border border-gray-900">
      
      {/* HEADER */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-black/80 border-b border-white/10 shadow-2xl">
        <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-gray-800">
                    <button onClick={prevMonth} className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={nextMonth} className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors"><ChevronRight className="w-4 h-4" /></button>
                </div>
                <div className="text-xl font-bold text-white tracking-tight">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
                <button onClick={jumpToToday} className="text-[10px] font-bold bg-white/10 text-gray-300 px-3 py-1 rounded-full border border-white/5 hover:bg-white/20 transition-colors tracking-wide">
                    TODAY
                </button>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-black/40 pl-3 pr-1 py-1 rounded-full border border-gray-800">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden md:inline">Show Done</span>
                    <Switch checked={showCompleted} onCheckedChange={setShowCompleted} className="scale-75" />
                </div>
                <div className="h-6 w-px bg-gray-800 hidden md:block" />
                <div className="flex bg-black/40 p-1 rounded-lg border border-gray-800">
                    <button onClick={() => setViewMode("month")} className={cn("px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2", viewMode === "month" ? "bg-gray-800 text-white shadow-sm ring-1 ring-white/5" : "text-gray-500 hover:text-white")}><CalendarIcon className="w-3.5 h-3.5" /> Month</button>
                    <button onClick={() => setViewMode("list")} className={cn("px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2", viewMode === "list" ? "bg-gray-800 text-white shadow-sm ring-1 ring-white/5" : "text-gray-500 hover:text-white")}><List className="w-3.5 h-3.5" /> List</button>
                </div>
            </div>
        </div>

        {viewMode === "month" && (
            <div className="grid grid-cols-7 text-center pb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
                    <div key={d} className={cn("text-[10px] font-bold text-gray-500 uppercase tracking-widest py-1", (i === 0 || i === 6) ? "text-gray-600" : "")}>{d}</div>
                ))}
            </div>
        )}
      </div>

      <div className="flex-1 min-h-0 bg-[#0a0a0a] pb-20">
         <div className="md:hidden h-full">{renderListView()}</div>
         <div className="hidden md:block h-full relative">
            {viewMode === "month" ? renderMonthView() : renderListView()}
         </div>
      </div>

      {/* CENTER MODAL (LIGHTBOX) - Updated to handle both types */}
      {selectedDay && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedDay(null)}>
              <div 
                className="w-full max-w-lg bg-[#0F0F0F] border border-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-white/10"
                onClick={(e) => e.stopPropagation()} 
              >
                  <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-[#141414]">
                      <div>
                          <h3 className="text-xl font-bold text-white">
                              {new Date(selectedDay).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                          </h3>
                          <span className="text-sm text-gray-500">Daily Breakdown</span>
                      </div>
                      <button onClick={() => setSelectedDay(null)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                          <X className="w-5 h-5" />
                      </button>
                  </div>

                  <div className="p-5 overflow-y-auto custom-scrollbar space-y-3 bg-[#0a0a0a]">
                      {allItems
                        .filter(a => a.due_date === selectedDay)
                        .sort((a, b) => b.weight - a.weight)
                        .map((item: any) => {
                            const isInterview = item.type === "interview";
                            return (
                                <div 
                                    key={item.uniqueId}
                                    className={cn(
                                        "group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200",
                                        getCourseTheme(item.courseCode),
                                        item.is_completed && "opacity-40 grayscale border-dashed"
                                    )}
                                >
                                    <button
                                        onClick={() => handleToggleComplete(item.uniqueId, item.is_completed)}
                                        className={cn(
                                            "w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0",
                                            item.is_completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-600 hover:border-white",
                                            isInterview && !item.is_completed && "border-yellow-500"
                                        )}
                                    >
                                        {item.is_completed && <Check className="w-3 h-3" />}
                                    </button>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={cn("text-[10px] font-bold px-1.5 rounded bg-white/5 text-gray-400 flex items-center gap-1", isInterview && "text-yellow-400")} style={!isInterview ? { color: getCourseColor(item.courseCode) } : {}}>
                                                {isInterview && <Star className="w-3 h-3 fill-current" />}
                                                {item.courseCode}
                                            </span>
                                            {isInterview ? (
                                                <span className="text-xs text-yellow-500 font-bold">{item.timeDisplay}</span>
                                            ) : (
                                                <span className="text-xs text-gray-500">{item.weight}% Weight</span>
                                            )}
                                        </div>
                                        <div className={cn("text-base font-medium text-gray-200", item.is_completed && "line-through text-gray-500")}>
                                            {item.name}
                                        </div>
                                        {isInterview && <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>}
                                    </div>
                                </div>
                            );
                        })}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}