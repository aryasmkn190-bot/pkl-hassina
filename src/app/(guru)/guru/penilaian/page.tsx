"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, ChevronRight, ArrowLeft, Save, Lock,
  BookOpen, CalendarCheck, Award, Heart, Building2, RefreshCw, Loader2, FileSpreadsheet, Printer,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Grade = "A" | "B" | "C" | "D" | "E";

interface AssessmentItem {
  id: string;                        // pkl_assignment id
  student_id: string;
  student_name: string;
  student_nis: string;
  company_name: string;
  attendance_score: number | null;
  journal_score: number | null;
  performance_score: number | null;
  attitude_score: number | null;
  final_score: number | null;
  grade: Grade | null;
  is_finalized: boolean;
  notes: string;
  assessment_id: string | null;      // grades table id
}

function calcFinal(a?: number | null, j?: number | null, p?: number | null, at?: number | null): number {
  const vals = [a, j, p, at].filter((v): v is number => v !== null && v !== undefined);
  if (vals.length === 0) return 0;
  return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
}

function calcGrade(score: number): Grade {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "E";
}

const SCORE_ASPECTS = [
  { key: "attendance_score" as const,  label: "Kehadiran", icon: CalendarCheck, color: "text-emerald-600" },
  { key: "journal_score" as const,     label: "Jurnal",    icon: BookOpen,       color: "text-purple-600" },
  { key: "performance_score" as const, label: "Kinerja",   icon: Award,          color: "text-blue-600" },
  { key: "attitude_score" as const,    label: "Sikap",     icon: Heart,          color: "text-pink-600" },
];

function ScoreInput({ value, onChange, label, icon: Icon, color, disabled }: {
  value: number | null; onChange: (v: number) => void;
  label: string; icon: React.ElementType; color: string; disabled?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("w-4 h-4", color)} />
        <p className="text-xs font-bold text-slate-600">{label}</p>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="number" min={0} max={100}
          value={value ?? ""} disabled={disabled}
          onChange={(e) => onChange(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
          placeholder="0-100"
          className="w-24 h-11 text-center text-lg font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
        />
        <div className="flex-1">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", value && value >= 80 ? "bg-emerald-500" : value && value >= 70 ? "bg-amber-500" : "bg-red-400")}
              style={{ width: `${value ?? 0}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {value !== null ? (value >= 90 ? "Sangat Baik" : value >= 80 ? "Baik" : value >= 70 ? "Cukup" : "Kurang") : "Belum diisi"}
          </p>
        </div>
      </div>
    </div>
  );
}

function AssessmentDetail({ item, onClose, onSave }: {
  item: AssessmentItem;
  onClose: () => void;
  onSave: (id: string, data: Partial<AssessmentItem>, finalize?: boolean) => Promise<void>;
}) {
  const [scores, setScores] = useState({
    attendance_score: item.attendance_score,
    journal_score: item.journal_score,
    performance_score: item.performance_score,
    attitude_score: item.attitude_score,
  });
  const [notes, setNotes] = useState(item.notes);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const final = calcFinal(scores.attendance_score, scores.journal_score, scores.performance_score, scores.attitude_score);
  const grade = final > 0 ? calcGrade(final) : null;
  const allFilled = Object.values(scores).every((v) => v !== null);

  const gradeColor = grade === "A" ? "text-emerald-600 bg-emerald-50" :
    grade === "B" ? "text-blue-600 bg-blue-50" :
    grade === "C" ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";

  const handleSave = async (finalize = false) => {
    if (finalize) setFinalizing(true); else setSaving(true);
    await onSave(item.id, {
      ...scores, notes,
      final_score: allFilled ? final : null,
      grade: allFilled ? grade : null,
      is_finalized: finalize,
    }, finalize);
    if (finalize) setFinalizing(false); else setSaving(false);
    if (finalize) onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: "100%" }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: "100%" }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto"
    >
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 h-[60px] bg-white/90 backdrop-blur-xl border-b border-slate-200/60">
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
          <ArrowLeft className="w-4.5 h-4.5 text-slate-700" strokeWidth={2.5} />
        </button>
        <h1 className="text-[16px] font-bold text-slate-900 flex-1">Input Penilaian</h1>
        {item.is_finalized ? (
          <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-full">
            <Lock className="w-3 h-3 text-slate-500" />
            <span className="text-xs font-bold text-slate-500">Final</span>
          </div>
        ) : (
          <button onClick={() => handleSave(false)} disabled={saving}
            className="flex items-center gap-1.5 px-3 h-8 rounded-xl bg-amber-500 text-white text-xs font-bold disabled:opacity-60">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Simpan
          </button>
        )}
      </header>

      <div className="px-4 py-5 max-w-2xl mx-auto space-y-4 pb-8">
        {/* Student info */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-white">{item.student_name.charAt(0)}</span>
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-slate-900">{item.student_name}</p>
              <p className="text-xs text-slate-500">NIS: {item.student_nis}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3 text-slate-400" />
                <p className="text-xs text-slate-500">{item.company_name}</p>
              </div>
            </div>
            {allFilled && grade && (
              <div className={cn("w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 font-bold", gradeColor)}>
                <span className="text-2xl">{grade}</span>
                <span className="text-[10px]">{final}</span>
              </div>
            )}
          </div>
        </div>

        {/* Score inputs */}
        {item.is_finalized ? (
          <div className="grid grid-cols-2 gap-3">
            {SCORE_ASPECTS.map((asp) => {
              const val = item[asp.key];
              const Icon = asp.icon;
              return (
                <div key={asp.key} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5 text-center">
                  <Icon className={cn("w-4 h-4 mx-auto mb-1", asp.color)} />
                  <p className="text-xl font-bold text-slate-900">{val ?? "—"}</p>
                  <p className="text-[11px] text-slate-500">{asp.label}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {SCORE_ASPECTS.map((asp) => (
              <ScoreInput
                key={asp.key}
                value={scores[asp.key]}
                onChange={(v) => setScores((prev) => ({ ...prev, [asp.key]: v }))}
                label={asp.label} icon={asp.icon} color={asp.color}
              />
            ))}
          </div>
        )}

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Catatan</p>
          <textarea
            value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Tulis catatan penilaian..." disabled={item.is_finalized}
            rows={3}
            className="w-full text-sm text-slate-700 placeholder:text-slate-400 outline-none resize-none bg-transparent disabled:opacity-60"
          />
        </div>

        {/* Actions */}
        {!item.is_finalized && (
          <button
            onClick={() => handleSave(true)} disabled={!allFilled || finalizing}
            className="w-full h-12 rounded-2xl bg-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {finalizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Finalisasi Nilai (Kunci Permanen)
          </button>
        )}
      </div>
    </motion.div>
  );
}

function AssessmentCard({ item, index, onClick }: { item: AssessmentItem; index: number; onClick: () => void }) {
  const allFilled = [item.attendance_score, item.journal_score, item.performance_score, item.attitude_score].every((v) => v !== null);
  const final = allFilled ? calcFinal(item.attendance_score, item.journal_score, item.performance_score, item.attitude_score) : null;
  const grade = final ? calcGrade(final) : null;
  const gradeColor = grade === "A" ? "text-emerald-600 bg-emerald-50" :
    grade === "B" ? "text-blue-600 bg-blue-50" :
    grade === "C" ? "text-amber-600 bg-amber-50" : grade ? "text-red-600 bg-red-50" : "text-slate-500 bg-slate-100";

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38, delay: index * 0.05 }}>
      <button onClick={onClick} className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-px active:scale-[0.98] transition-all">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0">
            <span className="text-base font-bold text-white">{item.student_name.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-900 flex-1 truncate">{item.student_name}</p>
              {item.is_finalized && <Lock className="w-3 h-3 text-slate-400 flex-shrink-0" />}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">{item.student_nis} · {item.company_name}</p>
            <div className="flex gap-1 mt-2">
              {SCORE_ASPECTS.map((asp) => (
                <div key={asp.key} className="flex-1">
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${item[asp.key] ?? 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={cn("w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold flex-shrink-0", gradeColor)}>
            <span className="text-xl">{grade ?? "—"}</span>
            {final && <span className="text-[9px]">{final}</span>}
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
        </div>
      </button>
    </motion.div>
  );
}

export default function GuruPenilaianPage() {
  const { profile } = useAuthStore();
  const supabase = createClient();
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<AssessmentItem | null>(null);

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      // Ambil assignments milik guru ini
      const { data: teacherRow } = await supabase
        .from("teachers").select("id").eq("profile_id", profile?.id).single();

      const teacherId = teacherRow?.id;
      if (!teacherId) { setItems([]); return; }

      const { data: assignments, error } = await supabase
        .from("pkl_assignments")
        .select(`
          id, student_id,
          students(nis, profiles(full_name)),
          companies(name)
        `)
        .eq("teacher_id", teacherId)
        .eq("status", "active");

      if (error) throw error;

      // Load grades yang sudah ada
      const assignIds = (assignments ?? []).map((a) => a.id);
      const { data: grades } = await supabase
        .from("grades")
        .select("*")
        .in("assignment_id", assignIds);

      const gradeMap = new Map((grades ?? []).map((g) => [g.assignment_id, g]));

      setItems((assignments ?? []).map((a) => {
        const s = a.students as unknown as { nis: string; profiles: { full_name: string } | null } | null;
        const c = a.companies as unknown as { name: string } | null;
        const g = gradeMap.get(a.id);
        return {
          id: a.id,
          student_id: a.student_id ?? "",
          student_name: s?.profiles?.full_name ?? "Siswa",
          student_nis: s?.nis ?? "-",
          company_name: c?.name ?? "-",
          attendance_score: g?.attendance_score ?? null,
          journal_score: g?.journal_score ?? null,
          performance_score: g?.performance_score ?? null,
          attitude_score: g?.attitude_score ?? null,
          final_score: g?.final_score ?? null,
          grade: g?.grade ?? null,
          is_finalized: g?.is_finalized ?? false,
          notes: g?.notes ?? "",
          assessment_id: g?.id ?? null,
        };
      }));
    } catch (err) {
      console.error("guruPenilaian error:", err);
      toast.error("Gagal memuat data penilaian");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (assignmentId: string, data: Partial<AssessmentItem>, finalize = false) => {
    try {
      const item = items.find((i) => i.id === assignmentId);
      const payload = {
        assignment_id: assignmentId,
        student_id: item?.student_id,
        attendance_score: data.attendance_score,
        journal_score: data.journal_score,
        performance_score: data.performance_score,
        attitude_score: data.attitude_score,
        final_score: data.final_score,
        grade: data.grade,
        is_finalized: finalize,
        notes: data.notes ?? "",
        updated_at: new Date().toISOString(),
      };

      if (item?.assessment_id) {
        await supabase.from("grades").update(payload).eq("id", item.assessment_id);
      } else {
        const { data: newGrade } = await supabase.from("grades").insert(payload).select().single();
        setItems((prev) => prev.map((i) => i.id === assignmentId ? { ...i, assessment_id: newGrade?.id ?? null } : i));
      }

      setItems((prev) => prev.map((i) => i.id === assignmentId ? { ...i, ...data, is_finalized: finalize } : i));
      toast.success(finalize ? "Nilai telah difinalisasi 🎉" : "Nilai disimpan ✅");
    } catch (err) {
      console.error("saveGrade error:", err);
      toast.error("Gagal menyimpan nilai");
    }
  };

  const unfinished = items.filter((i) => !i.is_finalized).length;
  const finalized = items.filter((i) => i.is_finalized).length;
  const [exporting, setExporting] = useState(false);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const { exportGradesExcel, getExportDateLabel } = await import("@/lib/export-utils");
      exportGradesExcel(
        items.map((item) => ({
          student_name: item.student_name,
          student_nis: item.student_nis,
          company_name: item.company_name,
          attendance_score: item.attendance_score,
          journal_score: item.journal_score,
          performance_score: item.performance_score,
          attitude_score: item.attitude_score,
          final_score: item.final_score,
          grade: item.grade,
          notes: item.notes,
        })),
        getExportDateLabel()
      );
      toast.success("Export Excel berhasil diunduh ✅");
    } catch { toast.error("Gagal export"); } finally { setExporting(false); }
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-extrabold text-slate-900">Penilaian PKL</h1>
              <p className="text-xs text-slate-400 mt-px">{items.length} siswa · {finalized} sudah final</p>
            </div>
            <div className="flex gap-2">
              {items.length > 0 && (
                <>
                  <motion.button whileTap={{ scale: 0.88 }} onClick={() => {
                    import("@/lib/print-utils").then(({ printGrades }) => {
                      printGrades(items.map((item) => ({
                        student_name: item.student_name, student_nis: item.student_nis, company_name: item.company_name,
                        attendance_score: item.attendance_score, journal_score: item.journal_score,
                        performance_score: item.performance_score, attitude_score: item.attitude_score,
                        final_score: item.final_score, grade: item.grade,
                      })));
                    });
                  }} className="h-9 px-2.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-1.5 text-red-600 text-xs font-bold">
                    <Printer className="w-3.5 h-3.5" />PDF
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.88 }} onClick={handleExportExcel} disabled={exporting}
                    className="h-9 px-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-1.5 text-emerald-700 text-xs font-bold disabled:opacity-60">
                    {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                    Excel
                  </motion.button>
                </>
              )}
              <motion.button whileTap={{ scale: 0.88 }} onClick={() => loadData(true)} disabled={refreshing}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500">
                <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
              </motion.button>
            </div>
          </div>

          {/* Progress banner */}
          {!loading && items.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className={cn("flex items-center gap-3 p-4 rounded-2xl shadow-lg",
                unfinished === 0 ? "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-200/60" : "bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-200/60")}>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                {unfinished === 0
                  ? <p className="text-sm font-bold text-white">Semua penilaian sudah final ✅</p>
                  : <p className="text-sm font-bold text-white">{unfinished} penilaian belum selesai</p>}
                <div className="w-full h-1.5 bg-white/20 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-white/70 rounded-full" style={{ width: `${items.length > 0 ? (finalized / items.length) * 100 : 0}%` }} />
                </div>
                <p className="text-xs text-white/70 mt-0.5">{finalized}/{items.length} selesai</p>
              </div>
            </motion.div>
          )}

          {loading ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}</div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500">Tidak ada siswa bimbingan aktif</p>
              <p className="text-xs text-slate-400 mt-1">Penilaian akan muncul setelah ada siswa yang ditugaskan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, i) => (
                <AssessmentCard key={item.id} item={item} index={i} onClick={() => setSelected(item)} />
              ))}
            </div>
          )}
          <div className="h-4" />
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <AssessmentDetail
            item={selected}
            onClose={() => { setSelected(null); loadData(true); }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </>
  );
}
