"use client";

import { motion } from "framer-motion";
import CountUp from "@/components/ui/CountUp";

interface TermAverageBadgeProps {
    variant: "hero" | "docked";
    average: number;
    hasData: boolean;
}

export default function TermAverageBadge({ variant, average, hasData }: TermAverageBadgeProps) {
    if (!hasData) return null;

    const color = average >= 80 ? "#00E676" : average >= 70 ? "#FFC107" : "#FF3B30";

    const formatted = average.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
    });

    if (variant === "hero") {
        return (
            <motion.div
                layoutId="term-avg-badge"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                className="relative w-full"
            >
                {/* Layer 1: Hollow masked animated border */}
                <div
                    className="absolute inset-0 z-0 pointer-events-none rounded-3xl overflow-hidden"
                    style={{
                        padding: "2px",
                        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                        WebkitMaskComposite: "xor",
                        maskComposite: "exclude",
                    }}
                >
                    <div
                        className="absolute inset-[-100%] animate-[spin_4s_linear_infinite]"
                        style={{
                            background: `conic-gradient(from 0deg, transparent 60%, ${color} 90%, transparent 100%)`,
                        }}
                    />
                </div>

                {/* Layer 2: Glass card */}
                <div className="relative z-10 flex flex-col items-center justify-center py-10 px-8 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/5">
                    <span className="text-xs sm:text-sm font-bold tracking-[0.2em] text-white/50 mb-2 uppercase">
                        Term Average
                    </span>
                    <div className="flex items-baseline">
                        <CountUp
                            to={average}
                            duration={2.5}
                            decimals={2}
                            startWhen={true}
                            className="text-6xl sm:text-7xl font-mono font-extrabold text-white tabular-nums tracking-tighter"
                            style={{ textShadow: "0 4px 20px rgba(255,255,255,0.2)" }}
                        />
                        <span className="text-6xl sm:text-7xl font-mono font-extrabold text-white" style={{ textShadow: "0 4px 20px rgba(255,255,255,0.2)" }}>%</span>
                    </div>
                </div>
            </motion.div>
        );
    }

    // ── docked variant ──
    return (
        <motion.div
            layoutId="term-avg-badge"
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="relative"
        >
            {/* Layer 1: Hollow masked animated border */}
            <div
                className="absolute inset-0 z-0 pointer-events-none rounded-full overflow-hidden"
                style={{
                    padding: "2px",
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                }}
            >
                <div
                    className="absolute inset-[-100%] animate-[spin_4s_linear_infinite]"
                    style={{
                        background: `conic-gradient(from 0deg, transparent 60%, ${color} 90%, transparent 100%)`,
                    }}
                />
            </div>

            {/* Layer 2: Glass pill */}
            <div className="relative z-10 flex items-center gap-3 py-2 px-5 rounded-full bg-white/[0.03] backdrop-blur-2xl border border-white/5">
                {/* Pulsing color dot */}
                <div
                    style={{ backgroundColor: color, boxShadow: `0 0 8px 2px ${color}` }}
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse"
                />
                <span className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase">
                    Term Avg
                </span>
                <div className="flex items-baseline gap-0.5">
                    <CountUp
                        to={average}
                        duration={2.5}
                        decimals={2}
                        startWhen={true}
                        className="text-xl font-mono font-bold text-white tabular-nums"
                        style={{ textShadow: "0 2px 10px rgba(255,255,255,0.2)" }}
                    />
                    <span className="text-xl font-mono font-bold text-white" style={{ textShadow: "0 2px 10px rgba(255,255,255,0.2)" }}>%</span>
                </div>
            </div>
        </motion.div>
    );
}
