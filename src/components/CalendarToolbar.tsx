"use client";

import { ChevronLeft, ChevronRight, List, Calendar as CalendarIcon, Eye, EyeOff } from "lucide-react";
import { ToolbarProps } from "react-big-calendar";
import { Button } from "@/components/ui/button";

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource: {
    courseCode: string;
    color: string;
    type: string;
    isCompleted: boolean;
    weight: number;
  };
}

interface CustomToolbarProps extends ToolbarProps<CalendarEvent> {
  customView: 'month' | 'list';
  setCustomView: (view: 'month' | 'list') => void;
  showCompleted: boolean;
  setShowCompleted: (v: boolean) => void;
}

export default function CalendarToolbar(props: CustomToolbarProps) {
  const { onNavigate, date, customView, setCustomView, showCompleted, setShowCompleted } = props;

  const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="flex items-center justify-between mb-6 px-1">
      {/* Left: Navigation */}
      <div className="flex items-center gap-4">
        {customView === 'month' ? (
          <>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {label}
            </h2>
            <div className="flex items-center gap-1 bg-[#252525] border border-gray-700 rounded-md p-1">
                {/* NAVIGATION BUTTONS */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-gray-400 hover:text-white" 
                  onClick={() => onNavigate('PREV')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs font-medium px-2 text-gray-300 hover:text-white" 
                  onClick={() => onNavigate('TODAY')}
                >
                  Today
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-gray-400 hover:text-white" 
                  onClick={() => onNavigate('NEXT')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
          </>
        ) : (
           <h2 className="text-2xl font-bold text-white flex items-center gap-2">
             Semester Schedule
           </h2>
        )}
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-3">
        {/* HISTORY TOGGLE */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCompleted(!showCompleted)}
          className={`h-8 text-xs font-medium px-3 border transition-all ${
             showCompleted 
               ? "bg-blue-900/20 text-blue-400 border-blue-800" 
               : "bg-transparent text-gray-500 border-gray-800 hover:text-gray-300"
          }`}
        >
          {showCompleted ? <Eye className="w-3.5 h-3.5 mr-2" /> : <EyeOff className="w-3.5 h-3.5 mr-2" />}
          {showCompleted ? "Hide Done" : "Show Done"}
        </Button>

        {/* VIEW SWITCHER */}
        <div className="flex bg-[#252525] p-1 rounded-lg border border-gray-700">
          <button
            onClick={() => setCustomView('month')}
            className={`text-xs font-medium px-3 py-1 rounded-md transition-all flex items-center gap-2 ${
              customView === 'month' ? 'bg-[#3f3f3f] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <CalendarIcon className="w-3 h-3" />
            Month
          </button>
          <button
            onClick={() => setCustomView('list')}
            className={`text-xs font-medium px-3 py-1 rounded-md transition-all flex items-center gap-2 ${
              customView === 'list' ? 'bg-[#3f3f3f] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <List className="w-3 h-3" />
            List
          </button>
        </div>
      </div>
    </div>
  );
}