"use client";

import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Loader2, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AuthForm() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const supabase = createClient();
  const router = useRouter();

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

  return (
    <div className="w-full">
      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-black/40 border border-white/10 p-1 rounded-xl backdrop-blur-md">
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

        {/* LOGIN TAB */}
        <TabsContent value="login" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold text-gray-300 uppercase tracking-wider ml-1">Email</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="aatif@uwaterloo.ca"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-black/40 border-white/10 focus:border-blue-500/50 focus:bg-black/60 transition-all h-10 rounded-lg text-white placeholder:text-gray-600"
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <Label htmlFor="password" className="text-xs font-bold text-gray-300 uppercase tracking-wider">Password</Label>
                <span className="text-[10px] text-blue-400 hover:text-blue-300 cursor-pointer font-medium">Forgot?</span>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-black/40 border-white/10 focus:border-blue-500/50 focus:bg-black/60 transition-all h-10 rounded-lg text-white"
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

        {/* SIGN UP TAB */}
        <TabsContent value="signup" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullname" className="text-xs font-bold text-gray-300 uppercase tracking-wider ml-1">Full Name</Label>
              <div className="relative group">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
                <Input 
                  id="fullname" 
                  placeholder="Rizzy Raed"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10 bg-black/40 border-white/10 focus:border-emerald-500/50 focus:bg-black/60 transition-all h-10 rounded-lg text-white placeholder:text-gray-600"
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-signup" className="text-xs font-bold text-gray-300 uppercase tracking-wider ml-1">Email</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
                <Input 
                  id="email-signup" 
                  type="email" 
                  placeholder="student@uwaterloo.ca"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-black/40 border-white/10 focus:border-emerald-500/50 focus:bg-black/60 transition-all h-10 rounded-lg text-white placeholder:text-gray-600"
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-signup" className="text-xs font-bold text-gray-300 uppercase tracking-wider ml-1">Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
                <Input 
                  id="password-signup" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-black/40 border-white/10 focus:border-emerald-500/50 focus:bg-black/60 transition-all h-10 rounded-lg text-white"
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
    </div>
  );
}