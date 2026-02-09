"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MapPin, Plus, X, Trash2 } from "lucide-react";
import type { ScheduleItemWithCourse } from "@/../../database.types";
import { createScheduleItem, deleteScheduleItem } from "@/app/actions/schedule";
import { motion, AnimatePresence } from "framer-motion";

// --- CONFIGURATION ---
const HOUR_HEIGHT = 76;
const START_HOUR = 8;   // 8:00 AM
const DEFAULT_END_HOUR = 16;  // 4:00 PM default

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

interface ScheduleClientProps {
  initialScheduleItems: ScheduleItemWithCourse[];
  courses: any[];
}

// --- HELPER: TIME FORMATTER ---
const formatTime = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  const hours = h % 12 || 12;
  return m === 0 ? `${hours}` : `${hours}:${m.toString().padStart(2, "0")}`;
};

// --- HELPER: Convert course color to Tailwind classes ---
const getCourseColorClasses = (hexColor: string) => {
  // Create a dynamic style with the hex color
  return {
    backgroundColor: `${hexColor}40`,
    borderLeftColor: hexColor,
    boxShadow: `0 10px 15px -3px ${hexColor}20`
  };
};

export default function ScheduleClient({ initialScheduleItems, courses }: ScheduleClientProps) {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItemWithCourse[]>(initialScheduleItems);
  const [isClient, setIsClient] = useState(false);
  const [timePosition, setTimePosition] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [newClass, setNewClass] = useState({
    course_id: "",
    day: "Mon" as "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun",
    start_time: "09:00",
    end_time: "10:00",
    location: "",
    type: "LEC" as "LEC" | "TUT" | "LAB" | "SEM"
  });

  // Calculate dynamic end hour based on latest class
  const calculateEndHour = () => {
    if (scheduleItems.length === 0) {
      return DEFAULT_END_HOUR;
    }

    // Find the latest end time
    let latestHour = DEFAULT_END_HOUR;
    scheduleItems.forEach(item => {
      const [hour, minute] = item.end_time.split(':').map(Number);
      const endHourWithBuffer = minute > 0 ? hour + 1 : hour;
      if (endHourWithBuffer > latestHour) {
        latestHour = endHourWithBuffer;
      }
    });

    // Add 1 hour buffer after the latest class
    return Math.min(latestHour + 1, 22); // Cap at 10 PM
  };

  const END_HOUR = calculateEndHour();

  useEffect(() => {
    setIsClient(true);

    // Current Time Logic
    const updateTime = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      // Only show if within schedule bounds
      if (h >= START_HOUR && h < END_HOUR) {
        setTimePosition(((h - START_HOUR) * 60 + m) / 60 * HOUR_HEIGHT);
      } else {
        setTimePosition(null);
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [END_HOUR]);

  // Convert ScheduleItemWithCourse to ClassEvent format
  const fullSchedule: ClassEvent[] = scheduleItems.map(item => ({
    id: item.id,
    code: item.course?.course_code || "N/A",
    name: item.course?.course_name || "Unknown",
    type: item.type,
    day: item.day,
    start: item.start_time.substring(0, 5), // "HH:MM:SS" -> "HH:MM"
    end: item.end_time.substring(0, 5),
    location: item.location || "",
    color: item.course?.color || "#9ca3af"
  }));

  const getPosition = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return ((h - START_HOUR) * 60 + m) / 60 * HOUR_HEIGHT;
  };

  const getHeight = (start: string, end: string) => {
    return getPosition(end) - getPosition(start);
  };

  const handleCreateClass = async () => {
    if (!newClass.course_id) {
      alert("Please select a course");
      return;
    }

    setIsCreating(true);

    const result = await createScheduleItem(newClass);

    if (result.success && result.data) {
      setScheduleItems(prev => [...prev, result.data!]);
      setIsAddModalOpen(false);
      setNewClass({
        course_id: "",
        day: "Mon",
        start_time: "09:00",
        end_time: "10:00",
        location: "",
        type: "LEC"
      });
    } else {
      alert(result.error || "Failed to create class");
    }

    setIsCreating(false);
  };

  const handleDeleteClass = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm("Delete this class?")) return;

    const result = await deleteScheduleItem(id);

    if (result.success) {
      setScheduleItems(prev => prev.filter(item => item.id !== id));
    } else {
      alert(result.error || "Failed to delete class");
    }
  };

  const getSelectedCourseColor = () => {
    if (!newClass.course_id) return "#9ca3af";
    const course = courses.find(c => c.id === newClass.course_id);
    return course?.color || "#3b82f6";
  };

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  if (!isClient) return null;

  return (
    <div className="space-y-4 h-[calc(100vh-100px)] flex flex-col">

      {/* HEADER ROW */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-xl shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">Weekly Schedule</h1>
          <p className="text-xs text-gray-400 mt-1">
            {scheduleItems.length} {scheduleItems.length === 1 ? "class" : "classes"} scheduled
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Class
        </button>
      </div>

      {/* SCHEDULE CONTAINER */}
      <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl flex-1 p-4 relative overflow-auto shadow-2xl">

        {/* HEADER ROW (Days) */}
        <div className="grid grid-cols-[50px_1fr_1fr_1fr_1fr_1fr] mb-2 border-b border-white/5 pb-2 sticky top-0 bg-black/60 backdrop-blur-2xl z-30">
          <div className="text-[10px] font-bold text-white/40 text-center pt-1">EST</div>
          {days.map(d => (
            <div key={d} className="text-center">
              <span className="text-sm font-bold text-white/60 uppercase tracking-widest">{d}</span>
            </div>
          ))}
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-[50px_1fr_1fr_1fr_1fr_1fr] relative" style={{ minHeight: (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT }}>

          {/* TIME COLUMN */}
          <div className="relative border-r border-white/5">
            {hours.map(h => (
              <div
                key={h}
                className="absolute w-full text-right pr-3 text-[10px] text-white/40 font-mono font-medium -mt-1.5"
                style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
              >
                {h > 12 ? h - 12 : h} {h >= 12 ? 'PM' : 'AM'}
              </div>
            ))}
          </div>

          {/* DAY COLUMNS */}
          {days.map((day) => (
            <div key={day} className="relative border-r border-white/5 last:border-0">

              {/* HORIZONTAL LINES */}
              {hours.map(h => (
                <div
                  key={h}
                  className="absolute w-full border-t border-white/5"
                  style={{ top: (h - START_HOUR) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                />
              ))}

              {/* CURRENT TIME INDICATOR (LASER) */}
              {new Date().getDay() === (days.indexOf(day) + 1) && timePosition !== null && (
                <div
                  className="absolute w-full h-[2px] bg-red-500 shadow-[0_0_10px_red] z-20 pointer-events-none flex items-center"
                  style={{ top: timePosition }}
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shadow-[0_0_10px_red]" />
                </div>
              )}

              {/* EVENTS */}
              {fullSchedule
                .filter(ev => ev.day === day)
                .map(ev => {
                  const top = getPosition(ev.start);
                  const height = getHeight(ev.start, ev.end);
                  const colorStyles = getCourseColorClasses(ev.color);

                  return (
                    <div
                      key={ev.id}
                      className={cn(
                        "group absolute inset-x-1 rounded-[4px] border-l-[3px] shadow-sm z-10",
                        "flex flex-col px-2 py-1.5 overflow-hidden backdrop-blur-sm",
                        "hover:brightness-110 transition-all cursor-pointer"
                      )}
                      style={{ 
                        top: top + 1, 
                        height: height - 2,
                        ...colorStyles
                      }}
                    >
                      {/* Delete button (appears on hover) */}
                      <button
                        onClick={(e) => handleDeleteClass(ev.id, e)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded p-0.5 z-20"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>

                      {/* Row 1: Code + Badge */}
                      <div className="flex justify-between items-start mb-0.5">
                        <span className="font-bold text-[10px] md:text-xs opacity-90 truncate text-white">{ev.code}</span>
                        <span className="text-[8px] border border-current/30 px-1 rounded-sm opacity-80 font-mono font-bold tracking-tighter text-white">
                          {ev.type}
                        </span>
                      </div>

                      {/* Row 2: Name */}
                      <div className="font-bold text-[10px] md:text-[11px] leading-tight truncate opacity-95 mb-auto text-white">
                        {ev.name}
                      </div>

                      {/* Row 3: Time & Location */}
                      <div className="flex flex-col gap-0.5 text-[9px] opacity-90 font-medium pt-1 mt-1 border-t border-white/20 text-gray-200">
                        <div className="flex items-center gap-1">
                          <span className="truncate">{formatTime(ev.start)} - {formatTime(ev.end)}</span>
                        </div>
                        {ev.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{ev.location}</span>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>

      {/* ADD CLASS MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isCreating && setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-md relative overflow-hidden"
            >
              {/* Dynamic Glow Shadow */}
              <div
                className="absolute inset-0 blur-3xl opacity-20 transition-colors duration-700"
                style={{ backgroundColor: getSelectedCourseColor() }}
              />

              <div
                className="relative backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5 transition-colors duration-500"
                style={{
                  background: `linear-gradient(135deg, rgba(9, 9, 11, 0.45) 0%, ${getSelectedCourseColor()}15 100%)`
                }}
              >
                {/* Ambient Background Effects */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                  <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                    }}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_70%,transparent_100%)]" />
                </div>

                {/* Header */}
                <div className="border-b border-white/5 px-6 py-5 flex items-center justify-between bg-white/[0.02] relative z-10">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-500 shadow-inner"
                      style={{
                        backgroundColor: `${getSelectedCourseColor()}20`,
                        color: getSelectedCourseColor()
                      }}
                    >
                      <Plus className="w-5 h-5" strokeWidth={3} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-tight">Add Class</h2>
                      <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">New Schedule Item</p>
                    </div>
                  </div>
                  <button
                    onClick={() => !isCreating && setIsAddModalOpen(false)}
                    disabled={isCreating}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-500 hover:text-white disabled:opacity-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-5 relative z-10">

                  {/* Course Selection */}
                  <div className="group">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-white transition-colors">
                      Course
                    </label>
                    <div className="relative">
                      {newClass.course_id && (
                        <div 
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full transition-colors duration-300 z-10"
                          style={{ backgroundColor: getSelectedCourseColor() }}
                        />
                      )}
                      <select
                        value={newClass.course_id}
                        onChange={(e) => setNewClass({ ...newClass, course_id: e.target.value })}
                        className={cn(
                          "w-full bg-white/5 border rounded-xl py-3.5 text-white focus:border-white/20 focus:bg-white/[0.07] focus:outline-none transition-all font-medium appearance-none cursor-pointer",
                          newClass.course_id ? "pl-8 pr-4 border-white/10" : "px-4 border-white/5"
                        )}
                        style={newClass.course_id ? {
                          borderColor: `${getSelectedCourseColor()}40`
                        } : {}}
                        disabled={isCreating}
                      >
                        <option value="" className="bg-zinc-900 text-gray-500">Select a course...</option>
                        {courses.map((course) => (
                          <option key={course.id} value={course.id} className="bg-zinc-900 text-white">
                            {course.course_code} - {course.course_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Day and Type Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="group">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Day
                      </label>
                      <select
                        value={newClass.day}
                        onChange={(e) => setNewClass({ ...newClass, day: e.target.value as any })}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3.5 text-white focus:border-white/20 focus:bg-white/[0.07] focus:outline-none transition-all font-medium appearance-none cursor-pointer"
                        disabled={isCreating}
                      >
                        <option value="Mon" className="bg-zinc-900 text-white">Monday</option>
                        <option value="Tue" className="bg-zinc-900 text-white">Tuesday</option>
                        <option value="Wed" className="bg-zinc-900 text-white">Wednesday</option>
                        <option value="Thu" className="bg-zinc-900 text-white">Thursday</option>
                        <option value="Fri" className="bg-zinc-900 text-white">Friday</option>
                      </select>
                    </div>

                    <div className="group">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Type
                      </label>
                      <select
                        value={newClass.type}
                        onChange={(e) => setNewClass({ ...newClass, type: e.target.value as any })}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3.5 text-white focus:border-white/20 focus:bg-white/[0.07] focus:outline-none transition-all font-medium appearance-none cursor-pointer"
                        disabled={isCreating}
                      >
                        <option value="LEC" className="bg-zinc-900 text-white">Lecture</option>
                        <option value="TUT" className="bg-zinc-900 text-white">Tutorial</option>
                        <option value="LAB" className="bg-zinc-900 text-white">Lab</option>
                        <option value="SEM" className="bg-zinc-900 text-white">Seminar</option>
                      </select>
                    </div>
                  </div>

                  {/* Time Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="group">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={newClass.start_time}
                        onChange={(e) => setNewClass({ ...newClass, start_time: e.target.value })}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3.5 text-white focus:border-white/20 focus:bg-white/[0.07] focus:outline-none transition-all font-medium"
                        disabled={isCreating}
                      />
                    </div>

                    <div className="group">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={newClass.end_time}
                        onChange={(e) => setNewClass({ ...newClass, end_time: e.target.value })}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3.5 text-white focus:border-white/20 focus:bg-white/[0.07] focus:outline-none transition-all font-medium"
                        disabled={isCreating}
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="group">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Location (Optional)
                    </label>
                    <input
                      type="text"
                      value={newClass.location}
                      onChange={(e) => setNewClass({ ...newClass, location: e.target.value })}
                      placeholder="e.g., MC 4020"
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:border-white/20 focus:bg-white/[0.07] focus:outline-none transition-all font-medium"
                      disabled={isCreating}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      onClick={handleCreateClass}
                      disabled={isCreating || !newClass.course_id}
                      className="group relative w-full overflow-hidden rounded-xl py-4 transition-all active:scale-[0.98] shadow-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: `linear-gradient(to bottom, ${getSelectedCourseColor()}cc, ${getSelectedCourseColor()}99)`,
                        borderColor: 'rgba(255,255,255,0.1)',
                        boxShadow: `
                          inset 0 1px 0 0 rgba(255,255,255,0.2), 
                          0 4px 20px -2px ${getSelectedCourseColor()}40,
                          0 0 0 1px rgba(0,0,0,0.2)
                        `
                      }}
                    >
                      <div className="flex items-center justify-center gap-2 text-white font-bold tracking-wide">
                        {isCreating ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Creating...</span>
                          </>
                        ) : (
                          <>
                            <span>Add to Schedule</span>
                            <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </>
                        )}
                      </div>
                    </button>
                  </div>

                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
