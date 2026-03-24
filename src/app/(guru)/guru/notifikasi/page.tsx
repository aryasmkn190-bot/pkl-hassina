"use client";

// Halaman notifikasi guru — reuse logika sama dengan siswa, bedanya type dan href
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Trash2,
  Camera,
  BookOpen,
  ClipboardList,
  Megaphone,
  MessageCircle,
  Star,
  Settings,
  BellOff,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { formatRelativeTime, cn } from "@/lib/utils";

type NotifType = "attendance" | "journal" | "absence" | "announcement" | "chat" | "assessment" | "system";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: NotifType;
  is_read: boolean;
  created_at: string;
}

const NOTIF_CONFIG: Record<NotifType, { icon: React.ElementType; color: string; bg: string; label: string; href: string }> = {
  attendance: { icon: Camera, color: "text-blue-600", bg: "bg-blue-100", label: "Presensi", href: "/guru/presensi" },
  journal: { icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-100", label: "Jurnal", href: "/guru/jurnal" },
  absence: { icon: ClipboardList, color: "text-orange-600", bg: "bg-orange-100", label: "Izin", href: "/guru/izin" },
  announcement: { icon: Megaphone, color: "text-purple-600", bg: "bg-purple-100", label: "Pengumuman", href: "/guru/pengumuman" },
  chat: { icon: MessageCircle, color: "text-sky-600", bg: "bg-sky-100", label: "Pesan", href: "/guru/chat" },
  assessment: { icon: Star, color: "text-amber-600", bg: "bg-amber-100", label: "Penilaian", href: "/guru/penilaian" },
  system: { icon: Settings, color: "text-slate-600", bg: "bg-slate-100", label: "Sistem", href: "/guru/dashboard" },
};

function generatePlaceholder(): Notification[] {
  return [
    { id: "1", title: "Ahmad Rizki mengajukan presensi masuk", body: "Ahmad Rizki Pratama melakukan check-in pada pukul 07:45 WIB. Harap diverifikasi.", type: "attendance", is_read: false, created_at: new Date(Date.now() - 1800000).toISOString() },
    { id: "2", title: "2 jurnal menunggu review", body: "Bella Safitri dan Dina Marliani mengirimkan jurnal hari ini yang belum Anda review.", type: "journal", is_read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: "3", title: "Pengajuan izin sakit dari Ahmad", body: "Ahmad Rizki Pratama mengajukan izin sakit untuk hari ini. Mohon segera ditindaklanjuti.", type: "absence", is_read: false, created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: "4", title: "Pengumuman rapat pembimbing PKL", body: "Terdapat pengumuman baru dari koordinator PKL mengenai rapat evaluasi pembimbing.", type: "announcement", is_read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: "5", title: "Pesan baru dari Cahya Nugroho", body: "Cahya Nugroho: Pak/Bu, boleh saya konsultasi mengenai jurnal minggu ini?", type: "chat", is_read: true, created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  ];
}

export default function GuruNotifikasiPage() {
  const { profile } = useAuthStore();
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setNotifications((data ?? []) as Notification[]);
      setLoading(false);
    };
    load();
  }, [profile?.id]);

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  };

  const handleDelete = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("notifications").delete().eq("id", id);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/60">
        <div className="flex items-center justify-between px-4 h-[60px]">
          <div className="flex items-center gap-2">
            <h1 className="text-[17px] font-bold text-slate-900">Notifikasi</h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full">{unreadCount}</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Baca semua
            </button>
          )}
        </div>
      </header>

      <div className="px-4 py-4 max-w-lg mx-auto space-y-2">
        {loading ? (
          <div className="space-y-2">{[0,1,2,3].map((i) => <div key={i} className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}</div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-4"><BellOff className="w-9 h-9 text-slate-400" strokeWidth={1.5} /></div>
            <p className="text-base font-bold text-slate-700 mb-1.5">Tidak Ada Notifikasi</p>
            <p className="text-sm text-slate-400">Notifikasi akan muncul di sini</p>
          </div>
        ) : (
          <AnimatePresence>
            {notifications.map((notif, i) => {
              const cfg = NOTIF_CONFIG[notif.type];
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100, height: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    href={cfg.href}
                    onClick={() => handleMarkRead(notif.id)}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-2xl border transition-colors",
                      !notif.is_read ? "bg-blue-50/80 border-blue-100" : "bg-white border-slate-100"
                    )}
                  >
                    {!notif.is_read && <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500" />}
                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", cfg.bg)}>
                      <Icon className={cn("w-5 h-5", cfg.color)} />
                    </div>
                    <div className="flex-1 min-w-0 pr-2 relative">
                      {!notif.is_read && <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-blue-500" />}
                      <p className={cn("text-sm leading-tight mb-0.5", notif.is_read ? "font-medium text-slate-700" : "font-bold text-slate-900")}>{notif.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-2">{notif.body}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", cfg.bg, cfg.color)}>{cfg.label}</span>
                        <span className="text-[11px] text-slate-400">{formatRelativeTime(notif.created_at)}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
