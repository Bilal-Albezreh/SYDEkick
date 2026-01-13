import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import Link from "next/link"; // <--- Import Link

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[#020202]">
      
      {/* --- BACKGROUND ANIMATION LAYER --- */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 mix-blend-soft-light"></div>
         <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:50px_50px]"></div>
         <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
         <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] bg-violet-600/20 rounded-full blur-[100px] animate-bounce duration-[10s]"></div>
      </div>

      {/* --- CONTENT LAYER --- */}
      <div className="relative z-10 w-full max-w-[400px]">
        {/* Glass Card */}
        <div className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl ring-1 ring-white/5">
            
            {/* Header */}
            <div className="text-center mb-10">
                <div className="flex items-center justify-center mb-2 tracking-tighter">
                    <span className="text-4xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                        SYDE
                    </span>
                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500 animate-in fade-in slide-in-from-right-4 duration-1000 ease-out fill-mode-forwards">
                        KICK
                    </span>
                </div>
                <p className="text-gray-400 text-sm font-medium tracking-wide">
                    Academic Performance System
                </p>
            </div>
            
            <AuthForm />
        </div>

        {/* Footer with Functional Links */}
        <div className="mt-8 text-center space-y-3">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                Protected by SYDE Security
            </p>
            <div className="flex justify-center gap-6 text-xs text-gray-500">
                <Link href="/legal/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                </Link>
                <Link href="/legal/terms" className="hover:text-white transition-colors">
                    Terms of Service
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
}