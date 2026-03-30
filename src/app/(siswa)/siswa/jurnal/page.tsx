"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileEdit,
  MessageSquare,
  Star,
  TrendingUp,
  X,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { formatDate, getJournalStatusLabel, cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────── */

type JournalStatus = "draft" | "submitted" | "reviewed" | "revision";
type SortOrder = "newest" | "oldest";

interface JournalItem {
  id: string;
  date: string;
  title: string;
  content: string;
  status: JournalStatus;
  photos: string[];
  submitted_at: string | null;
  updated_at: string;
  feedback_count?: number;
  feedback_rating?: number | null;
}

/* ─────────────────────────────────────────────────────────
   Status config
───────────────────────────────────────────────────────── */

const STATUS_CONFIG: Record<
  JournalStatus,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
    dot: string;
  }
> = {
  draft: {
    label: "Draft",
    icon: FileEdit,
    color: "text-slate-600",
    bg: "bg-slate-100",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
  submitted: {
    label: "Terkirim",
    icon: Clock,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  reviewed: {
    label: "Direview",
    icon: CheckCircle2,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  revision: {
    label: "Perlu Revisi",
    icon: AlertTriangle,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
};

const FILTER_OPTIONS: { value: JournalStatus | "all"; label: string; emoji: string }[] = [
  { value: "all", label: "Semua", emoji: "📋" },
  { value: "draft", label: "Draft", emoji: "📝" },
  { value: "submitted", label: "Terkirim", emoji: "📤" },
  { value: "reviewed", label: "Direview", emoji: "✅" },
  { value: "revision", label: "Revisi", emoji: "⚠️" },
];

/* ─────────────────────────────────────────────────────────
   Placeholder data
───────────────────────────────────────────────────────── */

function generatePlaceholderJournals(): JournalItem[] {
  const topics = [
    "Instalasi dan Konfigurasi Server Linux Ubuntu",
    "Troubleshooting Jaringan LAN Kantor",
    "Backup dan Restore Database PostgreSQL",
    "Setup CCTV dan Sistem Keamanan",
    "Pemeliharaan Komputer dan Printer",
    "Konfigurasi Router Mikrotik",
    "Instalasi Aplikasi ERP Perusahaan",
    "Monitoring Server dengan Grafana",
    "Pembuatan Laporan IT Bulanan",
    "Penanganan Keluhan Pengguna (Helpdesk)",
    "Konfigurasi Email Server",
    "Update dan Patch Sistem Operasi",
    "Instalasi Jaringan WiFi Baru",
    "Pengelolaan Akun Active Directory",
    "Testing Koneksi Internet dan Bandwidth",
  ];

  const statuses: JournalStatus[] = ["reviewed", "reviewed", "submitted", "reviewed", "revision", "submitted", "reviewed", "draft", "reviewed", "reviewed", "submitted", "reviewed", "reviewed", "revision", "draft"];

  return topics.map((title, i) => {
    const daysAgo = i;
    const date = new Date(Date.now() - daysAgo * 86400000);
    const status = statuses[i] ?? "submitted";

    return {
      id: String(i + 1),
      date: date.toISOString().split("T")[0],
      title,
      content: `Pada hari ini, saya melakukan kegiatan ${title.toLowerCase()}. Dimulai dari pukul 08.00 hingga 17.00 WIB dengan bimbingan dari pembimbing lapangan perusahaan.`,
      status,
      photos: i % 3 === 0 ? ["photo1.jpg"] : [],
      submitted_at: status !== "draft" ? new Date(date.getTime() + 3600000).toISOString() : null,
      updated_at: new Date(date.getTime() + 7200000).toISOString(),
      feedback_count: status === "reviewed" || status === "revision" ? Math.floor(Math.random() * 3) + 1 : 0,
      feedback_rating: status === "reviewed" ? Math.floor(Math.random() * 2) + 4 : null,
    };
  });
}

/* ─────────────────────────────────────────────────────────
   Summary bar
───────────────────────────────────────────────────────── */

function JournalSummary({ journals }: { journals: JournalItem[] }) {
  const total = journals.length;
  const reviewed = journals.filter((j) => j.status === "reviewed").length;
  const submitted = journals.filter((j) => j.status === "submitted").length;
  const draft = journals.filter((j) => j.status === "draft").length;
  const revision = journals.filter((j) => j.status === "revision").length;

  const completionRate = total > 0 ? Math.round((reviewed / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-5 shadow-lg shadow-blue-200/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider mb-0.5">
            Progress Jurnal PKL
          </p>
          <p className="text-white text-2xl font-extrabold leading-none">
            {reviewed}
            <span className="text-blue-200 text-base font-semibold ml-1">
              / {total} direview
            </span>
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-white leading-none">
            {completionRate}%
          </div>
          <p className="text-blue-200 text-[11px] font-medium mt-0.5">selesai</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 bg-white/20 rounded-full overflow-hidden mb-4">
        <motion.div
          className="h-full bg-white rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${completionRate}%` }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Direview", value: reviewed, color: "bg-emerald-400/30 text-emerald-100" },
          { label: "Terkirim", value: submitted, color: "bg-blue-400/30 text-blue-100" },
          { label: "Revisi", value: revision, color: "bg-amber-400/30 text-amber-100" },
          { label: "Draft", value: draft, color: "bg-white/20 text-white/80" },
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn("rounded-xl p-2 text-center", stat.color)}
          >
            <p className="text-lg font-extrabold leading-none">{stat.value}</p>
            <p className="text-[10px] font-medium mt-0.5 opacity-90">{stat.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Journal card
───────────────────────────────────────────────────────── */

interface JournalCardProps {
  journal: JournalItem;
  index: number;
}

function JournalCard({ journal, index }: JournalCardProps) {
  const statusCfg = STATUS_CONFIG[journal.status];
  const StatusIcon = statusCfg.icon;

  const previewText = journal.content
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, 80);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.35,
        delay: index * 0.04,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Link
        href={`/siswa/jurnal/${journal.id}`}
        className={cn(
          "flex flex-col gap-3 p-4 rounded-2xl",
          "bg-white border shadow-sm",
          "hover:shadow-md hover:-translate-y-px hover:border-slate-300",
          "active:scale-[0.98] transition-all duration-200",
          "tap-highlight-none select-none",
          statusCfg.border
        )}
      >
        {/* Top row: date + status */}
        <div className="flex items-center justify-between gap-2">
          {/* Date chip */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-[13px] font-extrabold text-blue-700 leading-none">
                {new Date(journal.date).getDate()}
              </span>
              <span className="text-[9px] font-bold text-blue-400 uppercase leading-none">
                {formatDate(journal.date, "MMM")}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-400 leading-none">
                {formatDate(journal.date, "EEEE")}
              </p>
              <p className="text-[11px] text-slate-400 leading-none mt-px">
                {formatDate(journal.date, "yyyy")}
              </p>
            </div>
          </div>

          {/* Status badge */}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
              "text-[11px] font-semibold whitespace-nowrap",
              statusCfg.bg,
              statusCfg.color
            )}
          >
            <span
              className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", statusCfg.dot)}
              aria-hidden="true"
            />
            {statusCfg.label}
          </span>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 mb-1">
            {journal.title}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
            {previewText}
            {journal.content.length > 80 ? "..." : ""}
          </p>
        </div>

        {/* Bottom meta */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-3">
            {/* Photos badge */}
            {journal.photos.length > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                <span aria-hidden="true">📷</span>
                {journal.photos.length} foto
              </span>
            )}

            {/* Feedback count */}
            {(journal.feedback_count ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-blue-500 font-medium">
                <MessageSquare className="w-3 h-3" aria-hidden="true" />
                {journal.feedback_count} komentar
              </span>
            )}

            {/* Rating */}
            {journal.feedback_rating !== null && journal.feedback_rating !== undefined && (
              <span className="flex items-center gap-0.5 text-[11px] text-amber-500 font-semibold">
                <Star className="w-3 h-3 fill-current" aria-hidden="true" />
                {journal.feedback_rating}/5
              </span>
            )}
          </div>

          <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" aria-hidden="true" />
        </div>
      </Link>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Empty state
───────────────────────────────────────────────────────── */

function EmptyJournal({
  hasFilters,
  onClear,
  onNew,
}: {
  hasFilters: boolean;
  onClear: () => void;
  onNew: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-14 px-6 text-center"
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-4"
        aria-hidden="true"
      >
        <BookOpen className="w-9 h-9 text-blue-400" strokeWidth={1.5} />
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-base font-bold text-slate-700 mb-1.5"
      >
        {hasFilters ? "Tidak Ada Jurnal" : "Belum Ada Jurnal"}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.28 }}
        className="text-sm text-slate-400 max-w-xs leading-relaxed mb-5"
      >
        {hasFilters
          ? "Tidak ada jurnal yang cocok dengan filter yang dipilih. Coba ubah filter atau hapus pencarian."
          : "Mulai dokumentasikan kegiatan PKL harianmu. Jurnal yang lengkap membantu penilaian akhir PKL."}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.36 }}
        className="flex gap-2.5"
      >
        {hasFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-2 h-10 px-4 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-[0.97] transition-all tap-highlight-none"
          >
            <X className="w-3.5 h-3.5" />
            Hapus Filter
          </button>
        )}
        <button
          onClick={onNew}
          className="flex items-center gap-2 h-10 px-5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-[0.97] transition-all shadow-md shadow-blue-200 tap-highlight-none"
        >
          <Plus className="w-4 h-4" />
          {hasFilters ? "Buat Jurnal Baru" : "Buat Jurnal Pertama"}
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Skeleton loader
───────────────────────────────────────────────────────── */

function JournalSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3"
          aria-hidden="true"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-slate-100 animate-pulse" />
              <div className="space-y-1">
                <div className="h-2.5 w-16 bg-slate-100 rounded animate-pulse" />
                <div className="h-2 w-10 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-6 w-20 bg-slate-100 rounded-full animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3.5 w-full bg-slate-100 rounded animate-pulse" />
            <div className="h-3 w-4/5 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="h-px bg-slate-100" />
          <div className="flex justify-between">
            <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
            <div className="h-3 w-4 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Filter sheet
───────────────────────────────────────────────────────── */

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  activeFilter: JournalStatus | "all";
  sortOrder: SortOrder;
  onFilterChange: (f: JournalStatus | "all") => void;
  onSortChange: (s: SortOrder) => void;
}

function FilterSheet({
  open,
  onClose,
  activeFilter,
  sortOrder,
  onFilterChange,
  onSortChange,
}: FilterSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-[28px] pb-safe shadow-xl max-h-[85dvh] overflow-y-auto"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-200" aria-hidden="true" />
            </div>

            <div className="px-5 pb-6 pt-2">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Filter & Urutkan</h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors tap-highlight-none"
                  aria-label="Tutup filter"
                >
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              {/* Filter by status */}
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Filter Status
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => onFilterChange(opt.value)}
                      className={cn(
                        "flex items-center gap-2.5 p-3 rounded-2xl border-2",
                        "text-sm font-semibold text-left",
                        "transition-all duration-150 tap-highlight-none",
                        activeFilter === opt.value
                          ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                      )}
                    >
                      <span className="text-base" aria-hidden="true">{opt.emoji}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort order */}
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Urutan
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(["newest", "oldest"] as SortOrder[]).map((order) => (
                    <button
                      key={order}
                      onClick={() => onSortChange(order)}
                      className={cn(
                        "flex items-center justify-center gap-2 p-3 rounded-2xl border-2",
                        "text-sm font-semibold",
                        "transition-all duration-150 tap-highlight-none",
                        sortOrder === order
                          ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                      )}
                    >
                      {order === "newest" ? (
                        <SortDesc className="w-4 h-4" />
                      ) : (
                        <SortAsc className="w-4 h-4" />
                      )}
                      {order === "newest" ? "Terbaru" : "Terlama"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply button */}
              <button
                onClick={onClose}
                className="w-full h-12 rounded-2xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 active:scale-[0.97] transition-all shadow-md shadow-blue-200 tap-highlight-none"
              >
                Terapkan Filter
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────── */

export default function JurnalPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const supabase = createClient();

  const [journals, setJournals] = useState<JournalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<JournalStatus | "all">("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [showFilter, setShowFilter] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  /* ── Load journals ─────────────────────────────────── */

  useEffect(() => {
    async function loadJournals() {
      setLoading(true);
      try {
        if (!profile?.id) {
          setJournals(generatePlaceholderJournals());
          return;
        }

        const { data, error } = await supabase
          .from("journals")
          .select("id, date, title, content, status, photos, submitted_at, updated_at")
          .order("date", { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          setJournals(
            data.map((j) => ({
              id: j.id,
              date: j.date,
              title: j.title,
              content: j.content ?? "",
              status: j.status as JournalStatus,
              photos: j.photos ?? [],
              submitted_at: j.submitted_at,
              updated_at: j.updated_at,
              feedback_count: 0,
              feedback_rating: null,
            }))
          );
        } else {
          setJournals(generatePlaceholderJournals());
        }
      } catch {
        setJournals(generatePlaceholderJournals());
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(loadJournals, 300);
    return () => clearTimeout(timer);
  }, [profile?.id]);

  /* ── Filtered + sorted journals ────────────────────── */

  const filteredJournals = useMemo(() => {
    let result = [...journals];

    // Filter by status
    if (activeFilter !== "all") {
      result = result.filter((j) => j.status === activeFilter);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.content.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [journals, activeFilter, searchQuery, sortOrder]);

  /* ── Computed stats ────────────────────────────────── */

  const hasActiveFilters =
    activeFilter !== "all" || searchQuery.trim().length > 0;

  const activeFilterCount =
    (activeFilter !== "all" ? 1 : 0) + (searchQuery.trim() ? 1 : 0);

  const handleClearFilters = () => {
    setActiveFilter("all");
    setSearchQuery("");
    setSortOrder("newest");
  };

  /* ── Today's journal check ──────────────────────────── */

  const todayStr = new Date().toISOString().split("T")[0];
  const hasTodayJournal = journals.some((j) => j.date === todayStr);

  /* ── Render ─────────────────────────────────────────── */

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto">

          {/* ── Today alert ──────────────────────────────── */}
          <AnimatePresence>
            {!loading && !hasTodayJournal && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <div
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl",
                    "bg-amber-50 border border-amber-200"
                  )}
                >
                  <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4.5 h-4.5 text-amber-600" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-900 leading-tight">
                      Belum isi jurnal hari ini
                    </p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Jangan lupa dokumentasikan kegiatanmu!
                    </p>
                  </div>
                  <button
                    onClick={() => router.push("/siswa/jurnal/buat")}
                    className={cn(
                      "flex-shrink-0 px-3 py-1.5 rounded-xl",
                      "bg-amber-500 text-white text-xs font-bold",
                      "hover:bg-amber-600 active:scale-[0.97]",
                      "transition-all duration-150 tap-highlight-none"
                    )}
                  >
                    Isi Sekarang
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Summary ──────────────────────────────────── */}
          {loading ? (
            <div className="h-36 bg-blue-100 rounded-3xl animate-pulse" aria-hidden="true" />
          ) : (
            <JournalSummary journals={journals} />
          )}

          {/* ── Search + Filter bar ───────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex gap-2.5"
          >
            {/* Search input */}
            <div
              className={cn(
                "flex-1 flex items-center gap-2.5 px-3.5 h-11 rounded-2xl",
                "bg-white border transition-all duration-200",
                searchFocused
                  ? "border-blue-400 shadow-sm ring-2 ring-blue-100"
                  : "border-slate-200"
              )}
            >
              <Search
                className={cn(
                  "w-4 h-4 flex-shrink-0 transition-colors duration-150",
                  searchFocused ? "text-blue-500" : "text-slate-400"
                )}
                aria-hidden="true"
              />
              <input
                type="search"
                placeholder="Cari jurnal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={cn(
                  "flex-1 bg-transparent text-sm text-slate-800",
                  "placeholder:text-slate-400",
                  "outline-none border-none"
                )}
                aria-label="Cari jurnal"
              />
              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => setSearchQuery("")}
                    className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 tap-highlight-none"
                    aria-label="Hapus pencarian"
                  >
                    <X className="w-3 h-3 text-slate-500" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Filter button */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowFilter(true)}
              className={cn(
                "relative flex items-center justify-center gap-1.5",
                "h-11 px-4 rounded-2xl border",
                "text-sm font-semibold transition-all duration-150",
                "tap-highlight-none",
                activeFilterCount > 0
                  ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              )}
              aria-label={`Filter jurnal${activeFilterCount > 0 ? `, ${activeFilterCount} aktif` : ""}`}
            >
              <Filter className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Filter</span>
              {activeFilterCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 min-w-[18px] min-h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white"
                >
                  {activeFilterCount}
                </motion.span>
              )}
            </motion.button>
          </motion.div>

          {/* ── Quick filter pills ──────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="scroll-x flex gap-2 pb-1 -mx-4 px-4"
            role="group"
            aria-label="Filter cepat status jurnal"
          >
            {FILTER_OPTIONS.map((opt) => {
              const isActive = activeFilter === opt.value;
              const count =
                opt.value === "all"
                  ? journals.length
                  : journals.filter((j) => j.status === opt.value).length;

              return (
                <motion.button
                  key={opt.value}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setActiveFilter(opt.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-2 rounded-full",
                    "text-xs font-semibold whitespace-nowrap",
                    "border transition-all duration-150 tap-highlight-none flex-shrink-0",
                    isActive
                      ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  )}
                  aria-pressed={isActive}
                >
                  <span aria-hidden="true">{opt.emoji}</span>
                  {opt.label}
                  <span
                    className={cn(
                      "ml-0.5 px-1.5 py-px rounded-full text-[10px] font-bold",
                      isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>

          {/* ── Results header ─────────────────────────────── */}
          {!loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-between"
            >
              <p className="text-sm text-slate-500 font-medium">
                {filteredJournals.length > 0 ? (
                  <>
                    <span className="font-bold text-slate-800">
                      {filteredJournals.length}
                    </span>{" "}
                    jurnal ditemukan
                  </>
                ) : (
                  "Tidak ada jurnal"
                )}
              </p>

              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors tap-highlight-none"
                >
                  <X className="w-3 h-3" />
                  Hapus filter
                </button>
              )}
            </motion.div>
          )}

          {/* ── Journal list ────────────────────────────── */}
          {loading ? (
            <JournalSkeleton />
          ) : filteredJournals.length === 0 ? (
            <EmptyJournal
              hasFilters={hasActiveFilters}
              onClear={handleClearFilters}
              onNew={() => router.push("/siswa/jurnal/buat")}
            />
          ) : (
            <div className="space-y-3">
              {filteredJournals.map((journal, i) => (
                <JournalCard key={journal.id} journal={journal} index={i} />
              ))}
            </div>
          )}

          {/* Bottom spacer */}
          <div className="h-4" aria-hidden="true" />
        </div>
      </div>

      {/* ── FAB — New Journal ─────────────────────────── */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 20 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => router.push("/siswa/jurnal/buat")}
        className={cn(
          "fab",
          "flex items-center justify-center gap-2",
          "bg-blue-600 text-white",
          "shadow-xl shadow-blue-300/50"
        )}
        aria-label="Buat jurnal baru"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </motion.button>

      {/* ── Filter Sheet ─────────────────────────────── */}
      <FilterSheet
        open={showFilter}
        onClose={() => setShowFilter(false)}
        activeFilter={activeFilter}
        sortOrder={sortOrder}
        onFilterChange={(f) => {
          setActiveFilter(f);
        }}
        onSortChange={(s) => {
          setSortOrder(s);
        }}
      />
    </>
  );
}
