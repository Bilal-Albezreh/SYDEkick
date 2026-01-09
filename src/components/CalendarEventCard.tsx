"use client";

import { Check } from "lucide-react";
import { useState, useEffect } from "react";
import { toggleAssessmentCompletion } from "@/app/actions/index"; // Ensure correct import
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation"; // Added router

// --- Helper to safely create tinted background from Hex ---
const hexToRgba = (hex: string, alpha: number) => {
  let c = hex.trim();
  if (!c.startsWith("#")) return hex;
  c = c.substring(1);
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  if (c.length !== 6) return hex;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface EventProps {
  event: {
    id: string;
    title: string;
    resource: {
      courseCode: string;
      color: string;
      type: string;
      isCompleted: boolean;
      weight: number;
    };
  };
}

export default function CalendarEventCard({ event }: EventProps) {
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(event.resource.isCompleted);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setIsCompleted(event.resource.isCompleted);
  }, [event.resource.isCompleted]);

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // 1. Optimistic Update
    const newStatus = !isCompleted;
    setIsCompleted(newStatus);
    
    // 2. Server Action
    await toggleAssessmentCompletion(event.id, newStatus);

    // 3. Force Refresh (Fixes "Hide Done" lag)
    router.refresh();
  };

  const mainColor = event.resource.color || "#6b7280";
  const backgroundColor = hexToRgba(mainColor, 0.2); 

  return (
    <div 
      className={cn(
        "w-full mb-1 rounded-[4px] border-l-[3px] shadow-sm transition-all relative group overflow-hidden",
        isCompleted 
            ? "opacity-50 grayscale hover:opacity-100 hover:grayscale-0" 
            : "hover:brightness-110"
      )}
      style={{ 
        backgroundColor: backgroundColor, 
        borderLeftColor: isCompleted ? "#555" : mainColor, 
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col py-1.5 px-2">
        
        {/* ROW 1: Header */}
        <div className="flex justify-between items-center h-5 mb-1">
          <span 
            className="text-[10px] font-bold uppercase tracking-tighter" 
            style={{ color: isCompleted ? "#888" : mainColor }}
          >
            {event.resource.courseCode}
          </span>
          
          <button
            onClick={handleComplete}
            className={cn(
              "h-6 w-6 rounded-md border-2 flex items-center justify-center absolute top-1 right-1 z-20 shadow-md transition-all duration-200",
              isCompleted 
                ? "bg-gray-700 border-gray-600 opacity-100 scale-100" 
                : isHovered 
                  ? "bg-white opacity-100 scale-100 hover:bg-green-50" 
                  : "opacity-0 scale-90 pointer-events-none"
            )}
            style={{ borderColor: isCompleted ? undefined : mainColor }}
          >
             <Check className={cn(
                 "h-4 w-4 stroke-[3px]",
                 isCompleted ? "text-gray-400" : "text-green-600"
             )} />
          </button>
        </div>

        {/* ROW 2: Title */}
        <span className={cn(
            "text-xs font-semibold leading-tight truncate pr-6",
            isCompleted ? "text-gray-500 line-through" : "text-gray-200"
        )}>
          {event.title}
        </span>
        
        {/* ROW 3: Details */}
        <div className={cn(
             "flex items-center gap-1 mt-1.5 transition-all duration-200",
             isHovered ? "h-auto opacity-100" : "h-0 opacity-0 overflow-hidden"
        )}>
           <span className="text-[10px] text-gray-400 font-mono bg-black/20 px-1 rounded">
             {event.resource.weight}% {event.resource.type}
          </span>
        </div>

      </div>
    </div>
  );
}