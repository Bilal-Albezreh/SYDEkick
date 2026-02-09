"use client";

import { useState, useMemo, useRef, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, DragStartEvent } from "@dnd-kit/core";
import { DraggableCard, DroppableDay } from "@/components/calendar/DraggableComponents";
import { motion, AnimatePresence } from "framer-motion";
import { updateAssessmentDate } from "@/app/actions/assessments";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, Check, Clock, ExternalLink, Filter, X, Briefcase, Handshake, Laptop, Plus, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleAssessmentCompletion } from "@/app/actions/index";
import { updateItemDate as updateItemDateDirect } from "@/app/actions/focus";
import { updateAssessmentDetails } from "@/app/actions/assessments";
import { toggleInterviewComplete } from "@/app/actions/career";
import { Switch } from "@/components/ui/switch";

import { createPersonalTask, deletePersonalTask, togglePersonalTaskComplete, updatePersonalTaskDate } from "@/app/actions/personalTasks";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";



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

    // If it's already a simple date string (YYYY-MM-DD), return as-is
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return dateInput;
    }

    // For timestamp strings or Date objects, parse carefully
    const date = new Date(dateInput);

    if (isNaN(date.getTime())) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function Calendar({ initialData, initialInterviews, initialPersonalTasks }: { initialData: any[], initialInterviews: any[], initialPersonalTasks?: any[] }) {
    const router = useRouter(); // For refresh
    // 1. STATE
    const [viewMode, setViewMode] = useState<"month" | "list">("month");
    const [currentDate, setCurrentDate] = useState(new Date());
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

    // [NEW] EDIT EVENT MODAL STATE (Date + Grade + Name)
    const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
    const [rescheduleItem, setRescheduleItem] = useState<any>(null);
    const [rescheduleDate, setRescheduleDate] = useState("");
    const [rescheduleScore, setRescheduleScore] = useState<string>(""); // For grade input
    const [rescheduleName, setRescheduleName] = useState<string>(""); // For event name

    // [DND] Drag-and-Drop State
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    // [DND] Sensors: Distance-based for responsive feel
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // < 8px = Click, > 8px = Drag (prevents accidental drags)
            },
        })
    );

    // Refs for programmatic date picker access
    const newTaskDateRef = useRef<HTMLInputElement>(null);
    const rescheduleDateRef = useRef<HTMLInputElement>(null);

    // Helper to get the selected course color
    const getSelectedCourseColor = () => {
        if (newTaskData.type !== 'course_work' || !newTaskData.course_id) {
            return "#9ca3af"; // Gray for personal tasks
        }
        const selectedCourse = courses.find((c: any) => c.id === newTaskData.course_id);
        return selectedCourse?.color || "#3b82f6"; // Fallback to blue
    };

    // Auto-scroll to today's cell on mount
    useEffect(() => {
        const todayCell = document.getElementById('today-cell');
        if (todayCell) {
            todayCell.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, []); // Only run on mount

    const handleRescheduleClick = (item: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setRescheduleItem(item);
        setRescheduleName(item.name || ""); // Set initial name

        // [FIX] Smart Initialization with proper local time parsing
        if (item.type === 'interview' || item.type === 'oa') {
            // item.originalDate might be "2026-02-20T19:30:00" or "2026-02-20 19:30:00"
            const dateStr = (item.originalDate || item.due_date).replace(' ', 'T');
            
            // Extract components manually to treat as local time
            const [datePart, timePart] = dateStr.split('T');
            const [year, month, day] = datePart.split('-').map(Number);
            const [hour, minute] = (timePart || '00:00').split(':').map(Number);
            
            // Create Date in local timezone
            const d = new Date(year, month - 1, day, hour, minute);
            
            // Format as YYYY-MM-DDTHH:MM for datetime-local input
            const formattedMonth = String(d.getMonth() + 1).padStart(2, '0');
            const formattedDay = String(d.getDate()).padStart(2, '0');
            const formattedHours = String(d.getHours()).padStart(2, '0');
            const formattedMinutes = String(d.getMinutes()).padStart(2, '0');
            setRescheduleDate(`${d.getFullYear()}-${formattedMonth}-${formattedDay}T${formattedHours}:${formattedMinutes}`);
        } else {
            const dateStr = item.due_date.split('T')[0];
            setRescheduleDate(`${dateStr}T12:00`);
        }

        // Initialize score if it's an assessment
        setRescheduleScore(item.score?.toString() || "");

        setIsRescheduleOpen(true);
    };

    // [DND] Drag-and-Drop Handlers
    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragId(null);

        if (!over) return;

        const activeId = active.id as string;
        const overDate = over.id as string; // DroppableDay id = date string (YYYY-MM-DD)

        // Check if it's a personal task (activeId may contain temp prefix from safe ID)
        let personalTask = null;
        if (activeId.startsWith('temp-')) {
            // Extract the real unique ID from temp ID
            const uniqueId = activeId.split('-').slice(1).join('-');
            if (uniqueId.startsWith('personal-')) {
                const realId = uniqueId.replace('personal-', '');
                personalTask = personalTasks.find((p: any) => p.id === realId);
            }
        } else {
            // Try direct lookup in personal tasks
            personalTask = personalTasks.find((p: any) => p.id === activeId);
        }

        // If it's a personal task
        if (personalTask) {
            const originalDate = personalTask.due_date.split('T')[0];
            if (originalDate === overDate) return; // No change

            console.log(`🔄 [DRAG] Personal Task: ${personalTask.title}`);
            console.log(`   ID: ${personalTask.id}`);
            console.log(`   From: ${originalDate} → To: ${overDate}`);

            // Optimistic Update: Snapshot for rollback
            const oldPersonalTasks = JSON.parse(JSON.stringify(personalTasks));

            // Update local state immediately
            setPersonalTasks((prev: any[]) => {
                return prev.map(task => {
                    if (task.id === personalTask.id) {
                        // Send raw YYYY-MM-DD string (no timezone conversion)
                        return { ...task, due_date: overDate };
                    }
                    return task;
                });
            });

            // Server Action (background)
            startTransition(async () => {
                const result = await updatePersonalTaskDate(personalTask.id, overDate);
                if (!result.success) {
                    console.error("❌ [DRAG] Personal Task Update FAILED");
                    console.error("   Error:", result.error);
                    console.error("   Task ID:", personalTask.id);
                    console.error("   New Date:", overDate);
                    setPersonalTasks(oldPersonalTasks); // Rollback on error
                } else {
                    console.log("✅ [DRAG] Personal Task Updated Successfully");
                }
            });

            return;
        }

        // Otherwise, it's an assessment
        const item = courses.flatMap((c: any) => c.assessments || []).find((a: any) => a.id === activeId);
        if (!item) return;

        const originalDate = item.due_date.split('T')[0];
        if (originalDate === overDate) return; // No change

        console.log(`🔄 [DRAG] Assessment: ${item.name}`);
        console.log(`   ID: ${activeId}`);
        console.log(`   From: ${originalDate} → To: ${overDate}`);

        // Optimistic Update: Snapshot current state for rollback
        const oldCourses = JSON.parse(JSON.stringify(courses));

        // Update local state immediately (optimistic)
        setCourses((prev: any[]) => {
            return prev.map(course => {
                if (!course.assessments) return course;
                return {
                    ...course,
                    assessments: course.assessments.map((assessment: any) => {
                        if (assessment.id === activeId) {
                            // Send raw YYYY-MM-DD string (no timezone conversion)
                            return { ...assessment, due_date: overDate };
                        }
                        return assessment;
                    })
                };
            });
        });

        // Server Action (background)
        startTransition(async () => {
            const result = await updateAssessmentDate(activeId, overDate);
            if (!result.success) {
                console.error("❌ [DRAG] Assessment Update FAILED");
                console.error("   Error:", result.error);
                console.error("   Assessment ID:", activeId);
                console.error("   New Date:", overDate);
                setCourses(oldCourses); // Rollback on error
            } else {
                console.log("✅ [DRAG] Assessment Updated Successfully");
            }
        });
    };

    const handleConfirmReschedule = async () => {
        if (!rescheduleItem || !rescheduleDate) return;

        try {
            console.log("[Edit] Starting for item:", rescheduleItem);

            let datePayload = rescheduleDate;
            const itemType = rescheduleItem.type || 'assessment';
            const nameChanged = rescheduleName !== rescheduleItem.name;

            // UNIFIED HANDLER LOGIC
            // 1. Career Events (Time-Centric) -> Send raw "YYYY-MM-DDTHH:MM" string
            if (itemType === 'interview' || itemType === 'oa') {
                // rescheduleDate is already "YYYY-MM-DDTHH:MM" from datetime-local input
                datePayload = rescheduleDate; // Send as-is (local time string)
            }
            // 2. Assignments/Tasks (Date-Centric) -> Send raw YYYY-MM-DD string
            else {
                // Extract just the date part (YYYY-MM-DD)
                datePayload = rescheduleDate.split('T')[0];
            }

            // Extract ID safely
            const itemId = rescheduleItem.id || (
                rescheduleItem.uniqueId
                    ? rescheduleItem.uniqueId.split('-').slice(1).join('-')
                    : null
            );

            if (!itemId) {
                console.error("[Edit] Could not resolve Item ID");
                return;
            }

            console.log(`[Edit] Payload: ID=${itemId}, Type=${itemType}, Date=${datePayload}, Name=${rescheduleName}`);

            // For assessments with grade input, use the unified update action
            if (itemType === 'assessment' && rescheduleScore !== "") {
                const scoreValue = parseFloat(rescheduleScore);
                if (!isNaN(scoreValue)) {
                    await updateAssessmentDetails(itemId, datePayload, scoreValue, nameChanged ? rescheduleName : undefined);
                } else {
                    // Only update date if score is invalid
                    await updateItemDateDirect(itemId, itemType, datePayload);
                    if (nameChanged) {
                        await updateAssessmentDetails(itemId, undefined, undefined, rescheduleName);
                    }
                }
            } else if (itemType === 'assessment') {
                // Assessment with no score - update date and/or name
                if (nameChanged) {
                    await updateAssessmentDetails(itemId, datePayload, undefined, rescheduleName);
                } else {
                    await updateItemDateDirect(itemId, itemType, datePayload);
                }
            } else {
                // Non-assessment items (interviews, OAs, personal)
                await updateItemDateDirect(itemId, itemType, datePayload);
                // TODO: Add name update support for personal tasks and career events
            }

            setIsRescheduleOpen(false);
            setRescheduleItem(null);
            setRescheduleScore("");
            setRescheduleName("");
            router.refresh();
        } catch (error) {
            console.error("Failed to save changes", error);
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
                    courseColor: c.color, // [FIX] Add course color
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

                // Safe Time Display (Parse as local time)
                let timeStr = "";
                try {
                    if (i.interview_date) {
                        // Parse datetime string as local time (not UTC)
                        // Format from DB might be "2026-02-20T19:30:00" or "2026-02-20 19:30:00"
                        const dateStr = i.interview_date.replace(' ', 'T'); // Normalize format
                        
                        // Extract components manually to avoid timezone issues
                        const [datePart, timePart] = dateStr.split('T');
                        const [year, month, day] = datePart.split('-').map(Number);
                        const [hour, minute] = (timePart || '00:00').split(':').map(Number);
                        
                        // Create Date in local timezone
                        const dateObj = new Date(year, month - 1, day, hour, minute);
                        
                        // Format: "7:30 PM"
                        timeStr = dateObj.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        });
                    }
                } catch (e) { 
                    console.error("Error parsing interview date:", i.interview_date, e);
                }

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
                let courseColor = null;
                if (p.type === 'course_work' && p.course_id && courses) {
                    const matchedCourse = courses.find(c => c.id === p.course_id);
                    if (matchedCourse) {
                        courseCode = matchedCourse.course_code;
                        courseColor = matchedCourse.color; // [FIX] Add course color
                    }
                }

                addItem({
                    id: p.id, // [FIX] Add real database ID for drag-and-drop
                    uniqueId: `personal-${p.id}`,
                    name: p.title,
                    description: p.description,
                    due_date: dateKey,
                    originalDate: p.due_date,
                    courseCode: courseCode,
                    courseColor: courseColor, // [FIX] Add color
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

        if (uniqueId.startsWith("personal-")) {
            const realId = uniqueId.replace("personal-", "");
            setPersonalTasks(prev => prev.map((p: any) =>
                p.id === realId ? { ...p, is_completed: !currentStatus } : p
            ));
            await togglePersonalTaskComplete(realId, !currentStatus);
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
            // #region agent log
            const createInput = { title: newTaskData.title, due_date: newTaskData.due_date, type: newTaskData.type, course_id: newTaskData.type === 'course_work' ? newTaskData.course_id : undefined, description: newTaskData.description };
            fetch('http://127.0.0.1:7242/ingest/a12bb5f7-0396-4a02-99a0-cab3cb93f85c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Calendar.tsx:handleCreateTask',message:'calling createPersonalTask',data:{hypothesisId:'H4',type:createInput.type,hasCourseId:!!createInput.course_id},timestamp:Date.now()})}).catch(()=>{});
            // #endregion
            // [CRITICAL] Wait for server response with REAL UUID
            const result = await createPersonalTask({
                title: newTaskData.title,
                // [FIX] Send raw YYYY-MM-DD string (no timezone conversion)
                due_date: newTaskData.due_date,
                type: newTaskData.type,
                course_id: newTaskData.type === 'course_work' ? newTaskData.course_id : undefined,
                description: newTaskData.description
            });
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/a12bb5f7-0396-4a02-99a0-cab3cb93f85c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Calendar.tsx:handleCreateTask',message:'createPersonalTask result',data:{hypothesisId:'H1,H2',success:result.success,error:result.error},timestamp:Date.now()})}).catch(()=>{});
            // #endregion

            if (result.success && result.task) {
                // [CRITICAL] Use REAL database object (not temp ID)
                // This prevents ghost items and enables drag-and-drop
                setPersonalTasks(prev => [...prev, result.task]);
                setIsAddModalOpen(false);

                // Reset form
                setNewTaskData({
                    title: "",
                    type: "personal",
                    course_id: "",
                    due_date: "",
                    description: ""
                });
            } else {
                console.error("Failed to create task:", result.error);
                alert(result.error || "Failed to create task");
            }
        } catch (e) {
            console.error(e);
            alert("An unexpected error occurred");
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

                        let dayItems = byDate[dateStr] || [];
                        dayItems.sort((a, b) => b.weight - a.weight);

                        const visibleItems = showCompleted ? dayItems : dayItems.filter(a => !a.is_completed);
                        const MAX_ITEMS = 3;
                        const displayItems = visibleItems.slice(0, MAX_ITEMS);
                        const hiddenCount = visibleItems.length - MAX_ITEMS;

                        return (
                            <DroppableDay
                                key={day}
                                date={dateStr}
                                id={isToday ? "today-cell" : undefined}
                                className={cn(
                                    "relative p-1 flex flex-col gap-1.5 border-b border-r border-white/5 transition-colors group/cell min-h-[160px]",
                                    isToday
                                        ? "bg-blue-400/5 ring-2 ring-blue-400 ring-offset-2 ring-offset-black"
                                        : "bg-transparent hover:bg-white/[0.02]",
                                    visibleItems.length > 0 && "cursor-pointer"
                                )}
                            >
                                <div className="flex items-center justify-between px-1 pt-1">
                                    <div
                                        className={cn("text-xs font-medium", isToday ? "text-blue-400 font-bold" : "text-gray-500")}
                                        onClick={() => { if (visibleItems.length > 0) setSelectedDay(dateStr); }}
                                    >
                                        {day}
                                    </div>
                                    <button
                                        onClick={(e) => openAddModal(dateStr, e)}
                                        className="opacity-0 group-hover/cell:opacity-100 p-0.5 hover:bg-white/20 rounded text-gray-400 hover:text-white transition-all"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>

                                {displayItems.map((item: any, index: number) => {
                                    const isInterview = item.type === "interview";
                                    const isOA = item.type === "oa";
                                    const isPersonal = item.uniqueId.startsWith("personal-");
                                    const isCareer = isInterview || isOA; // Only interviews and OAs are non-draggable
                                    const itemColor = item.courseColor || getCourseColor(item.courseCode);
                                    const isDraggable = !isCareer; // Assessments and Personal tasks are draggable

                                    // [FIX] Safe ID for draggable items (prevents crashes on null IDs)
                                    const safeId = item.id ? String(item.id) : `temp-${item.uniqueId}-${index}`;

                                    const cardContent = (
                                        <div
                                            key={item.uniqueId}
                                            className={cn(
                                                "relative flex flex-col px-2 py-1.5 rounded-sm border-l-4 shadow-sm transition-all overflow-hidden cursor-pointer",
                                                "border-y-0 border-r-0",
                                                item.is_completed && "opacity-60 grayscale border-dashed"
                                            )}
                                            style={{
                                                borderLeftColor: itemColor,
                                                // CHANGE: increased opacity from 20% (35) to 45% (70), and end from 4% (0a) to 10% (1a)
                                                background: `linear-gradient(90deg, ${itemColor}60 0%, ${itemColor}1a 100%)`,
                                                // OPTIONAL: Add a subtle glow to make it pop even more
                                                boxShadow: `inset 1px 0 0 0 ${itemColor}40`
                                            }}
                                            onClick={(e) => {
                                                // Open reschedule/edit modal when card is clicked
                                                e.stopPropagation();
                                                handleRescheduleClick(item, e);
                                            }}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[10px] font-black tracking-tight uppercase opacity-95 flex items-center gap-1 text-white">
                                                    {isInterview && <Handshake className="w-3 h-3 text-yellow-400" />}
                                                    {isOA && <Laptop className="w-3 h-3 text-cyan-400" />}
                                                    {item.courseCode}
                                                </span>
                                                {isCareer ? (
                                                    <span
                                                        className="text-[9px] font-bold text-white px-1 rounded"
                                                        style={{ backgroundColor: isInterview ? "rgba(0,0,0,0.3)" : "rgba(6,182,212,0.3)" }}
                                                    >
                                                        {item.timeDisplay}
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-white opacity-70">
                                                        {getAssessmentType(item.name, item.type)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="font-bold text-xs leading-tight line-clamp-2 pr-4 mb-1 opacity-95 text-gray-100">
                                                {item.name}
                                            </div>

                                            <div className="text-[10px] font-medium text-white opacity-80">
                                                {isCareer ? item.description : `${item.weight}%`}
                                            </div>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleComplete(item.uniqueId, item.is_completed);
                                                }}
                                                className={cn(
                                                    "absolute bottom-2 right-2 w-5 h-5 rounded-sm border flex items-center justify-center transition-all",
                                                    item.is_completed
                                                        ? "border-current text-current"
                                                        : "border-white/10 text-transparent hover:border-white/20 bg-black/40"
                                                )}
                                                style={item.is_completed ? { backgroundColor: `${itemColor}15` } : {}}
                                            >
                                                <Check className={cn("w-3.5 h-3.5 transition-transform", item.is_completed && "scale-100", !item.is_completed && "scale-0")} />
                                            </button>
                                        </div>
                                    );

                                    // Wrap draggable items with safe ID
                                    if (isDraggable) {
                                        return (
                                            <DraggableCard key={item.uniqueId} id={safeId}>
                                                {cardContent}
                                            </DraggableCard>
                                        );
                                    }

                                    return cardContent;
                                })}
                                {hiddenCount > 0 && (
                                    <div
                                        className="mt-auto text-[10px] font-bold text-gray-500 text-center py-0.5 bg-gray-800/30 rounded cursor-pointer hover:bg-gray-800/50 transition-colors"
                                        onClick={() => setSelectedDay(dateStr)}
                                        onPointerDown={(e) => e.stopPropagation()} // [FIX] Shield from drag sensor
                                    >
                                        +{hiddenCount} More
                                    </div>
                                )}
                            </DroppableDay>
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
                                                "group flex items-center gap-6 p-4 rounded-xl border-l-4 transition-all duration-200 relative overflow-hidden mb-3",
                                                "bg-white/5 backdrop-blur-md border-white/5 hover:bg-white/10 hover:border-white/20",
                                                "border-y border-r", // Keep other borders subtle
                                                item.is_completed && "opacity-60 grayscale border-dashed"
                                            )}
                                                style={{
                                                    borderLeftColor: item.courseColor || getCourseColor(item.courseCode),
                                                    background: `linear-gradient(90deg, ${(item.courseColor || getCourseColor(item.courseCode))}25 0%, ${(item.courseColor || getCourseColor(item.courseCode))}05 100%)`
                                                }}>
                                                {/* Removed old overlays for cleaner look */}

                                                <button onClick={() => handleToggleComplete(item.uniqueId, item.is_completed)} className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ml-1 relative z-10", item.is_completed ? "bg-emerald-500 border-emerald-500 text-white scale-110" : "border-white/20 hover:border-white text-transparent")}>
                                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                </button>

                                                <div className="flex-1 min-w-0 relative z-10">
                                                    <div className="flex items-center gap-3 mb-1.5">
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border tracking-wide uppercase shadow-sm" style={{
                                                            borderColor: `${item.courseColor || getCourseColor(item.courseCode)}40`,
                                                            backgroundColor: `${item.courseColor || getCourseColor(item.courseCode)}10`, // Fallback
                                                            color: `${item.courseColor || getCourseColor(item.courseCode)}`
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
                        <div className="space-y-2">{(() => {
                            // Create a map of course codes to their colors from the actual course data
                            const courseColorMap = new Map<string, string>();
                            courses.forEach(c => {
                                courseColorMap.set(c.course_code, c.color);
                            });

                            return uniqueCourses.map((code: any) => {
                                const courseColor = courseColorMap.get(code) || getCourseColor(code);

                                return (
                                    <a
                                        key={code}
                                        href={COURSE_URLS[code] || "https://learn.uwaterloo.ca/"}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-3 rounded-lg border transition-all group relative overflow-hidden"
                                        style={{
                                            backgroundColor: `${courseColor}15`,
                                            borderColor: `${courseColor}30`
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-1.5 h-8 rounded-full"
                                                style={{ backgroundColor: courseColor }}
                                            />
                                            <div>
                                                <div className="font-bold text-sm text-white">
                                                    {code}
                                                </div>
                                                <div className="text-xs text-gray-400 font-medium">
                                                    {COURSE_TITLES[code] || "Course"}
                                                </div>
                                            </div>
                                        </div>
                                        <ExternalLink className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-all" />
                                    </a>
                                );
                            });
                        })()}</div>
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
                    {/* [UPDATED] Date Picker Trigger - Wraps the text with a hidden date input */}
                    <div className="relative group cursor-pointer">
                        <div className="text-xl font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">
                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </div>
                        <input
                            type="date"
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            onChange={(e) => {
                                if (e.target.value) {
                                    // Set date to selected value (Month jump)
                                    // Use T12:00:00 to avoid timezone drift on simple date selection
                                    setCurrentDate(new Date(`${e.target.value}T12:00:00`));
                                }
                            }}
                        />
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
                        <DndContext id="calendar-dnd" sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                            {viewMode === "month" ? renderMonthView() : renderListView()}
                        </DndContext>
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
                                    const itemColor = item.courseColor || getCourseColor(item.courseCode);

                                    return (
                                        <div
                                            key={item.uniqueId}
                                            className={cn(
                                                "group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 relative",
                                                "border-white/10",
                                                item.is_completed && "opacity-40 grayscale border-dashed"
                                            )}
                                            style={{
                                                backgroundColor: `${itemColor}15`,
                                                borderColor: `${itemColor}30`
                                            }}
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
                                                    item.uniqueId.startsWith("personal-") && "hover:bg-red-500/20 hover:border-red-500 group/del"
                                                )}
                                            >
                                                {item.uniqueId.startsWith("personal-") && !item.is_completed ? (
                                                    <Trash2 className="w-3 h-3 text-red-400 opacity-0 group-hover/del:opacity-100 transition-opacity" />
                                                ) : (
                                                    item.is_completed ? <Check className="w-3 h-3" /> : null
                                                )}
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
                                                    <span
                                                        className="text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 text-white"
                                                        style={{ backgroundColor: `${itemColor}20` }}
                                                    >
                                                        {isInterview && <Handshake className="w-3 h-3 text-yellow-400" />}
                                                        {isOA && <Laptop className="w-3 h-3 text-cyan-400" />}
                                                        {item.courseCode}
                                                    </span>
                                                    {(isCareer) ? (
                                                        <span className={cn("text-xs font-bold", isInterview ? "text-yellow-500" : "text-cyan-400")}>{item.timeDisplay}</span>
                                                    ) : (
                                                        <span className="text-xs text-white opacity-70">{item.weight}% Weight</span>
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
            {/* [NEW] ADD TASK DIALOG (CUSTOM OBSIDIAN GLASS) */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />

                        {/* Modal Container */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="w-full max-w-md relative overflow-hidden"
                        >
                            {/* Dynamic Glow Shadow */}
                            <div
                                className="absolute inset-0 blur-3xl opacity-20 transition-colors duration-700"
                                style={{ backgroundColor: getSelectedCourseColor() }}
                            />

                            <div
                                className="relative backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5 transition-colors duration-500"
                                style={{
                                    background: `linear-gradient(135deg, rgba(9, 9, 11, 0.45) 0%, ${getSelectedCourseColor()}15 100%)`
                                }}
                            >
                                {/* Ambient Background Effects */}
                                <div className="absolute inset-0 z-0 pointer-events-none">
                                    <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
                                        style={{
                                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_70%,transparent_100%)]" />
                                </div>

                                {/* Header */}
                                <div className="border-b border-white/5 px-6 py-5 flex items-center justify-between bg-white/[0.02] relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-500 shadow-inner"
                                            style={{
                                                backgroundColor: `${getSelectedCourseColor()}20`,
                                                color: getSelectedCourseColor()
                                            }}
                                        >
                                            <CalendarIcon className="w-5 h-5" strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-white tracking-tight">Add Event</h2>
                                            <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">New Calendar Item</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-500 hover:text-white"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Form Content */}
                                <div className="p-6 space-y-5 relative z-10">

                                    {/* Title Input */}
                                    <div className="group">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-white transition-colors">
                                            Title
                                        </label>
                                        <input
                                            value={newTaskData.title}
                                            onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                                            placeholder="e.g. Study for physics"
                                            className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:border-white/20 focus:bg-white/[0.07] focus:outline-none transition-all font-medium tracking-wide shadow-inner"
                                        />
                                    </div>

                                    {/* Type Selection */}
                                    <div className="flex gap-4">
                                        <div className="flex-1 space-y-2">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                                Type
                                            </label>
                                            <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
                                                <button
                                                    onClick={() => setNewTaskData({ ...newTaskData, type: 'personal' })}
                                                    className={cn(
                                                        "flex-1 text-xs py-2.5 rounded-lg font-bold transition-all",
                                                        newTaskData.type === 'personal'
                                                            ? "bg-white/10 text-white shadow-sm"
                                                            : "text-gray-500 hover:text-white hover:bg-white/5"
                                                    )}
                                                >
                                                    Personal
                                                </button>
                                                <button
                                                    onClick={() => setNewTaskData({ ...newTaskData, type: 'course_work' })}
                                                    className={cn(
                                                        "flex-1 text-xs py-2.5 rounded-lg font-bold transition-all",
                                                        newTaskData.type === 'course_work'
                                                            ? `shadow-sm ${newTaskData.course_id ? '' : 'bg-blue-500/20 text-blue-400'}`
                                                            : "text-gray-500 hover:text-white hover:bg-white/5"
                                                    )}
                                                    style={newTaskData.type === 'course_work' && newTaskData.course_id ? {
                                                        backgroundColor: `${getSelectedCourseColor()}20`,
                                                        color: getSelectedCourseColor()
                                                    } : {}}
                                                >
                                                    Course Work
                                                </button>
                                            </div>
                                        </div>

                                        {newTaskData.type === 'course_work' && (
                                            <div className="flex-1 space-y-2 animate-in fade-in slide-in-from-left-2">
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                                    Select Course
                                                </label>
                                                <div className="relative">
                                                    {/* Color indicator dot */}
                                                    {newTaskData.course_id && (
                                                        <div 
                                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full transition-colors duration-300 z-10"
                                                            style={{ backgroundColor: getSelectedCourseColor() }}
                                                        />
                                                    )}
                                                    <select
                                                        value={newTaskData.course_id}
                                                        onChange={(e) => setNewTaskData({ ...newTaskData, course_id: e.target.value })}
                                                        className={cn(
                                                            "w-full bg-white/5 border rounded-xl py-3 text-white focus:border-white/20 focus:bg-white/[0.07] focus:outline-none transition-all font-medium appearance-none cursor-pointer",
                                                            newTaskData.course_id ? "pl-8 pr-4 border-white/10" : "px-4 border-white/5"
                                                        )}
                                                        style={newTaskData.course_id ? {
                                                            borderColor: `${getSelectedCourseColor()}40`
                                                        } : {}}
                                                    >
                                                        <option value="" className="bg-zinc-900 text-gray-500">Select a course...</option>
                                                        {courses.map((c: any) => (
                                                            <option key={c.id} value={c.id} className="bg-zinc-900 text-white">
                                                                {c.course_code} - {c.course_name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Date Picker (Obsidian Style) */}
                                    <div className="group">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-white transition-colors">
                                            Date
                                        </label>
                                        <div className="relative">
                                            <input
                                                ref={newTaskDateRef}
                                                type="date"
                                                value={newTaskData.due_date}
                                                onChange={(e) => setNewTaskData({ ...newTaskData, due_date: e.target.value })}
                                                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:border-white/20 focus:bg-white/[0.07] focus:outline-none transition-all font-medium tracking-wide shadow-inner [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-4 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:w-full"
                                            />
                                            <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-white pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Action Button (Glass Gem) */}
                                    <div className="pt-2">
                                        <button
                                            onClick={handleCreateTask}
                                            disabled={isCreatingTask.current}
                                            className="group relative w-full overflow-hidden rounded-xl py-4 transition-all active:scale-[0.98] shadow-lg hover:brightness-110"
                                            style={{
                                                background: `linear-gradient(to bottom, ${getSelectedCourseColor()}cc, ${getSelectedCourseColor()}99)`,
                                                borderColor: 'rgba(255,255,255,0.1)',
                                                boxShadow: `
                                                    inset 0 1px 0 0 rgba(255,255,255,0.2), 
                                                    0 4px 20px -2px ${getSelectedCourseColor()}40,
                                                    0 0 0 1px rgba(0,0,0,0.2)
                                                `
                                            }}
                                        >
                                            <div className="flex items-center justify-center gap-2 text-white font-bold tracking-wide text-shadow-sm">
                                                {isCreatingTask.current ? (
                                                    <>
                                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        <span>Creating...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>Create Event</span>
                                                        <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                    </>
                                                )}
                                            </div>
                                        </button>
                                    </div>

                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* EDIT EVENT DIALOG (Premium Glass UI) */}
            <AnimatePresence>
                {isRescheduleOpen && rescheduleItem && (
                    <div className="fixed inset-0 flex items-center justify-center z-[200] px-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            onClick={() => setIsRescheduleOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />

                        {/* Modal Container */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="w-full max-w-lg relative overflow-hidden"
                        >
                            {(() => {
                                const itemColor = rescheduleItem.courseColor || getCourseColor(rescheduleItem.courseCode);
                                const isAssessment = !rescheduleItem.type?.includes('interview') && !rescheduleItem.type?.includes('oa') && !rescheduleItem.uniqueId?.startsWith('personal-');
                                const gradeValue = parseFloat(rescheduleScore) || 0;
                                const gradeColor = gradeValue >= 80 ? 'text-emerald-400' : gradeValue >= 60 ? 'text-yellow-400' : gradeValue > 0 ? 'text-red-400' : 'text-gray-400';

                                return (
                                    <>
                                        {/* Dynamic Glow Shadow */}
                                        <div
                                            className="absolute inset-0 blur-3xl opacity-20 transition-colors duration-700"
                                            style={{ backgroundColor: itemColor }}
                                        />

                                        <div
                                            className="relative backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5"
                                            style={{
                                                background: `linear-gradient(135deg, rgba(9, 9, 11, 0.45) 0%, ${itemColor}15 100%)`
                                            }}
                                        >
                                            {/* Ambient Background Effects */}
                                            <div className="absolute inset-0 z-0 pointer-events-none">
                                                <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
                                                    style={{
                                                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_70%,transparent_100%)]" />
                                            </div>

                                            {/* Header */}
                                            <div className="border-b border-white/5 px-6 py-5 flex items-center justify-between bg-white/[0.02] relative z-10">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-500 shadow-inner"
                                                        style={{
                                                            backgroundColor: `${itemColor}20`,
                                                            color: itemColor
                                                        }}
                                                    >
                                                        <Pencil className="w-5 h-5" strokeWidth={2.5} />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-xl font-bold text-white tracking-tight">Edit Event</h2>
                                                        <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">
                                                            {rescheduleItem.courseCode}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setIsRescheduleOpen(false)}
                                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-500 hover:text-white"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>

                                            {/* Form Content */}
                                            <div className="p-6 space-y-5 relative z-10">
                                                
                                                {/* Event Name (Editable Input) */}
                                                <div className="group">
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-white transition-colors">
                                                        Event Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={rescheduleName}
                                                        onChange={(e) => setRescheduleName(e.target.value)}
                                                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3.5 text-white focus:border-white/20 focus:bg-white/[0.07] focus:outline-none transition-all font-medium tracking-wide shadow-inner"
                                                        placeholder="Enter event name"
                                                    />
                                                </div>

                                                {/* Date/Time Input */}
                                                <div className="group">
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-white transition-colors">
                                                        {rescheduleItem.type === 'interview' || rescheduleItem.type === 'oa' ? 'Date & Time' : 'Due Date'}
                                                    </label>
                                                    <div className="relative">
                                                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-white pointer-events-none transition-colors" />
                                                        <input
                                                            ref={rescheduleDateRef}
                                                            type="datetime-local"
                                                            value={rescheduleDate}
                                                            onChange={(e) => setRescheduleDate(e.target.value)}
                                                            className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-3.5 text-white focus:border-white/20 focus:bg-white/[0.07] focus:outline-none transition-all font-medium tracking-wide shadow-inner"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Grade Input (Only for Assessments) - COMPACT VERSION */}
                                                {isAssessment && (
                                                    <div className="space-y-2.5 pt-2">
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                                            Grade Achieved (Optional)
                                                        </label>

                                                        {/* Compact Grade Card */}
                                                        <div
                                                            className="relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border rounded-xl p-5 overflow-hidden transition-all duration-300"
                                                            style={{
                                                                borderColor: gradeValue > 0 ? `${itemColor}40` : 'rgba(255,255,255,0.05)',
                                                                boxShadow: gradeValue >= 80 ? `0 0 30px ${itemColor}18, inset 0 1px 0 rgba(255,255,255,0.08)` : 'inset 0 1px 0 rgba(255,255,255,0.05)'
                                                            }}
                                                        >
                                                            {/* Ambient glow for high grades */}
                                                            {gradeValue >= 80 && (
                                                                <div
                                                                    className="absolute inset-0 opacity-8 blur-3xl animate-pulse"
                                                                    style={{ backgroundColor: itemColor }}
                                                                />
                                                            )}

                                                            {/* Grade Input */}
                                                            <div className="relative flex items-baseline justify-center gap-1.5">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="100"
                                                                    step="0.1"
                                                                    value={rescheduleScore}
                                                                    onChange={(e) => setRescheduleScore(e.target.value)}
                                                                    placeholder="--"
                                                                    className={cn(
                                                                        "text-5xl font-black text-center bg-transparent border-none outline-none w-full transition-all duration-300",
                                                                        gradeColor,
                                                                        "placeholder:text-white/10",
                                                                        "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                    )}
                                                                    style={{
                                                                        textShadow: gradeValue >= 80 ? `0 0 18px ${itemColor}50` : 'none'
                                                                    }}
                                                                />
                                                                <span className={cn("text-2xl font-bold opacity-60 transition-colors", gradeColor)}>%</span>
                                                            </div>

                                                            {/* Grade Status Badge & Weighted Score (Condensed) */}
                                                            {gradeValue > 0 && (
                                                                <div className="mt-3 flex flex-col items-center gap-1.5">
                                                                    <div className={cn(
                                                                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold backdrop-blur-sm border transition-all",
                                                                        gradeValue >= 80 ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" :
                                                                        gradeValue >= 60 ? "bg-yellow-500/10 text-yellow-300 border-yellow-500/30" :
                                                                        "bg-red-500/10 text-red-300 border-red-500/30"
                                                                    )}>
                                                                        <span className="text-xs">{gradeValue >= 80 ? "🎉" : gradeValue >= 60 ? "⚠️" : "❌"}</span>
                                                                        {gradeValue >= 80 ? "Excellent" : gradeValue >= 60 ? "Passing" : "Needs Improvement"}
                                                                    </div>

                                                                    {/* Weighted Score Display */}
                                                                    {rescheduleItem.weight && (
                                                                        <p className="text-xs text-white/35">
                                                                            Weighted: <span className={cn("font-bold", gradeColor)}>
                                                                                {(gradeValue * rescheduleItem.weight / 100).toFixed(1)}%
                                                                            </span>
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Help Text */}
                                                        {gradeValue === 0 && (
                                                            <p className="text-xs text-gray-500 text-center">
                                                                Enter your grade (0-100)
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="flex gap-3 pt-4">
                                                    <button
                                                        onClick={() => setIsRescheduleOpen(false)}
                                                        className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white font-bold py-3.5 rounded-xl transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleConfirmReschedule}
                                                        className="flex-1 group relative overflow-hidden rounded-xl py-3.5 transition-all active:scale-[0.98] shadow-lg hover:brightness-110"
                                                        style={{
                                                            background: `linear-gradient(to bottom, ${itemColor}cc, ${itemColor}99)`,
                                                            borderColor: 'rgba(255,255,255,0.1)',
                                                            boxShadow: `
                                                                inset 0 1px 0 0 rgba(255,255,255,0.2), 
                                                                0 4px 20px -2px ${itemColor}40,
                                                                0 0 0 1px rgba(0,0,0,0.2)
                                                            `
                                                        }}
                                                    >
                                                        <span className="text-white font-bold tracking-wide">Save Changes</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
