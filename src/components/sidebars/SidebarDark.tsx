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
    PanelLeftClose,
    PanelLeftOpen,
    ListTodo
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";


export default function SidebarDark() {
    const pathname = usePathname();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);

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

    const links = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Grades", href: "/dashboard/grades", icon: BookOpen },
        { name: "Courses", href: "/dashboard/courses", icon: FolderOpen },
        { name: "Schedule", href: "/dashboard/schedule", icon: Clock },
        { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
        { name: "Tasks", href: "/dashboard/tasks", icon: ListTodo },
        { name: "Group", href: "/dashboard/groups", icon: Users },
        { name: "Leaderboard", href: "/dashboard/leaderboard", icon: Trophy },
        { name: "Application Tracker", href: "/dashboard/career", icon: Briefcase },
        { name: "Lock IN", href: "/dashboard/lockedin", icon: Hourglass },
        { name: "Profile", href: "/dashboard/profile", icon: User },
    ];

    if (!open) return null;

    return (
        <>
            {isMobile && (
                <div
                    className="fixed inset-0 bg-black/80 z-40 md:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            <aside className={cn(
                "relative bg-black/60 backdrop-blur-2xl border-r border-white/5 flex flex-col h-screen transition-all duration-300 ease-in-out shadow-[4px_0_24px_rgba(0,0,0,0.4)] z-40",
                isCollapsed ? "w-20" : "w-64",
                isMobile ? "fixed inset-y-0 left-0 z-50" : "relative shrink-0"
            )}>

                {/* Header: Logo + Toggle */}
                <div className={cn(
                    "flex items-center border-b border-white/5 transition-all",
                    isCollapsed ? "flex-col gap-4 p-4" : "flex-row justify-between p-4 xl:p-6"
                )}>
                    <div className="flex items-center">
                        <span className={cn(
                            "font-heading font-bold text-lg text-white whitespace-nowrap transition-all duration-300",
                            isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 block"
                        )}>
                            Syde<span className="text-blue-500">Kick</span>
                        </span>
                    </div>

                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                    >
                        {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
                    </button>

                    {isMobile && !isCollapsed && (
                        <button onClick={() => setOpen(false)} className="absolute right-4 top-4 text-gray-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Navigation Items */}
                <nav className={cn("flex-1 p-4 space-y-1", isCollapsed ? "overflow-visible" : "overflow-y-auto")}>
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <div key={link.href} className="group relative flex items-center">
                                <Link
                                    href={link.href}
                                    onClick={() => isMobile && setOpen(false)}
                                    className={cn(
                                        "font-heading flex items-center overflow-hidden w-full px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                                            : "text-gray-300 hover:text-white hover:bg-white/10",
                                        isCollapsed ? "justify-center" : "justify-start"
                                    )}
                                >
                                    <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-cyan-400" : "text-gray-400")} />
                                    <span className={cn(
                                        "whitespace-nowrap transition-all duration-300 overflow-hidden",
                                        isCollapsed ? "w-0 opacity-0 ml-0" : "w-auto opacity-100 ml-3"
                                    )}>
                                        {link.name}
                                    </span>
                                </Link>

                                {/* Pure Tailwind Tooltip */}
                                {isCollapsed && (
                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-white text-black text-sm font-bold rounded-md shadow-xl opacity-0 invisible translate-x-2 group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 transition-all z-50 whitespace-nowrap before:absolute before:top-1/2 before:-translate-y-1/2 before:-left-1.5 before:border-y-[6px] before:border-y-transparent before:border-r-[6px] before:border-r-white pointer-events-none">
                                        {link.name}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Footer / Logout */}
                <div className="p-4 border-t border-white/5">
                    <div className="group relative flex items-center">
                        <button
                            onClick={handleSignOut}
                            className={cn(
                                "flex items-center overflow-hidden w-full px-3 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-900/10 rounded-lg transition-colors",
                                isCollapsed ? "justify-center" : "justify-start"
                            )}
                        >
                            <LogOut className="w-5 h-5 shrink-0" />
                            <span className={cn(
                                "whitespace-nowrap transition-all duration-300 overflow-hidden",
                                isCollapsed ? "w-0 opacity-0 ml-0" : "w-auto opacity-100 ml-3"
                            )}>
                                Sign Out
                            </span>
                        </button>

                        {isCollapsed && (
                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-white text-black text-sm font-bold rounded-md shadow-xl opacity-0 invisible translate-x-2 group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 transition-all z-50 whitespace-nowrap before:absolute before:top-1/2 before:-translate-y-1/2 before:-left-1.5 before:border-y-[6px] before:border-y-transparent before:border-r-[6px] before:border-r-white pointer-events-none">
                                Sign Out
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}
