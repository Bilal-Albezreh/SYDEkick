import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, GraduationCap } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 via-black to-black opacity-40 z-0"></div>
      
      <div className="z-10 text-center space-y-8 p-6 max-w-2xl">
        {/* Icon */}
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-white/20 rotate-3">
          <GraduationCap className="w-8 h-8 text-black" />
        </div>

        {/* Text */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter">
            Syde<span className="text-gray-500">Kick.</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl font-light">
            The all-in-one operating system for your academic term. <br/>
            Track grades, visualize deadlines, and compete.
          </p>
        </div>

        {/* Buttons - FIXED STYLING & LINKS */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
          
          {/* 1. Login Button: Solid White, Black Text */}
          <Link href="/login" className="w-full sm:w-auto">
            <Button className="w-full h-12 px-8 text-base font-bold rounded-full bg-white text-black hover:bg-gray-200 transition-transform hover:scale-105">
              Login
            </Button>
          </Link>

          {/* 2. Create Account: White Outline, Hover fills White */}
          <Link href="/login?view=signup" className="w-full sm:w-auto">
             <Button 
                variant="outline" 
                className="w-full h-12 px-8 text-base font-medium rounded-full border-2 border-white text-white bg-transparent hover:bg-white hover:text-black transition-all"
             >
               Create Account <ArrowRight className="w-4 h-4 ml-2" />
             </Button>
          </Link>

        </div>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-8 text-xs text-gray-700 font-mono">
        SYSTEMS DESIGN ENGINEERING 2029
      </div>

    </main>
  );
}