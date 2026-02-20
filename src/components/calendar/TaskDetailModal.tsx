"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateTask, toggleTaskComplete } from "@/app/actions/tasks";
import { useRouter } from "next/navigation";

interface TaskDetailModalProps {
    item: {
        id: string;
        uniqueId: string;
        name: string; // "☑ title" — we strip the prefix
        description: string | null;
        due_date: string | null;
        priority: string;
        listName: string;
        courseColor: string;
        is_completed: boolean;
    } | null;
    onClose: () => void;
    onToggleComplete: (uniqueId: string, currentStatus: boolean) => void;
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
    low: { label: "Low", color: "#10b981" },
    medium: { label: "Medium", color: "#f59e0b" },
    high: { label: "High", color: "#ef4444" },
};

export default function TaskDetailModal({ item, onClose, onToggleComplete }: TaskDetailModalProps) {
    const router = useRouter();
    const [dueDate, setDueDate] = useState(item?.due_date ?? "");
    const [notes, setNotes] = useState(item?.description ?? "");
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    if (!item) return null;

    const title = item.name.replace(/^☑\s*/, ""); // strip prefix we added
    const color = item.courseColor;
    const priority = PRIORITY_CONFIG[item.priority] ?? PRIORITY_CONFIG.medium;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateTask(item.id, {
                due_date: dueDate || null,
                notes: notes || null,
            });
            setSaved(true);
            router.refresh();

            // Close the modal upon successful save
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
                    style={{
                        background: `linear-gradient(135deg, rgba(9,9,11,0.95) 0%, ${color}10 100%)`,
                        borderColor: `${color}30`,
                        boxShadow: `0 0 0 1px ${color}20, 0 20px 60px -10px rgba(0,0,0,0.8)`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div
                        className="px-6 py-4 border-b flex items-start justify-between gap-3"
                        style={{ borderColor: `${color}20` }}
                    >
                        <div className="flex items-start gap-3">
                            {/* Neural link color dot */}
                            <div
                                className="w-3 h-3 rounded-full mt-1 shrink-0"
                                style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}80` }}
                            />
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color }}>
                                    {item.listName}
                                </p>
                                <h2 className="text-lg font-bold text-white leading-snug">{title}</h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {/* Priority badge */}
                            <span
                                className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full"
                                style={{
                                    color: priority.color,
                                    backgroundColor: `${priority.color}20`,
                                    border: `1px solid ${priority.color}40`,
                                }}
                            >
                                {priority.label}
                            </span>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-5">
                        {/* Due Date */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                Due Date
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full bg-white/5 border rounded-xl px-4 py-3 text-white focus:border-white/20 focus:outline-none transition-all font-medium [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:w-full"
                                    style={{ borderColor: `${color}30` }}
                                />
                                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                Notes
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add notes..."
                                rows={3}
                                className="w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:border-white/20 focus:outline-none transition-all resize-none"
                                style={{ borderColor: `${color}30` }}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-5 flex items-center gap-3">
                        {/* Mark complete */}
                        <button
                            onClick={() => {
                                onToggleComplete(item.uniqueId, item.is_completed);
                                onClose();
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border"
                            style={{
                                borderColor: `${color}40`,
                                backgroundColor: `${color}15`,
                                color,
                            }}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Done
                        </button>

                        {/* Go to Tasks */}
                        <a
                            href="/dashboard/tasks"
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Go to Tasks
                        </a>

                        {/* Save */}
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="ml-auto px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110"
                            style={{
                                background: `linear-gradient(to bottom, ${color}cc, ${color}99)`,
                                boxShadow: `0 4px 12px -2px ${color}40`,
                            }}
                        >
                            {saved ? "Saved ✓" : isSaving ? "Saving..." : "Save"}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
