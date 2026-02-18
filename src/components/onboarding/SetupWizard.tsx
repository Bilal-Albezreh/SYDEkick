"use client";


import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import {
    GraduationCap,
    BookOpen,
    Calendar,
    CheckCircle2,
    ArrowRight,
    Loader2,
    Sparkles
} from "lucide-react";
import { setupUserTerm } from "@/app/actions/academics";
import { useRouter } from "next/navigation";

// =============================================
// TYPE DEFINITIONS
// =============================================

interface University {
    id: string;
    name: string;
}

interface Program {
    id: string;
    name: string;
    university_id: string;
}

// Hardcoded SYDE terms - always available for signup
const SYDE_TERMS = [
    { id: "1A", label: "1A" },
    { id: "1B", label: "1B" },
    { id: "2A", label: "2A" },
    { id: "2B", label: "2B" },
    { id: "3A", label: "3A" },
    { id: "3B", label: "3B" },
    { id: "4A", label: "4A" },
    { id: "4B", label: "4B" },
    { id: "5A", label: "5A" },
    { id: "5B", label: "5B" },
];

type Step = "identity" | "term" | "launch" | "success";

// =============================================
// MAIN COMPONENT
// =============================================

export default function SetupWizard() {
    const router = useRouter();
    const supabase = createClient();

    // State Machine
    const [currentStep, setCurrentStep] = useState<Step>("identity");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Step 1: Identity
    const [universities, setUniversities] = useState<University[]>([]);
    const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState<string>("");

    // Step 2: Term (using hardcoded SYDE_TERMS)
    const [selectedTerm, setSelectedTerm] = useState<string | null>(null);

    // Step 3: Launch
    const [startDate, setStartDate] = useState<string>(() => {
        // Default to Jan 5, 2026 or today
        const defaultDate = new Date("2026-01-05");
        return defaultDate.toISOString().split('T')[0];
    });
    const [termName, setTermName] = useState("Winter 2026");

    // ==========================================
    // STEP 1: FETCH UNIVERSITIES ON MOUNT
    // ==========================================
    useEffect(() => {
        async function fetchUniversities() {
            const { data, error } = await supabase
                .from("universities")
                .select("id, name")
                .order("name");

            if (error) {
                console.error("Error fetching universities:", error);
                setError("Failed to load universities");
                return;
            }

            setUniversities(data || []);
        }

        fetchUniversities();
    }, []);

    // ==========================================
    // STEP 1: FETCH PROGRAMS WHEN UNIVERSITY SELECTED
    // ==========================================
    useEffect(() => {
        if (!selectedUniversity) {
            setPrograms([]);
            setSelectedProgram(null);
            return;
        }

        async function fetchPrograms() {
            const { data, error } = await supabase
                .from("programs")
                .select("id, name, university_id")
                .eq("university_id", selectedUniversity!)
                .order("name");

            if (error) {
                console.error("Error fetching programs:", error);
                setError("Failed to load programs");
                return;
            }

            setPrograms(data || []);
        }

        fetchPrograms();
    }, [selectedUniversity]);

    // STEP 2: Terms are hardcoded as SYDE_TERMS constant - no fetch needed

    // ==========================================
    // NAVIGATION HANDLERS
    // ==========================================
    const handleNextFromIdentity = () => {
        if (!selectedProgram) {
            setError("Please select a program");
            return;
        }
        if (!displayName.trim()) {
            setError("Please enter your display name");
            return;
        }
        setError(null);
        setCurrentStep("term");
    };

    const handleNextFromTerm = () => {
        if (!selectedTerm) {
            setError("Please select a term");
            return;
        }
        setError(null);
        setCurrentStep("launch");
    };

    const handleLaunch = async () => {
        if (!selectedProgram || !selectedTerm) {
            setError("Missing required selections");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await setupUserTerm(
                selectedProgram,
                selectedTerm,
                new Date(startDate),
                termName,
                displayName,
                false // ✅ HARDCODED: Manual-only workflow (no preload)
            );

            if (!result.success) {
                setError(result.error || "Failed to setup term");
                setLoading(false);
                return;
            }

            // Success!
            setCurrentStep("success");
        } catch (err: any) {
            console.error("Setup error:", err);
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // ANIMATION VARIANTS
    // ==========================================
    const stepVariants = {
        enter: { x: 100, opacity: 0 },
        center: { x: 0, opacity: 1 },
        exit: { x: -100, opacity: 0 },
    };

    // ==========================================
    // RENDER STEPS
    // ==========================================

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-2xl bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="border-b border-zinc-800 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-cyan-400" />
                        <h2 className="text-xl font-bold text-white">Academic Setup</h2>
                    </div>
                    <p className="text-sm text-zinc-500 mt-1">
                        {currentStep === "identity" && "Step 1 of 3: Choose your program"}
                        {currentStep === "term" && "Step 2 of 3: Select your term"}
                        {currentStep === "launch" && "Step 3 of 3: Configure your semester"}
                        {currentStep === "success" && "Setup complete!"}
                    </p>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                )}

                {/* Step Content */}
                <div className="p-6 min-h-[400px] relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        {/* STEP 1: IDENTITY */}
                        {currentStep === "identity" && (
                            <motion.div
                                key="identity"
                                variants={stepVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                {/* University Selection */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-bold text-zinc-400 uppercase mb-3">
                                        <GraduationCap className="w-4 h-4" />
                                        University
                                    </label>
                                    <select
                                        value={selectedUniversity || ""}
                                        onChange={(e) => setSelectedUniversity(e.target.value)}
                                        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                                    >
                                        <option value="">Select University</option>
                                        {universities.map((uni) => (
                                            <option key={uni.id} value={uni.id}>
                                                {uni.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Program Selection */}
                                {selectedUniversity && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <label className="flex items-center gap-2 text-sm font-bold text-zinc-400 uppercase mb-3">
                                            <BookOpen className="w-4 h-4" />
                                            Program
                                        </label>
                                        <select
                                            value={selectedProgram || ""}
                                            onChange={(e) => setSelectedProgram(e.target.value)}
                                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                                        >
                                            <option value="">Select Program</option>
                                            {programs.map((prog) => (
                                                <option key={prog.id} value={prog.id}>
                                                    {prog.name}
                                                </option>
                                            ))}
                                        </select>
                                    </motion.div>
                                )}

                                {/* Display Name Input */}
                                {selectedProgram && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <label className="block text-sm font-bold text-zinc-400 uppercase mb-3">
                                            What should we call you?
                                        </label>
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            placeholder="e.g., Alex, Jamie, or your preferred name"
                                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none placeholder:text-zinc-500"
                                        />
                                    </motion.div>
                                )}

                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={handleNextFromIdentity}
                                        disabled={!selectedProgram || !displayName.trim()}
                                        className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold rounded-lg transition-colors"
                                    >
                                        Next <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: TERM SELECTION */}
                        {currentStep === "term" && (
                            <motion.div
                                key="term"
                                variants={stepVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-bold text-zinc-400 uppercase mb-4">
                                        <Calendar className="w-4 h-4" />
                                        Select Your Term
                                    </label>

                                    <div className="grid grid-cols-5 gap-3">
                                        {SYDE_TERMS.map((term) => (
                                            <button
                                                key={term.id}
                                                onClick={() => setSelectedTerm(term.id)}
                                                className={`
                                                    p-4 rounded-xl border-2 transition-all
                                                    ${selectedTerm === term.id
                                                        ? "bg-cyan-500/20 border-cyan-500 text-white"
                                                        : "bg-zinc-800/30 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                                                    }
                                                `}
                                            >
                                                <div className="text-xl font-bold">{term.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-between pt-4">
                                    <button
                                        onClick={() => setCurrentStep("identity")}
                                        className="px-6 py-3 text-zinc-400 hover:text-white font-bold transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleNextFromTerm}
                                        disabled={!selectedTerm}
                                        className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold rounded-lg transition-colors"
                                    >
                                        Next <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: LAUNCH */}
                        {currentStep === "launch" && (
                            <motion.div
                                key="launch"
                                variants={stepVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 uppercase mb-3">
                                        Term Name (Season)
                                    </label>
                                    <input
                                        type="text"
                                        value={termName}
                                        onChange={(e) => setTermName(e.target.value)}
                                        placeholder="e.g., Winter 2026"
                                        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 uppercase mb-3">
                                        Term Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                                    />
                                </div>

                                <div className="flex justify-between pt-4">
                                    <button
                                        onClick={() => setCurrentStep("term")}
                                        disabled={loading}
                                        className="px-6 py-3 text-zinc-400 hover:text-white font-bold transition-colors disabled:opacity-50"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleLaunch}
                                        disabled={loading}
                                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90 disabled:opacity-50 text-white font-bold rounded-lg transition-opacity"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Constructing Syllabus...
                                            </>
                                        ) : (
                                            <>
                                                Launch Setup <Sparkles className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 4: SUCCESS */}
                        {currentStep === "success" && (
                            <motion.div
                                key="success"
                                variants={stepVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className="flex flex-col items-center justify-center py-12 space-y-6"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring" }}
                                >
                                    <CheckCircle2 className="w-20 h-20 text-green-500" />
                                </motion.div>

                                <div className="text-center">
                                    <h3 className="text-2xl font-bold text-white mb-2">All Set!</h3>
                                    <p className="text-zinc-400">
                                        Your academic dashboard is ready to go.
                                    </p>
                                </div>

                                <button
                                    onClick={() => router.push("/dashboard")}
                                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90 text-white font-bold rounded-lg transition-opacity"
                                >
                                    Go to Dashboard
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
