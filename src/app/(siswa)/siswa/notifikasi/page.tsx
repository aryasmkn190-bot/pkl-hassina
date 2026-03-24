"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
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
  Award,
  Settings,
  ChevronRight,
  BellOff,
  Loader2,
  ArrowLeft,
  Filter,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { formatRelativeTime, cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────── */

type NotifType =
  | "attendance"
  | "journal"
  | "absence"
  | "announcement"
  | "chat"
  | "assessment"
  | "system";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: NotifType;
  data: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

/* ─────────────────────────────────────────────────────────
   Notification type config
───────────────────────────────────────────────────────── */

const NOTIF_CONFIG: Record<
  NotifType,
  {
    icon: React.ElementType;
    color: string;
    bg: string;
    label: string;
    href: string;
  }
> = {
  attendance: {
    icon: Camera,
    color: "text-blue-600",
    bg: "bg-blue-100",
    label: "Presensi",
    href: "/siswa/presensi",
  },
  journal: {
    icon: BookOpen,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    label: "Jurnal",
    href: "/siswa/jurnal",
  },
  absence: {
    icon: ClipboardList,
    color: "text-orange-600",
    bg: "bg-orange-100",
    label: "Izin & Sakit",
    href: "/siswa/izin",
  },
  announcement: {
    icon: Megaphone,
    color: "text-purple-600",
    bg: "bg-purple-100",
    label: "Pengumuman",
    href: "/siswa/pengumuman",
  },
  chat: {
    icon: MessageCircle,
    color: "text-sky-600",
    bg: "bg-sky-100",
    label: "Pesan",
    href: "/siswa/chat",
  },
  assessment: {
    icon: Award,
    color: "text-amber-600",
    bg: "bg-amber-100",
    label: "Penilaian",
    href: "/siswa/profil",
  },
  system: {
    icon: Settings,
    color: "text-slate-600",
    bg: "bg-slate-100",
    label: "Sistem",
    href: "/siswa/dashboard",
  },
};

/* ─────────────────────────────────────────────────────────
   Placeholder data
───────────────────────────────────────────────────────── */

function generatePlaceholderNotifications(): Notification[] {
  return [
    {
      id: "1",
      title: "Presensi Masuk Diverifikasi ✅",
      body: "Presensi masuk Anda pada pukul 07:58 WIB telah diverifikasi oleh Ibu Sari Dewi.",
      type: "attendance",
      data: {},
      is_read: false,
      read_at: null,
      created_at: new Date(Date.now() - 3600000 * 0.5).toISOString(),
    },
    {
      id: "2",
      title: "Jurnal Perlu Direvisi ⚠️",
      body: "Ibu Sari Dewi memberikan catatan pada jurnal Anda tanggal kemarin. Harap lakukan revisi.",
      type: "journal",
      data: { journal_id: "j1" },
      is_read: false,
      read_at: null,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: "3",
      title: "Pengajuan Izin Disetujui ✅",
      body: "Pengajuan izin Anda untuk tanggal kemarin telah disetujui oleh guru pembimbing.",
      type: "absence",
      data: {},
      is_read: false,
      read_at: null,
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: "4",
      title: "Pengumuman Baru: Batas Pengumpulan Laporan",
      body: "Ada pengumuman baru dari ketua jurusan mengenai batas waktu pengumpulan laporan PKL.",
      type: "announcement",
      data: { announcement_id: "a1" },
      is_read: false,
      read_at: null,
      created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    },
    {
      id: "5",
      title: "Pesan Baru dari Ibu Sari Dewi",
      body: "Ibu Sari Dewi: Bagaimana progress jurnal minggu ini? Sudah lengkap?",
      type: "chat",
      data: { room_id: "r1" },
      is_read: true,
      read_at: new Date(Date.now() - 3600000 * 10).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 11).toISOString(),
    },
    {
      id: "6",
      title: "Jurnal Anda Telah Direview 👍",
      body: "Jurnal PKL tanggal 3 hari lalu mendapat rating 5/5 dari Ibu Sari Dewi. Pertahankan!",
      type: "journal",
      data: { journal_id: "j2" },
      is_read: true,
      read_at: new Date(Date.now() - 86400000).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
      id: "7",
      title: "Reminder: Isi Jurnal Hari Ini",
      body: "Jangan lupa isi jurnal kegiatan PKL hari ini sebelum pukul 21.00 WIB.",
      type: "system",
      data: {},
      is_read: true,
      read_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "8",
      title: "Penilaian Interim PKL Tersedia",
      body: "Guru pembimbing telah menginput nilai interim PKL Anda. Lihat detail di halaman profil.",
      type: "assessment",
      data: {},
      is_read: true,
      read_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: "9",
      title: "Selamat Datang di PKL SMK HASSINA! 🎉",
      body: "Akun Anda telah aktif. Mulai dengan mengisi presensi harian dan jurnal kegiatan PKL Anda.",
      type: "system",
      data: {},
      is_read: true,
      read_at: new Date(Date.now() - 86400000 * 7).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
  ];
}

/* ─────────────────────────────────────────────────────────
   Group notifications by date
───────────────────────────────────────────────────────── */

function groupByDate(notifications: Notification[]): Record<string, Notification[]> {
  const groups: Record<string, Notification[]> = {};
  const now = new Date();

  for (const notif of notifications) {
    const date = new Date(notif.created_at);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    let key: string;
    if (diffDays === 0) {
      key = "Hari Ini";
    } else if (diffDays === 1) {
      key = "Kemarin";
    } else if (diffDays < 7) {
      key = `${diffDays} Hari Lalu`;
    } else {
      key = "Lebih Lama";
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(notif);
  }

  return groups;
}

/* ─────────────────────────────────────────────────────────
   Notification Item
───────────────────────────────────────────────────────── */

interface NotifItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  index: number;
}

function NotifItem({ notification, onRead, onDelete, index }: NotifItemProps) {
  const cfg = NOTIF_CONFIG[notification.type];
  const Icon = cfg.icon;

  const [swiped, setSwiped] = useState(false);
  const [startX, setStartX] = useState<number | null>(null);
  const [offsetX, setOffsetX] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX === null) return;
    const diff = e.touches[0].clientX - startX;
    if (diff < 0) {
      setOffsetX(Math.max(diff, -80));
    }
  };

  const handleTouchEnd = () => {
    if (offsetX < -50) {
      setSwiped(true);
    } else {
      setOffsetX(0);
    }
    setStartX(null);
  };

  const handleClick = () => {
    if (!notification.is_read) {
      onRead(notification.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100, height: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Delete reveal (swipe action) */}
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center rounded-r-2xl">
        <button
          onClick={() => onDelete(notification.id)}
          className="flex flex-col items-center gap-1 text-white tap-highlight-none"
          aria-label="Hapus notifikasi"
        >
          <Trash2 className="w-4.5 h-4.5" />
          <span className="text-[10px] font-semibold">Hapus</span>
        </button>
      </div>

      {/* Main content */}
      <motion.div
        animate={{ x: swiped ? -80 : offsetX }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Link
          href={cfg.href}
          onClick={handleClick}
          className={cn(
            "flex items-start gap-3 p-4 relative",
            "transition-colors duration-150",
            "tap-highlight-none select-none",
            !notification.is_read
              ? "bg-blue-50/80 border border-blue-100"
              : "bg-white border border-slate-100",
            "rounded-2xl"
          )}
        >
          {/* Unread dot */}
          {!notification.is_read && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500"
              aria-label="Belum dibaca"
            />
          )}

          {/* Icon */}
          <div
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
              cfg.bg
            )}
            aria-hidden="true"
          >
            <Icon className={cn("w-5 h-5", cfg.color)} strokeWidth={2} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-4">
            <p
              className={cn(
                "text-sm leading-tight mb-0.5",
                notification.is_read
                  ? "font-medium text-slate-700"
                  : "font-bold text-slate-900"
              )}
            >
              {notification.title}
            </p>
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
              {notification.body}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                  cfg.bg,
                  cfg.color
                )}
              >
                {cfg.label}
              </span>
              <span className="text-[11px] text-slate-400">
                {formatRelativeTime(notification.created_at)}
              </span>
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Skeleton loader
───────────────────────────────────────────────────────── */

function NotifSkeleton() {
  return (
    <div className="space-y-2.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-100"
          aria-hidden="true"
        >
          <div className="w-11 h-11 rounded-xl bg-slate-100 animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2 pt-0.5">
            <div className="h-3.5 w-3/4 bg-slate-100 rounded animate-pulse" />
            <div className="h-3 w-full bg-slate-100 rounded animate-pulse" />
            <div className="h-3 w-2/3 bg-slate-100 rounded animate-pulse" />
            <div className="flex gap-2 mt-1">
              <div className="h-4 w-16 bg-slate-100 rounded-full animate-pulse" />
              <div className="h-4 w-12 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────── */

export default function NotifikasiPage() {
  const { profile } = useAuthStore();
  const supabase = createClient();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [filterType, setFilterType] = useState<NotifType | "all">("all");
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  /* ── Load notifications ────────────────────────────── */

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (!profile?.id) {
          setNotifications(generatePlaceholderNotifications());
          return;
        }

        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;

        if (data && data.length > 0) {
          setNotifications(data as Notification[]);
        } else {
          setNotifications(generatePlaceholderNotifications());
        }
      } catch {
        setNotifications(generatePlaceholderNotifications());
      } finally {
        setLoading(false);
      }
    }

    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [profile?.id]);

  /* ── Realtime subscription ─────────────────────────── */

  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`notifications:${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  /* ── Handlers ──────────────────────────────────────── */

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
      )
    );

    if (profile?.id) {
      await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", id);
    }
  };

  const handleDelete = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    if (profile?.id) {
      await supabase.from("notifications").delete().eq("id", id);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setMarkingAll(true);

    const now = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true, read_at: now }))
    );

    if (profile?.id) {
      await supabase
        .from("notifications")
        .update({ is_read: true, read_at: now })
        .eq("user_id", profile.id)
        .eq("is_read", false);
    }

    setMarkingAll(false);
  };

  const handleClearAll = async () => {
    const readNotifs = notifications.filter((n) => n.is_read);
    if (readNotifs.length === 0) return;

    const readIds = readNotifs.map((n) => n.id);
    setNotifications((prev) => prev.filter((n) => !n.is_read));

    if (profile?.id) {
      await supabase
        .from("notifications")
        .delete()
        .in("id", readIds);
    }
  };

  /* ── Filtered notifications ────────────────────────── */

  const filtered = notifications.filter((n) => {
    if (showOnlyUnread && n.is_read) return false;
    if (filterType !== "all" && n.type !== filterType) return false;
    return true;
  });

  const grouped = groupByDate(filtered);
  const groupKeys = Object.keys(grouped);

  /* ── Render ─────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/60">
        <div className="flex items-center gap-3 px-4 h-[60px]">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-[17px] font-bold text-slate-900">Notifikasi</h1>
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl",
                  "text-xs font-semibold text-blue-600",
                  "hover:bg-blue-50 transition-colors duration-150",
                  "disabled:opacity-50 tap-highlight-none"
                )}
                aria-label="Tandai semua sudah dibaca"
              >
                {markingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5" />
                )}
                Baca semua
              </button>
            )}

            <button
              onClick={handleClearAll}
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-xl",
                "text-slate-500 hover:bg-slate-100 hover:text-red-500",
                "transition-colors duration-150 tap-highlight-none"
              )}
              aria-label="Hapus notifikasi yang sudah dibaca"
            >
              <Trash2 className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Filter pills */}
        <div className="scroll-x flex gap-2 px-4 pb-3 pt-0">
          {/* All */}
          <button
            onClick={() => { setFilterType("all"); setShowOnlyUnread(false); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0",
              "border transition-all tap-highlight-none",
              filterType === "all" && !showOnlyUnread
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-white border-slate-200 text-slate-600"
            )}
          >
            Semua
            <span className={cn(
              "px-1.5 py-px rounded-full text-[10px] font-bold",
              filterType === "all" && !showOnlyUnread ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
            )}>
              {notifications.length}
            </span>
          </button>

          {/* Unread */}
          <button
            onClick={() => setShowOnlyUnread(!showOnlyUnread)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0",
              "border transition-all tap-highlight-none",
              showOnlyUnread
                ? "bg-red-500 border-red-500 text-white"
                : "bg-white border-slate-200 text-slate-600"
            )}
          >
            Belum Dibaca
            {unreadCount > 0 && (
              <span className={cn(
                "px-1.5 py-px rounded-full text-[10px] font-bold",
                showOnlyUnread ? "bg-white/20 text-white" : "bg-red-100 text-red-600"
              )}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Type filters */}
          {(["attendance", "journal", "absence", "announcement", "chat"] as NotifType[]).map((type) => {
            const cfg = NOTIF_CONFIG[type];
            const Icon = cfg.icon;
            const count = notifications.filter((n) => n.type === type).length;
            if (count === 0) return null;
            return (
              <button
                key={type}
                onClick={() => setFilterType(filterType === type ? "all" : type)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0",
                  "border transition-all tap-highlight-none",
                  filterType === type
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-slate-200 text-slate-600"
                )}
              >
                <Icon className="w-3 h-3" />
                {cfg.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="px-4 py-4 max-w-lg mx-auto">
        {loading ? (
          <NotifSkeleton />
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-4"
              aria-hidden="true"
            >
              <BellOff className="w-9 h-9 text-slate-400" strokeWidth={1.5} />
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base font-bold text-slate-700 mb-1.5"
            >
              {showOnlyUnread
                ? "Semua Notifikasi Sudah Dibaca"
                : "Tidak Ada Notifikasi"}
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.28 }}
              className="text-sm text-slate-400 max-w-xs leading-relaxed mb-5"
            >
              {showOnlyUnread
                ? "Tidak ada notifikasi yang belum dibaca. Semua sudah up-to-date!"
                : "Notifikasi akan muncul di sini saat ada aktivitas baru."}
            </motion.p>
            {showOnlyUnread && (
              <motion.button
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.36 }}
                onClick={() => setShowOnlyUnread(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-[0.97] transition-all tap-highlight-none"
              >
                Lihat Semua Notifikasi
              </motion.button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-5">
            {groupKeys.map((groupKey) => (
              <motion.div
                key={groupKey}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Group label */}
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-1">
                  {groupKey}
                </p>

                {/* Notifications in group */}
                <div className="space-y-2">
                  <AnimatePresence>
                    {grouped[groupKey].map((notif, i) => (
                      <NotifItem
                        key={notif.id}
                        notification={notif}
                        onRead={handleMarkRead}
                        onDelete={handleDelete}
                        index={i}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}

            {/* Swipe hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center text-xs text-slate-400 py-2"
            >
              ← Geser kiri untuk menghapus notifikasi
            </motion.p>

            <div className="h-4" />
          </div>
        )}
      </div>
    </div>
  );
}
