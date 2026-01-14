"use client";

import { useReactTable, getCoreRowModel, flexRender, getSortedRowModel, ColumnDef, SortingState } from "@tanstack/react-table";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { User, Trophy, Medal, ArrowUp, ArrowDown, Minus, Flame } from "lucide-react";

// 1. Update Interface to include avatar_url
interface Ranking {
  user_id: string;
  full_name: string;
  is_anonymous: boolean;
  current_average: number;
  trend: number; 
  avatar_url: string | null; // <--- NEW FIELD
  weekly_focus_minutes: number;
}

export default function LeaderboardTable({ data, currentUserId }: { data: Ranking[], currentUserId: string }) {
  const [sorting, setSorting] = useState<SortingState>([]);

  // Define Columns
  const columns: ColumnDef<Ranking>[] = [
    // --- RANK COLUMN ---
    {
      header: "Rank",
      cell: (info) => {
        const rank = info.row.index + 1;
        if (rank === 1) return <Trophy className="w-4 h-4 text-yellow-500" />;
        if (rank === 2) return <Medal className="w-4 h-4 text-gray-400" />;
        if (rank === 3) return <Medal className="w-4 h-4 text-amber-700" />;
        return <span className="text-gray-500 font-mono text-xs">#{rank}</span>;
      },
    },

    // --- TREND COLUMN ---
    {
        accessorKey: "trend",
        header: "Trend",
        cell: (info) => {
            const trend = info.getValue() as number;
            if (trend > 0) {
                return <span className="flex items-center text-[10px] text-green-500 font-bold bg-green-900/10 px-1.5 py-0.5 rounded w-fit"><ArrowUp className="w-3 h-3 mr-1" /> {trend}</span>;
            }
            if (trend < 0) {
                return <span className="flex items-center text-[10px] text-red-500 font-bold bg-red-900/10 px-1.5 py-0.5 rounded w-fit"><ArrowDown className="w-3 h-3 mr-1" /> {Math.abs(trend)}</span>;
            }
            return <span className="flex items-center text-gray-700 pl-2"><Minus className="w-3 h-3" /></span>;
        }
    },

    // --- STUDENT NAME COLUMN (UPDATED FOR AVATARS) ---
    {
      accessorKey: "full_name",
      header: "Student",
      cell: (info) => {
        const row = info.row.original;
        const isMe = row.user_id === currentUserId;
        const isAnon = row.is_anonymous;
        const avatar = row.avatar_url;

        // Logic: Show avatar if it's ME, or if the user is NOT anonymous
        // If they are anonymous, we hide their face from others.
        const showAvatar = (isMe || !isAnon) && avatar;

        return (
          <div className="flex items-center gap-3">
            
            {/* AVATAR CIRCLE */}
            <div className={cn(
                "w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border shrink-0",
                isMe ? "border-green-600 bg-green-900/20" : "border-gray-700 bg-gray-800"
            )}>
                {showAvatar ? (
                    <img src={avatar!} alt="User" className="w-full h-full object-cover" />
                ) : (
                    // Fallback Icon
                    <div className={cn("text-[10px] font-bold", isMe ? "text-green-400" : "text-gray-500")}>
                        {isMe ? "ME" : <User className="w-4 h-4" />}
                    </div>
                )}
            </div>

            {/* NAME TEXT */}
            <div className="flex flex-col">
                <span className={cn(
                    "text-sm truncate max-w-[120px]",
                    isMe ? "font-bold text-white" : "text-gray-300"
                )}>
                {isMe ? "You" : (isAnon ? "Anonymous User" : row.full_name)}
                </span>
                
                {/* STATUS BADGE */}
                {isMe && isAnon && (
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        Hidden <span className="w-1 h-1 rounded-full bg-gray-600" />
                    </span>
                )}
            </div>
          </div>
        );
      },
    },
    // --- [NEW] FOCUS TIME COLUMN ---
    {
      accessorKey: "weekly_focus_minutes",
      header: () => (
          <div className="flex items-center gap-1 text-orange-500/80">
              <Flame className="w-3 h-3" />
              <span>Focused Study Time</span>
          </div>
      ),
      cell: (info) => {
        const mins = info.getValue() as number;
        const hours = Math.floor(mins / 60);
        const m = mins % 60;
        // Threshold for "On Fire" is 2 hours (120 mins)
        const isFire = mins > 120; 

        return (
          <div className="flex items-center gap-2">
            <div className={cn("font-mono text-xs font-medium", isFire ? "text-white" : "text-gray-500")}>
               {hours > 0 ? `${hours}h ` : ""}{m}m
            </div>
            {isFire && (
                <span className="hidden md:inline-flex text-[9px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/30 px-1.5 rounded animate-pulse">
                    ON FIRE
                </span>
            )}
          </div>
        );
      },
    },

    // --- AVERAGE GRADE COLUMN ---
    {
      accessorKey: "current_average",
      header: "Average",
      cell: (info) => {
        const val = info.getValue() as number;
        return (
          <span className={cn(
            "font-mono font-bold",
            val >= 90 ? "text-yellow-500" : 
            val >= 80 ? "text-green-500" : "text-gray-400"
          )}>
            {val.toFixed(1)}%
          </span>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
  });

  return (
    <div className="w-full bg-[#191919] rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800 bg-[#1e1e1e]">
             <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Class Rankings</h3>
        </div>
      <table className="w-full">
        <thead className="bg-[#151515] text-xs uppercase text-gray-500">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id} className="px-4 py-3 text-left font-medium tracking-wider">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-gray-800">
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} className={cn(
                "transition-colors",
                row.original.user_id === currentUserId ? "bg-green-900/10 hover:bg-green-900/20" : "hover:bg-[#252525]"
            )}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-4 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {data.length === 0 && (
          <div className="p-8 text-center text-gray-500 text-sm">
              No data available.
          </div>
      )}
    </div>
  );
}