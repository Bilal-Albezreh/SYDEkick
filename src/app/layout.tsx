import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { createClient } from "@/utils/supabase/server";
import { Lock, LogOut } from "lucide-react";
import { redirect } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SydeKick",
  description: "The SYDE Companion App",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isApproved = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_approved")
      .eq("id", user.id)
      .single();
    isApproved = profile?.is_approved === true;
  }

  // BLOCKED USER
  if (user && !isApproved) {
    return (
      <html lang="en">
        <body className={`${inter.className} bg-[#111] text-gray-200`}>
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
        </body>
      </html>
    );
  }

  // APPROVED USER
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#111] text-gray-200`}>
        {user ? (
            <SidebarProvider>
                <AppSidebar />
                <main className="flex-1 h-screen overflow-y-auto relative w-full">
                    <div className="absolute top-4 left-4 z-50 md:hidden">
                        <SidebarTrigger />
                    </div>
                    <div className="p-4 md:p-8 pt-16 md:pt-8 w-full">
                        {children}
                    </div>
                </main>
            </SidebarProvider>
        ) : (
            children
        )}
        <Toaster position="top-right" theme="dark" />
      </body>
    </html>
  );
}