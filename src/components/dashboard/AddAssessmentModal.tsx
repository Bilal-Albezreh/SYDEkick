"use client";

import { useState, useEffect } from "react";
import { createAssessment, updateAssessmentDetails } from "@/app/actions/assessments";
import { X, Loader2, Plus, ArrowRight, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ASSESSMENT_TYPES } from "@/lib/constants";

interface AddAssessmentModalProps {
    courseId: string;
    courseColor?: string;
    isOpen: boolean;
    onClose: () => void;
    editData?: {
        id: string;
        name: string;
        type: string;
        weight: number;
        total_marks: number;
        due_date: string | null;
    } | null;
}

// Default color for assessments
const DEFAULT_ASSESSMENT_COLOR = "#4cc9f0"; // Diamond Cyan

export default function AddAssessmentModal({ courseId, courseColor, isOpen, onClose, editData = null }: AddAssessmentModalProps) {
    const isEditMode = !!editData;
    const modalColor = courseColor || DEFAULT_ASSESSMENT_COLOR;
    const [assessmentName, setAssessmentName] = useState("");
    const [selectedType, setSelectedType] = useState("");
    const [weight, setWeight] = useState("");
    const [totalMarks, setTotalMarks] = useState("100");
    const [dueDate, setDueDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pre-fill form when editing
    useEffect(() => {
        if (isOpen) {
            if (editData) {
                // If editing, use existing data. If type is missing, default to 'Assignment'
                setAssessmentName(editData.name);
                setSelectedType(editData.type || 'Assignment'); // Default for null/undefined types
                setWeight(editData.weight.toString());
                setTotalMarks(editData.total_marks.toString());
                setDueDate(editData.due_date || "");
            } else {
                // If adding new, reset form
                setAssessmentName("");
                setSelectedType("Assignment"); // Default for new items
                setWeight("");
                setTotalMarks("100");
                setDueDate("");
            }
            setError(null);
        }
    }, [editData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!assessmentName.trim() || !selectedType || !weight) {
            setError("Please fill in all required fields");
            return;
        }

        const weightNum = parseFloat(weight);
        if (isNaN(weightNum) || weightNum < 0 || weightNum > 100) {
            setError("Weight must be between 0 and 100");
            return;
        }

        const totalNum = parseFloat(totalMarks);
        if (isNaN(totalNum) || totalNum <= 0) {
            setError("Total marks must be a positive number");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let result;

            if (isEditMode && editData) {
                result = await updateAssessmentDetails(
                    editData.id,
                    dueDate || undefined,
                    undefined,
                    assessmentName
                );
            } else {
                result = await createAssessment(
                    courseId,
                    assessmentName,
                    selectedType,
                    weightNum,
                    totalNum,
                    dueDate || undefined
                );
            }

            if (!result.success) {
                setError(result.error || (isEditMode ? "Failed to update assessment" : "Failed to create assessment"));
                setLoading(false);
                return;
            }

            setAssessmentName("");
            setSelectedType("");
            setWeight("");
            setTotalMarks("100");
            setDueDate("");
            setError(null);
            setLoading(false);
            onClose();
        } catch (err: any) {
            console.error(isEditMode ? "Update assessment error:" : "Create assessment error:", err);
            setError(err.message || "An unexpected error occurred");
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setAssessmentName("");
            setSelectedType("");
            setWeight("");
            setTotalMarks("100");
            setDueDate("");
            setError(null);
            onClose();
        }
    };

    // Dynamic options logic: Ensure selected value is always in the list
    const currentOptions = [...ASSESSMENT_TYPES] as string[];
    if (editData?.type && !currentOptions.includes(editData.type)) {
        currentOptions.push(editData.type);
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-[100] px-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
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
                            style={{ backgroundColor: modalColor }}
                        />

                        <div
                            className="relative backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5 transition-colors duration-500"
                            style={{
                                background: `linear-gradient(135deg, rgba(9, 9, 11, 0.45) 0%, ${modalColor}15 100%)`
                            }}
                        >
                            {/* Ambient Background Effects */}
                            <div className="absolute inset-0 z-0 pointer-events-none">
                                {/* Noise Texture */}
                                <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                                    }}
                                />

                                {/* Subtle Grid */}
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_70%,transparent_100%)]" />
                            </div>

                            {/* Header */}
                            <div className="border-b border-white/5 px-6 py-5 flex items-center justify-between bg-white/[0.02]">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-500 shadow-inner"
                                        style={{ backgroundColor: `${modalColor}20`, color: modalColor }}
                                    >
                                        <Plus className="w-5 h-5" strokeWidth={3} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white tracking-tight">
                                            {isEditMode ? "Edit Assessment" : "Add New Assessment"}
                                        </h2>
                                        <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">
                                            {isEditMode ? "Update Details" : "Track Your Progress"}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClose}
                                    disabled={loading}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-500 hover:text-white disabled:opacity-50"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {/* Error Display */}
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3"
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                        <p className="text-sm font-medium text-red-400">{error}</p>
                                    </motion.div>
                                )}

                                <div className="space-y-4">
                                    {/* Assessment Name */}
                                    <div className="group">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-white transition-colors">
                                            Assessment Name *
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={assessmentName}
                                                onChange={(e) => setAssessmentName(e.target.value)}
                                                placeholder="e.g., Midterm Exam"
                                                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none transition-all font-medium tracking-wide shadow-inner"
                                                style={{ borderColor: assessmentName ? `${modalColor}40` : undefined }}
                                                disabled={loading}
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    {/* Assessment Type */}
                                    <div className="group">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-white transition-colors">
                                            Type *
                                        </label>
                                        <Select
                                            key={editData?.id || 'new'}
                                            value={selectedType}
                                            onValueChange={setSelectedType}
                                            disabled={loading}
                                        >
                                            <SelectTrigger className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3.5 text-white focus:border-white/20 focus:bg-white/[0.07] h-auto cursor-pointer">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-white/10 z-[200]">
                                                {currentOptions.map((type) => (
                                                    <SelectItem
                                                        key={type}
                                                        value={type}
                                                        className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                                                    >
                                                        {type}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Weight and Total Marks Row */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Weight */}
                                        <div className="group">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-white transition-colors">
                                                Weight (%) *
                                            </label>
                                            <input
                                                type="number"
                                                value={weight}
                                                onChange={(e) => setWeight(e.target.value)}
                                                placeholder="20"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:border-white/20 focus:bg-white/[0.07] focus:outline-none transition-all font-medium tracking-wide shadow-inner"
                                                disabled={loading}
                                            />
                                        </div>

                                        {/* Total Marks */}
                                        <div className="group">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-white transition-colors">
                                                Total Marks
                                            </label>
                                            <input
                                                type="number"
                                                value={totalMarks}
                                                onChange={(e) => setTotalMarks(e.target.value)}
                                                placeholder="100"
                                                min="0"
                                                step="1"
                                                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:border-white/20 focus:bg-white/[0.07] focus:outline-none transition-all font-medium tracking-wide shadow-inner"
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>

                                    {/* Due Date */}
                                    <div className="group">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-white transition-colors">
                                            Due Date (Optional)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={dueDate}
                                                onChange={(e) => setDueDate(e.target.value)}
                                                className="w-full bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-white/20 focus:border-white/20 focus:bg-white/[0.07] focus:outline-none transition-all font-medium tracking-wide shadow-inner [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                                disabled={loading}
                                            />
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-white pointer-events-none transition-colors" />
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="group relative w-full overflow-hidden rounded-xl py-4 transition-all active:scale-[0.98] shadow-lg hover:brightness-110"
                                        style={{
                                            background: modalColor,
                                            boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.2), 0 4px 20px -2px ${modalColor}40, 0 0 0 1px rgba(0,0,0,0.2)`
                                        }}
                                    >
                                        <div className="flex items-center justify-center gap-2 text-white font-bold tracking-wide text-shadow-sm">
                                            {loading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    <span>{isEditMode ? "Updating" : "Creating"} Assessment...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>{isEditMode ? "Update" : "Create"} Assessment</span>
                                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </div>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
