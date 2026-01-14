"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Calendar as CalendarIcon, Building2, Briefcase } from "lucide-react";
import { addInterview } from "@/app/actions/career";
import { toast } from "sonner";

interface AddInterviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddInterviewDialog({ isOpen, onClose }: AddInterviewDialogProps) {
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    await addInterview(formData);
    
    toast.success("Interview Logged & Pipeline Updated!");
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#141414] border-gray-800 text-gray-200 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-emerald-500">
             <Briefcase className="w-5 h-5" />
             Log Interview
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="company" className="text-gray-400">Company Name</Label>
            <div className="relative">
                <Building2 className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <Input id="company" name="company" placeholder="e.g. Tesla" className="pl-9 bg-black/40 border-gray-700" required />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="role" className="text-gray-400">Role Title</Label>
            <Input id="role" name="role" placeholder="e.g. Firmware Intern" className="bg-black/40 border-gray-700" required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date" className="text-gray-400">Interview Date</Label>
            <div className="relative">
                <CalendarIcon className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <Input id="date" name="date" type="datetime-local" className="pl-9 bg-black/40 border-gray-700" required />
            </div>
          </div>

          <DialogFooter className="mt-4">
             <Button type="button" variant="outline" onClick={onClose} className="border-gray-700 hover:bg-white/5 text-gray-400">Cancel</Button>
             <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Interview"}
             </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}