"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Send,
  ArrowLeft,
  Search,
  Check,
  CheckCheck,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { cn, formatRelativeTime } from "@/lib/utils";

interface ChatRoom {
  id: string;
  other_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  role: string;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

const ROOMS: ChatRoom[] = [
  { id: "1", other_name: "Ahmad Rizki Pratama", last_message: "Pak, jurnal saya sudah diisi hari ini", last_message_at: new Date(Date.now() - 1800000).toISOString(), unread_count: 2, role: "Siswa" },
  { id: "2", other_name: "Bella Safitri", last_message: "Terima kasih atas feedbacknya Bu", last_message_at: new Date(Date.now() - 3600000 * 3).toISOString(), unread_count: 0, role: "Siswa" },
  { id: "3", other_name: "Drs. H. Sudarman, M.Pd", last_message: "Harap segera kirim rekap nilai", last_message_at: new Date(Date.now() - 86400000).toISOString(), unread_count: 1, role: "Ketua Jurusan" },
];

const MESSAGES: Record<string, Message[]> = {
  "1": [
    { id: "m1", sender_id: "student", content: "Selamat pagi Pak/Bu, saya Ahmad Rizki", created_at: new Date(Date.now() - 7200000).toISOString(), is_read: true },
    { id: "m2", sender_id: "me", content: "Selamat pagi Ahmad, ada yang bisa dibantu?", created_at: new Date(Date.now() - 6000000).toISOString(), is_read: true },
    { id: "m3", sender_id: "student", content: "Pak, jurnal saya sudah diisi hari ini", created_at: new Date(Date.now() - 1800000).toISOString(), is_read: false },
  ],
};

function ChatRoom({ room, onBack, myId }: { room: ChatRoom; onBack: () => void; myId: string }) {
  const [messages, setMessages] = useState<Message[]>(MESSAGES[room.id] ?? []);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 100);
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg: Message = { id: Date.now().toString(), sender_id: "me", content: input.trim(), created_at: new Date().toISOString(), is_read: false };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex flex-col bg-slate-50"
    >
      <header className="flex items-center gap-3 px-4 h-[60px] bg-white/90 backdrop-blur-xl border-b border-slate-200/60 flex-shrink-0">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
          <ArrowLeft className="w-4.5 h-4.5 text-slate-700" strokeWidth={2.5} />
        </button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-white">{room.other_name.charAt(0)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{room.other_name}</p>
          <p className="text-[11px] text-slate-500">{room.role}</p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => {
          const isMe = msg.sender_id === "me";
          return (
            <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed", isMe ? "bg-blue-600 text-white rounded-tr-sm" : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm")}>
                {msg.content}
                <div className={cn("flex items-center justify-end gap-1 mt-1", isMe ? "text-blue-200" : "text-slate-400")}>
                  <span className="text-[10px]">{formatRelativeTime(msg.created_at)}</span>
                  {isMe && (msg.is_read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 px-4 py-3 bg-white border-t border-slate-200 flex-shrink-0 pb-safe">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Tulis pesan..."
          className="flex-1 h-11 px-4 bg-slate-100 rounded-2xl text-sm text-slate-800 placeholder:text-slate-400 outline-none"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="w-11 h-11 rounded-2xl bg-blue-600 disabled:bg-slate-200 text-white flex items-center justify-center transition-colors"
        >
          <Send className="w-4.5 h-4.5" />
        </button>
      </div>
    </motion.div>
  );
}

export default function GuruChatPage() {
  const { profile } = useAuthStore();
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="px-4 py-5 max-w-2xl mx-auto space-y-3">
          {ROOMS.length === 0 ? (
            <div className="text-center py-16">
              <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500">Belum ada pesan</p>
            </div>
          ) : (
            ROOMS.map((room, i) => (
              <motion.button
                key={room.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedRoom(room)}
                className="w-full text-left flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-px active:scale-[0.98] transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-base font-bold text-white">{room.other_name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-bold text-slate-900 truncate">{room.other_name}</p>
                    <span className="text-[11px] text-slate-400 flex-shrink-0 ml-2">{formatRelativeTime(room.last_message_at)}</span>
                  </div>
                  <p className="text-xs text-slate-500 text-left">{room.role}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{room.last_message}</p>
                </div>
                {room.unread_count > 0 && (
                  <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {room.unread_count}
                  </span>
                )}
              </motion.button>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedRoom && (
          <ChatRoom room={selectedRoom} onBack={() => setSelectedRoom(null)} myId={profile?.id ?? "me"} />
        )}
      </AnimatePresence>
    </>
  );
}
