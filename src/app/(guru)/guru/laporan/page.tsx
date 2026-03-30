"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  Users,
  CalendarCheck,
  BookOpen,
  Star,
  FileSpreadsheet,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LaporanStats {
  total_students: number;
  active_students: number;
  avg_attendance_pct: number;
  total_journals: number;
  submitted_journals: number;
  pending_izin: number;
  approved_izin: number;
}

export default function GuruLaporanPage() {
  const { profile } = useAuthStore();
  const supabase = createClient();

  const [stats, setStats] = useState<LaporanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  /* ── Load stats ──────────────────────────────────────── */

  const loadStats = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      if (!profile?.id) return;

      const { data: teacherRow } = await supabase.from("teachers").select("id").eq("profile_id", profile.id).single();
      const teacherId = teacherRow?.id;
      if (!teacherId) return;

      // Ambil semua assignment guru
      const { data: assignments } = await supabase
        .from("pkl_assignments")
        .select("id, status, students(id)")
        .eq("teacher_id", teacherId);

      if (!assignments || assignments.length === 0) {
        setStats({
          total_students: 0,
          active_students: 0,
          avg_attendance_pct: 0,
          total_journals: 0,
          submitted_journals: 0,
          pending_izin: 0,
          approved_izin: 0,
        });
        return;
      }

      const assignmentIds = assignments.map((a) => a.id);
      const studentIds = assignments
        .map((a) => (a.students as unknown as { id: string } | null)?.id)
        .filter(Boolean) as string[];
      const activeCount = assignments.filter((a) => a.status === "active").length;

      // Gathering stats secara paralel
      const [attResult, journalResult, absenceResult] = await Promise.all([
        supabase
          .from("attendance")
          .select("status")
          .in("pkl_assignment_id", assignmentIds)
          .eq("type", "check_in"),
        supabase
          .from("journals")
          .select("status")
          .in("pkl_assignment_id", assignmentIds),
        supabase
          .from("absence_requests")
          .select("status")
          .in("student_id", studentIds),
      ]);

      const allAtt = attResult.data ?? [];
      const verifiedAtt = allAtt.filter((a) => a.status === "verified").length;
      const avgPct = allAtt.length > 0 ? Math.round((verifiedAtt / allAtt.length) * 100) : 0;

      const allJournals = journalResult.data ?? [];
      const submittedJournals = allJournals.filter((j) => j.status !== "draft").length;

      const allAbsences = absenceResult.data ?? [];
      const pendingIzin = allAbsences.filter((a) => a.status === "pending").length;
      const approvedIzin = allAbsences.filter((a) => a.status === "approved").length;

      setStats({
        total_students: assignments.length,
        active_students: activeCount,
        avg_attendance_pct: avgPct,
        total_journals: allJournals.length,
        submitted_journals: submittedJournals,
        pending_izin: pendingIzin,
        approved_izin: approvedIzin,
      });
    } catch (err) {
      console.error("loadStats error:", err);
      toast.error("Gagal memuat data laporan");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  /* ── Export handlers ─────────────────────────────────── */

  const handleExport = async (type: "pdf" | "excel") => {
    if (type === "pdf") {
      if (!profile?.id) return;
      setExporting("pdf");
      try {
        const { data: teacherRow } = await supabase
          .from("teachers").select("id").eq("profile_id", profile.id).single();
        const teacherId = teacherRow?.id;
        if (!teacherId) { toast.error("Data guru tidak ditemukan"); return; }

        const { data: assignments } = await supabase
          .from("pkl_assignments")
          .select("id, students(nis, profiles(full_name)), companies(name)")
          .eq("teacher_id", teacherId);

        const assignIds = (assignments ?? []).map((a) => a.id);
        const { data: grades } = await supabase.from("grades").select("*").in("assignment_id", assignIds);
        const gradeMap = new Map((grades ?? []).map((g) => [g.assignment_id, g]));

        const { printGrades } = await import("@/lib/print-utils");
        printGrades(
          (assignments ?? []).map((a) => {
            const s = a.students as unknown as { nis: string; profiles: { full_name: string } | null } | null;
            const c = a.companies as unknown as { name: string } | null;
            const g = gradeMap.get(a.id);
            return {
              student_name: s?.profiles?.full_name ?? "-",
              student_nis: s?.nis ?? "-",
              company_name: c?.name ?? "-",
              attendance_score: g?.attendance_score ?? null,
              journal_score: g?.journal_score ?? null,
              performance_score: g?.performance_score ?? null,
              attitude_score: g?.attitude_score ?? null,
              final_score: g?.final_score ?? null,
              grade: g?.grade ?? null,
            };
          }),
          profile?.full_name ?? undefined
        );
      } catch { toast.error("Gagal membuka PDF"); } finally { setExporting(null); }
      return;
    }

    if (!profile?.id) return;
    setExporting("excel");
    try {
      // Ambil data siswa + grades untuk export
      const { data: teacherRow } = await supabase
        .from("teachers").select("id").eq("profile_id", profile.id).single();
      const teacherId = teacherRow?.id;
      if (!teacherId) { toast.error("Data guru tidak ditemukan"); return; }

      const { data: assignments } = await supabase
        .from("pkl_assignments")
        .select(`
          id, status, start_date, end_date,
          students(nis, profiles(full_name), classes(name)),
          companies(name)
        `)
        .eq("teacher_id", teacherId);

      const assignIds = (assignments ?? []).map((a) => a.id);
      const { data: grades } = await supabase
        .from("grades").select("*").in("assignment_id", assignIds);
      const { data: attendance } = await supabase
        .from("attendance").select("student_id, status")
        .in("student_id", (assignments ?? []).map((a) =>
          (a.students as unknown as { id?: string } | null)?.id ?? "").filter(Boolean))
        .eq("type", "check_in");

      const gradeMap = new Map((grades ?? []).map((g) => [g.assignment_id, g]));
      const attMap = new Map<string, { v: number; t: number }>();
      (attendance ?? []).forEach((r: { student_id: string; status: string }) => {
        const c = attMap.get(r.student_id) ?? { v: 0, t: 0 };
        c.t++; if (r.status === "verified") c.v++;
        attMap.set(r.student_id, c);
      });

      const { exportGradesExcel, getExportDateLabel } = await import("@/lib/export-utils");
      exportGradesExcel(
        (assignments ?? []).map((a) => {
          const s = a.students as unknown as { nis: string; profiles: { full_name: string } | null; classes: { name: string } | null } | null;
          const c = a.companies as unknown as { name: string } | null;
          const g = gradeMap.get(a.id);
          return {
            student_name: s?.profiles?.full_name ?? "-",
            student_nis: s?.nis ?? "-",
            company_name: c?.name ?? "-",
            attendance_score: g?.attendance_score ?? null,
            journal_score: g?.journal_score ?? null,
            performance_score: g?.performance_score ?? null,
            attitude_score: g?.attitude_score ?? null,
            final_score: g?.final_score ?? null,
            grade: g?.grade ?? null,
            notes: g?.notes ?? "",
          };
        }),
        getExportDateLabel()
      );
      toast.success("Export Excel berhasil diunduh ✅");
    } catch (err) {
      console.error("export error:", err);
      toast.error("Gagal export data");
    } finally {
      setExporting(null);
    }
  };


  /* ── Render ─────────────────────────────────────────── */

  const summaryStats = stats
    ? [
        {
          label: "Total Siswa",
          value: stats.total_students.toString(),
          sub: `${stats.active_students} aktif`,
          icon: Users,
          color: "text-blue-600",
          bg: "bg-blue-50",
          up: true,
        },
        {
          label: "Rata-rata Kehadiran",
          value: `${stats.avg_attendance_pct}%`,
          sub: stats.avg_attendance_pct >= 85 ? "✓ Baik" : "Perlu perhatian",
          icon: CalendarCheck,
          color: "text-emerald-600",
          bg: "bg-emerald-50",
          up: stats.avg_attendance_pct >= 80,
        },
        {
          label: "Total Jurnal",
          value: stats.submitted_journals.toString(),
          sub: `dari ${stats.total_journals} entri`,
          icon: BookOpen,
          color: "text-purple-600",
          bg: "bg-purple-50",
          up: true,
        },
        {
          label: "Izin Terproses",
          value: stats.approved_izin.toString(),
          sub: `${stats.pending_izin} menunggu`,
          icon: FileText,
          color: "text-amber-600",
          bg: "bg-amber-50",
          up: stats.pending_izin === 0,
        },
      ]
    : [];

  const reportSections = [
    {
      icon: CalendarCheck,
      title: "Rekap Presensi",
      desc: "Laporan kehadiran semua siswa bimbingan",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      badge: stats ? `${stats.total_students} siswa` : "-",
      badge_color: "text-emerald-700 bg-emerald-50",
    },
    {
      icon: BookOpen,
      title: "Rekap Jurnal",
      desc: "Statistik pengisian jurnal harian",
      color: "text-purple-600",
      bg: "bg-purple-50",
      badge: stats ? `${stats.submitted_journals} jurnal` : "-",
      badge_color: "text-purple-700 bg-purple-50",
    },
    {
      icon: Star,
      title: "Rekap Penilaian",
      desc: "Nilai akhir PKL semua siswa",
      color: "text-amber-600",
      bg: "bg-amber-50",
      badge: stats ? `${stats.active_students} aktif` : "-",
      badge_color: "text-amber-700 bg-amber-50",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">Laporan PKL</h1>
            <p className="text-xs text-slate-400 mt-px">Rekap & statistik siswa bimbingan</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => loadStats(true)}
            disabled={refreshing || loading}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500"
            aria-label="Refresh"
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          </motion.button>
        </div>

        {/* Summary cards */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-3"
          >
            {summaryStats.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
                >
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-2", s.bg)}>
                    <Icon className={cn("w-4.5 h-4.5", s.color)} />
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
                  <div className={cn("flex items-center gap-1 mt-1.5", s.up ? "text-emerald-600" : "text-amber-600")}>
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-[11px] font-semibold">{s.sub}</span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Low attendance warning */}
        {!loading && stats && stats.avg_attendance_pct < 80 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl"
          >
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-800">Rata-rata kehadiran di bawah 80%</p>
              <p className="text-xs text-amber-600">Perlu tindak lanjut untuk siswa dengan kehadiran rendah</p>
            </div>
          </motion.div>
        )}

        {/* Report sections */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Laporan per Modul</p>
          {reportSections.map((sec, i) => {
            const Icon = sec.icon;
            return (
              <motion.button
                key={sec.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
                className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-px active:scale-[0.98] transition-all flex items-center gap-3"
                onClick={() => toast.info(`Halaman detail "${sec.title}" dalam pengembangan`)}
              >
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", sec.bg)}>
                  <Icon className={cn("w-5.5 h-5.5", sec.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900">{sec.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{sec.desc}</p>
                </div>
                <span className={cn("text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0", sec.badge_color)}>
                  {loading ? "..." : sec.badge}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Export section */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Export Laporan</p>

          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => handleExport("pdf")}
            disabled={!!exporting}
            className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-px active:scale-[0.98] disabled:opacity-60 transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              {exporting === "pdf" ? (
                <Loader2 className="w-5 h-5 text-red-600 animate-spin" />
              ) : (
                <FileText className="w-5.5 h-5.5 text-red-600" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-slate-900">Export PDF</p>
              <p className="text-xs text-slate-500">Laporan lengkap format PDF</p>
            </div>
            <Download className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36 }}
            onClick={() => handleExport("excel")}
            disabled={!!exporting}
            className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-px active:scale-[0.98] disabled:opacity-60 transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              {exporting === "excel" ? (
                <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-5.5 h-5.5 text-emerald-600" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-slate-900">Export Excel</p>
              <p className="text-xs text-slate-500">Data rekap format spreadsheet</p>
            </div>
            <Download className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </motion.button>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
