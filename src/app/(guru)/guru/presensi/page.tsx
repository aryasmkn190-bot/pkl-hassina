"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCheck,
  Search,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Camera,
  AlertCircle,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";

type AttStatus = "pending" | "verified" | "rejected";
type AttType = "check_in" | "check_out";

interface AttendanceRecord {
  id: string;
  student_id: string;
  student_name: string;
  student_nis: string;
  student_class: string;
  company_name: string;
  date: string;
  type: AttType;
  address: string | null;
  is_within_radius: boolean;
  status: AttStatus;
  selfie_url: string | null;
  created_at: string;
}

const STATUS_CFG: Record<AttStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  pending:  { label: "Menunggu",      color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200", icon: Clock },
  verified: { label: "Terverifikasi", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2 },
  rejected: { label: "Ditolak",       color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200",   icon: XCircle },
};

/* ── Selfie Lightbox ─────────────────────────────────── */

function SelfieModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.img
        initial={{ scale: 0.85 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.85 }}
        src={url}
        alt="Foto selfie presensi"
        className="max-w-sm w-full rounded-3xl shadow-2xl object-cover"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
      >
        <X className="w-5 h-5 text-white" />
      </button>
    </motion.div>
  );
}

/* ── Attendance Card ─────────────────────────────────── */

function AttCard({
  rec,
  index,
  onVerify,
  onReject,
}: {
  rec: AttendanceRecord;
  index: number;
  onVerify: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const sc = STATUS_CFG[rec.status];
  const StatusIcon = sc.icon;
  const [showConfirm, setShowConfirm] = useState<"verify" | "reject" | null>(null);
  const [showSelfie, setShowSelfie] = useState(false);
  const [acting, setActing] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "bg-white rounded-2xl border shadow-sm overflow-hidden",
          rec.status === "pending" ? "border-amber-100" : "border-slate-100"
        )}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-base font-bold text-white">{rec.student_name.charAt(0)}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-slate-900">{rec.student_name}</p>
                <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold", sc.bg, sc.color)}>
                  <StatusIcon className="w-2.5 h-2.5" />
                  {sc.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-px">
                {rec.student_nis} · {rec.student_class}
              </p>
              <p className="text-[11px] text-slate-400 mt-px">{rec.company_name}</p>

              {/* Metadata */}
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-1.5">
                  <CalendarCheck className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="text-xs text-slate-600">
                    {rec.type === "check_in" ? "📥 Check In" : "📤 Check Out"} ·{" "}
                    {formatDate(rec.date, "EEEE, dd MMM yyyy")}
                  </span>
                </div>
                {rec.address && (
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0 mt-px" />
                    <span className="text-xs text-slate-500 line-clamp-1">{rec.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  {rec.is_within_radius ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                      <span className="text-xs text-emerald-700 font-medium">Dalam area perusahaan ✓</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
                      <span className="text-xs text-red-700 font-medium">Di luar area perusahaan ⚠️</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span className="text-[11px] text-slate-400">{formatRelativeTime(rec.created_at)}</span>
              {rec.selfie_url && (
                <button
                  onClick={() => setShowSelfie(true)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-600 text-[11px] font-semibold"
                >
                  <Camera className="w-3 h-3" />
                  Foto
                </button>
              )}
            </div>
          </div>

          {/* Action buttons if pending */}
          <AnimatePresence>
            {rec.status === "pending" && !showConfirm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-2 mt-3 pt-3 border-t border-slate-100"
              >
                <button
                  onClick={() => setShowConfirm("reject")}
                  className="flex-1 h-9 rounded-xl border-2 border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors"
                >
                  Tolak
                </button>
                <button
                  onClick={() => setShowConfirm("verify")}
                  className="flex-1 h-9 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
                >
                  Verifikasi
                </button>
              </motion.div>
            )}

            {showConfirm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-slate-100"
              >
                <p className="text-xs font-semibold text-slate-700 text-center mb-2">
                  {showConfirm === "verify"
                    ? "Konfirmasi verifikasi presensi ini?"
                    : "Konfirmasi tolak presensi ini?"}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowConfirm(null)}
                    className="flex-1 h-9 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
                    disabled={acting}
                  >
                    Batal
                  </button>
                  <button
                    onClick={async () => {
                      setActing(true);
                      if (showConfirm === "verify") onVerify(rec.id);
                      else onReject(rec.id);
                      setShowConfirm(null);
                      setActing(false);
                    }}
                    disabled={acting}
                    className={cn(
                      "flex-1 h-9 rounded-xl text-white text-xs font-bold transition-colors flex items-center justify-center gap-1",
                      showConfirm === "verify"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-red-500 hover:bg-red-600"
                    )}
                  >
                    {acting && <Loader2 className="w-3 h-3 animate-spin" />}
                    Ya, {showConfirm === "verify" ? "Verifikasi" : "Tolak"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence>
        {showSelfie && rec.selfie_url && (
          <SelfieModal url={rec.selfie_url} onClose={() => setShowSelfie(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Main Page ───────────────────────────────────────── */

export default function GuruPresensiPage() {
  const { profile } = useAuthStore();
  const supabase = createClient();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<AttStatus | "all">("all");

  /* ── Load data ─────────────────────────────────────── */

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      if (!profile?.id) return;

      const { data: teacherRow } = await supabase.from("teachers").select("id").eq("profile_id", profile.id).single();
      const teacherId = teacherRow?.id;
      if (!teacherId) {
        setRecords([]);
        return;
      }

      // Ambil assignment_ids siswa yang dibimbing guru ini
      const { data: assignments } = await supabase
        .from("pkl_assignments")
        .select("id, students(id, nis, profiles(full_name), classes(name)), companies(name)")
        .eq("teacher_id", teacherId)
        .eq("status", "active");

      if (!assignments || assignments.length === 0) {
        setRecords([]);
        return;
      }

      const assignmentIds = assignments.map((a) => a.id);

      // Bangun map student info
      const studentMap = new Map<string, { name: string; nis: string; class: string; company: string }>();
      for (const a of assignments) {
        const s = a.students as unknown as {
          id: string;
          nis: string;
          profiles: { full_name: string } | null;
          classes: { name: string } | null;
        } | null;
        const company = a.companies as unknown as { name: string } | null;
        if (s?.id) {
          studentMap.set(s.id, {
            name: s.profiles?.full_name ?? "Siswa",
            nis: s.nis ?? "-",
            class: s.classes?.name ?? "-",
            company: company?.name ?? "-",
          });
        }
      }

      // Ambil catatan kehadiran berdasarkan assignment
      const { data: attData, error } = await supabase
        .from("attendance")
        .select("id, student_id, date, type, status, location_address, is_within_radius, selfie_url, created_at")
        .in("pkl_assignment_id", assignmentIds)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      const mapped: AttendanceRecord[] = (attData ?? []).map((att) => {
        const info = studentMap.get(att.student_id) ?? {
          name: "Siswa", nis: "-", class: "-", company: "-",
        };
        return {
          id: att.id,
          student_id: att.student_id,
          student_name: info.name,
          student_nis: info.nis,
          student_class: info.class,
          company_name: info.company,
          date: att.date,
          type: att.type as AttType,
          address: att.location_address ?? null,
          is_within_radius: att.is_within_radius ?? false,
          status: att.status as AttStatus,
          selfie_url: att.selfie_url ?? null,
          created_at: att.created_at,
        };
      });

      setRecords(mapped);
    } catch (err) {
      console.error("loadData error:", err);
      toast.error("Gagal memuat data presensi");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── Verify / Reject ───────────────────────────────── */

  const handleVerify = async (id: string) => {
    const { error } = await supabase
      .from("attendance")
      .update({ status: "verified", verified_at: new Date().toISOString(), verified_by: profile?.id })
      .eq("id", id);

    if (error) {
      toast.error("Gagal memverifikasi presensi");
    } else {
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "verified" } : r))
      );
      toast.success("Presensi berhasil diverifikasi ✅");
    }
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase
      .from("attendance")
      .update({ status: "rejected", verified_at: new Date().toISOString(), verified_by: profile?.id })
      .eq("id", id);

    if (error) {
      toast.error("Gagal menolak presensi");
    } else {
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r))
      );
      toast.success("Presensi ditolak");
    }
  };

  /* ── Filter ────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let r = [...records];
    if (filterStatus !== "all") r = r.filter((x) => x.status === filterStatus);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      r = r.filter(
        (x) =>
          x.student_name.toLowerCase().includes(q) ||
          x.student_nis.includes(q) ||
          x.company_name.toLowerCase().includes(q)
      );
    }
    return r;
  }, [records, filterStatus, searchQuery]);

  const pendingCount = records.filter((r) => r.status === "pending").length;

  /* ── Render ─────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto">

        {/* Header action */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">Presensi Siswa</h1>
            <p className="text-xs text-slate-400 mt-px">{records.length} catatan · {pendingCount} menunggu</p>
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

        {/* Pending alert */}
        {!loading && pendingCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 bg-amber-500 rounded-2xl shadow-lg shadow-amber-200/60"
          >
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Clock className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{pendingCount} presensi menunggu verifikasi</p>
              <p className="text-xs text-amber-100">Harap segera ditindaklanjuti</p>
            </div>
          </motion.div>
        )}

        {/* Search */}
        <div className="flex items-center gap-2.5 px-3.5 h-12 rounded-2xl bg-white border border-slate-200">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="search"
            placeholder="Cari nama, NIS, atau perusahaan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
              <X className="w-3 h-3 text-slate-500" />
            </button>
          )}
        </div>

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
          {([
            { value: "all",      label: "Semua" },
            { value: "pending",  label: "Menunggu" },
            { value: "verified", label: "Terverifikasi" },
            { value: "rejected", label: "Ditolak" },
          ] as { value: AttStatus | "all"; label: string }[]).map((opt) => {
            const count = opt.value === "all"
              ? records.length
              : records.filter((r) => r.status === opt.value).length;
            return (
              <button
                key={opt.value}
                onClick={() => setFilterStatus(opt.value)}
                className={cn(
                  "flex-shrink-0 px-4 h-8 rounded-full text-xs font-bold transition-all flex items-center gap-1.5",
                  filterStatus === opt.value
                    ? "bg-blue-600 text-white shadow-sm"
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
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">
              {searchQuery || filterStatus !== "all"
                ? "Tidak ada data yang cocok"
                : "Belum ada catatan presensi"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {filterStatus === "pending" ? "Semua presensi sudah diverifikasi 🎉" : ""}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((rec, i) => (
              <AttCard
                key={rec.id}
                rec={rec}
                index={i}
                onVerify={handleVerify}
                onReject={handleReject}
              />
            ))}
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}
