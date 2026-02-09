"use client";

import { useState, useRef } from "react";
import { addInterview } from "@/app/actions/career";
import { Calendar as CalendarIcon, Briefcase, Building2, Laptop, X, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AddInterviewDialogProps {
    isOpen: boolean;
    onClose: () => void;
    mode: "interview" | "oa";
}

export default function AddInterviewDialog({ isOpen, onClose, mode }: AddInterviewDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        company: "",
        role: "",
        date: ""
    });
    const dateInputRef = useRef<HTMLInputElement>(null);
    const isSubmitting = useRef(false);

    const isOA = mode === "oa";
    const themeColor = isOA ? "#a855f7" : "#10b981"; // Purple for OA, Emerald for Interview

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (isSubmitting.current) return;
        
        if (!formData.company.trim() || !formData.role.trim() || !formData.date) {
            alert("Please fill in all fields");
            return;
        }

        isSubmitting.current = true;
        setLoading(true);

        try {
            const form = new FormData();
            form.append("company", formData.company);
            form.append("role", formData.role);
            form.append("date", formData.date);
            form.append("type", mode);
            
            await addInterview(form);
            
            // Reset and close
            setFormData({ company: "", role: "", date: "" });
            onClose();
        } catch (e) {
            console.error(e);
            alert("Failed to add " + (isOA ? "OA" : "interview"));
        } finally {
            isSubmitting.current = false;
            setLoading(false);
        }
    }

    const handleClose = () => {
        if (!loading) {
            setFormData({ company: "", role: "", date: "" });
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
                            style={{ backgroundColor: themeColor }}
                        />

                        <div
                            className="relative backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5"
                            style={{
                                background: `linear-gradient(135deg, rgba(9, 9, 11, 0.45) 0%, ${themeColor}15 100%)`
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
                                            backgroundColor: `${themeColor}20`,
                                            color: themeColor
                                        }}
                                    >
                                        {isOA ? <Laptop className="w-5 h-5" strokeWidth={2.5} /> : <CalendarIcon className="w-5 h-5" strokeWidth={2.5} />}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white tracking-tight">
                                            {isOA ? "Log Online Assessment" : "Log Interview"}
                                        </h2>
                                        <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">
                                            {isOA ? "New OA Event" : "New Interview Event"}
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
                            <form onSubmit={handleSubmit} className="p-6 space-y-5 relative z-10">

                                {/* Company Input */}
                                <div className="group">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-white transition-colors">
                                        Company
                                    </label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-white transition-colors z-10" />
                                        <input
                                            type="text"
                                            value={formData.company}
                                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                            placeholder={isOA ? "e.g. Amazon" : "e.g. Tesla"}
                                            className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-3.5 text-white placeholder:text-white/20 focus:border-white/20 focus:bg-white/[0.07] focus:outline-none transition-all font-medium tracking-wide shadow-inner"
                                            disabled={loading}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Role Input */}
                                <div className="group">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-white transition-colors">
                                        Role
                                    </label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-white transition-colors z-10" />
                                        <input
                                            type="text"
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            placeholder={isOA ? "e.g. SDE Intern (OA)" : "e.g. Firmware Intern"}
                                            className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-3.5 text-white placeholder:text-white/20 focus:border-white/20 focus:bg-white/[0.07] focus:outline-none transition-all font-medium tracking-wide shadow-inner"
                                            disabled={loading}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Date & Time Input */}
                                <div className="group">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-white transition-colors">
                                        {isOA ? "Deadline" : "Date & Time"}
                                    </label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-white transition-colors z-10 pointer-events-none" />
                                        <input
                                            ref={dateInputRef}
                                            type="datetime-local"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-3.5 text-white placeholder:text-white/20 focus:border-white/20 focus:bg-white/[0.07] focus:outline-none transition-all font-medium tracking-wide shadow-inner"
                                            disabled={loading}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="group relative w-full overflow-hidden rounded-xl py-4 transition-all active:scale-[0.98] shadow-lg hover:brightness-110 disabled:opacity-50"
                                        style={{
                                            background: `linear-gradient(to bottom, ${themeColor}cc, ${themeColor}99)`,
                                            borderColor: 'rgba(255,255,255,0.1)',
                                            boxShadow: `
                                                inset 0 1px 0 0 rgba(255,255,255,0.2), 
                                                0 4px 20px -2px ${themeColor}40,
                                                0 0 0 1px rgba(0,0,0,0.2)
                                            `
                                        }}
                                    >
                                        <div className="flex items-center justify-center gap-2 text-white font-bold tracking-wide">
                                            {loading ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    <span>Creating...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>{isOA ? "Log Assessment" : "Confirm Interview"}</span>
                                                    <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
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