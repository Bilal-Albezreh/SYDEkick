"use client";

import { useState } from "react";
import { createCourse } from "@/app/actions/courses";
import { X, Loader2, Plus } from "lucide-react";

interface AddCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PRESET_COLORS = [
    { name: "Blue", hex: "#3b82f6" },
    { name: "Purple", hex: "#8b5cf6" },
    { name: "Pink", hex: "#be185d" },
    { name: "Red", hex: "#ef4444" },
    { name: "Orange", hex: "#f97316" },
    { name: "Yellow", hex: "#eab308" },
    { name: "Green", hex: "#10b981" },
    { name: "Teal", hex: "#06b6d4" },
    { name: "Indigo", hex: "#6366f1" },
    { name: "Gray", hex: "#6b7280" },
];

export default function AddCourseModal({ isOpen, onClose }: AddCourseModalProps) {
    const [courseCode, setCourseCode] = useState("");
    const [courseName, setCourseName] = useState("");
    const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].hex);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!courseCode.trim() || !courseName.trim()) {
            setError("Please fill in all fields");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await createCourse(
                courseCode,
                courseName,
                selectedColor
            );

            if (!result.success) {
                setError(result.error || "Failed to create course");
                setLoading(false);
                return;
            }

            // Success - reset form and close
            setCourseCode("");
            setCourseName("");
            setSelectedColor(PRESET_COLORS[0].hex);
            setError(null);
            setLoading(false);
            onClose();
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
            setSelectedColor(PRESET_COLORS[0].hex);
            setError(null);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-md bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                            <Plus className="w-5 h-5 text-cyan-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Add Course</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Error Display */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Course Code */}
                    <div>
                        <label className="block text-sm font-bold text-zinc-400 uppercase mb-2">
                            Course Code
                        </label>
                        <input
                            type="text"
                            value={courseCode}
                            onChange={(e) => setCourseCode(e.target.value)}
                            placeholder="e.g., SYDE 101"
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:border-cyan-500 focus:outline-none transition-colors"
                            disabled={loading}
                            required
                        />
                    </div>

                    {/* Course Name */}
                    <div>
                        <label className="block text-sm font-bold text-zinc-400 uppercase mb-2">
                            Course Name
                        </label>
                        <input
                            type="text"
                            value={courseName}
                            onChange={(e) => setCourseName(e.target.value)}
                            placeholder="e.g., Introduction to Systems Design"
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:border-cyan-500 focus:outline-none transition-colors"
                            disabled={loading}
                            required
                        />
                    </div>

                    {/* Color Picker */}
                    <div>
                        <label className="block text-sm font-bold text-zinc-400 uppercase mb-3">
                            Course Color
                        </label>
                        <div className="grid grid-cols-5 gap-3">
                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color.hex}
                                    type="button"
                                    onClick={() => setSelectedColor(color.hex)}
                                    disabled={loading}
                                    className={`
                    w-12 h-12 rounded-lg transition-all
                    ${selectedColor === color.hex
                                            ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110"
                                            : "hover:scale-105 opacity-70 hover:opacity-100"
                                        }
                  `}
                                    style={{ backgroundColor: color.hex }}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90 text-white font-bold rounded-lg transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    Add Course
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
