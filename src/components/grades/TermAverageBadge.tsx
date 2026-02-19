"use client";

import { motion } from "framer-motion";

interface TermAverageBadgeProps {
    variant: "hero" | "docked";
    average: number;
    hasData: boolean;
}

export default function TermAverageBadge({ variant, average, hasData }: TermAverageBadgeProps) {
    if (!hasData) return null;

    const glowColor = average >= 80 ? "#22c55e" : average >= 70 ? "#eab308" : "#ef4444";

    const formatted = average.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
    });

    if (variant === "hero") {
        return (
            <motion.div
                layoutId="term-avg-badge"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                style={{
                    background: `radial-gradient(circle at 8% 50%, ${glowColor}30 0%, transparent 60%)`,
                    boxShadow: `0 0 0 1px ${glowColor}25, 0 0 40px -12px ${glowColor}33`,
                }}
                className="flex items-center gap-5 px-7 py-5 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden relative"
            >
                {/* Large glowing dot */}
                <div
                    style={{
                        backgroundColor: glowColor,
                        boxShadow: `0 0 16px 5px ${glowColor}88, 0 0 40px 10px ${glowColor}33`,
                    }}
                    className="w-4 h-4 rounded-full flex-shrink-0"
                />

                <div className="flex flex-col">
                    <span className="text-[11px] uppercase tracking-widest text-white/35 font-semibold leading-none mb-1.5">
                        Term Average
                    </span>
                    <span
                        style={{ color: glowColor, textShadow: `0 0 30px ${glowColor}66` }}
                        className="text-4xl font-black tabular-nums tracking-tighter leading-none"
                    >
                        {formatted}%
                    </span>
                </div>
            </motion.div>
        );
    }

    // ── docked variant ──
    return (
        <motion.div
            layoutId="term-avg-badge"
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            style={{
                background: `radial-gradient(circle at 0% 50%, ${glowColor}22 0%, transparent 70%)`,
                boxShadow: `0 0 0 1px ${glowColor}18`,
            }}
            className="flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden relative"
        >
            {/* Small glowing dot */}
            <div
                style={{
                    backgroundColor: glowColor,
                    boxShadow: `0 0 10px 3px ${glowColor}99, 0 0 20px 6px ${glowColor}44`,
                }}
                className="w-2 h-2 rounded-full flex-shrink-0"
            />
            <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">
                Term Avg
            </span>
            <span
                style={{ color: glowColor, textShadow: `0 0 16px ${glowColor}88` }}
                className="text-lg font-mono font-bold tracking-tight"
            >
                {formatted}%
            </span>
        </motion.div>
    );
}
