"use client";

import { useState } from "react";
import { Calendar, Trash2, Percent } from "lucide-react";
import { deleteAssessment } from "@/app/actions/assessments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface AssessmentItemProps {
    assessment: {
        id: string;
        name: string;
        type: string;
        weight: number;
        total_marks: number;
        due_date: string | null;
        score?: number | null;
    };
    courseColor: string;
    onEdit: (assessment: any) => void;
    onDelete?: () => void;
}

export default function AssessmentItem({ assessment, courseColor, onEdit, onDelete }: AssessmentItemProps) {
    const router = useRouter();
    const [isHovered, setIsHovered] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering edit modal

        if (!confirm(`Delete "${assessment.name}"? This action cannot be undone.`)) {
            return;
        }

        setIsDeleting(true);
        try {
            const result = await deleteAssessment(assessment.id);

            if (!result.success) {
                toast.error(result.error || "Failed to delete assessment");
                setIsDeleting(false);
                return;
            }

            toast.success("Assessment deleted");
            router.refresh();
            if (onDelete) onDelete();
        } catch (err: any) {
            console.error("Delete assessment error:", err);
            toast.error(err.message || "An unexpected error occurred");
            setIsDeleting(false);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return null;

        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    // Convert hex to RGB for CSS variable
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return '76, 201, 240'; // Default cyan RGB
        return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
    };

    // Get weight-based styling
    const getWeightStyling = () => {
        const weight = assessment.weight;
        if (weight >= 30) {
            // Heavy: Strong presence
            return {
                className: 'shadow-lg',
                style: {
                    backgroundColor: `${courseColor}26`, // ~15% opacity
                    borderColor: `${courseColor}4D`, // ~30% opacity
                    boxShadow: `0 0 15px -3px rgba(${hexToRgb(courseColor)}, 0.3)`
                }
            };
        } else if (weight >= 10) {
            // Medium: Standard glass
            return {
                className: 'shadow-sm',
                style: {
                    backgroundColor: `${courseColor}1A`, // ~10% opacity
                    borderColor: `${courseColor}33`, // ~20% opacity
                }
            };
        } else {
            // Light: Elevated Visibility
            return {
                className: '',
                style: {
                    backgroundColor: `${courseColor}1A`, // ~10% opacity
                    borderColor: `${courseColor}1A`, // ~10% opacity
                    boxShadow: `0 0 10px -5px rgba(${hexToRgb(courseColor)}, 0.15)`
                }
            };
        }
    };

    const getTypeBadgeColor = (type: string) => {
        if (!type) return 'bg-zinc-600 text-white'; // Default if no type

        const lowerType = type.toLowerCase();
        if (lowerType.includes('midterm') || lowerType.includes('exam') || lowerType.includes('final')) {
            return 'bg-purple-600 text-white';
        }
        if (lowerType.includes('quiz')) {
            return 'bg-blue-600 text-white';
        }
        if (lowerType.includes('project')) {
            return 'bg-orange-600 text-white';
        }
        return 'bg-zinc-600 text-white'; // Default for Assignment, etc.
    };

    const weightStyling = getWeightStyling();

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onEdit(assessment)}
            className={cn(
                "group relative p-5 rounded-xl border transition-all cursor-pointer",
                weightStyling.className,
                "hover:scale-[1.01]",
                isDeleting && "opacity-50 pointer-events-none"
            )}
            style={weightStyling.style}
        >
            <div className="flex items-center justify-between gap-4">
                {/* Left Side: Name + Type Badge */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-white font-semibold text-lg truncate">
                            {assessment.name}
                        </h4>
                        <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap min-w-fit"
                            style={{
                                backgroundColor: `${courseColor}33`, // ~20% opacity
                                color: courseColor
                            }}
                        >
                            {assessment.type || 'Assignment'}
                        </span>
                    </div>

                    {/* Date + Weight */}
                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                        {assessment.due_date && (
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(assessment.due_date)}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5">
                            <Percent className="w-4 h-4" />
                            <span className="font-mono font-bold">
                                {assessment.weight}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Delete Button (on hover) */}
                {isHovered && (
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className={cn(
                            "p-2 rounded-lg transition-all",
                            "bg-red-500/10 hover:bg-red-500/20",
                            "text-red-400 hover:text-red-300",
                            "border border-red-500/20"
                        )}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
