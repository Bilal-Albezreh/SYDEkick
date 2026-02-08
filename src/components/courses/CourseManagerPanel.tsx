"use client";

import { useEffect, useState } from "react";
import { getCourseWithAssessments, updateCourseDetails, updateCourseAssessments, deleteCourse } from "@/app/actions/courses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, Plus, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Assessment {
    id?: string;
    name: string;
    weight: number;
    total_marks: number;
    due_date: string | null;
    score?: number | null;
}

interface CourseManagerPanelProps {
    courseId: string;
}

const COLOR_OPTIONS = [
    "#4361ee", // Electric Azure (Rich, deep blue - not standard primary blue)
    "#7209b7", // Royal Amethyst (Deep purple, very premium)
    "#f72585", // Neon Rose (High-fashion pink, pops on glass)
    "#4cc9f0", // Diamond Cyan (Ice blue, looks great with transparency)
    "#06d6a0", // Caribbean Emerald (Vibrant but sophisticated green)
    "#fb5607", // Hermes Orange (High-energy, expensive orange)
    "#ffbe0b", // Solid Gold (Not yellow, but a deep amber-gold)
    "#3a0ca3", // Midnight Indigo (Very dark, mysterious)
    "#e63946", // Matte Crimson (A serious, architectural red)
    "#0096c7", // Pacific Teal (Deep ocean blue)
];

export default function CourseManagerPanel({ courseId }: CourseManagerPanelProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"content" | "settings">("content");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    // Course data
    const [courseCode, setCourseCode] = useState("");
    const [courseName, setCourseName] = useState("");
    const [courseColor, setCourseColor] = useState(COLOR_OPTIONS[0]);
    const [assessments, setAssessments] = useState<Assessment[]>([]);

    // Load course data
    useEffect(() => {
        if (courseId) {
            loadCourseData();
        }
    }, [courseId]);

    const loadCourseData = async () => {
        setLoading(true);
        const result = await getCourseWithAssessments(courseId);

        if (!result.success || !result.data) {
            toast.error(result.error || "Failed to load course");
            return;
        }

        const course = result.data as any;
        setCourseCode(course.course_code);
        setCourseName(course.course_name);
        setCourseColor(course.color);
        setAssessments(course.assessments || []);
        setIsDirty(false);
        setLoading(false);
    };

    const handleFieldChange = (setter: Function, value: any) => {
        setter(value);
        setIsDirty(true);
    };

    const handleAddAssessment = () => {
        const newAssessment: Assessment = {
            name: "",
            weight: 0,
            total_marks: 100,
            due_date: null,
        };
        setAssessments([...assessments, newAssessment]);
        setIsDirty(true);
    };

    const handleDeleteAssessment = (index: number) => {
        setAssessments(assessments.filter((_, i) => i !== index));
        setIsDirty(true);
    };

    const handleUpdateAssessment = (index: number, field: keyof Assessment, value: any) => {
        const updated = [...assessments];
        updated[index] = { ...updated[index], [field]: value };
        setAssessments(updated);
        setIsDirty(true);
    };

    const handleSaveContent = async () => {
        setSaving(true);
        try {
            const result = await updateCourseAssessments(
                courseId,
                assessments.map(a => ({
                    id: a.id,
                    name: a.name.trim(),
                    weight: Number(a.weight),
                    total_marks: Number(a.total_marks),
                    due_date: a.due_date || null,
                }))
            );

            if (!result.success) {
                toast.error(result.error || "Failed to save assessments");
                return;
            }

            toast.success("Assessments saved");
            setIsDirty(false);
            router.refresh();
        } catch (err: any) {
            toast.error(err.message || "An error occurred");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveSettings = async () => {
        if (!courseCode.trim() || !courseName.trim()) {
            toast.error("Course code and name are required");
            return;
        }

        setSaving(true);
        try {
            const result = await updateCourseDetails(courseId, {
                course_code: courseCode.trim(),
                course_name: courseName.trim(),
                color: courseColor,
            });

            if (!result.success) {
                toast.error(result.error || "Failed to save settings");
                return;
            }

            toast.success("Settings saved");
            setIsDirty(false);
            router.refresh();
        } catch (err: any) {
            toast.error(err.message || "An error occurred");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCourse = async () => {
        if (!confirm(`Are you sure you want to delete "${courseCode}"? This action cannot be undone.`)) {
            return;
        }

        setSaving(true);
        try {
            const result = await deleteCourse(courseId);

            if (!result.success) {
                toast.error(result.error || "Failed to delete course");
                return;
            }

            toast.success("Course deleted");
            router.push("/dashboard/courses");
            router.refresh();
        } catch (err: any) {
            toast.error(err.message || "An error occurred");
        } finally {
            setSaving(false);
        }
    };

    const totalWeight = assessments.reduce((sum, a) => sum + Number(a.weight || 0), 0);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-black/30 backdrop-blur-md border border-white/10 rounded-xl">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-black/30 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-800 bg-white/[0.02]">
                <div
                    className="w-2 h-16 rounded-full mb-3 shadow-lg shadow-current/50"
                    style={{ backgroundColor: courseColor }}
                />
                <h2 className="text-2xl font-bold text-white">{courseCode}</h2>
                <p className="text-gray-400 text-sm">{courseName}</p>
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-gray-800 bg-white/[0.01]">
                <button
                    onClick={() => setActiveTab("content")}
                    className={cn(
                        "flex-1 px-6 py-3 text-sm font-bold transition-all relative",
                        activeTab === "content"
                            ? "text-white"
                            : "text-gray-500 hover:text-gray-300"
                    )}
                >
                    Content
                    {activeTab === "content" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("settings")}
                    className={cn(
                        "flex-1 px-6 py-3 text-sm font-bold transition-all relative",
                        activeTab === "settings"
                            ? "text-white"
                            : "text-gray-500 hover:text-gray-300"
                    )}
                >
                    Settings
                    {activeTab === "settings" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500" />
                    )}
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {activeTab === "content" ? (
                    /* Content Tab - Assessments */
                    <div className="space-y-4">
                        {/* Weight Progress Bar */}
                        <div className="space-y-2 mb-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                                    Total Weight
                                </h3>
                                <span className={cn(
                                    "text-sm font-bold font-mono",
                                    totalWeight > 100 ? "text-red-400" :
                                        totalWeight === 100 ? "text-green-400" :
                                            "text-yellow-400"
                                )}>
                                    {totalWeight.toFixed(1)}%
                                </span>
                            </div>
                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full transition-all",
                                        totalWeight > 100 ? "bg-red-500" :
                                            totalWeight === 100 ? "bg-green-500" :
                                                "bg-yellow-500"
                                    )}
                                    style={{ width: `${Math.min(totalWeight, 100)}%` }}
                                />
                            </div>
                            {totalWeight > 100 && (
                                <div className="flex items-center gap-2 text-xs text-red-400">
                                    <AlertCircle className="w-3 h-3" />
                                    Total weight exceeds 100%
                                </div>
                            )}
                        </div>

                        {/* Assessments List */}
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                                Assessments
                            </h3>
                            <Button
                                onClick={handleAddAssessment}
                                size="sm"
                                className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300"
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Add
                            </Button>
                        </div>

                        {assessments.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 text-sm">
                                No assessments yet. Click "Add" to create one.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {assessments.map((assessment, index) => (
                                    <div
                                        key={index}
                                        className="p-4 bg-black/30 border border-white/5 rounded-lg space-y-3"
                                    >
                                        <div className="flex items-start gap-2">
                                            <Input
                                                value={assessment.name}
                                                onChange={(e) => handleUpdateAssessment(index, "name", e.target.value)}
                                                placeholder="Assessment name"
                                                className="flex-1 bg-black/40 border-white/10 text-white h-9"
                                            />
                                            <Button
                                                onClick={() => handleDeleteAssessment(index)}
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Weight %</label>
                                                <Input
                                                    type="number"
                                                    value={assessment.weight}
                                                    onChange={(e) => handleUpdateAssessment(index, "weight", e.target.value)}
                                                    placeholder="20"
                                                    className="bg-black/40 border-white/10 text-white h-9"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Total Marks</label>
                                                <Input
                                                    type="number"
                                                    value={assessment.total_marks}
                                                    onChange={(e) => handleUpdateAssessment(index, "total_marks", e.target.value)}
                                                    placeholder="100"
                                                    className="bg-black/40 border-white/10 text-white h-9"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Due Date</label>
                                                <Input
                                                    type="date"
                                                    value={assessment.due_date || ""}
                                                    onChange={(e) => handleUpdateAssessment(index, "due_date", e.target.value)}
                                                    className="bg-black/40 border-white/10 text-white h-9"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Settings Tab - Edit Course */
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Course Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                                        Course Code
                                    </label>
                                    <Input
                                        value={courseCode}
                                        onChange={(e) => handleFieldChange(setCourseCode, e.target.value)}
                                        placeholder="e.g., CS 101"
                                        className="bg-black/50 border-white/10 text-gray-200 h-11 focus:border-cyan-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                                        Course Name
                                    </label>
                                    <Input
                                        value={courseName}
                                        onChange={(e) => handleFieldChange(setCourseName, e.target.value)}
                                        placeholder="e.g., Intro to CS"
                                        className="bg-black/50 border-white/10 text-gray-200 h-11 focus:border-cyan-500/50"
                                    />
                                </div>
                            </div>

                            {/* Color Picker */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-3">
                                    Course Color
                                </label>
                                <div className="grid grid-cols-5 gap-3">
                                    {COLOR_OPTIONS.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => handleFieldChange(setCourseColor, color)}
                                            className={cn(
                                                "h-12 rounded-lg transition-all border-2 relative",
                                                courseColor === color
                                                    ? "border-white scale-110 shadow-lg"
                                                    : "border-transparent hover:scale-105"
                                            )}
                                            style={{ backgroundColor: color }}
                                        >
                                            {courseColor === color && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-4 h-4 bg-white rounded-full" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="border border-red-500/20 bg-red-500/5 rounded-lg p-4">
                            <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-2">Danger Zone</h3>
                            <p className="text-xs text-gray-400 mb-3">
                                Deleting this course will remove all associated assessments and grades. This action cannot be undone.
                            </p>
                            <Button
                                onClick={handleDeleteCourse}
                                disabled={saving}
                                variant="destructive"
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Course
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer - Save Button */}
            <div className="p-4 border-t border-gray-800 bg-white/[0.01]">
                <Button
                    onClick={activeTab === "content" ? handleSaveContent : handleSaveSettings}
                    disabled={!isDirty || saving}
                    className={cn(
                        "w-full h-12 font-bold text-base",
                        isDirty
                            ? "bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90 text-white"
                            : "bg-gray-800 text-gray-500 cursor-not-allowed"
                    )}
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5 mr-2" />
                            Save Changes {!isDirty && "(No changes)"}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
