"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2, Plus, Search, X, ArrowLeft, Save, Loader2,
  GraduationCap, Building2, User, Users, RefreshCw,
  CheckCircle2, Clock, XCircle, Pencil, Calendar,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";

type Status = "active" | "pending" | "completed" | "cancelled";

interface Assignment {
  id: string;
  student_id: string;
  teacher_id: string | null;
  company_id: string | null;
  status: Status;
  start_date: string | null;
  end_date: string | null;
  student_name: string;
  student_nis: string;
  student_class: string;
  teacher_name: string;
  company_name: string;
}

interface Student { id: string; name: string; nis: string; class_name: string; }
interface Teacher { id: string; name: string; }
interface Company { id: string; name: string; city: string | null; }

const STATUS_CFG: Record<Status, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  active:    { label: "Aktif",      color: "text-emerald-700", bg: "bg-emerald-50", icon: CheckCircle2 },
  pending:   { label: "Menunggu",   color: "text-amber-700",   bg: "bg-amber-50",   icon: Clock },
  completed: { label: "Selesai",    color: "text-blue-700",    bg: "bg-blue-50",    icon: CheckCircle2 },
  cancelled: { label: "Dibatalkan", color: "text-red-700",     bg: "bg-red-50",     icon: XCircle },
};

/* ── Assignment Form ──────────────────────────────────── */

function AssignmentForm({
  assignment,
  students,
  teachers,
  companies,
  onClose,
  onSave,
}: {
  assignment: Partial<Assignment> | null;
  students: Student[];
  teachers: Teacher[];
  companies: Company[];
  onClose: () => void;
  onSave: (data: Partial<Assignment>) => Promise<void>;
}) {
  const isEdit = !!assignment?.id;
  const [form, setForm] = useState<Partial<Assignment>>(assignment ?? { status: "active" });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof Assignment, v: string | null) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.student_id || !form.teacher_id || !form.company_id) {
      toast.error("Siswa, guru, dan perusahaan wajib dipilih");
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto"
    >
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 h-[60px] bg-white/90 backdrop-blur-xl border-b border-slate-200/60">
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
          <ArrowLeft className="w-4.5 h-4.5 text-slate-700" strokeWidth={2.5} />
        </button>
        <h1 className="text-[16px] font-bold text-slate-900 flex-1">
          {isEdit ? "Edit Penugasan" : "Buat Penugasan Baru"}
        </h1>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-3 h-8 rounded-xl bg-blue-600 text-white text-xs font-bold disabled:opacity-60">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Simpan
        </button>
      </header>

      <div className="px-4 py-5 max-w-2xl mx-auto space-y-4 pb-8">

        {/* Siswa */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Siswa *</p>
          <select
            value={form.student_id ?? ""}
            onChange={(e) => set("student_id", e.target.value || null)}
            className="w-full text-sm text-slate-800 outline-none bg-transparent"
          >
            <option value="">-- Pilih Siswa --</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.nis}) - {s.class_name}</option>
            ))}
          </select>
        </div>

        {/* Guru */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Guru Pembimbing *</p>
          <select
            value={form.teacher_id ?? ""}
            onChange={(e) => set("teacher_id", e.target.value || null)}
            className="w-full text-sm text-slate-800 outline-none bg-transparent"
          >
            <option value="">-- Pilih Guru --</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Perusahaan */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Perusahaan *</p>
          <select
            value={form.company_id ?? ""}
            onChange={(e) => set("company_id", e.target.value || null)}
            className="w-full text-sm text-slate-800 outline-none bg-transparent"
          >
            <option value="">-- Pilih Perusahaan --</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.city ? ` — ${c.city}` : ""}</option>
            ))}
          </select>
        </div>

        {/* Tanggal */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Periode PKL</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] text-slate-400 mb-1">Tanggal Mulai</p>
              <input type="date" value={form.start_date ?? ""} onChange={(e) => set("start_date", e.target.value || null)}
                className="w-full text-sm text-slate-800 outline-none bg-transparent" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 mb-1">Tanggal Selesai</p>
              <input type="date" value={form.end_date ?? ""} onChange={(e) => set("end_date", e.target.value || null)}
                className="w-full text-sm text-slate-800 outline-none bg-transparent" />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Status Penugasan</p>
          <div className="grid grid-cols-2 gap-2">
            {(["active", "pending", "completed", "cancelled"] as Status[]).map((s) => {
              const cfg = STATUS_CFG[s];
              return (
                <button key={s} onClick={() => set("status", s)}
                  className={cn("flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all",
                    form.status === s ? "border-blue-500 bg-blue-50" : "border-slate-200")}>
                  <span className={cn("text-xs font-bold", form.status === s ? "text-blue-700" : cfg.color)}>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main Page ──────────────────────────────────────────── */

export default function AdminPenugasanPage() {
  const supabase = createClient();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [editTarget, setEditTarget] = useState<Partial<Assignment> | null | undefined>(undefined);

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const [assignRes, studRes, teachRes, compRes] = await Promise.all([
        supabase
          .from("pkl_assignments")
          .select(`
            id, status, start_date, end_date,
            student_id, teacher_id, company_id,
            students(nis, profiles(full_name), classes(name)),
            teachers(profiles(full_name)),
            companies(name, city)
          `)
          .order("created_at", { ascending: false })
          .limit(300),
        supabase
          .from("students")
          .select("id, nis, profiles(full_name), classes(name)")
          .order("id"),
        supabase
          .from("teachers")
          .select("id, profiles(full_name)")
          .order("id"),
        supabase
          .from("companies")
          .select("id, name, city")
          .eq("is_active", true)
          .order("name"),
      ]);

      // Parse assignments
      setAssignments((assignRes.data ?? []).map((a) => {
        const s = a.students as unknown as { nis: string; profiles: { full_name: string } | null; classes: { name: string } | null } | null;
        const t = a.teachers as unknown as { profiles: { full_name: string } | null } | null;
        const c = a.companies as unknown as { name: string; city: string | null } | null;
        return {
          id: a.id,
          student_id: a.student_id ?? "",
          teacher_id: a.teacher_id,
          company_id: a.company_id,
          status: a.status as Status,
          start_date: a.start_date,
          end_date: a.end_date,
          student_name: s?.profiles?.full_name ?? "Siswa",
          student_nis: s?.nis ?? "-",
          student_class: s?.classes?.name ?? "-",
          teacher_name: t?.profiles?.full_name ?? "-",
          company_name: c?.name ?? "-",
        };
      }));

      // Parse options
      setStudents((studRes.data ?? []).map((s) => ({
        id: s.id,
        name: (s.profiles as unknown as { full_name: string } | null)?.full_name ?? "Siswa",
        nis: s.nis ?? "-",
        class_name: (s.classes as unknown as { name: string } | null)?.name ?? "-",
      })));

      setTeachers((teachRes.data ?? []).map((t) => ({
        id: t.id,
        name: (t.profiles as unknown as { full_name: string } | null)?.full_name ?? "Guru",
      })));

      setCompanies((compRes.data ?? []) as Company[]);
    } catch (err) {
      console.error("adminPenugasan error:", err);
      toast.error("Gagal memuat data penugasan");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (data: Partial<Assignment>) => {
    try {
      const payload = {
        student_id: data.student_id,
        teacher_id: data.teacher_id,
        company_id: data.company_id,
        status: data.status ?? "active",
        start_date: data.start_date,
        end_date: data.end_date,
      };

      if (data.id) {
        const { error } = await supabase.from("pkl_assignments").update(payload).eq("id", data.id);
        if (error) throw error;
        setAssignments((prev) => prev.map((a) => a.id === data.id ? {
          ...a, ...payload,
          teacher_name: teachers.find((t) => t.id === payload.teacher_id)?.name ?? a.teacher_name,
          company_name: companies.find((c) => c.id === payload.company_id)?.name ?? a.company_name,
        } as Assignment : a));
        toast.success("Penugasan diperbarui ✅");
      } else {
        const { data: newData, error } = await supabase.from("pkl_assignments").insert(payload).select().single();
        if (error) throw error;
        const student = students.find((s) => s.id === payload.student_id);
        const teacher = teachers.find((t) => t.id === payload.teacher_id);
        const company = companies.find((c) => c.id === payload.company_id);
        setAssignments((prev) => [{
          id: newData.id,
          student_id: payload.student_id ?? "",
          teacher_id: payload.teacher_id ?? null,
          company_id: payload.company_id ?? null,
          status: payload.status as Status,
          start_date: payload.start_date ?? null,
          end_date: payload.end_date ?? null,
          student_name: student?.name ?? "-",
          student_nis: student?.nis ?? "-",
          student_class: student?.class_name ?? "-",
          teacher_name: teacher?.name ?? "-",
          company_name: company?.name ?? "-",
        } as Assignment, ...prev]);
        toast.success("Penugasan berhasil dibuat ✅");
      }
      setEditTarget(undefined);
    } catch (err) {
      console.error("saveAssignment error:", err);
      toast.error("Gagal menyimpan penugasan");
    }
  };

  const handleUpdateStatus = async (id: string, status: Status) => {
    const { error } = await supabase.from("pkl_assignments").update({ status }).eq("id", id);
    if (error) { toast.error("Gagal update status"); return; }
    setAssignments((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    toast.success(`Status diubah ke ${STATUS_CFG[status].label}`);
  };

  const filtered = useMemo(() => {
    let r = filterStatus === "all" ? assignments : assignments.filter((a) => a.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((a) =>
        a.student_name.toLowerCase().includes(q) ||
        a.student_nis.includes(q) ||
        a.company_name.toLowerCase().includes(q) ||
        a.teacher_name.toLowerCase().includes(q)
      );
    }
    return r;
  }, [assignments, filterStatus, search]);

  const counts = { all: assignments.length, active: 0, pending: 0, completed: 0, cancelled: 0 };
  assignments.forEach((a) => { counts[a.status] = (counts[a.status] ?? 0) + 1; });

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-extrabold text-slate-900">Manajemen Penugasan</h1>
              <p className="text-xs text-slate-400 mt-px">{assignments.length} penugasan PKL</p>
            </div>
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.88 }} onClick={() => loadData(true)} disabled={refreshing}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500">
                <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
              </motion.button>
              <button onClick={() => setEditTarget(null)}
                className="h-9 px-3 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Tugaskan
              </button>
            </div>
          </div>

          {/* Summary chips */}
          {!loading && (
            <div className="grid grid-cols-4 gap-2">
              {(["active", "pending", "completed", "cancelled"] as Status[]).map((s) => {
                const cfg = STATUS_CFG[s];
                const Icon = cfg.icon;
                return (
                  <div key={s} className={cn("rounded-2xl p-3 text-center", cfg.bg)}>
                    <Icon className={cn("w-4 h-4 mx-auto mb-1", cfg.color)} />
                    <p className={cn("text-lg font-extrabold", cfg.color)}>{counts[s]}</p>
                    <p className="text-[10px] text-slate-600">{cfg.label}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Search */}
          <div className="flex items-center gap-2.5 px-3.5 h-12 rounded-2xl bg-white border border-slate-200">
            <Search className="w-4 h-4 text-slate-400" />
            <input type="search" placeholder="Cari siswa, guru, perusahaan..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none text-slate-800 placeholder:text-slate-400" />
            {search && <button onClick={() => setSearch("")} className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center"><X className="w-3 h-3 text-slate-500" /></button>}
          </div>

          {/* Filter */}
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
            {(["all", "active", "pending", "completed", "cancelled"] as (Status | "all")[]).map((f) => (
              <button key={f} onClick={() => setFilterStatus(f)}
                className={cn("flex-shrink-0 px-4 h-8 rounded-full text-xs font-bold transition-all",
                  filterStatus === f ? "bg-blue-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600")}>
                {f === "all" ? `Semua (${counts.all})` : `${STATUS_CFG[f].label} (${counts[f]})`}
              </button>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-36 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Link2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500">Tidak ada penugasan ditemukan</p>
              <button onClick={() => setEditTarget(null)} className="mt-3 px-4 h-9 rounded-xl bg-blue-600 text-white text-xs font-bold">Buat Penugasan Pertama</button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((a, i) => {
                const sc = STATUS_CFG[a.status];
                const Icon = sc.icon;
                return (
                  <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-base font-bold text-white">{a.student_name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{a.student_name}</p>
                            <p className="text-[11px] text-slate-500">{a.student_nis} · {a.student_class}</p>
                          </div>
                          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 flex items-center gap-1", sc.bg, sc.color)}>
                            <Icon className="w-2.5 h-2.5" />{sc.label}
                          </span>
                        </div>
                        <div className="mt-1.5 space-y-0.5">
                          <div className="flex items-center gap-1.5"><Building2 className="w-3 h-3 text-slate-400" /><p className="text-[11px] text-slate-500 truncate">{a.company_name}</p></div>
                          <div className="flex items-center gap-1.5"><User className="w-3 h-3 text-slate-400" /><p className="text-[11px] text-slate-500 truncate">{a.teacher_name}</p></div>
                          {a.start_date && (
                            <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-slate-400" /><p className="text-[11px] text-slate-500">{formatDate(a.start_date, "dd MMM yyyy")} — {a.end_date ? formatDate(a.end_date, "dd MMM yyyy") : "..."}</p></div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                      <button onClick={() => setEditTarget(a)}
                        className="flex-1 h-8 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 hover:bg-slate-50">
                        <Pencil className="w-3 h-3" />Edit
                      </button>
                      {a.status === "pending" && (
                        <button onClick={() => handleUpdateStatus(a.id, "active")}
                          className="flex-1 h-8 rounded-xl bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-emerald-700">
                          <CheckCircle2 className="w-3 h-3" />Aktifkan
                        </button>
                      )}
                      {a.status === "active" && (
                        <button onClick={() => handleUpdateStatus(a.id, "completed")}
                          className="flex-1 h-8 rounded-xl bg-blue-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-700">
                          <CheckCircle2 className="w-3 h-3" />Selesaikan
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
          <div className="h-4" />
        </div>
      </div>

      <AnimatePresence>
        {editTarget !== undefined && (
          <AssignmentForm
            assignment={editTarget}
            students={students}
            teachers={teachers}
            companies={companies}
            onClose={() => setEditTarget(undefined)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </>
  );
}
