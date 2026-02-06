import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  Calendar,
  TrendingUp,
  Folder,
  Columns3,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import WaitlistForm from "@/components/WaitlistForm";
import FeatureStack from "@/components/FeatureStack";
import MorphNav from "@/components/landing/MorphNav";
import AuroraBackground from "@/components/landing/AuroraBackground";
import TrustedBy from "@/components/landing/TrustedBy";
import SetupWizard from "@/components/onboarding/SetupWizard";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is logged in, check if they have an active term
  if (user) {
    const { data: activeTerm } = await supabase
      .from("terms")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_current", true)
      .maybeSingle();

    if (activeTerm) {
      // Has active term - go to dashboard
      redirect("/dashboard");
    } else {
      // No active term - show setup wizard
      return <SetupWizard />;
    }
  }


  return (
    <main className="min-h-screen text-white relative overflow-x-clip">

      {/* Aurora Background */}
      <AuroraBackground />

      {/* Morphing Navbar */}
      <MorphNav />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          {/* Hero Text */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400">
            The Ultimate Sidekick for your University Degree.
          </h1>
          <p className="mt-6 text-xl text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            Grades, Calendar, Co-op, Focus, and Leaderboards. The all-in-one OS engineered for students to dominate their degree.
          </p>

          {/* Waitlist Form */}
          <WaitlistForm />
        </div>
      </section>

      {/* Feature Stack with Perspective and Glow */}
      {/* <FeatureStack showHeader={false} /> */}

      {/* Trusted By - Floating Glass Capsule */}
      <TrustedBy />



      {/* Footer */}
      <footer className="py-16 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs text-zinc-700 font-mono uppercase tracking-widest">
            Systems Design Engineering 2029
          </p>
        </div>
      </footer>

    </main>
  );
}


