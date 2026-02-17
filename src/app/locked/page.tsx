import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Lock, LogOut } from "lucide-react";

export default async function LockedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Double check status
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_approved")
    .eq("id", user.id)
    .single();

  if (profile?.is_approved) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center p-4 text-center">
      <div className="w-20 h-20 bg-red-900/10 rounded-full flex items-center justify-center mb-6 border border-red-900/30">
        <Lock className="w-10 h-10 text-red-500" />
      </div>

      <h1 className="text-2xl font-bold text-white mb-2">Access Restricted</h1>
      <p className="text-gray-400 max-w-md mb-8 leading-relaxed">
        Your account is currently pending administrator approval For Beta Testing.
        <br />
        We will notify you once approved.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        {/* Refresh Check */}
        <form action={async () => {
          "use server";
          redirect("/locked");
        }}>
          <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-medium transition-colors">
            Check Status
          </button>
        </form>

        {/* Sign Out */}
        <form action={async () => {
          "use server";
          const supabase = await createClient();
          await supabase.auth.signOut();
          redirect("/login");
        }}>
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-transparent border border-gray-800 hover:bg-white/5 text-gray-400 rounded-md transition-colors text-sm">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}