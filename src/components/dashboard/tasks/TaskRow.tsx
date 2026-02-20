"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, Trash2, Calendar, ChevronDown, Tag, FileText, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";
import ElectricBorder from "@/components/ui/ElectricBorder";

// DB-shaped task (priority comes as string, created_at may be null)
type DbTask = Omit<Task, "priority" | "created_at"> & {
    priority: string;
    created_at: string | null;
};

// ── Types ──
interface CourseOption {
    id: string;
    course_code: string;
    course_name: string;
    color: string;
}

interface TaskRowProps {
    task: DbTask;
    listColor: string;
    courses: CourseOption[];
    isExpanded: boolean;
    onExpand: () => void;
    onToggle: (taskId: string) => void;
    onDelete: (taskId: string) => void;
    onUpdate: (taskId: string, fields: Partial<Pick<Task, "title" | "description" | "due_date" | "priority" | "course_id" | "notes" | "position">>) => void;
}

const PRIORITY_CONFIG = {
    low: { label: "Low", color: "#22c55e", glow: "#22c55e40" },
    medium: { label: "Med", color: "#f59e0b", glow: "#f59e0b40" },
    high: { label: "High", color: "#ef4444", glow: "#ef444440" },
} as const;

export default function TaskRow({
    task,
    listColor,
    courses,
    isExpanded,
    onExpand,
    onToggle,
    onDelete,
    onUpdate,
}: TaskRowProps) {
    const notesTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const linkedCourse = task.course_id
        ? courses.find((c) => c.id === task.course_id) ?? null
        : null;

    const handleNotesChange = useCallback(
        (value: string) => {
            if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current);
            notesTimeoutRef.current = setTimeout(() => {
                onUpdate(task.id, { notes: value || null });
            }, 600);
        },
        [task.id, onUpdate]
    );

    const handleDescriptionChange = useCallback(
        (value: string) => {
            if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current);
            notesTimeoutRef.current = setTimeout(() => {
                onUpdate(task.id, { description: value || null });
            }, 600);
        },
        [task.id, onUpdate]
    );

    return (
        <motion.div
            layout
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            style={{
                transform: CSS.Translate.toString(transform),
                transition,
                zIndex: isDragging ? 50 : "auto",
            }}
            initial={{ opacity: 0, y: -8 }}
            animate={{
                opacity: isDragging ? 0.6 : 1,
                y: 0,
                scale: isDragging ? 1.02 : 1
            }}
            exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
            transition={{ duration: 0.2, layout: { duration: 0.25 } }}
            className={cn(
                "group rounded-[14px] border transition-colors relative touch-none cursor-grab active:cursor-grabbing",
                task.is_completed
                    ? "bg-white/[0.01] border-white/[0.03]"
                    : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]",
                isDragging ? "shadow-xl border-white/20 opacity-60" : ""
            )}
        >
            {/* ── Collapsed Row ── */}
            <div
                className="flex items-center gap-4 p-3 pl-4 cursor-pointer select-none"
                onClick={(e) => {
                    // Stop propagation so clicking the row doesn't trigger drag unexpectedly if we only wanted to expand it 
                    // Wait, actually dnd-kit pointer sensor distance:5 will allow clicks.
                    if (!task.is_completed) onExpand();
                }}
            >
                {/* Checkbox with Neural Link glow */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle(task.id);
                    }}
                    className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200"
                    )}
                    style={{
                        borderColor: task.is_completed ? listColor : `${listColor}60`,
                        backgroundColor: task.is_completed ? listColor : "transparent",
                        boxShadow: task.is_completed
                            ? `0 0 8px ${listColor}50`
                            : "none",
                    }}
                >
                    {task.is_completed && (
                        <Check className="w-3 h-3 text-black" />
                    )}
                </button>

                {/* Title */}
                <span
                    className={cn(
                        "flex-1 text-sm font-medium transition-all duration-200",
                        task.is_completed
                            ? "line-through opacity-30 text-white/50"
                            : "text-white"
                    )}
                >
                    {task.title}
                </span>

                {/* Course tag pill (collapsed) */}
                {linkedCourse && (
                    <span
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
                        style={{
                            backgroundColor: `${linkedCourse.color}25`,
                            color: linkedCourse.color,
                        }}
                    >
                        {linkedCourse.course_code}
                    </span>
                )}

                {/* Priority dot */}
                {!task.is_completed && (
                    <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                            backgroundColor: (PRIORITY_CONFIG as any)[task.priority]?.color ?? PRIORITY_CONFIG.medium.color,
                            boxShadow: `0 0 6px ${(PRIORITY_CONFIG as any)[task.priority]?.glow ?? PRIORITY_CONFIG.medium.glow}`,
                        }}
                    />
                )}

                {/* Due date pill */}
                {task.due_date && (
                    <span className="bg-white/5 border border-white/10 text-[10px] text-white/40 px-2 py-1 rounded-md font-mono whitespace-nowrap">
                        {new Date(task.due_date.split('T')[0] + "T00:00:00").toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                        })}
                    </span>
                )}

                {/* Expand chevron */}
                {!task.is_completed && (
                    <ChevronDown
                        className={cn(
                            "w-3.5 h-3.5 text-white/20 transition-transform duration-200",
                            isExpanded && "rotate-180"
                        )}
                    />
                )}

                {/* Delete */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(task.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* ── Tactical Panel (Expanded) ── */}
            <AnimatePresence>
                {isExpanded && !task.is_completed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-white/[0.05]">
                            {/* Row 1: Course Tag + Priority */}
                            <div className="flex items-start gap-4">
                                {/* Course Tag Selector */}
                                <div className="flex-1 space-y-1.5">
                                    <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold flex items-center gap-1.5">
                                        <Tag className="w-3 h-3" />
                                        Course Link
                                    </label>
                                    <select
                                        value={task.course_id || ""}
                                        onChange={(e) =>
                                            onUpdate(task.id, {
                                                course_id: e.target.value || null,
                                            })
                                        }
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30 transition-colors appearance-none cursor-pointer"
                                    >
                                        <option value="" className="bg-[#111] text-white/50">
                                            None
                                        </option>
                                        {courses.map((c) => (
                                            <option
                                                key={c.id}
                                                value={c.id}
                                                className="bg-[#111]"
                                            >
                                                {c.course_code} — {c.course_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Priority Selector with ElectricBorder */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold">
                                        Priority
                                    </label>
                                    <div className="flex gap-1.5">
                                        {(
                                            Object.entries(PRIORITY_CONFIG) as [
                                                Task["priority"],
                                                (typeof PRIORITY_CONFIG)[Task["priority"]],
                                            ][]
                                        ).map(([key, cfg]) => {
                                            const isActive = task.priority === key;
                                            const btn = (
                                                <button
                                                    onClick={() =>
                                                        onUpdate(task.id, { priority: key })
                                                    }
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                                        isActive
                                                            ? "text-black"
                                                            : "text-white/40 bg-white/5 hover:bg-white/10"
                                                    )}
                                                    style={
                                                        isActive
                                                            ? {
                                                                backgroundColor: cfg.color,
                                                                boxShadow: `0 0 12px ${cfg.glow}`,
                                                            }
                                                            : undefined
                                                    }
                                                >
                                                    {cfg.label}
                                                </button>
                                            );

                                            if (isActive) {
                                                return (
                                                    <ElectricBorder
                                                        key={key}
                                                        color={cfg.color}
                                                        speed={0.6}
                                                        chaos={0.1}
                                                        borderRadius={8}
                                                    >
                                                        {btn}
                                                    </ElectricBorder>
                                                );
                                            }

                                            return (
                                                <div key={key}>{btn}</div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: Date Trigger */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" />
                                    Due Date
                                </label>
                                <input
                                    type="date"
                                    value={task.due_date ? task.due_date.split('T')[0] : ""}
                                    onChange={(e) =>
                                        onUpdate(task.id, {
                                            due_date: e.target.value || null,
                                        })
                                    }
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30 transition-colors [color-scheme:dark]"
                                />
                            </div>

                            {/* Row 3: Description / Notes */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold flex items-center gap-1.5">
                                    <FileText className="w-3 h-3" />
                                    Notes
                                </label>
                                <textarea
                                    autoFocus
                                    defaultValue={task.notes || ""}
                                    onChange={(e) => handleNotesChange(e.target.value)}
                                    placeholder="Add notes..."
                                    rows={2}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-white/30 transition-colors resize-none"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
