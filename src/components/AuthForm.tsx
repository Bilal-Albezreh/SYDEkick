"use client";

import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Loader2, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AuthForm() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const supabase = createClient();
  const router = useRouter();

  const handleOAuth = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // 1. Sign Up (Creates User in Auth)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          avatar_url: "", // Default empty avatar
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // 2. Success Feedback
    toast.success("Account created! Redirecting...");
    
    // 3. Refresh to let Middleware handle the redirect to /locked
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
    <Tabs defaultValue="login" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6 bg-black/40 border border-gray-800">
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>

      {/* LOGIN TAB */}
      <TabsContent value="login">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="uwaterloo@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-black/20 border-gray-700"
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-black/20 border-gray-700"
              required 
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Log In
          </Button>
        </form>
      </TabsContent>

      {/* SIGN UP TAB */}
      <TabsContent value="signup">
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullname">Full Name</Label>
            <Input 
              id="fullname" 
              placeholder="Rizzy Raed"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-black/20 border-gray-700"
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-signup">Email</Label>
            <Input 
              id="email-signup" 
              type="email" 
              placeholder="aatif@euwaterloo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-black/20 border-gray-700"
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-signup">Password</Label>
            <Input 
              id="password-signup" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-black/20 border-gray-700"
              required 
            />
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </form>
      </TabsContent>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#191919] px-2 text-gray-500">Or continue with</span>
        </div>
      </div>

      <Button variant="outline" type="button" onClick={handleOAuth} disabled={loading} className="w-full border-gray-800 hover:bg-white/5">
        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
        Google
      </Button>
    </Tabs>
  );
}