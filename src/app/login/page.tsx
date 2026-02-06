import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AuroraBackground from '@/components/landing/AuroraBackground';
import AuthForm from '@/components/AuthForm';
import Link from 'next/link';

export default async function LoginPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        // Redirect to root - let the root page decide where they go
        redirect("/");
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative p-4">
            {/* Aurora Background */}
            <AuroraBackground />

            {/* Login Container - Ice Glass Box */}
            <div className="relative z-10 w-full max-w-md">
                <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-2">
                            <span className="text-white">Syde</span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">Kick</span>
                        </h1>
                        <p className="text-zinc-400 text-sm">
                            Academic Performance System
                        </p>
                    </div>

                    {/* Auth Form Component */}
                    <AuthForm />

                    {/* Footer Link */}
                    <div className="mt-6 text-center">
                        <Link
                            href="/"
                            className="text-sm text-zinc-400 hover:text-white transition-colors"
                        >
                            ← Back to home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}