import Link from "next/link";
import { ArrowLeft, ShieldCheck, Scale } from "lucide-react";

export function generateStaticParams() {
  return [{ slug: 'privacy' }, { slug: 'terms' }]
}

export default function LegalPage({ params }: { params: { slug: string } }) {
  const isPrivacy = params.slug === "privacy";
  
  const title = isPrivacy ? "Privacy Policy" : "Terms of Service";
  const icon = isPrivacy ? <ShieldCheck className="w-12 h-12 text-emerald-500 mb-4" /> : <Scale className="w-12 h-12 text-blue-500 mb-4" />;
  
  const content = isPrivacy ? (
    <>
      <p><strong>1. Data Collection:</strong> SYDEKick collects academic data (course codes, grades, deadlines) solely for the purpose of performance tracking. Your data is stored securely via Supabase.</p>
      <p><strong>2. Privacy:</strong> We do not sell your data. Your academic performance is visible only to you and authorized administrators (if applicable).</p>
      <p><strong>3. Deletion:</strong> You may request full account deletion at any time via the Settings panel.</p>
    </>
  ) : (
    <>
      <p><strong>1. Usage:</strong> By using SYDEKick, you agree to use the platform for academic integrity and personal organization.</p>
      <p><strong>2. Liability:</strong> SYDEKick is a student-built tool. We are not responsible for any data leaked.</p>
      <p><strong>3. Updates:</strong> These terms may change as the project evolves for the SYDE 2026 cohort, plus you are such a clown if you actually read the terms of service.</p>
    </>
  );

  return (
    <div className="min-h-screen bg-[#020202] text-gray-300 font-sans selection:bg-blue-500/30">
      <div className="max-w-3xl mx-auto px-6 py-20">
        
        {/* Back Button */}
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-12 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Login
        </Link>

        {/* Content Card */}
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-10 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-10">
            {icon}
            <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
            <p className="text-sm text-gray-500 uppercase tracking-widest">Last Updated: January 2026</p>
          </div>

          <div className="prose prose-invert prose-p:text-gray-400 prose-strong:text-white max-w-none space-y-6">
            {content}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-600 text-sm">
          &copy; 2026 SYDEKick. Built for Systems Design Engineering.
        </div>
      </div>
    </div>
  );
}