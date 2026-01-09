"use client";

import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card, CardContent } from "@/components/ui/card";
import CalendarEventCard from "./CalendarEventCard";
import CalendarToolbar from "./CalendarToolbar";
import ScheduleListView from "./ScheduleListView";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react"; // Removed useEffect sync to prevent flash

const localizer = momentLocalizer(moment);

const CustomDateHeader = ({ label, date }: { label: string, date: Date }) => {
  const isToday = moment(date).isSame(moment(), 'day');
  return (
    <div className="p-1">
      <span className={cn(
        "text-xs font-medium block w-7 h-7 flex items-center justify-center rounded-full transition-all",
        isToday ? "bg-red-500 text-white font-bold shadow-md shadow-red-900/30" : "text-gray-400"
      )}>
        {label}
      </span>
    </div>
  );
};

type CalendarEvent = {
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
};

export default function CalendarView({ events }: { events: CalendarEvent[] }) {
  const [view, setView] = useState<'month' | 'list'>('month');
  const [showCompleted, setShowCompleted] = useState(false);
  
  // INITIALIZE LOCAL STATE ONCE
  const [localEvents, setLocalEvents] = useState(events);

  // --- FILTERING LOGIC ---
  const filteredEvents = useMemo(() => {
    // Filter the LOCAL events, not the prop events
    if (showCompleted) return localEvents;
    return localEvents.filter(e => e.resource.isCompleted === false);
  }, [localEvents, showCompleted]);

  const CustomToolbar = (props: any) => (
    <CalendarToolbar 
        {...props} 
        customView={view} 
        setCustomView={setView}
        showCompleted={showCompleted}
        setShowCompleted={setShowCompleted}
    />
  );

  const components = {
    // Pass setLocalEvents down to the card so it can update the parent state
    event: (props: any) => <CalendarEventCard {...props} setEvents={setLocalEvents} />,
    toolbar: CustomToolbar,
    month: { dateHeader: CustomDateHeader },
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardContent className="p-0">
        
        {/* VIEW 1: MONTH */}
        <div className={cn(
            "h-[calc(100vh-75px)] text-sm font-medium transition-opacity duration-300",
            view === 'month' ? "block opacity-100" : "hidden opacity-0"
        )}>
          <Calendar<CalendarEvent>
            localizer={localizer}
            events={filteredEvents}
            startAccessor={(event) => event.start}
            endAccessor={(event) => event.end}
            views={[Views.MONTH]}
            defaultView={Views.MONTH}
            components={components}
            popup 
            eventPropGetter={() => ({ style: { backgroundColor: 'transparent', padding: 0 } })}
            dayPropGetter={() => ({ style: { backgroundColor: '#191919' } })}
          />
        </div>

        {/* VIEW 2: LIST */}
        {view === 'list' && (
           <div className="h-[calc(100vh-75px)]">
               <CalendarToolbar 
                  date={new Date()} 
                  view='month' 
                  views={['month']} 
                  label="" 
                  onNavigate={()=>{}} 
                  onView={()=>{}} 
                  localizer={localizer} 
                  customView={view}
                  setCustomView={setView}
                  showCompleted={showCompleted}
                  setShowCompleted={setShowCompleted}
               />
               {/* Pass filtered events so list view shares the state */}
               <ScheduleListView events={filteredEvents} /> 
           </div>
        )}

      </CardContent>
    </Card>
  );
}