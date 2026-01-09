"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GraduationCap, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = searchParams.get("view") === "signup" ? "signup" : "login";

  const [view, setView] = useState<"login" | "signup">(initialView);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(""); // Only for signup
  const [loading, setLoading] = useState(false);

  // Sync view if URL changes
  useEffect(() => {
    setView(searchParams.get("view") === "signup" ? "signup" : "login");
  }, [searchParams]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    try {
      if (view === "signup") {
        // --- SIGN UP LOGIC ---
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }, // Store name in metadata
          },
        });
        if (error) throw error;
        toast.success("Account created! You can now log in.");
        setView("login");
      } else {
        // --- LOGIN LOGIC ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        toast.success("Welcome back");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      
      {/* Back Button */}
      <Link href="/" className="absolute top-8 left-8 text-gray-400 hover:text-white flex items-center gap-2 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="w-full max-w-md space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
           <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="w-6 h-6 text-black" />
           </div>
           <h1 className="text-3xl font-bold text-white tracking-tight">
             {view === "login" ? "Welcome back" : "Create an account"}
           </h1>
           <p className="text-gray-400 text-sm">
             {view === "login" 
               ? "Enter your credentials to access your dashboard" 
               : "Start tracking your academic journey today"}
           </p>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* Full Name (Signup Only) */}
          {view === "signup" && (
             <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
               <label className="text-xs font-medium text-gray-500 uppercase">Full Name</label>
               <Input 
                 required
                 placeholder="Rizzy Raed"
                 value={fullName}
                 onChange={(e) => setFullName(e.target.value)}
                 className="bg-[#191919] border-gray-800 text-white placeholder:text-gray-600 focus:border-white h-12"
               />
             </div>
          )}

          {/* Email */}
          <div className="space-y-1">
             <label className="text-xs font-medium text-gray-500 uppercase">Email</label>
             <Input 
               required
               type="email"
               placeholder="alatif@uwaterloo.ca"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               className="bg-[#191919] border-gray-800 text-white placeholder:text-gray-600 focus:border-white h-12"
             />
          </div>

          {/* Password */}
          <div className="space-y-1">
             <label className="text-xs font-medium text-gray-500 uppercase">Password</label>
             <Input 
               required
               type="password"
               placeholder="••••••••"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               className="bg-[#191919] border-gray-800 text-white placeholder:text-gray-600 focus:border-white h-12"
             />
          </div>

          <Button 
            disabled={loading}
            className="w-full h-12 bg-white text-black hover:bg-gray-200 font-bold text-base mt-4"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (view === "login" ? "Sign In" : "Create Account")}
          </Button>
        </form>

        {/* Toggle View */}
        <div className="text-center">
          <button
            onClick={() => setView(view === "login" ? "signup" : "login")}
            className="text-sm text-gray-500 hover:text-white underline underline-offset-4 transition-colors"
          >
            {view === "login" ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>

      </div>
    </div>
  );
}