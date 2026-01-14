"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { addInterview } from "@/app/actions/career";
import { Calendar as CalendarIcon, Briefcase, Building2, Loader2, Laptop } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddInterviewDialogProps {
    isOpen: boolean;
    onClose: () => void;
    mode: "interview" | "oa"; // Strict typing: It must be one or the other
}

export default function AddInterviewDialog({ isOpen, onClose, mode }: AddInterviewDialogProps) {
    const [loading, setLoading] = useState(false);
    const dateInputRef = useRef<HTMLInputElement>(null);
    const isSubmitting = useRef(false); // [FIX] Ref to block double-clicks instantly

    async function handleSubmit(formData: FormData) {
        if (isSubmitting.current) return;
        isSubmitting.current = true;
        setLoading(true);

        try {
            formData.append("type", mode);
            await addInterview(formData);
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            isSubmitting.current = false;
            setLoading(false);
        }
    }

    // The "Click Anywhere" Fix
    const handleDateClick = () => {
        dateInputRef.current?.showPicker();
    };

    const isOA = mode === "oa";

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#0a0a0a] border border-gray-800 text-white sm:max-w-[425px] p-0 overflow-hidden rounded-2xl shadow-2xl">
                {/* Dynamic Header Color */}
                <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", isOA ? "from-purple-500 to-indigo-500" : "from-emerald-500 to-blue-500")} />

                <div className="p-6">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", isOA ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500")}>
                                {isOA ? <Laptop className="w-4 h-4" /> : <CalendarIcon className="w-4 h-4" />}
                            </span>
                            {isOA ? "Log Online Assessment" : "Log Interview"}
                        </DialogTitle>
                    </DialogHeader>

                    <form action={handleSubmit} className="flex flex-col gap-4">

                        {/* Company */}
                        <div className="space-y-1.5 group">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Company</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-3 w-4 h-4 text-gray-500 group-focus-within:text-white transition-colors" />
                                <input name="company" required placeholder={isOA ? "e.g. Amazon" : "e.g. Tesla"} className="w-full bg-[#141414] border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-gray-600 transition-all placeholder:text-gray-600" />
                            </div>
                        </div>

                        {/* Role */}
                        <div className="space-y-1.5 group">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Role</label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-3 w-4 h-4 text-gray-500 group-focus-within:text-white transition-colors" />
                                <input name="role" required placeholder={isOA ? "e.g. SDE Intern (OA)" : "e.g. Firmware Intern"} className="w-full bg-[#141414] border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-gray-600 transition-all placeholder:text-gray-600" />
                            </div>
                        </div>

                        {/* Date Input */}
                        <div className="space-y-1.5 group">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{isOA ? "Deadline" : "Date & Time"}</label>
                            <div className="relative cursor-pointer" onClick={handleDateClick}>
                                <CalendarIcon className="absolute left-3 top-3 w-4 h-4 text-gray-500 group-focus-within:text-white transition-colors z-10" />
                                <input
                                    ref={dateInputRef}
                                    type="datetime-local"
                                    name="date"
                                    required
                                    className="w-full bg-[#141414] border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-gray-600 transition-all text-gray-300 cursor-pointer"
                                />
                                <div className="absolute right-3 top-3 pointer-events-none">
                                    <span className="text-[10px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">Select</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button disabled={loading} className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isOA ? "Log Assessment" : "Confirm Interview")}
                            </button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}