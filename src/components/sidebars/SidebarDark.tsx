"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import {
    LayoutDashboard,
    Calendar,
    BookOpen,
    Trophy,
    User,
    Users,
    LogOut,
    X,
    Clock,
    Briefcase,
    Hourglass,
    FolderOpen
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";


export default function SidebarDark() {
    const pathname = usePathname();
    const router = useRouter();

    // Safely access Sidebar Context
    const sidebarContext = useSidebar();
    const open = sidebarContext?.open ?? true;
    const setOpen = sidebarContext?.setOpen ?? (() => { });
    const isMobile = sidebarContext?.isMobile ?? false;

    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        toast.success("Signed out successfully");
        router.push("/login");
    };

    // --- NAVIGATION LINKS ---
    const links = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard }, // Overview (Widgets)
        { name: "Grades", href: "/dashboard/grades", icon: BookOpen },    // Calculator
        { name: "Courses", href: "/dashboard/courses", icon: FolderOpen }, // Management
        { name: "Schedule", href: "/dashboard/schedule", icon: Clock },// Calendar
        { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
        { name: "Group", href: "/dashboard/groups", icon: Users },
        { name: "Leaderboard", href: "/dashboard/leaderboard", icon: Trophy },
        { name: "Application Tracker", href: "/dashboard/career", icon: Briefcase },
        { name: "Lock IN", href: "/dashboard/lockedin", icon: Hourglass },
        { name: "Profile", href: "/dashboard/profile", icon: User },
    ];

    if (!open) return null;

    return (
        <>
            {/* Mobile Overlay */}
            {isMobile && (
                <div
                    className="fixed inset-0 bg-black/80 z-40 md:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside className={cn(
                "bg-black/60 backdrop-blur-2xl border-r border-white/5 flex flex-col w-64 h-screen transition-all duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.4)]",
                isMobile ? "fixed inset-y-0 left-0 z-50" : "relative shrink-0"
            )}>

                {/* Header / Logo */}
                <div className="h-16 flex items-center justify-center relative px-6 border-b border-white/5">
                    <span className="font-heading font-bold text-2xl tracking-tighter text-white">
                        Syde<span className="text-blue-500">Kick</span>
                    </span>
                    {isMobile && (
                        <button onClick={() => setOpen(false)} className="absolute right-4 text-gray-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => isMobile && setOpen(false)}
                                className={cn(
                                    "font-heading flex items-center gap-3 px-3 py-3 mx-3 rounded-xl text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                                        : "text-gray-300 hover:text-white hover:bg-white/10"
                                )}
                            >
                                <Icon className={cn("w-5 h-5", isActive ? "text-cyan-400" : "text-gray-400 group-hover:text-white")} />
                                {link.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer / Logout */}
                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-900/10 rounded-lg transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}
