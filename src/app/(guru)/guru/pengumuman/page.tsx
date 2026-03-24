"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone,
  Search,
  X,
  ChevronRight,
  Pin,
  Calendar,
  AlertTriangle,
  Info,
  ArrowLeft,
  Eye,
  Plus,
  Send,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime, formatDate, cn } from "@/lib/utils";


type AnnouncementType = "general" | "urgent" | "event" | "reminder";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  author_name: string;
  is_pinned: boolean;
  published_at: string;
  target_roles: string[];
  view_count: number;
}

const TYPE_CFG: Record<AnnouncementType, { label: string; icon: React.ElementType; color: string; bg: string; emoji: string }> = {
  urgent: { label: "Penting", icon: AlertTriangle, color: "text-red-700", bg: "bg-red-50", emoji: "🔴" },
  general: { label: "Umum", icon: Megaphone, color: "text-blue-700", bg: "bg-blue-50", emoji: "📢" },
  event: { label: "Acara", icon: Calendar, color: "text-purple-700", bg: "bg-purple-50", emoji: "📅" },
  reminder: { label: "Pengingat", icon: Info, color: "text-amber-700", bg: "bg-amber-50", emoji: "⏰" },
};

function generatePlaceholder(): Announcement[] {
  return [
    { id: "1", title: "Batas Pengumpulan Nilai PKL Semester Genap 2024/2025", content: "Kepada seluruh guru pembimbing PKL, harap segera melengkapi dan menginputkan nilai akhir PKL sebelum tanggal 5 April 2025. Nilai yang terlambat tidak akan dapat diproses.", type: "urgent", author_name: "Admin PKL", is_pinned: true, published_at: new Date(Date.now() - 3600000 * 2).toISOString(), target_roles: ["guru_pembimbing"], view_count: 12 },
    { id: "2", title: "Rapat Koordinasi Pembimbing PKL", content: "Diundang kepada seluruh guru pembimbing untuk hadir dalam rapat koordinasi evaluasi PKL semester genap yang akan dilaksanakan pada Jumat, 28 Maret 2025 pukul 13.00 WIB di ruang rapat guru.", type: "event", author_name: "Kepala Sekolah", is_pinned: false, published_at: new Date(Date.now() - 86400000).toISOString(), target_roles: ["guru_pembimbing"], view_count: 8 },
    { id: "3", title: "Panduan Pengisian Penilaian PKL di Aplikasi", content: "Cara mengisi penilaian PKL: (1) Buka menu Penilaian, (2) Pilih siswa, (3) Isi nilai kehadiran, jurnal, kinerja, dan sikap, (4) Klik Simpan. Hubungi admin jika ada kendala.", type: "reminder", author_name: "Tim IT PKL", is_pinned: false, published_at: new Date(Date.now() - 86400000 * 3).toISOString(), target_roles: ["guru_pembimbing"], view_count: 15 },
  ];
}

function AnnouncementDetail({ ann, onClose }: { ann: Announcement; onClose: () => void }) {
  const tc = TYPE_CFG[ann.type];
  const TypeIcon = tc.icon;

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
        <h1 className="text-[16px] font-bold text-slate-900 flex-1">Pengumuman</h1>
        <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold", tc.bg, tc.color)}>
          {tc.emoji} {tc.label}
        </span>
      </header>

      <div className="px-4 py-5 max-w-2xl mx-auto pb-8">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          {ann.is_pinned && (
            <div className="flex items-center gap-1.5 mb-3">
              <Pin className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-bold text-amber-600">Disematkan</span>
            </div>
          )}
          <h2 className="text-base font-bold text-slate-900 mb-3">{ann.title}</h2>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{ann.author_name.charAt(0)}</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700">{ann.author_name}</p>
              <p className="text-[11px] text-slate-400">{formatDate(ann.published_at, "EEEE, dd MMMM yyyy")}</p>
            </div>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
          <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-slate-100">
            <Eye className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-400">{ann.view_count} kali dilihat</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function GuruPengumumanPage() {
  const { profile } = useAuthStore();
  const supabase = createClient();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Announcement | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("announcements")
          .select("id, title, content, type, is_pinned, published_at, view_count, target_roles, profiles(full_name)")
          .or("target_roles.cs.{guru_pembimbing},target_roles.cs.{all}")
          .order("is_pinned", { ascending: false })
          .order("published_at", { ascending: false })
          .limit(50);

        if (error) throw error;

        if (data && data.length > 0) {
          setAnnouncements(data.map((a) => ({
            id: a.id,
            title: a.title,
            content: a.content,
            type: a.type as AnnouncementType,
            author_name: (a.profiles as unknown as { full_name: string } | null)?.full_name ?? "Admin",
            is_pinned: a.is_pinned ?? false,
            published_at: a.published_at,
            target_roles: a.target_roles ?? [],
            view_count: a.view_count ?? 0,
          })));
        } else {
          setAnnouncements(generatePlaceholder());
        }
      } catch {
        setAnnouncements(generatePlaceholder());
      } finally {
        setLoading(false);
      }
    }

    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [profile?.id]);


  const filtered = useMemo(() => {
    if (!search.trim()) return announcements;
    const q = search.toLowerCase();
    return announcements.filter((a) => a.title.toLowerCase().includes(q));
  }, [announcements, search]);

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto">

          <div className="flex items-center gap-2.5 px-3.5 h-12 rounded-2xl bg-white border border-slate-200">
            <Search className="w-4 h-4 text-slate-400" />
            <input type="search" placeholder="Cari pengumuman..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm outline-none text-slate-800 placeholder:text-slate-400" />
            {search && <button onClick={() => setSearch("")} className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center"><X className="w-3 h-3 text-slate-500" /></button>}
          </div>

          {loading ? (
            <div className="space-y-3">{[0,1,2].map((i) => <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((ann, i) => {
                const tc = TYPE_CFG[ann.type];
                const TypeIcon = tc.icon;
                return (
                  <motion.button
                    key={ann.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelected(ann)}
                    className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-px active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg", tc.bg)}>
                        {tc.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {ann.is_pinned && <Pin className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                          <p className="text-sm font-bold text-slate-900 line-clamp-1">{ann.title}</p>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{ann.content}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", tc.bg, tc.color)}>{tc.label}</span>
                          <span className="text-[11px] text-slate-400">{formatRelativeTime(ann.published_at)}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selected && <AnnouncementDetail ann={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </>
  );
}
