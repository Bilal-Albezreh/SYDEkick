"use client";

import { useState, useEffect } from "react";
import { Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { SyllabusIngestionFlow } from "@/components/dashboard/courses/SyllabusIngestionFlow";
import { createCourseFromSyllabus } from "@/app/actions/create-course-from-syllabus";

export default function SyllabusImportButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [isReviewMode, setIsReviewMode] = useState(false);

    // [FIX] Reset state when modal closes to prevent layout bugs
    useEffect(() => {
        if (!isOpen) {
            // Small delay to allow exit animation to finish before snapping back
            const timer = setTimeout(() => setIsReviewMode(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-lg hover:shadow-indigo-500/25 overflow-hidden"
            >
                {/* APPLE INTELLIGENCE GLOW BACKGROUND (Reveals on Hover) */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#bd60f3_0%,#f5b9ea_50%,#67e7f5_100%)] blur-xl" />
                </div>

                {/* [NEW] Default Background (Visible when NOT hovering, fades out on hover) */}
                <div className="absolute inset-0 bg-indigo-600 group-hover:opacity-0 transition-opacity duration-500" />

                {/* Glassy Overlay for Text Readability (Visible on hover) */}
                <div className="absolute inset-[1px] rounded-xl bg-zinc-950/20 group-hover:bg-zinc-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Content */}
                <div className="relative z-10 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-100 group-hover:text-white transition-colors" />
                    <span>Import Syllabus</span>
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        {/* 1. THE BACKDROP */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />

                        {/* 2. THE GLOWING CONTAINER */}
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.9, y: 20, width: "340px" }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                y: 0,
                                width: isReviewMode ? "115vw" : "395px",
                                height: isReviewMode ? "90vh" : "auto",
                            }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ layout: { duration: 0.6, type: "spring", bounce: 0.1 } }}
                            className={`
                                relative z-10 
                                ${isReviewMode ? "rounded-[24px]" : "rounded-[40px]"}
                                shadow-2xl
                            `}
                        >
                            {/* --- 3. THE DIFFUSE AURA (Outer Glow) --- */}
                            <div className={`
                                absolute inset-0 -z-10 blur-xl opacity-50
                                bg-[conic-gradient(from_0deg,#bd60f3_0%,#f5b9ea_40%,#67e7f5_70%,#bd60f3_100%)]
                                transition-all duration-500
                                ${isReviewMode ? "rounded-[24px]" : "rounded-[40px]"}
                            `} />

                            {/* --- CLIPPING CONTAINER (Masks the spinner) --- */}
                            <div className={`
                                absolute inset-0 overflow-hidden
                                ${isReviewMode ? "rounded-[24px]" : "rounded-[40px]"}
                            `}>
                                {/* --- THE ROTATING SIRI BORDER --- */}
                                <div className="absolute inset-0 z-0">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                        className="absolute -inset-[100%] opacity-100"
                                        style={{
                                            background: `conic-gradient(from 0deg, #bd60f3 0%, #f5b9ea 40%, #67e7f5 70%, #bd60f3 100%)`
                                        }}
                                    />
                                </div>

                                {/* --- THE MASKED BODY (Inner Content Background) --- 
                                    This creates the '1.5px border' look by being slightly smaller
                                */}
                                <div className={`
                                    absolute inset-[1.5px] z-0 bg-[#09090b] overflow-hidden
                                    ${isReviewMode ? "rounded-[22px]" : "rounded-[38px]"}
                                `}>
                                    {/* Diffuse Edge Glow Internal */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-cyan-500/10" />
                                </div>
                            </div>

                            {/* --- CONTENT --- */}
                            <div className={`relative z-10 w-full h-full flex flex-col ${isReviewMode ? "p-0" : "p-6"}`}>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="absolute top-6 right-6 z-50 p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors border border-white/10"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                <div className="flex-1 w-full h-full flex flex-col">
                                    <SyllabusIngestionFlow
                                        onAnalysisComplete={() => setIsReviewMode(true)}
                                        onConfirmExternal={async (data) => {
                                            const res = await createCourseFromSyllabus(data);
                                            if (res?.error) toast.error(res.error);
                                            else { toast.success("Imported!"); setIsOpen(false); setIsReviewMode(false); }
                                        }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
