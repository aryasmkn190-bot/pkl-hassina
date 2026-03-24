"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, ArrowLeft, Check, CheckCheck } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { cn, formatRelativeTime } from "@/lib/utils";

interface Room { id: string; other_name: string; last_message: string; last_message_at: string; unread_count: number; role: string; }
interface Msg { id: string; sender_id: string; content: string; created_at: string; is_read: boolean; }

const ROOMS: Room[] = [
  { id: "1", other_name: "Ibu Sari Dewi, S.Kom", last_message: "Nilai sudah saya inputkan semua", last_message_at: new Date(Date.now() - 3600000).toISOString(), unread_count: 1, role: "Guru Pembimbing" },
  { id: "2", other_name: "Pak Ahmad Fauzi, M.Pd", last_message: "Siap Bu, akan segera diselesaikan", last_message_at: new Date(Date.now() - 7200000).toISOString(), unread_count: 0, role: "Guru Pembimbing" },
  { id: "3", other_name: "Admin PKL", last_message: "Data siswa sudah diperbarui", last_message_at: new Date(Date.now() - 86400000).toISOString(), unread_count: 0, role: "Administrator" },
];

const MSGS: Record<string, Msg[]> = {
  "1": [
    { id: "m1", sender_id: "teacher", content: "Bu Kajur, rekap nilai sudah saya inputkan semua", created_at: new Date(Date.now() - 3600000).toISOString(), is_read: false },
  ],
};

function ChatView({ room, onBack }: { room: Room; onBack: () => void }) {
  const [messages, setMessages] = useState<Msg[]>(MSGS[room.id] ?? []);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    setMessages((p) => [...p, { id: Date.now().toString(), sender_id: "me", content: input, created_at: new Date().toISOString(), is_read: false }]);
    setInput("");
  };

  return (
    <motion.div initial={{ opacity: 0, x: "100%" }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: "100%" }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="fixed inset-0 z-50 flex flex-col bg-slate-50">
      <header className="flex items-center gap-3 px-4 h-[60px] bg-white/90 backdrop-blur-xl border-b border-slate-200/60 flex-shrink-0">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center"><ArrowLeft className="w-4.5 h-4.5 text-slate-700" strokeWidth={2.5} /></button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0"><span className="text-sm font-bold text-white">{room.other_name.charAt(0)}</span></div>
        <div className="flex-1 min-w-0"><p className="text-sm font-bold text-slate-900 truncate">{room.other_name}</p><p className="text-[11px] text-slate-500">{room.role}</p></div>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => {
          const isMe = msg.sender_id === "me";
          return (
            <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed", isMe ? "bg-purple-600 text-white rounded-tr-sm" : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm")}>
                {msg.content}
                <div className={cn("flex items-center justify-end gap-1 mt-1", isMe ? "text-purple-200" : "text-slate-400")}>
                  <span className="text-[10px]">{formatRelativeTime(msg.created_at)}</span>
                  {isMe && (msg.is_read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 px-4 py-3 bg-white border-t border-slate-200 flex-shrink-0">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Tulis pesan..." className="flex-1 h-11 px-4 bg-slate-100 rounded-2xl text-sm text-slate-800 placeholder:text-slate-400 outline-none" />
        <button onClick={send} disabled={!input.trim()} className="w-11 h-11 rounded-2xl bg-purple-600 disabled:bg-slate-200 text-white flex items-center justify-center"><Send className="w-4.5 h-4.5" /></button>
      </div>
    </motion.div>
  );
}

export default function KajurChatPage() {
  const [selected, setSelected] = useState<Room | null>(null);

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="px-4 py-5 max-w-2xl mx-auto space-y-3">
          {ROOMS.map((room, i) => (
            <motion.button key={room.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => setSelected(room)} className="w-full text-left flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-px active:scale-[0.98] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0">
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
              {room.unread_count > 0 && <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{room.unread_count}</span>}
            </motion.button>
          ))}
        </div>
      </div>
      <AnimatePresence>{selected && <ChatView room={selected} onBack={() => setSelected(null)} />}</AnimatePresence>
    </>
  );
}
