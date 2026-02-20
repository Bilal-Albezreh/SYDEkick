"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { Plus, ListTodo, Check, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";
import TaskRow from "./TaskRow";
import {
    createTaskList,
    createTask as createTaskAction,
    toggleTaskComplete,
    deleteTask as deleteTaskAction,
    deleteTaskList,
    updateTask,
} from "@/app/actions/tasks";
import { LIST_COLOR_PALETTE } from "@/lib/taskColors";

// ── Types ──
// DB-shaped task (priority comes as string, created_at may be null)
type DbTask = Omit<Task, "priority" | "created_at"> & {
    priority: string;
    position: number;
    created_at: string | null;
};

interface TaskListWithTasks {
    id: string;
    user_id: string;
    name: string;
    color_hex: string;
    created_at: string | null;
    tasks: DbTask[];
}

const GridOverlay = () => (
    <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
            backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            maskImage: "linear-gradient(to bottom, black, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent)"
        }}
    />
);

interface CourseOption {
    id: string;
    course_code: string;
    course_name: string;
    color: string;
}

const PRIORITY_CONFIG = {
    low: { label: "Low", color: "#22c55e", glow: "#22c55e40" },
    medium: { label: "Med", color: "#f59e0b", glow: "#f59e0b40" },
    high: { label: "High", color: "#ef4444", glow: "#ef444440" },
} as const;

interface TasksEngineProps {
    initialLists: TaskListWithTasks[];
    courses: CourseOption[];
}

export default function TasksEngine({ initialLists, courses }: TasksEngineProps) {
    const [lists, setLists] = useState<TaskListWithTasks[]>(initialLists);
    const [activeListId, setActiveListId] = useState<string | null>(
        initialLists.length > 0 ? initialLists[0].id : null
    );
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newListName, setNewListName] = useState("");
    const [isAddingList, setIsAddingList] = useState(false);
    const [selectedColorIdx, setSelectedColorIdx] = useState(0);
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

    // ── New Task Ghost Row State ──
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTaskPriority, setNewTaskPriority] = useState<Task["priority"]>("medium");
    const [newTaskCourseId, setNewTaskCourseId] = useState<string | null>(null);
    const [newTaskDueDate, setNewTaskDueDate] = useState<string | null>(null);
    const [newTaskNotes, setNewTaskNotes] = useState<string>("");
    const ghostTitleRef = useRef<HTMLInputElement>(null);

    // ── Derived state ──
    const activeList = useMemo(
        () => lists.find((l) => l.id === activeListId) ?? null,
        [lists, activeListId]
    );

    // Auto-sort: sort by position ASC, then incomplete first. Completed ghost to bottom natively
    const sortedTasks = useMemo(() => {
        if (!activeList) return [];

        // Ensure positional stability logic applies to active lists 
        const sorted = [...activeList.tasks].sort((a, b) => {
            // Completed always pushed to bottom
            if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
            // Otherwise sort by their set position
            return a.position - b.position;
        });

        return sorted;
    }, [activeList]);

    const completedCount = activeList
        ? activeList.tasks.filter((t) => t.is_completed).length
        : 0;

    const listColor = activeList?.color_hex ?? "#6366f1";

    // ── Handlers ──

    const handleAddList = useCallback(async () => {
        if (!newListName.trim()) return;
        const color = LIST_COLOR_PALETTE[selectedColorIdx];
        // Optimistic
        const tempId = crypto.randomUUID();
        const tempList: TaskListWithTasks = {
            id: tempId,
            user_id: "",
            name: newListName.trim(),
            color_hex: color,
            created_at: new Date().toISOString(),
            tasks: [],
        };
        setLists((prev) => [...prev, tempList]);
        setActiveListId(tempId);
        setNewListName("");
        setIsAddingList(false);
        setSelectedColorIdx((i) => (i + 1) % LIST_COLOR_PALETTE.length);

        // Persist
        const result = await createTaskList({ name: tempList.name, color_hex: color });
        if (result.success && result.list) {
            setLists((prev) =>
                prev.map((l) =>
                    l.id === tempId ? { ...l, id: result.list!.id, user_id: result.list!.user_id } : l
                )
            );
            setActiveListId((prev) => (prev === tempId ? result.list!.id : prev));
        } else {
            // ROLLBACK: remove the optimistic temp list
            console.error("[TASKS UI] createTaskList FAILED — rolling back.", result.error);
            setLists((prev) => prev.filter((l) => l.id !== tempId));
            setActiveListId((prev) => (prev === tempId ? (lists.length > 0 ? lists[0].id : null) : prev));
        }
    }, [newListName, selectedColorIdx, lists]);

    const handleDeleteList = useCallback(async (listId: string) => {
        setLists((prev) => prev.filter((l) => l.id !== listId));
        setActiveListId((prev) => {
            if (prev !== listId) return prev;
            const remaining = lists.filter((l) => l.id !== listId);
            return remaining.length > 0 ? remaining[0].id : null;
        });
        await deleteTaskList(listId);
    }, [lists]);

    const handleAddTask = useCallback(async () => {
        if (!newTaskTitle.trim() || !activeListId) return;
        const tempId = crypto.randomUUID();
        const tempTask: DbTask = {
            id: tempId,
            user_id: "",
            list_id: activeListId,
            title: newTaskTitle.trim(),
            description: null,
            is_completed: false,
            due_date: newTaskDueDate,
            priority: newTaskPriority,
            course_id: newTaskCourseId,
            notes: newTaskNotes || null,
            position: sortedTasks.length, // Put at end of current incomplete pile
            created_at: new Date().toISOString(),
        };

        setLists((prev) =>
            prev.map((l) =>
                l.id === activeListId ? { ...l, tasks: [tempTask, ...l.tasks] } : l
            )
        );

        // Reset ghost row fields and collapse dropdown
        setIsAddingTask(false);
        setNewTaskTitle("");
        setNewTaskNotes("");
        setNewTaskDueDate(null);
        setNewTaskCourseId(null);
        setNewTaskPriority("medium");

        const result = await createTaskAction({
            list_id: activeListId,
            title: tempTask.title,
            due_date: tempTask.due_date,
            priority: tempTask.priority,
            course_id: tempTask.course_id,
            notes: tempTask.notes
        });
        if (result.success && result.task) {
            setLists((prev) =>
                prev.map((l) =>
                    l.id === activeListId
                        ? {
                            ...l,
                            tasks: l.tasks.map((t) =>
                                t.id === tempId ? { ...t, ...result.task } : t
                            ),
                        }
                        : l
                )
            );
        } else {
            // ROLLBACK: remove the optimistic temp task
            console.error("[TASKS UI] createTask FAILED — rolling back.", result.error);
            setLists((prev) =>
                prev.map((l) =>
                    l.id === activeListId
                        ? { ...l, tasks: l.tasks.filter((t) => t.id !== tempId) }
                        : l
                )
            );
        }
    }, [newTaskTitle, activeListId]);

    const handleToggleTask = useCallback(async (taskId: string) => {
        // 0ms Optimistic
        setLists((prev) =>
            prev.map((l) => ({
                ...l,
                tasks: l.tasks.map((t) =>
                    t.id === taskId ? { ...t, is_completed: !t.is_completed } : t
                ),
            }))
        );
        const task = lists.flatMap((l) => l.tasks).find((t) => t.id === taskId);
        await toggleTaskComplete(taskId, !task?.is_completed);
    }, [lists]);

    const handleDeleteTask = useCallback(async (taskId: string) => {
        setLists((prev) =>
            prev.map((l) => ({
                ...l,
                tasks: l.tasks.filter((t) => t.id !== taskId),
            }))
        );
        await deleteTaskAction(taskId);
    }, []);

    const handleUpdateTask = useCallback(
        async (taskId: string, fields: Record<string, any>) => {
            // Optimistic
            setLists((prev) =>
                prev.map((l) => ({
                    ...l,
                    tasks: l.tasks.map((t) =>
                        t.id === taskId ? { ...t, ...fields } : t
                    ),
                }))
            );
            await updateTask(taskId, fields);
        },
        []
    );

    // ── DRAG AND DROP HANDLERS ──
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px movement before drag starts (allows clicks on inner elements)
            },
        })
    );

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id || !activeListId) return;

        let tasksToUpdate: { id: string; position: number }[] = [];

        setLists((prev) =>
            prev.map((list) => {
                if (list.id !== activeListId) return list;

                // Find old and new indices based on the sorted array visually presented
                const oldIndex = sortedTasks.findIndex((t) => t.id === active.id);
                const newIndex = sortedTasks.findIndex((t) => t.id === over.id);

                if (oldIndex === -1 || newIndex === -1) return list;

                // Create visually reordered array
                const newOrderedTasks = arrayMove(sortedTasks, oldIndex, newIndex);

                // Update the positions sequentially
                const updatedTasks = newOrderedTasks.map((t, idx) => ({ ...t, position: idx }));

                // Track tasks that need backend updates
                updatedTasks.forEach((t) => {
                    const originalTask = list.tasks.find(ot => ot.id === t.id);
                    if (originalTask && originalTask.position !== t.position) {
                        tasksToUpdate.push({ id: t.id, position: t.position });
                    }
                });

                // Splice the updated items back into the master timeline
                return {
                    ...list,
                    tasks: list.tasks.map(t => updatedTasks.find(ut => ut.id === t.id) || t)
                };
            })
        );

        // Fire off async backend updates AFTER state update to prevent rendering conflicts
        // We don't await because optimistic is faster visually
        tasksToUpdate.forEach((t) => {
            updateTask(t.id, { position: t.position });
        });
    }, [activeListId, sortedTasks]);

    // ── RENDER ──
    return (
        <div className="relative flex-1 flex gap-6 h-[calc(100vh-6rem)] overflow-hidden">
            {/* ── LEFT COLUMN: List Navigation ── */}
            <div className="w-1/4 min-w-[220px] h-full flex flex-col bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-3xl p-5 z-10 shadow-lg relative overflow-hidden">
                <GridOverlay />
                <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 relative z-20">
                    My Lists
                </h2>

                <div className="flex-1 space-y-1 overflow-y-auto relative z-20">
                    {lists.map((list) => {
                        const count = list.tasks.filter((t) => !t.is_completed).length;
                        const isActive = list.id === activeListId;
                        return (
                            <div
                                key={list.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => setActiveListId(list.id)}
                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setActiveListId(list.id); }}
                                className={cn(
                                    "group/list w-full flex items-center justify-between gap-3 px-4 py-3 rounded-[14px] text-sm font-medium transition-all duration-300 text-left cursor-pointer border",
                                    isActive
                                        ? "bg-white/[0.08] text-white"
                                        : "text-white/50 bg-transparent hover:bg-white/[0.04] hover:text-white/80 border-transparent hover:border-white/[0.05]"
                                )}
                                style={isActive ? {
                                    borderColor: `${list.color_hex}40`,
                                    boxShadow: `inset 0 0 20px -5px ${list.color_hex}30, 0 0 15px -3px ${list.color_hex}20`
                                } : undefined}
                            >
                                <div className="flex items-center gap-3">
                                    {/* Neural Link color dot */}
                                    <div
                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{
                                            backgroundColor: list.color_hex,
                                            boxShadow: isActive
                                                ? `0 0 8px ${list.color_hex}80`
                                                : "none",
                                        }}
                                    />
                                    <span className="truncate">{list.name}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {count > 0 && (
                                        <span
                                            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md min-w-[20px] text-center"
                                            style={{
                                                backgroundColor: isActive
                                                    ? `${list.color_hex}20`
                                                    : "rgba(255,255,255,0.05)",
                                                color: isActive
                                                    ? list.color_hex
                                                    : "rgba(255,255,255,0.4)",
                                                border: `1px solid ${isActive ? `${list.color_hex}40` : "transparent"}`
                                            }}
                                        >
                                            {count}
                                        </span>
                                    )}
                                    {/* Delete list on hover */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteList(list.id);
                                        }}
                                        className="opacity-0 group-hover/list:opacity-100 p-1 rounded text-white/20 hover:text-red-400 transition-all"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Add New List */}
                <AnimatePresence mode="wait">
                    {isAddingList ? (
                        <motion.div
                            key="add-list-form"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 space-y-2 overflow-hidden relative z-20"
                        >
                            <div className="flex gap-2">
                                <input
                                    autoFocus
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleAddList();
                                        if (e.key === "Escape") setIsAddingList(false);
                                    }}
                                    placeholder="List name..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-white/30 transition-colors"
                                />
                                <button
                                    onClick={handleAddList}
                                    className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                            </div>
                            {/* Color palette */}
                            <div className="flex gap-1.5 px-1">
                                {LIST_COLOR_PALETTE.map((color, idx) => (
                                    <button
                                        key={color}
                                        onClick={() => setSelectedColorIdx(idx)}
                                        className={cn(
                                            "w-5 h-5 rounded-full transition-all",
                                            selectedColorIdx === idx
                                                ? "ring-2 ring-white ring-offset-2 ring-offset-black scale-110"
                                                : "hover:scale-110"
                                        )}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.button
                            key="add-list-btn"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => setIsAddingList(true)}
                            className="mt-4 flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all border border-dashed border-white/10 hover:border-white/20"
                        >
                            <Plus className="w-4 h-4" />
                            <span>New List</span>
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* ── RIGHT COLUMN: Task Feed ── */}
            <div
                className="flex-1 h-full flex flex-col bg-white/[0.02] backdrop-blur-3xl rounded-3xl p-6 z-10 shadow-lg transition-all relative overflow-hidden border border-white/10"
            >
                <GridOverlay />
                {activeList ? (
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6 relative z-20">
                            <div>
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{
                                            backgroundColor: listColor,
                                            boxShadow: `0 0 10px ${listColor}60`,
                                        }}
                                    />
                                    <h1 className="text-2xl font-bold text-white">
                                        {activeList.name}
                                    </h1>
                                </div>
                                <p className="text-xs text-white/30 mt-1 font-mono ml-6">
                                    {completedCount}/{activeList.tasks.length} completed
                                </p>
                            </div>
                        </div>

                        {/* Seamless Task Input / Ghost Row */}
                        <div className="relative mb-6 z-20">
                            <div className={cn(
                                "group rounded-[14px] border transition-all relative overflow-hidden",
                                isAddingTask
                                    ? "bg-white/[0.03] border-white/[0.06] shadow-xl"
                                    : "bg-transparent border-transparent hover:bg-white/[0.02]"
                            )}>
                                {isAddingTask && <GridOverlay />}

                                <div className="flex items-center gap-4 p-3 pl-4 relative z-20">
                                    {/* Plus Icon (replaces checkbox) */}
                                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                        <Plus className="w-4 h-4 text-white/40" />
                                    </div>

                                    {/* Title Input */}
                                    <input
                                        ref={ghostTitleRef}
                                        value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                        onFocus={() => setIsAddingTask(true)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleAddTask();
                                            if (e.key === "Escape") {
                                                setIsAddingTask(false);
                                                setNewTaskTitle("");
                                            }
                                        }}
                                        placeholder="Add a task..."
                                        className="flex-1 bg-transparent text-sm font-medium text-white placeholder-white/40 outline-none"
                                    />

                                    {isAddingTask && (
                                        <button
                                            onClick={handleAddTask}
                                            disabled={!newTaskTitle.trim()}
                                            className="px-3 py-1 text-xs font-bold rounded bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:hover:bg-white/10 transition-colors"
                                        >
                                            Create
                                        </button>
                                    )}
                                </div>

                                {/* Tactical Panel Expansion */}
                                <AnimatePresence>
                                    {isAddingTask && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="relative z-20 overflow-hidden"
                                        >
                                            <div className="px-4 pb-4 pt-1 space-y-4 border-t border-white/[0.05] mt-1">
                                                {/* Row 1: Course + Priority */}
                                                <div className="flex items-start gap-4">
                                                    <div className="flex-1 space-y-1.5">
                                                        <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Course</label>
                                                        <select
                                                            value={newTaskCourseId || ""}
                                                            onChange={(e) => setNewTaskCourseId(e.target.value || null)}
                                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none cursor-pointer appearance-none"
                                                        >
                                                            <option value="" className="bg-[#111]">None</option>
                                                            {courses.map(c => (
                                                                <option key={c.id} value={c.id} className="bg-[#111]">
                                                                    {c.course_code}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Priority</label>
                                                        <div className="flex gap-1.5">
                                                            {(Object.entries(PRIORITY_CONFIG) as [Task["priority"], any][]).map(([key, cfg]) => {
                                                                const isActive = newTaskPriority === key;
                                                                return (
                                                                    <button
                                                                        key={key}
                                                                        onClick={() => setNewTaskPriority(key)}
                                                                        className={cn(
                                                                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                                                            isActive ? "text-black" : "text-white/40 bg-white/5 hover:bg-white/10"
                                                                        )}
                                                                        style={isActive ? { backgroundColor: cfg.color, boxShadow: `0 0 12px ${cfg.glow}` } : undefined}
                                                                    >
                                                                        {cfg.label}
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Date Row + Smart Chips */}
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Due Date</label>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="date"
                                                            value={newTaskDueDate ? newTaskDueDate.split('T')[0] : ""}
                                                            onChange={(e) => setNewTaskDueDate(e.target.value ? new Date(e.target.value).toISOString() : null)}
                                                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none [color-scheme:dark]"
                                                        />
                                                        <div className="flex gap-1.5">
                                                            {["Today", "Tomorrow"].map(label => {
                                                                const d = new Date();
                                                                if (label === "Tomorrow") d.setDate(d.getDate() + 1);
                                                                const dateStr = d.toISOString().split('T')[0];
                                                                const isSelected = newTaskDueDate?.startsWith(dateStr);

                                                                return (
                                                                    <button
                                                                        key={label}
                                                                        onClick={() => setNewTaskDueDate(isSelected ? null : d.toISOString())}
                                                                        className={cn(
                                                                            "px-3 py-1.5 rounded text-xs font-mono font-bold transition-all border",
                                                                            isSelected
                                                                                ? "text-white border-transparent"
                                                                                : "text-white/40 bg-white/5 border-white/5 hover:bg-white/10 hover:text-white/70"
                                                                        )}
                                                                        style={isSelected ? {
                                                                            backgroundColor: `${listColor}40`,
                                                                            textShadow: `0 0 8px ${listColor}`,
                                                                            boxShadow: `inset 0 0 10px ${listColor}40`
                                                                        } : undefined}
                                                                    >
                                                                        {label}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Notes Row */}
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Notes</label>
                                                    <textarea
                                                        value={newTaskNotes}
                                                        onChange={(e) => setNewTaskNotes(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter" && !e.shiftKey) {
                                                                e.preventDefault();
                                                                handleAddTask();
                                                            }
                                                        }}
                                                        placeholder="Add notes..."
                                                        rows={2}
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 outline-none resize-none"
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Task Feed */}
                        <div className="flex-1 overflow-y-auto space-y-1 relative z-20">
                            {sortedTasks.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-white/20">
                                    <ListTodo className="w-12 h-12 mb-4 opacity-30" />
                                    <p className="text-sm font-medium">No tasks yet</p>
                                    <p className="text-xs mt-1">
                                        Press Enter above to add your first task
                                    </p>
                                </div>
                            )}

                            <AnimatePresence initial={false}>
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                    modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
                                >
                                    <SortableContext
                                        items={sortedTasks.map((t) => t.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {sortedTasks.map((task) => (
                                            <TaskRow
                                                key={task.id}
                                                task={task}
                                                listColor={listColor}
                                                courses={courses}
                                                isExpanded={expandedTaskId === task.id}
                                                onExpand={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                                                onToggle={handleToggleTask}
                                                onDelete={handleDeleteTask}
                                                onUpdate={handleUpdateTask}
                                            />
                                        ))}
                                    </SortableContext>
                                </DndContext>
                            </AnimatePresence>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-white/20">
                        <ListTodo className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg font-medium">No lists yet</p>
                        <p className="text-sm mt-1">
                            Create a list from the sidebar to get started
                        </p>
                    </div>
                )}
            </div>
        </div >
    );
}
