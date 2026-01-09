"use client";

import { useState, useRef } from "react";
import { addReminder, toggleReminder, deleteReminder } from "@/app/actions";
import { Check, Plus, Trash2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Reminder {
  id: string;
  title: string;
  is_completed: boolean;
}

export default function ReminderList({ initialReminders }: { initialReminders: Reminder[] }) {
  // We use optimistic state so the UI updates INSTANTLY, even before the database confirms
  const [reminders, setReminders] = useState(initialReminders);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleAdd(formData: FormData) {
    const title = formData.get("title") as string;
    if (!title.trim()) return;

    // 1. Optimistic Update (Add to UI immediately)
    const tempId = Math.random().toString();
    const newReminder = { id: tempId, title, is_completed: false };
    setReminders([...reminders, newReminder]);
    
    // 2. Reset Form
    formRef.current?.reset();

    // 3. Server Action
    try {
      await addReminder(title);
    } catch (e) {
      toast.error("Failed to save reminder");
    }
  }

  async function handleToggle(id: string, currentStatus: boolean) {
    // 1. Optimistic Update
    setReminders(reminders.map(r => 
      r.id === id ? { ...r, is_completed: !currentStatus } : r
    ));

    // 2. Server Action
    await toggleReminder(id, !currentStatus);
  }

  async function handleDelete(id: string) {
     setReminders(reminders.filter(r => r.id !== id));
     await deleteReminder(id);
  }

  return (
    <div className="mt-8 pt-8 border-t border-gray-800 animate-in fade-in slide-in-from-right-6 duration-700 delay-100">
      <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">
        Reminders
      </h3>

      {/* INPUT FIELD */}
      <form ref={formRef} action={handleAdd} className="relative mb-4">
        <Plus className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
        <input 
          name="title"
          type="text"
          placeholder="Add a task..."
          className="w-full bg-[#252525] border border-gray-700 rounded-lg py-2 pl-9 pr-3 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-gray-500 transition-all"
          autoComplete="off"
        />
        {/* Hidden submit button allows "Enter" key to work */}
        <button type="submit" className="hidden" />
      </form>

      {/* LIST */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {reminders.map((reminder) => (
          <div 
            key={reminder.id} 
            className="group flex items-center justify-between p-2 rounded-md hover:bg-[#252525] transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 overflow-hidden">
              {/* Custom Checkbox */}
              <button
                onClick={() => handleToggle(reminder.id, reminder.is_completed)}
                className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0",
                  reminder.is_completed 
                    ? "bg-gray-500 border-gray-500" 
                    : "border-gray-600 hover:border-gray-400"
                )}
              >
                {reminder.is_completed && <Check className="w-3 h-3 text-[#191919]" />}
              </button>

              <span className={cn(
                "text-sm truncate transition-all",
                reminder.is_completed ? "text-gray-600 line-through" : "text-gray-300"
              )}>
                {reminder.title}
              </span>
            </div>

            {/* Delete Button (Only visible on hover) */}
            <button 
              onClick={() => handleDelete(reminder.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {reminders.length === 0 && (
            <p className="text-xs text-gray-700 italic text-center py-2">
                No reminders yet.
            </p>
        )}
      </div>
    </div>
  );
}