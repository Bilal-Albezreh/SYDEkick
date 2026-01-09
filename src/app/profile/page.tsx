import { createClient } from "@/utils/supabase/server";
import ProfileForm from "@/components/ProfileForm";
import { Settings } from "lucide-react";

export default async function ProfilePage() {
  const supabase = await createClient();
  
  // 1. Fetch User
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div>Please login.</div>;

  // 2. Fetch Profile Data
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-screen bg-[#111] text-gray-200 p-8">
      
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="h-10 w-10 bg-gray-800 rounded-full flex items-center justify-center">
            <Settings className="w-5 h-5 text-gray-300" />
        </div>
        <div>
            <h1 className="text-3xl font-bold text-white">Settings</h1>
            <p className="text-gray-400 text-sm">Manage your identity and preferences.</p>
        </div>
      </div>

      <ProfileForm user={{ email: user.email || "" }} profile={profile} />

    </main>
  );
}