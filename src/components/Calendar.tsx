"use client";

import { useState, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, Check, Clock, ExternalLink, Filter, X, Briefcase, Handshake, Laptop } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleAssessmentCompletion } from "@/app/actions/index";
import { updateItemDate as updateItemDateDirect } from "@/app/actions/focus";
import { toggleInterviewComplete } from "@/app/actions/career";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Pencil } from "lucide-react";
import { createPersonalTask, deletePersonalTask, togglePersonalTaskCompletion } from "@/app/actions/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";


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
    "INTERVIEW": "Interview", // [UPDATED]
    "OA": "Online Assessment", // [UPDATED]
    "PERSONAL": "Personal Task" // [NEW]
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
        "SYDE 285": "bg-red-900/50 border-red-500/50 text-gray-200 hover:bg-red-900/70 shadow-sm",
        "SYDE 283": "bg-amber-900/50 border-amber-500/50 text-gray-200 hover:bg-amber-900/70 shadow-sm",
        "SYDE 261": "bg-emerald-900/50 border-emerald-500/50 text-gray-200 hover:bg-emerald-900/70 shadow-sm",
        "SYDE 211": "bg-blue-900/50 border-blue-500/50 text-gray-200 hover:bg-blue-900/70 shadow-sm",
        "SYDE 182": "bg-violet-900/50 border-violet-500/50 text-gray-200 hover:bg-violet-900/70 shadow-sm",
        "SYDE 263": "bg-teal-900/50 border-teal-500/50 text-gray-200 hover:bg-teal-900/70 shadow-sm",

        // GOLD THEME (Interviews)
        "INTERVIEW": "bg-yellow-900/50 border-yellow-500/50 text-gray-200 hover:bg-yellow-900/70 shadow-[0_0_15px_rgba(234,179,8,0.1)]",

        // [NEW] NEON CYAN THEME (OAs) - "The System Vibe"
        "OA": "bg-cyan-900/50 border-cyan-500/50 text-gray-200 hover:bg-cyan-900/70 shadow-[0_0_15px_rgba(6,182,212,0.1)]",

        // [NEW] PERSONAL THEME
        "PERSONAL": "bg-zinc-800/50 border-zinc-500/50 text-gray-200 hover:bg-zinc-800/70 shadow-sm",
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
        "INTERVIEW": "#eab308", // Gold
        "OA": "#06b6d4", // Cyan-500
        "PERSONAL": "#9ca3af", // Gray-400
    };

    return colors[code] || "#9ca3af";
};

const getAssessmentType = (name: string, type?: string) => {
    if (type === "interview") return "Interview";
    if (type === "oa") return "Online Assessment";
    if (type === "personal") return "Personal Task";
    if (type === "course_work") return "Course Work";
    const n = name.toLowerCase();
    if (n.includes("quiz") || n.includes("test")) return "Quiz";
    if (n.includes("lab") || n.includes("workshop")) return "Lab";
    if (n.includes("exam") || n.includes("midterm") || n.includes("final")) return "Exam";
    if (n.includes("project")) return "Project";
    return "Assignment";
};


// --- TIMEZONE AGNOSTIC HELPER ---
// Takes a DB date string (YYYY-MM-DD...) or Date object
// Returns "YYYY-MM-DD" strictly without timezone shifting
const getItemDateKey = (dateInput: string | Date | null | undefined): string | null => {
    if (!dateInput) return null;
    if (typeof dateInput === 'string') {
        return dateInput.split('T')[0]; // Safe for DB ISO strings "2026-02-15T..."
    }
    // If it's a Date object (rarely passed here but cover it)
    const year = dateInput.getFullYear();
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    const day = String(dateInput.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function Calendar({ initialData, initialInterviews, initialPersonalTasks }: { initialData: any[], initialInterviews: any[], initialPersonalTasks?: any[] }) {
    const router = useRouter(); // For refresh
    // 1. STATE
    const [viewMode, setViewMode] = useState<"month" | "list">("month");
    const [currentDate, setCurrentDate] = useState(new Date("2026-01-01T00:00:00"));
    const [showCompleted, setShowCompleted] = useState(false);
    const [courses, setCourses] = useState(initialData);
    const [interviews, setInterviews] = useState(initialInterviews || []);
    const [personalTasks, setPersonalTasks] = useState(initialPersonalTasks || []); // [NEW] Local state
    const [selectedDay, setSelectedDay] = useState<string | null>(null);

    // [NEW] Add Event Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const isCreatingTask = useRef(false);
    const [newTaskData, setNewTaskData] = useState({
        title: "",
        type: "personal" as "personal" | "course_work",
        course_id: "",
        due_date: "",
        description: "" // Optional
    });

    // [NEW] RESCHEDULE STATE
    const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
    const [rescheduleItem, setRescheduleItem] = useState<any>(null);
    const [rescheduleDate, setRescheduleDate] = useState("");

    const handleRescheduleClick = (item: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setRescheduleItem(item);

        const targetDate = item.originalDate || item.due_date;

        if (item.type === 'interview' || item.type === 'oa') {
            const d = new Date(targetDate);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            setRescheduleDate(d.toISOString().slice(0, 16));
        } else {
            const dateStr = targetDate.split('T')[0];
            setRescheduleDate(`${dateStr}T12:00`);
        }
        setIsRescheduleOpen(true);
    };

    const handleConfirmReschedule = async () => {
        if (!rescheduleItem || !rescheduleDate) return;

        try {
            console.log("[Reschedule] Starting for item:", rescheduleItem);

            let datePayload = rescheduleDate;
            // Explicitly resolve type to ensure we catch OA/Interview correctly
            const itemType = rescheduleItem.type || 'assessment';

            // For Interviews/OA, convert Local Input to UTC ISO to preserve Time
            // For Assignments/Tasks, we usually just want the date or handle time differently
            if (itemType === 'interview' || itemType === 'oa') {
                datePayload = new Date(rescheduleDate).toISOString();
            }

            // Extract ID safely - Handle UUIDs which contain hyphens!
            // uniqueId format is "type-uuid", so splitting by "-" breaks the UUID itself if we only take [1]
            const itemId = rescheduleItem.id || (
                rescheduleItem.uniqueId
                    ? rescheduleItem.uniqueId.split('-').slice(1).join('-')
                    : null
            );

            if (!itemId) {
                console.error("[Reschedule] Could not resolve Item ID");
                return;
            }

            console.log(`[Reschedule] Payload: ID=${itemId}, Type=${itemType}, Date=${datePayload}`);

            await updateItemDateDirect(itemId, itemType, datePayload);

            setIsRescheduleOpen(false);
            setRescheduleItem(null);
            router.refresh();
        } catch (error) {
            console.error("Failed to reschedule", error);
        }
    };

    // 2. DATA PROCESSING
    const { flat, byDate } = useMemo(() => {
        let flattened: any[] = [];
        let itemsByDate: Record<string, any[]> = {};

        const addItem = (item: any) => {
            flattened.push(item);
            const key = getItemDateKey(item.originalDate || item.due_date); // Use original source if possible
            if (key) {
                if (!itemsByDate[key]) itemsByDate[key] = [];
                itemsByDate[key].push(item);
            }
        };

        // A. Process Courses (Assignments)
        courses.forEach(c => {
            c.assessments.forEach((a: any) => {
                if (!a.due_date) return;
                // Normalize using helper
                const dateKey = getItemDateKey(a.due_date);

                addItem({
                    ...a,
                    due_date: dateKey, // Display/Logic Date
                    originalDate: a.due_date,
                    courseCode: c.course_code,
                    uniqueId: `assessment-${a.id}`,
                    type: "assessment"
                });
            });
        });

        // B. Process Career Events
        if (interviews) {
            interviews.forEach((i: any) => {
                // Timezone Agnostic Key
                const dateKey = getItemDateKey(i.interview_date);

                // Safe Time Display (Manually parse string to avoid Date obj shift)
                let timeStr = "";
                try {
                    const timePart = i.interview_date.split('T')[1];
                    if (timePart) {
                        const [h, m] = timePart.split(':');
                        const H = parseInt(h);
                        timeStr = `${H % 12 || 12}:${m} ${H >= 12 ? 'PM' : 'AM'}`;
                    }
                } catch (e) { }

                const isOA = i.type === 'oa';
                const code = isOA ? "OA" : "INTERVIEW";

                addItem({
                    uniqueId: `interview-${i.id}`,
                    name: i.company_name,
                    description: isOA ? `${i.role_title}` : i.role_title,
                    due_date: dateKey,
                    originalDate: i.interview_date,
                    courseCode: code,
                    weight: isOA ? 998 : 999,
                    is_completed: i.status === 'Done',
                    type: isOA ? "oa" : "interview",
                    timeDisplay: timeStr
                });
            });
        }

        // C. Process Personal Tasks [NEW]
        if (personalTasks) {
            personalTasks.forEach((p: any) => {
                const dateKey = getItemDateKey(p.due_date);

                // Find course info if it's course work
                let courseCode = "PERSONAL";
                if (p.type === 'course_work' && p.course_id && courses) {
                    const matchedCourse = courses.find(c => c.id === p.course_id);
                    if (matchedCourse) courseCode = matchedCourse.course_code;
                }

                addItem({
                    uniqueId: `personal-${p.id}`,
                    name: p.title,
                    description: p.description,
                    due_date: dateKey,
                    originalDate: p.due_date,
                    courseCode: courseCode,
                    weight: 0, // No weight
                    is_completed: p.is_completed,
                    type: p.type,
                    timeDisplay: "Task"
                });
            });
        }

        return { flat: flattened, byDate: itemsByDate };
    }, [courses, interviews, personalTasks]);

    // 3. ACTIONS
    const handleToggleComplete = async (uniqueId: string, currentStatus: boolean) => {
        if (uniqueId.startsWith("interview-")) {
            const realId = uniqueId.replace("interview-", "");
            setInterviews(prev => prev.map((i: any) =>
                i.id === realId ? { ...i, status: !currentStatus ? "Done" : (i.type === 'oa' ? 'Pending' : 'Interview') } : i
            ));
            await toggleInterviewComplete(realId, !currentStatus);
            return;
        }

        const assessmentId = uniqueId.replace("assessment-", "");
        setCourses(prev => prev.map(c => ({
            ...c,
            assessments: c.assessments.map((a: any) =>
                a.id === assessmentId ? { ...a, is_completed: !currentStatus } : a
            )
        })));
        try { await toggleAssessmentCompletion(assessmentId, !currentStatus); } catch (err) { }
    };

    // [NEW] CrUD Actions for Personal Tasks
    const openAddModal = (dateStr: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setNewTaskData({ ...newTaskData, due_date: dateStr, title: "", description: "" });
        setIsAddModalOpen(true);
    };

    const handleCreateTask = async () => {
        if (!newTaskData.title || !newTaskData.due_date) return;
        if (isCreatingTask.current) return; // [FIX] Lock
        isCreatingTask.current = true;

        try {
            // Optimistic UI Update (Optional, but good for UX)
            await createPersonalTask({
                title: newTaskData.title,
                // [FIX] Force Noon Local Time to prevent Midnight Drift
                due_date: new Date(`${newTaskData.due_date}T12:00:00`).toISOString(),
                type: newTaskData.type,
                course_id: newTaskData.type === 'course_work' ? newTaskData.course_id : undefined,
                description: newTaskData.description
            });

            setIsAddModalOpen(false);
            router.refresh(); // Fetch real data
        } catch (e) {
            console.error(e);
        } finally {
            isCreatingTask.current = false; // [FIX] Unlock
        }
    };

    const handleDeletePersonal = async (uniqueId: string) => {
        const realId = uniqueId.replace("personal-", "");
        setPersonalTasks(prev => prev.filter((p: any) => p.id !== realId));
        await deletePersonalTask(realId);
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
        const todayZero = new Date(TODAY.setHours(0, 0, 0, 0));
        const dueZero = new Date(due.setHours(0, 0, 0, 0));
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
            <div className="flex flex-col animate-in fade-in duration-500 h-full">
                <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-[#0a0a0a]/40 backdrop-blur-md">
                    {blanks.map((_, i) => <div key={`blank-${i}`} className="bg-transparent border-b border-r border-white/5 min-h-[120px]" />)}

                    {daysArray.map(day => {
                        const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isToday = new Date().toDateString() === currentDayDate.toDateString();

                        let dayItems = byDate[dateStr] || []; // Lookup Correct Items
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
                                    "relative p-1 flex flex-col gap-1.5 border-b border-r border-white/5 transition-colors group/cell min-h-[160px]",
                                    isToday ? "bg-blue-900/5" : "bg-transparent hover:bg-white/[0.02]",
                                    visibleItems.length > 0 && "cursor-pointer"
                                )}
                            >
                                <div className="flex items-center justify-between px-1 pt-1">
                                    <div className={cn("text-xs font-medium", isToday ? "text-blue-400 font-bold" : "text-gray-500")}>{day}</div>
                                    {/* [NEW] Add Button on Hover */}
                                    <button
                                        onClick={(e) => openAddModal(dateStr, e)}
                                        className="opacity-0 group-hover/cell:opacity-100 p-0.5 hover:bg-white/20 rounded text-gray-400 hover:text-white transition-all"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>

                                {displayItems.map((item: any) => {
                                    const isInterview = item.type === "interview";
                                    const isOA = item.type === "oa";
                                    const isPersonal = item.uniqueId.startsWith("personal-");
                                    const isCareer = isInterview || isOA || isPersonal;

                                    return (
                                        <div
                                            key={item.uniqueId}
                                            className={cn(
                                                "relative flex flex-col px-2 py-1.5 rounded-sm border-l-2 shadow-sm transition-all overflow-hidden",
                                                getCourseTheme(item.courseCode).replace('border-', 'border-l-'), // Hack to ensure left border is used effectively or override below
                                                "border-y-0 border-r-0", // Reset other borders
                                                item.is_completed && "opacity-40 grayscale border-dashed"
                                            )}
                                            style={{ borderColor: getCourseColor(item.courseCode) }} // Force Left Border Color
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={cn("text-[10px] font-black tracking-tight uppercase opacity-95 flex items-center gap-1",
                                                    isInterview && "text-yellow-400",
                                                    isOA && "text-cyan-400"
                                                )}>
                                                    {/* [UPDATED] Icons: Handshake for Interview, Laptop for OA */}
                                                    {isInterview && <Handshake className="w-3 h-3 text-yellow-400" />}
                                                    {isOA && <Laptop className="w-3 h-3 text-cyan-400" />}
                                                    {item.courseCode}
                                                </span>
                                                {isCareer ? (
                                                    <span className={cn("text-[9px] font-bold text-white px-1 rounded", isInterview ? "bg-black/30" : "bg-cyan-900/50")}>
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
                                                {isCareer ? item.description : `${item.weight}%`}
                                            </div>

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
        const itemsByWeek = flat.reduce((acc: any, item: any) => {
            // ... rest stays same
            if (!item.due_date) return acc;
            const weekNum = getAcademicWeek(item.due_date);
            if (!acc[weekNum]) acc[weekNum] = [];
            acc[weekNum].push(item);
            return acc;
        }, {});
        const sortedWeeks = Object.keys(itemsByWeek).sort((a, b) => Number(a) - Number(b));
        const uniqueCourses = Array.from(new Set(flat.map(a => a.courseCode))).filter(c => c !== 'INTERVIEW' && c !== 'OA'); // Use flat.map

        return (
            <div className="flex flex-col lg:flex-row gap-8 h-full animate-in slide-in-from-bottom-4 duration-500 p-4">
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-20">
                    {sortedWeeks.map(weekNum => {
                        const items = itemsByWeek[weekNum];
                        items.sort((a: any, b: any) => a.due_date.localeCompare(b.due_date));

                        const visibleItems = showCompleted ? items : items.filter((a: any) => !a.is_completed);
                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={weekNum} className="mb-6 bg-black/25 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
                                <div className="relative z-10 pb-4 mb-2 flex items-baseline gap-4 border-b border-white/5">
                                    <h3 className="text-2xl font-bold text-white tracking-tight">Week {weekNum}</h3>
                                    <span className="text-sm text-gray-500 font-mono">Academic Term</span>
                                </div>
                                <div className="space-y-3">
                                    {visibleItems.map((item: any) => {
                                        const isInterview = item.type === "interview";
                                        const isOA = item.type === "oa";
                                        const isCareer = isInterview || isOA;
                                        const daysMsg = getDaysRemaining(item.due_date);

                                        return (
                                            <div key={item.uniqueId} className={cn(
                                                "group flex items-center gap-6 p-4 rounded-xl border transition-all duration-200 relative overflow-hidden mb-3",
                                                "bg-white/5 backdrop-blur-md border-white/5 hover:bg-white/10 hover:border-white/20",
                                                item.is_completed && "opacity-40 grayscale"
                                            )}>
                                                <div className="absolute left-0 top-0 bottom-0 w-1 z-20" style={{ backgroundColor: getCourseColor(item.courseCode) }} />
                                                <div className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300 opacity-[0.08] group-hover:opacity-[0.12]" style={{ backgroundColor: getCourseColor(item.courseCode) }} />

                                                <button onClick={() => handleToggleComplete(item.uniqueId, item.is_completed)} className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ml-1 relative z-10", item.is_completed ? "bg-emerald-500 border-emerald-500 text-white scale-110" : "border-white/20 hover:border-white text-transparent")}>
                                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                </button>

                                                <div className="flex-1 min-w-0 relative z-10">
                                                    <div className="flex items-center gap-3 mb-1.5">
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border tracking-wide uppercase shadow-sm" style={{
                                                            borderColor: `${getCourseColor(item.courseCode)}40`,
                                                            backgroundColor: `${getCourseColor(item.courseCode)}10`, // Fallback
                                                            color: `${getCourseColor(item.courseCode)}`
                                                        }}>
                                                            <span className={cn("opacity-80", getCourseTheme(item.courseCode).split(' ')[0])}></span>{/* Tiny hack for theme color if needed, but manual style overrides it */}
                                                            {item.courseCode}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            <span>{formatDate(item.due_date)} {isCareer && `@ ${item.timeDisplay}`}</span>
                                                        </div>
                                                    </div>
                                                    <div className={cn("text-base font-medium text-gray-100", item.is_completed && "line-through text-gray-500")}>{item.name}</div>
                                                    {isCareer && <div className={cn("text-sm", isInterview ? "text-yellow-500/80" : "text-cyan-400")}>{item.description}</div>}
                                                </div>

                                                <div className={cn("text-xs font-bold px-3 py-1.5 rounded-lg border ml-auto shrink-0 transition-opacity relative z-10", item.is_completed ? "opacity-0" : "opacity-100", isInterview ? "bg-yellow-900/20 border-yellow-500/20 text-yellow-500" : "bg-white/10 border-white/5 text-gray-300")}>{daysMsg}</div>

                                                {/* Edit Button for List View */}
                                                <button
                                                    onClick={(e) => handleRescheduleClick(item, e)}
                                                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100 relative z-10"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
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
                    <div className="sticky top-[100px] bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-5 shadow-xl">
                        <div className="flex items-center gap-2 mb-4 text-gray-400"><Filter className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-widest">Quick Access</span></div>
                        <div className="space-y-2">{uniqueCourses.map((code: any) => (<a key={code} href={COURSE_URLS[code] || "https://learn.uwaterloo.ca/"} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all group"><div className="flex items-center gap-3"><div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: getCourseColor(code) }} /><div><div className="font-bold text-gray-200 group-hover:text-white transition-colors text-sm">{code}</div><div className="text-xs text-gray-500 font-medium">{COURSE_TITLES[code] || "Course"}</div></div></div><ExternalLink className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-all" /></a>))}</div>
                    </div>
                </div>
            </div>
        );
    };

    // --- MAIN RENDER ---
    return (
        <div className="flex flex-col h-full bg-transparent overflow-hidden">

            {/* HEADER - DETACHED */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-4 mb-6 shrink-0 flex items-center justify-between shadow-lg">
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

            {/* MAIN CALENDAR GRID CONTAINER */}
            <div className="flex-1 min-h-0 bg-black/40 backdrop-blur-1l border border-white/10 rounded-xl overflow-y-auto custom-scrollbar relative">
                {viewMode === "month" && (
                    <div className="grid grid-cols-7 text-center pb-2 pt-2 border-b border-white/10 bg-black/20 sticky top-0 z-10 backdrop-blur-sm">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
                            <div key={d} className={cn("text-[10px] font-bold text-white/50 uppercase tracking-widest py-1", (i === 0 || i === 6) ? "text-white/30" : "")}>{d}</div>
                        ))}
                    </div>
                )}

                <div className="h-full">
                    <div className="md:hidden h-full">{renderListView()}</div>
                    <div className="hidden md:block h-full relative">
                        {viewMode === "month" ? renderMonthView() : renderListView()}
                    </div>
                </div>
            </div>

            {/* CENTER MODAL */}
            {selectedDay && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedDay(null)}>
                    <div className="w-full max-w-lg bg-[#0F0F0F] border border-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-white/10" onClick={(e) => e.stopPropagation()}>
                        <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-[#141414]">
                            <div>
                                <h3 className="text-xl font-bold text-white">
                                    {(() => {
                                        const [y, m, d] = selectedDay.split("-").map(Number);
                                        const localDate = new Date(y, m - 1, d);
                                        return localDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
                                    })()}
                                </h3>
                                <span className="text-sm text-gray-500">Daily Breakdown</span>
                            </div>
                            <button onClick={() => setSelectedDay(null)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 overflow-y-auto custom-scrollbar space-y-3 bg-[#0a0a0a]">
                            {(byDate[selectedDay] || []) // Use Map
                                .sort((a, b) => b.weight - a.weight)
                                .map((item: any) => {
                                    const isInterview = item.type === "interview";
                                    const isOA = item.type === "oa";
                                    const isCareer = isInterview || isOA;

                                    return (
                                        <div
                                            key={item.uniqueId}
                                            className={cn(
                                                "group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 relative", // Added 'relative'
                                                getCourseTheme(item.courseCode),
                                                item.is_completed && "opacity-40 grayscale border-dashed"
                                            )}
                                        >
                                            <button
                                                onClick={(e) => {
                                                    if (item.uniqueId.startsWith("personal-")) {
                                                        e.stopPropagation();
                                                        handleDeletePersonal(item.uniqueId);
                                                    } else {
                                                        handleToggleComplete(item.uniqueId, item.is_completed);
                                                    }
                                                }}
                                                className={cn(
                                                    "w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0",
                                                    item.is_completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-600 hover:border-white",
                                                    item.uniqueId.startsWith("personal-") && "hover:bg-red-500/20 hover:border-red-500 group/del" // Delete styling for personal
                                                )}
                                            >
                                                {item.uniqueId.startsWith("personal-") && !item.is_completed ? (
                                                    <Trash2 className="w-3 h-3 text-red-400 opacity-0 group-hover/del:opacity-100 transition-opacity" />
                                                ) : (
                                                    item.is_completed ? <Check className="w-3 h-3" /> : (item.uniqueId.startsWith("personal-") ? null : null) // Only show trash if not done? Or always if personal.
                                                )}
                                                {/* Logic Fix: Use a dedicated delete button or combine with checkbox? User usually wants to check off personal tasks too. Let's keep checkbox, maybe a separate delete button on the side? */}
                                                {/* REVISIT: For now, keeping as checkbox. Adding a small delete button top right of the card. */}
                                            </button>

                                            {/* SEPARATE DELETE BUTTON FOR PERSONAL TASKS */}
                                            {item.uniqueId.startsWith("personal-") && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeletePersonal(item.uniqueId); }}
                                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-gray-500 hover:text-red-400 transition-all z-20"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}

                                            {/* Reschedule Button in Modal (Always Visible) */}
                                            <button
                                                onClick={(e) => handleRescheduleClick(item, e)}
                                                className="absolute top-2 right-8 p-1.5 hover:bg-white/10 rounded-md text-gray-500 hover:text-white transition-all z-20 group/edit"
                                                title="Reschedule"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>


                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={cn("text-[10px] font-bold px-1.5 rounded bg-white/5 text-gray-400 flex items-center gap-1",
                                                        isInterview && "text-yellow-400",
                                                        isOA && "text-cyan-400"
                                                    )} style={!isCareer ? { color: getCourseColor(item.courseCode) } : {}}>
                                                        {isInterview && <Handshake className="w-3 h-3 text-yellow-400" />}
                                                        {isOA && <Laptop className="w-3 h-3 text-cyan-400" />}
                                                        {item.courseCode}
                                                    </span>
                                                    {(isCareer) ? (
                                                        <span className={cn("text-xs font-bold", isInterview ? "text-yellow-500" : "text-cyan-400")}>{item.timeDisplay}</span>
                                                    ) : (
                                                        <span className="text-xs text-gray-500">{item.weight}% Weight</span>
                                                    )}
                                                </div>
                                                <div className={cn("text-base font-medium text-gray-200", item.is_completed && "line-through text-gray-500")}>
                                                    {item.name}
                                                </div>
                                                {isCareer && <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>
            )}
            {/* [NEW] ADD TASK DIALOG */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="bg-[#111] border-gray-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Add New Event</DialogTitle>
                    </DialogHeader>
                    <div className="py-2 space-y-4">

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Title</label>
                            <Input
                                value={newTaskData.title}
                                onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                                placeholder="e.g. Study for physics"
                                className="bg-[#0a0a0a] border-gray-800"
                            />
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1 space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Type</label>
                                <div className="flex items-center gap-2 p-1 bg-[#0a0a0a] rounded-lg border border-gray-800">
                                    <button
                                        onClick={() => setNewTaskData({ ...newTaskData, type: 'personal' })}
                                        className={cn("flex-1 text-xs py-2 rounded-md font-bold transition-all", newTaskData.type === 'personal' ? "bg-gray-800 text-white" : "text-gray-500 hover:text-white")}
                                    >
                                        Personal
                                    </button>
                                    <button
                                        onClick={() => setNewTaskData({ ...newTaskData, type: 'course_work' })}
                                        className={cn("flex-1 text-xs py-2 rounded-md font-bold transition-all", newTaskData.type === 'course_work' ? "bg-blue-900/40 text-blue-400" : "text-gray-500 hover:text-white")}
                                    >
                                        Course Work
                                    </button>
                                </div>
                            </div>

                            {newTaskData.type === 'course_work' && (
                                <div className="flex-1 space-y-2 animate-in fade-in slide-in-from-left-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Select Course</label>
                                    <Select onValueChange={(val) => setNewTaskData({ ...newTaskData, course_id: val })}>
                                        <SelectTrigger className="bg-[#0a0a0a] border-gray-800 h-[42px]">
                                            <SelectValue placeholder="Course..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#111] border-gray-800 text-white">
                                            {courses.map((c: any) => (
                                                <SelectItem key={c.id} value={c.id}>{c.course_code}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
                            <Input
                                type="date"
                                value={newTaskData.due_date}
                                onChange={(e) => setNewTaskData({ ...newTaskData, due_date: e.target.value })}
                                className="bg-[#0a0a0a] border-gray-800"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Description (Optional)</label>
                            <Input
                                value={newTaskData.description}
                                onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                                placeholder="Details..."
                                className="bg-[#0a0a0a] border-gray-800"
                            />
                        </div>

                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="border-gray-800 hover:bg-white/5 text-gray-400">Cancel</Button>
                        <Button onClick={handleCreateTask} className="bg-white text-black hover:bg-gray-200 font-bold">Create Event</Button>
                    </DialogFooter>
                </DialogContent>

            </Dialog>

            {/* RESCHEDULE DIALOG */}
            <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
                <DialogContent className="bg-[#111] border-gray-800 text-white z-[200] sm:max-w-md"> {/* Added z-[200] */}
                    <DialogHeader>
                        <DialogTitle>Reschedule Event</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="text-sm font-medium text-gray-400">
                            {rescheduleItem?.name}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">New Date & Time</label>
                            <Input
                                type="datetime-local"
                                value={rescheduleDate}
                                onChange={(e) => setRescheduleDate(e.target.value)}
                                className="bg-[#0a0a0a] border-gray-800 text-white"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRescheduleOpen(false)} className="border-gray-800 hover:bg-white/5 text-gray-400">Cancel</Button>
                        <Button onClick={handleConfirmReschedule} className="bg-white text-black hover:bg-gray-200 font-bold">Confirm Reschedule</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
