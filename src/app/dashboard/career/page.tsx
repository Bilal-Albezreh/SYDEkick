import { getCareerStats } from "@/app/actions/career";
import SankeyTracker from "@/components/SankeyTracker";
import CareerControls from "@/components/CareerControls";
import PipelineScoreboard from "@/components/PipelineScoreboard";

export default async function CareerPage() {
  const stats = await getCareerStats();

  return (
    <div className="flex-1 p-2 h-full overflow-hidden flex gap-4">
       
       {/* COLUMN 1: THE VISUAL CANVAS (Flex-1, fills remaining space) */}
       <div className="flex-1 h-full min-h-0 flex flex-col">
          <SankeyTracker stats={stats as any} />
       </div>

       {/* COLUMN 2: THE COCKPIT (Fixed width) */}
       <div className="w-72 h-full min-h-0 shrink-0 flex flex-col gap-3">
          
          {/* Top: Controls */}
          <div className="h-auto shrink-0">
             <CareerControls />
          </div>

          {/* Bottom: Scoreboard (Fills remaining height) */}
          <div className="flex-1 min-h-0">
             <PipelineScoreboard stats={stats} />
          </div>

       </div>
    </div>
  );
}