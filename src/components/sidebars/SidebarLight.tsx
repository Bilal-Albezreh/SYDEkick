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
    LogOut,
    X,
    Clock,
    Briefcase,
    Hourglass
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";


export default function SidebarLight() {
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
        { name: "Schedule", href: "/dashboard/schedule", icon: Clock },// Calendar
        { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
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
                "bg-stone-100/60 backdrop-blur-2xl border-r border-stone-200/50 flex flex-col w-64 h-screen transition-all duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.05)]",
                isMobile ? "fixed inset-y-0 left-0 z-50" : "relative shrink-0"
            )}>

                {/* Header / Logo */}
                <div className="h-16 flex items-center justify-center relative px-6 border-b border-stone-200/50 bg-gradient-to-b from-white/40 to-transparent">
                    <span className="font-bold text-2xl tracking-tighter text-stone-800">
                        Syde<span className="text-blue-600">Kick</span>
                    </span>
                    {isMobile && (
                        <button onClick={() => setOpen(false)} className="absolute right-4 text-stone-400 hover:text-stone-900">
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
                                    "flex items-center gap-3 px-3 py-3 mx-3 rounded-xl text-sm font-semibold transition-all duration-200 group",
                                    isActive
                                        ? "bg-white text-blue-700 border border-white/60 shadow-[0_4px_12px_rgba(59,130,246,0.15)]"
                                        : "text-stone-600 hover:bg-stone-200/40 hover:text-stone-900"
                                )}
                            >
                                <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-blue-600" : "text-stone-500 group-hover:text-stone-900")} />
                                {link.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer / Logout */}
                <div className="p-4 border-t border-stone-200/50 bg-gradient-to-t from-white/40 to-transparent">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}
