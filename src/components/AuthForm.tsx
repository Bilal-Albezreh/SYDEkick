"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner"; // We use this for nice error popups

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(""); // Only for Sign Up
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between Login/Signup

  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // --- SIGN UP LOGIC ---
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              avatar_url: "", // We can add this later
            },
          },
        });
        if (error) throw error;
        
        toast.success("Account created! Check your email to confirm.");
      } else {
        // --- SIGN IN LOGIC ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        toast.success("Welcome back!");
        router.push("/grades"); // Redirect to dashboard
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAuth} className="space-y-4">
        
        {/* Full Name (Only show for Sign Up) */}
        {isSignUp && (
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-300">Full Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-[#191919] border-gray-700 text-white placeholder:text-gray-600 focus-visible:ring-gray-500"
              required
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-300">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@uwaterloo.ca"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-[#191919] border-gray-700 text-white placeholder:text-gray-600 focus-visible:ring-gray-500"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-300">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-[#191919] border-gray-700 text-white placeholder:text-gray-600 focus-visible:ring-gray-500"
            required
          />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-white text-black hover:bg-gray-200 font-bold" 
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            isSignUp ? "Sign Up" : "Sign In"
          )}
        </Button>
      </form>

      {/* Toggle between Login and Sign Up */}
      <div className="text-center text-sm text-gray-500 mt-4">
        {isSignUp ? "Already have an account? " : "First time here? "}
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-blue-400 hover:text-blue-300 hover:underline transition-all"
        >
          {isSignUp ? "Log in" : "Create an account"}
        </button>
      </div>
    </div>
  );
}