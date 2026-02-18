"use client";

import { useState } from "react";
import { createAssessment, deleteAssessment } from "@/app/actions/assessments";
import { Loader2, Plus, Trash2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface Assessment {
    id: string;
    name: string;
    weight: number;
    score: number | null;
    due_date: string | null;
    total_marks: number;
}

interface Course {
    id: string;
    course_code: string;
    course_name: string;
    color: string;
    assessments: Assessment[];
}

interface CourseDetailViewProps {
    course: Course;
}

export default function CourseDetailView({ course }: CourseDetailViewProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [newName, setNewName] = useState("");
    const [newWeight, setNewWeight] = useState("");
    const [newDate, setNewDate] = useState("");
    const [newTotal, setNewTotal] = useState("100");

    const handleAddAssessment = async () => {
        if (!newName.trim() || !newWeight) {
            setError("Name and weight are required");
            return;
        }

        const weight = parseFloat(newWeight);
        if (isNaN(weight) || weight <= 0 || weight > 100) {
            setError("Weight must be between 0 and 100");
            return;
        }

        const total = parseFloat(newTotal);
        if (isNaN(total) || total <= 0) {
            setError("Total score must be greater than 0");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await createAssessment(
                course.id,
                newName.trim(),
                'Assignment',
                weight,
                total,
                newDate || undefined
            );

            if (!result.success) {
                setError(result.error || "Failed to create assessment");
                setLoading(false);
                return;
            }

            // Reset form
            setNewName("");
            setNewWeight("");
            setNewDate("");
            setNewTotal("100");
            setIsAdding(false);
            setError(null);
            setLoading(false);
        } catch (err: any) {
            console.error("Add assessment error:", err);
            setError(err.message || "An unexpected error occurred");
            setLoading(false);
        }
    };

    const handleDelete = async (assessmentId: string) => {
        if (!confirm("Are you sure you want to delete this assessment?")) return;

        setLoading(true);
        try {
            const result = await deleteAssessment(assessmentId);
            if (!result.success) {
                setError(result.error || "Failed to delete assessment");
            }
        } catch (err: any) {
            setError(err.message || "Failed to delete assessment");
        } finally {
            setLoading(false);
        }
    };

    const totalWeight = course.assessments.reduce((sum, a) => sum + a.weight, 0);

    return (
        <div className="h-full flex flex-col bg-black/30 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-800 bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-2">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: course.color }}
                    />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Syllabus Editor
                    </span>
                </div>
                <h1 className="text-3xl font-bold text-white">{course.course_code}</h1>
                <p className="text-gray-400">{course.course_name}</p>
                <div className="mt-3 flex items-center gap-4">
                    <div className="text-sm">
                        <span className="text-gray-500">Total Weight: </span>
                        <span className={cn(
                            "font-bold font-mono",
                            totalWeight > 100 ? "text-red-400" : totalWeight === 100 ? "text-green-400" : "text-yellow-400"
                        )}>
                            {totalWeight.toFixed(1)}%
                        </span>
                    </div>
                    <div className="text-sm text-gray-500">
                        {course.assessments.length} assessment{course.assessments.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            )}

            {/* Assessment List */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-2">
                    {course.assessments.length === 0 && !isAdding && (
                        <div className="text-center py-12 text-gray-500">
                            <p className="mb-4">No assessments yet</p>
                            <button
                                onClick={() => setIsAdding(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add First Assessment
                            </button>
                        </div>
                    )}

                    {course.assessments.map((assessment) => (
                        <div
                            key={assessment.id}
                            className="flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-lg hover:border-gray-600 transition-all group"
                        >
                            <div className="flex-1">
                                <div className="font-bold text-white">{assessment.name}</div>
                                {assessment.due_date && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(assessment.due_date).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className="text-lg font-bold text-cyan-400">
                                        {assessment.weight}%
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        / {assessment.total_marks}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(assessment.id)}
                                    disabled={loading}
                                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Add Assessment Form */}
                    {isAdding && (
                        <div className="p-4 bg-cyan-500/5 border-2 border-cyan-500/20 rounded-lg space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                                        Assessment Name
                                    </label>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="e.g., Midterm Exam"
                                        className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:outline-none"
                                        disabled={loading}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                                        Weight (%)
                                    </label>
                                    <input
                                        type="number"
                                        value={newWeight}
                                        onChange={(e) => setNewWeight(e.target.value)}
                                        placeholder="20"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:outline-none"
                                        disabled={loading}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                                        Total Score
                                    </label>
                                    <input
                                        type="number"
                                        value={newTotal}
                                        onChange={(e) => setNewTotal(e.target.value)}
                                        placeholder="100"
                                        min="1"
                                        className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:outline-none"
                                        disabled={loading}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                                        Due Date (Optional)
                                    </label>
                                    <input
                                        type="date"
                                        value={newDate}
                                        onChange={(e) => setNewDate(e.target.value)}
                                        className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setIsAdding(false);
                                        setNewName("");
                                        setNewWeight("");
                                        setNewDate("");
                                        setNewTotal("100");
                                        setError(null);
                                    }}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddAssessment}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            Add Assessment
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer - Add Button */}
            {!isAdding && course.assessments.length > 0 && (
                <div className="p-4 border-t border-gray-800 bg-white/[0.02]">
                    <button
                        onClick={() => setIsAdding(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 text-gray-400 hover:text-cyan-400 font-bold rounded-lg transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Add Assessment
                    </button>
                </div>
            )}
        </div>
    );
}
