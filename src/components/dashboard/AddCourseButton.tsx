"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import AddCourseModal from "./AddCourseModal";

interface AddCourseButtonProps {
    buttonText?: string;
}

export default function AddCourseButton({ buttonText = "Add Course" }: AddCourseButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-lg hover:shadow-indigo-500/25 overflow-hidden"
            >
                {/* APPLE INTELLIGENCE GLOW BACKGROUND */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#bd60f3_0%,#f5b9ea_50%,#67e7f5_100%)] blur-xl" />
                </div>

                {/* Standard Gradient Background (Visible when not hovering) */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 group-hover:opacity-0 transition-opacity duration-500" />

                {/* Glassy Overlay for Text Readability (Visible on hover) */}
                <div className="absolute inset-[1px] rounded-xl bg-zinc-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Content */}
                <div className="relative z-10 flex items-center gap-2">
                    <Plus className="w-5 h-5 group-hover:text-white transition-colors" />
                    <span>{buttonText}</span>
                </div>
            </button>

            <AddCourseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
