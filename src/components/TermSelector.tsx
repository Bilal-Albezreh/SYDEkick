"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";

interface Term {
    id: string;
    label: string;
    is_current: boolean | null;
}

interface TermSelectorProps {
    terms: Term[];
    currentTermId: string;
}

export default function TermSelector({ terms, currentTermId }: TermSelectorProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleTermChange = (termId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("term_id", termId);
        router.push(`${pathname}?${params.toString()}`);
    };

    const currentTerm = terms.find(t => t.id === currentTermId);

    if (!isMounted) {
        return (
            <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div className="w-[180px] h-10 bg-black/50 border border-white/10 rounded-md flex items-center px-3 text-gray-200 text-sm">
                    {currentTerm?.label || "Select Term"}
                    {currentTerm?.is_current && (
                        <span className="ml-2 text-[10px] text-cyan-400 font-bold">• CURRENT</span>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-gray-400" />
            <Select value={currentTermId} onValueChange={handleTermChange}>
                <SelectTrigger className="w-[180px] bg-black/50 border-white/10 text-gray-200 h-10 focus:border-cyan-500/50">
                    <SelectValue>
                        {currentTerm?.label || "Select Term"}
                        {currentTerm?.is_current && (
                            <span className="ml-2 text-[10px] text-cyan-400 font-bold">• CURRENT</span>
                        )}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
                    {terms.map((term) => (
                        <SelectItem
                            key={term.id}
                            value={term.id}
                            className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                        >
                            <div className="flex items-center justify-between w-full">
                                <span>{term.label}</span>
                                {term.is_current && (
                                    <span className="ml-3 text-[10px] text-cyan-400 font-bold">CURRENT</span>
                                )}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
