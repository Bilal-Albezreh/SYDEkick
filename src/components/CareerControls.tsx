"use client";

import { useState } from "react";
import { Plus, ArrowRight, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { addApplications, moveApplications, resetStat } from "@/app/actions/career"; // Imported resetStat
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CareerControls() {
   const [loading, setLoading] = useState(false);
   const [addCount, setAddCount] = useState("");
   const [moveCount, setMoveCount] = useState("");
   const [moveTarget, setMoveTarget] = useState("rejected");
   const [resetTarget, setResetTarget] = useState("applications"); // For Reset Tab

   const handleBulkAdd = async (e: React.FormEvent) => {
      e.preventDefault();
      const count = parseInt(addCount);
      if (!count || count <= 0) return;
      setLoading(true);
      await addApplications(count);
      toast.success(`Added ${count} applications`);
      setAddCount("");
      setLoading(false);
   };

   const handleBulkMove = async (e: React.FormEvent) => {
      e.preventDefault();
      const count = parseInt(moveCount);
      if (!count || count <= 0) return;
      setLoading(true);
      await moveApplications(moveTarget, count);
      toast.success(`Updated ${count} applications`);
      setMoveCount("");
      setLoading(false);
   };

   const handleReset = async () => {
      if (!confirm("Are you sure? This will set the count to 0.")) return;
      setLoading(true);
      await resetStat(resetTarget);
      toast.success("Category reset to 0.");
      setLoading(false);
   };

   return (
      <div className="h-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col gap-6 shadow-xl">
         <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
               Command Deck
            </h3>
         </div>

         <Tabs defaultValue="add" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-900/50 mb-4 h-8">
               <TabsTrigger value="add" className="text-xs">Add</TabsTrigger>
               <TabsTrigger value="update" className="text-xs">Update</TabsTrigger>
            </TabsList>

            <TabsContent value="add" className="space-y-4">
               <div className="p-3 bg-blue-900/10 border border-blue-500/20 rounded-xl space-y-3">
                  <form onSubmit={handleBulkAdd} className="space-y-3">
                     <div className="relative">
                        <Input
                           type="number" placeholder="20" value={addCount}
                           onChange={(e) => setAddCount(e.target.value)}
                           className="bg-black/50 border-white/5 text-lg font-mono text-white placeholder:text-gray-600 pr-12"
                           min="1"
                        />
                        <span className="absolute right-3 top-2.5 text-[10px] text-gray-500 font-bold tracking-wider">APPS</span>
                     </div>
                     <Button type="submit" disabled={loading} size="sm" className="w-full bg-blue-600 hover:bg-blue-500 font-bold text-xs h-9">
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add to Pending"}
                     </Button>
                  </form>
               </div>
            </TabsContent>

            <TabsContent value="update" className="space-y-4">
               {/* MOVE SECTION */}
               <div className="p-3 bg-gray-900/30 border border-gray-800 rounded-xl space-y-3">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Update Pipeline</p>
                  <form onSubmit={handleBulkMove} className="space-y-3">
                     <div className="flex flex-col gap-2">
                        <Input
                           type="number" placeholder="Qty" value={moveCount}
                           onChange={(e) => setMoveCount(e.target.value)}
                           className="bg-black/50 border-white/5 text-white text-center font-mono h-9" min="1"
                        />
                        <Select value={moveTarget} onValueChange={setMoveTarget}>
                           <SelectTrigger className="bg-black/50 border-white/5 h-9 text-xs text-white"><SelectValue /></SelectTrigger>
                           <SelectContent>
                              <SelectItem value="rejected">Rejected 💀</SelectItem>
                              <SelectItem value="ghosted">Ghosted 👻</SelectItem>
                              <SelectItem value="interview">Interview 🗣️</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                     <Button type="submit" disabled={loading} size="sm" className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs h-9">
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Move Items"}
                     </Button>
                  </form>
               </div>

               {/* RESET SECTION */}
               <div className="p-3 bg-red-900/5 border border-red-500/10 rounded-xl space-y-3 mt-4">
                  <p className="text-[10px] text-red-500 font-bold uppercase flex items-center gap-1">
                     <Trash2 className="w-3 h-3" /> Reset Zone
                  </p>
                  <div className="flex gap-2">
                     <Select value={resetTarget} onValueChange={setResetTarget}>
                        <SelectTrigger className="bg-black/40 border-red-900/30 h-8 text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="applications">Applications (Pending)</SelectItem>
                           <SelectItem value="rejected">Rejected</SelectItem>
                           <SelectItem value="ghosted">Ghosted</SelectItem>
                           <SelectItem value="interview">Interviews</SelectItem>
                           <SelectItem value="offer">Offers</SelectItem>
                           <SelectItem value="no_offer">No Offers</SelectItem>
                        </SelectContent>
                     </Select>
                     <Button onClick={handleReset} disabled={loading} size="sm" className="bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-500/20 h-8 w-8 p-0 shrink-0">
                        <RotateCcw className="w-3 h-3" />
                     </Button>
                  </div>
               </div>
            </TabsContent>
         </Tabs>
      </div>
   );
}