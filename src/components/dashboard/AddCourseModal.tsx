"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createCourse } from "@/app/actions/courses";
import { getCurrentTerm } from "@/app/actions/terms";
import { X, Loader2, Plus, ArrowRight, GraduationCap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACADEMIC_TERMS } from "@/lib/constants";

interface Term {
    id: string;
    label: string;
    is_current: boolean | null;
}

interface AddCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

// Jewel Tones for "Expensive" Feel
const COURSE_COLORS = [
    { name: "Electric Azure", hex: "#4361ee" },
    { name: "Royal Amethyst", hex: "#7209b7" },
    { name: "Neon Rose", hex: "#f72585" },
    { name: "Diamond Cyan", hex: "#4cc9f0" },
    { name: "Caribbean Emerald", hex: "#06d6a0" },
    { name: "Hermes Orange", hex: "#fb5607" },
    { name: "Solid Gold", hex: "#ffbe0b" },
    { name: "Midnight Indigo", hex: "#3a0ca3" },
    { name: "Matte Crimson", hex: "#e63946" },
    { name: "Pacific Teal", hex: "#0096c7" },
];

export default function AddCourseModal({ isOpen, onClose, onSuccess }: AddCourseModalProps) {
    const router = useRouter();
    const [courseCode, setCourseCode] = useState("");
    const [courseName, setCourseName] = useState("");
    const [selectedColor, setSelectedColor] = useState(COURSE_COLORS[0].hex);
    const [credits, setCredits] = useState(0.5);
    const [selectedTermLabel, setSelectedTermLabel] = useState("");
    const [currentTermLabel, setCurrentTermLabel] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch and pre-select the current term when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchCurrentTerm();
        }
    }, [isOpen]);

    const fetchCurrentTerm = async () => {
        try {
            const result = await getCurrentTerm();
            if (result.success && result.data) {
                const currentLabel = result.data.label;
                setCurrentTermLabel(currentLabel);
                // Pre-select the current term if no term is already selected
                if (!selectedTermLabel) {
                    setSelectedTermLabel(currentLabel);
                }
            }
        } catch (err) {
            console.error("Failed to fetch current term:", err);
        }
    };

    // Removed fetchUserTerms function as terms are now static
    // const fetchUserTerms = async () => {
    //     try {
    //         const { data: { user } } = await supabase.auth.getUser();
    //         if (!user) return;

    //         const { data: termsData, error: termsError } = await supabase
    //             .from("terms")
    //             .select("id, label, is_current")
    //             .eq("user_id", user.id)
    //             .order("start_date", { ascending: false });

    //         if (termsError) {
    //             console.error("Failed to fetch terms:", termsError);
    //             return;
    //         }

    //         setTerms(termsData || []);

    //         // Auto-select current term if not already selected
    //         if (!selectedTermId && termsData && termsData.length > 0) {
    //             const currentTerm = termsData.find(t => t.is_current);
    //             if (currentTerm) {
    //                 setSelectedTermId(currentTerm.id);
    //             }
    //         }
    //     } catch (err) {
    //         console.error("Failed to fetch terms:", err);
    //     }
    // };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!courseCode.trim() || !courseName.trim() || !selectedTermLabel) { // Changed from selectedTermId
            setError("Please fill in all fields");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await createCourse(courseCode, courseName, selectedColor, credits, selectedTermLabel); // Changed from selectedTermId
            if (!result.success) {
                setError(result.error || "Failed to create course");
                setLoading(false);
                return;
            }

            // Success - reset form and close
            setCourseCode("");
            setCourseName("");
            setSelectedColor(COURSE_COLORS[0].hex);
            setCredits(0.5);
            setSelectedTermLabel("");
            setError(null);
            setLoading(false);
            onClose();

            // Refresh and trigger success callback
            router.refresh();
            if (onSuccess) onSuccess();
        } catch (err: any) {
            console.error("Create course error:", err);
            setError(err.message || "An unexpected error occurred");
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setCourseCode("");
            setCourseName("");
            setSelectedColor(COURSE_COLORS[0].hex);
            setCredits(0.5);
            setSelectedTermLabel(""); // Changed from selectedTermId
            setError(null);
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
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
                            style={{ backgroundColor: selectedColor }}
                        />

                        <div
                            className="relative backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5 transition-colors duration-500"
                            style={{
                                background: `linear-gradient(135deg, rgba(9, 9, 11, 0.45) 0%, ${selectedColor}15 100%)`
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
                                        style={{ backgroundColor: `${selectedColor}20`, color: selectedColor }}
                                    >
                                        <Plus className="w-5 h-5" strokeWidth={3} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white tracking-tight">Add New Course</h2>
                                        <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">New Academic Journey</p>
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
                                    {/* Course Code */}
                                    <div className="group">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-white transition-colors">
                                            Course Code
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={courseCode}
                                                onChange={(e) => setCourseCode(e.target.value)}
                                                placeholder="e.g., SYDE 101"
                                                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:border-white/20 focus:bg-white/[0.07] focus:outline-none transition-all font-medium tracking-wide shadow-inner"
                                                disabled={loading}
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    {/* Course Name */}
                                    <div className="group">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-white transition-colors">
                                            Course Name
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={courseName}
                                                onChange={(e) => setCourseName(e.target.value)}
                                                placeholder="e.g., Introduction to Systems Design"
                                                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:border-white/20 focus:bg-white/[0.07] focus:outline-none transition-all font-medium tracking-wide shadow-inner"
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>

                                    {/* Term Selector */}
                                    <div className="group">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-white transition-colors">
                                            Academic Term
                                        </label>
                                        <Select value={selectedTermLabel} onValueChange={setSelectedTermLabel} disabled={loading}>
                                            <SelectTrigger className="w-full bg-white/5 border border-white/5 rounded-xl h-[52px] text-white focus:border-white/20 focus:bg-white/[0.07] transition-all font-medium tracking-wide shadow-inner">
                                                <div className="flex items-center gap-2">
                                                    <GraduationCap className="w-4 h-4 text-gray-400" />
                                                    <SelectValue placeholder="Select term">
                                                        {selectedTermLabel || "Select term"}
                                                        {selectedTermLabel && selectedTermLabel === currentTermLabel && (
                                                            <span className="ml-2 text-[10px] text-cyan-400 font-bold">• CURRENT</span>
                                                        )}
                                                    </SelectValue>
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-white/10">
                                                {ACADEMIC_TERMS.map((termLabel) => (
                                                    <SelectItem
                                                        key={termLabel}
                                                        value={termLabel}
                                                        className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                                                    >
                                                        <div className="flex items-center justify-between w-full">
                                                            <span>{termLabel}</span>
                                                            {termLabel === currentTermLabel && (
                                                                <span className="ml-3 text-[10px] text-cyan-400 font-bold">CURRENT</span>
                                                            )}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-gray-500 mt-1.5">
                                            {selectedTermLabel ? `Selected: ${selectedTermLabel}` : "Select which term this course belongs to"}
                                        </p>
                                    </div>

                                    {/* Credits */}
                                    <div className="group">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-white transition-colors">
                                            Credits (for GPA)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={credits}
                                                onChange={(e) => setCredits(parseFloat(e.target.value))}
                                                min="0"
                                                max="10"
                                                step="0.25"
                                                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:border-white/20 focus:bg-white/[0.07] focus:outline-none transition-all font-medium tracking-wide shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                disabled={loading}
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
                                                {credits === 0.25 ? "Lab" : credits === 0.5 ? "Standard" : credits === 1.0 ? "Full" : "Custom"}
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1.5">
                                            Lab: 0.25 • Standard: 0.5 • Full: 1.0
                                        </p>
                                    </div>
                                </div>

                                {/* Color Picker */}
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                                        Theme Color
                                    </label>
                                    <div className="grid grid-cols-5 gap-3">
                                        {COURSE_COLORS.map((color) => (
                                            <button
                                                key={color.hex}
                                                type="button"
                                                onClick={() => setSelectedColor(color.hex)}
                                                disabled={loading}
                                                className="group relative flex items-center justify-center outline-none"
                                            >
                                                <div
                                                    className={cn(
                                                        "w-12 h-12 rounded-xl transition-all duration-300 shadow-lg",
                                                        selectedColor === color.hex
                                                            ? "scale-100 ring-2 ring-white ring-offset-2 ring-offset-[#18181b]"
                                                            : "scale-90 opacity-40 hover:opacity-80 hover:scale-95"
                                                    )}
                                                    style={{ backgroundColor: color.hex }}
                                                />
                                                {/* Tooltip */}
                                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black px-2 py-1 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
                                                    {color.name}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="group relative w-full overflow-hidden rounded-xl py-4 transition-all active:scale-[0.98] shadow-lg hover:brightness-110"
                                        style={{
                                            background: `linear-gradient(to bottom, ${selectedColor}cc, ${selectedColor}99)`,
                                            borderColor: 'rgba(255,255,255,0.1)',
                                            boxShadow: `
                                                inset 0 1px 0 0 rgba(255,255,255,0.2), 
                                                0 4px 20px -2px ${selectedColor}40,
                                                0 0 0 1px rgba(0,0,0,0.2)
                                            `
                                        }}
                                    >
                                        <div className="flex items-center justify-center gap-2 text-white font-bold tracking-wide text-shadow-sm">
                                            {loading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    <span>Creating Course...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Create Course</span>
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
