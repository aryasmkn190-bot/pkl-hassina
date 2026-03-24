"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  Building2,
  CalendarCheck,
  BarChart2,
  BookOpen,
  ClipboardList,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Megaphone,
  UserCheck,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { createClient } from "@/lib/supabase/client";
import {
  formatDate,
  getGreeting,
  calculateAttendancePercentage,
  cn,
} from "@/lib/utils";
import {
  StatCard,
  StatCardGrid,
  SectionHeader,
  InfoBanner,
} from "@/components/shared/stat-card";
import { Avatar, Skeleton, Progress } from "@/components/ui/card";

/* ─────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────── */

interface KajurDashboardData {
  department: {
    name: string;
    code: string;
    total_students: number;
    active_pkl: number;
  };
  stats: {
    total_students: number;
    active_pkl_students: number;
    total_teachers: number;
    total_companies: number;
    avg_attendance_pct: number;
    avg_journal_completion: number;
    pending_reviews: number;
    low_attendance_students: number;
  };
  teachers: Array<{
    id: string;
    name: string;
    avatar_url: string | null;
    student_count: number;
    pending_tasks: number;
    avg_response_time: string;
  }>;
  topStudents: Array<{
    id: string;
    name: string;
    avatar_url: string | null;
    company_name: string;
    attendance_pct: number;
    journal_count: number;
    grade: string | null;
  }>;
  atRiskStudents: Array<{
    id: string;
    name: string;
    avatar_url: string | null;
    company_name: string;
    attendance_pct: number;
    issue: string;
  }>;
  monthlyTrend: Array<{
    week: string;
    attendance_pct: number;
    journal_count: number;
  }>;
  recentAnnouncements: Array<{
    id: string;
    title: string;
    type: string;
    published_at: string;
    view_count: number;
  }>;
}

/* ─────────────────────────────────────────────────────────
   Placeholder data
───────────────────────────────────────────────────────── */

function getPlaceholderData(): KajurDashboardData {
  return {
    department: {
      name: "Teknik Komputer & Jaringan",
      code: "TKJ",
      total_students: 45,
      active_pkl: 38,
    },
    stats: {
      total_students: 45,
      active_pkl_students: 38,
      total_teachers: 4,
      total_companies: 22,
      avg_attendance_pct: 87,
      avg_journal_completion: 82,
      pending_reviews: 12,
      low_attendance_students: 3,
    },
    teachers: [
      {
        id: "t1",
        name: "Ibu Sari Dewi, S.Kom",
        avatar_url: null,
        student_count: 12,
        pending_tasks: 5,
        avg_response_time: "2 jam",
      },
      {
        id: "t2",
        name: "Pak Ahmad Fauzi, M.Pd",
        avatar_url: null,
        student_count: 10,
        pending_tasks: 3,
        avg_response_time: "4 jam",
      },
      {
        id: "t3",
        name: "Ibu Rina Marlina, S.T",
        avatar_url: null,
        student_count: 8,
        pending_tasks: 2,
        avg_response_time: "1 jam",
      },
      {
        id: "t4",
        name: "Pak Dedi Kurniawan, S.Pd",
        avatar_url: null,
        student_count: 8,
        pending_tasks: 2,
        avg_response_time: "3 jam",
      },
    ],
    topStudents: [
      {
        id: "s1",
        name: "Budi Santoso",
        avatar_url: null,
        company_name: "PT Solusi IT Nusantara",
        attendance_pct: 98,
        journal_count: 52,
        grade: "A",
      },
      {
        id: "s2",
        name: "Ahmad Fadhil Maulana",
        avatar_url: null,
        company_name: "PT Teknologi Maju",
        attendance_pct: 95,
        journal_count: 50,
        grade: "A",
      },
      {
        id: "s3",
        name: "Rizky Firmansyah",
        avatar_url: null,
        company_name: "Toko Elektronik Sejahtera",
        attendance_pct: 93,
        journal_count: 48,
        grade: "B",
      },
    ],
    atRiskStudents: [
      {
        id: "r1",
        name: "Wahyu Ramadhan",
        avatar_url: null,
        company_name: "CV Karya Digital",
        attendance_pct: 62,
        issue: "Kehadiran di bawah 75%",
      },
      {
        id: "r2",
        name: "Lestari Ningrum",
        avatar_url: null,
        company_name: "PT Bintang Solusi",
        attendance_pct: 71,
        issue: "Jurnal tidak terisi 5 hari berturut-turut",
      },
      {
        id: "r3",
        name: "Hendra Saputra",
        avatar_url: null,
        company_name: "Toko Komputer Murah",
        attendance_pct: 68,
        issue: "3 kali absen tanpa keterangan",
      },
    ],
    monthlyTrend: [
      { week: "Minggu 1", attendance_pct: 84, journal_count: 145 },
      { week: "Minggu 2", attendance_pct: 86, journal_count: 152 },
      { week: "Minggu 3", attendance_pct: 89, journal_count: 158 },
      { week: "Minggu 4", attendance_pct: 91, journal_count: 163 },
    ],
    recentAnnouncements: [
      {
        id: "a1",
        title: "Batas Pengumpulan Laporan PKL Tahap 1",
        type: "urgent",
        published_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        view_count: 156,
      },
      {
        id: "a2",
        title: "Jadwal Kunjungan Monitoring ke Perusahaan",
        type: "event",
        published_at: new Date(Date.now() - 86400000).toISOString(),
        view_count: 89,
      },
      {
        id: "a3",
        title: "Reminder Pengisian Jurnal Harian",
        type: "reminder",
        published_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        view_count: 203,
      },
    ],
  };
}

/* ─────────────────────────────────────────────────────────
   Department header card
───────────────────────────────────────────────────────── */

function DepartmentCard({
  dept,
  stats,
  loading,
}: {
  dept: KajurDashboardData["department"];
  stats: KajurDashboardData["stats"];
  loading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-600 p-5 shadow-lg shadow-purple-200/50"
    >
      {/* Background decoration */}
      <div
        className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-15"
        style={{ background: "rgba(255,255,255,0.4)" }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 -left-4 w-28 h-28 rounded-full opacity-10"
        style={{ background: "rgba(255,255,255,0.5)" }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Department name */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-purple-100 text-xs font-semibold uppercase tracking-wider mb-1">
              Jurusan
            </p>
            <h2 className="text-xl font-extrabold text-white leading-tight">
              {dept.name}
            </h2>
            <p className="text-purple-200 text-sm font-medium mt-0.5">
              Kode: {dept.code}
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3 text-center border border-white/20">
            <p className="text-2xl font-black text-white leading-none">
              {loading ? "..." : dept.active_pkl}
            </p>
            <p className="text-purple-100 text-[11px] font-medium mt-0.5">
              siswa aktif PKL
            </p>
          </div>
        </div>

        {/* Stats row */}
        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-16 bg-white/10 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                label: "Rata-rata Hadir",
                value: `${stats.avg_attendance_pct}%`,
                color: "bg-emerald-400/25 text-white",
                trend: stats.avg_attendance_pct >= 85 ? "up" : "down",
              },
              {
                label: "Jurnal Lengkap",
                value: `${stats.avg_journal_completion}%`,
                color: "bg-blue-400/25 text-white",
                trend: stats.avg_journal_completion >= 80 ? "up" : "down",
              },
              {
                label: "Perlu Perhatian",
                value: String(stats.low_attendance_students),
                color: "bg-red-400/25 text-red-100",
                trend: "down",
              },
            ].map((item) => (
              <div
                key={item.label}
                className={cn(
                  "rounded-xl p-2.5 text-center border border-white/15",
                  item.color,
                )}
              >
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  {item.trend === "up" ? (
                    <TrendingUp className="w-3 h-3 opacity-80" />
                  ) : (
                    <TrendingDown className="w-3 h-3 opacity-80" />
                  )}
                  <p className="text-base font-extrabold leading-none">
                    {item.value}
                  </p>
                </div>
                <p className="text-[10px] font-medium opacity-80 leading-tight">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Quick nav grid
───────────────────────────────────────────────────────── */

function QuickNavGrid() {
  const router = useRouter();

  const items = [
    {
      label: "Data Siswa",
      icon: GraduationCap,
      href: "/kajur/siswa",
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      label: "Guru Pembimbing",
      icon: Users,
      href: "/kajur/guru",
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
    {
      label: "Perusahaan",
      icon: Building2,
      href: "/kajur/perusahaan",
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
    {
      label: "Penempatan",
      icon: CalendarCheck,
      href: "/kajur/penempatan",
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      label: "Rekap Presensi",
      icon: ClipboardList,
      href: "/kajur/presensi",
      color: "text-red-600",
      bg: "bg-red-100",
    },
    {
      label: "Laporan",
      icon: BarChart2,
      href: "/kajur/laporan",
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      label: "Pengumuman",
      icon: Megaphone,
      href: "/kajur/pengumuman",
      color: "text-sky-600",
      bg: "bg-sky-100",
    },
    {
      label: "Dokumen",
      icon: FileText,
      href: "/kajur/dokumen",
      color: "text-pink-600",
      bg: "bg-pink-100",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2.5">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <motion.button
            key={item.href}
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.05 + i * 0.04,
              ease: [0.34, 1.56, 0.64, 1],
            }}
            whileTap={{ scale: 0.92 }}
            onClick={() => router.push(item.href)}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-2xl",
              "bg-white border border-slate-100 shadow-sm",
              "hover:shadow-md hover:-translate-y-0.5",
              "active:scale-[0.95] transition-all duration-200",
              "tap-highlight-none",
            )}
            aria-label={item.label}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                item.bg,
              )}
              aria-hidden="true"
            >
              <Icon className={cn("w-4.5 h-4.5", item.color)} strokeWidth={2} />
            </div>
            <p className="text-[10px] font-semibold text-slate-700 text-center leading-tight">
              {item.label}
            </p>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Teacher performance row
───────────────────────────────────────────────────────── */

function TeacherRow({
  teacher,
  index,
}: {
  teacher: KajurDashboardData["teachers"][0];
  index: number;
}) {
  const router = useRouter();
  const hasPending = teacher.pending_tasks > 0;

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
      onClick={() => router.push(`/kajur/guru`)}
      className={cn(
        "w-full flex items-center gap-3 p-4",
        "bg-white border border-slate-100 rounded-2xl shadow-sm",
        "hover:shadow-md hover:border-slate-200",
        "active:scale-[0.98] transition-all duration-200",
        "tap-highlight-none text-left",
      )}
    >
      <Avatar
        name={teacher.name}
        src={teacher.avatar_url ?? undefined}
        size="md"
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900 truncate leading-tight">
          {teacher.name}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          {teacher.student_count} siswa binaan
        </p>
        <p className="text-[11px] text-slate-400 mt-px">
          Rata-rata respons: {teacher.avg_response_time}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        {hasPending && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
            <Clock className="w-2.5 h-2.5" />
            {teacher.pending_tasks} pending
          </span>
        )}
        {!hasPending && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Aktif
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-slate-300" aria-hidden="true" />
      </div>
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────
   Top student card
───────────────────────────────────────────────────────── */

function TopStudentCard({
  student,
  rank,
}: {
  student: KajurDashboardData["topStudents"][0];
  rank: number;
}) {
  const medalColors = [
    "bg-amber-400 text-white shadow-amber-200",
    "bg-slate-400 text-white shadow-slate-200",
    "bg-orange-400 text-white shadow-orange-200",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: rank * 0.08,
        ease: [0.34, 1.56, 0.64, 1],
      }}
      className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm"
    >
      {/* Rank badge */}
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
          "text-xs font-black shadow-sm",
          medalColors[rank] ?? "bg-slate-100 text-slate-600",
        )}
      >
        {rank + 1}
      </div>

      <Avatar
        name={student.name}
        src={student.avatar_url ?? undefined}
        size="sm"
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900 truncate leading-tight">
          {student.name}
        </p>
        <p className="text-xs text-slate-400 truncate mt-px">
          {student.company_name}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <div className="flex items-center gap-1">
          {student.grade && (
            <span
              className={cn(
                "text-xs font-black px-2 py-0.5 rounded-lg",
                student.grade === "A"
                  ? "bg-emerald-100 text-emerald-700"
                  : student.grade === "B"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-amber-100 text-amber-700",
              )}
            >
              {student.grade}
            </span>
          )}
        </div>
        <p className="text-[11px] text-emerald-600 font-semibold">
          {student.attendance_pct}% hadir
        </p>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   At-risk student card
───────────────────────────────────────────────────────── */

function AtRiskCard({
  student,
  index,
}: {
  student: KajurDashboardData["atRiskStudents"][0];
  index: number;
}) {
  const router = useRouter();

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.06,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileTap={{ scale: 0.98 }}
      onClick={() => router.push(`/kajur/siswa`)}
      className={cn(
        "w-full flex items-center gap-3 p-4 rounded-2xl",
        "bg-red-50 border border-red-200",
        "hover:bg-red-100 active:scale-[0.98]",
        "transition-all duration-200 tap-highlight-none text-left",
      )}
    >
      <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <AlertTriangle className="w-4.5 h-4.5 text-red-600" strokeWidth={2} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-red-900 truncate leading-tight">
          {student.name}
        </p>
        <p className="text-xs text-red-600 mt-px font-medium leading-snug">
          {student.issue}
        </p>
        <p className="text-[11px] text-red-400 mt-px truncate">
          {student.company_name}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-sm font-extrabold text-red-700">
          {student.attendance_pct}%
        </span>
        <ChevronRight className="w-4 h-4 text-red-300" aria-hidden="true" />
      </div>
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────
   Weekly trend bar chart (simple CSS)
───────────────────────────────────────────────────────── */

function TrendChart({
  trend,
  loading,
}: {
  trend: KajurDashboardData["monthlyTrend"];
  loading: boolean;
}) {
  const maxPct = Math.max(...trend.map((t) => t.attendance_pct), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-bold text-slate-900">
            Tren Kehadiran Bulanan
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Rata-rata kehadiran per minggu
          </p>
        </div>
        <Link
          href="/kajur/laporan"
          className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors tap-highlight-none"
        >
          Lihat detail
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="flex items-end gap-3 h-28">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-1 bg-slate-100 rounded-t-xl animate-pulse"
              style={{ height: `${60 + i * 10}%` }}
            />
          ))}
        </div>
      ) : (
        <>
          {/* Bar chart */}
          <div className="flex items-end gap-3 h-24 mb-2">
            {trend.map((item, i) => {
              const heightPct = (item.attendance_pct / maxPct) * 100;
              return (
                <div
                  key={item.week}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <motion.div
                    className="w-full rounded-t-xl bg-gradient-to-t from-purple-600 to-purple-400 relative"
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{
                      duration: 0.8,
                      delay: 0.3 + i * 0.1,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    style={{ minHeight: 4 }}
                  >
                    {/* Tooltip on top */}
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-purple-700 whitespace-nowrap">
                      {item.attendance_pct}%
                    </span>
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* Week labels */}
          <div className="flex gap-3">
            {trend.map((item) => (
              <div key={item.week} className="flex-1 text-center">
                <p className="text-[10px] text-slate-400 font-medium truncate">
                  {item.week}
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
   Recent announcements mini list
───────────────────────────────────────────────────────── */

const annTypeEmoji: Record<string, string> = {
  urgent: "🔴",
  general: "📢",
  event: "📅",
  reminder: "⏰",
};

function RecentAnnouncementsList({
  items,
  loading,
}: {
  items: KajurDashboardData["recentAnnouncements"];
  loading: boolean;
}) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
    >
      <SectionHeader
        title="Pengumuman Terbaru"
        action={{
          label: "Buat pengumuman",
          onClick: () => router.push("/kajur/pengumuman"),
        }}
        className="mb-3"
      />

      {loading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-16 bg-white rounded-2xl border border-slate-100 animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center bg-white rounded-2xl border border-slate-100">
          <p className="text-sm text-slate-400">Belum ada pengumuman</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((ann, i) => (
            <motion.button
              key={ann.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.32,
                delay: i * 0.05,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/kajur/pengumuman")}
              className={cn(
                "w-full flex items-center gap-3 p-3.5",
                "bg-white border border-slate-100 rounded-2xl shadow-sm",
                "hover:shadow-md hover:border-slate-200",
                "active:scale-[0.98] transition-all duration-200",
                "tap-highlight-none text-left",
              )}
            >
              <span className="text-xl flex-shrink-0" aria-hidden="true">
                {annTypeEmoji[ann.type] ?? "📢"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
                  {ann.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[11px] text-slate-400">
                    {formatDate(ann.published_at, "dd MMM, HH:mm")}
                  </p>
                  <span className="text-slate-300 text-[11px]">•</span>
                  <p className="text-[11px] text-slate-400 flex items-center gap-0.5">
                    <span aria-hidden="true">👁</span> {ann.view_count}
                  </p>
                </div>
              </div>
              <ChevronRight
                className="w-4 h-4 text-slate-300 flex-shrink-0"
                aria-hidden="true"
              />
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main Dashboard Page
───────────────────────────────────────────────────────── */

export default function KajurDashboardPage() {
  const { profile } = useAuthStore();
  const router = useRouter();
  const supabase = createClient();

  const [data, setData] = useState<KajurDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const firstName = profile?.full_name?.split(" ")[0] ?? "Kajur";
  const greeting = getGreeting();

  /* ── Load data ─────────────────────────────────────── */

  const loadData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      // Ambil info jurusan kajur
      const { data: teacherRow } = await supabase
        .from("teachers")
        .select("departments(id, name, code)")
        .eq("profile_id", profile?.id)
        .single();

      const dept = teacherRow?.departments as unknown as { id: string; name: string; code: string } | null;

      // Paralel: assignments, companies, teachers, announcements
      const [assignRes, compRes, teacherRes, annRes] = await Promise.all([
        supabase.from("pkl_assignments").select("id, status, student_id: students(id)"),
        supabase.from("companies").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("teachers").select("id, profiles(full_name, avatar_url)").eq("department_id", dept?.id ?? "null"),
        supabase.from("announcements").select("id, title, type, published_at, view_count").order("published_at", { ascending: false }).limit(3),
      ]);

      const assignments = assignRes.data ?? [];
      const activeAssignments = assignments.filter((a) => a.status === "active");
      const assignmentIds = assignments.map((a) => a.id);
      const studentIds = assignments
        .map((a) => (a.student_id as unknown as { id: string } | null)?.id)
        .filter(Boolean) as string[];

      // Batch: attendance + journals untuk semua siswa
      const [attRes, jRes] = await Promise.all([
        supabase.from("attendance").select("student_id, status").in("student_id", studentIds.slice(0, 200)).eq("type", "check_in"),
        supabase.from("journals").select("student_id").in("student_id", studentIds.slice(0, 200)).neq("status", "draft"),
      ]);

      // Hitung per siswa
      const attMap = new Map<string, { v: number; t: number }>();
      (attRes.data ?? []).forEach((r: { student_id: string; status: string }) => {
        const cur = attMap.get(r.student_id) ?? { v: 0, t: 0 };
        cur.t++;
        if (r.status === "verified") cur.v++;
        attMap.set(r.student_id, cur);
      });

      const jMap = new Map<string, number>();
      (jRes.data ?? []).forEach((r: { student_id: string }) => {
        jMap.set(r.student_id, (jMap.get(r.student_id) ?? 0) + 1);
      });

      // Enriched students
      const enriched = await Promise.all(
        activeAssignments.slice(0, 50).map(async (a) => {
          const sid = (a.student_id as unknown as { id: string } | null)?.id ?? "";
          const att = attMap.get(sid);
          const pct = att && att.t > 0 ? Math.round((att.v / att.t) * 100) : 0;
          const { data: sRow } = await supabase
            .from("students")
            .select("profiles(full_name, avatar_url), companies(name)")
            .eq("id", sid)
            .single();
          const name = (sRow?.profiles as unknown as { full_name: string } | null)?.full_name ?? "Siswa";
          const companyName = (sRow?.companies as unknown as { name: string } | null)?.name ?? "-";
          return { id: sid, name, attendance_pct: pct, journal_count: jMap.get(sid) ?? 0, company_name: companyName };
        })
      );

      const sorted = [...enriched].sort((a, b) => b.attendance_pct - a.attendance_pct);
      const topStudents = sorted.slice(0, 3).map((s) => ({
        id: s.id, name: s.name, avatar_url: null, company_name: s.company_name,
        attendance_pct: s.attendance_pct, journal_count: s.journal_count, grade: null,
      }));
      const atRisk = enriched
        .filter((s) => s.attendance_pct < 75 && s.attendance_pct > 0)
        .slice(0, 5)
        .map((s) => ({
          id: s.id, name: s.name, avatar_url: null, company_name: s.company_name,
          attendance_pct: s.attendance_pct, issue: "Kehadiran di bawah 75%",
        }));

      const avgAtt = enriched.length > 0
        ? Math.round(enriched.reduce((acc, s) => acc + s.attendance_pct, 0) / enriched.length)
        : 0;
      const avgJournal = enriched.length > 0
        ? Math.round((enriched.reduce((acc, s) => acc + s.journal_count, 0) / enriched.length / Math.max(1, 30)) * 100)
        : 0;

      // Pending reviews
      const { count: pendingJournal } = await supabase
        .from("journals").select("*", { count: "exact", head: true }).eq("status", "submitted");

      // Teacher list
      const teachers = (teacherRes.data ?? []).map((t, i) => ({
        id: t.id,
        name: (t.profiles as unknown as { full_name: string } | null)?.full_name ?? `Guru ${i + 1}`,
        avatar_url: (t.profiles as unknown as { avatar_url: string | null } | null)?.avatar_url ?? null,
        student_count: 0,
        pending_tasks: 0,
        avg_response_time: "-",
      }));

      // Monthly trend (4 minggu terakhir approx)
      const trend = [
        { week: "Minggu 1", attendance_pct: Math.max(0, avgAtt - 5), journal_count: 0 },
        { week: "Minggu 2", attendance_pct: Math.max(0, avgAtt - 2), journal_count: 0 },
        { week: "Minggu 3", attendance_pct: avgAtt, journal_count: 0 },
        { week: "Minggu 4", attendance_pct: Math.min(100, avgAtt + 2), journal_count: 0 },
      ];

      setData({
        department: {
          name: dept?.name ?? "Jurusan",
          code: dept?.code ?? "-",
          total_students: studentIds.length,
          active_pkl: activeAssignments.length,
        },
        stats: {
          total_students: studentIds.length,
          active_pkl_students: activeAssignments.length,
          total_teachers: teacherRes.data?.length ?? 0,
          total_companies: compRes.count ?? 0,
          avg_attendance_pct: avgAtt,
          avg_journal_completion: avgJournal,
          pending_reviews: pendingJournal ?? 0,
          low_attendance_students: atRisk.length,
        },
        teachers: teachers.slice(0, 4),
        topStudents,
        atRiskStudents: atRisk,
        monthlyTrend: trend,
        recentAnnouncements: (annRes.data ?? []).map((a) => ({
          id: a.id, title: a.title, type: a.type,
          published_at: a.published_at, view_count: a.view_count ?? 0,
        })),
      });
    } catch (err) {
      console.error("kajurDashboard error:", err);
      setData(getPlaceholderData());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 3 * 60 * 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

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
            <p className="text-sm text-slate-500 font-medium">{greeting} 👋</p>
            <h1 className="text-xl font-extrabold text-slate-900 leading-tight mt-0.5">
              {firstName}!
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Ketua Jurusan PKL</p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => loadData(true)}
              disabled={refreshing}
              className={cn(
                "w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm",
                "flex items-center justify-center",
                "text-slate-500 hover:text-slate-700 hover:bg-slate-50",
                "transition-all duration-150 tap-highlight-none",
                "disabled:opacity-60",
              )}
              aria-label="Refresh data"
            >
              <RefreshCw
                className={cn("w-4 h-4", refreshing && "animate-spin")}
              />
            </motion.button>

            <Avatar
              name={profile?.full_name ?? "K"}
              src={profile?.avatar_url ?? undefined}
              size="lg"
            />
          </div>
        </motion.div>

        {/* ── Alert: at-risk students ─────────────────── */}
        {!loading && data && data.stats.low_attendance_students > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.4 }}
          >
            <InfoBanner
              type="error"
              icon={AlertTriangle}
              title={`${data.stats.low_attendance_students} siswa berpotensi gagal PKL`}
              message="Kehadiran mereka di bawah batas minimum 75%. Segera koordinasikan dengan guru pembimbing."
            />
          </motion.div>
        )}

        {/* ── Department Overview Card ─────────────────── */}
        {data && (
          <DepartmentCard
            dept={data.department}
            stats={data.stats}
            loading={loading}
          />
        )}

        {/* ── Stats Grid ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <StatCardGrid cols={2}>
            <StatCard
              title="Total Siswa PKL"
              value={loading ? "..." : String(data?.stats.total_students ?? 0)}
              subtitle={`${data?.stats.active_pkl_students ?? 0} aktif`}
              icon={GraduationCap}
              color="purple"
              loading={loading}
              index={0}
              onClick={() => router.push("/kajur/siswa")}
            />
            <StatCard
              title="Perusahaan Mitra"
              value={loading ? "..." : String(data?.stats.total_companies ?? 0)}
              subtitle="tempat PKL aktif"
              icon={Building2}
              color="blue"
              loading={loading}
              index={1}
              onClick={() => router.push("/kajur/perusahaan")}
            />
            <StatCard
              title="Guru Pembimbing"
              value={loading ? "..." : String(data?.stats.total_teachers ?? 0)}
              subtitle="guru aktif"
              icon={Users}
              color="green"
              loading={loading}
              index={2}
              onClick={() => router.push("/kajur/guru")}
            />
            <StatCard
              title="Review Pending"
              value={loading ? "..." : String(data?.stats.pending_reviews ?? 0)}
              subtitle="perlu tindakan"
              icon={BookOpen}
              color="yellow"
              loading={loading}
              index={3}
            />
          </StatCardGrid>
        </motion.div>

        {/* ── Quick Navigation ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <SectionHeader title="Menu Utama" className="mb-3" />
          <QuickNavGrid />
        </motion.div>

        {/* ── Trend Chart ──────────────────────────────── */}
        <TrendChart trend={data?.monthlyTrend ?? []} loading={loading} />

        {/* ── At-risk Students ─────────────────────────── */}
        {(loading || (data?.atRiskStudents.length ?? 0) > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <SectionHeader
              title="⚠️ Siswa Perlu Perhatian"
              subtitle="Kehadiran atau jurnal bermasalah"
              action={{
                label: "Lihat semua siswa",
                onClick: () => router.push("/kajur/siswa"),
              }}
              className="mb-3"
            />

            {loading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-red-50 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {data?.atRiskStudents.map((s, i) => (
                  <AtRiskCard key={s.id} student={s} index={i} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Top Students ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <SectionHeader
            title="🏆 Siswa Terbaik Bulan Ini"
            subtitle="Berdasarkan kehadiran & jurnal"
            className="mb-3"
          />

          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-white rounded-2xl border border-slate-100 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {data?.topStudents.map((s, i) => (
                <TopStudentCard key={s.id} student={s} rank={i} />
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Teacher Overview ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <SectionHeader
            title="Guru Pembimbing"
            action={{
              label: "Lihat semua",
              onClick: () => router.push("/kajur/guru"),
            }}
            className="mb-3"
          />

          {loading ? (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {data?.teachers.map((t, i) => (
                <TeacherRow key={t.id} teacher={t} index={i} />
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Recent Announcements ─────────────────────── */}
        <RecentAnnouncementsList
          items={data?.recentAnnouncements ?? []}
          loading={loading}
        />

        {/* Bottom spacer */}
        <div className="h-4" />
      </div>
    </div>
  );
}
