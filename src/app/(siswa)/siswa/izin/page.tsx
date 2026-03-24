"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Calendar,
  FileText,
  Upload,
  X,
  Loader2,
  Send,
  Thermometer,
  Heart,
  Zap,
  HelpCircle,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { useStudentContext } from "@/lib/hooks/use-student-context";
import { formatDate, getAbsenceTypeLabel, cn } from "@/lib/utils";


/* ─────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────── */

type AbsenceType = "sick" | "permission" | "emergency" | "other";
type AbsenceStatus = "pending" | "approved" | "rejected";

interface AbsenceRequest {
  id: string;
  date: string;
  type: AbsenceType;
  reason: string;
  attachment_url: string | null;
  status: AbsenceStatus;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
}

type WizardStep = 1 | 2 | 3;

/* ─────────────────────────────────────────────────────────
   Form schema
───────────────────────────────────────────────────────── */

const izinSchema = z.object({
  date: z.string().min(1, "Tanggal wajib diisi"),
  type: z.enum(["sick", "permission", "emergency", "other"]),
  reason: z
    .string()
    .min(10, "Alasan minimal 10 karakter")
    .max(500, "Alasan maksimal 500 karakter"),
  attachment: z.any().optional(),
});

type IzinFormData = z.infer<typeof izinSchema>;

/* ─────────────────────────────────────────────────────────
   Absence type config
───────────────────────────────────────────────────────── */

const ABSENCE_TYPES: {
  value: AbsenceType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  requireAttachment?: boolean;
  attachmentLabel?: string;
}[] = [
  {
    value: "sick",
    label: "Sakit",
    description: "Tidak dapat hadir karena sakit",
    icon: Thermometer,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    requireAttachment: false,
    attachmentLabel: "Surat dokter / foto resep (direkomendasikan)",
  },
  {
    value: "permission",
    label: "Izin",
    description: "Ada keperluan mendesak atau kegiatan sekolah",
    icon: Heart,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    requireAttachment: false,
    attachmentLabel: "Surat izin / dokumen pendukung",
  },
  {
    value: "emergency",
    label: "Darurat",
    description: "Kondisi darurat keluarga atau hal mendesak",
    icon: Zap,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    requireAttachment: false,
    attachmentLabel: "Dokumen pendukung (jika ada)",
  },
  {
    value: "other",
    label: "Lainnya",
    description: "Alasan lain yang tidak termasuk kategori di atas",
    icon: HelpCircle,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    requireAttachment: false,
    attachmentLabel: "Dokumen pendukung (jika ada)",
  },
];

const STATUS_CONFIG: Record<
  AbsenceStatus,
  { label: string; icon: React.ElementType; color: string; bg: string; border: string }
> = {
  pending: {
    label: "Menunggu Persetujuan",
    icon: Clock,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  approved: {
    label: "Disetujui",
    icon: CheckCircle2,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  rejected: {
    label: "Ditolak",
    icon: XCircle,
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
};

/* ─────────────────────────────────────────────────────────
   Placeholder data
───────────────────────────────────────────────────────── */

function generatePlaceholderRequests(): AbsenceRequest[] {
  return [
    {
      id: "1",
      date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
      type: "sick",
      reason:
        "Saya mengalami demam tinggi dan sakit kepala sehingga tidak dapat hadir ke tempat PKL. Sudah memeriksakan diri ke dokter.",
      attachment_url: null,
      status: "approved",
      reviewed_by_name: "Ibu Sari Dewi, S.Kom",
      reviewed_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      review_notes: "Baik, semoga lekas sembuh. Jangan lupa kirim jurnal susulan.",
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: "2",
      date: new Date(Date.now() - 10 * 86400000).toISOString().split("T")[0],
      type: "permission",
      reason:
        "Ada keperluan keluarga yang harus saya hadiri yaitu acara pernikahan saudara dari luar kota.",
      attachment_url: null,
      status: "approved",
      reviewed_by_name: "Ibu Sari Dewi, S.Kom",
      reviewed_at: new Date(Date.now() - 9 * 86400000).toISOString(),
      review_notes: null,
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
    {
      id: "3",
      date: new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0],
      type: "emergency",
      reason: "Ibu saya dirawat di rumah sakit secara mendadak sehingga harus menemani beliau.",
      attachment_url: null,
      status: "rejected",
      reviewed_by_name: "Ibu Sari Dewi, S.Kom",
      reviewed_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      review_notes:
        "Pengajuan ditolak karena tidak ada surat keterangan dari rumah sakit. Harap kirim bukti pada kesempatan berikutnya.",
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: "4",
      date: new Date().toISOString().split("T")[0],
      type: "sick",
      reason: "Saya mengalami flu berat disertai batuk dan sesak nafas sejak semalam.",
      attachment_url: null,
      status: "pending",
      reviewed_by_name: null,
      reviewed_at: null,
      review_notes: null,
      created_at: new Date().toISOString(),
    },
  ];
}

/* ─────────────────────────────────────────────────────────
   Wizard Step 1 — Pilih Tipe
───────────────────────────────────────────────────────── */

function StepSelectType({
  value,
  onChange,
  onNext,
}: {
  value: AbsenceType | undefined;
  onChange: (v: AbsenceType) => void;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">
          Jenis Keterangan
        </h2>
        <p className="text-sm text-slate-500">
          Pilih jenis keterangan tidak hadir yang sesuai dengan kondisi Anda.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ABSENCE_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = value === type.value;

          return (
            <motion.button
              key={type.value}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange(type.value)}
              className={cn(
                "flex flex-col items-start gap-3 p-4 rounded-2xl border-2",
                "text-left transition-all duration-200 tap-highlight-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                isSelected
                  ? `${type.bg} ${type.border} shadow-sm`
                  : "bg-white border-slate-200 hover:border-slate-300"
              )}
              aria-pressed={isSelected}
            >
              {/* Icon */}
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  isSelected ? type.bg : "bg-slate-100",
                  "border",
                  isSelected ? type.border : "border-transparent"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5",
                    isSelected ? type.color : "text-slate-500"
                  )}
                  strokeWidth={2}
                />
              </div>

              {/* Label */}
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-sm font-bold leading-tight",
                    isSelected ? type.color : "text-slate-800"
                  )}
                >
                  {type.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                  {type.description}
                </p>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className={cn(
                    "absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center",
                    type.color.replace("text-", "bg-").replace("600", "600")
                  )}
                >
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Next button */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={onNext}
        disabled={!value}
        className={cn(
          "w-full h-13 rounded-2xl flex items-center justify-center gap-2",
          "text-sm font-bold text-white",
          "transition-all duration-200 tap-highlight-none",
          "disabled:opacity-50 disabled:pointer-events-none",
          "shadow-md",
          value
            ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
            : "bg-slate-300"
        )}
        style={{ height: 52 }}
      >
        Lanjutkan
        <ChevronRight className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Wizard Step 2 — Isi Detail
───────────────────────────────────────────────────────── */

function StepFillDetail({
  type,
  dateValue,
  onDateChange,
  dateError,
  reasonValue,
  onReasonChange,
  reasonError,
  attachment,
  onAttachmentChange,
  onNext,
  onBack,
}: {
  type: AbsenceType;
  dateValue: string;
  onDateChange: (v: string) => void;
  dateError?: string;
  reasonValue: string;
  onReasonChange: (v: string) => void;
  reasonError?: string;
  attachment: File | null;
  onAttachmentChange: (f: File | null) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typeCfg = ABSENCE_TYPES.find((t) => t.value === type)!;
  const today = new Date().toISOString().split("T")[0];
  const maxDate = today;
  const minDate = new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 10MB");
        return;
      }
      const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
      if (!allowed.includes(file.type)) {
        toast.error("Format file tidak didukung. Gunakan JPG, PNG, atau PDF.");
        return;
      }
      onAttachmentChange(file);
    }
    e.target.value = "";
  };

  const canProceed =
    dateValue.trim().length > 0 && reasonValue.trim().length >= 10;

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">
          Detail Keterangan
        </h2>
        <div
          className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
            typeCfg.bg,
            `border ${typeCfg.border}`
          )}
        >
          <typeCfg.icon className={cn("w-3.5 h-3.5", typeCfg.color)} />
          <span className={cn("text-xs font-semibold", typeCfg.color)}>
            {typeCfg.label}
          </span>
        </div>
      </div>

      {/* Date */}
      <div className="form-group">
        <label htmlFor="absence-date" className="form-label">
          Tanggal Tidak Hadir
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative flex items-center">
          <Calendar
            className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="absence-date"
            type="date"
            value={dateValue}
            onChange={(e) => onDateChange(e.target.value)}
            max={maxDate}
            min={minDate}
            className={cn(
              "input-base pl-10 cursor-pointer",
              dateError && "input-error"
            )}
          />
        </div>
        {dateError && (
          <p className="form-error" role="alert">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            {dateError}
          </p>
        )}
        {dateValue && (
          <p className="form-hint">{formatDate(dateValue, "EEEE, dd MMMM yyyy")}</p>
        )}
      </div>

      {/* Reason */}
      <div className="form-group">
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="absence-reason" className="form-label">
            Alasan / Keterangan
            <span className="text-red-500 ml-1">*</span>
          </label>
          <span
            className={cn(
              "text-xs tabular-nums",
              reasonValue.length > 450
                ? "text-red-500"
                : reasonValue.length > 400
                ? "text-amber-500"
                : "text-slate-400"
            )}
          >
            {reasonValue.length}/500
          </span>
        </div>
        <textarea
          id="absence-reason"
          value={reasonValue}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder={
            type === "sick"
              ? "Contoh: Saya mengalami demam tinggi dan sudah periksa ke dokter. Mohon izin untuk tidak hadir hari ini..."
              : type === "permission"
              ? "Contoh: Saya memohon izin tidak hadir karena ada keperluan keluarga yang tidak bisa ditinggalkan..."
              : "Jelaskan alasan Anda tidak dapat hadir hari ini..."
          }
          maxLength={500}
          rows={4}
          className={cn(
            "input-base h-auto resize-none rounded-2xl py-3 leading-relaxed",
            "min-h-[120px]",
            reasonError && "input-error"
          )}
          aria-invalid={!!reasonError}
        />
        {reasonError && (
          <p className="form-error" role="alert">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            {reasonError}
          </p>
        )}
      </div>

      {/* Attachment */}
      <div className="form-group">
        <label className="form-label">
          {typeCfg.attachmentLabel ?? "Lampiran Dokumen"}
        </label>

        <AnimatePresence mode="wait">
          {attachment ? (
            <motion.div
              key="file-preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl"
            >
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                {attachment.type.startsWith("image/") ? (
                  <img
                    src={URL.createObjectURL(attachment)}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <FileText className="w-5 h-5 text-emerald-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-emerald-800 truncate">
                  {attachment.name}
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  {(attachment.size / 1024).toFixed(0)} KB •{" "}
                  {attachment.type.split("/")[1]?.toUpperCase()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onAttachmentChange(null)}
                className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors flex-shrink-0 tap-highlight-none"
                aria-label="Hapus lampiran"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="upload-btn"
              type="button"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "w-full flex flex-col items-center justify-center gap-2 p-5",
                "border-2 border-dashed border-slate-300 rounded-2xl",
                "bg-slate-50 hover:bg-slate-100 hover:border-blue-400",
                "text-slate-500 hover:text-blue-600",
                "transition-all duration-200 tap-highlight-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              )}
            >
              <Upload className="w-6 h-6" strokeWidth={1.5} />
              <div className="text-center">
                <p className="text-sm font-semibold">Tap untuk upload file</p>
                <p className="text-xs mt-0.5">JPG, PNG, PDF • Maks. 10MB</p>
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />
      </div>

      {/* Navigation buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onBack}
          className={cn(
            "h-13 rounded-2xl border-2 border-slate-200 bg-white",
            "text-sm font-semibold text-slate-700",
            "flex items-center justify-center gap-2",
            "hover:bg-slate-50 hover:border-slate-300",
            "active:scale-[0.97] transition-all tap-highlight-none"
          )}
          style={{ height: 52 }}
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className={cn(
            "h-13 rounded-2xl text-white font-bold text-sm",
            "flex items-center justify-center gap-2",
            "active:scale-[0.97] transition-all tap-highlight-none",
            "shadow-md disabled:opacity-50 disabled:pointer-events-none",
            canProceed
              ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
              : "bg-slate-300"
          )}
          style={{ height: 52 }}
        >
          Lanjutkan
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Wizard Step 3 — Konfirmasi & Kirim
───────────────────────────────────────────────────────── */

function StepConfirm({
  type,
  date,
  reason,
  attachment,
  submitting,
  onSubmit,
  onBack,
}: {
  type: AbsenceType;
  date: string;
  reason: string;
  attachment: File | null;
  submitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const typeCfg = ABSENCE_TYPES.find((t) => t.value === type)!;
  const TypeIcon = typeCfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">
          Konfirmasi Pengajuan
        </h2>
        <p className="text-sm text-slate-500">
          Periksa kembali data pengajuan Anda sebelum dikirim.
        </p>
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Type banner */}
        <div className={cn("flex items-center gap-3 p-4", typeCfg.bg)}>
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center border",
              typeCfg.border,
              "bg-white/70"
            )}
          >
            <TypeIcon className={cn("w-5 h-5", typeCfg.color)} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 leading-none mb-0.5">
              Jenis Keterangan
            </p>
            <p className={cn("text-base font-bold", typeCfg.color)}>
              {typeCfg.label}
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {/* Date */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Tanggal</p>
              <p className="text-sm font-semibold text-slate-800">
                {formatDate(date, "EEEE, dd MMMM yyyy")}
              </p>
            </div>
          </div>

          {/* Reason */}
          <div className="px-4 py-3.5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 font-medium mb-0.5">Alasan</p>
                <p className="text-sm text-slate-700 leading-relaxed">{reason}</p>
              </div>
            </div>
          </div>

          {/* Attachment */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Upload className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Lampiran</p>
              {attachment ? (
                <p className="text-sm font-semibold text-emerald-600">
                  ✓ {attachment.name}
                </p>
              ) : (
                <p className="text-sm text-slate-400">Tidak ada lampiran</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
        <AlertCircle className="w-4.5 h-4.5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          Pengajuan akan dikirimkan ke{" "}
          <strong>guru pembimbing PKL</strong> Anda untuk ditinjau dan
          disetujui. Pastikan data yang diisi sudah benar.
        </p>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className={cn(
            "h-13 rounded-2xl border-2 border-slate-200 bg-white",
            "text-sm font-semibold text-slate-700",
            "flex items-center justify-center gap-2",
            "hover:bg-slate-50 active:scale-[0.97]",
            "transition-all tap-highlight-none",
            "disabled:opacity-50"
          )}
          style={{ height: 52 }}
        >
          <ArrowLeft className="w-4 h-4" />
          Edit Data
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className={cn(
            "h-13 rounded-2xl text-white font-bold text-sm",
            "flex items-center justify-center gap-2",
            "bg-blue-600 hover:bg-blue-700",
            "active:scale-[0.97] transition-all tap-highlight-none",
            "shadow-md shadow-blue-200",
            "disabled:opacity-60 disabled:pointer-events-none"
          )}
          style={{ height: 52 }}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Mengirim...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Kirim Pengajuan
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Request card (list item)
───────────────────────────────────────────────────────── */

function RequestCard({
  request,
  index,
}: {
  request: AbsenceRequest;
  index: number;
}) {
  const statusCfg = STATUS_CONFIG[request.status];
  const StatusIcon = statusCfg.icon;
  const typeCfg = ABSENCE_TYPES.find((t) => t.value === request.type)!;
  const TypeIcon = typeCfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "bg-white rounded-2xl border overflow-hidden shadow-sm",
        statusCfg.border
      )}
    >
      {/* Header */}
      <div className={cn("flex items-center justify-between px-4 py-3", statusCfg.bg)}>
        <div className="flex items-center gap-2.5">
          <TypeIcon className={cn("w-4 h-4 flex-shrink-0", typeCfg.color)} />
          <div>
            <p className={cn("text-[13px] font-bold leading-tight", typeCfg.color)}>
              {typeCfg.label}
            </p>
            <p className="text-xs text-slate-500 leading-none mt-px">
              {formatDate(request.date, "dd MMM yyyy")}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
            "text-[11px] font-bold whitespace-nowrap",
            statusCfg.bg,
            statusCfg.color
          )}
        >
          <StatusIcon className="w-3 h-3 flex-shrink-0" />
          {statusCfg.label}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3.5 space-y-2.5">
        {/* Reason */}
        <p className="text-sm text-slate-700 leading-relaxed line-clamp-2">
          {request.reason}
        </p>

        {/* Divider */}
        <div className="h-px bg-slate-100" />

        {/* Meta */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-slate-400">
            Diajukan: {formatDate(request.created_at, "dd MMM yyyy, HH:mm")}
          </p>
          {request.attachment_url && (
            <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Ada lampiran
            </span>
          )}
        </div>

        {/* Teacher review notes */}
        {request.review_notes && (
          <div
            className={cn(
              "flex items-start gap-2.5 p-3 rounded-xl mt-1",
              request.status === "approved"
                ? "bg-emerald-50 border border-emerald-100"
                : "bg-red-50 border border-red-100"
            )}
          >
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                request.status === "approved" ? "bg-emerald-100" : "bg-red-100"
              )}
            >
              {request.status === "approved" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-red-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-[11px] font-bold mb-0.5",
                  request.status === "approved" ? "text-emerald-700" : "text-red-700"
                )}
              >
                Catatan Guru:{" "}
                <span className="font-normal">{request.reviewed_by_name}</span>
              </p>
              <p
                className={cn(
                  "text-xs leading-snug",
                  request.status === "approved" ? "text-emerald-700" : "text-red-700"
                )}
              >
                {request.review_notes}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Success screen
───────────────────────────────────────────────────────── */

function SuccessScreen({ type, onDone }: { type: AbsenceType; onDone: () => void }) {
  const typeCfg = ABSENCE_TYPES.find((t) => t.value === type)!;
  const TypeIcon = typeCfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
      className="flex flex-col items-center text-center py-10 px-4 gap-5"
    >
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.15, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        className="w-24 h-24 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-200"
      >
        <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-xl font-extrabold text-slate-900 mb-1.5">
          Pengajuan Terkirim! 🎉
        </h2>
        <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
          Pengajuan {typeCfg.label.toLowerCase()} Anda telah dikirimkan ke
          guru pembimbing. Tunggu konfirmasi dalam waktu 1×24 jam.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-xs p-4 bg-amber-50 rounded-2xl border border-amber-200 text-left"
      >
        <p className="text-xs font-semibold text-amber-800 flex items-center gap-2 mb-1">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          Catatan penting:
        </p>
        <ul className="space-y-1">
          {[
            "Tetap informasikan ke pembimbing lapangan di perusahaan",
            "Simpan bukti/surat jika diperlukan",
            "Buat jurnal susulan jika diizinkan",
          ].map((note) => (
            <li key={note} className="text-xs text-amber-700 leading-snug">
              • {note}
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileTap={{ scale: 0.97 }}
        onClick={onDone}
        className="w-full max-w-xs h-12 rounded-2xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 active:scale-[0.97] transition-all shadow-md shadow-blue-200 tap-highlight-none"
      >
        Lihat Riwayat Pengajuan
      </motion.button>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────── */

export default function IzinPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const supabase = createClient();
  const { context: studentCtx } = useStudentContext();


  // View state: "list" | "form"
  const [view, setView] = useState<"list" | "form">("list");
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form state
  const [selectedType, setSelectedType] = useState<AbsenceType | undefined>();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [reasonText, setReasonText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ date?: string; reason?: string }>({});

  // List state
  const [requests, setRequests] = useState<AbsenceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<AbsenceStatus | "all">("all");

  /* ── Load requests ─────────────────────────────────── */

  useEffect(() => {
    async function loadRequests() {
      setLoading(true);
      try {
        if (!profile?.id) {
          setRequests([]);
          return;
        }

        let query = supabase
          .from("absence_requests")
          .select("id, date, type, reason, attachment_url, status, reviewed_at, review_notes, created_at")
          .order("created_at", { ascending: false });

        // Filter by student_id jika sudah ada
        if (studentCtx) {
          query = query.eq("student_id", studentCtx.studentId);
        }

        const { data, error } = await query;

        if (error) throw error;
        // Map data ke interface lokal (reviewed_by_name tidak ada di DB, set null)
        const mapped = (data ?? []).map((r) => ({
          ...r,
          reviewed_by_name: null,
        })) as AbsenceRequest[];
        setRequests(mapped);
      } catch {
        setRequests([]);
      } finally {
        setLoading(false);
      }
    }
    const t = setTimeout(loadRequests, 300);
    return () => clearTimeout(t);
  }, [profile?.id, studentCtx?.studentId]);


  /* ── Form handlers ─────────────────────────────────── */

  const validateStep2 = () => {
    const errors: { date?: string; reason?: string } = {};
    if (!selectedDate) errors.date = "Tanggal wajib diisi";
    if (reasonText.trim().length < 10)
      errors.reason = "Alasan minimal 10 karakter";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStep1Next = () => {
    if (selectedType) setWizardStep(2);
  };

  const handleStep2Next = () => {
    if (validateStep2()) setWizardStep(3);
  };

  const handleSubmit = async () => {
    if (!profile?.id || !selectedType) return;
    if (!studentCtx) {
      toast.error("Data PKL belum siap. Coba refresh halaman.");
      return;
    }
    setSubmitting(true);

    try {
      let attachmentUrl: string | null = null;

      // Upload lampiran ke bucket 'absences' jika ada
      if (attachment) {
        const ext = attachment.name.split(".").pop() ?? "jpg";
        const path = `absences/${studentCtx.studentId}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("absences")          // bucket: absences (bukan documents)
          .upload(path, attachment, { upsert: true });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from("absences")
            .getPublicUrl(path);
          attachmentUrl = urlData.publicUrl;
        } else {
          console.warn("Attachment upload warning:", uploadErr.message);
          // Lanjut tanpa lampiran jika upload gagal
        }
      }

      // Insert absence request dengan student_id dan pkl_assignment_id yang benar
      const { error } = await supabase.from("absence_requests").insert({
        student_id: studentCtx.studentId,           // UUID dari tabel students
        pkl_assignment_id: studentCtx.pklAssignmentId,
        date: selectedDate,
        type: selectedType,
        reason: reasonText.trim(),
        attachment_url: attachmentUrl,
        status: "pending",
      });

      if (error) throw error;

      // Notifikasi konfirmasi untuk siswa
      await supabase.from("notifications").insert({
        user_id: profile.id,
        title: `Pengajuan ${getAbsenceTypeLabel(selectedType)} Terkirim`,
        body: `Pengajuan keterangan tidak hadir untuk tanggal ${formatDate(selectedDate, "dd MMM yyyy")} telah dikirim ke guru pembimbing.`,
        type: "absence",
        data: JSON.stringify({ type: selectedType, date: selectedDate, assignment_id: studentCtx.pklAssignmentId }),
        is_read: false,
      });

      setShowSuccess(true);
    } catch (err) {
      toast.error("Gagal mengirim pengajuan. Coba lagi.", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };


  const handleSuccessDone = () => {
    // Reset form
    setSelectedType(undefined);
    setSelectedDate(new Date().toISOString().split("T")[0]);
    setReasonText("");
    setAttachment(null);
    setWizardStep(1);
    setShowSuccess(false);
    setView("list");
    // Reload data nyata dari Supabase
    if (studentCtx) {
      supabase
        .from("absence_requests")
        .select("id, date, type, reason, attachment_url, status, reviewed_at, review_notes, created_at")
        .eq("student_id", studentCtx.studentId)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (data) {
            setRequests(data.map((r) => ({ ...r, reviewed_by_name: null })) as AbsenceRequest[]);
          }
        });
    }
  };


  const handleResetForm = () => {
    setView("list");
    setWizardStep(1);
    setSelectedType(undefined);
    setSelectedDate(new Date().toISOString().split("T")[0]);
    setReasonText("");
    setAttachment(null);
    setFormErrors({});
    setShowSuccess(false);
  };

  /* ── Filtered requests ─────────────────────────────── */

  const filteredRequests =
    filterStatus === "all"
      ? requests
      : requests.filter((r) => r.status === filterStatus);

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  /* ── Render ─────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center gap-3 px-4 h-[60px] bg-white/90 backdrop-blur-xl border-b border-slate-200/60">
        {view === "form" ? (
          <button
            onClick={handleResetForm}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors tap-highlight-none"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-4.5 h-4.5" strokeWidth={2.5} />
          </button>
        ) : (
          <button
            onClick={() => router.push("/siswa/dashboard")}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors tap-highlight-none"
            aria-label="Kembali ke dashboard"
          >
            <ArrowLeft className="w-4.5 h-4.5" strokeWidth={2.5} />
          </button>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="text-[17px] font-bold text-slate-900">
            {view === "form" ? "Ajukan Keterangan" : "Izin & Sakit"}
          </h1>
          {view === "form" && (
            <p className="text-xs text-slate-400">
              Langkah {wizardStep} dari 3
            </p>
          )}
        </div>

        {view === "list" && (
          <button
            onClick={() => setView("form")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl",
              "bg-blue-600 text-white text-sm font-semibold",
              "hover:bg-blue-700 active:scale-[0.97]",
              "transition-all shadow-sm tap-highlight-none"
            )}
          >
            <Plus className="w-4 h-4" />
            Ajukan
          </button>
        )}
      </header>

      <div className="px-4 py-5 max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {/* ── FORM VIEW ─────────────────────────────── */}
          {view === "form" && (
            <motion.div
              key="form-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {showSuccess ? (
                <SuccessScreen
                  type={selectedType!}
                  onDone={handleSuccessDone}
                />
              ) : (
                <div className="space-y-5">
                  {/* Step indicator */}
                  <div className="flex items-center gap-2">
                    {[1, 2, 3].map((step) => (
                      <React.Fragment key={step}>
                        <div
                          className={cn(
                            "flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all duration-300",
                            wizardStep === step
                              ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                              : wizardStep > step
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-100 text-slate-400"
                          )}
                        >
                          {wizardStep > step ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            step
                          )}
                        </div>
                        {step < 3 && (
                          <div
                            className={cn(
                              "flex-1 h-1 rounded-full transition-all duration-500",
                              wizardStep > step ? "bg-emerald-400" : "bg-slate-100"
                            )}
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Step content */}
                  <AnimatePresence mode="wait">
                    {wizardStep === 1 && (
                      <StepSelectType
                        key="step1"
                        value={selectedType}
                        onChange={setSelectedType}
                        onNext={handleStep1Next}
                      />
                    )}
                    {wizardStep === 2 && (
                      <StepFillDetail
                        key="step2"
                        type={selectedType!}
                        dateValue={selectedDate}
                        onDateChange={setSelectedDate}
                        dateError={formErrors.date}
                        reasonValue={reasonText}
                        onReasonChange={setReasonText}
                        reasonError={formErrors.reason}
                        attachment={attachment}
                        onAttachmentChange={setAttachment}
                        onNext={handleStep2Next}
                        onBack={() => setWizardStep(1)}
                      />
                    )}
                    {wizardStep === 3 && (
                      <StepConfirm
                        key="step3"
                        type={selectedType!}
                        date={selectedDate}
                        reason={reasonText}
                        attachment={attachment}
                        submitting={submitting}
                        onSubmit={handleSubmit}
                        onBack={() => setWizardStep(2)}
                      />
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {/* ── LIST VIEW ─────────────────────────────── */}
          {view === "list" && (
            <motion.div
              key="list-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Summary banner */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-5 shadow-lg shadow-orange-200/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-xs font-semibold uppercase tracking-wider mb-1">
                      Pengajuan Keterangan
                    </p>
                    <p className="text-white text-2xl font-extrabold leading-none">
                      {requests.length}
                      <span className="text-orange-200 text-sm font-medium ml-1.5">
                        total pengajuan
                      </span>
                    </p>
                  </div>
                  {pendingCount > 0 && (
                    <div className="bg-white/20 rounded-2xl px-4 py-3 text-center border border-white/20">
                      <p className="text-2xl font-black text-white leading-none">
                        {pendingCount}
                      </p>
                      <p className="text-orange-100 text-[11px] font-medium mt-0.5">
                        menunggu
                      </p>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {[
                    {
                      label: "Disetujui",
                      value: requests.filter((r) => r.status === "approved").length,
                      color: "bg-emerald-400/30 text-emerald-100",
                    },
                    {
                      label: "Menunggu",
                      value: requests.filter((r) => r.status === "pending").length,
                      color: "bg-amber-400/30 text-amber-100",
                    },
                    {
                      label: "Ditolak",
                      value: requests.filter((r) => r.status === "rejected").length,
                      color: "bg-red-400/30 text-red-100",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className={cn("rounded-xl p-2 text-center", s.color)}
                    >
                      <p className="text-lg font-extrabold leading-none">{s.value}</p>
                      <p className="text-[10px] font-medium mt-0.5 opacity-90">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Filter tabs */}
              <div className="flex gap-2 scroll-x -mx-4 px-4 pb-1">
                {(
                  [
                    { value: "all", label: "Semua" },
                    { value: "pending", label: "Menunggu" },
                    { value: "approved", label: "Disetujui" },
                    { value: "rejected", label: "Ditolak" },
                  ] as { value: AbsenceStatus | "all"; label: string }[]
                ).map((tab) => {
                  const count =
                    tab.value === "all"
                      ? requests.length
                      : requests.filter((r) => r.status === tab.value).length;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => setFilterStatus(tab.value)}
                      className={cn(
                        "flex items-center gap-1.5 px-3.5 py-2 rounded-full",
                        "text-xs font-semibold whitespace-nowrap",
                        "border transition-all duration-150 tap-highlight-none flex-shrink-0",
                        filterStatus === tab.value
                          ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      )}
                    >
                      {tab.label}
                      <span
                        className={cn(
                          "px-1.5 py-px rounded-full text-[10px] font-bold",
                          filterStatus === tab.value
                            ? "bg-white/20 text-white"
                            : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Request list */}
              {loading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse"
                      aria-hidden="true"
                    />
                  ))}
                </div>
              ) : filteredRequests.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mb-3">
                    <ClipboardList className="w-8 h-8 text-slate-400" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-bold text-slate-600 mb-1">
                    {filterStatus === "all"
                      ? "Belum Ada Pengajuan"
                      : `Tidak ada pengajuan ${filterStatus}`}
                  </p>
                  <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-4">
                    Gunakan tombol + Ajukan di atas untuk membuat pengajuan
                    keterangan tidak hadir.
                  </p>
                  <button
                    onClick={() => setView("form")}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-2xl text-sm font-semibold hover:bg-blue-700 active:scale-[0.97] transition-all shadow-md shadow-blue-200 tap-highlight-none"
                  >
                    <Plus className="w-4 h-4" />
                    Ajukan Sekarang
                  </button>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {filteredRequests.map((req, i) => (
                    <RequestCard key={req.id} request={req} index={i} />
                  ))}
                </div>
              )}

              <div className="h-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
