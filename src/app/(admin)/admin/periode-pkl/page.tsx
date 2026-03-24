"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Plus,
  Clock,
  CheckCircle2,
  Pencil,
  RefreshCw,
  ArrowLeft,
  CalendarDays,
  Save,
  Loader2,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface PKLPeriod {
  id: string;
  name: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  check_in_start: string;
  check_in_end: string;
  check_out_start: string;
  check_out_end: string;
  is_active: boolean;
}

/* ── Period Form ──────────────────────────────────────── */

function PeriodForm({
  period,
  onClose,
  onSave,
}: {
  period: Partial<PKLPeriod> | null;
  onClose: () => void;
  onSave: (data: Partial<PKLPeriod>) => Promise<void>;
}) {
  const isEdit = !!period?.id;
  const [form, setForm] = useState<Partial<PKLPeriod>>(
    period ?? {
      check_in_start: "07:00",
      check_in_end: "08:00",
      check_out_start: "15:00",
      check_out_end: "17:00",
      is_active: false,
    }
  );
  const [saving, setSaving] = useState(false);
  const set = (k: keyof PKLPeriod, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name?.trim() || !form.start_date || !form.end_date) {
      toast.error("Nama dan tanggal periode wajib diisi");
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
          {isEdit ? "Edit Periode PKL" : "Buat Periode PKL"}
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 h-8 rounded-xl bg-blue-600 text-white text-xs font-bold disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Simpan
        </button>
      </header>

      <div className="px-4 py-5 max-w-2xl mx-auto space-y-4 pb-8">
        {/* Nama */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nama Periode *</p>
          <input
            value={form.name ?? ""}
            onChange={(e) => set("name", e.target.value)}
            placeholder="PKL Semester Genap 2025/2026"
            className="w-full text-sm text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
          />
        </div>

        {/* Tahun ajaran */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tahun Ajaran</p>
          <input
            value={form.academic_year ?? ""}
            onChange={(e) => set("academic_year", e.target.value)}
            placeholder="2025/2026"
            className="w-full text-sm text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
          />
        </div>

        {/* Tanggal */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Periode Tanggal *</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] text-slate-400 mb-1">Mulai</p>
              <input type="date" value={form.start_date ?? ""} onChange={(e) => set("start_date", e.target.value)} className="w-full text-sm text-slate-800 outline-none bg-transparent" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 mb-1">Selesai</p>
              <input type="date" value={form.end_date ?? ""} onChange={(e) => set("end_date", e.target.value)} className="w-full text-sm text-slate-800 outline-none bg-transparent" />
            </div>
          </div>
        </div>

        {/* Jam check in/out */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jam Presensi</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] text-emerald-600 font-semibold mb-1">Check In Mulai</p>
              <input type="time" value={form.check_in_start ?? "07:00"} onChange={(e) => set("check_in_start", e.target.value)} className="w-full text-sm text-slate-800 outline-none bg-transparent" />
            </div>
            <div>
              <p className="text-[11px] text-emerald-600 font-semibold mb-1">Check In Selesai</p>
              <input type="time" value={form.check_in_end ?? "08:00"} onChange={(e) => set("check_in_end", e.target.value)} className="w-full text-sm text-slate-800 outline-none bg-transparent" />
            </div>
            <div>
              <p className="text-[11px] text-blue-600 font-semibold mb-1">Check Out Mulai</p>
              <input type="time" value={form.check_out_start ?? "15:00"} onChange={(e) => set("check_out_start", e.target.value)} className="w-full text-sm text-slate-800 outline-none bg-transparent" />
            </div>
            <div>
              <p className="text-[11px] text-blue-600 font-semibold mb-1">Check Out Selesai</p>
              <input type="time" value={form.check_out_end ?? "17:00"} onChange={(e) => set("check_out_end", e.target.value)} className="w-full text-sm text-slate-800 outline-none bg-transparent" />
            </div>
          </div>
        </div>

        {/* Langsung aktifkan */}
        {!isEdit && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Aktifkan Sekarang</p>
                <p className="text-xs text-slate-400 mt-0.5">Periode lain akan otomatis dinonaktifkan</p>
              </div>
              <button
                onClick={() => set("is_active", !form.is_active)}
                className={cn("w-12 h-6 rounded-full transition-colors flex items-center px-1", form.is_active ? "bg-emerald-500" : "bg-slate-200")}
              >
                <div className={cn("w-4 h-4 rounded-full bg-white shadow transition-transform", form.is_active ? "translate-x-6" : "translate-x-0")} />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Main Page ──────────────────────────────────────────── */

export default function AdminPeriodePKLPage() {
  const supabase = createClient();
  const [periods, setPeriods] = useState<PKLPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editTarget, setEditTarget] = useState<Partial<PKLPeriod> | null | undefined>(undefined);
  const [toggling, setToggling] = useState<string | null>(null);

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pkl_periods")
        .select("*")
        .order("start_date", { ascending: false });
      if (error) throw error;
      setPeriods((data ?? []) as PKLPeriod[]);
    } catch {
      toast.error("Gagal memuat data periode PKL");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (data: Partial<PKLPeriod>) => {
    try {
      /* Buat payload eksplisit — jangan spread seluruh data agar tidak ada field asing */
      const payload = {
        name: data.name!,
        academic_year: data.academic_year ?? null,
        start_date: data.start_date!,
        end_date: data.end_date!,
        check_in_start: data.check_in_start ?? "07:00",
        check_in_end: data.check_in_end ?? "08:00",
        check_out_start: data.check_out_start ?? "15:00",
        check_out_end: data.check_out_end ?? "17:00",
        is_active: data.is_active ?? false,
      };

      if (data.id) {
        const { error } = await supabase.from("pkl_periods").update(payload).eq("id", data.id);
        if (error) throw error;
        setPeriods((prev) => prev.map((p) => p.id === data.id ? { ...p, ...payload } as PKLPeriod : p));
        toast.success("Periode diperbarui ✅");
      } else {
        // Jika is_active, nonaktifkan yang lain dulu
        if (payload.is_active) {
          await supabase.from("pkl_periods").update({ is_active: false }).eq("is_active", true);
        }
        const { data: newData, error } = await supabase.from("pkl_periods").insert(payload).select().single();
        if (error) throw error;
        setPeriods((prev) => payload.is_active
          ? [newData as PKLPeriod, ...prev.map((p) => ({ ...p, is_active: false }))]
          : [newData as PKLPeriod, ...prev]
        );
        toast.success("Periode PKL dibuat ✅");
      }
      setEditTarget(undefined);
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan periode PKL");
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    if (currentActive) { toast.info("Nonaktifkan dengan menambah periode baru yang aktif"); return; }
    setToggling(id);
    try {
      await supabase.from("pkl_periods").update({ is_active: false }).eq("is_active", true);
      await supabase.from("pkl_periods").update({ is_active: true }).eq("id", id);
      setPeriods((prev) => prev.map((p) => ({ ...p, is_active: p.id === id })));
      toast.success("Periode PKL diaktifkan ✅");
    } catch {
      toast.error("Gagal mengaktifkan periode");
    } finally {
      setToggling(null);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-extrabold text-slate-900">Periode PKL</h1>
              <p className="text-xs text-slate-400 mt-px">{periods.length} periode</p>
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
            <div className="space-y-3">{[0, 1].map((i) => <div key={i} className="h-48 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}</div>
          ) : periods.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500">Belum ada periode PKL</p>
              <button onClick={() => setEditTarget(null)} className="mt-3 px-4 h-9 rounded-xl bg-blue-600 text-white text-xs font-bold">Buat Periode Pertama</button>
            </div>
          ) : (
            <div className="space-y-4">
              {periods.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={cn("bg-white rounded-2xl border shadow-sm p-4", p.is_active ? "border-emerald-200 shadow-emerald-100" : "border-slate-100")}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", p.is_active ? "bg-emerald-100" : "bg-slate-100")}>
                      <Calendar className={cn("w-5.5 h-5.5", p.is_active ? "text-emerald-600" : "text-slate-400")} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900 flex-1">{p.name}</p>
                        {p.is_active && <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full">Aktif</span>}
                      </div>
                      {p.academic_year && <p className="text-[11px] text-slate-500 mt-0.5">Tahun Ajaran {p.academic_year}</p>}
                    </div>
                  </div>

                  <div className="space-y-2 bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-xs">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-700">{formatDate(p.start_date, "dd MMM yyyy")} — {formatDate(p.end_date, "dd MMM yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-slate-700">Check In: {p.check_in_start} – {p.check_in_end}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-slate-700">Check Out: {p.check_out_start} – {p.check_out_end}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button onClick={() => setEditTarget(p)} className="flex-1 h-8 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 hover:bg-slate-50">
                      <Pencil className="w-3 h-3" />Edit
                    </button>
                    {!p.is_active && (
                      <button
                        onClick={() => handleToggleActive(p.id, p.is_active)}
                        disabled={toggling === p.id}
                        className="flex-1 h-8 rounded-xl bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {toggling === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                        Aktifkan
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          <div className="h-4" />
        </div>
      </div>

      <AnimatePresence>
        {editTarget !== undefined && (
          <PeriodForm
            period={editTarget}
            onClose={() => setEditTarget(undefined)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </>
  );
}
