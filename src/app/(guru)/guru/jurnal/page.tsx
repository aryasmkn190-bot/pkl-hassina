"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Search,
  X,
  ChevronRight,
  ArrowLeft,
  Send,
  Star,
  Clock,
  CheckCircle2,
  Edit3,
  Camera,
  MessageSquare,
  Calendar,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";

type JournalStatus = "submitted" | "reviewed" | "revision" | "draft";

interface JournalItem {
  id: string;
  student_id: string;
  student_name: string;
  student_nis: string;
  date: string;
  title: string;
  content: string;
  status: JournalStatus;
  photos: string[];
  submitted_at: string | null;
  feedback_text: string | null;
  feedback_rating: number | null;
}

const STATUS_CFG: Record<JournalStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  submitted: { label: "Belum Direview", color: "text-amber-700",   bg: "bg-amber-50",  icon: Clock },
  reviewed:  { label: "Sudah Direview", color: "text-emerald-700", bg: "bg-emerald-50", icon: CheckCircle2 },
  revision:  { label: "Perlu Revisi",   color: "text-red-700",     bg: "bg-red-50",    icon: Edit3 },
  draft:     { label: "Draft",          color: "text-slate-500",   bg: "bg-slate-100", icon: Clock },
};

/* ── Feedback Modal (slide-in) ───────────────────────── */

function FeedbackModal({
  journal,
  onClose,
  onSubmit,
}: {
  journal: JournalItem;
  onClose: () => void;
  onSubmit: (id: string, feedback: string, rating: number, action: "reviewed" | "revision") => Promise<void>;
}) {
  const [feedback, setFeedback] = useState(journal.feedback_text ?? "");
  const [rating, setRating] = useState(journal.feedback_rating ?? 0);
  const [action, setAction] = useState<"reviewed" | "revision">(
    journal.status === "revision" ? "revision" : "reviewed"
  );
  const [submitting, setSubmitting] = useState(false);
  const [showPhoto, setShowPhoto] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!feedback.trim() || rating === 0) return;
    setSubmitting(true);
    await onSubmit(journal.id, feedback, rating, action);
    setSubmitting(false);
    onClose();
  };

  return (
    <>
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
          <h1 className="text-[16px] font-bold text-slate-900 flex-1">
            {journal.status === "submitted" ? "Beri Feedback" : "Edit Feedback"}
          </h1>
          <span className={cn(
            "text-[11px] font-bold px-2.5 py-1 rounded-full",
            STATUS_CFG[journal.status].bg,
            STATUS_CFG[journal.status].color
          )}>
            {STATUS_CFG[journal.status].label}
          </span>
        </header>

        <div className="px-4 py-5 max-w-2xl mx-auto space-y-4 pb-8">
          {/* Journal content */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">{journal.student_name.charAt(0)}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{journal.student_name}</p>
                <p className="text-[11px] text-slate-500">{formatDate(journal.date, "EEEE, dd MMMM yyyy")}</p>
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-800">{journal.title}</p>
            <p className="text-xs text-slate-600 leading-relaxed">{journal.content}</p>

            {/* Photos */}
            {journal.photos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {journal.photos.map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => setShowPhoto(photo)}
                    className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-slate-200 hover:opacity-80 transition-opacity"
                  >
                    <img src={photo} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Rating */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Penilaian Bintang *</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setRating(s)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className={cn(
                      "w-9 h-9 transition-colors",
                      s <= rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"
                    )}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-1 self-center text-sm font-bold text-amber-600">{rating}/5</span>
              )}
            </div>
          </div>

          {/* Action */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Hasil Review *</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setAction("reviewed")}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-xl border-2 transition-all",
                  action === "reviewed" ? "border-emerald-500 bg-emerald-50" : "border-slate-200"
                )}
              >
                <CheckCircle2 className={cn("w-4 h-4", action === "reviewed" ? "text-emerald-600" : "text-slate-400")} />
                <span className={cn("text-xs font-bold", action === "reviewed" ? "text-emerald-700" : "text-slate-500")}>
                  Disetujui
                </span>
              </button>
              <button
                onClick={() => setAction("revision")}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-xl border-2 transition-all",
                  action === "revision" ? "border-red-400 bg-red-50" : "border-slate-200"
                )}
              >
                <Edit3 className={cn("w-4 h-4", action === "revision" ? "text-red-500" : "text-slate-400")} />
                <span className={cn("text-xs font-bold", action === "revision" ? "text-red-600" : "text-slate-500")}>
                  Perlu Revisi
                </span>
              </button>
            </div>
          </div>

          {/* Feedback text */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Komentar / Catatan *
            </p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tulis komentar atau catatan untuk siswa..."
              rows={4}
              className="w-full text-sm text-slate-800 placeholder:text-slate-400 outline-none resize-none bg-transparent leading-relaxed"
            />
            <p className="text-[11px] text-slate-400 mt-1">{feedback.length} karakter</p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!feedback.trim() || rating === 0 || submitting}
            className="w-full h-12 rounded-2xl bg-blue-600 disabled:bg-slate-300 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? "Menyimpan..." : "Kirim Feedback"}
          </button>
        </div>
      </motion.div>

      {/* Photo lightbox */}
      <AnimatePresence>
        {showPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
            onClick={() => setShowPhoto(null)}
          >
            <motion.img
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              src={showPhoto}
              alt="Foto jurnal"
              className="max-w-sm w-full rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setShowPhoto(null)}
              className="absolute top-6 right-6 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Journal Card ────────────────────────────────────── */

function JournalCard({
  journal,
  index,
  onClick,
}: {
  journal: JournalItem;
  index: number;
  onClick: () => void;
}) {
  const sc = STATUS_CFG[journal.status];
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-base font-bold text-white">{journal.student_name.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="text-sm font-bold text-slate-900">{journal.student_name}</p>
              <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold", sc.bg, sc.color)}>
                <StatusIcon className="w-2.5 h-2.5" />
                {sc.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span className="text-[11px] text-slate-500">{formatDate(journal.date, "EEEE, dd MMM yyyy")}</span>
            </div>
            <p className="text-sm font-semibold text-slate-800 line-clamp-1">{journal.title}</p>
            <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{journal.content}</p>

            <div className="flex items-center gap-3 mt-2">
              {journal.photos.length > 0 && (
                <div className="flex items-center gap-1">
                  <Camera className="w-3 h-3 text-slate-400" />
                  <span className="text-[11px] text-slate-500">{journal.photos.length} foto</span>
                </div>
              )}
              {journal.feedback_text && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-blue-400" />
                  <span className="text-[11px] text-blue-600">Ada feedback</span>
                </div>
              )}
              {journal.feedback_rating && (
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-[11px] text-amber-600 font-bold">{journal.feedback_rating}</span>
                </div>
              )}
              {journal.submitted_at && (
                <span className="text-[11px] text-slate-400 ml-auto">
                  {formatRelativeTime(journal.submitted_at)}
                </span>
              )}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
        </div>
      </button>
    </motion.div>
  );
}

/* ── Main Page ───────────────────────────────────────── */

export default function GuruJurnalPage() {
  const { profile } = useAuthStore();
  const supabase = createClient();

  const [journals, setJournals] = useState<JournalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<JournalStatus | "all">("all");
  const [selectedJournal, setSelectedJournal] = useState<JournalItem | null>(null);

  /* ── Load ──────────────────────────────────────────── */

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      if (!profile?.id) return;

      // Ambil assignment & student info
      const { data: assignments } = await supabase
        .from("pkl_assignments")
        .select("id, students(id, nis, profiles(full_name))")
        .eq("teacher_id", profile.id)
        .eq("status", "active");

      if (!assignments || assignments.length === 0) {
        setJournals([]);
        return;
      }

      const assignmentIds = assignments.map((a) => a.id);
      const studentMap = new Map<string, { name: string; nis: string }>();
      for (const a of assignments) {
        const s = a.students as unknown as {
          id: string;
          nis: string;
          profiles: { full_name: string } | null;
        } | null;
        if (s?.id) {
          studentMap.set(s.id, {
            name: s.profiles?.full_name ?? "Siswa",
            nis: s.nis ?? "-",
          });
        }
      }

      // Ambil jurnal berdasarkan assignment
      const { data: journalData, error } = await supabase
        .from("journals")
        .select("id, student_id, date, title, content, status, photos, submitted_at, feedback_text, feedback_rating")
        .in("pkl_assignment_id", assignmentIds)
        .neq("status", "draft")
        .order("submitted_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      const mapped: JournalItem[] = (journalData ?? []).map((j) => {
        const info = studentMap.get(j.student_id) ?? { name: "Siswa", nis: "-" };
        return {
          id: j.id,
          student_id: j.student_id,
          student_name: info.name,
          student_nis: info.nis,
          date: j.date,
          title: j.title,
          content: j.content ?? "",
          status: j.status as JournalStatus,
          photos: Array.isArray(j.photos) ? (j.photos as string[]) : [],
          submitted_at: j.submitted_at,
          feedback_text: j.feedback_text ?? null,
          feedback_rating: j.feedback_rating ?? null,
        };
      });

      setJournals(mapped);
    } catch (err) {
      console.error("loadJournals error:", err);
      toast.error("Gagal memuat data jurnal");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── Submit feedback ────────────────────────────────── */

  const handleFeedbackSubmit = async (
    id: string,
    feedback: string,
    rating: number,
    action: "reviewed" | "revision"
  ) => {
    const { error } = await supabase
      .from("journals")
      .update({
        status: action,
        feedback_text: feedback,
        feedback_rating: rating,
        reviewed_at: new Date().toISOString(),
        reviewed_by: profile?.id,
      })
      .eq("id", id);

    if (error) {
      toast.error("Gagal menyimpan feedback");
      throw error;
    }

    setJournals((prev) =>
      prev.map((j) =>
        j.id === id
          ? { ...j, status: action, feedback_text: feedback, feedback_rating: rating }
          : j
      )
    );

    toast.success(
      action === "reviewed"
        ? "Jurnal disetujui & feedback terkirim ✅"
        : "Jurnal perlu revisi, notifikasi dikirim ke siswa"
    );
  };

  /* ── Filter ────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let r = [...journals];
    if (filterStatus !== "all") r = r.filter((j) => j.status === filterStatus);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      r = r.filter(
        (j) =>
          j.student_name.toLowerCase().includes(q) ||
          j.title.toLowerCase().includes(q)
      );
    }
    return r;
  }, [journals, filterStatus, searchQuery]);

  const pendingCount = journals.filter((j) => j.status === "submitted").length;

  /* ── Render ─────────────────────────────────────────── */

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-extrabold text-slate-900">Jurnal Siswa</h1>
              <p className="text-xs text-slate-400 mt-px">{journals.length} jurnal · {pendingCount} perlu direview</p>
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
              className="flex items-center gap-3 p-4 bg-purple-600 rounded-2xl shadow-lg shadow-purple-200/60"
            >
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <BookOpen className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{pendingCount} jurnal menunggu review</p>
                <p className="text-xs text-purple-100">Segera beri feedback kepada siswa</p>
              </div>
            </motion.div>
          )}

          {/* Search */}
          <div className="flex items-center gap-2.5 px-3.5 h-12 rounded-2xl bg-white border border-slate-200">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="search"
              placeholder="Cari nama siswa atau judul jurnal..."
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
              { value: "all",       label: "Semua" },
              { value: "submitted", label: "Belum Direview" },
              { value: "reviewed",  label: "Disetujui" },
              { value: "revision",  label: "Perlu Revisi" },
            ] as { value: JournalStatus | "all"; label: string }[]).map((opt) => {
              const count = opt.value === "all"
                ? journals.length
                : journals.filter((j) => j.status === opt.value).length;
              return (
                <button
                  key={opt.value}
                  onClick={() => setFilterStatus(opt.value)}
                  className={cn(
                    "flex-shrink-0 px-4 h-8 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5",
                    filterStatus === opt.value
                      ? "bg-purple-600 text-white shadow-sm"
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
                <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500">
                {searchQuery || filterStatus !== "all"
                  ? "Tidak ada jurnal yang cocok"
                  : "Belum ada jurnal yang dikirim"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((j, i) => (
                <JournalCard
                  key={j.id}
                  journal={j}
                  index={i}
                  onClick={() => setSelectedJournal(j)}
                />
              ))}
            </div>
          )}

          <div className="h-4" />
        </div>
      </div>

      <AnimatePresence>
        {selectedJournal && (
          <FeedbackModal
            journal={selectedJournal}
            onClose={() => setSelectedJournal(null)}
            onSubmit={handleFeedbackSubmit}
          />
        )}
      </AnimatePresence>
    </>
  );
}
