"use client";

import { useState, useEffect } from "react";
import { createSquadWithCurriculum } from "@/app/actions/squads";
import { createClient } from "@/utils/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, BookOpen, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Course {
    id: string;
    course_code: string;
    course_name: string;
    color: string;
}

export default function CreateSquadModal({
    isOpen,
    onClose
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const [step, setStep] = useState<1 | 2>(1);
    const [loading, setLoading] = useState(false);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(false);

    // Form data
    const [squadName, setSquadName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

    // Fetch user's courses
    useEffect(() => {
        if (isOpen && step === 2) {
            fetchCourses();
        }
    }, [isOpen, step]);

    async function fetchCourses() {
        setLoadingCourses(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        const { data, error } = await supabase
            .from("courses")
            .select("id, course_code, course_name, color")
            .eq("user_id", user.id)
            .is("master_course_id", null) // Only show courses that aren't already linked to masters
            .order("course_code");

        if (!error && data) {
            setCourses(data);
        }
        setLoadingCourses(false);
    }

    function toggleCourse(courseId: string) {
        setSelectedCourseIds(prev =>
            prev.includes(courseId)
                ? prev.filter(id => id !== courseId)
                : [...prev, courseId]
        );
    }

    async function handleSubmit() {
        if (step === 1) {
            setStep(2);
            return;
        }

        // Step 2: Create squad with curriculum
        setLoading(true);
        const result = await createSquadWithCurriculum({
            squadName,
            description,
            courseIds: selectedCourseIds
        });

        setLoading(false);

        if (result.success) {
            // Reset form
            setSquadName("");
            setDescription("");
            setSelectedCourseIds([]);
            setStep(1);
            onClose();
            window.location.href = "/dashboard/groups"; // Redirect to groups page
        } else {
            alert(result.error || "Failed to create squad");
        }
    }

    function handleBack() {
        setStep(1);
    }

    function handleClose() {
        setSquadName("");
        setDescription("");
        setSelectedCourseIds([]);
        setStep(1);
        onClose();
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl bg-black/95 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Users className="w-6 h-6 text-indigo-400" />
                        Create Your Squad
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        {step === 1
                            ? "Set up your study group with a name and description"
                            : "Select which courses to include in your squad's curriculum"
                        }
                    </DialogDescription>
                </DialogHeader>

                {/* Step Indicator */}
                <div className="flex items-center gap-2 mb-6">
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium",
                        step === 1 ? "bg-indigo-500/20 text-indigo-300" : "bg-white/5 text-gray-500"
                    )}>
                        <div className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center",
                            step === 1 ? "bg-indigo-500" : "bg-white/10"
                        )}>
                            {step > 1 ? <Check className="w-3 h-3" /> : "1"}
                        </div>
                        Squad Details
                    </div>
                    <div className="h-px flex-1 bg-white/10" />
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium",
                        step === 2 ? "bg-indigo-500/20 text-indigo-300" : "bg-white/5 text-gray-500"
                    )}>
                        <div className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center",
                            step === 2 ? "bg-indigo-500" : "bg-white/10"
                        )}>
                            2
                        </div>
                        Select Curriculum
                    </div>
                </div>

                {/* STEP 1: Squad Details */}
                {step === 1 && (
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-300 mb-2 block">
                                Squad Name *
                            </label>
                            <Input
                                value={squadName}
                                onChange={(e) => setSquadName(e.target.value)}
                                placeholder="e.g., SYDE 2B Winter 2025"
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-300 mb-2 block">
                                Description (Optional)
                            </label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief description of your study group..."
                                rows={3}
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={handleClose}
                                className="border-white/10 text-gray-300 hover:bg-white/5"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={!squadName.trim()}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white"
                            >
                                Next: Select Courses
                            </Button>
                        </div>
                    </div>
                )}

                {/* STEP 2: Course Selection */}
                {step === 2 && (
                    <div className="space-y-4">
                        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 mb-4">
                            <p className="text-sm text-indigo-300">
                                <strong>Creating: {squadName}</strong>
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Select courses to include as templates. These will be cloned for new members.
                            </p>
                        </div>

                        {loadingCourses ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                            </div>
                        ) : courses.length === 0 ? (
                            <div className="text-center py-12">
                                <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-400 text-sm">No courses available to add</p>
                                <p className="text-gray-500 text-xs mt-1">
                                    You can create a squad without courses and add them later
                                </p>
                            </div>
                        ) : (
                            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                                {courses.map((course) => (
                                    <label
                                        key={course.id}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                                            selectedCourseIds.includes(course.id)
                                                ? "bg-indigo-500/10 border-indigo-500/30"
                                                : "bg-white/5 border-white/10 hover:bg-white/10"
                                        )}
                                    >
                                        <Checkbox
                                            checked={selectedCourseIds.includes(course.id)}
                                            onCheckedChange={() => toggleCourse(course.id)}
                                            className="border-white/20"
                                        />
                                        <div
                                            className="w-3 h-3 rounded-full shrink-0"
                                            style={{ backgroundColor: course.color }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">
                                                {course.course_code}
                                            </p>
                                            <p className="text-xs text-gray-400 truncate">
                                                {course.course_name}
                                            </p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between items-center gap-3 pt-4 border-t border-white/10">
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                className="border-white/10 text-gray-300 hover:bg-white/5"
                            >
                                Back
                            </Button>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500">
                                    {selectedCourseIds.length} course{selectedCourseIds.length !== 1 ? 's' : ''} selected
                                </span>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        "Create Squad"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
