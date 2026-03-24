"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  FolderOpen, Download, FileText, FileSpreadsheet, Image,
  Eye, Plus, Upload, Trash2, RefreshCw, Loader2, X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface Doc {
  id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_by_name: string;
  uploaded_at: string;
  category: string;
  public_url: string;
}

const FC: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  pdf:   { icon: FileText,        color: "text-red-600",    bg: "bg-red-50" },
  xlsx:  { icon: FileSpreadsheet, color: "text-emerald-600",bg: "bg-emerald-50" },
  xls:   { icon: FileSpreadsheet, color: "text-emerald-600",bg: "bg-emerald-50" },
  docx:  { icon: FileText,        color: "text-blue-700",   bg: "bg-blue-50" },
  doc:   { icon: FileText,        color: "text-blue-700",   bg: "bg-blue-50" },
  png:   { icon: Image,           color: "text-purple-600", bg: "bg-purple-50" },
  jpg:   { icon: Image,           color: "text-purple-600", bg: "bg-purple-50" },
  jpeg:  { icon: Image,           color: "text-purple-600", bg: "bg-purple-50" },
};

const CC: Record<string, { label: string; color: string; bg: string }> = {
  template: { label: "Template", color: "text-purple-700", bg: "bg-purple-50" },
  laporan:  { label: "Laporan",  color: "text-blue-700",   bg: "bg-blue-50" },
  panduan:  { label: "Panduan",  color: "text-emerald-700",bg: "bg-emerald-50" },
  system:   { label: "Sistem",   color: "text-slate-700",  bg: "bg-slate-100" },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface DocPageProps {
  role: "admin" | "kajur" | "siswa";
  accentColor?: string;
  canUpload?: boolean;
  canDelete?: boolean;
}

export default function DokumenPage({ role, accentColor = "blue", canUpload = false, canDelete = false }: DocPageProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState("panduan");

  const BUCKET = "pkl-documents";

  const loadDocs = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const { data, error } = await supabase
        .from("documents")
        .select("id, name, file_path, file_type, file_size, uploaded_at, category, profiles(full_name)")
        .order("uploaded_at", { ascending: false });

      if (error) throw error;

      const items: Doc[] = (data ?? []).map((d) => {
        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(d.file_path);
        return {
          id: d.id,
          name: d.name,
          file_path: d.file_path,
          file_type: d.file_type ?? "pdf",
          file_size: d.file_size ?? 0,
          uploaded_by_name: (d.profiles as unknown as { full_name: string } | null)?.full_name ?? "Sistem",
          uploaded_at: d.uploaded_at,
          category: d.category ?? "panduan",
          public_url: urlData.publicUrl,
        };
      });

      setDocs(items);
    } catch {
      // Jika tabel belum ada, tampilkan empty
      setDocs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
      const path = `${selectedCategory}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
      if (uploadError) throw uploadError;

      const { data: { session } } = await supabase.auth.getSession();
      const { error: dbError } = await supabase.from("documents").insert({
        name: file.name,
        file_path: path,
        file_type: ext,
        file_size: file.size,
        category: selectedCategory,
        uploaded_by: session?.user?.id,
      });
      if (dbError) throw dbError;

      toast.success("Dokumen berhasil diupload ✅");
      await loadDocs(true);
    } catch (err) {
      console.error("upload error:", err);
      toast.error("Gagal upload dokumen");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (doc: Doc) => {
    if (!confirm(`Hapus "${doc.name}"?`)) return;
    try {
      await supabase.storage.from(BUCKET).remove([doc.file_path]);
      await supabase.from("documents").delete().eq("id", doc.id);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
      toast.success("Dokumen dihapus");
    } catch {
      toast.error("Gagal menghapus dokumen");
    }
  };

  const filtered = filter === "all" ? docs : docs.filter((d) => d.category === filter);
  const categories = [...new Set(docs.map((d) => d.category))];
  const accent = accentColor;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">Dokumen PKL</h1>
            <p className="text-xs text-slate-400 mt-px">{docs.length} dokumen tersedia</p>
          </div>
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.88 }} onClick={() => loadDocs(true)} disabled={refreshing}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500">
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            </motion.button>

            {canUpload && (
              <>
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg" className="hidden" onChange={handleUpload} />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="h-9 px-3 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-60">
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  Upload
                </button>
              </>
            )}
          </div>
        </div>

        {/* Upload category selector */}
        {canUpload && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Kategori Upload</p>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(CC).map(([key, cfg]) => (
                <button key={key} onClick={() => setSelectedCategory(key)}
                  className={cn("px-3 h-7 rounded-full text-xs font-bold transition-all",
                    selectedCategory === key ? "bg-blue-600 text-white" : cn(cfg.bg, cfg.color))}>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
          <button onClick={() => setFilter("all")}
            className={cn("flex-shrink-0 px-4 h-8 rounded-full text-xs font-bold transition-all",
              filter === "all" ? "bg-slate-800 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600")}>
            Semua ({docs.length})
          </button>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={cn("flex-shrink-0 px-4 h-8 rounded-full text-xs font-bold transition-all",
                filter === cat ? "bg-slate-800 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600")}>
              {CC[cat]?.label ?? cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">Belum ada dokumen</p>
            {canUpload && (
              <button onClick={() => fileInputRef.current?.click()}
                className="mt-3 px-4 h-9 rounded-xl bg-blue-600 text-white text-xs font-bold">
                Upload Dokumen Pertama
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((doc, i) => {
              const ext = doc.file_type?.toLowerCase() ?? "pdf";
              const fc = FC[ext] ?? { icon: FileText, color: "text-slate-600", bg: "bg-slate-100" };
              const cc = CC[doc.category] ?? { label: doc.category, color: "text-slate-600", bg: "bg-slate-100" };
              const Icon = fc.icon;
              return (
                <motion.div key={doc.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", fc.bg)}>
                      <Icon className={cn("w-5.5 h-5.5", fc.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", cc.bg, cc.color)}>{cc.label}</span>
                        <span className="text-[11px] text-slate-400">{formatBytes(doc.file_size)}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{doc.uploaded_by_name} · {formatDate(doc.uploaded_at, "dd MMM yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                    <a href={doc.public_url} target="_blank" rel="noopener noreferrer"
                      className="flex-1 h-8 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 hover:bg-slate-50">
                      <Eye className="w-3 h-3" />Lihat
                    </a>
                    <a href={doc.public_url} download={doc.name}
                      className="flex-1 h-8 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 hover:bg-slate-100">
                      <Download className="w-3 h-3" />Unduh
                    </a>
                    {canDelete && (
                      <button onClick={() => handleDelete(doc)}
                        className="w-8 h-8 rounded-xl border border-red-200 text-red-500 flex items-center justify-center hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
        <div className="h-4" />
      </div>
    </div>
  );
}
