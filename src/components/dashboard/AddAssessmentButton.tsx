"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import AddAssessmentModal from "./AddAssessmentModal";

interface AddAssessmentButtonProps {
    courseId: string;
    courseColor?: string;
    buttonText?: string;
}

export default function AddAssessmentButton({ courseId, courseColor, buttonText = "Add Assessment" }: AddAssessmentButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90 text-white font-bold rounded-lg transition-opacity cursor-pointer text-sm"
            >
                <Plus className="w-4 h-4" />
                {buttonText}
            </button>

            <AddAssessmentModal
                courseId={courseId}
                courseColor={courseColor}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
