"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Camera,
  BookOpen,
  ClipboardList,
  Bell,
  ChevronRight,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  FileText,
  MessageCircle,
  MapPin,
  Award,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { useStudentContext } from "@/lib/hooks/use-student-context";
import {
  getStudentDashboardStats,
  getAttendanceHistory,
} from "@/lib/supabase/queries";
import {
  formatDate,
  formatTime,
  getGreeting,
  calculateAttendancePercentage,
  cn,
} from "@/lib/utils";
import { StatCard, StatCardGrid, SectionHeader, InfoBanner } from "@/components/shared/stat-card";
import { Card, Badge, Progress, Avatar, Skeleton } from "@/components/ui/card";

/* ─────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────── */

interface DashboardData {
  pklAssignment: {
    id: string;
    company_name: string;
    company_city: string;
    company_logo: string | null;
    supervisor_name: string | null;
    teacher_name: string;
    start_date: string;
    end_date: string;
    status: string;
  } | null;
  stats: {
    total_days: number;
    present_days: number;
    absent_days: number;
    permission_days: number;
    sick_days: number;
    total_journals: number;
    submitted_journals: number;
    pending_journals: number;
    unread_notifications: number;
    pending_absences: number;
  };
  todayAttendance: {
    check_in: { time: string; status: string } | null;
    check_out: { time: string; status: string } | null;
  };
  recentJournals: Array<{
    id: string;
    date: string;
    title: string;
    status: string;
  }>;
  recentAnnouncements: Array<{
    id: string;
    title: string;
    type: string;
    published_at: string;
    is_pinned: boolean;
  }>;
  monthCalendar: Array<{
    date: string;
    status: "hadir" | "sakit" | "izin" | "alfa" | "weekend" | "future" | "today";
  }>;
}

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */

function getPKLProgress(startDate: string, endDate: string): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

function getRemainingDays(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

/* ─────────────────────────────────────────────────────────
   PKL Info Card
───────────────────────────────────────────────────────── */

function PKLInfoCard({
  assignment,
  loading,
}: {
  assignment: DashboardData["pklAssignment"];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 p-5">
        <div className="space-y-3">
          <Skeleton className="h-5 w-32 bg-white/20" />
          <Skeleton className="h-8 w-48 bg-white/20" />
          <Skeleton className="h-3 w-full bg-white/20 rounded-full" />
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="rounded-3xl p-5 bg-amber-50 border border-amber-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Belum Ada Penempatan PKL
            </p>
            <p className="text-xs text-amber-600 mt-0.5 leading-snug">
              Hubungi guru pembimbing atau ketua jurusan Anda untuk informasi
              penempatan.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const progress = getPKLProgress(assignment.start_date, assignment.end_date);
  const remaining = getRemainingDays(assignment.end_date);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 p-5 shadow-lg shadow-blue-200/50"
    >
      {/* Background decoration */}
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20"
        style={{ background: "rgba(255,255,255,0.4)" }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-10"
        style={{ background: "rgba(255,255,255,0.5)" }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            {/* Company logo or placeholder */}
            {assignment.company_logo ? (
              <img
                src={assignment.company_logo}
                alt={assignment.company_name}
                className="w-10 h-10 rounded-xl object-cover border-2 border-white/30 bg-white"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-blue-100 uppercase tracking-wider leading-none mb-1">
                Tempat PKL
              </p>
              <p className="text-[15px] font-bold text-white leading-tight truncate max-w-[180px]">
                {assignment.company_name}
              </p>
            </div>
          </div>

          {/* Remaining days badge */}
          <div className="flex-shrink-0 text-center">
            <p className="text-2xl font-extrabold text-white leading-none">
              {remaining}
            </p>
            <p className="text-[10px] text-blue-100 font-medium mt-0.5 leading-none">
              hari lagi
            </p>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-1 text-blue-100">
            <MapPin className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            <span className="text-xs font-medium">{assignment.company_city}</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-blue-200/60" aria-hidden="true" />
          <div className="flex items-center gap-1 text-blue-100">
            <Calendar className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            <span className="text-xs font-medium">
              s/d {formatDate(assignment.end_date, "dd MMM yyyy")}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-blue-100 font-medium">
              Progress PKL
            </span>
            <span className="text-xs font-bold text-white">{progress}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-blue-200">
              {formatDate(assignment.start_date, "dd MMM")}
            </span>
            <span className="text-[10px] text-blue-200">
              {formatDate(assignment.end_date, "dd MMM yyyy")}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Today's Attendance Card
───────────────────────────────────────────────────────── */

function TodayAttendanceCard({
  todayAttendance,
  loading,
}: {
  todayAttendance: DashboardData["todayAttendance"];
  loading: boolean;
}) {
  const router = useRouter();
  const now = new Date();
  const today = formatDate(now, "EEEE, dd MMMM yyyy");

  if (loading) {
    return (
      <div className="card-base p-4 space-y-3">
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-3">
          <Skeleton className="h-16 flex-1 rounded-2xl" />
          <Skeleton className="h-16 flex-1 rounded-2xl" />
        </div>
      </div>
    );
  }

  const checkIn = todayAttendance.check_in;
  const checkOut = todayAttendance.check_out;
  const hasCheckIn = !!checkIn;
  const hasCheckOut = !!checkOut;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="card-base p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[13px] font-bold text-slate-800">Presensi Hari Ini</p>
          <p className="text-xs text-slate-400">{today}</p>
        </div>
        {hasCheckIn && hasCheckOut ? (
          <span className="badge-base bg-emerald-100 text-emerald-700 text-[11px]">
            ✓ Lengkap
          </span>
        ) : hasCheckIn ? (
          <span className="badge-base bg-amber-100 text-amber-700 text-[11px]">
            Belum Pulang
          </span>
        ) : (
          <span className="badge-base bg-slate-100 text-slate-500 text-[11px]">
            Belum Absen
          </span>
        )}
      </div>

      {/* Check In / Check Out */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Check In */}
        <button
          onClick={() => !hasCheckIn && router.push("/siswa/presensi")}
          className={cn(
            "relative flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-2xl",
            "transition-all duration-200",
            "tap-highlight-none select-none",
            hasCheckIn
              ? "bg-emerald-50 border border-emerald-200 cursor-default"
              : "bg-blue-50 border border-blue-200 hover:bg-blue-100 active:scale-[0.97]"
          )}
          disabled={hasCheckIn}
          aria-label={hasCheckIn ? `Sudah check in pukul ${checkIn.time}` : "Check in sekarang"}
        >
          {hasCheckIn ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" aria-hidden="true" />
          ) : (
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Camera className="w-5 h-5 text-blue-500" aria-hidden="true" />
            </motion.div>
          )}
          <span
            className={cn(
              "text-[11px] font-semibold",
              hasCheckIn ? "text-emerald-700" : "text-blue-600"
            )}
          >
            Masuk
          </span>
          {hasCheckIn ? (
            <span className="text-sm font-bold text-emerald-800 leading-none">
              {checkIn.time}
            </span>
          ) : (
            <span className="text-[11px] text-blue-400">Tap untuk absen</span>
          )}

          {/* Pulse ring jika belum check in */}
          {!hasCheckIn && (
            <span
              className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500"
              aria-hidden="true"
            >
              <motion.span
                className="absolute inset-0 rounded-full bg-blue-500"
                animate={{ scale: [1, 2, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </span>
          )}
        </button>

        {/* Check Out */}
        <button
          onClick={() => hasCheckIn && !hasCheckOut && router.push("/siswa/presensi?type=check_out")}
          className={cn(
            "relative flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-2xl",
            "transition-all duration-200",
            "tap-highlight-none select-none",
            hasCheckOut
              ? "bg-emerald-50 border border-emerald-200 cursor-default"
              : hasCheckIn
              ? "bg-orange-50 border border-orange-200 hover:bg-orange-100 active:scale-[0.97]"
              : "bg-slate-50 border border-slate-200 cursor-not-allowed opacity-60"
          )}
          disabled={!hasCheckIn || hasCheckOut}
          aria-label={
            hasCheckOut
              ? `Sudah check out pukul ${checkOut!.time}`
              : hasCheckIn
              ? "Check out sekarang"
              : "Check in dahulu sebelum check out"
          }
        >
          {hasCheckOut ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" aria-hidden="true" />
          ) : (
            <Clock
              className={cn(
                "w-5 h-5",
                hasCheckIn ? "text-orange-500" : "text-slate-400"
              )}
              aria-hidden="true"
            />
          )}
          <span
            className={cn(
              "text-[11px] font-semibold",
              hasCheckOut
                ? "text-emerald-700"
                : hasCheckIn
                ? "text-orange-600"
                : "text-slate-400"
            )}
          >
            Pulang
          </span>
          {hasCheckOut ? (
            <span className="text-sm font-bold text-emerald-800 leading-none">
              {checkOut!.time}
            </span>
          ) : (
            <span
              className={cn(
                "text-[11px]",
                hasCheckIn ? "text-orange-400" : "text-slate-400"
              )}
            >
              {hasCheckIn ? "Tap untuk absen" : "Belum tersedia"}
            </span>
          )}
        </button>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Quick Actions
───────────────────────────────────────────────────────── */

interface QuickAction {
  href: string;
  icon: React.ElementType;
  label: string;
  color: string;
  bgColor: string;
  description: string;
  badge?: number;
}

function QuickActions({ pendingAbsences }: { pendingAbsences: number }) {
  const router = useRouter();

  const actions: QuickAction[] = [
    {
      href: "/siswa/presensi",
      icon: Camera,
      label: "Presensi",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      description: "Absen selfie",
    },
    {
      href: "/siswa/jurnal/buat",
      icon: BookOpen,
      label: "Jurnal",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      description: "Isi jurnal",
    },
    {
      href: "/siswa/izin/buat",
      icon: ClipboardList,
      label: "Izin/Sakit",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      description: "Ajukan izin",
      badge: pendingAbsences > 0 ? pendingAbsences : undefined,
    },
    {
      href: "/siswa/pengumuman",
      icon: Bell,
      label: "Pengumuman",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      description: "Lihat info",
    },
    {
      href: "/siswa/chat",
      icon: MessageCircle,
      label: "Chat",
      color: "text-sky-600",
      bgColor: "bg-sky-100",
      description: "Kirim pesan",
    },
    {
      href: "/siswa/dokumen",
      icon: FileText,
      label: "Dokumen",
      color: "text-pink-600",
      bgColor: "bg-pink-100",
      description: "Unduh file",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {actions.map((action, i) => {
        const Icon = action.icon;
        return (
          <motion.div
            key={action.href}
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.05 + i * 0.05,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          >
            <Link
              href={action.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-2",
                "p-3.5 rounded-2xl",
                "bg-white border border-slate-100 shadow-sm",
                "hover:shadow-md hover:-translate-y-0.5",
                "active:scale-[0.95] transition-all duration-200",
                "tap-highlight-none select-none"
              )}
              aria-label={action.label}
            >
              {/* Badge */}
              {action.badge !== undefined && action.badge > 0 && (
                <span className="absolute top-2 right-2 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                  {action.badge}
                </span>
              )}

              {/* Icon */}
              <div
                className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center",
                  action.bgColor
                )}
                aria-hidden="true"
              >
                <Icon className={cn("w-5 h-5", action.color)} strokeWidth={2} />
              </div>

              {/* Label */}
              <div className="text-center">
                <p className="text-xs font-semibold text-slate-800 leading-none">
                  {action.label}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-none">
                  {action.description}
                </p>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Mini Attendance Calendar
───────────────────────────────────────────────────────── */

const statusColorMap: Record<string, string> = {
  hadir: "calendar-day-hadir",
  sakit: "calendar-day-sakit",
  izin: "calendar-day-izin",
  alfa: "calendar-day-alfa",
  today: "calendar-day-today",
  weekend: "calendar-day-weekend text-slate-300",
  future: "text-slate-300 cursor-default",
};

function MiniCalendar({
  calendar,
  loading,
}: {
  calendar: DashboardData["monthCalendar"];
  loading: boolean;
}) {
  const now = new Date();
  const monthName = formatDate(now, "MMMM yyyy");
  const dayLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const legendItems = [
    { color: "bg-emerald-500", label: "Hadir" },
    { color: "bg-amber-500", label: "Sakit" },
    { color: "bg-sky-500", label: "Izin" },
    { color: "bg-red-500", label: "Alfa" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="card-base p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[13px] font-bold text-slate-800">
            Kalender Kehadiran
          </p>
          <p className="text-xs text-slate-400 capitalize">{monthName}</p>
        </div>
        <Link
          href="/siswa/presensi/riwayat"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors tap-highlight-none"
        >
          Lihat semua
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : (
        <>
          {/* Day labels */}
          <div className="calendar-grid mb-1">
            {dayLabels.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-bold text-slate-400 py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="calendar-grid">
            {calendar.map((day, i) => {
              const dayNum = new Date(day.date).getDate();
              return (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.3,
                    delay: i * 0.01,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                  className={cn(
                    "calendar-day text-xs font-semibold",
                    statusColorMap[day.status] ?? "text-slate-700"
                  )}
                  title={`${day.date}: ${day.status}`}
                >
                  {dayNum}
                </motion.div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 flex-wrap mt-3 pt-3 border-t border-slate-100">
            {legendItems.map((item) => (
              <div key={item.label} className="flex items-center gap-1">
                <span
                  className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", item.color)}
                  aria-hidden="true"
                />
                <span className="text-[11px] text-slate-500">{item.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Recent Journals
───────────────────────────────────────────────────────── */

const journalStatusMap: Record<string, { label: string; class: string }> = {
  draft: { label: "Draft", class: "bg-slate-100 text-slate-600" },
  submitted: { label: "Terkirim", class: "bg-blue-100 text-blue-700" },
  reviewed: { label: "Direview", class: "bg-emerald-100 text-emerald-700" },
  revision: { label: "Revisi", class: "bg-amber-100 text-amber-700" },
};

function RecentJournals({
  journals,
  loading,
}: {
  journals: DashboardData["recentJournals"];
  loading: boolean;
}) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <SectionHeader
        title="Jurnal Terbaru"
        action={{ label: "Lihat semua", onClick: () => router.push("/siswa/jurnal") }}
      />

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card-base p-4 flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : journals.length === 0 ? (
        <div className="card-base p-6 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">Belum ada jurnal</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Mulai isi jurnal kegiatan PKL Anda
          </p>
          <button
            onClick={() => router.push("/siswa/jurnal/buat")}
            className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            + Buat Jurnal Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {journals.map((journal, i) => {
            const statusInfo =
              journalStatusMap[journal.status] ?? journalStatusMap.draft;

            return (
              <motion.div
                key={journal.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={`/siswa/jurnal/${journal.id}`}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl",
                    "bg-white border border-slate-100 shadow-sm",
                    "hover:shadow-md hover:border-slate-200 hover:-translate-y-px",
                    "active:scale-[0.98] transition-all duration-200",
                    "tap-highlight-none"
                  )}
                >
                  {/* Date circle */}
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[13px] font-extrabold text-blue-700 leading-none">
                      {new Date(journal.date).getDate()}
                    </span>
                    <span className="text-[9px] font-bold text-blue-400 uppercase leading-none">
                      {formatDate(journal.date, "MMM")}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
                      {journal.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDate(journal.date, "EEEE, dd MMMM")}
                    </p>
                  </div>

                  {/* Status badge + chevron */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={cn(
                        "badge-base text-[10px]",
                        statusInfo.class
                      )}
                    >
                      {statusInfo.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300" aria-hidden="true" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Recent Announcements
───────────────────────────────────────────────────────── */

const announcementTypeMap: Record<
  string,
  { label: string; class: string; icon: string }
> = {
  urgent: { label: "Penting", class: "bg-red-100 text-red-700", icon: "🔴" },
  general: { label: "Umum", class: "bg-blue-100 text-blue-700", icon: "📢" },
  event: { label: "Kegiatan", class: "bg-purple-100 text-purple-700", icon: "📅" },
  reminder: { label: "Pengingat", class: "bg-amber-100 text-amber-700", icon: "⏰" },
};

function RecentAnnouncements({
  announcements,
  loading,
}: {
  announcements: DashboardData["recentAnnouncements"];
  loading: boolean;
}) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
    >
      <SectionHeader
        title="Pengumuman"
        action={{
          label: "Lihat semua",
          onClick: () => router.push("/siswa/pengumuman"),
        }}
      />

      {loading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="card-base p-4 space-y-2">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="card-base p-5 text-center">
          <p className="text-sm text-slate-500">Belum ada pengumuman</p>
        </div>
      ) : (
        <div className="space-y-2">
          {announcements.map((ann, i) => {
            const typeInfo =
              announcementTypeMap[ann.type] ?? announcementTypeMap.general;

            return (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={`/siswa/pengumuman/${ann.id}`}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-2xl",
                    "bg-white border border-slate-100 shadow-sm",
                    "hover:shadow-md hover:border-slate-200",
                    "active:scale-[0.98] transition-all duration-200",
                    "tap-highlight-none"
                  )}
                >
                  {/* Icon */}
                  <span className="text-xl flex-shrink-0 mt-0.5" aria-hidden="true">
                    {typeInfo.icon}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {ann.is_pinned && (
                        <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full">
                          📌 Pin
                        </span>
                      )}
                      <span className={cn("badge-base text-[10px]", typeInfo.class)}>
                        {typeInfo.label}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">
                      {ann.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatDate(ann.published_at, "dd MMM yyyy")}
                    </p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" aria-hidden="true" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Attendance Progress Widget
───────────────────────────────────────────────────────── */

function AttendanceSummary({
  stats,
  loading,
}: {
  stats: DashboardData["stats"];
  loading: boolean;
}) {
  const percentage = calculateAttendancePercentage(
    stats.present_days,
    stats.total_days
  );

  const isGood = percentage >= 90;
  const isWarning = percentage >= 75 && percentage < 90;
  const isBad = percentage < 75;

  const progressColor = isGood ? "secondary" : isWarning ? "accent" : "danger";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="card-base p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] font-bold text-slate-800">Rekap Kehadiran</p>
        <Link
          href="/siswa/presensi/riwayat"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors tap-highlight-none"
        >
          Detail
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      ) : (
        <>
          {/* Percentage + Alert */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-baseline gap-1">
              <motion.span
                key={percentage}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={cn(
                  "text-3xl font-extrabold leading-none",
                  isGood
                    ? "text-emerald-600"
                    : isWarning
                    ? "text-amber-600"
                    : "text-red-600"
                )}
              >
                {percentage}%
              </motion.span>
              <span className="text-xs text-slate-400 font-medium">kehadiran</span>
            </div>
            {isBad && (
              <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                <AlertCircle className="w-3 h-3" aria-hidden="true" />
                <span className="text-[11px] font-bold">Di bawah batas!</span>
              </div>
            )}
            {isGood && (
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                <Award className="w-3 h-3" aria-hidden="true" />
                <span className="text-[11px] font-bold">Sangat baik!</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <Progress value={percentage} color={progressColor} size="default" />

          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[
              { label: "Hadir", value: stats.present_days, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Sakit", value: stats.sick_days, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Izin", value: stats.permission_days, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Alfa", value: stats.absent_days, color: "text-red-600", bg: "bg-red-50" },
            ].map((item) => (
              <div
                key={item.label}
                className={cn("rounded-xl p-2.5 text-center", item.bg)}
              >
                <p className={cn("text-lg font-extrabold leading-none", item.color)}>
                  {item.value}
                </p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main Dashboard Page
───────────────────────────────────────────────────────── */

// Placeholder data saat Supabase belum dikonfigurasi
function getPlaceholderData(): DashboardData {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const calendar: DashboardData["monthCalendar"] = [];

  // Padding di awal bulan
  for (let i = 0; i < firstDayOfWeek; i++) {
    const d = new Date(year, month, -(firstDayOfWeek - 1 - i));
    calendar.push({ date: d.toISOString(), status: "future" });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const isToday = d === today.getDate();
    const dayOfWeek = date.getDay();
    const isPast = date < today && !isToday;
    const isFuture = date > today;

    let status: DashboardData["monthCalendar"][number]["status"] = "future";

    if (isToday) {
      status = "today";
    } else if (dayOfWeek === 0 || dayOfWeek === 6) {
      status = "weekend";
    } else if (isFuture) {
      status = "future";
    } else if (isPast) {
      const rand = Math.random();
      if (rand > 0.15) status = "hadir";
      else if (rand > 0.08) status = "izin";
      else status = "sakit";
    }

    calendar.push({ date: date.toISOString(), status });
  }

  const startDate = new Date(year, month - 2, 1).toISOString().split("T")[0];
  const endDate = new Date(year, month + 4, 30).toISOString().split("T")[0];

  return {
    pklAssignment: {
      id: "placeholder",
      company_name: "PT Teknologi Maju Bersama",
      company_city: "Bandung",
      company_logo: null,
      supervisor_name: "Bapak Andi Pratama",
      teacher_name: "Ibu Sari Dewi, S.Kom",
      start_date: startDate,
      end_date: endDate,
      status: "active",
    },
    stats: {
      total_days: 45,
      present_days: 41,
      absent_days: 1,
      permission_days: 2,
      sick_days: 1,
      total_journals: 41,
      submitted_journals: 38,
      pending_journals: 3,
      unread_notifications: 5,
      pending_absences: 1,
    },
    todayAttendance: {
      check_in: null,
      check_out: null,
    },
    recentJournals: [
      {
        id: "1",
        date: new Date(Date.now() - 86400000).toISOString(),
        title: "Instalasi dan Konfigurasi Server Linux",
        status: "reviewed",
      },
      {
        id: "2",
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        title: "Troubleshooting Jaringan Kantor",
        status: "submitted",
      },
      {
        id: "3",
        date: new Date(Date.now() - 86400000 * 3).toISOString(),
        title: "Backup Data Server Harian",
        status: "revision",
      },
    ],
    recentAnnouncements: [
      {
        id: "1",
        title: "Pengumpulan Laporan PKL Tahap 1 - Batas Waktu 30 Hari",
        type: "urgent",
        published_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        is_pinned: true,
      },
      {
        id: "2",
        title: "Jadwal Kunjungan Guru Pembimbing ke Perusahaan",
        type: "event",
        published_at: new Date(Date.now() - 86400000).toISOString(),
        is_pinned: false,
      },
      {
        id: "3",
        title: "Pengingat: Jurnal Harian Wajib Diisi Setiap Hari",
        type: "reminder",
        published_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        is_pinned: false,
      },
    ],
    monthCalendar: calendar,
  };
}

export default function SiswaDashboardPage() {
  const { profile } = useAuthStore();
  const supabase = createClient();
  const { context: studentCtx } = useStudentContext();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const firstName = profile?.full_name?.split(" ")[0] ?? "Siswa";
  const greeting = getGreeting();

  useEffect(() => {
    async function loadDashboard() {
      try {
        if (!profile?.id) {
          setData(getPlaceholderData());
          setLoading(false);
          return;
        }

        // Ambil PKL assignment aktif (via studentCtx jika sudah siap)
        const { data: assignment } = await supabase
          .from("pkl_assignments")
          .select(`
            id,
            start_date,
            end_date,
            status,
            supervisor_name,
            companies (name, city, logo_url),
            teachers (profiles (full_name))
          `)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Ambil presensi hari ini
        const todayStr = new Date().toISOString().split("T")[0];
        let todayAttendanceQuery = supabase
          .from("attendance")
          .select("type, created_at, status")
          .eq("date", todayStr)
          .order("created_at");

        if (studentCtx) {
          todayAttendanceQuery = todayAttendanceQuery
            .eq("student_id", studentCtx.studentId)
            .eq("pkl_assignment_id", studentCtx.pklAssignmentId);
        }

        const { data: todayAttendance } = await todayAttendanceQuery;

        const checkIn = todayAttendance?.find((a: { type: string }) => a.type === "check_in");
        const checkOut = todayAttendance?.find((a: { type: string }) => a.type === "check_out");

        // Ambil jurnal terbaru
        let journalQuery = supabase
          .from("journals")
          .select("id, date, title, status")
          .order("date", { ascending: false })
          .limit(3);

        if (studentCtx) {
          journalQuery = journalQuery
            .eq("student_id", studentCtx.studentId)
            .eq("pkl_assignment_id", studentCtx.pklAssignmentId);
        }

        const { data: journals } = await journalQuery;

        // Ambil pengumuman terbaru
        const { data: announcements } = await supabase
          .from("announcements")
          .select("id, title, type, published_at, is_pinned")
          .order("is_pinned", { ascending: false })
          .order("published_at", { ascending: false })
          .limit(3);

        // Ambil stats real jika studentCtx tersedia
        let stats = {
          total_days: 0,
          present_days: 0,
          absent_days: 0,
          permission_days: 0,
          sick_days: 0,
          total_journals: 0,
          submitted_journals: 0,
          pending_journals: 0,
          unread_notifications: 0,
          pending_absences: 0,
        };

        if (studentCtx) {
          const realStats = await getStudentDashboardStats(
            studentCtx.studentId,
            studentCtx.pklAssignmentId
          );

          // Hitung pending absences
          const { count: pendingAbsCount } = await supabase
            .from("absence_requests")
            .select("*", { count: "exact", head: true })
            .eq("student_id", studentCtx.studentId)
            .eq("status", "pending");

          stats = {
            total_days: realStats.total_days,
            present_days: realStats.present_days,
            absent_days: realStats.absent_days,
            permission_days: realStats.permission_days,
            sick_days: realStats.sick_days,
            total_journals: realStats.total_journals,
            submitted_journals: realStats.submitted_journals,
            pending_journals: realStats.pending_journals,
            unread_notifications: Number(realStats.unread_notifications),
            pending_absences: pendingAbsCount ?? 0,
          };
        }

        // Buat kalender bulan ini dari data kehadiran real
        let monthCalendar: DashboardData["monthCalendar"] = [];
        if (studentCtx) {
          const now = new Date();
          const attendanceHistory = await getAttendanceHistory(
            studentCtx.studentId,
            now.getMonth() + 1,
            now.getFullYear()
          );
          const { data: absenceHistory } = await supabase
            .from("absence_requests")
            .select("date, type, status")
            .eq("student_id", studentCtx.studentId)
            .gte("date", `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`)
            .lte("date", `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-31`);

          const year = now.getFullYear();
          const month = now.getMonth();
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const firstDayOfWeek = new Date(year, month, 1).getDay();

          // Padding awal
          for (let i = 0; i < firstDayOfWeek; i++) {
            const d = new Date(year, month, -(firstDayOfWeek - 1 - i));
            monthCalendar.push({ date: d.toISOString(), status: "future" });
          }

          for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const isToday = d === now.getDate();
            const dayOfWeek = date.getDay();
            const isFuture = date > now && !isToday;

            let status: DashboardData["monthCalendar"][number]["status"] = "future";

            if (isToday) {
              status = "today";
            } else if (dayOfWeek === 0 || dayOfWeek === 6) {
              status = "weekend";
            } else if (isFuture) {
              status = "future";
            } else {
              // Cek dari data nyata
              const hasHadir = attendanceHistory.some(
                (a) => a.date === dateStr && a.type === "check_in" && a.status === "verified"
              );
              const absence = absenceHistory?.find((ab) => ab.date === dateStr && ab.status === "approved");

              if (hasHadir) status = "hadir";
              else if (absence?.type === "sick") status = "sakit";
              else if (absence) status = "izin";
              else status = "alfa";
            }

            monthCalendar.push({ date: date.toISOString(), status });
          }
        } else {
          // Fallback placeholder kalender
          monthCalendar = getPlaceholderData().monthCalendar;
        }

        const placeholder = getPlaceholderData();

        setData({
          pklAssignment: assignment
            ? {
                id: assignment.id,
                company_name: (assignment.companies as unknown as { name: string } | null)?.name ?? "Perusahaan",
                company_city: (assignment.companies as unknown as { city: string } | null)?.city ?? "",
                company_logo: (assignment.companies as unknown as { logo_url: string | null } | null)?.logo_url ?? null,
                supervisor_name: assignment.supervisor_name ?? null,
                teacher_name:
                  (assignment.teachers as unknown as { profiles: { full_name: string } } | null)?.profiles?.full_name ?? "",
                start_date: assignment.start_date,
                end_date: assignment.end_date,
                status: assignment.status,
              }
            : placeholder.pklAssignment,
          stats,
          todayAttendance: {
            check_in: checkIn
              ? {
                  time: formatTime(checkIn.created_at),
                  status: checkIn.status,
                }
              : null,
            check_out: checkOut
              ? {
                  time: formatTime(checkOut.created_at),
                  status: checkOut.status,
                }
              : null,
          },
          recentJournals:
            journals && journals.length > 0
              ? journals.map((j: { id: string; date: string; title: string; status: string }) => ({
                  id: j.id,
                  date: j.date,
                  title: j.title,
                  status: j.status,
                }))
              : [],
          recentAnnouncements:
            announcements && announcements.length > 0
              ? announcements.map((a: { id: string; title: string; type: string; published_at: string; is_pinned: boolean }) => ({
                  id: a.id,
                  title: a.title,
                  type: a.type,
                  published_at: a.published_at,
                  is_pinned: a.is_pinned,
                }))
              : [],
          monthCalendar,
        });
      } catch {
        // Fallback ke placeholder jika error
        setData(getPlaceholderData());
      } finally {
        setLoading(false);
      }
    }

    // Delay sedikit untuk animasi yang lebih smooth
    const timer = setTimeout(loadDashboard, 300);
    return () => clearTimeout(timer);
  }, [profile?.id, studentCtx?.studentId]);


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
              {formatDate(new Date(), "EEEE, dd MMMM yyyy")}
            </p>
          </div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          >
            <Avatar
              name={profile?.full_name ?? "S"}
              src={profile?.avatar_url ?? undefined}
              size="lg"
              online
            />
          </motion.div>
        </motion.div>

        {/* ── Notifikasi pending jurnal ───────────────── */}
        {!loading && data && data.stats.pending_journals > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <InfoBanner
              type="warning"
              icon={Zap}
              title={`${data.stats.pending_journals} jurnal belum dikirim`}
              message="Segera isi dan kirimkan jurnal harian Anda agar tidak tertinggal."
              onDismiss={() => {}}
            />
          </motion.div>
        )}

        {/* ── PKL Info Card ───────────────────────────── */}
        <PKLInfoCard
          assignment={data?.pklAssignment ?? null}
          loading={loading}
        />

        {/* ── Today's Attendance ──────────────────────── */}
        <TodayAttendanceCard
          todayAttendance={
            data?.todayAttendance ?? { check_in: null, check_out: null }
          }
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
              title="Kehadiran"
              value={
                loading
                  ? "..."
                  : `${calculateAttendancePercentage(data?.stats.present_days ?? 0, data?.stats.total_days ?? 1)}%`
              }
              subtitle={`${data?.stats.present_days ?? 0} dari ${data?.stats.total_days ?? 0} hari`}
              icon={CheckCircle2}
              color="green"
              loading={loading}
              index={0}
              trend={{ value: 2.5, label: "bulan ini" }}
            />
            <StatCard
              title="Jurnal Dikirim"
              value={loading ? "..." : String(data?.stats.submitted_journals ?? 0)}
              subtitle={`${data?.stats.total_journals ?? 0} total jurnal`}
              icon={BookOpen}
              color="blue"
              loading={loading}
              index={1}
            />
            <StatCard
              title="Notifikasi"
              value={loading ? "..." : String(data?.stats.unread_notifications ?? 0)}
              subtitle="belum dibaca"
              icon={Bell}
              color="yellow"
              loading={loading}
              index={2}
            />
            <StatCard
              title="Pengajuan Izin"
              value={loading ? "..." : String(data?.stats.pending_absences ?? 0)}
              subtitle="sedang diproses"
              icon={ClipboardList}
              color="orange"
              loading={loading}
              index={3}
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
          <QuickActions pendingAbsences={data?.stats.pending_absences ?? 0} />
        </motion.div>

        {/* ── Attendance Summary ──────────────────────── */}
        <AttendanceSummary
          stats={
            data?.stats ?? {
              total_days: 0,
              present_days: 0,
              absent_days: 0,
              permission_days: 0,
              sick_days: 0,
              total_journals: 0,
              submitted_journals: 0,
              pending_journals: 0,
              unread_notifications: 0,
              pending_absences: 0,
            }
          }
          loading={loading}
        />

        {/* ── Mini Calendar ───────────────────────────── */}
        <MiniCalendar
          calendar={data?.monthCalendar ?? []}
          loading={loading}
        />

        {/* ── Recent Journals ─────────────────────────── */}
        <RecentJournals
          journals={data?.recentJournals ?? []}
          loading={loading}
        />

        {/* ── Recent Announcements ────────────────────── */}
        <RecentAnnouncements
          announcements={data?.recentAnnouncements ?? []}
          loading={loading}
        />

        {/* Bottom spacer */}
        <div className="h-4" aria-hidden="true" />
      </div>
    </div>
  );
}
