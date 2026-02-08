"use client";

import { useState, useEffect } from "react";
import { updateAcademicProfile } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { GraduationCap, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

interface University {
    id: string;
    name: string;
}

interface Program {
    id: string;
    name: string;
    university_id: string;
}

interface AcademicSettingsCardProps {
    initialUniversityId: string | null;
    initialProgramId: string | null;
    initialTermLabel: string | null;
}

// Hardcoded SYDE terms - same as SetupWizard
const TERM_OPTIONS = [
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

export default function AcademicSettingsCard({
    initialUniversityId,
    initialProgramId,
    initialTermLabel,
}: AcademicSettingsCardProps) {
    const supabase = createClient();

    // State
    const [universities, setUniversities] = useState<University[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [selectedUniversity, setSelectedUniversity] = useState<string>(initialUniversityId || "");
    const [selectedProgram, setSelectedProgram] = useState<string>(initialProgramId || "");
    const [selectedTerm, setSelectedTerm] = useState<string>(initialTermLabel || "");
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    // Fetch universities on mount
    useEffect(() => {
        async function fetchUniversities() {
            const { data, error } = await supabase
                .from("universities")
                .select("id, name")
                .order("name");

            if (error) {
                console.error("Error fetching universities:", error);
                toast.error("Failed to load universities");
                return;
            }

            setUniversities(data || []);
            setLoadingData(false);
        }

        fetchUniversities();
    }, []);

    // Fetch programs when university changes
    useEffect(() => {
        if (!selectedUniversity) {
            setPrograms([]);
            return;
        }

        async function fetchPrograms() {
            const { data, error } = await supabase
                .from("programs")
                .select("id, name, university_id")
                .eq("university_id", selectedUniversity)
                .order("name");

            if (error) {
                console.error("Error fetching programs:", error);
                toast.error("Failed to load programs");
                return;
            }

            setPrograms(data || []);
        }

        fetchPrograms();
    }, [selectedUniversity]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedUniversity || !selectedProgram || !selectedTerm) {
            toast.error("Please fill in all fields");
            return;
        }

        setLoading(true);
        try {
            const result = await updateAcademicProfile(
                selectedUniversity,
                selectedProgram,
                selectedTerm
            );

            if (!result.success) {
                toast.error(result.error || "Failed to update academic information");
                return;
            }

            toast.success("Academic information updated successfully");
        } catch (err: any) {
            toast.error(err.message || "Failed to save changes");
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
                <GraduationCap className="w-5 h-5 text-purple-500" />
                <h2 className="text-lg font-bold text-white">Academic Information</h2>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
                {/* University Selector */}
                <div className="grid gap-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">University</label>
                    <select
                        value={selectedUniversity}
                        onChange={(e) => {
                            setSelectedUniversity(e.target.value);
                            setSelectedProgram(""); // Reset program when university changes
                        }}
                        className="bg-black/50 border border-white/10 text-gray-200 h-11 rounded-md px-3 focus:border-cyan-500/50 focus:outline-none"
                    >
                        <option value="">Select University</option>
                        {universities.map((uni) => (
                            <option key={uni.id} value={uni.id}>
                                {uni.name}
                            </option>
                        ))}
                    </select>
                    <p className="text-[10px] text-gray-600">Your institution</p>
                </div>

                {/* Program Selector */}
                <div className="grid gap-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Program</label>
                    <select
                        value={selectedProgram}
                        onChange={(e) => setSelectedProgram(e.target.value)}
                        disabled={!selectedUniversity || programs.length === 0}
                        className="bg-black/50 border border-white/10 text-gray-200 h-11 rounded-md px-3 focus:border-cyan-500/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="">Select Program</option>
                        {programs.map((prog) => (
                            <option key={prog.id} value={prog.id}>
                                {prog.name}
                            </option>
                        ))}
                    </select>
                    <p className="text-[10px] text-gray-600">Your field of study</p>
                </div>

                {/* Current Term Selector */}
                <div className="grid gap-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Current Term</label>
                    <div className="grid grid-cols-5 gap-2">
                        {TERM_OPTIONS.map((term) => (
                            <button
                                key={term.id}
                                type="button"
                                onClick={() => setSelectedTerm(term.id)}
                                className={`
                  p-3 rounded-lg border-2 transition-all text-sm font-bold
                  ${selectedTerm === term.id
                                        ? "bg-cyan-500/20 border-cyan-500 text-white"
                                        : "bg-black/30 border-white/10 text-gray-400 hover:border-white/20"
                                    }
                `}
                            >
                                {term.label}
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] text-gray-600">Your current academic term</p>
                </div>

                {/* Save Button */}
                <div className="pt-2">
                    <Button
                        disabled={loading || !selectedUniversity || !selectedProgram || !selectedTerm}
                        className="w-full md:w-auto bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:opacity-90 font-bold border-0"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    );
}
