"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users, Search, X, Building2, BookOpen, GraduationCap, RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface StudentKajur {
  id: string;
  name: string;
  nis: string;
  class_name: string;
  company_name: string;
  teacher_name: string;
  attendance_pct: number;
  total_journals: number;
  status: "active" | "completed" | "pending" | "cancelled";
}

const STATUS_COLOR: Record<string, string> = {
  active: "text-emerald-600 bg-emerald-50",
  completed: "text-blue-600 bg-blue-50",
  pending: "text-amber-600 bg-amber-50",
  cancelled: "text-red-600 bg-red-50",
};

function StudentCard({ student, index }: { student: StudentKajur; index: number }) {
  const attColor = student.attendance_pct >= 85 ? "bg-emerald-500" : student.attendance_pct >= 70 ? "bg-amber-500" : "bg-red-400";
  const attText = student.attendance_pct >= 85 ? "text-emerald-600" : student.attendance_pct >= 70 ? "text-amber-600" : "text-red-600";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0">
          <span className="text-base font-bold text-white">{student.name.charAt(0)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{student.name}</p>
              <p className="text-[11px] text-slate-500">{student.nis} · {student.class_name}</p>
            </div>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0", STATUS_COLOR[student.status])}>
              {student.status === "active" ? "Aktif" : student.status === "completed" ? "Selesai" : "Pending"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-1.5">
            <Building2 className="w-3 h-3 text-slate-400" />
            <p className="text-[11px] text-slate-500 truncate">{student.company_name}</p>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <GraduationCap className="w-3 h-3 text-slate-400" />
            <p className="text-[11px] text-slate-500 truncate">{student.teacher_name}</p>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full", attColor)} style={{ width: `${student.attendance_pct}%` }} />
            </div>
            <span className={cn("text-[10px] font-bold", attText)}>{student.attendance_pct}%</span>
            <BookOpen className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] text-slate-500">{student.total_journals}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function KajurSiswaPage() {
  const { profile } = useAuthStore();
  const supabase = createClient();
  const [students, setStudents] = useState<StudentKajur[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed">("all");

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      // Ambil department ID kajur
      const { data: teacherData } = await supabase
        .from("teachers")
        .select("department_id, departments(id)")
        .eq("profile_id", profile?.id)
        .single();

      const deptId = (teacherData?.departments as unknown as { id: string } | null)?.id ?? null;


      let query = supabase
        .from("pkl_assignments")
        .select(`
          id, status,
          students (
            id, nis,
            profiles (full_name),
            classes (name)
          ),
          companies (name),
          teachers (profiles (full_name))
        `)
        .order("created_at", { ascending: false });

      // Filter siswa dari jurusan yang sama jika deptId ada
      // (jika perlu filter lebih dalam, bisa ditambah join dengan departments)

      const { data, error } = await query.limit(200);
      if (error) throw error;

      const assignmentIds = (data ?? []).map((a) => a.id);
      const studentIds = (data ?? [])
        .map((a) => (a.students as unknown as { id: string } | null)?.id)
        .filter(Boolean) as string[];

      // Batch load stats
      const [attRes, jRes] = await Promise.all([
        supabase.from("attendance").select("student_id, status").in("student_id", studentIds).eq("type", "check_in"),
        supabase.from("journals").select("student_id, status").in("student_id", studentIds),
      ]);

      const attMap = new Map<string, { verified: number; total: number }>();
      (attRes.data ?? []).forEach((r: { student_id: string; status: string }) => {
        const cur = attMap.get(r.student_id) ?? { verified: 0, total: 0 };
        cur.total++;
        if (r.status === "verified") cur.verified++;
        attMap.set(r.student_id, cur);
      });

      const jMap = new Map<string, number>();
      (jRes.data ?? []).forEach((r: { student_id: string; status: string }) => {
        if (r.status !== "draft") jMap.set(r.student_id, (jMap.get(r.student_id) ?? 0) + 1);
      });

      const items: StudentKajur[] = (data ?? []).map((a) => {
        const s = a.students as unknown as {
          id: string; nis: string;
          profiles: { full_name: string } | null;
          classes: { name: string } | null;
        } | null;
        const company = a.companies as unknown as { name: string } | null;
        const teacher = a.teachers as unknown as { profiles: { full_name: string } | null } | null;
        const sid = s?.id ?? "";
        const att = attMap.get(sid);
        const pct = att && att.total > 0 ? Math.round((att.verified / att.total) * 100) : 0;

        return {
          id: sid,
          name: s?.profiles?.full_name ?? "Siswa",
          nis: s?.nis ?? "-",
          class_name: s?.classes?.name ?? "-",
          company_name: company?.name ?? "-",
          teacher_name: teacher?.profiles?.full_name ?? "-",
          attendance_pct: pct,
          total_journals: jMap.get(sid) ?? 0,
          status: a.status as StudentKajur["status"],
        };
      }).filter((s) => s.id);

      setStudents(items);
    } catch (err) {
      console.error("kajurSiswa error:", err);
      toast.error("Gagal memuat data siswa");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const classes = [...new Set(students.map((s) => s.class_name).filter((c) => c !== "-"))];

  const filtered = useMemo(() => {
    let r = [...students];
    if (filterStatus !== "all") r = r.filter((s) => s.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((s) => s.name.toLowerCase().includes(q) || s.nis.includes(q) || s.company_name.toLowerCase().includes(q));
    }
    return r;
  }, [students, filterStatus, search]);

  const activeCount = students.filter((s) => s.status === "active").length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">Data Siswa PKL</h1>
            <p className="text-xs text-slate-400 mt-px">{students.length} siswa · {activeCount} aktif</p>
          </div>
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => loadData(true)} disabled={refreshing} className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500">
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          </motion.button>
        </div>

        {!loading && students.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-lg shadow-purple-200/60">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{students.length} Total Siswa PKL</p>
              <p className="text-xs text-purple-100">{activeCount} aktif · {students.filter((s) => s.status === "completed").length} selesai</p>
            </div>
          </motion.div>
        )}

        <div className="flex items-center gap-2.5 px-3.5 h-12 rounded-2xl bg-white border border-slate-200">
          <Search className="w-4 h-4 text-slate-400" />
          <input type="search" placeholder="Cari siswa, NIS, perusahaan..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm outline-none text-slate-800 placeholder:text-slate-400" />
          {search && <button onClick={() => setSearch("")} className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center"><X className="w-3 h-3 text-slate-500" /></button>}
        </div>

        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
          {(["all", "active", "completed"] as const).map((f) => {
            const cnt = f === "all" ? students.length : students.filter((s) => s.status === f).length;
            return (
              <button key={f} onClick={() => setFilterStatus(f)}
                className={cn("flex-shrink-0 px-4 h-8 rounded-full text-xs font-bold transition-all flex items-center gap-1.5", filterStatus === f ? "bg-purple-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600")}>
                {f === "all" ? "Semua" : f === "active" ? "Aktif" : "Selesai"}
                <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full", filterStatus === f ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500")}>{cnt}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">Tidak ada siswa ditemukan</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s, i) => <StudentCard key={s.id} student={s} index={i} />)}
          </div>
        )}
        <div className="h-4" />
      </div>
    </div>
  );
}
