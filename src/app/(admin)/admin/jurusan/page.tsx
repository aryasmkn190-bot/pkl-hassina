"use client";

import React, { useState, useEffect, useCallback } from "react";
// AnimatePresence diimpor dari framer-motion, bukan React
import { motion, AnimatePresence } from "framer-motion";

import {
  BookUser, Plus, Users, Pencil, Trash2, RefreshCw,
  ArrowLeft, Save, Loader2, X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Jurusan {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  head_name?: string | null;
  student_count?: number;
  teacher_count?: number;
}

/* ── Form ────────────────────────────────────────────── */

function JurusanForm({
  data,
  onClose,
  onSave,
}: {
  data: Partial<Jurusan> | null;
  onClose: () => void;
  onSave: (d: Partial<Jurusan>) => Promise<void>;
}) {
  const isEdit = !!data?.id;
  const [form, setForm] = useState<Partial<Jurusan>>(data ?? { is_active: true });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof Jurusan, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name?.trim() || !form.code?.trim()) {
      toast.error("Nama dan kode jurusan wajib diisi");
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
        <h1 className="text-[16px] font-bold text-slate-900 flex-1">{isEdit ? "Edit Jurusan" : "Tambah Jurusan"}</h1>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 h-8 rounded-xl bg-blue-600 text-white text-xs font-bold disabled:opacity-60">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Simpan
        </button>
      </header>

      <div className="px-4 py-5 max-w-2xl mx-auto space-y-4 pb-8">
        {[
          { key: "code", label: "Kode Jurusan *", placeholder: "TKJ", type: "text" },
          { key: "name", label: "Nama Jurusan *", placeholder: "Teknik Komputer & Jaringan", type: "text" },
          { key: "description", label: "Deskripsi", placeholder: "Program keahlian...", type: "text" },
        ].map((f) => (
          <div key={f.key} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{f.label}</p>
            <input
              type={f.type}
              value={(form[f.key as keyof Jurusan] as string) ?? ""}
              onChange={(e) => set(f.key as keyof Jurusan, e.target.value)}
              placeholder={f.placeholder}
              className="w-full text-sm text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
            />
          </div>
        ))}

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Status</p>
              <p className={cn("text-xs mt-0.5", form.is_active ? "text-emerald-600" : "text-red-500")}>
                {form.is_active ? "Aktif" : "Nonaktif"}
              </p>
            </div>
            <button
              onClick={() => set("is_active", !form.is_active)}
              className={cn("w-12 h-6 rounded-full transition-colors flex items-center px-1", form.is_active ? "bg-emerald-500" : "bg-slate-200")}
            >
              <div className={cn("w-4 h-4 rounded-full bg-white shadow transition-transform", form.is_active ? "translate-x-6" : "translate-x-0")} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main ────────────────────────────────────────────── */

export default function AdminJurusanPage() {
  const supabase = createClient();
  const [jurusan, setJurusan] = useState<Jurusan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editTarget, setEditTarget] = useState<Partial<Jurusan> | null | undefined>(undefined);

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const { data, error } = await supabase
        .from("departments")
        .select("id, name, code, description, is_active")
        .order("code");
      if (error) throw error;

      // Hitung siswa dan guru per jurusan
      const { data: studentCount } = await supabase
        .from("students")
        .select("department_id");
      const { data: teacherCount } = await supabase
        .from("teachers")
        .select("department_id");

      const sMap = new Map<string, number>();
      (studentCount ?? []).forEach((r: { department_id: string | null }) => {
        if (r.department_id) sMap.set(r.department_id, (sMap.get(r.department_id) ?? 0) + 1);
      });
      const tMap = new Map<string, number>();
      (teacherCount ?? []).forEach((r: { department_id: string | null }) => {
        if (r.department_id) tMap.set(r.department_id, (tMap.get(r.department_id) ?? 0) + 1);
      });

      setJurusan((data ?? []).map((j) => ({
        ...j,
        student_count: sMap.get(j.id) ?? 0,
        teacher_count: tMap.get(j.id) ?? 0,
      })));
    } catch {
      toast.error("Gagal memuat data jurusan");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (data: Partial<Jurusan>) => {
    try {
      if (data.id) {
        const { error } = await supabase.from("departments").update({
          name: data.name, code: data.code, description: data.description, is_active: data.is_active,
        }).eq("id", data.id);
        if (error) throw error;
        setJurusan((prev) => prev.map((j) => j.id === data.id ? { ...j, ...data } as Jurusan : j));
        toast.success("Jurusan diperbarui ✅");
      } else {
        const { data: newData, error } = await supabase.from("departments").insert({
          name: data.name!, code: data.code!, description: data.description, is_active: data.is_active ?? true,
        }).select().single();
        if (error) throw error;
        setJurusan((prev) => [{ ...newData, student_count: 0, teacher_count: 0 } as Jurusan, ...prev]);
        toast.success("Jurusan ditambahkan ✅");
      }
      setEditTarget(undefined);
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan jurusan");
    }
  };

  const handleDelete = async (id: string, name: string, studentCount: number) => {
    if (studentCount > 0) { toast.error(`Jurusan masih memiliki ${studentCount} siswa`); return; }
    if (!confirm(`Hapus jurusan "${name}"?`)) return;
    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) { toast.error("Gagal menghapus jurusan"); return; }
    setJurusan((prev) => prev.filter((j) => j.id !== id));
    toast.success("Jurusan dihapus");
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-extrabold text-slate-900">Jurusan</h1>
              <p className="text-xs text-slate-400 mt-px">{jurusan.length} jurusan terdaftar</p>
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
            <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-36 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}</div>
          ) : jurusan.length === 0 ? (
            <div className="text-center py-16">
              <BookUser className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500">Belum ada jurusan</p>
              <button onClick={() => setEditTarget(null)} className="mt-3 px-4 h-9 rounded-xl bg-blue-600 text-white text-xs font-bold">Tambah Jurusan</button>
            </div>
          ) : (
            <div className="space-y-3">
              {jurusan.map((j, i) => (
                <motion.div
                  key={j.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0", j.is_active ? "bg-blue-100" : "bg-slate-100")}>
                      <span className={cn("text-base font-bold", j.is_active ? "text-blue-700" : "text-slate-400")}>{j.code}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-900">{j.name}</p>
                          {j.description && <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{j.description}</p>}
                        </div>
                        {!j.is_active && <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-full flex-shrink-0">Nonaktif</span>}
                      </div>
                      <div className="flex items-center gap-4 mt-2.5">
                        <div className="flex items-center gap-1"><Users className="w-3 h-3 text-slate-400" /><span className="text-[11px] text-slate-600">{j.student_count} siswa</span></div>
                        <div className="flex items-center gap-1"><BookUser className="w-3 h-3 text-slate-400" /><span className="text-[11px] text-slate-600">{j.teacher_count} guru</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                    <button onClick={() => setEditTarget(j)} className="flex-1 h-8 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 hover:bg-slate-50">
                      <Pencil className="w-3 h-3" />Edit
                    </button>
                    <button
                      onClick={() => handleDelete(j.id, j.name, j.student_count ?? 0)}
                      disabled={(j.student_count ?? 0) > 0}
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
        {editTarget !== undefined && <JurusanForm data={editTarget} onClose={() => setEditTarget(undefined)} onSave={handleSave} />}
      </AnimatePresence>
    </>
  );
}
