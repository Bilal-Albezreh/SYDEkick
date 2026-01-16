import { createClient } from "@/utils/supabase/server";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import { Lock, LogOut } from "lucide-react";
import { redirect } from "next/navigation";
import { seedCourses } from "@/app/actions/seed"; // <--- IMPORT THIS

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. SECURITY: If not logged in, kick to login
  if (!user) {
    redirect("/login");
  }

  // 2. CHECK APPROVAL
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_approved")
    .eq("id", user.id)
    .single();

  const isApproved = profile?.is_approved === true;

  // 3. BLOCKED USER VIEW (Rendered here, inside the dashboard shell)
  if (!isApproved) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center space-y-6">
        <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center border border-red-900">
          <Lock className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-white">Access Pending</h1>
        <p className="text-gray-400">Message Bilal for approval.</p>
        <form action={async () => {
          "use server";
          const supabase = await createClient();
          await supabase.auth.signOut();
          redirect("/login");
        }}>
          <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-white mt-4">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </form>
      </div>
    );
  }

  // 4. AUTO-SEED TRIGGER (The "Magic" Line)
  // This checks if the user has data. If not, it creates it instantly.
  try {
    await seedCourses(false);
  } catch (err) {
    console.error("Auto-seeding failed:", err);
    // We swallow the error so the dashboard still loads even if seeding fails
  }

  // 5. APPROVED USER VIEW (Sidebar + Content)
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative w-full">
          {/* Mobile Trigger */}
          <div className="absolute top-4 left-4 z-50 md:hidden">
            <SidebarTrigger />
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-16 md:pt-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}