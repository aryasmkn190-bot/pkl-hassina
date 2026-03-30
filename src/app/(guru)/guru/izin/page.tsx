"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Search,
  X,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  Stethoscope,
  Umbrella,
  HelpCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";

type AbsenceType = "sick" | "permission" | "emergency" | "other";
type AbsenceStatus = "pending" | "approved" | "rejected";

interface AbsenceItem {
  id: string;
  student_id: string;
  student_name: string;
  student_nis: string;
  student_class: string;
  company_name: string;
  date: string;
  type: AbsenceType;
  reason: string;
  attachment_url: string | null;
  status: AbsenceStatus;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
}

const TYPE_CFG: Record<AbsenceType, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  sick:       { label: "Sakit",    color: "text-red-700",    bg: "bg-red-50",    icon: Stethoscope },
  permission: { label: "Izin",     color: "text-blue-700",   bg: "bg-blue-50",   icon: Umbrella },
  emergency:  { label: "Darurat",  color: "text-orange-700", bg: "bg-orange-50", icon: AlertCircle },
  other:      { label: "Lainnya",  color: "text-slate-700",  bg: "bg-slate-100", icon: HelpCircle },
};

const STATUS_CFG: Record<AbsenceStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending:  { label: "Menunggu",  color: "text-amber-700",   bg: "bg-amber-50",   icon: Clock },
  approved: { label: "Disetujui", color: "text-emerald-700", bg: "bg-emerald-50", icon: CheckCircle2 },
  rejected: { label: "Ditolak",   color: "text-red-700",     bg: "bg-red-50",     icon: XCircle },
};

/* ── Absence Detail Modal ────────────────────────────── */

function AbsenceDetailModal({
  item,
  onClose,
  onApprove,
  onReject,
}: {
  item: AbsenceItem;
  onClose: () => void;
  onApprove: (id: string, notes: string) => Promise<void>;
  onReject: (id: string, notes: string) => Promise<void>;
}) {
  const [notes, setNotes] = useState(item.review_notes ?? "");
  const [acting, setActing] = useState<"approve" | "reject" | null>(null);
  const tc = TYPE_CFG[item.type];
  const sc = STATUS_CFG[item.status];
  const TypeIcon = tc.icon;
  const StatusIcon = sc.icon;

  const handleApprove = async () => {
    setActing("approve");
    await onApprove(item.id, notes);
    setActing(null);
    onClose();
  };

  const handleReject = async () => {
    setActing("reject");
    await onReject(item.id, notes);
    setActing(null);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[60] bg-slate-50 overflow-y-auto"
    >
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 h-[60px] bg-white/90 backdrop-blur-xl border-b border-slate-200/60">
        <button
          onClick={onClose}
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
        >
          <ArrowLeft className="w-4.5 h-4.5" strokeWidth={2.5} />
        </button>
        <h1 className="text-[16px] font-bold text-slate-900 flex-1">Detail Pengajuan Izin</h1>
        <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold", sc.bg, sc.color)}>
          <StatusIcon className="w-3 h-3" />
          {sc.label}
        </span>
      </header>

      <div className="px-4 py-5 max-w-2xl mx-auto space-y-4 pb-8">
        {/* Student + type card */}
        <div className={cn("flex items-center gap-3 p-4 rounded-2xl border", tc.bg)}>
          <div className="w-12 h-12 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0 shadow-sm">
            <TypeIcon className={cn("w-6 h-6", tc.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-xs font-bold uppercase tracking-wider opacity-70", tc.color)}>{tc.label}</p>
            <p className="text-base font-bold text-slate-900">{item.student_name}</p>
            <p className="text-xs text-slate-500">{item.student_nis} · {item.student_class}</p>
            <p className="text-xs text-slate-400">{item.company_name}</p>
          </div>
        </div>

        {/* Date */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-blue-500" />
            <p className="text-sm font-semibold text-slate-900">
              {formatDate(item.date, "EEEE, dd MMMM yyyy")}
            </p>
          </div>
          <p className="text-xs text-slate-400">Diajukan {formatRelativeTime(item.created_at)}</p>
        </div>

        {/* Reason */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Alasan</p>
          <p className="text-sm text-slate-700 leading-relaxed">{item.reason}</p>
          {item.attachment_url && (
            <a
              href={item.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Lihat Lampiran
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Review notes if already reviewed */}
        {item.review_notes && item.status !== "pending" && (
          <div className={cn(
            "rounded-2xl border p-4",
            item.status === "approved" ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
          )}>
            <p className={cn(
              "text-xs font-bold uppercase tracking-wider mb-2",
              item.status === "approved" ? "text-emerald-700" : "text-red-700"
            )}>
              Catatan Review
            </p>
            <p className={cn(
              "text-sm leading-relaxed",
              item.status === "approved" ? "text-emerald-800" : "text-red-800"
            )}>
              {item.review_notes}
            </p>
            {item.reviewed_at && (
              <p className="text-[11px] text-slate-400 mt-2">
                Diputuskan {formatRelativeTime(item.reviewed_at)}
              </p>
            )}
          </div>
        )}

        {/* Action if pending */}
        {item.status === "pending" && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Catatan untuk Siswa (Opsional)
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tulis catatan atau alasan keputusan..."
                rows={3}
                className="w-full text-sm text-slate-800 placeholder:text-slate-400 outline-none resize-none bg-transparent leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleReject}
                disabled={!!acting}
                className="h-12 rounded-2xl border-2 border-red-300 text-red-600 text-sm font-bold hover:bg-red-50 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {acting === "reject" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Tolak
              </button>
              <button
                onClick={handleApprove}
                disabled={!!acting}
                className="h-12 rounded-2xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {acting === "approve" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Setujui
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Absence Card ────────────────────────────────────── */

function AbsenceCard({
  item,
  index,
  onClick,
}: {
  item: AbsenceItem;
  index: number;
  onClick: () => void;
}) {
  const tc = TYPE_CFG[item.type];
  const sc = STATUS_CFG[item.status];
  const TypeIcon = tc.icon;
  const StatusIcon = sc.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <button
        onClick={onClick}
        className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-px active:scale-[0.98] transition-all"
      >
        <div className="flex items-start gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", tc.bg)}>
            <TypeIcon className={cn("w-5 h-5", tc.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="text-sm font-bold text-slate-900">{item.student_name}</p>
              <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0", sc.bg, sc.color)}>
                <StatusIcon className="w-2.5 h-2.5" />
                {sc.label}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-1">{item.student_nis} · {item.company_name}</p>
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-500">{formatDate(item.date, "EEEE, dd MMM yyyy")}</span>
              <span className="text-slate-300">·</span>
              <span className={cn("text-xs font-semibold", tc.color)}>{tc.label}</span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-2">{item.reason}</p>
            {item.attachment_url && (
              <div className="flex items-center gap-1 mt-1">
                <FileText className="w-3 h-3 text-blue-400" />
                <span className="text-[11px] text-blue-600">Ada lampiran</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <span className="text-[11px] text-slate-400">{formatRelativeTime(item.created_at)}</span>
          </div>
        </div>
      </button>
    </motion.div>
  );
}

/* ── Main Page ───────────────────────────────────────── */

export default function GuruIzinPage() {
  const { profile } = useAuthStore();
  const supabase = createClient();

  const [items, setItems] = useState<AbsenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<AbsenceStatus | "all">("all");
  const [selectedItem, setSelectedItem] = useState<AbsenceItem | null>(null);

  /* ── Load ──────────────────────────────────────────── */

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      if (!profile?.id) return;

      const { data: teacherRow } = await supabase.from("teachers").select("id").eq("profile_id", profile.id).single();
      const teacherId = teacherRow?.id;
      if (!teacherId) {
        setItems([]);
        return;
      }

      // Ambil siswa yang dibimbing guru ini
      const { data: assignments } = await supabase
        .from("pkl_assignments")
        .select("id, students(id, nis, profiles(full_name), classes(name)), companies(name)")
        .eq("teacher_id", teacherId)
        .eq("status", "active");

      if (!assignments || assignments.length === 0) {
        setItems([]);
        return;
      }

      const studentMap = new Map<string, { name: string; nis: string; class: string; company: string }>();
      const studentIds: string[] = [];

      for (const a of assignments) {
        const s = a.students as unknown as {
          id: string;
          nis: string;
          profiles: { full_name: string } | null;
          classes: { name: string } | null;
        } | null;
        const company = a.companies as unknown as { name: string } | null;
        if (s?.id) {
          studentIds.push(s.id);
          studentMap.set(s.id, {
            name: s.profiles?.full_name ?? "Siswa",
            nis: s.nis ?? "-",
            class: s.classes?.name ?? "-",
            company: company?.name ?? "-",
          });
        }
      }

      if (studentIds.length === 0) {
        setItems([]);
        return;
      }

      const { data: absenceData, error } = await supabase
        .from("absence_requests")
        .select("id, student_id, date, type, reason, attachment_url, status, reviewed_at, review_notes, created_at")
        .in("student_id", studentIds)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      const mapped: AbsenceItem[] = (absenceData ?? []).map((ab) => {
        const info = studentMap.get(ab.student_id) ?? {
          name: "Siswa", nis: "-", class: "-", company: "-",
        };
        return {
          id: ab.id,
          student_id: ab.student_id,
          student_name: info.name,
          student_nis: info.nis,
          student_class: info.class,
          company_name: info.company,
          date: ab.date,
          type: ab.type as AbsenceType,
          reason: ab.reason,
          attachment_url: ab.attachment_url ?? null,
          status: ab.status as AbsenceStatus,
          reviewed_at: ab.reviewed_at ?? null,
          review_notes: ab.review_notes ?? null,
          created_at: ab.created_at,
        };
      });

      setItems(mapped);
    } catch (err) {
      console.error("loadAbsences error:", err);
      toast.error("Gagal memuat data izin");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── Approve / Reject ───────────────────────────────── */

  const handleApprove = async (id: string, notes: string) => {
    const { error } = await supabase
      .from("absence_requests")
      .update({
        status: "approved",
        review_notes: notes || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: profile?.id,
      })
      .eq("id", id);

    if (error) {
      toast.error("Gagal menyetujui pengajuan izin");
      throw error;
    }

    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, status: "approved", review_notes: notes || null, reviewed_at: new Date().toISOString() }
          : i
      )
    );
    toast.success("Pengajuan izin disetujui ✅");
  };

  const handleReject = async (id: string, notes: string) => {
    const { error } = await supabase
      .from("absence_requests")
      .update({
        status: "rejected",
        review_notes: notes || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: profile?.id,
      })
      .eq("id", id);

    if (error) {
      toast.error("Gagal menolak pengajuan izin");
      throw error;
    }

    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, status: "rejected", review_notes: notes || null, reviewed_at: new Date().toISOString() }
          : i
      )
    );
    toast.success("Pengajuan izin ditolak");
  };

  /* ── Filter ────────────────────────────────────────── */

  const filtered = useMemo(() => {
    if (filterStatus === "all") return items;
    return items.filter((i) => i.status === filterStatus);
  }, [items, filterStatus]);

  const pendingCount = items.filter((i) => i.status === "pending").length;

  /* ── Render ─────────────────────────────────────────── */

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-extrabold text-slate-900">Izin &amp; Sakit</h1>
              <p className="text-xs text-slate-400 mt-px">{items.length} pengajuan · {pendingCount} menunggu</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all"
              aria-label="Refresh"
            >
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            </motion.button>
          </div>

          {!loading && pendingCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 bg-orange-500 rounded-2xl shadow-lg shadow-orange-200/60"
            >
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <FileText className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{pendingCount} pengajuan izin menunggu</p>
                <p className="text-xs text-orange-100">Harap segera ditindaklanjuti</p>
              </div>
            </motion.div>
          )}

          {/* Filter */}
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
            {([
              { value: "all",      label: "Semua" },
              { value: "pending",  label: "Menunggu" },
              { value: "approved", label: "Disetujui" },
              { value: "rejected", label: "Ditolak" },
            ] as { value: AbsenceStatus | "all"; label: string }[]).map((opt) => {
              const count = opt.value === "all"
                ? items.length
                : items.filter((i) => i.status === opt.value).length;
              return (
                <button
                  key={opt.value}
                  onClick={() => setFilterStatus(opt.value)}
                  className={cn(
                    "flex-shrink-0 px-4 h-8 rounded-full text-xs font-bold transition-all flex items-center gap-1.5",
                    filterStatus === opt.value
                      ? "bg-orange-500 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600"
                  )}
                >
                  {opt.label}
                  <span className={cn(
                    "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                    filterStatus === opt.value ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* List */}
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500">
                {filterStatus !== "all" ? "Tidak ada pengajuan di kategori ini" : "Belum ada pengajuan izin"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item, i) => (
                <AbsenceCard
                  key={item.id}
                  item={item}
                  index={i}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </div>
          )}

          <div className="h-4" />
        </div>
      </div>

      <AnimatePresence>
        {selectedItem && (
          <AbsenceDetailModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
      </AnimatePresence>
    </>
  );
}
