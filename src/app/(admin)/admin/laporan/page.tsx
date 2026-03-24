"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, Download, FileText, FileSpreadsheet,
  Users, CalendarCheck, BookOpen, Star, Shield,
  RefreshCw, AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AdminStats {
  totalUsers: number;
  activeSiswa: number;
  avgAttendance: number;
  totalJurnals: number;
  atRisk: number;
  pendingJournals: number;
}

export default function AdminLaporanPage() {
  const supabase = createClient();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const [usersRes, activeAssignRes, jRes, pendingJRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("pkl_assignments").select("students(id)").eq("status", "active"),
        supabase.from("journals").select("id", { count: "exact", head: true }).neq("status", "draft"),
        supabase.from("journals").select("id", { count: "exact", head: true }).eq("status", "submitted"),
      ]);

      const studentIds = (activeAssignRes.data ?? [])
        .map((a) => (a.students as unknown as { id: string } | null)?.id)
        .filter(Boolean) as string[];

      // Hitung avg kehadiran
      let avgAtt = 0;
      let atRisk = 0;
      if (studentIds.length > 0) {
        const { data: attData } = await supabase
          .from("attendance")
          .select("student_id, status")
          .in("student_id", studentIds)
          .eq("type", "check_in");

        const attMap = new Map<string, { v: number; t: number }>();
        (attData ?? []).forEach((r: { student_id: string; status: string }) => {
          const c = attMap.get(r.student_id) ?? { v: 0, t: 0 };
          c.t++; if (r.status === "verified") c.v++;
          attMap.set(r.student_id, c);
        });

        const pcts = studentIds.map((sid) => {
          const c = attMap.get(sid);
          return c && c.t > 0 ? Math.round((c.v / c.t) * 100) : 0;
        });
        avgAtt = pcts.length > 0 ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
        atRisk = pcts.filter((p) => p < 75 && p > 0).length;
      }

      setStats({
        totalUsers: usersRes.count ?? 0,
        activeSiswa: studentIds.length,
        avgAttendance: avgAtt,
        totalJurnals: jRes.count ?? 0,
        atRisk,
        pendingJournals: pendingJRes.count ?? 0,
      });
    } catch (err) {
      console.error("adminLaporan error:", err);
      toast.error("Gagal memuat data laporan");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const [exporting, setExporting] = useState<"excel" | null>(null);

  const handleExcelExport = async () => {
    setExporting("excel");
    try {
      const { data: assignments } = await supabase
        .from("pkl_assignments")
        .select(`
          id, status, start_date, end_date,
          students(nis, profiles(full_name), classes(name)),
          companies(name, city),
          teachers(profiles(full_name))
        `)
        .order("created_at", { ascending: false });

      const { exportAssignmentsExcel, getExportDateLabel } = await import("@/lib/export-utils");
      exportAssignmentsExcel(
        (assignments ?? []).map((a) => {
          const s = a.students as unknown as { nis: string; profiles: { full_name: string } | null; classes: { name: string } | null } | null;
          const c = a.companies as unknown as { name: string; city: string | null } | null;
          const t = a.teachers as unknown as { profiles: { full_name: string } | null } | null;
          return {
            student_name: s?.profiles?.full_name ?? "-",
            student_nis: s?.nis ?? "-",
            student_class: s?.classes?.name ?? "-",
            company_name: c?.name ?? "-",
            company_city: c?.city ?? "-",
            teacher_name: t?.profiles?.full_name ?? "-",
            start_date: a.start_date ?? "-",
            end_date: a.end_date ?? "-",
            status: a.status ?? "-",
          };
        }),
        getExportDateLabel()
      );
      toast.success("Export Excel berhasil diunduh ✅");
    } catch { toast.error("Gagal export data"); } finally { setExporting(null); }
  };

  const SUMMARY = [
    { label: "Total Pengguna", value: stats?.totalUsers ?? 0, suffix: "", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Siswa Aktif PKL", value: stats?.activeSiswa ?? 0, suffix: "", color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Kehadiran Rata-rata", value: stats?.avgAttendance ?? 0, suffix: "%", color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Total Jurnal diisi", value: stats?.totalJurnals ?? 0, suffix: "", color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const REPORTS = [
    { icon: Users,         title: "Laporan Pengguna",              desc: "Semua user per role dan status",      color: "text-blue-600",   bg: "bg-blue-50" },
    { icon: CalendarCheck, title: "Laporan Presensi Keseluruhan",  desc: "Rekap kehadiran semua jurusan",       color: "text-emerald-600", bg: "bg-emerald-50" },
    { icon: BookOpen,      title: "Laporan Jurnal PKL",            desc: "Statistik pengisian jurnal",          color: "text-purple-600", bg: "bg-purple-50" },
    { icon: Star,          title: "Laporan Penilaian",             desc: "Rekap nilai akhir PKL",               color: "text-amber-600",  bg: "bg-amber-50" },
    { icon: Shield,        title: "Log Audit Sistem",              desc: "Aktivitas admin dan perubahan data",  color: "text-slate-600",  bg: "bg-slate-100" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">Laporan & Statistik</h1>
            <p className="text-xs text-slate-400 mt-px">Data real-time seluruh program PKL</p>
          </div>
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => loadData(true)} disabled={refreshing}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500">
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          </motion.button>
        </div>

        {/* Alert */}
        {!loading && stats && (stats.atRisk > 0 || stats.pendingJournals > 0) && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-2">
            {stats.atRisk > 0 && (
              <div className="flex items-center gap-2.5 p-3 bg-red-50 border border-red-100 rounded-2xl">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs font-semibold text-red-700">{stats.atRisk} siswa kehadiran di bawah 75%</p>
              </div>
            )}
            {stats.pendingJournals > 0 && (
              <div className="flex items-center gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-2xl">
                <BookOpen className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <p className="text-xs font-semibold text-amber-700">{stats.pendingJournals} jurnal menunggu verifikasi guru</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          {SUMMARY.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className={cn("rounded-2xl p-4", s.bg)}>
              {loading
                ? <div className="h-9 w-16 bg-white/50 rounded animate-pulse mb-1" />
                : <p className={cn("text-2xl font-extrabold", s.color)}>{s.value}{s.suffix}</p>}
              <p className="text-xs text-slate-600 mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Reports */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Laporan Tersedia</p>
          {REPORTS.map((r, i) => {
            const Icon = r.icon;
            return (
              <motion.button key={r.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                onClick={() => toast.info("Fitur laporan detail sedang dalam pengembangan")}
                className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-px active:scale-[0.98] transition-all flex items-center gap-3">
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", r.bg)}>
                  <Icon className={cn("w-5.5 h-5.5", r.color)} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-bold text-slate-900">{r.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{r.desc}</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full flex-shrink-0">Segera</span>
              </motion.button>
            );
          })}
        </div>

        {/* Export */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Export Data</p>
          {[
            { icon: FileText, label: "Export PDF Lengkap", color: "text-red-600", bg: "bg-red-50" },
            { icon: FileSpreadsheet, label: "Export Excel / CSV", color: "text-emerald-600", bg: "bg-emerald-50" },
          ].map((e, i) => {
            const Icon = e.icon;
            return (
              <motion.button key={e.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.06 }}
                onClick={() => {
                  if (e.label.includes("Excel")) handleExcelExport();
                  else {
                    import("@/lib/print-utils").then(async ({ printAssignments }) => {
                      const { data: assignments } = await supabase
                        .from("pkl_assignments")
                        .select("id, status, start_date, end_date, students(nis, profiles(full_name), classes(name)), companies(name, city), teachers(profiles(full_name))")
                        .order("created_at", { ascending: false });
                      printAssignments(
                        (assignments ?? []).map((a) => {
                          const s = a.students as unknown as { nis: string; profiles: { full_name: string } | null; classes: { name: string } | null } | null;
                          const c = a.companies as unknown as { name: string; city: string | null } | null;
                          const t = a.teachers as unknown as { profiles: { full_name: string } | null } | null;
                          return { student_name: s?.profiles?.full_name ?? "-", student_nis: s?.nis ?? "-", student_class: s?.classes?.name ?? "-", company_name: c?.name ?? "-", teacher_name: t?.profiles?.full_name ?? "-", start_date: a.start_date ?? "-", end_date: a.end_date ?? "-", status: a.status ?? "-" };
                        })
                      );
                    });
                  }
                }}
                disabled={exporting === "excel" && e.label.includes("Excel")}
                className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-px active:scale-[0.98] transition-all disabled:opacity-60">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", e.bg)}>
                  <Icon className={cn("w-5 h-5", e.color)} />
                </div>
                <p className="flex-1 text-sm font-bold text-slate-900 text-left">{e.label}</p>
                {exporting === "excel" && e.label.includes("Excel")
                  ? <span className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  : <Download className="w-4 h-4 text-slate-400" />}
              </motion.button>
            );
          })}
        </div>
        <div className="h-4" />
      </div>
    </div>
  );
}
