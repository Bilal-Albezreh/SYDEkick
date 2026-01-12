import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm"; // We will create this component next

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#111] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#191919] border border-gray-800 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">SYDEKICK</h1>
          <p className="text-gray-500 text-sm">Academic Performance System</p>
        </div>
        
        {/* Client Component for interactivity */}
        <AuthForm />
      </div>
    </div>
  );
}