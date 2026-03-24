"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, X, RefreshCw, Users, BookOpen, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TeacherKajur {
  id: string;
  name: string;
  nip: string | null;
  active_students: number;
  pending_journals: number;
  pending_absences: number;
}

export default function KajurGuruPage() {
  const supabase = createClient();
  const [teachers, setTeachers] = useState<TeacherKajur[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const { data: teacherData, error } = await supabase
        .from("teachers")
        .select("id, nip, profiles(full_name)")
        .order("id");

      if (error) throw error;

      // Hitung siswa aktif per guru
      const { data: assignData } = await supabase
        .from("pkl_assignments")
        .select("teacher_id")
        .eq("status", "active");

      const assignMap = new Map<string, number>();
      (assignData ?? []).forEach((r: { teacher_id: string | null }) => {
        if (r.teacher_id) assignMap.set(r.teacher_id, (assignMap.get(r.teacher_id) ?? 0) + 1);
      });

      // Pending journals
      const { data: jData } = await supabase
        .from("journals")
        .select("teacher_id")
        .eq("status", "submitted");

      const jMap = new Map<string, number>();
      (jData ?? []).forEach((r: { teacher_id: string | null }) => {
        if (r.teacher_id) jMap.set(r.teacher_id, (jMap.get(r.teacher_id) ?? 0) + 1);
      });

      setTeachers((teacherData ?? []).map((t) => ({
        id: t.id,
        name: (t.profiles as unknown as { full_name: string } | null)?.full_name ?? "Guru",
        nip: t.nip ?? null,
        active_students: assignMap.get(t.id) ?? 0,
        pending_journals: jMap.get(t.id) ?? 0,
        pending_absences: 0,
      })));
    } catch (err) {
      console.error("kajurGuru error:", err);
      toast.error("Gagal memuat data guru");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return teachers;
    const q = search.toLowerCase();
    return teachers.filter((t) => t.name.toLowerCase().includes(q));
  }, [teachers, search]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">Guru Pembimbing</h1>
            <p className="text-xs text-slate-400 mt-px">{teachers.length} guru terdaftar di jurusan</p>
          </div>
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => loadData(true)} disabled={refreshing}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500">
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          </motion.button>
        </div>

        <div className="flex items-center gap-2.5 px-3.5 h-12 rounded-2xl bg-white border border-slate-200">
          <Search className="w-4 h-4 text-slate-400" />
          <input type="search" placeholder="Cari guru..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm outline-none text-slate-800 placeholder:text-slate-400" />
          {search && <button onClick={() => setSearch("")} className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center"><X className="w-3 h-3 text-slate-500" /></button>}
        </div>

        {loading ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm font-semibold text-slate-500">Tidak ada guru ditemukan</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((teacher, i) => (
              <motion.div key={teacher.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-base font-bold text-white">{teacher.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{teacher.name}</p>
                    {teacher.nip && <p className="text-[11px] text-slate-500">NIP: {teacher.nip}</p>}

                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {[
                        { label: "Siswa Aktif", value: teacher.active_students, color: "text-blue-600 bg-blue-50" },
                        { label: "Jurnal Pending", value: teacher.pending_journals, color: teacher.pending_journals > 0 ? "text-amber-600 bg-amber-50" : "text-slate-500 bg-slate-100" },
                        { label: "Izin Pending", value: teacher.pending_absences, color: teacher.pending_absences > 0 ? "text-red-600 bg-red-50" : "text-slate-500 bg-slate-100" },
                      ].map((stat) => (
                        <div key={stat.label} className={cn("rounded-xl p-2 text-center", stat.color.split(" ")[1])}>
                          <p className={cn("text-base font-bold", stat.color.split(" ")[0])}>{stat.value}</p>
                          <p className="text-[10px] text-slate-500">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        <div className="h-4" />
      </div>
    </div>
  );
}
