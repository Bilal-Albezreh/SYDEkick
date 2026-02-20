"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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
    FolderOpen,
    ChevronLeft
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";


export default function SidebarLight() {
    const pathname = usePathname();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);

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
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Grades", href: "/dashboard/grades", icon: BookOpen },
        { name: "Courses", href: "/dashboard/courses", icon: FolderOpen },
        { name: "Schedule", href: "/dashboard/schedule", icon: Clock },
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
                "relative bg-stone-100/60 backdrop-blur-2xl border-r border-stone-200/50 flex flex-col h-screen transition-all duration-300 ease-in-out shadow-[4px_0_24px_rgba(0,0,0,0.05)]",
                isCollapsed ? "w-20" : "w-64",
                isMobile ? "fixed inset-y-0 left-0 z-50" : "relative shrink-0"
            )}>

                {/* Floating Collapse Toggle */}
                {!isMobile && (
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="absolute -right-3 top-10 flex items-center justify-center w-6 h-6 bg-white border border-stone-300 rounded-full hover:bg-stone-100 hover:border-stone-400 transition-all z-50 group shadow-sm"
                    >
                        <ChevronLeft className={cn("w-4 h-4 text-stone-400 group-hover:text-stone-700 transition-transform duration-300", isCollapsed && "rotate-180")} />
                    </button>
                )}

                {/* Header / Logo */}
                <div className="h-16 flex items-center justify-center relative px-6 border-b border-stone-200/50 bg-gradient-to-b from-white/40 to-transparent overflow-hidden">
                    <span className="font-heading font-bold text-2xl tracking-tighter text-stone-800 flex items-center">
                        S
                        <span className={cn("whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden", isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
                            yde<span className="text-blue-600">Kick</span>
                        </span>
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
                                title={link.name}
                                onClick={() => isMobile && setOpen(false)}
                                className={cn(
                                    "font-heading flex items-center overflow-hidden px-3 py-3 mx-3 rounded-xl text-sm font-semibold transition-all duration-200 group",
                                    isActive
                                        ? "bg-white text-blue-700 border border-white/60 shadow-[0_4px_12px_rgba(59,130,246,0.15)]"
                                        : "text-stone-600 hover:bg-stone-200/40 hover:text-stone-900",
                                    isCollapsed && "justify-center mx-1 px-0"
                                )}
                            >
                                <Icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-blue-600" : "text-stone-500 group-hover:text-stone-900")} />
                                <span className={cn("whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden", isCollapsed ? "w-0 opacity-0 ml-0" : "w-auto opacity-100 ml-3")}>
                                    {link.name}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer / Logout */}
                <div className="p-4 border-t border-stone-200/50 bg-gradient-to-t from-white/40 to-transparent">
                    <button
                        onClick={handleSignOut}
                        title="Sign Out"
                        className={cn(
                            "flex items-center overflow-hidden w-full px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors",
                            isCollapsed && "justify-center px-0"
                        )}
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        <span className={cn("whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden", isCollapsed ? "w-0 opacity-0 ml-0" : "w-auto opacity-100 ml-3")}>
                            Sign Out
                        </span>
                    </button>
                </div>
            </aside>
        </>
    );
}
