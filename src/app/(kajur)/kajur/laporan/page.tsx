"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, Download, FileText, FileSpreadsheet,
  CalendarCheck, BookOpen, Star, Award, RefreshCw, AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LaporanStats {
  totalSiswa: number;
  avgKehadiran: number;
  totalJurnal: number;
  siswaAtRisk: number;
}

export default function KajurLaporanPage() {
  const supabase = createClient();
  const [stats, setStats] = useState<LaporanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      // Ambil semua assignments aktif
      const { data: assignments } = await supabase
        .from("pkl_assignments")
        .select("id, students(id)")
        .eq("status", "active");

      const studentIds = (assignments ?? [])
        .map((a) => (a.students as unknown as { id: string } | null)?.id)
        .filter(Boolean) as string[];

      const [attRes, jRes] = await Promise.all([
        supabase.from("attendance").select("student_id, status").in("student_id", studentIds).eq("type", "check_in"),
        supabase.from("journals").select("student_id").in("student_id", studentIds).neq("status", "draft"),
      ]);

      // Hitung per siswa
      const attMap = new Map<string, { v: number; t: number }>();
      (attRes.data ?? []).forEach((r: { student_id: string; status: string }) => {
        const c = attMap.get(r.student_id) ?? { v: 0, t: 0 };
        c.t++; if (r.status === "verified") c.v++;
        attMap.set(r.student_id, c);
      });

      const attPcts = studentIds.map((sid) => {
        const c = attMap.get(sid);
        return c && c.t > 0 ? Math.round((c.v / c.t) * 100) : 0;
      });
      const avgPct = attPcts.length > 0 ? Math.round(attPcts.reduce((a, b) => a + b, 0) / attPcts.length) : 0;
      const atRisk = attPcts.filter((p) => p < 75 && p > 0).length;

      setStats({
        totalSiswa: studentIds.length,
        avgKehadiran: avgPct,
        totalJurnal: (jRes.data ?? []).length,
        siswaAtRisk: atRisk,
      });
    } catch (err) {
      console.error("kajurLaporan error:", err);
      toast.error("Gagal memuat data laporan");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const SUMMARY = [
    { label: "Total Siswa Aktif PKL", value: stats?.totalSiswa ?? 0, color: "text-blue-600", bg: "bg-blue-50", suffix: "" },
    { label: "Kehadiran Rata-rata", value: stats?.avgKehadiran ?? 0, color: "text-emerald-600", bg: "bg-emerald-50", suffix: "%" },
    { label: "Total Jurnal diisi", value: stats?.totalJurnal ?? 0, color: "text-purple-600", bg: "bg-purple-50", suffix: "" },
    { label: "Siswa Perlu Perhatian", value: stats?.siswaAtRisk ?? 0, color: "text-red-600", bg: "bg-red-50", suffix: "" },
  ];

  const REPORT_ITEMS = [
    { icon: CalendarCheck, title: "Laporan Presensi Lengkap", desc: "Rekap kehadiran per siswa dan per kelas", color: "text-emerald-600", bg: "bg-emerald-50" },
    { icon: BookOpen, title: "Laporan Jurnal", desc: "Statistik pengisian dan review jurnal", color: "text-purple-600", bg: "bg-purple-50" },
    { icon: Star, title: "Laporan Penilaian", desc: "Nilai akhir PKL per siswa dan guru pembimbing", color: "text-amber-600", bg: "bg-amber-50" },
    { icon: Award, title: "Laporan Komprehensif Jurusan", desc: "Ringkasan lengkap seluruh program PKL", color: "text-blue-600", bg: "bg-blue-50" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">Laporan PKL</h1>
            <p className="text-xs text-slate-400 mt-px">Rekap dan analisis program PKL jurusan</p>
          </div>
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => loadData(true)} disabled={refreshing}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500">
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          </motion.button>
        </div>

        {/* Alert at-risk */}
        {!loading && stats && stats.siswaAtRisk > 0 && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-200 rounded-2xl">
            <AlertTriangle className="w-4.5 h-4.5 text-red-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-red-700">
              {stats.siswaAtRisk} siswa memiliki kehadiran di bawah 75%
            </p>
          </motion.div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          {SUMMARY.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              {loading
                ? <div className="h-8 w-16 bg-slate-100 rounded animate-pulse mb-1" />
                : <p className={cn("text-2xl font-extrabold", s.color)}>{s.value}{s.suffix}</p>}
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Report items */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Laporan Tersedia</p>
          {REPORT_ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.button key={item.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
                className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-px active:scale-[0.98] transition-all flex items-center gap-3">
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", item.bg)}>
                  <Icon className={cn("w-5.5 h-5.5", item.color)} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-bold text-slate-900">{item.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
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
            { icon: FileText, label: "Export PDF", desc: "Laporan format PDF siap cetak", color: "text-red-600", bg: "bg-red-50" },
            { icon: FileSpreadsheet, label: "Export Excel", desc: "Data mentah spreadsheet (.xlsx)", color: "text-emerald-600", bg: "bg-emerald-50" },
          ].map((exp, i) => {
            const Icon = exp.icon;
            return (
              <motion.button key={exp.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.06 }}
                className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-px active:scale-[0.98] transition-all"
              onClick={() => {
                if (exp.label.includes("Excel")) handleExcelExport();
                else {
                  // PDF via print
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
              disabled={exporting === "excel" && exp.label.includes("Excel")}>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", exp.bg)}>
                  <Icon className={cn("w-5 h-5", exp.color)} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-slate-900">{exp.label}</p>
                  <p className="text-[11px] text-slate-500">{exp.desc}</p>
                </div>
                <Download className="w-4 h-4 text-slate-400 flex-shrink-0" />
              </motion.button>
            );
          })}
        </div>
        <div className="h-4" />
      </div>
    </div>
  );
}
