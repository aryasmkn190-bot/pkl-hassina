"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  X,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  BookOpen,
  CalendarCheck,
  ArrowLeft,
  Building2,
  GraduationCap,
  MapPin,
  Star,
  TrendingUp,
  RefreshCw,
  Phone,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";

/* ─────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────── */

type StudentStatus = "active" | "completed" | "pending" | "cancelled";

interface StudentItem {
  id: string;              // student.id (UUID)
  profile_id: string;      // profiles.id
  assignment_id: string;
  name: string;
  nis: string;
  class_name: string;
  department_name: string;
  company_name: string;
  company_city: string;
  start_date: string;
  end_date: string;
  status: StudentStatus;
  present_days: number;
  sick_days: number;
  permission_days: number;
  absent_days: number;
  total_days: number;
  total_journals: number;
  submitted_journals: number;
  phone: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  avatar_url: string | null;
}

/* ─────────────────────────────────────────────────────────
   Status config
───────────────────────────────────────────────────────── */

const STATUS_CONFIG: Record<
  StudentStatus,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  active:    { label: "Aktif",      color: "text-emerald-700", bg: "bg-emerald-50", icon: CheckCircle2 },
  completed: { label: "Selesai",    color: "text-blue-700",    bg: "bg-blue-50",    icon: CheckCircle2 },
  pending:   { label: "Menunggu",   color: "text-amber-700",   bg: "bg-amber-50",   icon: Clock },
  cancelled: { label: "Dibatalkan", color: "text-red-700",     bg: "bg-red-50",     icon: XCircle },
};

/* ─────────────────────────────────────────────────────────
   Student Detail Slide-in
───────────────────────────────────────────────────────── */

function StudentDetail({
  student,
  onClose,
}: {
  student: StudentItem;
  onClose: () => void;
}) {
  const sc = STATUS_CONFIG[student.status];
  const StatusIcon = sc.icon;

  const attendancePct =
    student.total_days > 0
      ? Math.round((student.present_days / student.total_days) * 100)
      : 0;
  const attackColor =
    attendancePct >= 85
      ? "text-emerald-600"
      : attendancePct >= 70
      ? "text-amber-600"
      : "text-red-600";

  const journalPct =
    student.total_journals > 0
      ? Math.round((student.submitted_journals / student.total_journals) * 100)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[60] bg-slate-50 overflow-y-auto"
    >
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 h-[60px] bg-white/90 backdrop-blur-xl border-b border-slate-200/60">
        <button
          onClick={onClose}
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
        >
          <ArrowLeft className="w-4.5 h-4.5" strokeWidth={2.5} />
        </button>
        <h1 className="text-[16px] font-bold text-slate-900 truncate flex-1">Detail Siswa</h1>
        <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold", sc.bg, sc.color)}>
          <StatusIcon className="w-3 h-3" />
          {sc.label}
        </span>
      </header>

      <div className="px-4 py-5 max-w-2xl mx-auto space-y-4 pb-8">
        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
        >
          <div className="flex items-center gap-4">
            {student.avatar_url ? (
              <img
                src={student.avatar_url}
                alt={student.name}
                className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-white">{student.name.charAt(0)}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-900">{student.name}</h2>
              <p className="text-sm text-slate-500">NIS: {student.nis}</p>
              <p className="text-sm text-slate-500">{student.class_name} · {student.department_name}</p>
            </div>
          </div>

          {/* Contact info */}
          {(student.phone || student.parent_name) && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
              {student.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-600">{student.phone}</span>
                </div>
              )}
              {student.parent_name && (
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-600">
                    {student.parent_name}
                    {student.parent_phone ? ` · ${student.parent_phone}` : ""}
                  </span>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="grid grid-cols-2 gap-3"
        >
          {/* Kehadiran */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <CalendarCheck className="w-4 h-4 text-emerald-500" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kehadiran</p>
            </div>
            <p className={cn("text-2xl font-extrabold", attackColor)}>{attendancePct}%</p>
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full", attendancePct >= 85 ? "bg-emerald-500" : attendancePct >= 70 ? "bg-amber-500" : "bg-red-500")}
                style={{ width: `${attendancePct}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              {student.present_days}H · {student.sick_days}S · {student.permission_days}I · {student.absent_days}A
            </p>
          </div>

          {/* Jurnal */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-purple-500" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jurnal</p>
            </div>
            <p className="text-2xl font-extrabold text-purple-600">{student.submitted_journals}</p>
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-purple-500"
                style={{ width: `${journalPct}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">dari {student.total_journals} hari PKL</p>
          </div>
        </motion.div>

        {/* PKL info */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3"
        >
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tempat PKL</p>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{student.company_name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400" />
                <p className="text-xs text-slate-500">{student.company_city}</p>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {formatDate(student.start_date, "dd MMM yyyy")} — {formatDate(student.end_date, "dd MMM yyyy")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Attendance breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
        >
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Detail Kehadiran</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Hadir", value: student.present_days, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Sakit", value: student.sick_days, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Izin", value: student.permission_days, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Absen", value: student.absent_days, color: "text-red-600", bg: "bg-red-50" },
            ].map((item) => (
              <div key={item.label} className={cn("rounded-xl p-2.5 text-center", item.bg)}>
                <p className={cn("text-lg font-bold", item.color)}>{item.value}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Student Card
───────────────────────────────────────────────────────── */

function StudentCard({
  student,
  index,
  onClick,
}: {
  student: StudentItem;
  index: number;
  onClick: () => void;
}) {
  const sc = STATUS_CONFIG[student.status];
  const StatusIcon = sc.icon;
  const attendancePct =
    student.total_days > 0
      ? Math.round((student.present_days / student.total_days) * 100)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <button
        onClick={onClick}
        className="w-full text-left flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-px active:scale-[0.98] transition-all"
      >
        {/* Avatar */}
        {student.avatar_url ? (
          <img src={student.avatar_url} alt={student.name} className="w-12 h-12 rounded-2xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-white">{student.name.charAt(0)}</span>
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{student.name}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{student.nis} · {student.class_name}</p>
            </div>
            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap flex-shrink-0", sc.bg, sc.color)}>
              <StatusIcon className="w-2.5 h-2.5" />
              {sc.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-1.5">
            <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <p className="text-[11px] text-slate-500 truncate">{student.company_name}</p>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full", attendancePct >= 85 ? "bg-emerald-500" : attendancePct >= 70 ? "bg-amber-500" : "bg-red-500")}
                style={{ width: `${attendancePct}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-500">{attendancePct}%</span>
            <BookOpen className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] text-slate-500">{student.submitted_journals}</span>
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
      </button>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────── */

export default function GuruSiswaPage() {
  const { profile } = useAuthStore();
  const supabase = createClient();

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<StudentStatus | "all">("all");
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);

  /* ── Load ──────────────────────────────────────────── */

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      if (!profile?.id) return;

      const { data: assignments, error } = await supabase
        .from("pkl_assignments")
        .select(`
          id,
          status,
          start_date,
          end_date,
          students (
            id,
            nis,
            address,
            parent_name,
            parent_phone,
            profiles (full_name, avatar_url, phone),
            classes (name),
            departments (name)
          ),
          companies (name, city)
        `)
        .eq("teacher_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!assignments || assignments.length === 0) {
        setStudents([]);
        return;
      }

      // Ambil stats kehadiran & jurnal per siswa
      const items: (StudentItem | null)[] = await Promise.all(
        assignments.map(async (a) => {

          const s = a.students as unknown as {
            id: string;
            nis: string;
            address: string | null;
            parent_name: string | null;
            parent_phone: string | null;
            profiles: { full_name: string; avatar_url: string | null; phone: string | null } | null;
            classes: { name: string } | null;
            departments: { name: string } | null;
          } | null;
          const company = a.companies as unknown as { name: string; city: string } | null;

          if (!s) return null;

          // Hitung durasi PKL (hari kerja kasar)
          const startDate = new Date(a.start_date);
          const endDate = a.status === "active" ? new Date() : new Date(a.end_date);
          const diffDays = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 86400000));
          const totalDays = Math.round(diffDays * 5 / 7); // estimasi hari kerja

          // Query kehadiran
          const { data: attData } = await supabase
            .from("attendance")
            .select("type, status")
            .eq("student_id", s.id)
            .eq("pkl_assignment_id", a.id)
            .eq("type", "check_in");

          const presentDays = attData?.filter((r) => r.status === "verified").length ?? 0;

          // Query izin/sakit
          const { data: absData } = await supabase
            .from("absence_requests")
            .select("type, status")
            .eq("student_id", s.id)
            .eq("status", "approved");

          const sickDays = absData?.filter((r) => r.type === "sick").length ?? 0;
          const permDays = absData?.filter((r) => r.type !== "sick").length ?? 0;
          const absentDays = Math.max(0, totalDays - presentDays - sickDays - permDays);

          // Query jurnal
          const { count: submittedJournals } = await supabase
            .from("journals")
            .select("*", { count: "exact", head: true })
            .eq("student_id", s.id)
            .eq("pkl_assignment_id", a.id)
            .in("status", ["submitted", "reviewed", "revision"]);

          return {
            id: s.id,
            profile_id: s.profiles?.full_name ? s.id : s.id,
            assignment_id: a.id,
            name: s.profiles?.full_name ?? "Siswa",
            nis: s.nis ?? "-",
            class_name: s.classes?.name ?? "-",
            department_name: s.departments?.name ?? "-",
            company_name: company?.name ?? "-",
            company_city: company?.city ?? "-",
            start_date: a.start_date,
            end_date: a.end_date,
            status: a.status as StudentStatus,
            present_days: presentDays,
            sick_days: sickDays,
            permission_days: permDays,
            absent_days: absentDays,
            total_days: totalDays,
            total_journals: totalDays,
            submitted_journals: submittedJournals ?? 0,
            phone: s.profiles?.phone ?? null,
            parent_name: s.parent_name ?? null,
            parent_phone: s.parent_phone ?? null,
            avatar_url: s.profiles?.avatar_url ?? null,
          } as StudentItem;
        })
      );

      setStudents(items.filter((i): i is StudentItem => i !== null));

    } catch (err) {
      console.error("loadStudents error:", err);
      toast.error("Gagal memuat data siswa");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── Filter ─────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let r = [...students];
    if (filterStatus !== "all") r = r.filter((s) => s.status === filterStatus);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      r = r.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.nis.includes(q) ||
          s.company_name.toLowerCase().includes(q)
      );
    }
    return r;
  }, [students, filterStatus, searchQuery]);

  const activeCount = students.filter((s) => s.status === "active").length;

  /* ── Render ─────────────────────────────────────────── */

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-extrabold text-slate-900">Siswa Bimbingan</h1>
              <p className="text-xs text-slate-400 mt-px">{students.length} siswa · {activeCount} aktif</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all"
              aria-label="Refresh"
            >
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            </motion.button>
          </div>

          {/* Summary banner */}
          {!loading && students.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-200/60"
            >
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{students.length} Siswa Bimbingan</p>
                <p className="text-xs text-blue-100">{activeCount} sedang aktif PKL</p>
              </div>
              <TrendingUp className="w-5 h-5 text-white/60 ml-auto" />
            </motion.div>
          )}

          {/* Search */}
          <div className="flex items-center gap-2.5 px-3.5 h-12 rounded-2xl bg-white border border-slate-200">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="search"
              placeholder="Cari nama siswa, NIS, perusahaan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
                <X className="w-3 h-3 text-slate-500" />
              </button>
            )}
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 -mx-4 px-4 overflow-x-auto pb-1">
            {([
              { value: "all",       label: "Semua" },
              { value: "active",    label: "Aktif" },
              { value: "completed", label: "Selesai" },
              { value: "pending",   label: "Menunggu" },
            ] as { value: StudentStatus | "all"; label: string }[]).map((opt) => {
              const cnt = opt.value === "all" ? students.length : students.filter((s) => s.status === opt.value).length;
              return (
                <button
                  key={opt.value}
                  onClick={() => setFilterStatus(opt.value)}
                  className={cn(
                    "flex-shrink-0 px-4 h-8 rounded-full text-xs font-bold transition-all flex items-center gap-1.5",
                    filterStatus === opt.value
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600"
                  )}
                >
                  {opt.label}
                  <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                    filterStatus === opt.value ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500")}>
                    {cnt}
                  </span>
                </button>
              );
            })}
          </div>

          {/* List */}
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500">
                {searchQuery || filterStatus !== "all" ? "Tidak ada siswa yang cocok" : "Belum ada siswa bimbingan"}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {filtered.map((s, i) => (
                <StudentCard key={s.id} student={s} index={i} onClick={() => setSelectedStudent(s)} />
              ))}
            </div>
          )}

          <div className="h-4" />
        </div>
      </div>

      <AnimatePresence>
        {selectedStudent && (
          <StudentDetail student={selectedStudent} onClose={() => setSelectedStudent(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
