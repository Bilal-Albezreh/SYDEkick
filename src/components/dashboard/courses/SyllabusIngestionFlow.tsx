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
    GraduationCap,
    Calendar,
    ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACADEMIC_TERMS } from "@/lib/constants";

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
    term: string;
    credits: number;
    confidence: number;
    location: Location;
}

export interface Assessment {
    id: string;
    name: string;
    weight: number;
    date: string;
    type: string;
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
                    code: "SYDE 285",
                    name: "Materials Chemistry",
                    term: "2A",
                    credits: 0.5,
                    confidence: 1.0,
                    color: "#4361ee", // Blue for Chemistry vibes
                    location: { page: 1, y: 100 },
                },
                assessments: [
                    { id: "a1", name: "Assignment 1", weight: 1.5, date: "2026-01-25", type: "Assignment", location: { page: 1, y: 200 } },
                    { id: "a2", name: "Assignment 2", weight: 1.5, date: "2026-02-08", type: "Assignment", location: { page: 1, y: 220 } },
                    { id: "a3", name: "Assignment 3", weight: 1.5, date: "2026-03-02", type: "Assignment", location: { page: 1, y: 240 } },
                    { id: "a4", name: "Assignment 4", weight: 1.5, date: "2026-03-09", type: "Assignment", location: { page: 1, y: 260 } },
                    { id: "cs", name: "Case Studies / Tutorials", weight: 10, date: "2026-04-01", type: "Other", location: { page: 1, y: 300 } },
                    { id: "mid", name: "Midterm Exam", weight: 20, date: "2026-02-24", type: "Exam", location: { page: 1, y: 350 } },
                    { id: "final", name: "Final Exam", weight: 45, date: "2026-04-20", type: "Exam", location: { page: 1, y: 400 } },
                    { id: "q1", name: "Quiz 1", weight: 1, date: "2026-01-25", type: "Quiz", location: { page: 1, y: 450 } },
                    { id: "q2", name: "Quiz 2", weight: 1, date: "2026-02-08", type: "Quiz", location: { page: 1, y: 470 } },
                    { id: "q3", name: "Quiz 3", weight: 1, date: "2026-03-06", type: "Quiz", location: { page: 1, y: 490 } },
                    { id: "q4", name: "Quiz 4", weight: 1, date: "2026-03-13", type: "Quiz", location: { page: 1, y: 510 } },
                    { id: "proj", name: "Term Project", weight: 15, date: "2026-04-05", type: "Project", location: { page: 1, y: 550 } },
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
                    "relative w-full aspect-square max-w-[240px] rounded-[32px] flex flex-col items-center justify-center cursor-pointer transition-all duration-500 group overflow-hidden",
                    "bg-white/5 hover:bg-white/10 shadow-2xl hover:shadow-indigo-500/20",
                    isDragActive && "scale-105"
                )}
            >
                <input {...getInputProps()} />

                {/* APPLE INTELLIGENCE GLOW (Outer Border / Background) - LINEAR SWEEP */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none overflow-hidden rounded-[32px]">
                    <div className="absolute inset-0 bg-zinc-900/90 m-[1px] rounded-[31px] z-10" />
                    <motion.div
                        className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-[#bd60f3] to-transparent"
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{
                            repeat: Infinity,
                            duration: 2,
                            ease: "linear",
                            repeatDelay: 0.5
                        }}
                        style={{ width: "200%", left: "-50%" }}
                    />
                </div>

                {/* ICON with Linear Sweep Glow */}
                <div className="relative mb-6 z-10 group-hover:scale-110 transition-transform duration-500">
                    <div className="absolute inset-0 blur-2xl bg-indigo-500/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative p-6 rounded-3xl bg-zinc-900/50 border border-white/10 group-hover:border-transparent transition-colors overflow-hidden">

                        {/* Apple Intelligence Glow BEHIND the icon (visible on hover) - LINEAR SWEEP */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 overflow-hidden rounded-[24px]">
                            <div className="absolute inset-[1px] bg-zinc-900/90 rounded-[23px] z-10" />
                            <motion.div
                                className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-[#bd60f3] to-transparent"
                                initial={{ x: "-100%" }}
                                animate={{ x: "100%" }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 1.5,
                                    ease: "linear",
                                    repeatDelay: 0.2
                                }}
                                style={{ width: "200%", left: "-50%" }}
                            />
                        </div>

                        {/* The Icon Itself */}
                        <div className="relative z-20">
                            <UploadCloud className="w-10 h-10 text-zinc-400 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-br group-hover:from-white group-hover:to-indigo-200 transition-all duration-300" />
                            {/* Optional: Overlay icon with white on hover for crispness if gradient is too subtle */}
                            <UploadCloud className="absolute inset-0 w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-overlay" />
                        </div>
                    </div>
                </div>

                <h3 className="relative z-10 text-xl font-bold text-white mb-2 text-center px-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-200 group-hover:via-white group-hover:to-purple-200 transition-all">
                    Import Syllabus
                </h3>
                <p className="relative z-10 text-zinc-500 text-sm text-center px-8 group-hover:text-zinc-400 transition-colors">
                    Drag and drop or <span className="text-indigo-400 group-hover:text-white transition-colors underline decoration-indigo-400/30 underline-offset-4">browse</span>
                </p>
            </div>

            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-bold group-hover:text-indigo-500/50 transition-colors">
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
    const [formData, setFormData] = useState<ExtractedData>(() => {
        // Ensure defaults if missing from parser
        return {
            ...data,
            courseInfo: {
                ...data.courseInfo,
                term: data.courseInfo.term || "Current",
                credits: data.courseInfo.credits || 0.5,
            },
            assessments: data.assessments.map(a => ({
                ...a,
                type: a.type || "Assignment", // Intelligent Default
                date: a.date || "",
            }))
        };
    });
    const [numPages, setNumPages] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pdfContainerRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => setNumPages(numPages);

    const handleInputFocus = (location: Location) => {
        const pageElement = pageRefs.current.get(location.page);
        const container = pdfContainerRef.current;
        if (pageElement && container) {
            // Calculate relative position within the scrollable container
            // Since the pageElement is inside the scrollable container, offsetTop is relative to the *scrolled content* top, 
            // but we need to account for any padding if necessary. 
            // However, offsetTop usually gives distance to nearest positioned parent.
            // Let's assume the direct parent structure is simple.
            container.scrollTo({ top: pageElement.offsetTop - 50, behavior: "smooth" });
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
            className="flex flex-col h-full overflow-hidden"
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
            </div>

            {/* Split Content */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* PDF Viewer */}
                <div
                    ref={pdfContainerRef}
                    className="w-1/2 h-full overflow-y-auto bg-zinc-950/50 relative border-r border-white/5 flex flex-col items-center custom-scrollbar"
                >
                    <div className="w-full flex flex-col items-center">
                        <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess} className="flex flex-col items-center w-full">
                            {Array.from(new Array(numPages), (_, index) => {
                                const page = index + 1;
                                return (
                                    <div
                                        key={`page_${page}`}
                                        ref={(el) => { if (el) pageRefs.current.set(page, el); }}
                                        className="w-full relative border-b border-white/5 flex justify-center bg-transparent"
                                    >
                                        <Page
                                            pageNumber={page}
                                            renderTextLayer={false}
                                            width={undefined}
                                            scale={1.0}
                                            className="max-w-full h-auto"
                                        />
                                    </div>
                                );
                            })}
                        </Document>
                    </div>
                </div>

                {/* Form Editor */}
                <div className="w-1/2 h-full flex flex-col relative">
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        {/* --- 1. ENGINEERING GRID BACKGROUND (With Fade Mask) --- */}
                        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)" />
                        </div>

                        {/* --- 2. SPOTLIGHT (Reactive Light Source) --- */}
                        <div
                            className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 blur-3xl opacity-20 transition-colors duration-700 pointer-events-none z-0"
                            style={{ backgroundColor: formData.courseInfo.color }}
                        />

                        <div className="relative z-10 max-w-lg mx-auto space-y-8 pb-20">
                            {/* Course Info */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                    <BookOpen className="w-3 h-3" /> Course Details
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Code & Color */}
                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-400">Code</label>
                                        <Input
                                            value={formData.courseInfo.code}
                                            onChange={(e) => updateCourseInfo("code", e.target.value)}
                                            onFocus={() => handleInputFocus(formData.courseInfo.location)}
                                            className="bg-black/40 border-white/10 text-white focus:bg-black/60 focus:border-indigo-500/50 backdrop-blur-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-400">Color</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {['#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6'].map((color) => (
                                                <button
                                                    key={color}
                                                    onClick={() => updateCourseInfo("color", color)}
                                                    className={cn(
                                                        "w-6 h-6 rounded-md transition-all shadow-lg",
                                                        formData.courseInfo.color === color ? "ring-2 ring-white ring-offset-2 ring-offset-black scale-110" : "hover:scale-110 opacity-80 hover:opacity-100"
                                                    )}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Term & Credits (NEW) */}
                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-400">Academic Term</label>
                                        <Select
                                            value={formData.courseInfo.term}
                                            onValueChange={(val) => updateCourseInfo("term", val)}
                                        >
                                            <SelectTrigger className="w-full bg-black/40 border-white/10 h-10 text-white focus:ring-0 focus:border-indigo-500/50 backdrop-blur-sm">
                                                <SelectValue placeholder="Term" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                                {[...ACADEMIC_TERMS, "Current"].map((term) => (
                                                    <SelectItem key={term} value={term} className="focus:bg-white/10 focus:text-white cursor-pointer">
                                                        {term}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-400">Credits</label>
                                        <Input
                                            type="number"
                                            value={formData.courseInfo.credits}
                                            onChange={(e) => updateCourseInfo("credits", parseFloat(e.target.value))}
                                            step="0.25"
                                            className="bg-black/40 border-white/10 text-white focus:bg-black/60 focus:border-indigo-500/50 backdrop-blur-sm"
                                            placeholder="0.5"
                                        />
                                    </div>

                                    {/* Name (Full Width) */}
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-xs text-zinc-400">Name</label>
                                        <Input
                                            value={formData.courseInfo.name}
                                            onChange={(e) => updateCourseInfo("name", e.target.value)}
                                            onFocus={() => handleInputFocus(formData.courseInfo.location)}
                                            className="bg-black/40 border-white/10 text-white focus:bg-black/60 focus:border-indigo-500/50 backdrop-blur-sm"
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
                                    <motion.div key={item.id} layout className="p-4 rounded-xl bg-black/40 border border-white/10 hover:border-indigo-500/50 transition-colors backdrop-blur-sm shadow-sm relative overflow-hidden group">
                                        {/* Subtle highlight on hover */}
                                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                        {/* Row 1: Name & Weight */}
                                        <div className="flex justify-between items-start mb-3 relative z-10 gap-4">
                                            <Input
                                                value={item.name}
                                                onChange={(e) => updateAssessment(item.id, "name", e.target.value)}
                                                onFocus={() => handleInputFocus(item.location)}
                                                className="bg-transparent border-none text-lg font-bold text-white p-0 h-auto focus-visible:ring-0 placeholder:text-zinc-600 flex-1 min-w-0"
                                                placeholder="Assessment Name"
                                            />
                                            <div className="flex items-center gap-2 shrink-0">
                                                <div className="relative w-20">
                                                    <Input
                                                        type="number"
                                                        value={item.weight}
                                                        onChange={(e) => updateAssessment(item.id, "weight", Number(e.target.value))}
                                                        onFocus={() => handleInputFocus(item.location)}
                                                        className="bg-black/20 border-white/10 text-white h-7 text-sm focus:bg-black/40 transition-colors text-right pr-6"
                                                    />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">%</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row 2: Type & Date */}
                                        <div className="grid grid-cols-2 gap-3 relative z-10">
                                            <div>
                                                <label className="text-[10px] text-zinc-500 block mb-1 uppercase tracking-wider">Type</label>
                                                <Select
                                                    value={item.type || "Assignment"}
                                                    onValueChange={(val) => updateAssessment(item.id, "type", val)}
                                                >
                                                    <SelectTrigger className="w-full bg-black/20 border-white/10 h-8 text-xs text-white focus:ring-0 transition-colors">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                                        {["Assignment", "Exam", "Quiz", "Project", "Lab", "Other"].map((t) => (
                                                            <SelectItem key={t} value={t} className="text-xs focus:bg-white/10 focus:text-white cursor-pointer">
                                                                {t}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-zinc-500 block mb-1 uppercase tracking-wider">Due Date</label>
                                                <div className="relative">
                                                    <Input
                                                        type="date"
                                                        value={item.date}
                                                        onChange={(e) => updateAssessment(item.id, "date", e.target.value)}
                                                        onFocus={() => handleInputFocus(item.location)}
                                                        className="bg-black/20 border-white/10 text-white h-8 text-xs focus:bg-black/40 transition-colors pl-8 block w-full [color-scheme:dark]"
                                                    />
                                                    <Calendar className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Confidence Badge (Floating) */}
                                        <div className="absolute top-2 right-2 opacity-50 hover:opacity-100 transition-opacity">
                                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded border opacity-50", item.confidence && item.confidence > 0.8 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400")}>
                                                {(item.confidence || 0.99) * 100}%
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* ADD ASSESSMENT BUTTON (Premium Glow) */}
                            <button
                                type="button"
                                onClick={() => {
                                    const newId = `new_a_${Date.now()}`;
                                    setFormData((prev) => ({
                                        ...prev,
                                        assessments: [
                                            ...prev.assessments,
                                            {
                                                id: newId,
                                                name: "",
                                                weight: 0,
                                                date: "",
                                                type: "Assignment",
                                                location: { page: 1, y: 0 },
                                                confidence: 1,
                                            },
                                        ],
                                    }));
                                }}
                                className="group relative z-20 w-full h-12 rounded-xl font-bold text-white transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-lg hover:shadow-indigo-500/25 overflow-hidden flex items-center justify-center gap-2 border border-white/5 cursor-pointer"
                            >
                                {/* 1. APPLE INTELLIGENCE GLOW (Hidden by default, Visible on Hover) */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                                    <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#bd60f3_0%,#f5b9ea_50%,#67e7f5_100%)] blur-xl" />
                                </div>

                                {/* 2. STATIC GLASS BACKGROUND (Visible by default, Fades out on Hover) */}
                                <div className="absolute inset-0 bg-white/5 group-hover:opacity-0 transition-opacity duration-500" />

                                {/* 3. GLASSY OVERLAY (For text readability on hover) */}
                                <div className="absolute inset-[1px] rounded-[10px] bg-zinc-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                {/* Content */}
                                <div className="relative z-10 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                                    <span className="text-zinc-400 group-hover:text-white transition-colors">Add Assessment</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* STICKY FOOTER */}
                    <div className="sticky bottom-0 z-50 p-6 border-t border-white/5 bg-zinc-950/80 backdrop-blur-xl">
                        <button
                            onClick={() => onConfirm(formData)}
                            className="group relative w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-lg hover:shadow-indigo-500/25 overflow-hidden"
                            style={{
                                boxShadow: `0 0 20px ${formData.courseInfo.color}40`, // Keep the subtle static glow matching the course
                            }}
                        >
                            {/* 1. APPLE INTELLIGENCE GLOW (Hidden by default, Visible on Hover) */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                                <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#bd60f3_0%,#f5b9ea_50%,#67e7f5_100%)] blur-xl" />
                            </div>

                            {/* 2. DYNAMIC STATIC BACKGROUND (Visible by default, Fades out on Hover) */}
                            <div
                                className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-0"
                                style={{ backgroundColor: formData.courseInfo.color }}
                            />

                            {/* 3. GLASSY OVERLAY (For text readability on hover) */}
                            <div className="absolute inset-[1px] rounded-xl bg-zinc-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            {/* Content */}
                            <div className="relative z-10 flex items-center gap-2 text-white drop-shadow-md">
                                <span>Confirm & Create Course</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </motion.div >
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
