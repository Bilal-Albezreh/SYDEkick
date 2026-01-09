"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PendingPage() {
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <CardTitle className="text-xl">Account Pending Approval</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-gray-500">
            Thanks for signing up! This is a private tool for SYDE 2028. 
            An admin (Bilal) needs to approve your account before you can access the dashboard.
          </p>
          
          <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 text-sm text-yellow-800">
            Please message me to let me know you've signed up.
          </div>

          <Button variant="outline" onClick={handleLogout} className="w-full">
            Log Out & Check Later
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}