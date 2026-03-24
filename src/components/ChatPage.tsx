"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, Send, ArrowLeft, Check, CheckCheck,
  RefreshCw, Plus, Search, X, Users, Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { cn, formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";

/* ── Types ─────────────────────────────────────────────── */

interface Room {
  id: string;
  name: string;
  type: "direct" | "group";
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  other_user_name: string;
  other_user_id: string | null;
  accent: string;
}

interface Msg {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
}

interface Profile {
  id: string;
  full_name: string;
  role: string;
}

const ACCENT = [
  "from-blue-400 to-blue-600",
  "from-emerald-400 to-emerald-600",
  "from-purple-400 to-purple-600",
  "from-orange-400 to-orange-600",
  "from-rose-400 to-rose-600",
];

/* ── Chat View ─────────────────────────────────────────── */

function ChatView({
  room,
  myId,
  accentClass,
  onBack,
}: {
  room: Room;
  myId: string;
  accentClass: string;
  onBack: () => void;
}) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [online, setOnline] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Load messages */
  const loadMessages = useCallback(async () => {
    const { data } = await supabase
      .from("chat_messages")
      .select("id, sender_id, content, created_at, profiles(full_name)")
      .eq("room_id", room.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })
      .limit(100);

    setMessages(
      (data ?? []).map((m) => ({
        id: m.id,
        sender_id: m.sender_id,
        content: m.content,
        created_at: m.created_at,
        sender_name: (m.profiles as unknown as { full_name: string } | null)?.full_name,
      }))
    );
    setLoading(false);
  }, [room.id, supabase]);

  useEffect(() => {
    loadMessages();

    /* Supabase Realtime subscription */
    const channel = supabase
      .channel(`room-${room.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${room.id}` },
        async (payload) => {
          const newMsg = payload.new as { id: string; sender_id: string; content: string; created_at: string };
          /* Ambil nama sender */
          const { data: prof } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", newMsg.sender_id)
            .single();
          setMessages((prev) => [
            ...prev,
            { ...newMsg, sender_name: prof?.full_name },
          ]);
        }
      )
      .subscribe((status) => {
        setOnline(status === "SUBSCRIBED");
      });

    return () => { supabase.removeChannel(channel); };
  }, [room.id, loadMessages, supabase]);

  /* Auto-scroll on new messages */
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 80);
  }, [messages]);

  /* Focus input on open */
  useEffect(() => { inputRef.current?.focus(); }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");

    const { error } = await supabase.from("chat_messages").insert({
      room_id: room.id,
      sender_id: myId,
      content: text,
      type: "text",
      is_deleted: false,
    });

    if (error) {
      toast.error("Gagal mengirim pesan");
      setInput(text);
    } else {
      /* Update last_message di room */
      await supabase
        .from("chat_rooms")
        .update({ last_message: text, last_message_at: new Date().toISOString() })
        .eq("id", room.id);
    }
    setSending(false);
  };

  const isColorLight = accentClass.includes("yellow") || accentClass.includes("amber");

  return (
    <motion.div
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex flex-col bg-slate-50"
    >
      {/* Header */}
      <header className="flex items-center gap-3 px-4 h-[60px] bg-white/90 backdrop-blur-xl border-b border-slate-200/60 flex-shrink-0 shadow-sm">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center active:scale-95 transition-transform">
          <ArrowLeft className="w-4.5 h-4.5 text-slate-700" strokeWidth={2.5} />
        </button>
        <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-sm", accentClass)}>
          <span className="text-sm font-bold text-white">{room.other_user_name.charAt(0)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{room.other_user_name}</p>
          <div className="flex items-center gap-1">
            <span className={cn("w-1.5 h-1.5 rounded-full", online ? "bg-emerald-500" : "bg-slate-300")} />
            <p className="text-[10px] text-slate-500">{online ? "Online" : "Offline"}</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Belum ada pesan. Mulai percakapan!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === myId;
            return (
              <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                  isMe ? cn("bg-gradient-to-br text-white rounded-tr-sm", accentClass) : "bg-white border border-slate-100 text-slate-800 rounded-tl-sm"
                )}>
                  {!isMe && msg.sender_name && (
                    <p className="text-[10px] font-semibold mb-1 opacity-60">{msg.sender_name}</p>
                  )}
                  {msg.content}
                  <div className={cn("flex items-center justify-end gap-1 mt-1", isMe ? "text-white/60" : "text-slate-400")}>
                    <span className="text-[10px]">{formatRelativeTime(msg.created_at)}</span>
                    {isMe && <CheckCheck className="w-3 h-3" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white border-t border-slate-100 flex-shrink-0 pb-safe">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Tulis pesan..."
          className="flex-1 h-11 px-4 bg-slate-100 rounded-2xl text-sm text-slate-800 placeholder:text-slate-400 outline-none"
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          className={cn("w-11 h-11 rounded-2xl text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-40", `bg-gradient-to-br ${accentClass}`)}
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </motion.div>
  );
}

/* ── New Room Modal ────────────────────────────────────── */

function NewRoomModal({
  myId,
  onClose,
  onCreated,
}: {
  myId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const supabase = createClient();
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("is_active", true)
      .neq("id", myId)
      .order("full_name")
      .limit(50)
      .then(({ data }) => {
        setUsers((data ?? []) as Profile[]);
        setLoading(false);
      });
  }, [myId, supabase]);

  const filtered = users.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const startChat = async (other: Profile) => {
    setCreating(other.id);
    try {
      /* Cek apakah room direct sudah ada */
      const { data: existingMembers } = await supabase
        .from("chat_room_members")
        .select("room_id")
        .eq("user_id", myId);

      const myRoomIds = (existingMembers ?? []).map((m) => m.room_id);

      if (myRoomIds.length > 0) {
        const { data: sharedRooms } = await supabase
          .from("chat_room_members")
          .select("room_id, chat_rooms(type)")
          .eq("user_id", other.id)
          .in("room_id", myRoomIds);

        const direct = (sharedRooms ?? []).find(
          (r) => (r.chat_rooms as unknown as { type: string } | null)?.type === "direct"
        );

        if (direct) {
          toast.info("Chat sudah ada");
          onCreated();
          return;
        }
      }

      /* Buat room baru */
      const { data: room, error } = await supabase
        .from("chat_rooms")
        .insert({ name: other.full_name, type: "direct", created_by: myId })
        .select()
        .single();

      if (error || !room) throw error;

      /* Tambah kedua member */
      await supabase.from("chat_room_members").insert([
        { room_id: room.id, user_id: myId,    role: "member" },
        { room_id: room.id, user_id: other.id, role: "member" },
      ]);

      toast.success(`Chat dengan ${other.full_name} dibuat ✅`);
      onCreated();
    } catch {
      toast.error("Gagal membuat room chat");
    } finally {
      setCreating(null);
    }
  };

  const ROLE_LABEL: Record<string, string> = {
    super_admin: "Super Admin",
    ketua_jurusan: "Ketua Jurusan",
    guru_pembimbing: "Guru",
    siswa: "Siswa",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 350, damping: 35 }}
        className="w-full bg-white rounded-t-3xl pb-safe max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Chat Baru</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 px-3 h-10 bg-slate-100 rounded-xl">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari pengguna..."
              className="flex-1 bg-transparent text-sm text-slate-700 outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">Tidak ada pengguna ditemukan</p>
          ) : (
            filtered.map((u) => (
              <button key={u.id} onClick={() => startChat(u)} disabled={creating === u.id}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 active:bg-slate-100 transition-colors text-left disabled:opacity-60">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-white">{u.full_name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{u.full_name}</p>
                  <p className="text-[11px] text-slate-500">{ROLE_LABEL[u.role] ?? u.role}</p>
                </div>
                {creating === u.id
                  ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
                  : <MessageCircle className="w-4 h-4 text-slate-300 flex-shrink-0" />}
              </button>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Main Chat Page ────────────────────────────────────── */

interface ChatPageProps {
  accentClass?: string; // gradient class e.g. "from-blue-400 to-blue-600"
}

export function ChatPage({ accentClass = "from-blue-400 to-blue-600" }: ChatPageProps) {
  const supabase = createClient();
  const { profile } = useAuthStore();
  const myId = profile?.id ?? "";

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Room | null>(null);
  const [showNew, setShowNew] = useState(false);

  const loadRooms = useCallback(async (showRefreshing = false) => {
    if (!myId) return;
    if (showRefreshing) setRefreshing(true);

    try {
      /* Ambil semua room di mana saya jadi member */
      const { data: memberRows } = await supabase
        .from("chat_room_members")
        .select("room_id")
        .eq("user_id", myId);

      const roomIds = (memberRows ?? []).map((m) => m.room_id);
      if (roomIds.length === 0) { setRooms([]); setLoading(false); setRefreshing(false); return; }

      const { data: roomData } = await supabase
        .from("chat_rooms")
        .select("id, name, type, last_message, last_message_at")
        .in("id", roomIds)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      /* Untuk setiap room, cari nama lawan bicara */
      const enriched: Room[] = await Promise.all(
        (roomData ?? []).map(async (r, idx) => {
          let otherName = r.name;
          let otherId: string | null = null;

          if (r.type === "direct") {
            const { data: members } = await supabase
              .from("chat_room_members")
              .select("user_id, profiles(full_name)")
              .eq("room_id", r.id)
              .neq("user_id", myId)
              .limit(1)
              .single();

            if (members) {
              otherName = (members.profiles as unknown as { full_name: string } | null)?.full_name ?? r.name;
              otherId = members.user_id;
            }
          }

          /* Hitung unread */
          const { count } = await supabase
            .from("chat_messages")
            .select("id", { count: "exact", head: true })
            .eq("room_id", r.id)
            .neq("sender_id", myId)
            .eq("is_deleted", false);

          return {
            id: r.id,
            name: r.name,
            type: r.type as "direct" | "group",
            last_message: r.last_message,
            last_message_at: r.last_message_at,
            unread_count: count ?? 0,
            other_user_name: otherName,
            other_user_id: otherId,
            accent: ACCENT[idx % ACCENT.length],
          };
        })
      );

      setRooms(enriched);
    } catch (err) {
      console.error("loadRooms error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [myId, supabase]);

  useEffect(() => { loadRooms(); }, [loadRooms]);

  /* Realtime — listen perubahan chat_rooms */
  useEffect(() => {
    if (!myId) return;
    const channel = supabase
      .channel("rooms-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_rooms" }, () => {
        loadRooms();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [myId, loadRooms, supabase]);

  const totalUnread = rooms.reduce((s, r) => s + (r.unread_count ?? 0), 0);

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="px-4 py-5 max-w-2xl mx-auto space-y-4">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-extrabold text-slate-900">Chat</h1>
              <p className="text-xs text-slate-400 mt-px">
                {rooms.length} percakapan{totalUnread > 0 ? ` · ${totalUnread} belum dibaca` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.88 }} onClick={() => loadRooms(true)} disabled={refreshing}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500">
                <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
              </motion.button>
              <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShowNew(true)}
                className={cn("w-9 h-9 rounded-xl bg-gradient-to-br text-white flex items-center justify-center shadow-sm", accentClass)}>
                <Plus className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Room list */}
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}
            </div>
          ) : rooms.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-20">
              <div className={cn("w-16 h-16 rounded-3xl bg-gradient-to-br mx-auto mb-4 flex items-center justify-center shadow-lg", accentClass)}>
                <MessageCircle className="w-7 h-7 text-white" />
              </div>
              <p className="text-base font-bold text-slate-700">Belum ada percakapan</p>
              <p className="text-sm text-slate-400 mt-1 mb-4">Mulai chat dengan menekan tombol + di atas</p>
              <button onClick={() => setShowNew(true)}
                className={cn("inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-br text-white text-sm font-bold shadow-lg", accentClass)}>
                <Plus className="w-4 h-4" /> Mulai Chat Baru
              </button>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {rooms.map((room, i) => (
                <motion.button key={room.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  onClick={() => setSelected(room)}
                  className="w-full text-left flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-px active:scale-[0.98] transition-all">
                  <div className={cn("w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-sm", room.accent)}>
                    {room.type === "group"
                      ? <Users className="w-5 h-5 text-white" />
                      : <span className="text-base font-bold text-white">{room.other_user_name.charAt(0)}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-bold text-slate-900 truncate flex-1">{room.other_user_name}</p>
                      {room.last_message_at && (
                        <span className="text-[11px] text-slate-400 flex-shrink-0 ml-2">{formatRelativeTime(room.last_message_at)}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{room.last_message ?? "Belum ada pesan"}</p>
                  </div>
                  {(room.unread_count ?? 0) > 0 && (
                    <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {room.unread_count}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat view */}
      <AnimatePresence>
        {selected && (
          <ChatView
            key={selected.id}
            room={selected}
            myId={myId}
            accentClass={selected.accent}
            onBack={() => { setSelected(null); loadRooms(); }}
          />
        )}
      </AnimatePresence>

      {/* New room modal */}
      <AnimatePresence>
        {showNew && (
          <NewRoomModal
            myId={myId}
            onClose={() => setShowNew(false)}
            onCreated={() => { setShowNew(false); loadRooms(); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
