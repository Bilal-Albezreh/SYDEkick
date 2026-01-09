"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { postMessage } from "@/app/actions";
import { Send, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Ensure you have this component

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    is_anonymous: boolean;
    avatar_url: string | null; // <--- Added this
  };
}

export default function ChatWidget({ currentUserId }: { currentUserId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // 1. Fetch & Subscribe
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select(`
          id, content, created_at, user_id,
          profiles ( full_name, is_anonymous, avatar_url )
        `)
        .order("created_at", { ascending: true })
        .limit(50);
      
      if (data) setMessages(data as any);
      scrollToBottom();
    };

    fetchMessages();

    // Subscribe to NEW messages
    const channel = supabase
      .channel("chat-room")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          // Fetch the full profile for the new message to get the avatar/name
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, is_anonymous, avatar_url")
            .eq("id", payload.new.user_id)
            .single();

          if (profile) {
             const newMsg = { ...payload.new, profiles: profile };
             setMessages((prev) => [...prev, newMsg as any]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-scroll logic
  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const tempText = inputText;
    setInputText(""); 
    await postMessage(tempText);
  };

  return (
    <div className="bg-[#191919] border border-gray-800 rounded-xl flex flex-col h-[400px] lg:h-full relative overflow-hidden">
      
      {/* HEADER */}
      <div className="p-4 border-b border-gray-800 bg-[#1e1e1e] flex justify-between items-center">
        <div className="flex items-center gap-2 text-gray-400">
          <MessageSquare className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Lobby (48h Wipe)</span>
        </div>
        <span className="text-[10px] text-gray-600 flex items-center gap-1">
           <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live
        </span>
      </div>

      {/* MESSAGES AREA */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#151515]"
      >
        {messages.map((msg) => {
          const isMe = msg.user_id === currentUserId;
          
          // FORCE VISIBILITY: We ignore 'is_anonymous' here and just show the name.
          const rawName = msg.profiles.full_name || "Unknown";
          const displayName = isMe ? "You" : rawName.split(" ")[0]; // First name only
          const avatar = msg.profiles.avatar_url;

          return (
            <div key={msg.id} className={cn("flex gap-3", isMe ? "flex-row-reverse" : "flex-row")}>
              
              {/* AVATAR */}
              <Avatar className="w-8 h-8 border border-gray-700 mt-1 shrink-0">
                  <AvatarImage src={avatar || ""} className="object-cover" />
                  <AvatarFallback className="bg-gray-800 text-gray-500 text-[10px]">
                      <User className="w-4 h-4" />
                  </AvatarFallback>
              </Avatar>

              {/* MESSAGE CONTENT */}
              <div className={cn("flex flex-col max-w-[80%]", isMe ? "items-end" : "items-start")}>
                
                <div className="flex items-baseline gap-2 mb-1">
                  <span className={cn("text-xs font-bold", isMe ? "text-green-400" : "text-indigo-400")}>
                    {displayName}
                  </span>
                  <span className="text-[10px] text-gray-600">
                    {format(new Date(msg.created_at), "h:mm a")}
                  </span>
                </div>

                <div className={cn(
                  "px-3 py-2 rounded-lg text-sm break-words shadow-sm",
                  isMe 
                    ? "bg-green-900/20 text-gray-200 rounded-tr-none border border-green-900/50" 
                    : "bg-[#252525] text-gray-300 rounded-tl-none border border-gray-700"
                )}>
                  {msg.content}
                </div>

              </div>
            </div>
          );
        })}

        {messages.length === 0 && (
            <div className="text-center text-gray-600 text-xs mt-10 italic">
                No active messages. <br/> Say hello!
            </div>
        )}
      </div>

      {/* INPUT AREA */}
      <form onSubmit={handleSend} className="p-3 bg-[#1e1e1e] border-t border-gray-800 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-[#252525] text-gray-200 text-sm rounded-md px-3 border border-gray-700 focus:outline-none focus:border-gray-500 transition-colors"
        />
        <button 
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 bg-white text-black rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
            <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}