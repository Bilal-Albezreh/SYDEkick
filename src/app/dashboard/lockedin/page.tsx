"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Pause, RotateCcw, ArrowLeft, CheckCircle2, Laptop, BookOpen, X, Handshake, User } from "lucide-react"; // Added User icon
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getUpcomingTasks, startFocusSession, endFocusSession, completeAssessment } from "@/app/actions/focus"; // [UPDATED] Removed getSquadStatus

export default function LockedInPage() {
    const [mode, setMode] = useState<"focus" | "short" | "long">("focus");
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);

    // Task State
    const [objective, setObjective] = useState("");
    const [linkedId, setLinkedId] = useState<string | null>(null);
    const [isObjectiveLocked, setIsObjectiveLocked] = useState(false);

    // Modals
    const [showTaskSelector, setShowTaskSelector] = useState(false);
    const [showCompletionModal, setShowCompletionModal] = useState(false);

    // Data State
    const [tasks, setTasks] = useState<{ assignments: any[], career: any[] }>({ assignments: [], career: [] });
    // [REMOVED] Squad State

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const MODES = {
        focus: { label: "Deep Work", minutes: 25, color: "text-white", border: "border-white/20" },
        short: { label: "Reset", minutes: 5, color: "text-emerald-400", border: "border-emerald-500/30" },
        long: { label: "Recharge", minutes: 15, color: "text-amber-400", border: "border-amber-500/30" },
    };

    const [sessionId, setSessionId] = useState<string | null>(null); // [NEW] Track active DB session

    // 1. Load Tasks on Mount
    useEffect(() => {
        // Fetch Tasks
        getUpcomingTasks().then(data => setTasks(data));
        // [REMOVED] Squad Polling
    }, []);

    // 2. Timer Logic (Optimized)
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        setIsActive(false);
                        handleSessionComplete();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isActive]);

    const resetTimer = () => { setIsActive(false); setTimeLeft(MODES[mode].minutes * 60); };
    const switchMode = (m: "focus" | "short" | "long") => { setMode(m); setIsActive(false); setTimeLeft(MODES[m].minutes * 60); };
    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

    const toggleTimer = async () => {
        const willBeActive = !isActive;
        setIsActive(willBeActive);

        if (willBeActive) {
            // [NEW] Start Session on DB
            try {
                const id = await startFocusSession(MODES[mode].minutes, objective || "Locked In", linkedId || undefined);
                setSessionId(id);
            } catch (e) { console.error(e); }
        } else {
            // Paused? For now we just leave the DB session running or we could mark it paused. 
            // MVP: Just leave it. Logic checks time anyway.
        }
    };

    // ...

    const handleSessionComplete = async () => {
        // [NEW] End Session on DB
        if (sessionId) {
            await endFocusSession(sessionId, MODES[mode].minutes);
            setSessionId(null);
        } else {
            // Fallback if session failed to start? Just log it? 
            // For now assume sessionId exists if flow worked.
        }

        if (linkedId) {
            setShowCompletionModal(true);
        }
        // Optional: Play a sound here
    };

    const finalizeTask = async () => {
        if (linkedId) await completeAssessment(linkedId);
        setShowCompletionModal(false);
        // ...
        setIsObjectiveLocked(false);
        setObjective("");
        setLinkedId(null);
        resetTimer();
    };

    return (
        <div className="fixed inset-0 h-screen w-screen flex flex-col overflow-hidden z-[9999] bg-black">

            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <img src="/locked-bg.jpg" alt="Background" className="w-full h-full object-cover" />
                <div className={cn("absolute inset-0 transition-colors duration-700", isActive ? "bg-black/60" : "bg-black/40")} />
            </div>

            {/* Top Bar */}
            <div className="relative z-20 flex items-center justify-between p-6 shrink-0">
                <Link href="/dashboard" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-bold tracking-widest text-xs uppercase shadow-black drop-shadow-md">Back To Dashboard</span>
                </Link>
                <div className="flex bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/10">
                    {(['focus', 'short', 'long'] as const).map((m) => (
                        <button key={m} onClick={() => switchMode(m)} className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all", mode === m ? "bg-white text-black" : "text-white/70")}>
                            {MODES[m].label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main HUD (Center) */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full max-w-4xl mx-auto px-4 min-h-0">

                {/* OBJECTIVE SELECTOR */}
                <div className="mb-10 w-full max-w-lg text-center relative shrink-0">
                    {!isObjectiveLocked ? (
                        <button
                            onClick={() => setShowTaskSelector(true)}
                            className="group relative w-full flex flex-col items-center justify-center gap-2 transition-all hover:scale-105"
                        >
                            <div className="text-xl md:text-3xl font-bold text-white/50 group-hover:text-white transition-colors border-b-2 border-transparent group-hover:border-white/30 pb-2">
                                {objective || "Define Your Mission..."}
                            </div>
                            <div className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                Click to Select Task
                            </div>
                        </button>
                    ) : (
                        <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 border border-white/10 text-[10px] font-bold text-white/80 uppercase tracking-widest">
                                <CheckCircle2 className="w-3 h-3 text-cyan-400" /> Target Locked
                            </div>
                            <div className="text-2xl md:text-4xl font-black text-white flex items-center gap-3 drop-shadow-2xl">
                                {objective}
                                <button onClick={() => { setIsObjectiveLocked(false); setObjective(""); setLinkedId(null); }} className="text-white/50 hover:text-white p-1"><RotateCcw className="w-4 h-4" /></button>
                            </div>
                        </div>
                    )}
                </div>

                {/* TIMER */}
                <div className="relative mb-12 flex flex-col items-center">
                    <div className="text-[7rem] md:text-[10rem] font-bold tracking-tighter tabular-nums leading-none select-none text-white drop-shadow-2xl">
                        {formatTime(timeLeft)}
                    </div>
                    <div className="mt-8 flex items-center gap-4">
                        <button onClick={toggleTimer} className="w-32 h-12 rounded-full bg-white text-black font-bold text-lg uppercase hover:bg-gray-200 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
                            {isActive ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                            {isActive ? "Pause" : "Start"}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- STATUS INDICATOR (Simplified) --- */}
            <div className="relative z-20 w-full p-8 shrink-0 flex justify-center">
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur rounded-full px-4 py-2 border border-white/10">
                    <div className={cn(
                        "w-2 h-2 rounded-full shadow-[0_0_10px_currentColor] transition-colors duration-500",
                        isActive ? "bg-green-400 text-green-400" : "bg-white/50 text-white"
                    )} />
                    <span className="text-xs font-bold uppercase tracking-widest text-white/80">
                        {isActive ? "System Status: Locked In" : "System Status: Standby"}
                    </span>
                </div>
            </div>

            {/* --- MODAL 1: TASK SELECTOR (ORIGINAL CODE PRESERVED) --- */}
            <AnimatePresence>
                {showTaskSelector && (
                    <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-[#0F0F0F] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Incoming Tasks</h3>
                                <button onClick={() => setShowTaskSelector(false)}><X className="w-5 h-5 text-gray-500 hover:text-white" /></button>
                            </div>

                            <div className="max-h-[60vh] overflow-y-auto p-2">
                                {/* 1. Assignments (Academic) */}
                                {tasks.assignments.filter((t: any) => t.type !== 'personal_task').length > 0 && (
                                    <div className="mb-4">
                                        <div className="text-[10px] font-bold text-gray-500 uppercase px-2 mb-2">Academic (Due Soon)</div>
                                        {tasks.assignments.filter((t: any) => t.type !== 'personal_task').map((a: any) => (
                                            <button key={a.id} onClick={() => { setObjective(a.name); setLinkedId(a.id); setIsObjectiveLocked(true); setShowTaskSelector(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group">
                                                <div className="w-8 h-8 rounded bg-blue-900/30 border border-blue-500/30 flex items-center justify-center shrink-0"><BookOpen className="w-4 h-4 text-blue-400" /></div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-200 group-hover:text-white">{a.name}</div>
                                                    <div className="text-xs text-gray-500">{a.course_code} • {a.weight}%</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* 1b. Personal Tasks [NEW] */}
                                {tasks.assignments.filter((t: any) => t.type === 'personal_task').length > 0 && (
                                    <div className="mb-4">
                                        <div className="text-[10px] font-bold text-gray-500 uppercase px-2 mb-2">Personal Tasks</div>
                                        {tasks.assignments.filter((t: any) => t.type === 'personal_task').map((a: any) => (
                                            <button key={a.id} onClick={() => { setObjective(a.name); setLinkedId(a.id); setIsObjectiveLocked(true); setShowTaskSelector(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group">
                                                <div className="w-8 h-8 rounded bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0"><CheckCircle2 className="w-4 h-4 text-gray-400" /></div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-200 group-hover:text-white">{a.name}</div>
                                                    <div className="text-xs text-gray-500">{a.description || "Personal Task"}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* 2. Career */}
                                {tasks.career.length > 0 && (
                                    <div className="mb-4">
                                        <div className="text-[10px] font-bold text-gray-500 uppercase px-2 mb-2">Career Priority</div>
                                        {tasks.career.map((item: any) => (
                                            <button key={item.id} onClick={() => {
                                                const label = item.type === 'interview' ? `${item.company_name} Interview` : `${item.company_name} OA`;
                                                setObjective(label);
                                                setLinkedId(item.id);
                                                setIsObjectiveLocked(true);
                                                setShowTaskSelector(false);
                                            }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group">
                                                <div className={cn("w-8 h-8 rounded border flex items-center justify-center shrink-0",
                                                    item.type === 'interview' ? "bg-yellow-900/30 border-yellow-500/30 text-yellow-500" : "bg-cyan-900/30 border-cyan-500/30 text-cyan-400"
                                                )}>
                                                    {item.type === 'interview' ? <Handshake className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-200 group-hover:text-white">
                                                        {item.company_name} <span className="text-[10px] uppercase opacity-70 border border-white/20 px-1 rounded ml-1">{item.type}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-500">{item.role_title}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* 3. Custom Input */}
                                <div className="p-2 border-t border-gray-800 mt-2">
                                    <div className="text-[10px] font-bold text-gray-500 uppercase mb-2">Custom Mission</div>
                                    <input
                                        placeholder="Type custom task..."
                                        className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 text-sm text-white focus:border-white/50 focus:outline-none"
                                        onKeyDown={(e: any) => { if (e.key === 'Enter') { setObjective(e.target.value); setLinkedId(null); setIsObjectiveLocked(true); setShowTaskSelector(false); } }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- MODAL 2: COMPLETION CHECK --- */}
            <AnimatePresence>
                {showCompletionModal && (
                    <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-sm w-full bg-[#111] border border-gray-800 p-8 rounded-3xl">
                            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
                            <h2 className="text-2xl font-bold text-white mb-2">Session Complete</h2>
                            <p className="text-gray-400 mb-8 text-sm">Did you finish <span className="text-white font-bold">"{objective}"</span>?</p>

                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => { finalizeTask(); }} className="py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors">
                                    Yes, Mark Done
                                </button>
                                <button onClick={() => { setShowCompletionModal(false); resetTimer(); }} className="py-3 rounded-xl bg-gray-800 text-white font-bold hover:bg-gray-700 transition-colors">
                                    Not Yet
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}