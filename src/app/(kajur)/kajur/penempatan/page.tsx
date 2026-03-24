"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Link2, GraduationCap, Building2, User, Calendar, RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";

type AssignmentStatus = "active" | "pending" | "completed" | "cancelled";

interface Assignment {
  id: string;
  student_name: string;
  student_nis: string;
  student_class: string;
  company_name: string;
  company_city: string;
  teacher_name: string;
  start_date: string;
  end_date: string;
  status: AssignmentStatus;
}

const STATUS_CFG: Record<AssignmentStatus, { label: string; color: string; bg: string }> = {
  active:    { label: "Aktif",      color: "text-emerald-700", bg: "bg-emerald-50" },
  pending:   { label: "Menunggu",   color: "text-amber-700",   bg: "bg-amber-50" },
  completed: { label: "Selesai",    color: "text-blue-700",    bg: "bg-blue-50" },
  cancelled: { label: "Dibatalkan", color: "text-red-700",     bg: "bg-red-50" },
};

export default function KajurPenempatanPage() {
  const supabase = createClient();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<AssignmentStatus | "all">("all");

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const { data, error } = await supabase
        .from("pkl_assignments")
        .select(`
          id, status, start_date, end_date,
          students (
            nis,
            profiles (full_name),
            classes (name)
          ),
          companies (name, city),
          teachers (
            profiles (full_name)
          )
        `)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      const items: Assignment[] = (data ?? []).map((a) => {
        const s = a.students as unknown as {
          nis: string;
          profiles: { full_name: string } | null;
          classes: { name: string } | null;
        } | null;
        const c = a.companies as unknown as { name: string; city: string | null } | null;
        const t = a.teachers as unknown as { profiles: { full_name: string } | null } | null;
        return {
          id: a.id,
          student_name: s?.profiles?.full_name ?? "Siswa",
          student_nis: s?.nis ?? "-",
          student_class: s?.classes?.name ?? "-",
          company_name: c?.name ?? "-",
          company_city: c?.city ?? "",
          teacher_name: t?.profiles?.full_name ?? "-",
          start_date: a.start_date ?? "",
          end_date: a.end_date ?? "",
          status: a.status as AssignmentStatus,
        };
      });

      setAssignments(items);
    } catch (err) {
      console.error("kajurPenempatan error:", err);
      toast.error("Gagal memuat data penempatan");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() =>
    filter === "all" ? assignments : assignments.filter((a) => a.status === filter),
    [assignments, filter]
  );

  const counts = {
    all: assignments.length,
    active: assignments.filter((a) => a.status === "active").length,
    pending: assignments.filter((a) => a.status === "pending").length,
    completed: assignments.filter((a) => a.status === "completed").length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">Penempatan PKL</h1>
            <p className="text-xs text-slate-400 mt-px">{assignments.length} penempatan terdaftar</p>
          </div>
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => loadData(true)} disabled={refreshing}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500">
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          </motion.button>
        </div>

        {/* Summary */}
        {!loading && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-3">
            {[
              { label: "Aktif",    value: counts.active,    color: "text-emerald-600 bg-emerald-50" },
              { label: "Menunggu", value: counts.pending,   color: "text-amber-600 bg-amber-50" },
              { label: "Selesai",  value: counts.completed, color: "text-blue-600 bg-blue-50" },
            ].map((s) => (
              <div key={s.label} className={cn("rounded-2xl p-3 text-center", s.color.split(" ")[1])}>
                <p className={cn("text-2xl font-extrabold", s.color.split(" ")[0])}>{s.value}</p>
                <p className="text-[11px] text-slate-600 font-medium">{s.label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
          {(["all", "active", "pending", "completed"] as (AssignmentStatus | "all")[]).map((f) => {
            const cnt = f === "all" ? counts.all : counts[f as keyof typeof counts];
            return (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("flex-shrink-0 px-4 h-8 rounded-full text-xs font-bold transition-all flex items-center gap-1.5",
                  filter === f ? "bg-purple-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600")}>
                {f === "all" ? "Semua" : STATUS_CFG[f].label}
                <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full", filter === f ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500")}>{cnt}</span>
              </button>
            );
          })}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse border border-slate-100" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Link2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">Tidak ada penempatan ditemukan</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((a, i) => {
              const sc = STATUS_CFG[a.status];
              return (
                <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-base font-bold text-white">{a.student_name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{a.student_name}</p>
                          <p className="text-[11px] text-slate-500">{a.student_nis} · {a.student_class}</p>
                        </div>
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0", sc.bg, sc.color)}>{sc.label}</span>
                      </div>
                      <div className="mt-1.5 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <p className="text-[11px] text-slate-500 truncate">{a.company_name}{a.company_city ? ` · ${a.company_city}` : ""}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <p className="text-[11px] text-slate-500 truncate">{a.teacher_name}</p>
                        </div>
                        {a.start_date && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <p className="text-[11px] text-slate-500">
                              {formatDate(a.start_date, "dd MMM yyyy")} — {a.end_date ? formatDate(a.end_date, "dd MMM yyyy") : "..."}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
        <div className="h-4" />
      </div>
    </div>
  );
}
