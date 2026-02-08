import { createClient } from "@/utils/supabase/server";
import ProfileForm from "@/components/ProfileForm";
import AcademicSettingsCard from "@/components/settings/AcademicSettingsCard";
import { Settings } from "lucide-react";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const supabase = await createClient();

  // 1. Fetch User
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Fetch Profile Data
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-white/5 border border-white/10 backdrop-blur-md rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)]">
          <Settings className="w-5 h-5 text-white/80" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 text-sm">Manage your identity and preferences.</p>
        </div>
      </div>

      <ProfileForm
        user={{ email: user.email || "" }}
        profile={profile}
        academicSettings={
          <AcademicSettingsCard
            initialUniversityId={profile?.university_id || null}
            initialProgramId={profile?.program_id || null}
            initialTermLabel={profile?.current_term_label || null}
          />
        }
      />

    </div>
  );
}