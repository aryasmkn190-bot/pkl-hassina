"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Building2,
  GraduationCap,
  Calendar,
  Camera,
  Edit2,
  LogOut,
  Bell,
  Lock,
  Shield,
  ChevronRight,
  CheckCircle2,
  Award,
  BookOpen,
  Clock,
  MapPin,
  Hash,
  Star,
  TrendingUp,
  FileText,
  Settings,
  HelpCircle,
  Loader2,
  X,
  Save,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { useStudentContext } from "@/lib/hooks/use-student-context";
import { getStudentDashboardStats } from "@/lib/supabase/queries";
import {
  formatDate,
  getInitials,
  stringToAvatarColor,
  calculateAttendancePercentage,
  getGradeFromScore,
  compressImage,
  cn,
} from "@/lib/utils";


/* ─────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────── */

interface StudentProfile {
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  nis: string;
  class_name: string;
  department_name: string;
  address: string | null;
  parent_name: string | null;
  parent_phone: string | null;
}

interface PKLInfo {
  company_name: string;
  company_city: string;
  supervisor_name: string | null;
  teacher_name: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface PKLStats {
  total_days: number;
  present_days: number;
  sick_days: number;
  permission_days: number;
  absent_days: number;
  total_journals: number;
  submitted_journals: number;
  reviewed_journals: number;
  attendance_score: number | null;
  journal_score: number | null;
  final_score: number | null;
  grade: string | null;
}

/* ─────────────────────────────────────────────────────────
   Placeholder data
───────────────────────────────────────────────────────── */

function getPlaceholderStudent(): StudentProfile {
  return {
    full_name: "Ahmad Fadhil Maulana",
    email: "ahmad.fadhil@student.smkhassina.sch.id",
    phone: "081234567890",
    avatar_url: null,
    nis: "20230045",
    class_name: "XII TKJ 1",
    department_name: "Teknik Komputer & Jaringan",
    address: "Jl. Mawar No. 15, Bandung",
    parent_name: "Bapak Maulana Yusuf",
    parent_phone: "081298765432",
  };
}

function getPlaceholderPKL(): PKLInfo {
  return {
    company_name: "PT Teknologi Maju Bersama",
    company_city: "Bandung",
    supervisor_name: "Bapak Andi Pratama, S.T.",
    teacher_name: "Ibu Sari Dewi, S.Kom",
    start_date: new Date(Date.now() - 60 * 86400000).toISOString().split("T")[0],
    end_date: new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0],
    status: "active",
  };
}

function getPlaceholderStats(): PKLStats {
  return {
    total_days: 60,
    present_days: 54,
    sick_days: 2,
    permission_days: 3,
    absent_days: 1,
    total_journals: 54,
    submitted_journals: 51,
    reviewed_journals: 48,
    attendance_score: 90,
    journal_score: 87,
    final_score: 88.5,
    grade: "B",
  };
}

/* ─────────────────────────────────────────────────────────
   Avatar with upload
───────────────────────────────────────────────────────── */

interface AvatarUploadProps {
  name: string;
  src: string | null;
  uploading: boolean;
  onUpload: (file: File) => void;
}

function AvatarUpload({ name, src, uploading, onUpload }: AvatarUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const colorClass = stringToAvatarColor(name);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Hanya file gambar yang diperbolehkan");
      return;
    }
    onUpload(file);
    e.target.value = "";
  };

  return (
    <div className="relative inline-flex flex-shrink-0">
      {/* Avatar */}
      <div
        className={cn(
          "w-24 h-24 rounded-3xl overflow-hidden",
          "border-4 border-white shadow-xl",
          "flex items-center justify-center",
          !src && colorClass
        )}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-3xl font-extrabold text-white select-none">
            {getInitials(name)}
          </span>
        )}

        {/* Uploading overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Camera button */}
      <motion.button
        whileTap={{ scale: 0.88 }}
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className={cn(
          "absolute -bottom-1 -right-1",
          "w-8 h-8 rounded-xl",
          "bg-blue-600 text-white",
          "flex items-center justify-center",
          "shadow-md border-2 border-white",
          "hover:bg-blue-700 transition-colors",
          "disabled:opacity-60 disabled:pointer-events-none",
          "tap-highlight-none"
        )}
        aria-label="Ganti foto profil"
      >
        <Camera className="w-3.5 h-3.5" strokeWidth={2.5} />
      </motion.button>

      {/* Hidden input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleChange}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Info Row
───────────────────────────────────────────────────────── */

function InfoRow({
  icon: Icon,
  label,
  value,
  iconBg = "bg-slate-100",
  iconColor = "text-slate-500",
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
  iconBg?: string;
  iconColor?: string;
}) {
  if (!value) return null;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
      <div
        className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
          iconBg
        )}
        aria-hidden="true"
      >
        <Icon className={cn("w-4 h-4", iconColor)} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-slate-400 leading-none mb-0.5">
          {label}
        </p>
        <p className="text-sm font-medium text-slate-800 leading-tight truncate">
          {value}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PKL Score Card
───────────────────────────────────────────────────────── */

function PKLScoreCard({ stats }: { stats: PKLStats }) {
  const attendancePct = calculateAttendancePercentage(
    stats.present_days,
    stats.total_days
  );

  const scoreColor = (score: number | null) => {
    if (!score) return "text-slate-400";
    if (score >= 90) return "text-emerald-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-amber-600";
    return "text-red-600";
  };

  const gradeColor = (grade: string | null) => {
    if (!grade) return "bg-slate-100 text-slate-500";
    if (grade === "A") return "bg-emerald-100 text-emerald-700";
    if (grade === "B") return "bg-blue-100 text-blue-700";
    if (grade === "C") return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
            <Award className="w-4 h-4 text-amber-600" strokeWidth={2} />
          </div>
          <p className="text-sm font-bold text-slate-900">Nilai PKL</p>
        </div>
        {stats.grade && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
            className={cn(
              "text-lg font-black px-3 py-1 rounded-2xl",
              gradeColor(stats.grade)
            )}
          >
            {stats.grade}
          </motion.span>
        )}
      </div>

      {/* Score items */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 px-2 py-3">
        {[
          {
            label: "Kehadiran",
            value: stats.attendance_score,
            sub: `${attendancePct}%`,
            icon: CheckCircle2,
          },
          {
            label: "Jurnal",
            value: stats.journal_score,
            sub: `${stats.reviewed_journals}/${stats.total_journals}`,
            icon: BookOpen,
          },
          {
            label: "Nilai Akhir",
            value: stats.final_score,
            sub: stats.grade ? `Predikat ${stats.grade}` : "Belum final",
            icon: Star,
            highlight: true,
          },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-center py-2 px-3">
            <item.icon
              className={cn(
                "w-4 h-4 mb-1.5",
                item.highlight ? "text-amber-500" : "text-slate-400"
              )}
              strokeWidth={2}
            />
            <motion.p
              key={item.value}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "text-xl font-extrabold leading-none mb-0.5",
                scoreColor(item.value)
              )}
            >
              {item.value !== null && item.value !== undefined
                ? item.value % 1 === 0
                  ? item.value
                  : item.value.toFixed(1)
                : "—"}
            </motion.p>
            <p className="text-[10px] font-bold text-slate-400 text-center leading-tight">
              {item.label}
            </p>
            <p className="text-[10px] text-slate-400 text-center leading-tight mt-px">
              {item.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Progress bar for attendance */}
      <div className="px-5 pb-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[11px] font-semibold text-slate-400">
            Persentase Kehadiran
          </span>
          <span
            className={cn(
              "text-[11px] font-bold",
              attendancePct >= 90
                ? "text-emerald-600"
                : attendancePct >= 75
                ? "text-amber-600"
                : "text-red-600"
            )}
          >
            {attendancePct}%
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              attendancePct >= 90
                ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                : attendancePct >= 75
                ? "bg-gradient-to-r from-amber-400 to-amber-500"
                : "bg-gradient-to-r from-red-400 to-red-600"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${attendancePct}%` }}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        {/* Attendance breakdown */}
        <div className="flex gap-3 mt-2.5 flex-wrap">
          {[
            { label: "Hadir", value: stats.present_days, color: "text-emerald-600", dot: "bg-emerald-500" },
            { label: "Sakit", value: stats.sick_days, color: "text-amber-600", dot: "bg-amber-500" },
            { label: "Izin", value: stats.permission_days, color: "text-blue-600", dot: "bg-blue-500" },
            { label: "Alfa", value: stats.absent_days, color: "text-red-600", dot: "bg-red-500" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1">
              <span className={cn("w-2 h-2 rounded-full flex-shrink-0", item.dot)} aria-hidden="true" />
              <span className={cn("text-[11px] font-semibold", item.color)}>
                {item.value}
              </span>
              <span className="text-[11px] text-slate-400">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Edit Profile Modal
───────────────────────────────────────────────────────── */

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  student: StudentProfile;
  onSave: (updates: Partial<StudentProfile>) => Promise<void>;
}

function EditProfileModal({
  open,
  onClose,
  student,
  onSave,
}: EditProfileModalProps) {
  const [phone, setPhone] = useState(student.phone ?? "");
  const [address, setAddress] = useState(student.address ?? "");
  const [parentName, setParentName] = useState(student.parent_name ?? "");
  const [parentPhone, setParentPhone] = useState(student.parent_phone ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        phone: phone || null,
        address: address || null,
        parent_name: parentName || null,
        parent_phone: parentPhone || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

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
            className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[28px] pb-safe shadow-2xl max-h-[90dvh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-200" aria-hidden="true" />
            </div>

            <div className="px-5 pb-6 pt-2 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Edit Profil</h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors tap-highlight-none"
                  aria-label="Tutup"
                >
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              {/* Info notice */}
              <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 border border-blue-100 rounded-2xl">
                <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-px" />
                <p className="text-xs text-blue-700 leading-snug">
                  Nama, NIS, dan kelas hanya dapat diubah oleh administrator
                  sekolah.
                </p>
              </div>

              {/* Fields */}
              {[
                {
                  label: "Nomor HP",
                  value: phone,
                  onChange: setPhone,
                  placeholder: "Contoh: 081234567890",
                  type: "tel",
                },
                {
                  label: "Alamat",
                  value: address,
                  onChange: setAddress,
                  placeholder: "Alamat lengkap...",
                  type: "text",
                  isTextarea: true,
                },
                {
                  label: "Nama Orang Tua / Wali",
                  value: parentName,
                  onChange: setParentName,
                  placeholder: "Nama lengkap orang tua...",
                  type: "text",
                },
                {
                  label: "HP Orang Tua / Wali",
                  value: parentPhone,
                  onChange: setParentPhone,
                  placeholder: "Contoh: 081298765432",
                  type: "tel",
                },
              ].map((field) => (
                <div key={field.label} className="form-group">
                  <label className="form-label">{field.label}</label>
                  {field.isTextarea ? (
                    <textarea
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      className="input-base h-auto resize-none rounded-2xl py-3 min-h-[80px]"
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder={field.placeholder}
                      className="input-base"
                    />
                  )}
                </div>
              ))}

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={saving}
                className={cn(
                  "w-full h-12 rounded-2xl text-white font-bold text-sm",
                  "flex items-center justify-center gap-2",
                  "bg-blue-600 hover:bg-blue-700",
                  "active:scale-[0.97] transition-all",
                  "shadow-md shadow-blue-200",
                  "disabled:opacity-60 disabled:pointer-events-none",
                  "tap-highlight-none"
                )}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────────────
   Settings Item
───────────────────────────────────────────────────────── */

function SettingsItem({
  icon: Icon,
  label,
  description,
  iconBg,
  iconColor,
  onClick,
  destructive = false,
  rightContent,
}: {
  icon: React.ElementType;
  label: string;
  description?: string;
  iconBg: string;
  iconColor: string;
  onClick?: () => void;
  destructive?: boolean;
  rightContent?: React.ReactNode;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3.5 rounded-2xl",
        "text-left transition-all duration-150",
        "tap-highlight-none select-none",
        destructive
          ? "hover:bg-red-50 active:bg-red-50"
          : "hover:bg-slate-50 active:bg-slate-50"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
          iconBg
        )}
        aria-hidden="true"
      >
        <Icon
          className={cn("w-4.5 h-4.5", iconColor)}
          strokeWidth={2}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-semibold leading-tight",
            destructive ? "text-red-600" : "text-slate-800"
          )}
        >
          {label}
        </p>
        {description && (
          <p className="text-xs text-slate-400 mt-0.5 leading-snug">
            {description}
          </p>
        )}
      </div>

      {/* Right */}
      {rightContent ?? (
        <ChevronRight
          className={cn(
            "w-4 h-4 flex-shrink-0",
            destructive ? "text-red-300" : "text-slate-300"
          )}
          aria-hidden="true"
        />
      )}
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────── */

export default function ProfilPage() {
  const router = useRouter();
  const { profile, clearAuth } = useAuthStore();
  const supabase = createClient();

  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [pklInfo, setPklInfo] = useState<PKLInfo | null>(null);
  const [pklStats, setPklStats] = useState<PKLStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const { context: studentCtx } = useStudentContext();


  /* ── Load data ─────────────────────────────────────── */

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (!profile?.id) {
          setStudent(getPlaceholderStudent());
          setPklInfo(getPlaceholderPKL());
          setPklStats(getPlaceholderStats());
          return;
        }

        // Profile
        const { data: studentData } = await supabase
          .from("students")
          .select(
            `
            nis,
            address,
            parent_name,
            parent_phone,
            profiles (full_name, avatar_url, phone),
            classes (name),
            departments (name)
          `
          )
          .eq("profile_id", profile.id)
          .single();

        if (studentData) {
          setStudent({
            full_name: (studentData.profiles as unknown as { full_name: string } | null)?.full_name ?? profile.full_name ?? "",
            email: (profile as { email?: string }).email ?? "",
            phone: (studentData.profiles as unknown as { phone: string | null } | null)?.phone ?? null,
            avatar_url: (studentData.profiles as unknown as { avatar_url: string | null } | null)?.avatar_url ?? null,
            nis: studentData.nis ?? "",
            class_name: (studentData.classes as unknown as { name: string } | null)?.name ?? "",
            department_name: (studentData.departments as unknown as { name: string } | null)?.name ?? "",
            address: studentData.address ?? null,
            parent_name: studentData.parent_name ?? null,
            parent_phone: studentData.parent_phone ?? null,
          });

        } else {
          setStudent(getPlaceholderStudent());
        }

        // PKL assignment
        const { data: assignment } = await supabase
          .from("pkl_assignments")
          .select(
            `
            start_date,
            end_date,
            status,
            supervisor_name,
            companies (name, city),
            teachers (profiles (full_name))
          `
          )
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (assignment) {
          setPklInfo({
            company_name: (assignment.companies as unknown as { name: string } | null)?.name ?? "",
            company_city: (assignment.companies as unknown as { city: string } | null)?.city ?? "",
            supervisor_name: assignment.supervisor_name ?? null,
            teacher_name: (assignment.teachers as unknown as { profiles: { full_name: string } } | null)?.profiles?.full_name ?? "",
            start_date: assignment.start_date,
            end_date: assignment.end_date,
            status: assignment.status,
          });
        } else {
          setPklInfo(null);
        }

        // Stats nyata dari Supabase jika studentCtx tersedia
        if (studentCtx) {
          const realStats = await getStudentDashboardStats(
            studentCtx.studentId,
            studentCtx.pklAssignmentId
          );
          setPklStats({
            total_days: realStats.total_days,
            present_days: realStats.present_days,
            sick_days: realStats.sick_days,
            permission_days: realStats.permission_days,
            absent_days: realStats.absent_days,
            total_journals: realStats.total_journals,
            submitted_journals: realStats.submitted_journals,
            reviewed_journals: realStats.submitted_journals - realStats.pending_journals,
            attendance_score: realStats.total_days > 0
              ? Math.round((realStats.present_days / realStats.total_days) * 100)
              : null,
            journal_score: realStats.total_journals > 0
              ? Math.round((realStats.submitted_journals / realStats.total_journals) * 100)
              : null,
            final_score: null,
            grade: null,
          });
        } else {
          setPklStats(getPlaceholderStats());
        }

      } catch {
        setStudent(getPlaceholderStudent());
        setPklInfo(getPlaceholderPKL());
        setPklStats(getPlaceholderStats());
      } finally {
        setLoading(false);
      }
    }

    const t = setTimeout(load, 400);
    return () => clearTimeout(t);
  }, [profile?.id]);

  /* ── Avatar upload ─────────────────────────────────── */

  const handleAvatarUpload = async (file: File) => {
    if (!profile?.id) return;
    setAvatarUploading(true);

    try {
      const compressed = await compressImage(file, 512, 0.85);
      const path = `avatars/${profile.id}/avatar.jpg`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, compressed, {
          upsert: true,
          contentType: "image/jpeg",
        });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", profile.id);

      setStudent((prev) =>
        prev ? { ...prev, avatar_url: urlData.publicUrl } : prev
      );

      toast.success("Foto profil berhasil diperbarui ✨");
    } catch {
      toast.error("Gagal mengunggah foto. Coba lagi.");
    } finally {
      setAvatarUploading(false);
    }
  };

  /* ── Save profile ──────────────────────────────────── */

  const handleSaveProfile = async (updates: Partial<StudentProfile>) => {
    if (!profile?.id) return;

    try {
      const profileUpdates: Record<string, unknown> = {};
      if (updates.phone !== undefined) profileUpdates.phone = updates.phone;

      const studentUpdates: Record<string, unknown> = {};
      if (updates.address !== undefined) studentUpdates.address = updates.address;
      if (updates.parent_name !== undefined)
        studentUpdates.parent_name = updates.parent_name;
      if (updates.parent_phone !== undefined)
        studentUpdates.parent_phone = updates.parent_phone;

      if (Object.keys(profileUpdates).length > 0) {
        await supabase
          .from("profiles")
          .update(profileUpdates)
          .eq("id", profile.id);
      }

      if (Object.keys(studentUpdates).length > 0) {
        await supabase
          .from("students")
          .update(studentUpdates)
          .eq("profile_id", profile.id);
      }

      setStudent((prev) => (prev ? { ...prev, ...updates } : prev));
      toast.success("Profil berhasil diperbarui ✅");
    } catch {
      toast.error("Gagal memperbarui profil. Coba lagi.");
    }
  };

  /* ── Sign out ──────────────────────────────────────── */

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      clearAuth();
      router.replace("/login");
    } catch {
      toast.error("Gagal keluar. Coba lagi.");
      setSigningOut(false);
    }
  };

  /* ── Skeleton ──────────────────────────────────────── */

  if (loading || !student) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Hero skeleton */}
        <div className="h-56 bg-gradient-to-br from-blue-500 to-blue-700 animate-pulse" />
        <div className="px-4 py-5 space-y-4 max-w-lg mx-auto">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-32 bg-white rounded-3xl animate-pulse border border-slate-100"
            />
          ))}
        </div>
      </div>
    );
  }

  /* ── Render ─────────────────────────────────────────── */

  const colorClass = stringToAvatarColor(student.full_name);

  return (
    <>
      <div className="min-h-screen bg-slate-50 pb-safe pb-8">
        {/* ── Hero Section ──────────────────────────────── */}
        <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 pt-12 pb-20 px-5">
          {/* Background decoration */}
          <div
            className="absolute -top-10 -right-10 w-44 h-44 rounded-full opacity-15"
            style={{ background: "rgba(255,255,255,0.4)" }}
            aria-hidden="true"
          />
          <div
            className="absolute bottom-4 left-0 right-0 h-20 opacity-10"
            style={{
              background:
                "radial-gradient(ellipse at center, white 0%, transparent 70%)",
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col items-center text-center gap-4">
            {/* Avatar */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <AvatarUpload
                name={student.full_name}
                src={student.avatar_url}
                uploading={avatarUploading}
                onUpload={handleAvatarUpload}
              />
            </motion.div>

            {/* Name & info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="text-xl font-extrabold text-white leading-tight">
                {student.full_name}
              </h1>
              <p className="text-blue-100 text-sm font-medium mt-0.5">
                {student.class_name} • {student.department_name}
              </p>
              <p className="text-blue-200 text-xs mt-0.5 font-medium">
                NIS: {student.nis}
              </p>
            </motion.div>

            {/* Quick stats chips */}
            {pklStats && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.28 }}
                className="flex gap-2 flex-wrap justify-center"
              >
                {[
                  {
                    icon: CheckCircle2,
                    value: `${calculateAttendancePercentage(pklStats.present_days, pklStats.total_days)}%`,
                    label: "Hadir",
                    color: "bg-emerald-400/25 text-white",
                  },
                  {
                    icon: BookOpen,
                    value: `${pklStats.submitted_journals}`,
                    label: "Jurnal",
                    color: "bg-white/15 text-white",
                  },
                  {
                    icon: Star,
                    value: pklStats.final_score
                      ? pklStats.final_score.toFixed(0)
                      : "—",
                    label: "Nilai",
                    color: "bg-amber-400/25 text-white",
                  },
                ].map((chip) => (
                  <div
                    key={chip.label}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                      "border border-white/20 backdrop-blur-sm",
                      chip.color
                    )}
                  >
                    <chip.icon className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                    <span className="text-xs font-bold">{chip.value}</span>
                    <span className="text-[10px] opacity-80">{chip.label}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Wave */}
          <div className="absolute bottom-0 left-0 right-0" aria-hidden="true">
            <svg
              viewBox="0 0 390 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full"
              preserveAspectRatio="none"
            >
              <path
                d="M0 32 C97.5 12 195 0 390 20 L390 32 Z"
                fill="#F8FAFC"
              />
            </svg>
          </div>
        </div>

        {/* ── Main Content ──────────────────────────────── */}
        <div className="px-4 -mt-4 space-y-5 max-w-lg mx-auto">
          {/* Edit profile button */}
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowEdit(true)}
            className={cn(
              "w-full flex items-center justify-center gap-2",
              "h-11 rounded-2xl",
              "border-2 border-blue-200 bg-white",
              "text-sm font-semibold text-blue-600",
              "hover:bg-blue-50 hover:border-blue-300",
              "active:scale-[0.97] transition-all shadow-sm",
              "tap-highlight-none"
            )}
          >
            <Edit2 className="w-4 h-4" />
            Edit Profil
          </motion.button>

          {/* PKL Score */}
          {pklStats && <PKLScoreCard stats={pklStats} />}

          {/* PKL Info */}
          {pklInfo && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm"
            >
              <div className="flex items-center gap-2.5 px-5 pt-4 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-600" strokeWidth={2} />
                </div>
                <p className="text-sm font-bold text-slate-900">Info Tempat PKL</p>
                {pklInfo.status === "active" && (
                  <span className="ml-auto text-[11px] font-bold px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                    Aktif
                  </span>
                )}
              </div>
              <div className="px-5 py-2">
                <InfoRow
                  icon={Building2}
                  label="Perusahaan"
                  value={pklInfo.company_name}
                  iconBg="bg-blue-50"
                  iconColor="text-blue-500"
                />
                <InfoRow
                  icon={MapPin}
                  label="Kota"
                  value={pklInfo.company_city}
                  iconBg="bg-emerald-50"
                  iconColor="text-emerald-500"
                />
                <InfoRow
                  icon={User}
                  label="Pembimbing Lapangan"
                  value={pklInfo.supervisor_name ?? "Belum diatur"}
                  iconBg="bg-purple-50"
                  iconColor="text-purple-500"
                />
                <InfoRow
                  icon={GraduationCap}
                  label="Guru Pembimbing"
                  value={pklInfo.teacher_name}
                  iconBg="bg-amber-50"
                  iconColor="text-amber-500"
                />
                <InfoRow
                  icon={Calendar}
                  label="Periode PKL"
                  value={`${formatDate(pklInfo.start_date, "dd MMM yyyy")} – ${formatDate(pklInfo.end_date, "dd MMM yyyy")}`}
                  iconBg="bg-slate-100"
                  iconColor="text-slate-500"
                />
              </div>
            </motion.div>
          )}

          {/* Student Data */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm"
          >
            <div className="flex items-center gap-2.5 px-5 pt-4 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                <User className="w-4 h-4 text-emerald-600" strokeWidth={2} />
              </div>
              <p className="text-sm font-bold text-slate-900">Data Pribadi</p>
            </div>
            <div className="px-5 py-2">
              <InfoRow
                icon={Mail}
                label="Email"
                value={student.email}
                iconBg="bg-blue-50"
                iconColor="text-blue-500"
              />
              <InfoRow
                icon={Phone}
                label="Nomor HP"
                value={student.phone ?? "Belum diatur"}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-500"
              />
              <InfoRow
                icon={Hash}
                label="NIS"
                value={student.nis}
                iconBg="bg-slate-100"
                iconColor="text-slate-500"
              />
              <InfoRow
                icon={GraduationCap}
                label="Kelas"
                value={student.class_name}
                iconBg="bg-purple-50"
                iconColor="text-purple-500"
              />
              <InfoRow
                icon={BookOpen}
                label="Jurusan"
                value={student.department_name}
                iconBg="bg-amber-50"
                iconColor="text-amber-500"
              />
              <InfoRow
                icon={MapPin}
                label="Alamat"
                value={student.address ?? "Belum diatur"}
                iconBg="bg-rose-50"
                iconColor="text-rose-500"
              />
            </div>
          </motion.div>

          {/* Parent data */}
          {(student.parent_name || student.parent_phone) && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm"
            >
              <div className="flex items-center gap-2.5 px-5 pt-4 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 bg-pink-100 rounded-xl flex items-center justify-center">
                  <User className="w-4 h-4 text-pink-600" strokeWidth={2} />
                </div>
                <p className="text-sm font-bold text-slate-900">Data Orang Tua</p>
              </div>
              <div className="px-5 py-2">
                <InfoRow
                  icon={User}
                  label="Nama Orang Tua / Wali"
                  value={student.parent_name ?? "Belum diatur"}
                  iconBg="bg-pink-50"
                  iconColor="text-pink-500"
                />
                <InfoRow
                  icon={Phone}
                  label="HP Orang Tua / Wali"
                  value={student.parent_phone ?? "Belum diatur"}
                  iconBg="bg-pink-50"
                  iconColor="text-pink-500"
                />
              </div>
            </motion.div>
          )}

          {/* Settings */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm"
          >
            <div className="flex items-center gap-2.5 px-5 pt-4 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center">
                <Settings className="w-4 h-4 text-slate-600" strokeWidth={2} />
              </div>
              <p className="text-sm font-bold text-slate-900">Pengaturan</p>
            </div>
            <div className="px-2 py-2">
              <SettingsItem
                icon={Bell}
                label="Notifikasi"
                description="Atur preferensi notifikasi push"
                iconBg="bg-blue-100"
                iconColor="text-blue-600"
                onClick={() =>
                  toast.info("Pengaturan notifikasi", {
                    description: "Fitur ini akan segera tersedia.",
                  })
                }
              />
              <SettingsItem
                icon={Lock}
                label="Ubah Password"
                description="Ganti password akun Anda"
                iconBg="bg-amber-100"
                iconColor="text-amber-600"
                onClick={() =>
                  toast.info("Ubah password", {
                    description:
                      "Silakan hubungi administrator untuk mengubah password.",
                  })
                }
              />
              <SettingsItem
                icon={Shield}
                label="Privasi & Keamanan"
                description="Kelola data dan izin akses"
                iconBg="bg-emerald-100"
                iconColor="text-emerald-600"
                onClick={() =>
                  toast.info("Privasi & Keamanan", {
                    description: "Fitur ini akan segera tersedia.",
                  })
                }
              />
              <SettingsItem
                icon={HelpCircle}
                label="Bantuan & Dukungan"
                description="FAQ dan kontak tim support"
                iconBg="bg-purple-100"
                iconColor="text-purple-600"
                onClick={() =>
                  toast.info("Bantuan", {
                    description:
                      "Hubungi tim IT sekolah untuk bantuan teknis.",
                  })
                }
              />
              <SettingsItem
                icon={FileText}
                label="Ketentuan Penggunaan"
                description="Syarat & ketentuan aplikasi"
                iconBg="bg-slate-100"
                iconColor="text-slate-500"
                onClick={() =>
                  toast.info("Ketentuan Penggunaan", {
                    description: "Fitur ini akan segera tersedia.",
                  })
                }
              />
            </div>
          </motion.div>

          {/* App version */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center py-2"
          >
            <p className="text-xs text-slate-400 font-medium">
              PKL SMK HASSINA v1.0.0
            </p>
            <p className="text-[11px] text-slate-300 mt-0.5">
              © {new Date().getFullYear()} SMK HASSINA
            </p>
          </motion.div>

          {/* Sign out */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm"
          >
            <div className="px-2 py-2">
              <SettingsItem
                icon={LogOut}
                label="Keluar dari Akun"
                description="Logout dan kembali ke halaman login"
                iconBg="bg-red-100"
                iconColor="text-red-600"
                onClick={() => setShowSignOutConfirm(true)}
                destructive
              />
            </div>
          </motion.div>

          <div className="h-4" />
        </div>
      </div>

      {/* ── Edit Profile Modal ─────────────────────────── */}
      <EditProfileModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        student={student}
        onSave={handleSaveProfile}
      />

      {/* ── Sign Out Confirm ───────────────────────────── */}
      <AnimatePresence>
        {showSignOutConfirm && (
          <>
            <motion.div
              key="so-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm"
              onClick={() => !signingOut && setShowSignOutConfirm(false)}
            />
            <motion.div
              key="so-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
              className="fixed z-50 inset-x-5 bottom-20 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-sm"
            >
              <div className="bg-white rounded-3xl p-6 shadow-2xl">
                <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <LogOut className="w-7 h-7 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 text-center mb-1.5">
                  Keluar dari Akun?
                </h3>
                <p className="text-sm text-slate-500 text-center leading-relaxed mb-6">
                  Anda akan keluar dari aplikasi PKL SMK HASSINA. Semua data
                  lokal akan dihapus dari perangkat ini.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowSignOutConfirm(false)}
                    disabled={signingOut}
                    className="h-11 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 active:scale-[0.97] transition-all disabled:opacity-50 tap-highlight-none"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className={cn(
                      "h-11 rounded-xl text-white text-sm font-bold",
                      "flex items-center justify-center gap-2",
                      "bg-red-600 hover:bg-red-700",
                      "active:scale-[0.97] transition-all",
                      "shadow-md shadow-red-200",
                      "disabled:opacity-60 disabled:pointer-events-none",
                      "tap-highlight-none"
                    )}
                  >
                    {signingOut ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Keluar...
                      </>
                    ) : (
                      <>
                        <LogOut className="w-4 h-4" />
                        Ya, Keluar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
