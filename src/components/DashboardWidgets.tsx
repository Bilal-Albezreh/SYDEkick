"use client";

import { useState, useEffect, useRef } from "react";
import {
  Send, MessageSquare, Loader2, CheckCircle2, Clock, CalendarDays,
  Trophy, Quote, Ghost, Target, ArrowUp, ArrowDown, Crown,
  ChevronLeft, ChevronRight, Pencil
} from "lucide-react";
import { postMessage } from "@/app/actions/index"; // Consolidating imports if possible, or direct import if not exported from index
import { updateItemDate as updateItemDateDirect } from "@/app/actions/focus"; // Making sure we get it
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, differenceInCalendarDays, startOfDay } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// --- WIDGET 1: DAILY QUOTE ---
export function QuoteWidget() {
  const quotes = [
    "If you have 0 on one side and you are trying to prove both sides are equal to each other, the best way to do so is multiply the other side by 0 - Omar Soliman",
    "Lets stop being like Dora",
    "Today is a decent day to get some studying done.",
    "Ooooooooooooooh Chriiiiiiiiiiiiiis - Raed Rahman",
    "Lets lock in to make to Africa in 3b",
    "Cant be failing courses in 2026"
  ];
  // Stable random based on day
  const dayIndex = new Date().getDate() % quotes.length;
  const randomQuote = quotes[dayIndex];

  return (
    <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-xl p-6 relative overflow-hidden h-full flex flex-col justify-center shadow-lg">
      <Quote className="absolute top-4 left-4 w-8 h-8 text-indigo-400/20" />
      <div className="relative z-10">
        <h3 className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-3">Daily Insight</h3>
        <p className="text-lg font-serif italic text-white leading-relaxed">"{randomQuote}"</p>
      </div>
    </div>
  );
}

// --- WIDGET 2: DYNAMIC MILESTONE TRACKER (SCROLLABLE) ---
export function CountdownWidget() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const today = startOfDay(new Date());

  // Define your academic milestones here
  const allMilestones = [
    { name: "Reading Week", date: new Date(2026, 1, 14) }, // Feb 14
    { name: "Classes End", date: new Date(2026, 3, 6) },  // Apr 6
    { name: "Exams Start", date: new Date(2026, 3, 10) }, // Apr 10
    { name: "Exams End", date: new Date(2026, 3, 23) }, // Apr 23
    { name: "Co-op Starts", date: new Date(2026, 4, 4) }   // May 4
  ];

  // Filter to only show future (or today's) events
  const futureMilestones = allMilestones.filter(m => m.date >= today);

  // Safety: If no future events, show the last one just to show something
  const displayMilestones = futureMilestones.length > 0 ? futureMilestones : [allMilestones[allMilestones.length - 1]];

  const event = displayMilestones[currentIndex];
  const daysLeft = differenceInCalendarDays(event.date, today);
  const maxIndex = displayMilestones.length - 1;

  const nextSlide = () => setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  const prevSlide = () => setCurrentIndex(prev => Math.max(prev - 1, 0));

  return (
    <div className="bg-[#191919] border border-gray-800 rounded-xl p-6 flex flex-col justify-between h-full relative overflow-hidden group">

      {/* Navigation Arrows (Show on Hover) */}
      {currentIndex > 0 && (
        <button onClick={prevSlide} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/60 text-white rounded-full z-20 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black">
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
      {currentIndex < maxIndex && (
        <button onClick={nextSlide} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/60 text-white rounded-full z-20 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black">
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Progress Bar Background */}
      <div
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-1000"
        style={{ width: `${Math.max(0, 100 - (daysLeft * 2))}%` }}
      />

      <div className="flex items-center justify-between mb-2 relative z-10">
        <div className="flex items-center gap-2 text-gray-500">
          <Clock className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-bold uppercase tracking-widest">
            {currentIndex === 0 ? "Next Milestone" : "Future Event"}
          </span>
        </div>
        <span className="text-[10px] text-gray-600 font-mono">
          {currentIndex + 1} / {displayMilestones.length}
        </span>
      </div>

      <div className="relative z-10">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-white">{daysLeft}</span>
          <span className="text-gray-500 text-sm font-medium">days until</span>
        </div>
        <div className="text-lg font-bold text-blue-400 mt-1">
          {event.name}
        </div>
        <div className="text-xs text-gray-600 font-mono mt-1">
          {format(event.date, "MMMM do, yyyy")}
        </div>
      </div>
    </div>
  );
}

// --- WIDGET 3: UPCOMING DEADLINES (NEXT 7 DAYS + URGENCY COLORS) ---
export function UpcomingWidget({ data }: { data: any[] }) {
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  // 1. Filter: Future dates ONLY within the next 7 days
  // 2. Sort: Closest date first
  const sorted = [...data]
    .filter(item => {
      // FIX: Treat string date as local YYYY-MM-DD to avoid timezone shifts
      // Extract YYYY-MM-DD and create a "noon" date or just compare strings for safety
      if (!item.due_date) return false;

      const dateStr = item.due_date.split('T')[0]; // "2026-02-15"
      const itemDate = new Date(`${dateStr}T12:00:00`); // Force noon local to avoid boundary issues
      const todayNoon = new Date();
      todayNoon.setHours(12, 0, 0, 0);
      const nextWeekNoon = new Date(todayNoon);
      nextWeekNoon.setDate(todayNoon.getDate() + 7);

      return itemDate >= todayNoon && itemDate <= nextWeekNoon;
    })
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5); // Limit to 5 to fit UI

  // Helper to determine color based on days remaining
  const getUrgencyStyles = (dueDate: string) => {
    // Fix Timezone for difference calc
    const dateStr = dueDate.split('T')[0];
    const itemDate = new Date(`${dateStr}T00:00:00`);
    const todayZero = new Date();
    todayZero.setHours(0, 0, 0, 0);

    const daysLeft = differenceInCalendarDays(itemDate, todayZero);

    if (daysLeft <= 0) return "bg-red-500/20 text-red-400 border-red-500/50 animate-pulse"; // Due Today
    if (daysLeft === 1) return "bg-orange-500/20 text-orange-400 border-orange-500/50"; // Due Tomorrow
    if (daysLeft <= 3) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"; // Upcoming
    return "bg-gray-800 text-gray-400 border-gray-700"; // Safe (4-7 days)
  };

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newDate, setNewDate] = useState("");

  const handleEditClick = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);

    // [FIX] Smart Initialization
    // Interviews: Preserve Time (use timezone offset hack)
    // Assessments/Tasks: Force Noon (prevent Midnight Drift from legacy data)
    if (item.type === 'interview' || item.type === 'oa') {
      const d = new Date(item.due_date);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setNewDate(d.toISOString().slice(0, 16));
    } else {
      const dateStr = item.due_date.split('T')[0];
      setNewDate(`${dateStr}T12:00`);
    }
    setIsEditOpen(true);
  };

  const handleSaveDate = async () => {
    if (!editingItem || !newDate) return;
    try {
      let datePayload = newDate;
      // For Interviews, convert Local Input to UTC ISO to preserve Time
      if (editingItem.type === 'interview' || editingItem.type === 'oa') {
        datePayload = new Date(newDate).toISOString();
      }

      await updateItemDateDirect(editingItem.id, editingItem.type || 'assessment', datePayload);
      setIsEditOpen(false);
      setEditingItem(null);
    } catch (e) {
      console.error("Failed to update date", e);
    }
  };

  return (
    <>
      <div className="bg-[#191919] border border-gray-800 rounded-xl p-6 h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-gray-500">
            <CalendarDays className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Next 7 Days</span>
          </div>
          <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-400 font-mono">
            {sorted.length} Due
          </span>
        </div>

        <div className="space-y-3">
          {sorted && sorted.length > 0 ? (
            sorted.map((item) => {
              const urgencyClass = getUrgencyStyles(item.due_date);

              return (
                <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors group">
                  {/* Color Strip */}
                  <div
                    className="w-1 h-8 rounded-full shrink-0 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: item.courses?.color || "#555" }}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-200 truncate">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.courses?.course_code}</div>
                  </div>

                  {/* Dynamic Date Box */}
                  <div className={cn(
                    "text-xs font-mono whitespace-nowrap px-2.5 py-1 rounded border min-w-[60px] text-center font-bold mr-2",
                    urgencyClass
                  )}>
                    {format(new Date(item.due_date), "MMM d")}
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={(e) => handleEditClick(item, e)}
                    className="p-1.5 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-24 text-gray-600 italic gap-2 opacity-60">
              <CalendarDays className="w-6 h-6 mb-1" />
              <span className="text-xs">Nothing due this week.</span>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-[#111] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Reschedule Event</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-400">
                {editingItem?.name}
              </div>
              <label className="text-xs font-bold text-gray-500 uppercase">New Date & Time</label>
              <Input
                type="datetime-local"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="bg-[#0a0a0a] border-gray-800 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} className="border-gray-800 hover:bg-white/5 text-gray-400">Cancel</Button>
            <Button onClick={handleSaveDate} className="bg-white text-black hover:bg-gray-200 font-bold">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// --- WIDGET 4: COURSE PROGRESS (AUTO-FIT, NO SCROLL) ---
export function ProgressWidget({ data }: { data: any[] }) {
  return (
    <div className="bg-[#191919] border border-gray-800 rounded-xl p-5 h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center gap-2 text-gray-500 mb-2 shrink-0">
        <CheckCircle2 className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-widest">Term Progress</span>
      </div>

      {/* Flex Container with 'justify-between': 
         This forces the courses to spread out and fill the available vertical space 
         without ever creating a scrollbar.
      */}
      <div className="flex-1 flex flex-col justify-between min-h-0 pt-2 pb-1">
        {data.map((course) => (
          <div key={course.id || course.course_code} className="w-full">
            <div className="flex justify-between items-end mb-1">
              <div className="flex flex-col leading-none">
                <span className="font-bold text-gray-200 text-xs mb-0.5">{course.course_code}</span>
                <span className="text-[9px] text-gray-600 font-mono">
                  {course.completedWeight.toFixed(0)}/{course.totalWeight.toFixed(0)}%
                </span>
              </div>
              <span className="text-[10px] font-bold text-white bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                {course.percentage.toFixed(0)}%
              </span>
            </div>

            <div className="h-1.5 w-full bg-gray-800/50 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full rounded-full relative transition-all duration-1000"
                style={{
                  width: `${course.percentage}%`,
                  backgroundColor: course.color || "#3b82f6"
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- WIDGET 5: LEADERBOARD CARD (WITH AVATARS) ---
interface RankWidgetProps {
  myRank: any;
  topRank: any[];
}

export function RankWidget({ myRank, topRank }: RankWidgetProps) {

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
            Participate in Profile to compete.
          </div>
        </div>
      </div>
    );
  }

  const { rank, trend, current_average, totalStudents, gap } = myRank;
  const isFirst = rank === 1;

  return (
    <div className="bg-[#191919] border border-gray-800 rounded-xl p-6 flex flex-col justify-between relative overflow-hidden h-full group">
      {/* Dynamic Background Glow */}
      <div className={cn("absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 blur-3xl rounded-full -mr-10 -mt-10",
        isFirst ? "from-yellow-400 to-orange-500" : "from-blue-500 to-purple-500"
      )} />

      <div className="flex items-center justify-between text-gray-500 mb-2 relative z-10">
        <div className="flex items-center gap-2">
          <Trophy className={cn("w-4 h-4", isFirst ? "text-yellow-400" : "text-yellow-600")} />
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Class Rank</span>
        </div>
        {trend !== 0 && (
          <div className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded ${trend > 0 ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"
            }`}>
            {trend > 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
            {Math.abs(trend)}
          </div>
        )}
      </div>

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

      {/* PODIUM SECTION WITH AVATARS */}
      <div className="relative z-10 mt-5 space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="w-3 h-3 text-yellow-500" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Podium</span>
        </div>
        {topRank.slice(0, 3).map((student, idx) => (
          <div key={student.user_id} className="flex items-center justify-between text-[11px] group/item">
            <div className="flex items-center gap-2 min-w-0">
              <span className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0",
                idx === 0 ? "bg-yellow-500 text-black" : "bg-gray-800 text-gray-400"
              )}>
                {idx + 1}
              </span>

              {/* AVATAR ADDED HERE */}
              <Avatar className="w-5 h-5 border border-gray-700 shrink-0">
                <AvatarImage src={student.avatar_url || ""} className="object-cover aspect-square" />
                <AvatarFallback className="text-[8px] bg-gray-800">{student.full_name?.[0]}</AvatarFallback>
              </Avatar>

              <span className={cn(
                "truncate max-w-[80px]",
                student.user_id === myRank.user_id ? "text-blue-400 font-bold" : "text-gray-400"
              )}>
                {student.is_anonymous && student.user_id !== myRank.user_id ? "Anonymous" : student.full_name?.split(' ')[0]}
              </span>
            </div>
            <span className="text-gray-500 font-mono text-[10px]">{student.current_average.toFixed(1)}%</span>
          </div>
        ))}
      </div>

      <div className="relative z-10 mt-4 pt-3 border-t border-gray-800">
        {isFirst ? (
          <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
            <div className="text-xs text-yellow-400 flex items-center gap-2 font-bold">
              <Crown className="w-3 h-3" />
              You are 1st!
            </div>
            <p className="text-[10px] text-yellow-500/70 mt-0.5">
              {gap > 0 ? `${gap.toFixed(2)}% lead ahead of 2nd place.` : "You are tied for the lead."}
            </p>
          </div>
        ) : gap > 0 ? (
          <div className="text-xs text-blue-400 flex items-center gap-2">
            <Target className="w-3 h-3" />
            <span>
              <span className="font-bold">+{gap.toFixed(2)}%</span> needed for #{rank - 1}
            </span>
          </div>
        ) : (
          <div className="text-xs text-gray-600 italic">
            Calculating gap...
          </div>
        )}
      </div>

    </div>
  );
}

// --- WIDGET 6: CHAT (GLASSY GREEN REDESIGN) ---
export function ChatWidget({
  initialMessages,
  currentUser
}: {
  initialMessages: any[],
  currentUser: { id: string, name: string, avatar: string | null }
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialMessages.length >= messages.length) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const text = input.trim();
    setInput("");
    setIsSending(true);

    const tempId = "temp-" + Date.now();
    const optimisticMsg = {
      id: tempId,
      content: text,
      created_at: new Date().toISOString(),
      user_id: currentUser.id,
      profiles: {
        full_name: currentUser.name,
        is_anonymous: false,
        avatar_url: currentUser.avatar
      }
    };

    setMessages((prev) => [optimisticMsg, ...prev]);

    try {
      await postMessage(text);
    } catch (err) {
      console.error("Failed to send", err);
      setMessages((prev) => prev.filter(m => m.id !== tempId));
      setInput(text);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-[#191919] border border-gray-800 rounded-xl flex flex-col h-full overflow-hidden shadow-2xl">

      {/* HEADER */}
      <div className="px-5 py-3 border-b border-gray-800 bg-[#151515] flex items-center justify-between">
        <h3 className="font-bold text-gray-200 text-xs uppercase tracking-widest flex items-center gap-2">
          <MessageSquare className="w-3 h-3 text-green-500" />
          Live Comms
        </h3>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-900/20 border border-green-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          <span className="text-[9px] font-bold text-green-400 uppercase">Online</span>
        </div>
      </div>

      {/* Retention Notice (Sticky) */}
      <div className="bg-[#1e1e1e] border-b border-gray-800 py-1 flex justify-center shadow-md z-10 shrink-0">
        <span className="text-[9px] font-medium text-gray-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-orange-500/50 rounded-full" />
          Messages deleted after 48h.
        </span>
      </div>

      {/* MESSAGES AREA */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col-reverse bg-[#111] space-y-reverse space-y-6 min-h-0"
      >
        {messages.length > 0 ? (
          messages.map((msg) => {
            const isMe = msg.user_id === currentUser.id;
            const name = msg.profiles?.is_anonymous ? "Anonymous" : (msg.profiles?.full_name || "Unknown");

            return (
              <div key={msg.id} className="group flex gap-4 items-start animate-in fade-in slide-in-from-bottom-2 duration-300 mb-4">
                {/* AVATAR */}
                <Avatar className={cn("w-9 h-9 mt-1 border-2 shrink-0 shadow-lg", isMe ? "border-green-500/30" : "border-gray-700")}>
                  <AvatarImage
                    src={msg.profiles?.avatar_url || ""}
                    className="object-cover aspect-square"
                  />
                  <AvatarFallback className="bg-gray-800 text-[10px] text-gray-400 font-bold">
                    {name[0]}
                  </AvatarFallback>
                </Avatar>

                {/* CONTENT */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={cn(
                      "text-xs font-bold tracking-wide",
                      isMe ? "text-green-400 drop-shadow-sm" : "text-gray-300"
                    )}>
                      {name}
                    </span>
                    <span className="text-[9px] text-gray-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                      {format(new Date(msg.created_at), "h:mm a")}
                    </span>
                  </div>

                  {/* GLASSY MESSAGE BOX */}
                  <div className={cn(
                    "relative text-sm leading-relaxed p-3 rounded-xl shadow-sm backdrop-blur-sm border",
                    isMe
                      ? "bg-green-500/5 border-green-500/10 text-gray-200"
                      : "bg-white/5 border-white/5 text-gray-300"
                  )}>
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-2 opacity-30 pb-10">
            <MessageSquare className="w-8 h-8 mb-2" />
            <p className="text-xs font-mono">CHANNEL_EMPTY</p>
          </div>
        )}
      </div>

      {/* INPUT AREA */}
      <div className="p-3 bg-[#151515] border-t border-gray-800">
        <form onSubmit={handleSend} className="relative flex items-center gap-2">
          <input
            className="w-full bg-[#1a1a1a] text-gray-200 text-sm rounded-lg px-4 py-3 border border-gray-800 focus:border-green-500/40 focus:bg-[#202020] focus:outline-none transition-all placeholder:text-gray-600"
            placeholder="Broadcast message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="p-3 bg-green-600 hover:bg-green-500 text-white rounded-lg disabled:opacity-50 disabled:bg-[#222] transition-colors shadow-lg shadow-green-900/20"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- MAIN LAYOUT COMPONENT ---
export default function DashboardGrid({
  courses,
  messages,
  rankData,
  currentUser
}: {
  courses: any[],
  messages: any[],
  rankData: { myRank: any, topRank: any[] },
  currentUser: { id: string, name: string, avatar: string | null }
}) {

  const upcomingAssessments = courses.flatMap(c =>
    c.assessments.map((a: any) => ({
      ...a,
      courses: {
        course_code: c.course_code,
        color: c.color
      }
    }))
  )
    .filter((a: any) => !a.is_completed && new Date(a.due_date) > new Date());

  const courseProgress = courses.map(c => {
    // 1. Calculate Total Weight of all assessments
    const totalWeight = c.assessments?.reduce((acc: number, curr: any) => acc + (curr.weight || 0), 0) || 0;

    // 2. Calculate Completed Weight
    // FIX: It counts if it's marked completed OR if it has a score
    const completedWeight = c.assessments
      ?.filter((a: any) => a.is_completed || a.score !== null)
      .reduce((acc: number, curr: any) => acc + (curr.weight || 0), 0) || 0;

    // 3. Calc % (Prevent divide by zero)
    const percentage = totalWeight === 0 ? 0 : (completedWeight / totalWeight) * 100;

    return { ...c, percentage, completedWeight, totalWeight };
  });

  return (
    // FIX: Set height to 80vh (80% of viewport height)
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-[80vh] w-full overflow-hidden">

      {/* COL 1: Quote & Countdown */}
      <div className="flex flex-col gap-6 h-full overflow-hidden">
        <div className="h-1/3 min-h-0">
          <QuoteWidget />
        </div>
        <div className="h-2/3 min-h-0">
          <CountdownWidget />
        </div>
      </div>

      {/* COL 2: Rank */}
      <div className="md:col-span-1 h-full min-h-0 overflow-hidden">
        <RankWidget myRank={rankData.myRank} topRank={rankData.topRank} />
      </div>

      {/* COL 3: Upcoming & Progress */}
      <div className="flex flex-col gap-6 h-full overflow-hidden">
        <div className="h-1/2 min-h-0 overflow-hidden">
          <UpcomingWidget data={upcomingAssessments} />
        </div>
        {/* This will now Auto-Fit perfectly */}
        <div className="h-1/2 min-h-0 overflow-hidden">
          <ProgressWidget data={courseProgress} />
        </div>
      </div>

      {/* COL 4: Chat */}
      <div className="md:col-span-1 h-full min-h-0 overflow-hidden">
        <ChatWidget initialMessages={messages} currentUser={currentUser} />
      </div>
    </div>
  );
}