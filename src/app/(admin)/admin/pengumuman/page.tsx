"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone, Search, X, Plus, ChevronRight, Pin,
  AlertTriangle, Calendar, Info, ArrowLeft, Eye,
  Trash2, Edit2, Send, Save, Loader2, RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { formatRelativeTime, formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";

type AType = "general" | "urgent" | "event" | "reminder";

interface Ann {
  id: string;
  title: string;
  content: string;
  type: AType;
  author_name: string;
  is_pinned: boolean;
  published_at: string;
  target_roles: string[];
  view_count: number;
}

const TC: Record<AType, { label: string; color: string; bg: string; emoji: string }> = {
  urgent:   { label: "Penting",    color: "text-red-700",    bg: "bg-red-50",    emoji: "🔴" },
  general:  { label: "Umum",       color: "text-blue-700",   bg: "bg-blue-50",   emoji: "📢" },
  event:    { label: "Acara",      color: "text-purple-700", bg: "bg-purple-50", emoji: "📅" },
  reminder: { label: "Pengingat",  color: "text-amber-700",  bg: "bg-amber-50",  emoji: "⏰" },
};

const ROLE_OPTIONS = [
  { value: "all", label: "Semua Pengguna" },
  { value: "siswa", label: "Siswa" },
  { value: "guru_pembimbing", label: "Guru Pembimbing" },
  { value: "ketua_jurusan", label: "Ketua Jurusan" },
];

/* ── Create Form ──────────────────────────────────────── */

function CreateForm({
  onClose,
  onCreated,
  authorName,
}: {
  onClose: () => void;
  onCreated: (ann: Ann) => void;
  authorName: string;
}) {
  const supabase = createClient();
  const { profile } = useAuthStore();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<AType>("general");
  const [targetRole, setTargetRole] = useState("all");
  const [isPinned, setIsPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) { toast.error("Judul dan isi wajib diisi"); return; }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("announcements")
        .insert({
          title: title.trim(),
          content: content.trim(),
          type,
          is_pinned: isPinned,
          target_roles: [targetRole],
          published_at: new Date().toISOString(),
          created_by: profile?.id,
          view_count: 0,
        })
        .select("id, title, content, type, is_pinned, published_at, target_roles, view_count, profiles(full_name)")
        .single();

      if (error) throw error;

      const newAnn: Ann = {
        id: data.id,
        title: data.title,
        content: data.content,
        type: data.type,
        is_pinned: data.is_pinned ?? false,
        published_at: data.published_at,
        target_roles: data.target_roles ?? [],
        view_count: 0,
        author_name: (data.profiles as unknown as { full_name: string } | null)?.full_name ?? authorName,
      };
      onCreated(newAnn);
      toast.success("Pengumuman berhasil diterbitkan ✅");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Gagal menerbitkan pengumuman");
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
      className="fixed inset-0 z-[60] bg-slate-50 overflow-y-auto"
    >
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 h-[60px] bg-white/90 backdrop-blur-xl border-b border-slate-200/60">
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
          <ArrowLeft className="w-4.5 h-4.5 text-slate-700" strokeWidth={2.5} />
        </button>
        <h1 className="text-[16px] font-bold text-slate-900 flex-1">Buat Pengumuman</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 h-8 rounded-xl bg-blue-600 text-white text-xs font-bold disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Terbitkan
        </button>
      </header>

      <div className="px-4 py-5 max-w-2xl mx-auto space-y-4 pb-28">
        {/* Judul */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Judul *</p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Judul pengumuman..."
            className="w-full text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
          />
        </div>

        {/* Isi */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Isi Pengumuman *</p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Tulis isi pengumuman di sini..."
            rows={5}
            className="w-full text-sm text-slate-800 placeholder:text-slate-400 outline-none resize-none bg-transparent leading-relaxed"
          />
        </div>

        {/* Tipe */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Jenis</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(TC) as [AType, (typeof TC)[AType]][]).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setType(k)}
                className={cn(
                  "flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all",
                  type === k ? "border-blue-500 bg-blue-50" : "border-slate-200"
                )}
              >
                <span className="text-lg">{v.emoji}</span>
                <span className={cn("text-xs font-bold", type === k ? "text-blue-700" : "text-slate-600")}>{v.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Target */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Target Penerima</p>
          <div className="flex flex-wrap gap-2">
            {ROLE_OPTIONS.map((r) => (
              <button
                key={r.value}
                onClick={() => setTargetRole(r.value)}
                className={cn(
                  "px-3 h-8 rounded-full text-xs font-bold transition-all",
                  targetRole === r.value ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sematkan */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Sematkan Pengumuman</p>
              <p className="text-xs text-slate-400 mt-0.5">Pengumuman disematkan akan tampil paling atas</p>
            </div>
            <button
              onClick={() => setIsPinned(!isPinned)}
              className={cn("w-12 h-6 rounded-full transition-colors flex items-center px-1", isPinned ? "bg-blue-600" : "bg-slate-200")}
            >
              <div className={cn("w-4 h-4 rounded-full bg-white shadow transition-transform", isPinned ? "translate-x-6" : "translate-x-0")} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Detail ───────────────────────────────────────────── */

function Detail({ ann, onClose, onDelete }: { ann: Ann; onClose: () => void; onDelete: (id: string) => Promise<void> }) {
  const tc = TC[ann.type];
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Hapus pengumuman ini?")) return;
    setDeleting(true);
    await onDelete(ann.id);
    setDeleting(false);
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
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
          <ArrowLeft className="w-4.5 h-4.5 text-slate-700" strokeWidth={2.5} />
        </button>
        <h1 className="text-[16px] font-bold text-slate-900 flex-1">Pengumuman</h1>
        <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold", tc.bg, tc.color)}>{tc.emoji} {tc.label}</span>
      </header>
      <div className="px-4 py-5 max-w-2xl mx-auto pb-8 space-y-3">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          {ann.is_pinned && <div className="flex items-center gap-1.5 mb-3"><Pin className="w-3.5 h-3.5 text-amber-500" /><span className="text-xs font-bold text-amber-600">Disematkan</span></div>}
          <h2 className="text-base font-bold text-slate-900 mb-3">{ann.title}</h2>
          <p className="text-[11px] text-slate-500 mb-4">{ann.author_name} · {formatDate(ann.published_at, "dd MMMM yyyy")}</p>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1"><Eye className="w-3 h-3 text-slate-400" /><span className="text-xs text-slate-400">{ann.view_count} dilihat</span></div>
            <div className="flex flex-wrap gap-1">{ann.target_roles.map((r) => <span key={r} className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{r === "all" ? "Semua" : r}</span>)}</div>
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="w-full h-10 rounded-xl border border-red-200 text-xs font-semibold text-red-500 flex items-center justify-center gap-1.5 hover:bg-red-50 disabled:opacity-60"
        >
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          Hapus Pengumuman
        </button>
      </div>
    </motion.div>
  );
}

/* ── Main Page ──────────────────────────────────────────── */

export default function AdminPengumumanPage() {
  const { profile } = useAuthStore();
  const supabase = createClient();
  const [items, setItems] = useState<Ann[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Ann | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("id, title, content, type, is_pinned, published_at, target_roles, view_count, profiles(full_name)")
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      setItems((data ?? []).map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        type: a.type as AType,
        is_pinned: a.is_pinned ?? false,
        published_at: a.published_at,
        target_roles: a.target_roles ?? [],
        view_count: a.view_count ?? 0,
        author_name: (a.profiles as unknown as { full_name: string } | null)?.full_name ?? "Admin",
      })));
    } catch (err) {
      console.error("loadAnnouncements error:", err);
      toast.error("Gagal memuat pengumuman");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) { toast.error("Gagal menghapus pengumuman"); throw error; }
    setItems((prev) => prev.filter((a) => a.id !== id));
    toast.success("Pengumuman dihapus");
  };

  const filtered = useMemo(() =>
    !search.trim() ? items : items.filter((a) => a.title.toLowerCase().includes(search.toLowerCase())),
    [items, search]
  );

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-extrabold text-slate-900">Pengumuman</h1>
              <p className="text-xs text-slate-400 mt-px">{items.length} pengumuman</p>
            </div>
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.88 }} onClick={() => loadData(true)} disabled={refreshing} className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500">
                <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
              </motion.button>
              <button
                onClick={() => setShowCreate(true)}
                className="h-9 px-3 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Buat
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3.5 h-12 rounded-2xl bg-white border border-slate-200">
            <Search className="w-4 h-4 text-slate-400" />
            <input type="search" placeholder="Cari pengumuman..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm outline-none text-slate-800 placeholder:text-slate-400" />
            {search && <button onClick={() => setSearch("")} className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center"><X className="w-3 h-3 text-slate-500" /></button>}
          </div>

          {loading ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500">Belum ada pengumuman</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((ann, i) => {
                const tc = TC[ann.type];
                return (
                  <motion.button key={ann.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    onClick={() => setSelected(ann)} className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-px active:scale-[0.98] transition-all">
                    <div className="flex items-start gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg", tc.bg)}>{tc.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {ann.is_pinned && <Pin className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                          <p className="text-sm font-bold text-slate-900 line-clamp-1">{ann.title}</p>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{ann.content}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", tc.bg, tc.color)}>{tc.label}</span>
                          <span className="text-[11px] text-slate-400">{formatRelativeTime(ann.published_at)}</span>
                          <span className="text-[11px] text-slate-400 ml-auto flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" />{ann.view_count}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
          <div className="h-4" />
        </div>
      </div>

      <AnimatePresence>
        {selected && <Detail ann={selected} onClose={() => setSelected(null)} onDelete={handleDelete} />}
        {showCreate && (
          <CreateForm
            onClose={() => setShowCreate(false)}
            onCreated={(ann) => setItems((prev) => [ann, ...prev])}
            authorName={profile?.full_name ?? "Admin"}
          />
        )}
      </AnimatePresence>
    </>
  );
}
