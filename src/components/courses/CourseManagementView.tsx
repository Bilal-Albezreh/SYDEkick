"use client";

import { useState } from "react";
import { updateCourse, deleteCourse } from "@/app/actions/courses";
import { Loader2, Save, Trash2, Palette, Code } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Course {
    id: string;
    course_code: string;
    course_name: string;
    color: string;
}

interface CourseManagementViewProps {
    course: Course;
}

const COLOR_OPTIONS = [
    "#3b82f6", // Blue
    "#10b981", // Green
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#f97316", // Orange
    "#84cc16", // Lime
    "#6366f1", // Indigo
];

export default function CourseManagementView({ course }: CourseManagementViewProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Form state
    const [courseCode, setCourseCode] = useState(course.course_code);
    const [courseName, setCourseName] = useState(course.course_name);
    const [selectedColor, setSelectedColor] = useState(course.color);

    // Track if changes have been made
    const hasChanges =
        courseCode !== course.course_code ||
        courseName !== course.course_name ||
        selectedColor !== course.color;

    const handleSave = async () => {
        if (!courseCode.trim() || !courseName.trim()) {
            toast.error("Course code and name are required");
            return;
        }

        setLoading(true);
        try {
            const result = await updateCourse(
                course.id,
                courseCode.trim(),
                courseName.trim(),
                selectedColor
            );

            if (!result.success) {
                toast.error(result.error || "Failed to update course");
                return;
            }

            toast.success("Course updated successfully");
            router.refresh();
        } catch (err: any) {
            console.error("Update course error:", err);
            toast.error(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(
            `Are you sure you want to delete "${course.course_code}"?\n\nThis will also delete all associated assessments and calendar events. This action cannot be undone.`
        )) {
            return;
        }

        setDeleting(true);
        try {
            const result = await deleteCourse(course.id);

            if (!result.success) {
                toast.error(result.error || "Failed to delete course");
                setDeleting(false);
                return;
            }

            toast.success("Course deleted successfully");
            router.push("/dashboard/courses");
            router.refresh();
        } catch (err: any) {
            console.error("Delete course error:", err);
            toast.error(err.message || "An unexpected error occurred");
            setDeleting(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-black/30 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-800 bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-2">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: selectedColor }}
                    />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Course Editor
                    </span>
                </div>
                <h1 className="text-3xl font-bold text-white">{course.course_code}</h1>
                <p className="text-gray-400">{course.course_name}</p>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl space-y-8">
                    {/* Course Code */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Code className="w-5 h-5 text-cyan-500" />
                            <h2 className="text-lg font-bold text-white">Course Code</h2>
                        </div>
                        <div className="p-4 bg-black/20 border border-white/5 rounded-lg">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                                Course Code
                            </label>
                            <input
                                type="text"
                                value={courseCode}
                                onChange={(e) => setCourseCode(e.target.value)}
                                placeholder="e.g., CS 101"
                                className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:outline-none font-mono"
                                disabled={loading || deleting}
                            />
                            <p className="text-xs text-gray-600 mt-2">
                                The unique identifier for your course (e.g., "SYDE 101", "CS 246")
                            </p>
                        </div>

                        <div className="p-4 bg-black/20 border border-white/5 rounded-lg">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                                Course Name
                            </label>
                            <input
                                type="text"
                                value={courseName}
                                onChange={(e) => setCourseName(e.target.value)}
                                placeholder="e.g., Introduction to Programming"
                                className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:outline-none"
                                disabled={loading || deleting}
                            />
                            <p className="text-xs text-gray-600 mt-2">
                                The full name of your course
                            </p>
                        </div>
                    </div>

                    {/* Course Color */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Palette className="w-5 h-5 text-purple-500" />
                            <h2 className="text-lg font-bold text-white">Course Color</h2>
                        </div>
                        <div className="p-4 bg-black/20 border border-white/5 rounded-lg">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-3">
                                Select Color
                            </label>
                            <div className="grid grid-cols-5 gap-3">
                                {COLOR_OPTIONS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setSelectedColor(color)}
                                        disabled={loading || deleting}
                                        className={`
                                            h-12 rounded-lg transition-all border-2 relative
                                            ${selectedColor === color
                                                ? "border-white scale-110 shadow-lg"
                                                : "border-transparent hover:scale-105"
                                            }
                                        `}
                                        style={{ backgroundColor: color }}
                                    >
                                        {selectedColor === color && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-4 h-4 bg-white rounded-full" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-600 mt-3">
                                This color will appear in your calendar, dashboard, and grade widgets
                            </p>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-red-500" />
                            <h2 className="text-lg font-bold text-white">Danger Zone</h2>
                        </div>
                        <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                            <p className="text-sm text-gray-400 mb-3">
                                Deleting this course will permanently remove all associated assessments, calendar events, and grade data. This action cannot be undone.
                            </p>
                            <button
                                onClick={handleDelete}
                                disabled={loading || deleting}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 font-bold rounded-lg transition-all disabled:opacity-50"
                            >
                                {deleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Delete Course
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer - Save Button */}
            {hasChanges && (
                <div className="p-4 border-t border-gray-800 bg-white/[0.02]">
                    <button
                        onClick={handleSave}
                        disabled={loading || deleting}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90 text-white font-bold rounded-lg transition-all disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
