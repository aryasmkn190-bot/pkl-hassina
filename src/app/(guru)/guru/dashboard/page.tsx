"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  CheckSquare,
  ClipboardList,
  CalendarCheck,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BookOpen,
  Camera,
  Bell,
  MessageCircle,
  TrendingUp,
  Award,
  BarChart2,
  Eye,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import {
  formatDate,
  formatRelativeTime,
  getGreeting,
  calculateAttendancePercentage,
  cn,
} from "@/lib/utils";
import { StatCard, StatCardGrid, SectionHeader, InfoBanner } from "@/components/shared/stat-card";
import { Avatar, Skeleton, Progress, Badge } from "@/components/ui/card";

/* ─────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────── */

interface DashboardData {
  stats: {
    total_students: number;
    active_students: number;
    pending_attendance: number;
    pending_journals: number;
    pending_absences: number;
    unread_notifications: number;
    unread_messages: number;
  };
  students: Array<{
    id: string;
    name: string;
    avatar_url: string | null;
    nis: string;
    company_name: string;
    attendance_today: "hadir" | "belum" | "izin" | "sakit";
    attendance_pct: number;
    journals_submitted: number;
    journals_total: number;
    last_active: string;
  }>;
  pendingAttendance: Array<{
    id: string;
    student_name: string;
    student_avatar: string | null;
    type: "check_in" | "check_out";
    time: string;
    date: string;
    location: string | null;
  }>;
  pendingJournals: Array<{
    id: string;
    student_name: string;
    student_avatar: string | null;
    title: string;
    date: string;
    submitted_at: string;
  }>;
  pendingAbsences: Array<{
    id: string;
    student_name: string;
    student_avatar: string | null;
    type: string;
    reason: string;
    date: string;
    created_at: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: "attendance_verified" | "journal_reviewed" | "absence_approved" | "absence_rejected";
    student_name: string;
    description: string;
    time: string;
  }>;
}

/* ─────────────────────────────────────────────────────────
   Placeholder data
───────────────────────────────────────────────────────── */

function getPlaceholderData(): DashboardData {
  return {
    stats: {
      total_students: 12,
      active_students: 10,
      pending_attendance: 3,
      pending_journals: 5,
      pending_absences: 2,
      unread_notifications: 8,
      unread_messages: 4,
    },
    students: [
      {
        id: "1",
        name: "Ahmad Fadhil Maulana",
        avatar_url: null,
        nis: "20230045",
        company_name: "PT Teknologi Maju",
        attendance_today: "hadir",
        attendance_pct: 92,
        journals_submitted: 48,
        journals_total: 52,
        last_active: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "2",
        name: "Siti Rahayu Putri",
        avatar_url: null,
        nis: "20230046",
        company_name: "CV Digital Kreatif",
        attendance_today: "belum",
        attendance_pct: 85,
        journals_submitted: 42,
        journals_total: 52,
        last_active: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: "3",
        name: "Budi Santoso",
        avatar_url: null,
        nis: "20230047",
        company_name: "PT Solusi IT Nusantara",
        attendance_today: "hadir",
        attendance_pct: 97,
        journals_submitted: 51,
        journals_total: 52,
        last_active: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: "4",
        name: "Dewi Kusuma Wardani",
        avatar_url: null,
        nis: "20230048",
        company_name: "PT Teknologi Maju",
        attendance_today: "izin",
        attendance_pct: 78,
        journals_submitted: 40,
        journals_total: 52,
        last_active: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: "5",
        name: "Rizky Firmansyah",
        avatar_url: null,
        nis: "20230049",
        company_name: "Toko Elektronik Sejahtera",
        attendance_today: "hadir",
        attendance_pct: 90,
        journals_submitted: 45,
        journals_total: 52,
        last_active: new Date(Date.now() - 900000).toISOString(),
      },
    ],
    pendingAttendance: [
      {
        id: "a1",
        student_name: "Ahmad Fadhil Maulana",
        student_avatar: null,
        type: "check_in",
        time: "07:58",
        date: new Date().toISOString().split("T")[0],
        location: "Jl. Sudirman No. 5, Bandung",
      },
      {
        id: "a2",
        student_name: "Budi Santoso",
        student_avatar: null,
        type: "check_in",
        time: "08:02",
        date: new Date().toISOString().split("T")[0],
        location: "Jl. Asia Afrika No. 12, Bandung",
      },
      {
        id: "a3",
        student_name: "Rizky Firmansyah",
        student_avatar: null,
        type: "check_out",
        time: "17:05",
        date: new Date().toISOString().split("T")[0],
        location: "Jl. Diponegoro No. 8, Bandung",
      },
    ],
    pendingJournals: [
      {
        id: "j1",
        student_name: "Siti Rahayu Putri",
        student_avatar: null,
        title: "Desain UI/UX untuk Aplikasi Mobile",
        date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
        submitted_at: new Date(Date.now() - 3600000 * 18).toISOString(),
      },
      {
        id: "j2",
        student_name: "Dewi Kusuma Wardani",
        student_avatar: null,
        title: "Konfigurasi VPN Server Perusahaan",
        date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
        submitted_at: new Date(Date.now() - 3600000 * 20).toISOString(),
      },
      {
        id: "j3",
        student_name: "Ahmad Fadhil Maulana",
        student_avatar: null,
        title: "Backup Database dan Monitoring",
        date: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0],
        submitted_at: new Date(Date.now() - 3600000 * 44).toISOString(),
      },
      {
        id: "j4",
        student_name: "Rizky Firmansyah",
        student_avatar: null,
        title: "Perbaikan Jaringan Komputer",
        date: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0],
        submitted_at: new Date(Date.now() - 3600000 * 46).toISOString(),
      },
    ],
    pendingAbsences: [
      {
        id: "ab1",
        student_name: "Dewi Kusuma Wardani",
        student_avatar: null,
        type: "sick",
        reason: "Demam tinggi dan disarankan dokter untuk istirahat.",
        date: new Date().toISOString().split("T")[0],
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: "ab2",
        student_name: "Siti Rahayu Putri",
        student_avatar: null,
        type: "permission",
        reason: "Ada keperluan keluarga yang tidak bisa ditinggalkan.",
        date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
    ],
    recentActivity: [
      {
        id: "act1",
        type: "attendance_verified",
        student_name: "Budi Santoso",
        description: "Presensi masuk diverifikasi",
        time: new Date(Date.now() - 3600000 * 1).toISOString(),
      },
      {
        id: "act2",
        type: "journal_reviewed",
        student_name: "Ahmad Fadhil",
        description: "Jurnal mendapat feedback — Rating 5/5",
        time: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: "act3",
        type: "absence_approved",
        student_name: "Rizky Firmansyah",
        description: "Pengajuan izin disetujui",
        time: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: "act4",
        type: "attendance_verified",
        student_name: "Dewi Kusuma",
        description: "Presensi pulang diverifikasi",
        time: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
  };
}

/* ─────────────────────────────────────────────────────────
   Student attendance badge
───────────────────────────────────────────────────────── */

const attendanceBadgeMap: Record<string, { label: string; class: string }> = {
  hadir: { label: "Hadir", class: "bg-emerald-100 text-emerald-700" },
  belum: { label: "Belum Absen", class: "bg-amber-100 text-amber-700" },
  izin: { label: "Izin", class: "bg-blue-100 text-blue-700" },
  sakit: { label: "Sakit", class: "bg-red-100 text-red-700" },
};

/* ─────────────────────────────────────────────────────────
   Absence type label
───────────────────────────────────────────────────────── */

const absenceTypeLabel: Record<string, { label: string; emoji: string }> = {
  sick: { label: "Sakit", emoji: "🤒" },
  permission: { label: "Izin", emoji: "📝" },
  emergency: { label: "Darurat", emoji: "⚡" },
  other: { label: "Lainnya", emoji: "❓" },
};

/* ─────────────────────────────────────────────────────────
   Activity icon
───────────────────────────────────────────────────────── */

const activityConfig = {
  attendance_verified: {
    icon: CalendarCheck,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
  },
  journal_reviewed: {
    icon: BookOpen,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  absence_approved: {
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
  },
  absence_rejected: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-100",
  },
};

/* ─────────────────────────────────────────────────────────
   Pending Task Card (attendance/journal/absence)
───────────────────────────────────────────────────────── */

interface PendingCardProps {
  title: string;
  count: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  href: string;
  items: React.ReactNode;
  loading?: boolean;
}

function PendingCard({
  title,
  count,
  icon: Icon,
  color,
  bg,
  href,
  items,
  loading = false,
}: PendingCardProps) {
  const router = useRouter();

  if (count === 0 && !loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className={cn("flex items-center justify-between px-4 py-3.5", bg)}>
        <div className="flex items-center gap-2.5">
          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center bg-white/70")}>
            <Icon className={cn("w-4 h-4", color)} strokeWidth={2} />
          </div>
          <div>
            <p className={cn("text-sm font-bold", color)}>{title}</p>
            <p className="text-xs text-slate-500">
              {count} menunggu tindakan
            </p>
          </div>
        </div>
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className={cn(
            "text-lg font-extrabold px-3 py-1 rounded-full",
            bg,
            color
          )}
        >
          {count}
        </motion.span>
      </div>

      {/* Items */}
      <div className="divide-y divide-slate-50">
        {loading
          ? [0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          : items}
      </div>

      {/* See all */}
      <button
        onClick={() => router.push(href)}
        className={cn(
          "w-full flex items-center justify-center gap-1.5 py-3",
          "text-xs font-semibold",
          "border-t border-slate-100",
          "hover:bg-slate-50 transition-colors tap-highlight-none",
          color
        )}
      >
        Lihat Semua
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Student list row
───────────────────────────────────────────────────────── */

function StudentRow({
  student,
  index,
}: {
  student: DashboardData["students"][0];
  index: number;
}) {
  const router = useRouter();
  const badge = attendanceBadgeMap[student.attendance_today];
  const pct = student.attendance_pct;

  return (
    <motion.button
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.06,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileTap={{ scale: 0.98 }}
      onClick={() => router.push(`/guru/siswa/${student.id}`)}
      className={cn(
        "w-full flex items-center gap-3 p-4",
        "bg-white border border-slate-100 rounded-2xl shadow-sm",
        "hover:shadow-md hover:border-slate-200 hover:-translate-y-px",
        "active:scale-[0.98] transition-all duration-200",
        "tap-highlight-none text-left"
      )}
    >
      {/* Avatar + online indicator */}
      <div className="relative flex-shrink-0">
        <Avatar
          name={student.name}
          src={student.avatar_url ?? undefined}
          size="md"
        />
        {student.attendance_today === "hadir" && (
          <span
            className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <p className="text-sm font-bold text-slate-900 truncate leading-tight">
            {student.name}
          </p>
        </div>
        <p className="text-xs text-slate-400 leading-none mb-1.5">
          {student.company_name}
        </p>

        {/* Attendance mini progress */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                pct >= 90
                  ? "bg-emerald-400"
                  : pct >= 75
                  ? "bg-amber-400"
                  : "bg-red-400"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{
                duration: 1,
                delay: 0.2 + index * 0.05,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          </div>
          <span
            className={cn(
              "text-[10px] font-bold",
              pct >= 90
                ? "text-emerald-600"
                : pct >= 75
                ? "text-amber-600"
                : "text-red-600"
            )}
          >
            {pct}%
          </span>
        </div>
      </div>

      {/* Right: today status */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold",
            badge.class
          )}
        >
          {badge.label}
        </span>
        <span className="text-[10px] text-slate-400">
          {student.journals_submitted}/{student.journals_total} jurnal
        </span>
      </div>
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────
   Recent activity feed
───────────────────────────────────────────────────────── */

function ActivityFeed({
  activities,
  loading,
}: {
  activities: DashboardData["recentActivity"];
  loading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <SectionHeader title="Aktivitas Terbaru" className="mb-3" />

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-slate-100"
            >
              <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="py-8 text-center bg-white rounded-2xl border border-slate-100">
          <p className="text-sm text-slate-400">Belum ada aktivitas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((act, i) => {
            const cfg =
              activityConfig[act.type] ?? activityConfig.attendance_verified;
            const Icon = cfg.icon;

            return (
              <motion.div
                key={act.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.32,
                  delay: i * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm"
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                    cfg.bg
                  )}
                  aria-hidden="true"
                >
                  <Icon
                    className={cn("w-4 h-4", cfg.color)}
                    strokeWidth={2}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 leading-tight truncate">
                    {act.student_name}
                  </p>
                  <p className="text-xs text-slate-500 mt-px leading-snug">
                    {act.description}
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 whitespace-nowrap flex-shrink-0">
                  {formatRelativeTime(act.time)}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Attendance overview ring chart (simple)
───────────────────────────────────────────────────────── */

function AttendanceOverview({
  students,
  loading,
}: {
  students: DashboardData["students"];
  loading: boolean;
}) {
  const hadir = students.filter((s) => s.attendance_today === "hadir").length;
  const belum = students.filter((s) => s.attendance_today === "belum").length;
  const izin = students.filter((s) => s.attendance_today === "izin").length;
  const sakit = students.filter((s) => s.attendance_today === "sakit").length;
  const total = students.length;

  const pct = total > 0 ? Math.round((hadir / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-3xl p-5 shadow-lg shadow-emerald-200/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-0.5">
            Kehadiran Hari Ini
          </p>
          <p className="text-white text-2xl font-extrabold leading-none">
            {hadir}
            <span className="text-emerald-200 text-base font-semibold ml-1">
              / {total} siswa
            </span>
          </p>
          <p className="text-emerald-200 text-xs mt-1 font-medium">
            {formatDate(new Date(), "EEEE, dd MMMM yyyy")}
          </p>
        </div>
        <div className="text-right">
          <motion.p
            key={pct}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            className="text-4xl font-black text-white leading-none"
          >
            {pct}%
          </motion.p>
          <p className="text-emerald-200 text-[11px] font-medium mt-0.5">
            hadir
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 bg-white/20 rounded-full overflow-hidden mb-4">
        <motion.div
          className="h-full bg-white rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Stats breakdown */}
      {loading ? (
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 bg-white/10 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Hadir", value: hadir, color: "bg-emerald-400/30 text-white" },
            { label: "Belum", value: belum, color: "bg-amber-400/30 text-amber-100" },
            { label: "Izin", value: izin, color: "bg-blue-400/30 text-blue-100" },
            { label: "Sakit", value: sakit, color: "bg-red-400/30 text-red-100" },
          ].map((item) => (
            <div
              key={item.label}
              className={cn("rounded-xl p-2 text-center", item.color)}
            >
              <p className="text-lg font-extrabold leading-none">{item.value}</p>
              <p className="text-[10px] font-medium mt-0.5 opacity-90">{item.label}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Quick action buttons
───────────────────────────────────────────────────────── */

function QuickActions({
  stats,
}: {
  stats: DashboardData["stats"];
}) {
  const router = useRouter();

  const actions = [
    {
      label: "Verifikasi Presensi",
      icon: CalendarCheck,
      count: stats.pending_attendance,
      color: "text-blue-600",
      bg: "bg-blue-100",
      href: "/guru/presensi",
    },
    {
      label: "Review Jurnal",
      icon: CheckSquare,
      count: stats.pending_journals,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
      href: "/guru/jurnal",
    },
    {
      label: "Approval Izin",
      icon: ClipboardList,
      count: stats.pending_absences,
      color: "text-orange-600",
      bg: "bg-orange-100",
      href: "/guru/izin",
    },
    {
      label: "Pesan",
      icon: MessageCircle,
      count: stats.unread_messages,
      color: "text-purple-600",
      bg: "bg-purple-100",
      href: "/guru/chat",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2.5">
      {actions.map((action, i) => {
        const Icon = action.icon;
        const hasBadge = action.count > 0;

        return (
          <motion.button
            key={action.href}
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.05 + i * 0.05,
              ease: [0.34, 1.56, 0.64, 1],
            }}
            whileTap={{ scale: 0.92 }}
            onClick={() => router.push(action.href)}
            className={cn(
              "relative flex flex-col items-center gap-1.5 p-3 rounded-2xl",
              "bg-white border border-slate-100 shadow-sm",
              "hover:shadow-md hover:-translate-y-0.5",
              "active:scale-[0.95] transition-all duration-200",
              "tap-highlight-none"
            )}
            aria-label={action.label}
          >
            {hasBadge && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white"
              >
                {action.count > 99 ? "99+" : action.count}
              </motion.span>
            )}
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                action.bg
              )}
              aria-hidden="true"
            >
              <Icon className={cn("w-4.5 h-4.5", action.color)} strokeWidth={2} />
            </div>
            <p className="text-[10px] font-semibold text-slate-700 text-center leading-tight">
              {action.label}
            </p>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main Dashboard Page
───────────────────────────────────────────────────────── */

export default function GuruDashboardPage() {
  const { profile, isLoading: isAuthLoading } = useAuthStore();
  const router = useRouter();
  const supabase = createClient();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const firstName = profile?.full_name?.split(" ")[0] ?? "Guru";
  const greeting = getGreeting();

  /* ── Load data ─────────────────────────────────────── */

  const loadData = React.useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      if (!profile?.id) {
        setData(getPlaceholderData());
        return;
      }

      const placeholder = getPlaceholderData();

      const { data: teacherRow } = await supabase
        .from("teachers")
        .select("id")
        .eq("profile_id", profile.id)
        .single();
      const teacherId = teacherRow?.id;
      if (!teacherId) {
        setData(getPlaceholderData());
        return;
      }

      // ── 1. Ambil daftar siswa yang dibimbing guru ini ──
      const { data: assignments } = await supabase
        .from("pkl_assignments")
        .select(`
          id,
          status,
          start_date,
          end_date,
          students (
            id,
            nis,
            profiles (full_name, avatar_url)
          ),
          companies (name)
        `)
        .eq("teacher_id", teacherId)
        .in("status", ["active", "completed"]);

      const todayStr = new Date().toISOString().split("T")[0];
      const activeAssignments = (assignments ?? []).filter(
        (a) => a.status === "active"
      );

      // ── 2. Presensi hari ini untuk semua siswa ──
      const studentIds = activeAssignments
        .map((a) => (a.students as unknown as { id: string } | null)?.id)
        .filter(Boolean) as string[];

      const assignmentIds = activeAssignments.map((a) => a.id);

      const { data: todayAttendance } = studentIds.length
        ? await supabase
            .from("attendance")
            .select("student_id, type, status, created_at, address")
            .in("student_id", studentIds)
            .eq("date", todayStr)
        : { data: [] };

      // ── 3. Pending presensi (belum diverifikasi) ──
      const { data: pendingAtt } = studentIds.length
        ? await supabase
            .from("attendance")
            .select(`
              id, type, status, created_at, address,
              students (profiles (full_name, avatar_url))
            `)
            .in("student_id", studentIds)
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .limit(5)
        : { data: [] };

      // ── 4. Pending jurnal (submitted, belum di-review) ──
      const { data: pendingJournals } = studentIds.length
        ? await supabase
            .from("journals")
            .select(`
              id, title, date, submitted_at,
              students (profiles (full_name, avatar_url))
            `)
            .in("student_id", studentIds)
            .eq("status", "submitted")
            .order("submitted_at", { ascending: true })
            .limit(5)
        : { data: [] };

      // ── 5. Pending izin (belum di-approve) ──
      const { data: pendingAbsences } = studentIds.length
        ? await supabase
            .from("absence_requests")
            .select(`
              id, type, reason, date, created_at,
              students (profiles (full_name, avatar_url))
            `)
            .in("student_id", studentIds)
            .eq("status", "pending")
            .order("created_at", { ascending: true })
            .limit(5)
        : { data: [] };

      // ── 6. Notifikasi yang belum dibaca ──
      const { count: unreadNotif } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("is_read", false);

      // ── 7. Bangun daftar siswa dengan status kehadiran ──
      const students: DashboardData["students"] = activeAssignments.map((a) => {
        const s = a.students as unknown as {
          id: string;
          nis: string;
          profiles: { full_name: string; avatar_url: string | null } | null;
        } | null;
        const company = a.companies as unknown as { name: string } | null;
        const studentId = s?.id ?? "";

        const todayRecords = (todayAttendance ?? []).filter(
          (att) => att.student_id === studentId
        );
        const checkIn = todayRecords.find((r) => r.type === "check_in");
        const hasIzin = false; // bisa cek absence_requests jika perlu

        let attendance_today: "hadir" | "belum" | "izin" | "sakit" = "belum";
        if (checkIn?.status === "verified") attendance_today = "hadir";
        else if (hasIzin) attendance_today = "izin";

        return {
          id: studentId,
          name: s?.profiles?.full_name ?? "Siswa",
          avatar_url: s?.profiles?.avatar_url ?? null,
          nis: s?.nis ?? "",
          company_name: company?.name ?? "",
          attendance_today,
          attendance_pct: 0,  // Akan diisi dengan data stats jika perlu
          journals_submitted: 0,
          journals_total: 0,
          last_active: new Date().toISOString(),
        };
      });

      // ── 8. Build pendingAttendance list ──
      const pendingAttList: DashboardData["pendingAttendance"] = (
        pendingAtt ?? []
      ).map((att) => {
        const s = (att as unknown as {
          students: { profiles: { full_name: string; avatar_url: string | null } | null } | null;
        }).students;
        return {
          id: att.id,
          student_name: s?.profiles?.full_name ?? "Siswa",
          student_avatar: s?.profiles?.avatar_url ?? null,
          type: att.type as "check_in" | "check_out",
          time: new Date(att.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          date: todayStr,
          location: (att as unknown as { address: string | null }).address,
        };
      });

      // ── 9. Build pendingJournals list ──
      const pendingJournalsList: DashboardData["pendingJournals"] = (
        pendingJournals ?? []
      ).map((j) => {
        const s = (j as unknown as {
          students: { profiles: { full_name: string; avatar_url: string | null } | null } | null;
        }).students;
        return {
          id: j.id,
          student_name: s?.profiles?.full_name ?? "Siswa",
          student_avatar: s?.profiles?.avatar_url ?? null,
          title: j.title,
          date: j.date,
          submitted_at: j.submitted_at ?? new Date().toISOString(),
        };
      });

      // ── 10. Build pendingAbsences list ──
      const pendingAbsencesList: DashboardData["pendingAbsences"] = (
        pendingAbsences ?? []
      ).map((ab) => {
        const s = (ab as unknown as {
          students: { profiles: { full_name: string; avatar_url: string | null } | null } | null;
        }).students;
        return {
          id: ab.id,
          student_name: s?.profiles?.full_name ?? "Siswa",
          student_avatar: s?.profiles?.avatar_url ?? null,
          type: ab.type,
          reason: ab.reason,
          date: ab.date,
          created_at: ab.created_at,
        };
      });

      setData({
        stats: {
          total_students: assignments?.length ?? 0,
          active_students: activeAssignments.length,
          pending_attendance: pendingAttList.length,
          pending_journals: pendingJournalsList.length,
          pending_absences: pendingAbsencesList.length,
          unread_notifications: unreadNotif ?? 0,
          unread_messages: 0,
        },
        students,
        pendingAttendance: pendingAttList,
        pendingJournals: pendingJournalsList,
        pendingAbsences: pendingAbsencesList,
        recentActivity: placeholder.recentActivity, // TODO: ambil dari audit log jika ada
      });
      setLastRefresh(new Date());
    } catch (err) {
      console.error("loadData error:", err);
      setData(getPlaceholderData());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.id]); // depend on profile.id to avoid stale closures

  useEffect(() => {
    // Prevent fetching if auth is still synchronizing/loading
    if (isAuthLoading) return;

    loadData();
    // Auto-refresh every 2 minutes
    const interval = setInterval(() => loadData(true), 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData, isAuthLoading]);

  /* ── Render ─────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto">

        {/* ── Welcome Header ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-between"
        >
          <div>
            <p className="text-sm text-slate-500 font-medium">
              {greeting} 👋
            </p>
            <h1 className="text-xl font-extrabold text-slate-900 leading-tight mt-0.5">
              {firstName}!
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Guru Pembimbing PKL
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Refresh button */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => loadData(true)}
              disabled={refreshing}
              className={cn(
                "w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm",
                "flex items-center justify-center",
                "text-slate-500 hover:text-slate-700 hover:bg-slate-50",
                "transition-all duration-150 tap-highlight-none",
                "disabled:opacity-60"
              )}
              aria-label="Refresh data"
            >
              <RefreshCw
                className={cn(
                  "w-4 h-4",
                  refreshing && "animate-spin"
                )}
              />
            </motion.button>

            <Avatar
              name={profile?.full_name ?? "G"}
              src={profile?.avatar_url ?? undefined}
              size="lg"
            />
          </div>
        </motion.div>

        {/* ── Urgent alerts ──────────────────────────── */}
        {!loading && data && (data.stats.pending_absences > 0 || data.stats.pending_attendance > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-2"
          >
            {data.stats.pending_absences > 0 && (
              <InfoBanner
                type="warning"
                icon={AlertTriangle}
                title={`${data.stats.pending_absences} pengajuan izin/sakit menunggu persetujuan`}
                message="Segera tinjau dan berikan keputusan agar siswa mendapat kepastian."
                onDismiss={() => {}}
              />
            )}
          </motion.div>
        )}

        {/* ── Attendance overview ─────────────────────── */}
        <AttendanceOverview
          students={data?.students ?? []}
          loading={loading}
        />

        {/* ── Stats Grid ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <StatCardGrid cols={2}>
            <StatCard
              title="Total Siswa Binaan"
              value={loading ? "..." : String(data?.stats.total_students ?? 0)}
              subtitle={`${data?.stats.active_students ?? 0} aktif PKL`}
              icon={Users}
              color="blue"
              loading={loading}
              index={0}
            />
            <StatCard
              title="Jurnal Pending"
              value={loading ? "..." : String(data?.stats.pending_journals ?? 0)}
              subtitle="menunggu review"
              icon={BookOpen}
              color="green"
              loading={loading}
              index={1}
              onClick={() => router.push("/guru/jurnal")}
            />
            <StatCard
              title="Presensi Pending"
              value={loading ? "..." : String(data?.stats.pending_attendance ?? 0)}
              subtitle="menunggu verifikasi"
              icon={CalendarCheck}
              color="yellow"
              loading={loading}
              index={2}
              onClick={() => router.push("/guru/presensi")}
            />
            <StatCard
              title="Pengajuan Izin"
              value={loading ? "..." : String(data?.stats.pending_absences ?? 0)}
              subtitle="menunggu approval"
              icon={ClipboardList}
              color="red"
              loading={loading}
              index={3}
              onClick={() => router.push("/guru/izin")}
            />
          </StatCardGrid>
        </motion.div>

        {/* ── Quick Actions ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <SectionHeader title="Aksi Cepat" className="mb-3" />
          {data && <QuickActions stats={data.stats} />}
        </motion.div>

        {/* ── Pending Attendance ──────────────────────── */}
        {(loading || (data?.pendingAttendance.length ?? 0) > 0) && (
          <PendingCard
            title="Presensi Menunggu Verifikasi"
            count={data?.pendingAttendance.length ?? 0}
            icon={Camera}
            color="text-blue-700"
            bg="bg-blue-50"
            href="/guru/presensi"
            loading={loading}
            items={data?.pendingAttendance.map((att) => (
              <motion.div
                key={att.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <Avatar
                  name={att.student_name}
                  src={att.student_avatar ?? undefined}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
                    {att.student_name}
                  </p>
                  <p className="text-xs text-slate-500 mt-px">
                    {att.type === "check_in" ? "📥 Absen Masuk" : "📤 Absen Pulang"} •{" "}
                    {att.time} WIB
                  </p>
                  {att.location && (
                    <p className="text-[11px] text-slate-400 mt-px truncate">
                      📍 {att.location}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => router.push(`/guru/presensi`)}
                    className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-700 text-[11px] font-bold hover:bg-emerald-200 active:scale-[0.95] transition-all tap-highlight-none"
                    aria-label={`Verifikasi presensi ${att.student_name}`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    Setuju
                  </button>
                </div>
              </motion.div>
            ))}
          />
        )}

        {/* ── Pending Journals ────────────────────────── */}
        {(loading || (data?.pendingJournals.length ?? 0) > 0) && (
          <PendingCard
            title="Jurnal Menunggu Review"
            count={data?.pendingJournals.length ?? 0}
            icon={BookOpen}
            color="text-emerald-700"
            bg="bg-emerald-50"
            href="/guru/jurnal"
            loading={loading}
            items={data?.pendingJournals.map((journal, i) => (
              <motion.button
                key={journal.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => router.push(`/guru/jurnal/${journal.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left tap-highlight-none"
              >
                <Avatar
                  name={journal.student_name}
                  src={journal.student_avatar ?? undefined}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
                    {journal.student_name}
                  </p>
                  <p className="text-xs text-slate-700 truncate mt-px font-medium">
                    {journal.title}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-px">
                    {formatDate(journal.date, "dd MMM")} •{" "}
                    {formatRelativeTime(journal.submitted_at)}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
              </motion.button>
            ))}
          />
        )}

        {/* ── Pending Absences ────────────────────────── */}
        {(loading || (data?.pendingAbsences.length ?? 0) > 0) && (
          <PendingCard
            title="Pengajuan Izin / Sakit"
            count={data?.pendingAbsences.length ?? 0}
            icon={ClipboardList}
            color="text-orange-700"
            bg="bg-orange-50"
            href="/guru/izin"
            loading={loading}
            items={data?.pendingAbsences.map((abs) => {
              const typeInfo =
                absenceTypeLabel[abs.type] ?? absenceTypeLabel.other;

              return (
                <motion.div
                  key={abs.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-start gap-3 px-4 py-3"
                >
                  <Avatar
                    name={abs.student_name}
                    src={abs.student_avatar ?? undefined}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
                        {abs.student_name}
                      </p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                        {typeInfo.emoji} {typeInfo.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1 leading-snug">
                      {abs.reason}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {formatDate(abs.date, "dd MMM yyyy")} •{" "}
                      {formatRelativeTime(abs.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0 mt-0.5">
                    <button
                      onClick={() => router.push(`/guru/izin`)}
                      className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-emerald-100 text-emerald-700 text-[11px] font-bold hover:bg-emerald-200 active:scale-[0.95] transition-all tap-highlight-none"
                      aria-label="Setujui"
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => router.push(`/guru/izin`)}
                      className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-red-100 text-red-700 text-[11px] font-bold hover:bg-red-200 active:scale-[0.95] transition-all tap-highlight-none"
                      aria-label="Tolak"
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          />
        )}

        {/* ── Students Overview ───────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <SectionHeader
            title="Siswa Binaan"
            subtitle={`${data?.stats.total_students ?? 0} siswa`}
            action={{ label: "Lihat semua", onClick: () => router.push("/guru/siswa") }}
            className="mb-3"
          />

          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100"
                >
                  <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                  <Skeleton className="w-16 h-5 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {(data?.students ?? []).slice(0, 5).map((student, i) => (
                <StudentRow key={student.id} student={student} index={i} />
              ))}

              {(data?.students.length ?? 0) > 5 && (
                <button
                  onClick={() => router.push("/guru/siswa")}
                  className={cn(
                    "w-full py-3 rounded-2xl",
                    "border border-dashed border-slate-300",
                    "text-sm font-semibold text-slate-500",
                    "hover:bg-slate-50 hover:border-slate-400 hover:text-slate-700",
                    "active:scale-[0.98] transition-all tap-highlight-none"
                  )}
                >
                  + {(data?.students.length ?? 0) - 5} siswa lainnya
                </button>
              )}
            </div>
          )}
        </motion.div>

        {/* ── Recent Activity ─────────────────────────── */}
        <ActivityFeed
          activities={data?.recentActivity ?? []}
          loading={loading}
        />

        {/* Last refresh info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-slate-400 pb-2"
        >
          Terakhir diperbarui: {formatDate(lastRefresh, "HH:mm")} WIB
        </motion.p>

        {/* Bottom spacer */}
        <div className="h-4" />
      </div>
    </div>
  );
}
