"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User, Calendar, GraduationCap, LogOut, LogIn } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. Listen for Auth Changes (Login/Logout)
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    checkUser();

    // Real-time listener: updates UI immediately when you log out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session && pathname !== "/") {
        router.push("/"); // Auto-redirect to home if session dies
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router, pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/"); 
  };

  const isActive = (path: string) => pathname === path;

  // Don't show anything until we know the status to prevent flashing
  if (loading) return <nav className="h-[60px] border-b border-gray-800 bg-[#191919]" />;

  return (
    <nav className="border-b border-gray-800 bg-[#191919] text-white px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      
      {/* 1. Logo */}
      <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
          <span className="text-white">S</span>
        </div>
        <span>SYDE<span className="text-gray-500">28</span></span>
      </Link>

      {/* 2. Center Navigation (HIDDEN if not logged in) */}
      {user ? (
        <div className="flex items-center gap-1 bg-[#252525] p-1 rounded-full border border-gray-800 animate-in fade-in zoom-in duration-300">
          <Link href="/grades">
            <div className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${isActive('/grades') ? 'bg-[#3f3f3f] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}>
              <GraduationCap className="w-4 h-4" />
              Grades
            </div>
          </Link>
          <Link href="/calendar">
            <div className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${isActive('/calendar') ? 'bg-[#3f3f3f] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}>
              <Calendar className="w-4 h-4" />
              Calendar
            </div>
          </Link>
        </div>
      ) : (
        // Spacer to keep logo on left even when center is empty
        <div /> 
      )}

      {/* 3. Right Side: User Menu OR Login Button */}
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <Avatar className="w-8 h-8 border border-gray-700 hover:border-gray-500 transition-colors cursor-pointer">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-blue-900 text-blue-200 text-xs">
                {user.email?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-[#191919] border-gray-800 text-gray-200">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-800" />
            <DropdownMenuItem className="focus:bg-[#252525] focus:text-white cursor-pointer">
              <User className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:text-red-300 focus:bg-red-900/20 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex items-center gap-4">
          <Link href="/">
             <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-transparent">
                About
             </Button>
          </Link>
          <Link href="/">
            <Button size="sm" className="bg-white text-black hover:bg-gray-200 font-semibold">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
            </Button>
          </Link>
        </div>
      )}

    </nav>
  );
}