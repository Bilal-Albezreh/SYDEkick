"use client";

import { motion } from "framer-motion";
import { User, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Ranking {
  user_id: string;
  full_name: string;
  is_anonymous: boolean;
  current_average: number;
  rank: number;
  avatar_url?: string | null; // [NEW] Added avatar_url
}

// [NEW] Helper: Rounds to 2 decimals, removes trailing zeros
const formatGrade = (val: number) => parseFloat(val.toFixed(2));

export default function LeaderboardPodium({ topThree, currentUserId }: { topThree: Ranking[], currentUserId: string }) {
  const first = topThree.find(u => u.rank === 1);
  const second = topThree.find(u => u.rank === 2);
  const third = topThree.find(u => u.rank === 3);

  const PodiumItem = ({ user, place, height, color, delay }: any) => {
    if (!user) return <div className="w-1/3"></div>;
    const isMe = user.user_id === currentUserId;

    return (
      <div className="flex flex-col items-center justify-end w-1/3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.2 }}
          className="flex flex-col items-center mb-3 text-center"
        >
          {place === 1 && <Crown className="w-6 h-6 text-yellow-400 mb-1 animate-bounce" />}

          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs mb-2 border-2 overflow-hidden bg-gray-800", // [FIX] Added overflow-hidden and bg
            isMe ? "border-white" : "border-gray-700"
          )}>
            {user.avatar_url ? (
              // [FIX] Render image if available
              <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
            ) : (
              isMe ? "ME" : <User className="w-4 h-4 text-gray-400" />
            )}
          </div>

          <span className={cn("text-xs font-bold truncate max-w-[80px]", isMe ? "text-white" : "text-gray-300")}>
            {isMe ? "You" : (user.is_anonymous ? "Anonymous" : user.full_name.split(' ')[0])}
          </span>
          {/* [UPDATED] Use formatGrade here */}
          <span className={cn("text-xs font-mono font-bold", color)}>
            {formatGrade(user.current_average)}%
          </span>
        </motion.div>

        <motion.div
          initial={{ height: 0 }}
          animate={{ height: height }}
          transition={{ duration: 0.5, delay: delay, type: "spring" }}
          className={cn(
            "w-full rounded-t-lg flex items-end justify-center pb-4 text-4xl font-black text-black/20",
            place === 1 ? "bg-gradient-to-t from-yellow-600 to-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.3)]" :
              place === 2 ? "bg-gradient-to-t from-gray-500 to-gray-300" :
                "bg-gradient-to-t from-amber-800 to-amber-600"
          )}
        >
          {place}
        </motion.div>
      </div>
    );
  };

  return (
    <div className="flex items-end justify-center gap-4 h-[250px] w-full max-w-md mx-auto mb-8 px-4">
      <PodiumItem user={second} place={2} height="120px" color="text-gray-300" delay={0.2} />
      <PodiumItem user={first} place={1} height="160px" color="text-yellow-400" delay={0} />
      <PodiumItem user={third} place={3} height="80px" color="text-amber-600" delay={0.4} />
    </div>
  );
}