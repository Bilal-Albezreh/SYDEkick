"use client";

import { useState } from "react";
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, 
  isSameWeek, addWeeks, startOfDay 
} from "date-fns";
import { ChevronLeft, ChevronRight, LayoutList, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// --- SUB-COMPONENTS ---

// 1. The Month Grid View
function MonthView({ 
  currentDate, 
  assessments, 
  selectedDate, 
  onSelectDate, 
  onNextMonth, 
  onPrevMonth 
}: any) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="flex-1 bg-[#191919] border border-gray-800 rounded-xl p-6 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
          <button onClick={onPrevMonth} className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={onNextMonth} className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 mb-2 border-b border-gray-800 pb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>

      {/* The Grid */}
      <div className="grid grid-cols-7 grid-rows-6 gap-1 flex-1 min-h-0">
        {calendarDays.map((day) => {
          const dayEvents = assessments.filter((a: any) => isSameDay(new Date(a.due_date), day));
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, monthStart);
          
          // DENSITY LOGIC: Show max 2 dots, then a +X badge
          const maxVisible = 3;
          const overflow = dayEvents.length - maxVisible;

          return (
            <div 
              key={day.toString()}
              onClick={() => onSelectDate(day)}
              className={cn(
                "relative rounded-lg p-1.5 border transition-all cursor-pointer flex flex-col gap-1 group",
                isSelected 
                  ? "bg-blue-600/10 border-blue-500/50" 
                  : "bg-transparent border-transparent hover:bg-white/5",
                !isCurrentMonth && "opacity-30 hover:opacity-50"
              )}
            >
              <span className={cn(
                "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full transition-colors",
                isToday(day) 
                  ? "bg-blue-600 text-white font-bold" 
                  : isSelected ? "text-blue-400" : "text-gray-400"
              )}>
                {format(day, "d")}
              </span>

              {/* Event Indicators (Lines) */}
              <div className="flex flex-col gap-1 w-full px-1">
                {dayEvents.slice(0, maxVisible).map((ev: any) => (
                   <div key={ev.id} className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: ev.courses?.color }} />
                      <div className="hidden lg:block text-[9px] text-gray-400 truncate leading-none">
                        {ev.courses?.course_code}
                      </div>
                   </div>
                ))}
                {overflow > 0 && (
                   <div className="text-[9px] text-gray-500 font-medium pl-0.5">
                      +{overflow} more
                   </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 2. The List (Agenda) View
function ListView({ assessments }: any) {
  // Group by week
  const today = startOfDay(new Date());
  const nextWeek = addWeeks(today, 1);
  
  const groups = {
    overdue: assessments.filter((a: any) => new Date(a.due_date) < today && !a.is_completed),
    thisWeek: assessments.filter((a: any) => {
      const d = new Date(a.due_date);
      return d >= today && d < nextWeek;
    }),
    future: assessments.filter((a: any) => new Date(a.due_date) >= nextWeek),
  };

  return (
    <div className="flex-1 bg-[#191919] border border-gray-800 rounded-xl p-6 flex flex-col h-full overflow-hidden">
      <h2 className="text-2xl font-bold text-white mb-6">Agenda</h2>
      
      <div className="flex-1 overflow-y-auto space-y-8 pr-2">
        {/* OVERDUE SECTION */}
        {groups.overdue.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Overdue
            </h3>
            <div className="space-y-2">
              {groups.overdue.map((ev: any) => <AgendaItem key={ev.id} event={ev} />)}
            </div>
          </div>
        )}

        {/* THIS WEEK */}
        <div>
           <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">This Week</h3>
           {groups.thisWeek.length > 0 ? (
             <div className="space-y-2">
               {groups.thisWeek.map((ev: any) => <AgendaItem key={ev.id} event={ev} />)}
             </div>
           ) : (
             <p className="text-sm text-gray-600 italic">No tasks for this week.</p>
           )}
        </div>

        {/* FUTURE */}
        <div>
           <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Upcoming</h3>
           <div className="space-y-2">
             {groups.future.map((ev: any) => <AgendaItem key={ev.id} event={ev} />)}
           </div>
        </div>
      </div>
    </div>
  );
}

function AgendaItem({ event }: any) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-black/20 border border-white/5 hover:border-gray-700 transition-all group">
       <div className="flex flex-col items-center justify-center w-10 h-10 bg-[#111] rounded border border-gray-800">
          <span className="text-[9px] text-red-400 font-bold uppercase">{format(new Date(event.due_date), "MMM")}</span>
          <span className="text-sm font-bold text-white">{format(new Date(event.due_date), "d")}</span>
       </div>
       <div className="flex-1">
          <div className="text-sm font-bold text-gray-200 group-hover:text-blue-400 transition-colors">{event.name}</div>
          <div className="text-xs text-gray-500">{event.courses?.course_code} • {format(new Date(event.due_date), "EEEE")}</div>
       </div>
       {event.weight > 0 && (
         <div className="text-[10px] font-mono text-gray-600 border border-gray-800 px-1.5 py-0.5 rounded">
           {event.weight}%
         </div>
       )}
    </div>
  );
}

// --- MAIN COMPONENT ---

export default function DeadlineCalendar({ assessments }: { assessments: any[] }) {
  const [view, setView] = useState<"month" | "list">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Navigation Logic
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  
  // Filtering for Side Panel (Only used in Month View)
  const selectedDayEvents = assessments.filter(a => isSameDay(new Date(a.due_date), selectedDate));

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-4">
      
      {/* 1. TOOLBAR */}
      <div className="flex justify-end">
         <div className="bg-[#191919] p-1 rounded-lg border border-gray-800 flex items-center gap-1">
            <button 
              onClick={() => setView("month")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                view === "month" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              )}
            >
               <CalendarIcon className="w-3.5 h-3.5" /> Month
            </button>
            <button 
              onClick={() => setView("list")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                view === "list" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              )}
            >
               <LayoutList className="w-3.5 h-3.5" /> Agenda
            </button>
         </div>
      </div>

      {/* 2. MAIN CONTENT */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* LEFT: CALENDAR OR LIST */}
        {view === "month" ? (
          <MonthView 
             currentDate={currentDate} 
             assessments={assessments} 
             selectedDate={selectedDate}
             onSelectDate={setSelectedDate}
             onNextMonth={nextMonth}
             onPrevMonth={prevMonth}
          />
        ) : (
          <ListView assessments={assessments} />
        )}

        {/* RIGHT: DETAILS PANEL (Only show on Desktop + Month View) */}
        {view === "month" && (
          <div className="w-full lg:w-80 bg-[#191919] border border-gray-800 rounded-xl flex flex-col overflow-hidden shrink-0">
            <div className="p-5 border-b border-gray-800 bg-white/[0.02]">
               <h3 className="text-lg font-bold text-white">
                 {format(selectedDate, "EEEE, MMM do")}
               </h3>
               <p className="text-gray-500 text-xs mt-1 font-medium">
                 {selectedDayEvents.length} Tasks Scheduled
               </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
               {selectedDayEvents.length > 0 ? (
                 selectedDayEvents.map((ev: any) => (
                   <div key={ev.id} className="p-3 bg-black/20 border border-white/5 rounded-lg group hover:border-blue-500/30 transition-all cursor-default">
                      <div className="flex items-start gap-3">
                         <div className="w-1 h-8 rounded-full mt-1" style={{ backgroundColor: ev.courses?.color || "#555" }} />
                         <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-gray-200 leading-tight">{ev.name}</div>
                            <div className="text-[10px] text-gray-500 mt-1 flex justify-between">
                               <span>{ev.courses?.course_code}</span>
                               <span>{format(new Date(ev.due_date), "h:mm a")}</span>
                            </div>
                         </div>
                      </div>
                   </div>
                 ))
               ) : (
                 <div className="flex flex-col items-center justify-center h-40 text-gray-600 space-y-2">
                    <CheckCircle2 className="w-8 h-8 opacity-20" />
                    <p className="text-xs">No deadlines due this day.</p>
                 </div>
               )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}