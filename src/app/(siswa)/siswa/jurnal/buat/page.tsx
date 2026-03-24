"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Camera,
  X,
  Image,
  Bold,
  Italic,
  List,
  ListOrdered,
  Save,
  Send,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Calendar,
  Clock,
  ChevronDown,
  Type,
  Minus,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { useStudentContext } from "@/lib/hooks/use-student-context";
import { formatDate, compressImage, cn } from "@/lib/utils";


/* ─────────────────────────────────────────────────────────
   Schema validasi
───────────────────────────────────────────────────────── */

const journalSchema = z.object({
  date: z.string().min(1, "Tanggal wajib diisi"),
  title: z
    .string()
    .min(5, "Judul minimal 5 karakter")
    .max(150, "Judul maksimal 150 karakter"),
  content: z
    .string()
    .min(20, "Deskripsi kegiatan minimal 20 karakter")
    .max(5000, "Deskripsi maksimal 5000 karakter"),
});

type JournalFormData = z.infer<typeof journalSchema>;

/* ─────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────── */

interface PhotoItem {
  id: string;
  file: File;
  previewUrl: string;
  uploading: boolean;
  uploadedUrl: string | null;
  error: string | null;
}

type SaveAction = "draft" | "submit";

/* ─────────────────────────────────────────────────────────
   Toolbar button
───────────────────────────────────────────────────────── */

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  title: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

function ToolbarButton({
  onClick,
  active = false,
  title,
  icon,
  disabled = false,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center",
        "text-sm transition-all duration-150",
        "tap-highlight-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        "disabled:opacity-40 disabled:pointer-events-none",
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      {icon}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   Rich Text Editor (contentEditable)
───────────────────────────────────────────────────────── */

interface RichEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  error?: string;
  maxLength?: number;
}

function RichEditor({
  value,
  onChange,
  placeholder = "Tulis deskripsi kegiatan PKL hari ini...",
  error,
  maxLength = 5000,
}: RichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    orderedList: false,
    unorderedList: false,
  });

  // Init content once
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML && value) {
      editorRef.current.innerHTML = value;
      setCharCount(editorRef.current.innerText.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateActiveFormats = useCallback(() => {
    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      orderedList: document.queryCommandState("insertOrderedList"),
      unorderedList: document.queryCommandState("insertUnorderedList"),
    });
  }, []);

  const execCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    const text = editorRef.current?.innerText ?? "";
    setCharCount(text.length);
    onChange(editorRef.current?.innerHTML ?? "");
    updateActiveFormats();
  };

  const handleInput = () => {
    const text = editorRef.current?.innerText ?? "";
    const html = editorRef.current?.innerHTML ?? "";
    setCharCount(text.length);
    onChange(html);
    updateActiveFormats();
  };

  const handleKeyUp = () => updateActiveFormats();
  const handleMouseUp = () => updateActiveFormats();

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  const isEmpty = charCount === 0;

  return (
    <div className="form-group">
      <div className="flex items-center justify-between mb-1.5">
        <label className="form-label">
          Deskripsi Kegiatan
          <span className="text-red-500 ml-1" aria-hidden="true">*</span>
        </label>
        <span
          className={cn(
            "text-xs tabular-nums font-medium transition-colors",
            charCount >= maxLength
              ? "text-red-500"
              : charCount >= maxLength * 0.85
              ? "text-amber-500"
              : "text-slate-400"
          )}
        >
          {charCount}/{maxLength}
        </span>
      </div>

      <div
        className={cn(
          "rounded-2xl border overflow-hidden bg-white",
          "transition-all duration-200",
          isFocused
            ? "border-blue-400 shadow-sm ring-2 ring-blue-100"
            : error
            ? "border-red-400 ring-2 ring-red-100"
            : "border-slate-200"
        )}
      >
        {/* Toolbar */}
        <div className="flex items-center gap-0.5 px-2 py-2 border-b border-slate-100 bg-slate-50/80 flex-wrap">
          <ToolbarButton
            onClick={() => execCommand("bold")}
            active={activeFormats.bold}
            title="Tebal (Ctrl+B)"
            icon={<Bold className="w-3.5 h-3.5" />}
          />
          <ToolbarButton
            onClick={() => execCommand("italic")}
            active={activeFormats.italic}
            title="Miring (Ctrl+I)"
            icon={<Italic className="w-3.5 h-3.5" />}
          />

          <div className="w-px h-5 bg-slate-200 mx-1" aria-hidden="true" />

          <ToolbarButton
            onClick={() => execCommand("insertUnorderedList")}
            active={activeFormats.unorderedList}
            title="Daftar poin"
            icon={<List className="w-3.5 h-3.5" />}
          />
          <ToolbarButton
            onClick={() => execCommand("insertOrderedList")}
            active={activeFormats.orderedList}
            title="Daftar bernomor"
            icon={<ListOrdered className="w-3.5 h-3.5" />}
          />

          <div className="w-px h-5 bg-slate-200 mx-1" aria-hidden="true" />

          <ToolbarButton
            onClick={() => execCommand("formatBlock", "h3")}
            title="Judul subjudul"
            icon={<Type className="w-3.5 h-3.5" />}
          />
          <ToolbarButton
            onClick={() => execCommand("insertHorizontalRule")}
            title="Garis pemisah"
            icon={<Minus className="w-3.5 h-3.5" />}
          />
          <ToolbarButton
            onClick={() => {
              if (editorRef.current) {
                editorRef.current.innerHTML = "";
                setCharCount(0);
                onChange("");
              }
            }}
            title="Hapus semua"
            icon={<X className="w-3.5 h-3.5" />}
          />
        </div>

        {/* Editable area */}
        <div className="relative">
          {/* Placeholder */}
          {isEmpty && !isFocused && (
            <div
              className="absolute top-3 left-4 right-4 text-slate-400 text-sm leading-relaxed pointer-events-none select-none z-0"
              aria-hidden="true"
            >
              {placeholder}
            </div>
          )}

          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyUp={handleKeyUp}
            onMouseUp={handleMouseUp}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onPaste={handlePaste}
            role="textbox"
            aria-multiline="true"
            aria-label="Deskripsi kegiatan"
            aria-invalid={!!error}
            className={cn(
              "relative z-10 min-h-[200px] max-h-[400px] overflow-y-auto",
              "p-4 text-sm text-slate-800 leading-relaxed",
              "outline-none",
              // Rich text styles
              "[&_h3]:text-base [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:mb-2 [&_h3]:mt-3",
              "[&_b]:font-bold [&_strong]:font-bold",
              "[&_i]:italic [&_em]:italic",
              "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-0.5 [&_ul]:my-1.5",
              "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-0.5 [&_ol]:my-1.5",
              "[&_li]:text-slate-700",
              "[&_hr]:border-slate-200 [&_hr]:my-3"
            )}
            spellCheck={false}
          />
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          <AlertCircle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      {/* Writing tips */}
      {isFocused && charCount < 50 && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="text-xs text-blue-500 mt-1 leading-snug"
        >
          💡 Tips: Ceritakan apa yang kamu kerjakan, apa yang kamu pelajari, dan
          tantangan yang dihadapi hari ini.
        </motion.p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Photo uploader
───────────────────────────────────────────────────────── */

interface PhotoUploaderProps {
  photos: PhotoItem[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  maxPhotos?: number;
}

function PhotoUploader({
  photos,
  onAdd,
  onRemove,
  maxPhotos = 5,
}: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const remainingSlots = maxPhotos - photos.length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const allowed = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      toast.warning(`Hanya ${remainingSlots} foto lagi yang bisa ditambahkan.`);
    }

    const validFiles = allowed.filter((f) => {
      if (!f.type.startsWith("image/")) {
        toast.error(`${f.name} bukan file gambar.`);
        return false;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name} terlalu besar. Maksimal 10MB.`);
        return false;
      }
      return true;
    });

    onAdd(validFiles);
    // Reset input agar file yang sama bisa diupload ulang
    e.target.value = "";
  };

  return (
    <div className="form-group">
      <div className="flex items-center justify-between mb-1.5">
        <label className="form-label">
          Foto Kegiatan
          <span className="text-slate-400 font-normal ml-1">(opsional)</span>
        </label>
        <span className="text-xs text-slate-400">
          {photos.length}/{maxPhotos} foto
        </span>
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-3 gap-2">
        {/* Existing photos */}
        {photos.map((photo) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100"
          >
            {/* Preview image */}
            <img
              src={photo.previewUrl}
              alt="Foto kegiatan"
              className="w-full h-full object-cover"
            />

            {/* Uploading overlay */}
            {photo.uploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="flex flex-col items-center gap-1">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                  <span className="text-[10px] text-white font-semibold">
                    Mengupload...
                  </span>
                </div>
              </div>
            )}

            {/* Error overlay */}
            {photo.error && (
              <div className="absolute inset-0 bg-red-900/50 flex items-center justify-center p-2">
                <p className="text-[10px] text-white text-center font-semibold leading-tight">
                  {photo.error}
                </p>
              </div>
            )}

            {/* Upload success badge */}
            {photo.uploadedUrl && !photo.uploading && (
              <div className="absolute bottom-1.5 left-1.5">
                <span className="flex items-center gap-0.5 px-1.5 py-px bg-emerald-500/90 rounded-full">
                  <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                  <span className="text-[9px] text-white font-bold">OK</span>
                </span>
              </div>
            )}

            {/* Remove button */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              type="button"
              onClick={() => onRemove(photo.id)}
              className={cn(
                "absolute top-1.5 right-1.5",
                "w-6 h-6 rounded-full",
                "bg-black/50 backdrop-blur-sm",
                "flex items-center justify-center",
                "text-white hover:bg-red-500",
                "transition-colors duration-150",
                "tap-highlight-none"
              )}
              aria-label="Hapus foto"
            >
              <X className="w-3 h-3" strokeWidth={2.5} />
            </motion.button>
          </motion.div>
        ))}

        {/* Add photo button */}
        {remainingSlots > 0 && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "aspect-square rounded-2xl",
              "border-2 border-dashed border-slate-300",
              "bg-slate-50 hover:bg-slate-100 hover:border-blue-400",
              "flex flex-col items-center justify-center gap-1.5",
              "text-slate-400 hover:text-blue-500",
              "transition-all duration-200",
              "tap-highlight-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            )}
            aria-label="Tambah foto"
          >
            <Image className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-[10px] font-semibold text-center leading-tight px-1">
              Tambah Foto
            </span>
          </motion.button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      <p className="form-hint mt-1">
        Format: JPG, PNG, WEBP • Maks. 10MB per foto • {maxPhotos} foto
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Date picker helper
───────────────────────────────────────────────────────── */

function DateSelector({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const today = new Date().toISOString().split("T")[0];
  const minDate = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

  // Quick date options
  const quickDates = [
    { label: "Hari Ini", value: today },
    {
      label: "Kemarin",
      value: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    },
    {
      label: "2 Hari Lalu",
      value: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
    },
  ];

  return (
    <div className="form-group">
      <label className="form-label">
        Tanggal Kegiatan
        <span className="text-red-500 ml-1" aria-hidden="true">*</span>
      </label>

      {/* Quick pick pills */}
      <div className="flex gap-2 mb-2 flex-wrap">
        {quickDates.map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => onChange(d.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold",
              "border transition-all duration-150 tap-highlight-none",
              value === d.value
                ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            )}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Date input */}
      <div className="relative flex items-center">
        <Calendar
          className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          max={today}
          min={minDate}
          className={cn(
            "input-base pl-10",
            error && "input-error",
            "cursor-pointer"
          )}
          aria-invalid={!!error}
          aria-describedby={error ? "date-error" : undefined}
        />
      </div>

      {error && (
        <p id="date-error" className="form-error" role="alert">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {error}
        </p>
      )}

      {value && (
        <p className="form-hint mt-1">
          {formatDate(value, "EEEE, dd MMMM yyyy")}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Template selector
───────────────────────────────────────────────────────── */

const TEMPLATES = [
  {
    id: "kegiatan_umum",
    label: "Kegiatan Umum",
    emoji: "📋",
    title: "Kegiatan Harian PKL",
    content:
      "Pada hari ini saya melakukan beberapa kegiatan di tempat PKL, antara lain:\n\n<ul><li>Kegiatan pertama yang dilakukan</li><li>Kegiatan kedua yang dilakukan</li><li>Kegiatan ketiga yang dilakukan</li></ul>\n\n<b>Hasil yang dicapai:</b>\nPada hari ini saya berhasil menyelesaikan pekerjaan tersebut dengan bimbingan dari pembimbing lapangan.\n\n<b>Kesulitan yang dihadapi:</b>\n(Tuliskan kesulitan atau tantangan yang dihadapi)\n\n<b>Pelajaran yang didapat:</b>\n(Tuliskan apa yang kamu pelajari hari ini)",
  },
  {
    id: "teknis",
    label: "Pekerjaan Teknis",
    emoji: "🔧",
    title: "Pekerjaan Teknis",
    content:
      "<b>Tugas yang dikerjakan:</b>\nPada hari ini saya mengerjakan tugas teknis berupa instalasi/konfigurasi/perbaikan ...\n\n<b>Langkah-langkah yang dilakukan:</b>\n<ol><li>Langkah pertama</li><li>Langkah kedua</li><li>Langkah ketiga</li></ol>\n\n<b>Tools/Perangkat yang digunakan:</b>\n(Sebutkan alat, software, atau perangkat yang digunakan)\n\n<b>Hasil:</b>\nPekerjaan berhasil diselesaikan dengan hasil ...",
  },
  {
    id: "bimbingan",
    label: "Sesi Bimbingan",
    emoji: "👨‍🏫",
    title: "Sesi Bimbingan dengan Pembimbing",
    content:
      "Pada hari ini saya mendapat bimbingan dari <b>Bapak/Ibu [nama pembimbing]</b> mengenai ...\n\n<b>Materi yang dibahas:</b>\n<ul><li>Topik pertama yang dibahas</li><li>Topik kedua yang dibahas</li></ul>\n\n<b>Arahan dan masukan dari pembimbing:</b>\n(Tuliskan arahan yang diberikan pembimbing lapangan)\n\n<b>Rencana tindak lanjut:</b>\n(Tuliskan apa yang akan dilakukan setelah bimbingan ini)",
  },
  {
    id: "laporan_proyek",
    label: "Progress Proyek",
    emoji: "📊",
    title: "Update Progress Proyek",
    content:
      "<b>Nama Proyek:</b> [Nama proyek]\n\n<b>Progress yang telah dicapai hari ini:</b>\n<ul><li>Progress poin 1</li><li>Progress poin 2</li></ul>\n\n<b>Persentase penyelesaian:</b> ... %\n\n<b>Kendala yang dihadapi:</b>\n(Tuliskan kendala jika ada)\n\n<b>Target hari berikutnya:</b>\n(Tuliskan target yang ingin dicapai besok)",
  },
];

function TemplateSelector({
  onSelect,
}: {
  onSelect: (title: string, content: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-2",
          "px-4 py-3 rounded-2xl",
          "border border-dashed border-blue-300 bg-blue-50/50",
          "text-sm font-semibold text-blue-700",
          "hover:bg-blue-50 hover:border-blue-400",
          "transition-all duration-150 tap-highlight-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        )}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          Gunakan Template Jurnal
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-2 space-y-1.5">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    onSelect(tpl.title, tpl.content);
                    setIsOpen(false);
                    toast.success("Template berhasil diterapkan");
                  }}
                  className={cn(
                    "w-full flex items-center gap-3",
                    "px-4 py-3 rounded-2xl",
                    "bg-white border border-slate-100 shadow-sm",
                    "hover:shadow-md hover:border-blue-200 hover:-translate-y-px",
                    "active:scale-[0.98] transition-all duration-200",
                    "text-left tap-highlight-none"
                  )}
                >
                  <span className="text-xl flex-shrink-0" aria-hidden="true">
                    {tpl.emoji}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 leading-tight">
                      {tpl.label}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {tpl.title}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Auto-save indicator
───────────────────────────────────────────────────────── */

function AutoSaveIndicator({
  status,
}: {
  status: "idle" | "saving" | "saved" | "error";
}) {
  return (
    <AnimatePresence mode="wait">
      {status !== "idle" && (
        <motion.div
          key={status}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 8 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium",
            status === "saving" && "text-blue-500",
            status === "saved" && "text-emerald-600",
            status === "error" && "text-red-500"
          )}
        >
          {status === "saving" && (
            <>
              <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
              Menyimpan...
            </>
          )}
          {status === "saved" && (
            <>
              <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
              Tersimpan otomatis
            </>
          )}
          {status === "error" && (
            <>
              <AlertCircle className="w-3 h-3" aria-hidden="true" />
              Gagal menyimpan
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────────────
   Confirm submit dialog
───────────────────────────────────────────────────────── */

function ConfirmSubmitModal({
  open,
  onConfirm,
  onCancel,
  submitting,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
            className="fixed z-50 inset-x-4 bottom-20 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-sm"
          >
            <div className="bg-white rounded-3xl p-6 shadow-2xl">
              {/* Icon */}
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Send className="w-7 h-7 text-blue-600" />
              </div>

              {/* Text */}
              <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
                Kirim Jurnal?
              </h3>
              <p className="text-sm text-slate-500 text-center leading-relaxed mb-6">
                Setelah dikirim, jurnal akan diperiksa oleh guru pembimbing. Pastikan isinya sudah lengkap dan benar.
              </p>

              {/* Checklist */}
              <div className="space-y-2 mb-6 p-3 bg-blue-50 rounded-2xl">
                {[
                  "Tanggal dan judul sudah benar",
                  "Deskripsi kegiatan lengkap",
                  "Tidak ada kesalahan penulisan",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-xs text-blue-800 font-medium">{item}</span>
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={submitting}
                  className="h-11 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 active:scale-[0.97] transition-all disabled:opacity-50 tap-highlight-none"
                >
                  Periksa Lagi
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={submitting}
                  className={cn(
                    "h-11 rounded-xl text-white text-sm font-bold",
                    "flex items-center justify-center gap-2",
                    "bg-blue-600 hover:bg-blue-700",
                    "active:scale-[0.97] transition-all",
                    "shadow-md shadow-blue-200",
                    "disabled:opacity-60 disabled:pointer-events-none",
                    "tap-highlight-none"
                  )}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Kirim Jurnal
                    </>
                  )}
                </button>
              </div>
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

export default function BuatJurnalPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const supabase = createClient();
  const { context: studentCtx } = useStudentContext();


  // Form state
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<JournalFormData>({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      title: "",
      content: "",
    },
    mode: "onTouched",
  });

  // Photos state
  const [photos, setPhotos] = useState<PhotoItem[]>([]);

  // UI state
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [pendingAction, setPendingAction] = useState<SaveAction | null>(null);

  const watchedTitle = watch("title");
  const watchedContent = watch("content");
  const watchedDate = watch("date");

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!isDirty) return;

    const timer = setTimeout(async () => {
      if (!watchedTitle || !watchedContent) return;
      setAutoSaveStatus("saving");
      try {
        // Save to localStorage as draft backup
        localStorage.setItem(
          "pkl_journal_draft",
          JSON.stringify({
            date: watchedDate,
            title: watchedTitle,
            content: watchedContent,
            savedAt: new Date().toISOString(),
          })
        );
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus("idle"), 3000);
      } catch {
        setAutoSaveStatus("error");
        setTimeout(() => setAutoSaveStatus("idle"), 3000);
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, [watchedTitle, watchedContent, watchedDate, isDirty]);

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pkl_journal_draft");
      if (saved) {
        const draft = JSON.parse(saved);
        const savedDate = new Date(draft.savedAt);
        const hoursDiff =
          (Date.now() - savedDate.getTime()) / (1000 * 60 * 60);
        if (hoursDiff < 24) {
          setValue("title", draft.title ?? "", { shouldDirty: false });
          setValue("content", draft.content ?? "", { shouldDirty: false });
          setValue("date", draft.date ?? new Date().toISOString().split("T")[0], {
            shouldDirty: false,
          });
          toast.info("Draft sebelumnya dipulihkan", {
            description: "Ditemukan draft yang belum terkirim.",
            action: {
              label: "Hapus",
              onClick: () => localStorage.removeItem("pkl_journal_draft"),
            },
          });
        }
      }
    } catch {
      // ignore
    }
  }, [setValue]);

  /* ── Photo handlers ───────────────────────────────── */

  const handleAddPhotos = useCallback((files: File[]) => {
    const newPhotos: PhotoItem[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      uploading: false,
      uploadedUrl: null,
      error: null,
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
  }, []);

  const handleRemovePhoto = useCallback((id: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo?.previewUrl) URL.revokeObjectURL(photo.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Upload photos to Supabase Storage ───────────── */

  const uploadPhotos = async (journalId: string): Promise<string[]> => {
    if (!photos.length || !studentCtx) return [];

    const uploadedUrls: string[] = [];

    for (const photo of photos) {
      if (photo.uploadedUrl) {
        uploadedUrls.push(photo.uploadedUrl);
        continue;
      }

      setPhotos((prev) =>
        prev.map((p) => (p.id === photo.id ? { ...p, uploading: true, error: null } : p))
      );

      try {
        const compressed = await compressImage(photo.file, 1280, 0.82);
        const ext = photo.file.name.split(".").pop() ?? "jpg";
        const path = `journals/${studentCtx.studentId}/${journalId}/${photo.id}.${ext}`;

        const { error } = await supabase.storage
          .from("journals")  // bucket name: journals (bukan journal-photos)
          .upload(path, compressed, {
            upsert: true,
            contentType: "image/jpeg",
          });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from("journals")
          .getPublicUrl(path);

        uploadedUrls.push(urlData.publicUrl);

        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photo.id
              ? { ...p, uploading: false, uploadedUrl: urlData.publicUrl }
              : p
          )
        );
      } catch {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photo.id
              ? { ...p, uploading: false, error: "Gagal upload" }
              : p
          )
        );
      }
    }

    return uploadedUrls;
  };


  /* ── Save handler ─────────────────────────────────── */

  const saveJournal = async (data: JournalFormData, action: SaveAction) => {
    setSubmitting(true);
    try {
      if (!profile?.id) throw new Error("Pengguna tidak ditemukan.");
      if (!studentCtx) throw new Error("Data PKL belum siap. Coba refresh halaman.");

      // Cek duplikat tanggal (hanya saat submit)
      if (action === "submit") {
        const { data: existing } = await supabase
          .from("journals")
          .select("id, status")
          .eq("student_id", studentCtx.studentId)
          .eq("date", data.date)
          .maybeSingle();

        if (existing && existing.status !== "draft") {
          toast.error("Jurnal untuk tanggal ini sudah ada dan sudah dikirim.");
          setSubmitting(false);
          return;
        }
      }

      // Insert jurnal dengan student_id dan pkl_assignment_id yang benar
      const { data: journal, error: insertError } = await supabase
        .from("journals")
        .insert({
          student_id: studentCtx.studentId,         // UUID dari tabel students
          pkl_assignment_id: studentCtx.pklAssignmentId,
          date: data.date,
          title: data.title.trim(),
          content: data.content,
          status: action === "submit" ? "submitted" : "draft",
          submitted_at: action === "submit" ? new Date().toISOString() : null,
          photos: [],
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      // Upload foto jika ada
      let uploadedPhotoUrls: string[] = [];
      if (photos.length > 0 && journal?.id) {
        uploadedPhotoUrls = await uploadPhotos(journal.id);

        if (uploadedPhotoUrls.length > 0) {
          await supabase
            .from("journals")
            .update({ photos: uploadedPhotoUrls })
            .eq("id", journal.id);
        }
      }

      // Notifikasi jika di-submit
      if (action === "submit") {
        await supabase.from("notifications").insert({
          user_id: profile.id,
          title: "Jurnal Terkirim",
          body: `Jurnal "${data.title}" berhasil dikirim dan menunggu review guru pembimbing.`,
          type: "journal",
          data: JSON.stringify({ journal_id: journal?.id, assignment_id: studentCtx.pklAssignmentId }),
          is_read: false,
        });
      }

      // Hapus draft lokal
      localStorage.removeItem("pkl_journal_draft");

      if (action === "submit") {
        toast.success("Jurnal berhasil dikirim! 🎉", {
          description: "Guru pembimbing akan segera memeriksa jurnal Anda.",
          duration: 5000,
        });
      } else {
        toast.success("Draft tersimpan", {
          description: "Jurnal disimpan sebagai draft. Anda dapat melanjutkan nanti.",
        });
      }

      setTimeout(() => {
        router.push("/siswa/jurnal");
      }, 1000);
    } catch (err) {
      console.error("Save journal error:", err);
      toast.error("Gagal menyimpan jurnal. Coba lagi.", {
        description:
          err instanceof Error ? err.message : "Terjadi kesalahan tak terduga.",
      });
    } finally {
      setSubmitting(false);
      setShowConfirmSubmit(false);
      setPendingAction(null);
    }
  };


  const onFormSubmit = (data: JournalFormData) => {
    if (pendingAction === "submit") {
      setShowConfirmSubmit(true);
    } else {
      saveJournal(data, "draft");
    }
  };

  const handleActionClick = (action: SaveAction) => {
    setPendingAction(action);
    handleSubmit(onFormSubmit)();
  };

  const handleConfirmSubmit = () => {
    const data: JournalFormData = {
      date: watchedDate,
      title: watchedTitle,
      content: watchedContent,
    };
    saveJournal(data, "submit");
  };

  /* ── Template handler ───────────────────────────── */

  const handleTemplateSelect = (title: string, content: string) => {
    setValue("title", title, { shouldValidate: true });
    setValue("content", content, { shouldValidate: true });
  };

  /* ── Render ─────────────────────────────────────── */

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 px-4 h-[60px] bg-white/90 backdrop-blur-xl border-b border-slate-200/60">
        <button
          type="button"
          onClick={() => {
            if (isDirty) {
              const confirmed = window.confirm(
                "Perubahan belum tersimpan. Keluar halaman?"
              );
              if (!confirmed) return;
            }
            router.back();
          }}
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors tap-highlight-none"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-4.5 h-4.5" strokeWidth={2.5} />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="text-[17px] font-bold text-slate-900 truncate">
            Buat Jurnal Harian
          </h1>
          <p className="text-xs text-slate-400 truncate">
            {watchedDate ? formatDate(watchedDate, "EEEE, dd MMMM yyyy") : "Pilih tanggal"}
          </p>
        </div>

        {/* Auto-save indicator */}
        <div className="flex-shrink-0">
          <AutoSaveIndicator status={autoSaveStatus} />
        </div>
      </header>

      {/* Form */}
      <div className="min-h-screen bg-slate-50">
        <form
          onSubmit={handleSubmit(onFormSubmit)}
          noValidate
          className="px-4 py-5 space-y-5 max-w-2xl mx-auto"
        >
          {/* Completion progress */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm"
          >
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1.5">
                <p className="text-xs font-semibold text-slate-700">
                  Kelengkapan Jurnal
                </p>
                <p className="text-xs font-bold text-slate-800">
                  {[
                    !!watchedDate,
                    watchedTitle.length >= 5,
                    watchedContent.length >= 20,
                    photos.length > 0,
                  ].filter(Boolean).length * 25}%
                </p>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                  animate={{
                    width: `${
                      [
                        !!watchedDate,
                        watchedTitle.length >= 5,
                        watchedContent.length >= 20,
                        photos.length > 0,
                      ].filter(Boolean).length * 25
                    }%`,
                  }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              {[
                { done: !!watchedDate, label: "Tanggal" },
                { done: watchedTitle.length >= 5, label: "Judul" },
                { done: watchedContent.length >= 20, label: "Isi" },
                { done: photos.length > 0, label: "Foto" },
              ].map((step) => (
                <motion.div
                  key={step.label}
                  animate={{ scale: step.done ? [1, 1.2, 1] : 1 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    step.done ? "bg-emerald-500" : "bg-slate-200"
                  )}
                  title={step.label}
                />
              ))}
            </div>
          </motion.div>

          {/* Template selector */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <TemplateSelector onSelect={handleTemplateSelect} />
          </motion.div>

          {/* Date picker */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <DateSelector
              value={watchedDate}
              onChange={(v) => setValue("date", v, { shouldValidate: true })}
              error={errors.date?.message}
            />
          </motion.div>

          {/* Title input */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="form-group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="title" className="form-label">
                Judul Kegiatan
                <span className="text-red-500 ml-1" aria-hidden="true">*</span>
              </label>
              <span
                className={cn(
                  "text-xs tabular-nums",
                  watchedTitle.length > 130
                    ? "text-red-500"
                    : watchedTitle.length > 110
                    ? "text-amber-500"
                    : "text-slate-400"
                )}
              >
                {watchedTitle.length}/150
              </span>
            </div>
            <input
              id="title"
              type="text"
              placeholder="Contoh: Instalasi dan Konfigurasi Server Linux"
              maxLength={150}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "title-error" : undefined}
              className={cn(
                "input-base",
                errors.title && "input-error"
              )}
              {...register("title")}
            />
            {errors.title && (
              <p id="title-error" className="form-error" role="alert">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                {errors.title.message}
              </p>
            )}
          </motion.div>

          {/* Rich editor */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <RichEditor
              value={watchedContent}
              onChange={(val) =>
                setValue("content", val, { shouldValidate: true })
              }
              error={errors.content?.message}
              maxLength={5000}
            />
          </motion.div>

          {/* Photo uploader */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <PhotoUploader
              photos={photos}
              onAdd={handleAddPhotos}
              onRemove={handleRemovePhoto}
              maxPhotos={5}
            />
          </motion.div>

          {/* Time info */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex items-center gap-2.5 p-3.5 bg-blue-50 rounded-2xl border border-blue-100"
          >
            <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" aria-hidden="true" />
            <p className="text-xs text-blue-700 leading-snug">
              <span className="font-semibold">Reminder:</span> Jurnal harian
              sebaiknya diisi setiap hari setelah selesai bekerja agar
              tidak lupa.
            </p>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="grid grid-cols-2 gap-3 pb-6"
          >
            {/* Save as draft */}
            <button
              type="button"
              onClick={() => handleActionClick("draft")}
              disabled={submitting}
              className={cn(
                "flex items-center justify-center gap-2",
                "h-13 rounded-2xl",
                "border-2 border-slate-200 bg-white",
                "text-sm font-semibold text-slate-700",
                "hover:bg-slate-50 hover:border-slate-300",
                "active:scale-[0.97] transition-all duration-150",
                "disabled:opacity-50 disabled:pointer-events-none",
                "shadow-sm tap-highlight-none"
              )}
              style={{ height: 52 }}
            >
              {submitting && pendingAction === "draft" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan Draft
                </>
              )}
            </button>

            {/* Submit */}
            <button
              type="button"
              onClick={() => handleActionClick("submit")}
              disabled={submitting}
              className={cn(
                "flex items-center justify-center gap-2",
                "h-13 rounded-2xl",
                "bg-blue-600 hover:bg-blue-700",
                "text-sm font-bold text-white",
                "active:scale-[0.97] transition-all duration-150",
                "disabled:opacity-60 disabled:pointer-events-none",
                "shadow-md shadow-blue-200 tap-highlight-none"
              )}
              style={{ height: 52 }}
            >
              {submitting && pendingAction === "submit" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Kirim Jurnal
                </>
              )}
            </button>
          </motion.div>
        </form>
      </div>

      {/* Confirm submit modal */}
      <ConfirmSubmitModal
        open={showConfirmSubmit}
        onConfirm={handleConfirmSubmit}
        onCancel={() => {
          setShowConfirmSubmit(false);
          setPendingAction(null);
        }}
        submitting={submitting}
      />
    </>
  );
}
