import SetupWizard from "@/components/onboarding/SetupWizard";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function WizardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Not logged in → go to login
    if (!user) {
        redirect("/login");
    }

    // Already completed onboarding → go to dashboard
    const { data: userTerms } = await supabase
        .from("terms")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

    if (userTerms && userTerms.length > 0) {
        redirect("/dashboard");
    }

    return <SetupWizard />;
}
