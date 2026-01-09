"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Clock, MapPin, ChevronDown } from "lucide-react";

// --- CONFIGURATION ---
// 76px allows a 50-min class (~63px height) to fit 4 lines of text comfortably
const HOUR_HEIGHT = 76; 
const START_HOUR = 8;   // 8:00 AM
const END_HOUR = 18;    // 6:00 PM

// --- TYPES ---
interface ClassEvent {
  id: string;
  code: string;
  name: string;
  type: "LEC" | "TUT" | "LAB" | "SEM";
  day: string;
  start: string;
  end: string;
  location: string;
  color: string;
}

// --- HELPER: TIME FORMATTER ---
const formatTime = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  const hours = h % 12 || 12;
  return m === 0 ? `${hours}` : `${hours}:${m.toString().padStart(2, "0")}`;
};

// --- DATA: FIXED SCHEDULE ---
const fixedClasses: ClassEvent[] = [
  // MONDAY
  { id: "m1", code: "SYDE 283", name: "Physics & Mats", type: "LEC", day: "Mon", start: "12:30", end: "14:20", location: "MC 4020", color: "bg-emerald-500/20 border-emerald-600 text-emerald-100" },
  { id: "m2", code: "SYDE 211", name: "Calc III", type: "LEC", day: "Mon", start: "14:30", end: "15:50", location: "PAS 2083", color: "bg-blue-500/20 border-blue-600 text-blue-100" },

  // TUESDAY
  { id: "t1", code: "SYDE 263", name: "Circuits", type: "LEC", day: "Tue", start: "08:30", end: "09:20", location: "E5 3101", color: "bg-amber-500/20 border-amber-600 text-amber-100" },
  { id: "t2", code: "SYDE 285", name: "Materials", type: "LEC", day: "Tue", start: "09:30", end: "11:20", location: "E5 3101", color: "bg-purple-500/20 border-purple-600 text-purple-100" },
  { id: "t3", code: "SYDE 182", name: "Dynamics", type: "LEC", day: "Tue", start: "12:30", end: "14:20", location: "E7 4417", color: "bg-rose-500/20 border-rose-600 text-rose-100" },
  { id: "t4", code: "SYDE 261", name: "Design", type: "LEC", day: "Tue", start: "14:30", end: "16:20", location: "STC 0040", color: "bg-cyan-500/20 border-cyan-600 text-cyan-100" },

  // WEDNESDAY
  { id: "w1", code: "SYDE 201", name: "Seminar", type: "SEM", day: "Wed", start: "12:30", end: "13:20", location: "E7 4417", color: "bg-zinc-800 border-zinc-600 text-zinc-300" },
  
  // THURSDAY
  { id: "th1", code: "SYDE 211", name: "Calc III", type: "TUT", day: "Thu", start: "08:30", end: "09:20", location: "RCH 211", color: "bg-blue-500/20 border-blue-600 text-blue-100" },
  { id: "th2", code: "SYDE 285", name: "Materials", type: "LEC", day: "Thu", start: "09:30", end: "10:20", location: "E7 1427", color: "bg-purple-500/20 border-purple-600 text-purple-100" },
  { id: "th3", code: "SYDE 285", name: "Materials", type: "TUT", day: "Thu", start: "10:30", end: "11:20", location: "E7 1427", color: "bg-purple-500/20 border-purple-600 text-purple-100" },
  { id: "th4", code: "SYDE 182", name: "Dynamics", type: "LEC", day: "Thu", start: "12:30", end: "13:20", location: "E7 4417", color: "bg-rose-500/20 border-rose-600 text-rose-100" },
  { id: "th5", code: "SYDE 182", name: "Dynamics", type: "TUT", day: "Thu", start: "13:30", end: "14:20", location: "E7 4417", color: "bg-rose-500/20 border-rose-600 text-rose-100" },
  { id: "th6", code: "SYDE 261", name: "Design", type: "LEC", day: "Thu", start: "14:30", end: "15:20", location: "PHY 145", color: "bg-cyan-500/20 border-cyan-600 text-cyan-100" },
  { id: "th7", code: "SYDE 261", name: "Design", type: "TUT", day: "Thu", start: "15:30", end: "16:20", location: "PHY 145", color: "bg-cyan-500/20 border-cyan-600 text-cyan-100" },

  // FRIDAY
  { id: "f1", code: "SYDE 283", name: "Physics & Mats", type: "LEC", day: "Fri", start: "12:30", end: "13:20", location: "E7 4417", color: "bg-emerald-500/20 border-emerald-600 text-emerald-100" },
  { id: "f2", code: "SYDE 283", name: "Physics & Mats", type: "TUT", day: "Fri", start: "13:30", end: "14:20", location: "E7 4417", color: "bg-emerald-500/20 border-emerald-600 text-emerald-100" },
  { id: "f3", code: "SYDE 211", name: "Calc III", type: "LEC", day: "Fri", start: "14:30", end: "15:50", location: "E7 4417", color: "bg-blue-500/20 border-blue-600 text-blue-100" },
];

const labOptions = [
  { label: "Monday Morning (8:30 AM)", day: "Mon", start: "08:30", end: "11:20" },
  { label: "Wednesday Morning (8:30 AM)", day: "Wed", start: "08:30", end: "11:20" },
  { label: "Wednesday Afternoon (2:30 PM)", day: "Wed", start: "14:30", end: "17:20" },
  { label: "Friday Morning (8:30 AM)", day: "Fri", start: "08:30", end: "11:20" },
];

export default function SchedulePage() {
  const [selectedLabIndex, setSelectedLabIndex] = useState(3);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem("syde263_lab_index");
    if (saved) setSelectedLabIndex(parseInt(saved));
  }, []);

  const handleLabChange = (index: number) => {
    setSelectedLabIndex(index);
    localStorage.setItem("syde263_lab_index", index.toString());
  };

  const currentLab = labOptions[selectedLabIndex];
  const fullSchedule = [
    ...fixedClasses,
    {
      id: "lab263",
      code: "SYDE 263",
      name: "Circuits Lab",
      type: "LAB" as const,
      day: currentLab.day,
      start: currentLab.start,
      end: currentLab.end,
      location: "E5 6007",
      color: "bg-amber-500/20 border-amber-500 text-amber-100 border-dashed",
    }
  ];

  const getPosition = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return ((h - START_HOUR) * 60 + m) / 60 * HOUR_HEIGHT;
  };

  const getHeight = (start: string, end: string) => {
    return getPosition(end) - getPosition(start);
  };

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  if (!isClient) return null;

  return (
    <div className="space-y-4 h-[calc(100vh-100px)] flex flex-col">
      
      {/* HEADER ROW */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#191919] p-4 rounded-xl border border-gray-800 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">Weekly Schedule</h1>
        </div>
        
        <div className="relative w-full md:w-64">
          <select 
            value={selectedLabIndex}
            onChange={(e) => handleLabChange(Number(e.target.value))}
            className="w-full bg-[#111] text-gray-200 border border-gray-700 rounded-lg pl-3 pr-8 py-2 text-sm appearance-none outline-none focus:border-blue-500"
          >
            {labOptions.map((opt, i) => (
              <option key={i} value={i}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* SCHEDULE CONTAINER */}
      <div className="bg-[#191919] border border-gray-800 rounded-xl flex-1 p-4 relative overflow-hidden">
          
          {/* HEADER ROW (Days) */}
          <div className="grid grid-cols-[50px_1fr_1fr_1fr_1fr_1fr] mb-2 border-b border-gray-800 pb-2">
            <div className="text-[10px] font-bold text-gray-600 text-center pt-1">EST</div>
            {days.map(d => (
              <div key={d} className="text-center">
                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{d}</span>
              </div>
            ))}
          </div>

          {/* MAIN GRID */}
          <div className="grid grid-cols-[50px_1fr_1fr_1fr_1fr_1fr] relative h-full">
            
            {/* TIME COLUMN */}
            <div className="relative border-r border-gray-800/50">
              {hours.map(h => (
                <div 
                    key={h} 
                    className="absolute w-full text-right pr-3 text-[10px] text-gray-600 font-mono font-medium -mt-1.5" 
                    style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
                >
                  {h > 12 ? h - 12 : h} {h >= 12 ? 'PM' : 'AM'}
                </div>
              ))}
            </div>

            {/* DAY COLUMNS */}
            {days.map((day) => (
              <div key={day} className="relative border-r border-gray-800/30 last:border-0">
                
                {/* HORIZONTAL LINES */}
                {hours.map(h => (
                  <div 
                    key={h} 
                    className="absolute w-full border-t border-gray-800/20" 
                    style={{ top: (h - START_HOUR) * HOUR_HEIGHT, height: HOUR_HEIGHT }} 
                  />
                ))}

                {/* EVENTS */}
                {fullSchedule
                  .filter(ev => ev.day === day)
                  .map(ev => {
                    const top = getPosition(ev.start);
                    const height = getHeight(ev.start, ev.end);
                    
                    return (
                      <div
                        key={ev.id}
                        className={cn(
                          "absolute inset-x-1 rounded-[4px] border-l-[3px] shadow-sm z-10",
                          "flex flex-col px-2 py-1.5 overflow-hidden",
                          ev.color
                        )}
                        style={{ top: top + 1, height: height - 2 }}
                      >
                        {/* Row 1: Code + Badge */}
                        <div className="flex justify-between items-start mb-0.5">
                          <span className="font-bold text-[10px] md:text-xs opacity-90 truncate">{ev.code}</span>
                          <span className="text-[8px] border border-current/30 px-1 rounded-sm opacity-80 font-mono font-bold tracking-tighter">
                            {ev.type}
                          </span>
                        </div>

                        {/* Row 2: Name */}
                        <div className="font-bold text-[10px] md:text-[11px] leading-tight truncate opacity-95 mb-auto">
                            {ev.name}
                        </div>

                        {/* Row 3: Time & Location (Always Visible) */}
                        <div className="flex flex-col gap-0.5 text-[9px] opacity-80 font-medium pt-1 mt-1 border-t border-white/10">
                           <div className="flex items-center gap-1">
                              <span className="truncate">{formatTime(ev.start)} - {formatTime(ev.end)}</span>
                           </div>
                           <div className="flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{ev.location}</span>
                           </div>
                        </div>

                      </div>
                    );
                })}
              </div>
            ))}
          </div>
      </div>
    </div>
  );
}