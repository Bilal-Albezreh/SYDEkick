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
                        className="group relative overflow-hidden bg-black/40 border-white/10 hover:bg-white/5 hover:border-blue-500/50 hover:text-blue-400 transition-all duration-300"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />

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
                    </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-zinc-900 border-white/10 text-zinc-300 text-xs p-3 max-w-[200px]">
                    <p>Click to copy your unique calendar URL. Paste this into Google Calendar or Apple Calendar to auto-sync deadlines.</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
