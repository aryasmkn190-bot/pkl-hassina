"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CalendarCheck, Download, FileSpreadsheet, RefreshCw, AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DailyStats {
  hadir: number;
  izin: number;
  sakit: number;
  alfa: number;
  total: number;
}

interface WeeklyItem {
  day: string;
  date: string;
  pct: number;
  hadir: number;
  total: number;
}

export default function KajurPresensiPage() {
  const supabase = createClient();
  const [daily, setDaily] = useState<DailyStats | null>(null);
  const [weekly, setWeekly] = useState<WeeklyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      // Ambil semua siswa PKL aktif
      const { data: assignments } = await supabase
        .from("pkl_assignments")
        .select("students(id)")
        .eq("status", "active");

      const studentIds = (assignments ?? [])
        .map((a) => (a.students as unknown as { id: string } | null)?.id)
        .filter(Boolean) as string[];

      if (studentIds.length === 0) {
        setDaily({ hadir: 0, izin: 0, sakit: 0, alfa: 0, total: 0 });
        setWeekly([]);
        return;
      }

      // Presensi today
      const todayStr = new Date().toISOString().split("T")[0];
      const { data: todayAtt } = await supabase
        .from("attendance")
        .select("student_id, status, attendance_type_id")
        .in("student_id", studentIds)
        .eq("type", "check_in")
        .gte("check_in_time", `${todayStr}T00:00:00`)
        .lte("check_in_time", `${todayStr}T23:59:59`);

      // Hitung status hari ini
      const statusMap: Record<string, string> = {};
      (todayAtt ?? []).forEach((r: { student_id: string; status: string }) => {
        statusMap[r.student_id] = r.status;
      });

      const hadir = Object.values(statusMap).filter((s) => s === "verified").length;
      const izin = 0; // Ambil dari leave_requests jika ada
      const sakit = 0;
      const alfa = studentIds.length - hadir;

      setDaily({ hadir, izin, sakit, alfa: Math.max(0, alfa), total: studentIds.length });

      // Weekly trend (7 hari terakhir)
      const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
      const weekItems: WeeklyItem[] = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const dayName = days[d.getDay()];

        const { data: dayAtt } = await supabase
          .from("attendance")
          .select("student_id, status")
          .in("student_id", studentIds)
          .eq("type", "check_in")
          .gte("check_in_time", `${dateStr}T00:00:00`)
          .lte("check_in_time", `${dateStr}T23:59:59`);

        const totalDay = (dayAtt ?? []).length;
        const hadirDay = (dayAtt ?? []).filter((r: { status: string }) => r.status === "verified").length;
        const pct = studentIds.length > 0 ? Math.round((hadirDay / studentIds.length) * 100) : 0;

        if (d.getDay() !== 0 && d.getDay() !== 6) { // Skip Sabtu & Minggu
          weekItems.push({ day: dayName, date: dateStr, pct, hadir: hadirDay, total: studentIds.length });
        }
      }

      setWeekly(weekItems.slice(-5)); // Tampilkan 5 hari kerja terakhir
    } catch (err) {
      console.error("kajurPresensi error:", err);
      toast.error("Gagal memuat data presensi");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const avgPct = weekly.length > 0 ? Math.round(weekly.reduce((a, b) => a + b.pct, 0) / weekly.length) : 0;
  const STATS = [
    { label: "Hadir", value: daily?.hadir ?? 0, color: "bg-emerald-500", textColor: "text-emerald-700" },
    { label: "Izin", value: daily?.izin ?? 0, color: "bg-blue-500", textColor: "text-blue-700" },
    { label: "Sakit", value: daily?.sakit ?? 0, color: "bg-amber-500", textColor: "text-amber-700" },
    { label: "Alfa", value: daily?.alfa ?? 0, color: "bg-red-500", textColor: "text-red-700" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">Rekap Presensi</h1>
            <p className="text-xs text-slate-400 mt-px">Kehadiran siswa PKL hari ini</p>
          </div>
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => loadData(true)} disabled={refreshing}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500">
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          </motion.button>
        </div>

        {loading ? (
          <div className="space-y-4">{[0, 1, 2].map((i) => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-slate-100" />)}</div>
        ) : (
          <>
            {/* Summary banner */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-4 rounded-2xl shadow-lg",
                (daily?.hadir ?? 0) / Math.max(1, daily?.total ?? 1) >= 0.8
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-200/60"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-200/60"
              )}>
              <p className="text-sm font-bold text-white">Rata-rata Kehadiran Minggu Ini</p>
              <p className="text-4xl font-extrabold text-white mt-1">{avgPct || (daily?.total ? Math.round((daily.hadir / daily.total) * 100) : 0)}%</p>
              <p className="text-xs text-white/80 mt-1">Dari {daily?.total ?? 0} siswa aktif PKL</p>
            </motion.div>

            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-2">
              {STATS.map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 text-center">
                  <p className={cn("text-2xl font-extrabold", s.textColor)}>{s.value}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Weekly chart */}
            {weekly.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Kehadiran 5 Hari Kerja Terakhir</p>
                <div className="flex items-end gap-3 h-24">
                  {weekly.map((d) => {
                    const barH = Math.round((d.pct / 100) * 96);
                    const clr = d.pct >= 80 ? "bg-emerald-400" : d.pct >= 60 ? "bg-amber-400" : "bg-red-400";
                    return (
                      <div key={d.day + d.date} className="flex-1 flex flex-col items-center gap-1">
                        <span className={cn("text-[11px] font-bold", d.pct >= 80 ? "text-emerald-600" : d.pct >= 60 ? "text-amber-600" : "text-red-600")}>{d.pct}%</span>
                        <div className="w-full rounded-t-lg bg-slate-100 relative" style={{ height: "64px" }}>
                          <motion.div
                            className={cn("absolute bottom-0 left-0 right-0 rounded-t-lg", clr)}
                            initial={{ height: 0 }}
                            animate={{ height: barH }}
                            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-500">{d.day}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Alert jika ada yang tidak hadir */}
            {(daily?.alfa ?? 0) > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-200 rounded-2xl">
                <AlertCircle className="w-4.5 h-4.5 text-red-600 flex-shrink-0" />
                <p className="text-sm font-semibold text-red-700">
                  {daily?.alfa} siswa belum presensi hari ini
                </p>
              </motion.div>
            )}

            {/* Export */}
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
              className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
              onClick={() => toast.info("Fitur export sedang dalam pengembangan")}>
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-slate-900">Export Rekap Presensi</p>
                <p className="text-xs text-slate-500">Excel / PDF</p>
              </div>
              <Download className="w-4 h-4 text-slate-400" />
            </motion.button>
          </>
        )}
      </div>
    </div>
  );
}
