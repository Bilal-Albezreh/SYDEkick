"use client";

import React, { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
    UploadCloud,
    AlertTriangle,
    CheckCircle2,
    X,
    FileText,
    BookOpen,
    Percent,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- 1. Setup & Types ---

// USE THE CDN WORKER (Safest option for Next.js to avoid "worker not found" errors)
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type FlowState = "IDLE" | "ANALYZING" | "REVIEW";

export interface Location {
    page: number;
    y: number;
}

export interface CourseInfo {
    code: string;
    name: string;
    color: string;
    confidence: number;
    location: Location;
}

export interface Assessment {
    id: string;
    name: string;
    weight: number;
    date: string;
    location: Location;
    confidence?: number;
}

export interface ExtractedData {
    courseInfo: CourseInfo;
    assessments: Assessment[];
}

// --- 2. Mock Backend Service ---

const wittyTips = [
    "Scanning for 8am classes to avoid...",
    "Calculating required caffeine intake...",
    "Detecting 'mandatory attendance' policies...",
    "Cross-referencing with RateMyProfessor...",
    "Identifying the 'drop date' safety net...",
];

const mockAnalyzeSyllabus = (file: File): Promise<ExtractedData> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                courseInfo: {
                    code: "SYDE 121",
                    name: "Digital Computation",
                    confidence: 0.98,
                    color: "#10B981",
                    location: { page: 1, y: 150 },
                },
                assessments: [
                    { id: "a1", name: "Midterm Exam", weight: 25, date: "2026-02-14", confidence: 0.95, location: { page: 2, y: 400 } },
                    { id: "a2", name: "Final Project", weight: 40, date: "2026-04-10", confidence: 0.65, location: { page: 3, y: 100 } },
                    { id: "a3", name: "Quizzes", weight: 10, date: "2026-01-20", confidence: 0.99, location: { page: 2, y: 600 } },
                ],
            });
        }, 3000);
    });
};

// --- 3. Sub-Components ---

// VIEW 1: IDLE (Upload)
const DropzoneView = ({ onFileDrop }: { onFileDrop: (file: File) => void }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { "application/pdf": [".pdf"] },
        multiple: false,
        onDrop: (acceptedFiles) => {
            if (acceptedFiles[0]) onFileDrop(acceptedFiles[0]);
        },
    });

    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col flex-1 overflow-hidden items-center justify-center space-y-6"
        >
            <div
                {...getRootProps()}
                className={cn(
                    "relative w-full aspect-square max-w-[240px] rounded-[24px] flex flex-col items-center justify-center cursor-pointer transition-all duration-500 group",
                    "bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-400/50",
                    isDragActive && "scale-105 bg-indigo-500/10 border-indigo-500"
                )}
            >
                <input {...getInputProps()} />

                {/* ICON with Siri-like inner glow */}
                <div className="relative mb-6">
                    <div className="absolute inset-0 blur-2xl bg-indigo-500/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative p-6 rounded-3xl bg-zinc-900/50 border border-white/10">
                        <UploadCloud className="w-10 h-10 text-indigo-400" />
                    </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 text-center px-4">
                    Import Syllabus
                </h3>
                <p className="text-zinc-500 text-sm text-center px-8">
                    Drag and drop or <span className="text-indigo-400">browse</span>
                </p>
            </div>

            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-bold">
                <Sparkles className="w-3 h-3" />
                <span>AI Core Processing</span>
            </div>
        </motion.div>
    );
};

// VIEW 2: ANALYZING
const AnalyzingView = () => {
    const [tip, setTip] = useState(wittyTips[0]);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const tipInterval = setInterval(() => setTip(wittyTips[Math.floor(Math.random() * wittyTips.length)]), 800);
        const progressInterval = setInterval(() => setProgress((prev) => (prev >= 100 ? 100 : prev + 2)), 60);
        return () => { clearInterval(tipInterval); clearInterval(progressInterval); };
    }, []);

    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col flex-1 overflow-hidden items-center justify-center"
        >
            {/* Spinning Gradient Ring */}
            <div className="relative w-20 h-20 mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-purple-500 border-b-transparent border-l-transparent animate-spin" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-4">Analyzing...</h2>

            <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
                <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                />
            </div>
            <motion.p key={tip} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-zinc-400 italic text-sm">
                {tip}
            </motion.p>
        </motion.div>
    );
};

// VIEW 3: REVIEW (Flattened - No more fixed overlay)
const ReviewView = ({
    fileUrl,
    data,
    onConfirm,
}: {
    fileUrl: string;
    data: ExtractedData;
    onConfirm: (data: ExtractedData) => void;
}) => {
    const [formData, setFormData] = useState(data);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pdfContainerRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => setNumPages(numPages);

    const handleInputFocus = (location: Location) => {
        const pageElement = pageRefs.current.get(location.page);
        const container = pdfContainerRef.current;
        if (pageElement && container) {
            container.scrollTo({ top: pageElement.offsetTop + location.y - 50, behavior: "smooth" });
            setCurrentPage(location.page);
        }
    };

    // Update Helpers
    const updateCourseInfo = (key: keyof CourseInfo, value: string | number) => {
        setFormData((prev) => ({ ...prev, courseInfo: { ...prev.courseInfo, [key]: value } }));
    };
    const updateAssessment = (id: string, key: keyof Assessment, value: string | number) => {
        setFormData((prev) => ({ ...prev, assessments: prev.assessments.map((a) => a.id === id ? { ...a, [key]: value } : a) }));
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col flex-1 overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                        <FileText className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Review Extraction</h2>
                        <p className="text-xs text-zinc-400">Verify extracted data.</p>
                    </div>
                </div>
                <Button onClick={() => onConfirm(formData)} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                    Confirm & Create
                </Button>
            </div>

            {/* Split Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* PDF Viewer */}
                <div ref={pdfContainerRef} className="w-1/2 h-full bg-black/20 overflow-y-auto p-4 border-r border-white/5 relative">
                    <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess}>
                        {Array.from(new Array(numPages), (_, index) => {
                            const page = index + 1;
                            return (
                                <div
                                    key={`page_${page}`}
                                    ref={(el) => { if (el) pageRefs.current.set(page, el); }}
                                    className={cn("mb-4 rounded-lg overflow-hidden shadow-lg transition-all", currentPage === page ? "ring-2 ring-indigo-500" : "opacity-80")}
                                >
                                    <Page pageNumber={page} renderTextLayer={false} width={500} />
                                </div>
                            );
                        })}
                    </Document>
                </div>

                {/* Form Editor */}
                <div className="w-1/2 h-full overflow-y-auto p-6">
                    <div className="max-w-lg mx-auto space-y-8">
                        {/* Course Info */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                <BookOpen className="w-3 h-3" /> Course Details
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-zinc-400">Code</label>
                                    <Input
                                        value={formData.courseInfo.code}
                                        onChange={(e) => updateCourseInfo("code", e.target.value)}
                                        onFocus={() => handleInputFocus(formData.courseInfo.location)}
                                        className="bg-white/5 border-white/10 text-white focus:bg-white/10"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-zinc-400">Color</label>
                                    <div className="flex gap-2">
                                        <Input type="color" value={formData.courseInfo.color} onChange={(e) => updateCourseInfo("color", e.target.value)} className="w-10 h-10 p-1 bg-white/5 border-white/10" />
                                        <Input value={formData.courseInfo.color} onChange={(e) => updateCourseInfo("color", e.target.value)} className="bg-white/5 border-white/10 text-white" />
                                    </div>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-xs text-zinc-400">Name</label>
                                    <Input
                                        value={formData.courseInfo.name}
                                        onChange={(e) => updateCourseInfo("name", e.target.value)}
                                        onFocus={() => handleInputFocus(formData.courseInfo.location)}
                                        className="bg-white/5 border-white/10 text-white focus:bg-white/10"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Assessments */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                <Percent className="w-3 h-3" /> Assessments
                            </h3>
                            {formData.assessments.map((item) => (
                                <motion.div key={item.id} layout className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-colors">
                                    <div className="flex justify-between items-center mb-3">
                                        <Input
                                            value={item.name}
                                            onChange={(e) => updateAssessment(item.id, "name", e.target.value)}
                                            onFocus={() => handleInputFocus(item.location)}
                                            className="bg-transparent border-none text-lg font-bold text-white p-0 h-auto focus-visible:ring-0"
                                        />
                                        <span className={cn("text-xs px-2 py-1 rounded-full border", item.confidence && item.confidence > 0.8 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400")}>
                                            {(item.confidence || 0.99) * 100}%
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-zinc-500 block mb-1">Weight</label>
                                            <Input
                                                type="number"
                                                value={item.weight}
                                                onChange={(e) => updateAssessment(item.id, "weight", Number(e.target.value))}
                                                onFocus={() => handleInputFocus(item.location)}
                                                className="bg-black/20 border-white/10 text-white h-8 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-500 block mb-1">Due Date</label>
                                            <Input
                                                type="date"
                                                value={item.date}
                                                onChange={(e) => updateAssessment(item.id, "date", e.target.value)}
                                                onFocus={() => handleInputFocus(item.location)}
                                                className="bg-black/20 border-white/10 text-white h-8 text-sm"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// --- 4. Main Component Export ---

interface SyllabusFlowProps {
    onConfirmExternal?: (data: ExtractedData) => void;
    onAnalysisComplete?: () => void;
}

export const SyllabusIngestionFlow = ({ onConfirmExternal, onAnalysisComplete }: SyllabusFlowProps) => {
    const [flowState, setFlowState] = useState<FlowState>("IDLE");
    const [file, setFile] = useState<File | null>(null);
    const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);

    const handleFileDrop = async (droppedFile: File) => {
        setFile(droppedFile);
        setFlowState("ANALYZING");

        try {
            const data = await mockAnalyzeSyllabus(droppedFile);
            setExtractedData(data);
            setFlowState("REVIEW");
            if (onAnalysisComplete) onAnalysisComplete();
        } catch (error) {
            console.error("Parsing failed", error);
            setFlowState("IDLE");
        }
    };

    const handleConfirm = (data: ExtractedData) => {
        if (onConfirmExternal) onConfirmExternal(data);
        setFlowState("IDLE");
        setFile(null);
        setExtractedData(null);
    };

    // --- FIX: The Root Container is now Transparent ---
    // We removed "bg-zinc-950", "border", "rounded", and "fixed height"
    // It now simply fills the parent container.
    return (
        <div className="w-full h-full relative">
            <AnimatePresence mode="wait">
                {flowState === "IDLE" && (
                    <DropzoneView key="idle" onFileDrop={handleFileDrop} />
                )}
                {flowState === "ANALYZING" && <AnalyzingView key="analyzing" />}
                {flowState === "REVIEW" && file && extractedData && (
                    <ReviewView
                        key="review"
                        fileUrl={URL.createObjectURL(file)}
                        data={extractedData}
                        onConfirm={handleConfirm}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default SyllabusIngestionFlow;