// "use client";

// import { format, addDays, isSameWeek } from "date-fns";
// import { Circle, Check } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { toggleAssessmentCompletion } from "@/app/actions/index";
// import { useRouter } from "next/navigation";
// import { useState } from "react";

// interface CalendarEvent {
//   id: string;
//   title: string;
//   start: Date;
//   resource: {
//     courseCode: string;
//     color: string;
//     type: string;
//     isCompleted: boolean;
//   };
// }

// export default function ScheduleListView({ events }: { events: CalendarEvent[] }) {
//   const router = useRouter();
//   const TERM_START = new Date(2026, 0, 5); 
  
//   // Initialize local state once. We do NOT sync it back to props automatically
//   // to prevent the "flash" reversion bug.
//   const [localEvents, setLocalEvents] = useState(events);

//   const handleToggle = async (id: string, currentStatus: boolean) => {
//     const newStatus = !currentStatus;

//     // 1. INSTANT UI UPDATE (Optimistic)
//     setLocalEvents((prev) => 
//       prev.map((e) => 
//         e.id === id 
//           ? { ...e, resource: { ...e.resource, isCompleted: newStatus } } 
//           : e
//       )
//     );

//     try {
//       // 2. SERVER UPDATE
//       await toggleAssessmentCompletion(id, newStatus);
      
//       // 3. SILENT REFRESH (Don't revert local state)
//       router.refresh();
//     } catch (error) {
//       console.error("Failed to save", error);
//       // Only revert on actual error
//       setLocalEvents((prev) => 
//         prev.map((e) => 
//           e.id === id 
//             ? { ...e, resource: { ...e.resource, isCompleted: currentStatus } } 
//             : e
//         )
//       );
//     }
//   };

//   const weeks = Array.from({ length: 15 }, (_, i) => {
//     const weekNum = i + 1;
//     const weekStart = addDays(TERM_START, i * 7);
//     let label = `Week ${weekNum}`;
//     if (weekNum === 7) label = "Week 7 (Reading Week)";
//     if (weekNum === 15) label = "FINAL EXAM PERIOD";

//     return {
//       num: weekNum,
//       label,
//       start: weekStart,
//       events: localEvents
//         .filter(e => {
//             if (weekNum === 15) return e.start >= weekStart;
//             return isSameWeek(e.start, weekStart, { weekStartsOn: 1 });
//         })
//         .sort((a, b) => a.start.getTime() - b.start.getTime())
//     };
//   });

//   return (
//     <div className="h-[calc(100vh-75px)] overflow-y-auto pr-2 space-y-8 custom-scrollbar pb-20">
//       {weeks.map((week) => (
//         <div key={week.num} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
//           <h3 className="text-xl font-bold text-gray-500 mb-3 sticky top-0 bg-[#191919] py-2 z-10 border-b border-gray-800">
//             {week.label}
//           </h3>

//           <div className="space-y-1">
//             {week.events.length > 0 ? (
//               week.events.map((event) => (
//                 <div 
//                   key={event.id} 
//                   className={cn(
//                     "flex items-center gap-3 py-2 px-3 rounded-lg transition-all group border border-transparent",
//                     event.resource.isCompleted 
//                         ? "bg-[#191919] border-gray-800 opacity-60 hover:opacity-100" 
//                         : "hover:bg-[#252525]"
//                   )}
//                 >
//                   <button
//                     onClick={() => handleToggle(event.id, event.resource.isCompleted)}
//                     className={cn(
//                       "w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0 cursor-pointer",
//                       event.resource.isCompleted 
//                         ? "bg-gray-700 border-gray-700" 
//                         : "border-gray-600 hover:border-white bg-transparent"
//                     )}
//                     style={{ 
//                         borderColor: !event.resource.isCompleted ? event.resource.color : undefined 
//                     }}
//                   >
//                     {event.resource.isCompleted && <Check className="w-3.5 h-3.5 text-white" />}
//                   </button>

//                   <span 
//                     className="font-bold text-sm w-20 shrink-0"
//                     style={{ color: event.resource.isCompleted ? "#6b7280" : event.resource.color }}
//                   >
//                     {event.resource.courseCode}
//                   </span>

//                   <div className="flex-1">
//                     <span className={cn(
//                         "text-sm font-medium transition-colors",
//                         event.resource.isCompleted ? "text-gray-500 line-through" : "text-gray-200"
//                     )}>
//                       {event.title}
//                     </span>
//                     <span className="text-xs text-gray-500 ml-2">
//                         — {format(event.start, "EEE, MMM d")}
//                     </span>
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <div className="text-sm text-gray-700 italic pl-4 py-2">
//                 No scheduled assessments.
//               </div>
//             )}
            
//             {week.num <= 13 && week.num !== 7 && (
//                 <div className="pl-3 opacity-40 hover:opacity-100 transition-opacity">
//                     <div className="text-xs text-gray-500 py-1 flex items-center gap-2">
//                         <Circle className="w-1.5 h-1.5" /> SYDE 261 - Reflections (Fridays)
//                     </div>
//                 </div>
//             )}
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }