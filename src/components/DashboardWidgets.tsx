"use client";
import { useState } from "react";
import { Send, MessageSquare } from "lucide-react";
import { postMessage } from "@/app/actions";
import { CheckCircle2, Clock, CalendarDays, Trophy, Quote, Ghost, Target, ArrowUp, ArrowDown, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
// MERGED IMPORT LINE BELOW:
import { format, differenceInDays, differenceInCalendarDays, startOfDay } from "date-fns";
import { Progress } from "@/components/ui/progress";

// --- WIDGET 1: DAILY QUOTE ---
export function QuoteWidget() {
  // Placeholder quotes - we can make this dynamic later
  const quotes = [
    "The only way to do great work is to love what you do.",
    "Systems thinking is a discipline for seeing wholes.",
    "Engineering is the closest thing to magic that exists in the world.",
  ];
  const randomQuote = quotes[0]; // Fixed for now

  return (
    <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-xl p-6 relative overflow-hidden">
      <Quote className="absolute top-4 left-4 w-8 h-8 text-indigo-400/20" />
      <div className="relative z-10">
        <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-2">Daily Insight</h3>
        <p className="text-xl font-serif italic text-white leading-relaxed">"{randomQuote}"</p>
      </div>
    </div>
  );
}

// --- WIDGET 2: DYNAMIC MILESTONE TRACKER ---
export function CountdownWidget() {
  const today = startOfDay(new Date());

  // Define your academic timeline here
  const milestones = [
    { name: "Reading Week", date: new Date(2026, 1, 14) }, // Feb 14, 2026 (Month is 0-indexed: Jan=0, Feb=1)
    { name: "Classes End",  date: new Date(2026, 3, 6) },  // Apr 6, 2026
    { name: "Exams End",    date: new Date(2026, 3, 23) }  // Apr 23, 2026
  ];

  // Logic: Find the first milestone that hasn't passed yet
  const nextEvent = milestones.find(m => m.date >= today) || milestones[milestones.length - 1];
  
  // Calculate days
  const daysLeft = differenceInCalendarDays(nextEvent.date, today);

  return (
    <div className="bg-[#191919] border border-gray-800 rounded-xl p-6 flex flex-col justify-between h-full relative overflow-hidden group">
      
      {/* Background Progress Bar (Subtle visual flair) */}
      <div 
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-1000"
        style={{ width: `${Math.max(0, 100 - (daysLeft * 2))}%` }} // Bar grows as deadline gets closer
      />

      <div className="flex items-center gap-2 text-gray-500 mb-2 relative z-10">
        <Clock className="w-4 h-4 text-blue-500" />
        <span className="text-xs font-bold uppercase tracking-widest">Next Milestone</span>
      </div>
      
      <div className="relative z-10">
        <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">{daysLeft}</span>
            <span className="text-gray-500 text-sm font-medium">days until</span>
        </div>
        <div className="text-lg font-bold text-blue-400 mt-1">
            {nextEvent.name}
        </div>
        <div className="text-xs text-gray-600 font-mono mt-1">
            {format(nextEvent.date, "MMMM do, yyyy")}
        </div>
      </div>

    </div>
  );
}
// --- WIDGET 3: UPCOMING DEADLINES ---
export function UpcomingWidget({ data }: { data: any[] }) {
  return (
    <div className="bg-[#191919] border border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-2 text-gray-500 mb-4">
        <CalendarDays className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-widest">Next 7 Days</span>
      </div>
      
      <div className="space-y-3">
        {data && data.length > 0 ? (
          data.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors">
              <div 
                className="w-1 h-8 rounded-full shrink-0" 
                style={{ backgroundColor: item.courses?.color || "#555" }} 
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-gray-200 truncate">{item.name}</div>
                <div className="text-xs text-gray-500">{item.courses?.course_code}</div>
              </div>
              <div className="text-xs font-mono text-gray-400 whitespace-nowrap bg-black/30 px-2 py-1 rounded">
                {format(new Date(item.due_date), "MMM d")}
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-600 italic py-4">No imminent deadlines.</div>
        )}
      </div>
    </div>
  );
}

// --- WIDGET 4: COURSE PROGRESS ---
export function ProgressWidget({ data }: { data: any[] }) {
  return (
    <div className="bg-[#191919] border border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-2 text-gray-500 mb-4">
        <CheckCircle2 className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-widest">Completion Status</span>
      </div>
      
      <div className="space-y-4">
        {data.map((course) => (
          <div key={course.name}>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-bold text-gray-300">{course.name}</span>
              <span className="text-gray-500">{course.percentage}%</span>
            </div>
            {/* Custom Progress Bar Color */}
            <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
               <div 
                 className="h-full rounded-full transition-all duration-1000"
                 style={{ 
                    width: `${course.percentage}%`, 
                    backgroundColor: course.color 
                 }}
               />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- WIDGET 5: LEADERBOARD CARD ---
// 1. Import the missing icons if they aren't there
// 2. Define the Props interface to include topRank
interface RankWidgetProps {
  myRank: any;
  topRank: any[]; // <--- This fixes the "Property topRank does not exist" error
}

export function RankWidget({ myRank, topRank }: RankWidgetProps) {
  
  // CASE: OPTED OUT
  if (!myRank) {
    return (
        <div className="bg-[#191919] border border-gray-800 rounded-xl p-6 flex flex-col justify-between relative overflow-hidden h-full">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Ghost className="w-24 h-24 text-gray-500" />
          </div>
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Trophy className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Rank</span>
          </div>
          <div className="relative z-10">
             <div className="text-2xl font-black text-gray-500">Ghost Mode</div>
             <div className="mt-2 text-xs text-gray-600">
               Enable Leaderboard in Profile to see your stats.
             </div>
          </div>
        </div>
    );
  }

  // CASE: RANKED
  const { rank, trend, current_average, totalStudents, gap, gapMessage } = myRank;

  return (
    <div className="bg-[#191919] border border-gray-800 rounded-xl p-6 flex flex-col justify-between relative overflow-hidden h-full group">
      
      {/* Background Icon Effect */}
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Trophy className="w-24 h-24 text-yellow-500" />
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between text-gray-500 mb-2 relative z-10">
        <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Current Standing</span>
        </div>
        
        {/* Trend Indicator */}
        {trend !== 0 && (
            <div className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded ${
                trend > 0 ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"
            }`}>
                {trend > 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                {Math.abs(trend)}
            </div>
        )}
      </div>

      {/* Main Stats */}
      <div className="relative z-10">
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-black text-white">#{rank}</span>
            <span className="text-sm text-gray-500 font-medium">/ {totalStudents}</span>
          </div>
          
          <div className="mt-1 text-sm text-gray-400 flex items-center gap-2">
            <span className={cn("font-bold", current_average >= 80 ? "text-green-400" : "text-white")}>
                {current_average.toFixed(1)}%
            </span> 
            <span className="opacity-60">Average</span>
          </div>
      </div>

      {/* NEW SECTION: Top 3 Miniature Leaderboard */}
      <div className="relative z-10 mt-6 space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="w-3 h-3 text-yellow-500" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Podium</span>
        </div>
        {topRank.slice(0, 3).map((student, idx) => (
          <div key={student.user_id} className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center font-bold",
                idx === 0 ? "bg-yellow-500/20 text-yellow-500" : "bg-gray-800 text-gray-400"
              )}>
                {idx + 1}
              </span>
              <span className={cn(
                "truncate max-w-[80px]",
                student.user_id === myRank.user_id ? "text-blue-400 font-bold" : "text-gray-400"
              )}>
                {student.is_anonymous && student.user_id !== myRank.user_id ? "Anonymous" : student.full_name.split(' ')[0]}
              </span>
            </div>
            <span className="text-gray-500 font-mono">{student.current_average.toFixed(1)}%</span>
          </div>
        ))}
      </div>

      {/* Footer: The "Chaser" Logic */}
      <div className="relative z-10 mt-4 pt-3 border-t border-gray-800">
         {rank === 1 ? (
             <div className="text-xs text-yellow-500 flex items-center gap-2 font-medium">
                 <Trophy className="w-3 h-3" />
                 {gap > 0 ? `+${gap.toFixed(2)}% lead over #2` : "Tied for 1st Place"}
             </div>
         ) : gap > 0 ? (
             <div className="text-xs text-blue-400 flex items-center gap-2">
                 <Target className="w-3 h-3" />
                 <span>
                    <span className="font-bold">+{gap.toFixed(2)}%</span> needed {gapMessage}
                 </span>
             </div>
         ) : (
             <div className="text-xs text-gray-600 italic">
                 Calculating next rank...
             </div>
         )}
      </div>

    </div>
  );
}
// --- WIDGET 6: ENGINEERING CHAT (RESTORED VIBE) ---
export function ChatWidget({ initialMessages }: { initialMessages: any[] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const currentInput = input;
    setInput(""); // Clear immediately for that "snappy" feel
    setIsSending(true);

    try {
      await postMessage(currentInput);
    } catch (err) {
      console.error("Failed to send:", err);
      setInput(currentInput); // Put it back if it failed
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-[#191919] border border-gray-800 rounded-xl flex flex-col h-[420px] overflow-hidden shadow-2xl">
      {/* Header with Live Indicator */}
      <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between bg-[#1d1d1d]/50">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-300">
            Social Terminal
          </span>
        </div>
        
        <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-tight">Live</span>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide flex flex-col-reverse">
        {/* We use flex-col-reverse so the latest messages are always at the bottom */}
        <div className="space-y-6">
          {messages.length > 0 ? (
            messages.map((msg) => (
              <div key={msg.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-black text-blue-400 uppercase tracking-wider">
                    {msg.profiles?.is_anonymous ? "Anonymous" : msg.profiles?.full_name?.split(' ')[0]}
                  </span>
                  <span className="text-[9px] text-gray-600 font-mono">
                    {format(new Date(msg.created_at), "HH:mm:ss")}
                  </span>
                </div>
                <div className="text-[13px] text-gray-300 leading-relaxed bg-white/[0.03] border border-white/[0.05] p-3 rounded-xl rounded-tl-none shadow-sm">
                  {msg.content}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10">
               <p className="text-xs text-gray-600 font-mono italic">// No packets received. System idle.</p>
            </div>
          )}
        </div>
      </div>

      {/* Input Field */}
      <div className="p-4 bg-[#1d1d1d]/80 border-t border-gray-800">
        <form onSubmit={handleSend} className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Broadcast a message..."
            className="w-full bg-black/50 border border-gray-700 rounded-xl py-3 px-5 pr-14 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="absolute right-2 top-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600 transition-all shadow-lg shadow-blue-900/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="mt-3 flex justify-between items-center px-1">
           <span className="text-[9px] text-gray-700 font-bold uppercase tracking-widest">Auto-Delete: 48H</span>
           <span className="text-[9px] text-gray-700 font-mono">SYDE_v2.0.4</span>
        </div>
      </div>
    </div>
  );
}