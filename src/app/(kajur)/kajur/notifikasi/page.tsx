"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Bell, CheckCheck, BellOff, Camera, BookOpen, ClipboardList, Megaphone, MessageCircle, Star, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime, cn } from "@/lib/utils";

type NType = "attendance" | "journal" | "absence" | "announcement" | "chat" | "assessment" | "system";
interface N { id: string; title: string; body: string; type: NType; is_read: boolean; created_at: string; }

const CFG: Record<NType, { icon: React.ElementType; color: string; bg: string; label: string; href: string }> = {
  attendance: { icon: Camera, color: "text-blue-600", bg: "bg-blue-100", label: "Presensi", href: "/kajur/siswa" },
  journal: { icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-100", label: "Jurnal", href: "/kajur/siswa" },
  absence: { icon: ClipboardList, color: "text-orange-600", bg: "bg-orange-100", label: "Izin", href: "/kajur/siswa" },
  announcement: { icon: Megaphone, color: "text-purple-600", bg: "bg-purple-100", label: "Pengumuman", href: "/kajur/pengumuman" },
  chat: { icon: MessageCircle, color: "text-sky-600", bg: "bg-sky-100", label: "Pesan", href: "/kajur/chat" },
  assessment: { icon: Star, color: "text-amber-600", bg: "bg-amber-100", label: "Penilaian", href: "/kajur/dashboard" },
  system: { icon: Settings, color: "text-slate-600", bg: "bg-slate-100", label: "Sistem", href: "/kajur/dashboard" },
};

const SAMPLE: N[] = [
  { id: "1", title: "Rekap PKL Jurusan TKJ Siap", body: "Rekap presensi dan penilaian jurusan TKJ untuk bulan Maret sudah dapat diunduh.", type: "announcement", is_read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: "2", title: "5 Siswa Kehadiran di Bawah 85%", body: "Terdapat 5 siswa dengan persentase kehadiran di bawah standar minimum 85%.", type: "attendance", is_read: false, created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: "3", title: "Pengajuan Izin Guru Belum Diverifikasi", body: "Terdapat 3 pengajuan izin siswa yang belum diverifikasi oleh guru pembimbing.", type: "absence", is_read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
];

export default function KajurNotifikasiPage() {
  const supabase = createClient();
  const [notifs, setNotifs] = useState<N[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setNotifs((data ?? []) as N[]);
      setLoading(false);
    };
    load();
  }, []);

  const unread = notifs.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/60">
        <div className="flex items-center justify-between px-4 h-[60px]">
          <div className="flex items-center gap-2">
            <h1 className="text-[17px] font-bold text-slate-900">Notifikasi</h1>
            {unread > 0 && <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unread}</span>}
          </div>
          {unread > 0 && (
            <button onClick={() => setNotifs((p) => p.map((n) => ({ ...n, is_read: true })))} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-blue-600 hover:bg-blue-50">
              <CheckCheck className="w-3.5 h-3.5" />Baca semua
            </button>
          )}
        </div>
      </header>
      <div className="px-4 py-4 max-w-lg mx-auto space-y-2">
        {loading ? (
          <div className="space-y-2">{[0,1,2].map((i) => <div key={i} className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}</div>
        ) : notifs.length === 0 ? (
          <div className="flex flex-col items-center py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-4"><BellOff className="w-9 h-9 text-slate-400" strokeWidth={1.5} /></div>
            <p className="text-base font-bold text-slate-700">Tidak Ada Notifikasi</p>
          </div>
        ) : (
          notifs.map((n, i) => {
            const cfg = CFG[n.type];
            const Icon = cfg.icon;
            return (
              <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Link href={cfg.href} onClick={() => setNotifs((p) => p.map((x) => x.id === n.id ? { ...x, is_read: true } : x))}
                  className={cn("flex items-start gap-3 p-4 rounded-2xl border", !n.is_read ? "bg-blue-50/80 border-blue-100" : "bg-white border-slate-100")}>
                  <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", cfg.bg)}><Icon className={cn("w-5 h-5", cfg.color)} /></div>
                  <div className="flex-1 min-w-0 relative">
                    {!n.is_read && <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-blue-500" />}
                    <p className={cn("text-sm mb-0.5 pr-3", n.is_read ? "font-medium text-slate-700" : "font-bold text-slate-900")}>{n.title}</p>
                    <p className="text-xs text-slate-500 line-clamp-2">{n.body}</p>
                    <span className="text-[11px] text-slate-400 mt-1 block">{formatRelativeTime(n.created_at)}</span>
                  </div>
                </Link>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
