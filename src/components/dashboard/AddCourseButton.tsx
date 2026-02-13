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
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90 text-white font-bold rounded-lg transition-opacity cursor-pointer"
            >
                <Plus className="w-4 h-4" />
                {buttonText}
            </button>

            <AddCourseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
