"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Plus, Users, Pencil, Trash2,
  RefreshCw, ArrowLeft, Save, Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Department { id: string; name: string; code: string; }
interface Kelas {
  id: string;
  name: string;
  department_id: string | null;
  academic_year: string | null;
  student_count?: number;
  dept_code?: string;
}

/* ── Form ────────────────────────────────────────────── */

function KelasForm({
  data,
  departments,
  onClose,
  onSave,
}: {
  data: Partial<Kelas> | null;
  departments: Department[];
  onClose: () => void;
  onSave: (d: Partial<Kelas>) => Promise<void>;
}) {
  const isEdit = !!data?.id;
  const [form, setForm] = useState<Partial<Kelas>>(data ?? {});
  const [saving, setSaving] = useState(false);
  const set = (k: keyof Kelas, v: string | null) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name?.trim()) { toast.error("Nama kelas wajib diisi"); return; }
    setSaving(true);
    await onSave(form);
    setSaving(false);
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
        <h1 className="text-[16px] font-bold text-slate-900 flex-1">{isEdit ? "Edit Kelas" : "Tambah Kelas"}</h1>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 h-8 rounded-xl bg-blue-600 text-white text-xs font-bold disabled:opacity-60">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Simpan
        </button>
      </header>

      <div className="px-4 py-5 max-w-2xl mx-auto space-y-4 pb-8">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nama Kelas *</p>
          <input
            value={form.name ?? ""}
            onChange={(e) => set("name", e.target.value)}
            placeholder="XII TKJ 1"
            className="w-full text-sm text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tahun Ajaran</p>
          <input
            value={form.academic_year ?? ""}
            onChange={(e) => set("academic_year", e.target.value)}
            placeholder="2024/2025"
            className="w-full text-sm text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
          />
        </div>

        {departments.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Jurusan</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => set("department_id", null)}
                className={cn("px-3 h-8 rounded-full text-xs font-bold transition-all", !form.department_id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600")}
              >
                Tidak ada
              </button>
              {departments.map((d) => (
                <button
                  key={d.id}
                  onClick={() => set("department_id", d.id)}
                  className={cn("px-3 h-8 rounded-full text-xs font-bold transition-all", form.department_id === d.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600")}
                >
                  {d.code}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Main ────────────────────────────────────────────── */

export default function AdminKelasPage() {
  const supabase = createClient();
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editTarget, setEditTarget] = useState<Partial<Kelas> | null | undefined>(undefined);

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const [classRes, deptRes, studentRes] = await Promise.all([
        supabase.from("classes").select("id, name, department_id, academic_year").order("name"),
        supabase.from("departments").select("id, name, code").order("code"),
        supabase.from("students").select("class_id"),
      ]);

      const depts = (deptRes.data ?? []) as Department[];
      setDepartments(depts);

      const deptMap = new Map(depts.map((d) => [d.id, d.code]));
      const sMap = new Map<string, number>();
      (studentRes.data ?? []).forEach((r: { class_id: string | null }) => {
        if (r.class_id) sMap.set(r.class_id, (sMap.get(r.class_id) ?? 0) + 1);
      });

      setKelas((classRes.data ?? []).map((c) => ({
        ...c,
        dept_code: c.department_id ? deptMap.get(c.department_id) ?? "-" : "-",
        student_count: sMap.get(c.id) ?? 0,
      })));
    } catch {
      toast.error("Gagal memuat data kelas");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (data: Partial<Kelas>) => {
    try {
      const payload = {
        name: data.name!,
        department_id: data.department_id ?? null,
        academic_year: data.academic_year ?? null,
      };

      if (data.id) {
        const { error } = await supabase.from("classes").update(payload).eq("id", data.id);
        if (error) throw error;
        setKelas((prev) => prev.map((k) => k.id === data.id
          ? { ...k, ...data, dept_code: departments.find((d) => d.id === data.department_id)?.code ?? "-" }
          : k));
        toast.success("Kelas diperbarui ✅");
      } else {
        const { data: newData, error } = await supabase.from("classes")
          .insert(payload).select().single();
        if (error) throw error;
        setKelas((prev) => [{
          ...newData,
          dept_code: departments.find((d) => d.id === newData.department_id)?.code ?? "-",
          student_count: 0,
        } as Kelas, ...prev]);
        toast.success("Kelas ditambahkan ✅");
      }
      setEditTarget(undefined);
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan kelas");
    }
  };

  const handleDelete = async (id: string, name: string, count: number) => {
    if (count > 0) { toast.error(`Kelas masih memiliki ${count} siswa`); return; }
    if (!confirm(`Hapus kelas "${name}"?`)) return;
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (error) { toast.error("Gagal menghapus kelas"); return; }
    setKelas((prev) => prev.filter((k) => k.id !== id));
    toast.success("Kelas dihapus");
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-extrabold text-slate-900">Kelas</h1>
              <p className="text-xs text-slate-400 mt-px">{kelas.length} kelas terdaftar</p>
            </div>
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.88 }} onClick={() => loadData(true)} disabled={refreshing} className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500">
                <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
              </motion.button>
              <button onClick={() => setEditTarget(null)} className="h-9 px-3 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Tambah
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}</div>
          ) : kelas.length === 0 ? (
            <div className="text-center py-16">
              <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500">Belum ada kelas</p>
              <button onClick={() => setEditTarget(null)} className="mt-3 px-4 h-9 rounded-xl bg-blue-600 text-white text-xs font-bold">Tambah Kelas</button>
            </div>
          ) : (
            <div className="space-y-3">
              {kelas.map((k, i) => (
                <motion.div
                  key={k.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">{k.name}</p>
                      <p className="text-[11px] text-blue-600 font-medium">
                        {k.dept_code !== "-" ? k.dept_code : "—"}
                        {k.academic_year ? ` · ${k.academic_year}` : ""}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span className="text-[11px] text-slate-600">{k.student_count} siswa</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                    <button onClick={() => setEditTarget(k)} className="flex-1 h-8 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 hover:bg-slate-50">
                      <Pencil className="w-3 h-3" />Edit
                    </button>
                    <button
                      onClick={() => handleDelete(k.id, k.name, k.student_count ?? 0)}
                      disabled={(k.student_count ?? 0) > 0}
                      className="flex-1 h-8 rounded-xl border border-red-200 text-xs font-semibold text-red-500 flex items-center justify-center gap-1.5 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-3 h-3" />Hapus
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          <div className="h-4" />
        </div>
      </div>

      <AnimatePresence>
        {editTarget !== undefined && <KelasForm data={editTarget} departments={departments} onClose={() => setEditTarget(undefined)} onSave={handleSave} />}
      </AnimatePresence>
    </>
  );
}
