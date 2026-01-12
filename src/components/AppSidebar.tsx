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
  MessageSquare
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  
  // Safely access Sidebar Context
  const sidebarContext = useSidebar();
  const open = sidebarContext?.open ?? true;
  const setOpen = sidebarContext?.setOpen ?? (() => {});
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
    { name: "Comms", href: "/dashboard/chat", icon: MessageSquare },
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
        "bg-[#151515] border-r border-gray-800 flex flex-col w-64 h-screen transition-all duration-300",
        isMobile ? "fixed inset-y-0 left-0 z-50 shadow-2xl" : "relative shrink-0"
      )}>
        
        {/* Header / Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800">
          <span className="font-bold text-xl tracking-tighter text-white">
            Syde<span className="text-blue-500">Kick</span>
          </span>
          {isMobile && (
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => isMobile && setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-blue-600/10 text-blue-500" 
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-blue-500" : "text-gray-500")} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-gray-800">
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