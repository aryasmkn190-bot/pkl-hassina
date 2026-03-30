"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Megaphone,
  Search,
  X,
  ChevronRight,
  Pin,
  Bell,
  Calendar,
  FileText,
  AlertTriangle,
  Info,
  ArrowLeft,
  Eye,
  Download,
  Share2,
  BookOpen,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { formatRelativeTime, formatDate, cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────── */

type AnnouncementType = "general" | "urgent" | "event" | "reminder";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  author_name: string;
  author_avatar: string | null;
  is_pinned: boolean;
  published_at: string;
  expires_at: string | null;
  attachment_urls: string[];
  view_count: number;
}

/* ─────────────────────────────────────────────────────────
   Type config
───────────────────────────────────────────────────────── */

const TYPE_CONFIG: Record<
  AnnouncementType,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
    gradient: string;
    emoji: string;
  }
> = {
  urgent: {
    label: "Penting",
    icon: AlertTriangle,
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    gradient: "from-red-500 to-red-600",
    emoji: "🔴",
  },
  general: {
    label: "Umum",
    icon: Megaphone,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    gradient: "from-blue-500 to-blue-600",
    emoji: "📢",
  },
  event: {
    label: "Kegiatan",
    icon: Calendar,
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
    gradient: "from-purple-500 to-purple-600",
    emoji: "📅",
  },
  reminder: {
    label: "Pengingat",
    icon: Bell,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    gradient: "from-amber-500 to-amber-600",
    emoji: "⏰",
  },
};

const FILTER_OPTIONS: { value: AnnouncementType | "all"; label: string; emoji: string }[] = [
  { value: "all", label: "Semua", emoji: "📋" },
  { value: "urgent", label: "Penting", emoji: "🔴" },
  { value: "general", label: "Umum", emoji: "📢" },
  { value: "event", label: "Kegiatan", emoji: "📅" },
  { value: "reminder", label: "Pengingat", emoji: "⏰" },
];

/* ─────────────────────────────────────────────────────────
   Placeholder data
───────────────────────────────────────────────────────── */

function generatePlaceholderAnnouncements(): Announcement[] {
  return [
    {
      id: "1",
      title: "Batas Akhir Pengumpulan Laporan PKL Tahap 1",
      content: `<p>Kepada seluruh siswa peserta PKL,</p>
<p>Kami menginformasikan bahwa batas akhir pengumpulan <strong>Laporan PKL Tahap 1</strong> adalah tanggal <strong>30 Juni 2025</strong>.</p>
<p>Adapun format dan ketentuan laporan adalah sebagai berikut:</p>
<ul>
<li>Cover sesuai format sekolah</li>
<li>BAB I: Pendahuluan (latar belakang, tujuan, manfaat)</li>
<li>BAB II: Profil perusahaan</li>
<li>BAB III: Kegiatan PKL (jurnal harian terpilih)</li>
</ul>
<p>Laporan dikumpulkan dalam bentuk <strong>PDF</strong> melalui fitur dokumen pada aplikasi ini atau langsung ke guru pembimbing.</p>
<p>Harap perhatikan tenggat waktu agar tidak mempengaruhi nilai PKL Anda.</p>`,
      type: "urgent",
      author_name: "Ibu Sari Dewi, S.Kom",
      author_avatar: null,
      is_pinned: true,
      published_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      expires_at: new Date(Date.now() + 86400000 * 15).toISOString(),
      attachment_urls: [],
      view_count: 156,
    },
    {
      id: "2",
      title: "Kunjungan Monitoring Guru Pembimbing ke Perusahaan",
      content: `<p>Diberitahukan kepada seluruh siswa PKL bahwa akan dilaksanakan <strong>kunjungan monitoring</strong> oleh guru pembimbing sekolah ke tempat PKL masing-masing.</p>
<p>Jadwal kunjungan akan disesuaikan dengan ketersediaan guru pembimbing. Siswa diharapkan:</p>
<ul>
<li>Berpakaian rapi dan sopan saat kunjungan</li>
<li>Mempersiapkan buku jurnal untuk ditunjukkan</li>
<li>Menyiapkan daftar kegiatan yang telah dilakukan</li>
<li>Koordinasi dengan pembimbing lapangan perusahaan</li>
</ul>
<p>Informasi jadwal spesifik akan dikirimkan melalui chat langsung oleh guru pembimbing masing-masing.</p>`,
      type: "event",
      author_name: "Pak Ahmad Fauzi, M.Pd",
      author_avatar: null,
      is_pinned: false,
      published_at: new Date(Date.now() - 86400000).toISOString(),
      expires_at: null,
      attachment_urls: [],
      view_count: 89,
    },
    {
      id: "3",
      title: "Pengingat: Jurnal Harian Wajib Diisi Setiap Hari Kerja",
      content: `<p>Kepada seluruh siswa PKL,</p>
<p>Kami mengingatkan kembali bahwa <strong>jurnal harian PKL wajib diisi setiap hari kerja</strong> tanpa terkecuali.</p>
<p>Ketentuan pengisian jurnal:</p>
<ul>
<li>Diisi maksimal pukul <strong>21.00 WIB</strong> setiap harinya</li>
<li>Minimal 3 paragraf atau 100 kata</li>
<li>Sertakan foto kegiatan jika memungkinkan</li>
<li>Kirimkan jurnal (ubah dari Draft menjadi Terkirim)</li>
</ul>
<p>Jurnal yang tidak diisi akan dihitung sebagai <strong>tidak hadir tanpa keterangan (alfa)</strong> dan berpengaruh pada nilai akhir PKL.</p>`,
      type: "reminder",
      author_name: "Ketua Jurusan TKJ",
      author_avatar: null,
      is_pinned: false,
      published_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      expires_at: null,
      attachment_urls: [],
      view_count: 203,
    },
    {
      id: "4",
      title: "Informasi Libur Nasional dan Hari Besar",
      content: `<p>Diberitahukan kepada seluruh siswa PKL bahwa pada <strong>hari-hari libur nasional</strong> berikut, siswa tidak diwajibkan hadir ke tempat PKL:</p>
<p>Namun demikian, apabila perusahaan tempat PKL tetap beroperasi pada hari tersebut, siswa dipersilakan mengikuti kebijakan perusahaan dan tetap mengisi presensi.</p>
<p>Pada hari libur nasional, pengisian jurnal bersifat <strong>opsional</strong>.</p>`,
      type: "general",
      author_name: "Admin Sekolah",
      author_avatar: null,
      is_pinned: false,
      published_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      expires_at: null,
      attachment_urls: [],
      view_count: 178,
    },
    {
      id: "5",
      title: "Tata Cara Pengajuan Izin Tidak Hadir PKL",
      content: `<p>Bagi siswa yang tidak dapat hadir ke tempat PKL, wajib mengajukan keterangan tidak hadir melalui aplikasi ini.</p>
<p><strong>Langkah-langkah pengajuan:</strong></p>
<ol>
<li>Buka menu <strong>Izin & Sakit</strong> di halaman utama</li>
<li>Tap tombol <strong>+ Ajukan</strong></li>
<li>Pilih jenis keterangan (Sakit/Izin/Darurat)</li>
<li>Isi tanggal dan alasan dengan lengkap</li>
<li>Upload surat dokter/izin jika ada</li>
<li>Kirimkan pengajuan</li>
</ol>
<p>Pengajuan yang tidak dilakukan melalui aplikasi tidak akan diproses. Pastikan mengajukan <strong>sebelum atau paling lambat pada hari yang sama</strong>.</p>`,
      type: "general",
      author_name: "Ibu Sari Dewi, S.Kom",
      author_avatar: null,
      is_pinned: false,
      published_at: new Date(Date.now() - 86400000 * 7).toISOString(),
      expires_at: null,
      attachment_urls: [],
      view_count: 312,
    },
  ];
}

/* ─────────────────────────────────────────────────────────
   Announcement Card
───────────────────────────────────────────────────────── */

interface AnnouncementCardProps {
  announcement: Announcement;
  index: number;
  onClick: () => void;
}

function AnnouncementCard({ announcement, index, onClick }: AnnouncementCardProps) {
  const cfg = TYPE_CONFIG[announcement.type];
  const TypeIcon = cfg.icon;

  const isExpired =
    announcement.expires_at !== null &&
    new Date(announcement.expires_at) < new Date();

  const strippedContent = announcement.content
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.38,
        delay: index * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <button
        onClick={onClick}
        className={cn(
          "w-full text-left",
          "flex flex-col gap-0 rounded-2xl overflow-hidden",
          "bg-white border shadow-sm",
          "hover:shadow-md hover:-translate-y-px",
          "active:scale-[0.98] transition-all duration-200",
          "tap-highlight-none select-none",
          announcement.is_pinned ? "border-blue-200" : "border-slate-100",
          isExpired && "opacity-60"
        )}
      >
        {/* Pinned indicator */}
        {announcement.is_pinned && (
          <div className="flex items-center gap-1.5 px-4 pt-2.5 pb-0">
            <Pin className="w-3 h-3 text-blue-500 fill-current" />
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
              Disematkan
            </span>
          </div>
        )}

        <div className="flex items-start gap-3 p-4">
          {/* Type icon */}
          <div
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
              cfg.bg
            )}
            aria-hidden="true"
          >
            <TypeIcon className={cn("w-5 h-5", cfg.color)} strokeWidth={2} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Badge + time */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
                  "text-[10px] font-bold whitespace-nowrap",
                  cfg.bg,
                  cfg.color
                )}
              >
                {cfg.emoji} {cfg.label}
              </span>
              {isExpired && (
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  Kedaluwarsa
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug mb-1">
              {announcement.title}
            </h3>

            {/* Preview */}
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
              {strippedContent}
              {announcement.content.length > 120 ? "..." : ""}
            </p>
          </div>

          <ChevronRight
            className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1"
            aria-hidden="true"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 pb-3 pt-0">
          <p className="text-[11px] text-slate-400 font-medium">
            {announcement.author_name} •{" "}
            {formatRelativeTime(announcement.published_at)}
          </p>
          <div className="flex items-center gap-1 text-slate-400">
            <Eye className="w-3 h-3" aria-hidden="true" />
            <span className="text-[11px]">{announcement.view_count}</span>
          </div>
        </div>
      </button>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Announcement Detail
───────────────────────────────────────────────────────── */

function AnnouncementDetail({
  announcement,
  onClose,
}: {
  announcement: Announcement;
  onClose: () => void;
}) {
  const cfg = TYPE_CONFIG[announcement.type];
  const TypeIcon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[60] bg-slate-50 overflow-y-auto"
    >
      {/* Detail header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 h-[60px] bg-white/90 backdrop-blur-xl border-b border-slate-200/60">
        <button
          onClick={onClose}
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors tap-highlight-none"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-4.5 h-4.5" strokeWidth={2.5} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[16px] font-bold text-slate-900 truncate">
            Detail Pengumuman
          </h1>
        </div>
        <button
          className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors tap-highlight-none"
          aria-label="Bagikan"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: announcement.title,
                text: announcement.content.replace(/<[^>]+>/g, " "),
              });
            }
          }}
        >
          <Share2 className="w-4.5 h-4.5" strokeWidth={2} />
        </button>
      </header>

      <div className="px-4 py-5 max-w-2xl mx-auto space-y-5 pb-safe pb-8">
        {/* Type banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={cn(
            "flex items-center gap-3 p-4 rounded-2xl border",
            cfg.bg,
            cfg.border
          )}
        >
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/70 border",
              cfg.border
            )}
          >
            <TypeIcon className={cn("w-6 h-6", cfg.color)} strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-[11px] font-bold uppercase tracking-wider opacity-70", cfg.color)}>
              {cfg.label}
            </p>
            <p className={cn("text-base font-bold leading-tight mt-0.5", cfg.color)}>
              {announcement.type === "urgent"
                ? "Pengumuman Penting — Harap Diperhatikan"
                : announcement.type === "event"
                ? "Informasi Kegiatan"
                : announcement.type === "reminder"
                ? "Pengingat untuk Anda"
                : "Informasi Umum"}
            </p>
          </div>
          {announcement.is_pinned && (
            <Pin className="w-5 h-5 text-blue-500 fill-current flex-shrink-0" />
          )}
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.06 }}
        >
          <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
            {announcement.title}
          </h2>

          {/* Meta */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-[9px] font-bold text-blue-600">
                  {announcement.author_name.charAt(0)}
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium truncate">
                {announcement.author_name}
              </span>
            </div>
            <span className="text-slate-300 text-xs">•</span>
            <span className="text-xs text-slate-500">
              {formatDate(announcement.published_at, "dd MMMM yyyy, HH:mm")}
            </span>
            <div className="flex items-center gap-1 text-slate-400">
              <Eye className="w-3 h-3" />
              <span className="text-xs">{announcement.view_count} dilihat</span>
            </div>
          </div>

          {/* Expiry notice */}
          {announcement.expires_at && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
              <Info className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs text-amber-700 font-medium">
                Berlaku hingga {formatDate(announcement.expires_at, "dd MMMM yyyy")}
              </span>
            </div>
          )}
        </motion.div>

        {/* Divider */}
        <div className="h-px bg-slate-200" />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12 }}
          className={cn(
            "bg-white rounded-2xl p-5 border border-slate-100 shadow-sm",
            "text-sm text-slate-700 leading-relaxed",
            // Rich text styling
            "[&_p]:mb-3 [&_p:last-child]:mb-0",
            "[&_strong]:font-bold [&_b]:font-bold",
            "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:my-3",
            "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:my-3",
            "[&_li]:text-slate-700 [&_li]:leading-relaxed",
            "[&_h3]:text-base [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:mb-2 [&_h3]:mt-3"
          )}
          dangerouslySetInnerHTML={{ __html: announcement.content }}
        />

        {/* Attachments */}
        {announcement.attachment_urls.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="space-y-2"
          >
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Lampiran ({announcement.attachment_urls.length})
            </p>
            {announcement.attachment_urls.map((url, i) => (
              <a
                key={i}
                href={url}
                download
                className={cn(
                  "flex items-center gap-3 p-3.5 rounded-2xl",
                  "bg-white border border-slate-200 shadow-sm",
                  "hover:shadow-md hover:border-blue-200",
                  "transition-all duration-200",
                  "tap-highlight-none"
                )}
              >
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4.5 h-4.5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    Lampiran {i + 1}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Tap untuk mengunduh</p>
                </div>
                <Download className="w-4 h-4 text-slate-400 flex-shrink-0" />
              </a>
            ))}
          </motion.div>
        )}

        {/* Back button at bottom */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.24 }}
          onClick={onClose}
          className={cn(
            "w-full h-12 rounded-2xl",
            "border-2 border-slate-200 bg-white",
            "text-sm font-semibold text-slate-700",
            "flex items-center justify-center gap-2",
            "hover:bg-slate-50 active:scale-[0.97]",
            "transition-all tap-highlight-none"
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Pengumuman
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Skeleton loader
───────────────────────────────────────────────────────── */

function AnnouncementSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3"
          aria-hidden="true"
        >
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-100 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-20 bg-slate-100 rounded-full animate-pulse" />
              <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
              <div className="h-3 w-4/5 bg-slate-100 rounded animate-pulse" />
              <div className="h-3 w-3/5 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex justify-between pt-1">
            <div className="h-3 w-32 bg-slate-100 rounded animate-pulse" />
            <div className="h-3 w-10 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────── */

export default function PengumumanPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const supabase = createClient();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<AnnouncementType | "all">("all");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);

  /* ── Load data ─────────────────────────────────────── */

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (!profile?.id) {
          setAnnouncements(generatePlaceholderAnnouncements());
          return;
        }

        const { data, error } = await supabase
          .from("announcements")
          .select(
            "id, title, content, type, is_pinned, published_at, expires_at, attachment_urls, view_count, profiles(full_name)"
          )
          .order("is_pinned", { ascending: false })
          .order("published_at", { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          setAnnouncements(
            data.map((a) => ({
              id: a.id,
              title: a.title,
              content: a.content,
              type: a.type as AnnouncementType,
              author_name: (a.profiles as unknown as { full_name: string } | null)?.full_name ?? "Admin",
              author_avatar: null,
              is_pinned: a.is_pinned,
              published_at: a.published_at,
              expires_at: a.expires_at,
              attachment_urls: a.attachment_urls ?? [],
              view_count: a.view_count ?? 0,
            }))
          );
        } else {
          setAnnouncements(generatePlaceholderAnnouncements());
        }
      } catch {
        setAnnouncements(generatePlaceholderAnnouncements());
      } finally {
        setLoading(false);
      }
    }

    const t = setTimeout(load, 350);
    return () => clearTimeout(t);
  }, [profile?.id]);

  /* ── Filtered announcements ────────────────────────── */

  const filteredAnnouncements = useMemo(() => {
    let result = [...announcements];

    if (activeFilter !== "all") {
      result = result.filter((a) => a.type === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q)
      );
    }

    return result;
  }, [announcements, activeFilter, searchQuery]);

  const pinnedAnnouncements = filteredAnnouncements.filter((a) => a.is_pinned);
  const regularAnnouncements = filteredAnnouncements.filter((a) => !a.is_pinned);

  const urgentCount = announcements.filter((a) => a.type === "urgent").length;

  /* ── Render ─────────────────────────────────────────── */

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto">

          {/* ── Urgent alert banner ─────────────────────── */}
          <AnimatePresence>
            {!loading && urgentCount > 0 && !searchQuery && activeFilter === "all" && (
              <motion.button
                key="urgent-banner"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                onClick={() => setActiveFilter("urgent")}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-2xl text-left",
                  "bg-red-500 shadow-lg shadow-red-200/60",
                  "hover:bg-red-600 active:scale-[0.98]",
                  "transition-all duration-200 tap-highlight-none"
                )}
              >
                <motion.div
                  animate={{ rotate: [-5, 5, -5, 5, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                  className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0"
                >
                  <Zap className="w-4.5 h-4.5 text-white" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white leading-tight">
                    {urgentCount} Pengumuman Penting!
                  </p>
                  <p className="text-xs text-red-100 mt-0.5">
                    Ada informasi mendesak yang perlu segera dibaca
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/70 flex-shrink-0" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* ── Search bar ───────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div
              className={cn(
                "flex items-center gap-2.5 px-3.5 h-12 rounded-2xl",
                "bg-white border transition-all duration-200",
                searchFocused
                  ? "border-blue-400 shadow-sm ring-2 ring-blue-100"
                  : "border-slate-200"
              )}
            >
              <Search
                className={cn(
                  "w-4 h-4 flex-shrink-0 transition-colors",
                  searchFocused ? "text-blue-500" : "text-slate-400"
                )}
                aria-hidden="true"
              />
              <input
                type="search"
                placeholder="Cari pengumuman..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none border-none"
                aria-label="Cari pengumuman"
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
          </motion.div>

          {/* ── Filter pills ─────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="scroll-x flex gap-2 -mx-4 px-4 pb-1"
            role="group"
            aria-label="Filter jenis pengumuman"
          >
            {FILTER_OPTIONS.map((opt) => {
              const isActive = activeFilter === opt.value;
              const count =
                opt.value === "all"
                  ? announcements.length
                  : announcements.filter((a) => a.type === opt.value).length;

              return (
                <motion.button
                  key={opt.value}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setActiveFilter(opt.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-2 rounded-full",
                    "text-xs font-semibold whitespace-nowrap flex-shrink-0",
                    "border transition-all duration-150 tap-highlight-none",
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
                      "px-1.5 py-px rounded-full text-[10px] font-bold",
                      isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>

          {/* ── Results count ─────────────────────────────── */}
          {!loading && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-sm text-slate-500 font-medium"
            >
              <span className="font-bold text-slate-800">
                {filteredAnnouncements.length}
              </span>{" "}
              pengumuman ditemukan
            </motion.p>
          )}

          {/* ── Content ───────────────────────────────────── */}
          {loading ? (
            <AnnouncementSkeleton />
          ) : filteredAnnouncements.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-18 h-18 bg-slate-100 rounded-3xl flex items-center justify-center mb-4" style={{ width: 72, height: 72 }}>
                <BookOpen className="w-8 h-8 text-slate-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-bold text-slate-600 mb-1.5">
                Tidak Ada Pengumuman
              </h3>
              <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                {searchQuery
                  ? `Tidak ditemukan pengumuman dengan kata kunci "${searchQuery}"`
                  : "Belum ada pengumuman untuk kategori ini"}
              </p>
              {(searchQuery || activeFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveFilter("all");
                  }}
                  className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-[0.97] transition-all tap-highlight-none"
                >
                  <X className="w-3.5 h-3.5" />
                  Hapus Filter
                </button>
              )}
            </motion.div>
          ) : (
            <div className="space-y-5">
              {/* Pinned section */}
              {pinnedAnnouncements.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Pin className="w-3 h-3 fill-current" />
                    Disematkan
                  </p>
                  <div className="space-y-3">
                    {pinnedAnnouncements.map((ann, i) => (
                      <AnnouncementCard
                        key={ann.id}
                        announcement={ann}
                        index={i}
                        onClick={() => setSelectedAnnouncement(ann)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Regular section */}
              {regularAnnouncements.length > 0 && (
                <div>
                  {pinnedAnnouncements.length > 0 && (
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                      Semua Pengumuman
                    </p>
                  )}
                  <div className="space-y-3">
                    {regularAnnouncements.map((ann, i) => (
                      <AnnouncementCard
                        key={ann.id}
                        announcement={ann}
                        index={i + pinnedAnnouncements.length}
                        onClick={() => setSelectedAnnouncement(ann)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="h-4" />
        </div>
      </div>

      {/* ── Detail overlay ────────────────────────────── */}
      <AnimatePresence>
        {selectedAnnouncement && (
          <AnnouncementDetail
            announcement={selectedAnnouncement}
            onClose={() => setSelectedAnnouncement(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
