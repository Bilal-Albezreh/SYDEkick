"use client";

import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Loader2, Mail, Lock, User, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function AuthForm() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const supabase = createClient();
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) throw error;
      // Redirect happens automatically
    } catch (error: any) {
      console.error("Google login error:", error);
      toast.error(error.message || "Failed to login with Google");
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Welcome back!");
    router.refresh();
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          avatar_url: "",
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Account created! Redirecting...");
    router.refresh();
  };

  return (
    <div className="w-full space-y-6">
      {/* GOOGLE HERO BUTTON */}
      <Button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full h-12 bg-white hover:bg-gray-100 text-black font-bold text-base rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] active:scale-[0.98] flex items-center justify-center gap-3"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </>
        )}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#09090b] px-2 text-gray-500 font-medium">Or using email</span>
        </div>
      </div>

      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-black/40 border border-white/10 p-1 rounded-xl backdrop-blur-md">
          <TabsTrigger
            value="login"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:font-bold text-gray-400 rounded-lg transition-all"
          >
            Login
          </TabsTrigger>
          <TabsTrigger
            value="signup"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:font-bold text-gray-400 rounded-lg transition-all"
          >
            Sign Up
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="student@uwaterloo.ca"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-black/40 border-white/10 focus:border-blue-500/50 transition-all h-10 rounded-lg text-white placeholder:text-gray-600"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <Label htmlFor="password" className="text-xs font-bold text-gray-400 uppercase tracking-wider">Password</Label>
                <span className="text-[10px] text-blue-400 hover:text-blue-300 cursor-pointer font-medium">Forgot?</span>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-black/40 border-white/10 focus:border-blue-500/50 transition-all h-10 rounded-lg text-white"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-10 rounded-lg shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Enter System"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullname" className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Full Name</Label>
              <div className="relative group">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
                <Input
                  id="fullname"
                  placeholder="Rizzy Raed"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10 bg-black/40 border-white/10 focus:border-emerald-500/50 transition-all h-10 rounded-lg text-white placeholder:text-gray-600"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-signup" className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
                <Input
                  id="email-signup"
                  type="email"
                  placeholder="student@uwaterloo.ca"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-black/40 border-white/10 focus:border-emerald-500/50 transition-all h-10 rounded-lg text-white placeholder:text-gray-600"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-signup" className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
                <Input
                  id="password-signup"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-black/40 border-white/10 focus:border-emerald-500/50 transition-all h-10 rounded-lg text-white"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10 rounded-lg shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Initialize Account"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      <p className="text-center text-[10px] text-gray-600">
        By continuing, you agree to become an <span className="text-gray-400">Academic Weapon</span>.
      </p>
    </div>
  );
}
