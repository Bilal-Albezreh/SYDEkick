import { createClient } from "@/utils/supabase/server";
import { getDashboardData } from "@/app/actions";
import { 
  QuoteWidget, 
  CountdownWidget, 
  UpcomingWidget, 
  ProgressWidget, 
  RankWidget,
  ChatWidget // 1. Imported here
} from "@/components/DashboardWidgets";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return <div className="text-white p-10">Please login.</div>;

  const data = await getDashboardData();
  
  if (!data) return <div>Loading...</div>;

  // 2. Destructured 'messages' from data
  const { upcoming, courseProgress, myRank, topRank, messages } = data;

  return (
    <main className="min-h-screen bg-[#111] text-gray-200 p-8">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm">Welcome back, Engineer.</p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* ROW 1: Quote (Span 3) & Countdown (Span 1) */}
        <div className="lg:col-span-3">
           <QuoteWidget />
        </div>
        <div className="lg:col-span-1">
           <CountdownWidget />
        </div>

        {/* ROW 2: Upcoming (Span 2) & Rank (Span 1) & Progress (Span 1) */}
        <div className="lg:col-span-2">
           <UpcomingWidget data={upcoming || []} />
        </div>

        <div className="lg:col-span-1">
           <RankWidget myRank={myRank} topRank={topRank} />
        </div>

        {/* Course Progress spans 2 rows */}
        <div className="lg:col-span-1 lg:row-span-2">
           <ProgressWidget data={courseProgress || []} />
        </div>

        {/* ROW 3: Chat Widget (Span 3) */}
        {/* 3. Used here - this reads the value and removes the error */}
        <div className="lg:col-span-3">
           <ChatWidget initialMessages={messages || []} />
        </div>

      </div>
    </main>
  );
}