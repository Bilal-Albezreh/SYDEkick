"use client";

import { Button } from "@/components/ui/button";
import { Link, Check, Calendar, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface CalendarSyncButtonProps {
    userId: string;
}

export default function CalendarSyncButton({ userId }: CalendarSyncButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const url = `${window.location.origin}/api/calendar/sync?userId=${userId}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Sync link copied to clipboard!");

        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        onClick={handleCopy}
                        variant="outline"
                        className="group relative overflow-hidden bg-black/40 border-white/10 hover:bg-white/5 hover:border-transparent transition-all duration-300"
                    >
                        {/* APPLE INTELLIGENCE GLOW BACKGROUND */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                            <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#bd60f3_0%,#f5b9ea_50%,#67e7f5_100%)] blur-xl" />
                        </div>

                        {/* Glassy Overlay */}
                        <div className="absolute inset-[1px] rounded-md bg-zinc-950/80 backdrop-blur-sm transition-colors" />

                        <div className="relative z-10 flex items-center">

                            {copied ? (
                                <>
                                    <Check className="mr-2 h-4 w-4 text-emerald-400" />
                                    <span className="text-emerald-400 font-medium">Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Link className="mr-2 h-4 w-4" />
                                    <span className="font-medium">Sync to Calendar</span>
                                </>
                            )}
                        </div>
                    </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-zinc-900 border-white/10 text-zinc-300 text-xs p-3 max-w-[200px]">
                    <p>Click to copy your unique calendar URL. Paste this into Google Calendar or Apple Calendar to auto-sync deadlines.</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
