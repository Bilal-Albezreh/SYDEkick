"use client";

import { Plus } from "lucide-react";

export default function EmptyCoursesState() {
    const handleAddCourse = () => {
        // Find and click the Add Course button
        const addButton = document.querySelector('[class*="from-cyan-600"]') as HTMLButtonElement;
        addButton?.click();
    };

    return (
        <div className="h-[700px] flex items-center justify-center bg-black/30 backdrop-blur-md border border-white/10 rounded-xl">
            <div className="text-center px-8 max-w-md">
                <div className="mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-10 h-10 text-cyan-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Your term is ready</h2>
                    <p className="text-gray-400">
                        Add your first course to get started with grade tracking, scheduling, and more.
                    </p>
                </div>
                <button
                    onClick={handleAddCourse}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90 text-white font-bold rounded-lg transition-all shadow-lg shadow-cyan-500/25 animate-pulse"
                >
                    <Plus className="w-5 h-5" />
                    Add Your First Course
                </button>
            </div>
        </div>
    );
}
