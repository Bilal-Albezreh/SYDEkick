"use client";

import { useEffect, useState } from "react";
import { getCourseWithAssessments, updateCourseDetails, deleteCourse } from "@/app/actions/courses";
import AddAssessmentButton from "@/components/dashboard/AddAssessmentButton";
import AddAssessmentModal from "@/components/dashboard/AddAssessmentModal";
import AssessmentItem from "@/components/courses/AssessmentItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Plus, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

interface Term {
    id: string;
    label: string;
    is_current: boolean | null;
}

interface Assessment {
    id?: string;
    name: string;
    weight: number;
    total_marks: number;
    due_date: string | null;
    score?: number | null;
    type?: string | null;
    is_completed?: boolean;
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
    const supabase = createClient();
    const [activeTab, setActiveTab] = useState<"content" | "settings">("content");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    // Course data
    const [courseCode, setCourseCode] = useState("");
    const [courseName, setCourseName] = useState("");
    const [courseColor, setCourseColor] = useState(COLOR_OPTIONS[0]);
    const [courseCredits, setCourseCredits] = useState(0.5);
    const [courseTerm, setCourseTerm] = useState("");
    const [courseTermId, setCourseTermId] = useState("");
    const [assessments, setAssessments] = useState<Assessment[]>([]);

    // Terms data
    const [terms, setTerms] = useState<Term[]>([]);

    // Edit modal state
    const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
    const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);

    // Load course data and terms
    useEffect(() => {
        if (courseId) {
            loadCourseData();
            fetchTerms();
        }
    }, [courseId]);

    const fetchTerms = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: termsData, error } = await supabase
                .from("terms")
                .select("id, label, is_current")
                .eq("user_id", user.id)
                .order("start_date", { ascending: false });

            if (error) {
                console.error("Failed to fetch terms:", error);
                return;
            }

            setTerms(termsData || []);
        } catch (err) {
            console.error("Failed to fetch terms:", err);
        }
    };

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
        setCourseCredits(course.credits || 0.5);
        setCourseTerm(course.term || "");
        setCourseTermId(course.term_id || "");
        setAssessments(course.assessments || []);
        setIsDirty(false);
        setLoading(false);
    };

    const handleFieldChange = (setter: Function, value: any) => {
        setter(value);
        setIsDirty(true);
    };

    const handleEditAssessment = (assessment: Assessment) => {
        setEditingAssessment(assessment);
        setIsAssessmentModalOpen(true);
    };

    const handleAddAssessment = () => {
        setEditingAssessment(null);
        setIsAssessmentModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingAssessment(null);
        setIsAssessmentModalOpen(false);
    };

    const handleAssessmentSuccess = () => {
        setIsAssessmentModalOpen(false);
        setEditingAssessment(null);
        loadCourseData();
        router.refresh();
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
                credits: courseCredits,
                term_id: courseTermId,
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
        <>
            <div className="h-full flex flex-col bg-black/30 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
                {/* Header with Dynamic Gradient */}
                <div
                    className="p-6 border-b border-gray-800 relative overflow-hidden"
                    style={{
                        background: `linear-gradient(to bottom, ${courseColor}20 0%, transparent 100%)`
                    }}
                >
                    {/* Subtle glow effect */}
                    <div
                        className="absolute inset-0 opacity-10 blur-2xl"
                        style={{ backgroundColor: courseColor }}
                    />

                    <div className="relative z-10 flex items-baseline justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-3xl font-bold text-white">{courseCode}</h2>
                                {courseTerm && (
                                    <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs font-bold rounded-md border border-cyan-500/30">
                                        {courseTerm}
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-300 text-sm font-medium">{courseName}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Credits</p>
                            <p className="text-2xl font-bold text-white">{courseCredits.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                {/* Sticky Tab Bar */}
                <div className="sticky top-0 z-10 flex border-b border-gray-800 backdrop-blur-md bg-black/20">
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
                            {/* Liquid Progress Bar */}
                            <div className="space-y-2 mb-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                                        Total Weight
                                    </h3>
                                    <span className={cn(
                                        "text-sm font-bold font-mono",
                                        totalWeight < 50 ? "text-red-400" :
                                            totalWeight < 80 ? "text-amber-400" :
                                                "text-emerald-400"
                                    )}>
                                        {totalWeight.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="h-5 bg-black/50 rounded-full overflow-hidden relative shadow-inner">
                                    <div
                                        className={cn(
                                            "h-full transition-all duration-1000 ease-out rounded-full relative",
                                            totalWeight < 50 ? "bg-gradient-to-r from-red-600 to-red-500" :
                                                totalWeight < 80 ? "bg-gradient-to-r from-amber-600 to-amber-400" :
                                                    "bg-gradient-to-r from-emerald-600 to-emerald-400"
                                        )}
                                        style={{ width: `${Math.min(totalWeight, 100)}%` }}
                                    >
                                        {/* Glowing leading edge */}
                                        <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-r from-transparent to-white/40" />
                                    </div>
                                </div>
                                {totalWeight > 100 && (
                                    <div className="flex items-center gap-2 text-xs text-red-400">
                                        <AlertCircle className="w-3 h-3" />
                                        Total weight exceeds 100%
                                    </div>
                                )}
                            </div>

                            {/* Assessments Header */}
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                                    Assessments
                                </h3>
                                <button
                                    onClick={handleAddAssessment}
                                    className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-lg hover:shadow-indigo-500/25 overflow-hidden text-sm"
                                    style={{
                                        backgroundColor: courseColor,
                                        boxShadow: courseColor ? `0 0 15px ${courseColor}40` : undefined
                                    }}
                                >
                                    {/* APPLE INTELLIGENCE GLOW BACKGROUND */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                                        <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#bd60f3_0%,#f5b9ea_50%,#67e7f5_100%)] blur-xl" />
                                    </div>

                                    {/* Default Background (Visible when not hovering) - Fallback if no courseColor */}
                                    {!courseColor && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 group-hover:opacity-0 transition-opacity duration-500" />
                                    )}

                                    {/* If courseColor exists, we use the style prop for bg, but we need to fade it out on hover to show the glow */}
                                    {courseColor && (
                                        <div
                                            className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-0"
                                            style={{ backgroundColor: courseColor }}
                                        />
                                    )}

                                    {/* Glassy Overlay for Text Readability (Visible on hover) */}
                                    <div className="absolute inset-[1px] rounded-lg bg-zinc-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    {/* Content */}
                                    <div className="relative z-10 flex items-center gap-2">
                                        <Plus className="w-4 h-4 group-hover:text-white transition-colors" />
                                        <span>Add Assessment</span>
                                    </div>
                                </button>
                            </div>

                            {/* Assessment Cards */}
                            {assessments.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 text-sm">
                                    No assessments yet. Click "Add Assessment" to create one.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {assessments.map((assessment) => (
                                        <AssessmentItem
                                            key={assessment.id || assessment.name}
                                            assessment={assessment as any}
                                            courseColor={courseColor}
                                            onEdit={handleEditAssessment}
                                            onDelete={() => {
                                                loadCourseData();
                                                router.refresh();
                                            }}
                                        />
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

                                {/* Credits and Term - Side by Side */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Credits */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                                            Credits (for GPA)
                                        </label>
                                        <Input
                                            type="number"
                                            value={courseCredits}
                                            onChange={(e) => handleFieldChange(setCourseCredits, parseFloat(e.target.value))}
                                            min="0"
                                            max="10"
                                            step="0.25"
                                            className="bg-black/50 border-white/10 text-gray-200 h-11 focus:border-cyan-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">
                                            {courseCredits === 0.25 ? "Lab Course" : courseCredits === 0.5 ? "Standard" : courseCredits === 1.0 ? "Full Credit" : "Custom"}
                                        </p>
                                    </div>

                                    {/* Term */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                                            Academic Term
                                        </label>
                                        <Select
                                            value={courseTermId}
                                            onValueChange={(value) => handleFieldChange(setCourseTermId, value)}
                                        >
                                            <SelectTrigger className="bg-black/50 border-white/10 text-gray-200 h-11 focus:border-cyan-500/50">
                                                <SelectValue placeholder="Select term">
                                                    {terms.find(t => t.id === courseTermId)?.label || "Select term"}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent className="bg-black/50 border-white/10 backdrop-blur-xl">
                                                {terms.map((term) => (
                                                    <SelectItem
                                                        key={term.id}
                                                        value={term.id}
                                                        className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                                                    >
                                                        <div className="flex items-center justify-between w-full">
                                                            <span>{term.label}</span>
                                                            {term.is_current && (
                                                                <span className="ml-2 text-[10px] text-cyan-400 font-bold">CURRENT</span>
                                                            )}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Move course to different term
                                        </p>
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


                {/* Footer - Save Button (Settings Tab Only) */}
                {activeTab === "settings" && (
                    <div className="p-4 border-t border-gray-800 bg-white/[0.01]">
                        <Button
                            onClick={handleSaveSettings}
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
                )}
            </div>

            {/* Assessment Modal (Add/Edit) */}
            <AddAssessmentModal
                courseId={courseId}
                courseColor={courseColor}
                isOpen={isAssessmentModalOpen}
                onClose={handleCloseModal}
                onSuccess={handleAssessmentSuccess}
                editData={editingAssessment as any}
            />
        </>
    );
}
