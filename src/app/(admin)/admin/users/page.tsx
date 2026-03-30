"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  X,
  Plus,
  ChevronRight,
  ArrowLeft,
  Shield,
  GraduationCap,
  BookUser,
  UserCheck,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  Upload,
  Download,
  FileSpreadsheet,
  Save,
  Mail,
  Lock,
  AlertCircle,
  Hash,
  BookOpen,
  Building2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";

type UserRole = "super_admin" | "ketua_jurusan" | "guru_pembimbing" | "siswa";

interface UserItem {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

const ROLE_CFG: Record<UserRole, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  super_admin:      { label: "Super Admin",      color: "text-red-700",     bg: "bg-red-50",     icon: Shield },
  ketua_jurusan:    { label: "Ketua Jurusan",    color: "text-purple-700",  bg: "bg-purple-50",  icon: BookUser },
  guru_pembimbing:  { label: "Guru Pembimbing",  color: "text-blue-700",    bg: "bg-blue-50",    icon: UserCheck },
  siswa:            { label: "Siswa",            color: "text-emerald-700", bg: "bg-emerald-50", icon: GraduationCap },
};

const VALID_ROLES: UserRole[] = ["siswa", "guru_pembimbing", "ketua_jurusan", "super_admin"];

/* ── Tambah User Form ────────────────────────────────────── */

function AddUserForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const supabase = createClient();
  const [form, setForm] = useState({ email: "", password: "", full_name: "", role: "siswa" as UserRole, phone: "" });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.email?.trim() || !form.password?.trim() || !form.full_name?.trim()) {
      toast.error("Email, password, dan nama lengkap wajib diisi");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }
    setSaving(true);
    try {
      // Gunakan Supabase Admin API via signUp (client-side workaround)
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            full_name: form.full_name.trim(),
            role: form.role,
          },
        },
      });
      if (error) throw error;

      // Update profile role & phone
      if (data.user) {
        await supabase.from("profiles").update({
          full_name: form.full_name.trim(),
          role: form.role,
          phone: form.phone?.trim() || null,
        }).eq("id", data.user.id);
      }

      toast.success(`User "${form.full_name}" berhasil ditambahkan ✅`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menambah user";
      toast.error(msg);
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
        <h1 className="text-[16px] font-bold text-slate-900 flex-1">Tambah Pengguna</h1>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-3 h-8 rounded-xl bg-blue-600 text-white text-xs font-bold disabled:opacity-60">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Simpan
        </button>
      </header>

      <div className="px-4 py-5 max-w-2xl mx-auto space-y-4 pb-28">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email *</p>
          </div>
          <input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="user@sekolah.id" type="email"
            className="w-full text-sm text-slate-800 placeholder:text-slate-400 outline-none bg-transparent" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password *</p>
          </div>
          <input value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Minimal 6 karakter" type="password"
            className="w-full text-sm text-slate-800 placeholder:text-slate-400 outline-none bg-transparent" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap *</p>
          </div>
          <input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Nama lengkap"
            className="w-full text-sm text-slate-800 placeholder:text-slate-400 outline-none bg-transparent" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">No. HP (Opsional)</p>
          </div>
          <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="08xxxxxxxxxx"
            className="w-full text-sm text-slate-800 placeholder:text-slate-400 outline-none bg-transparent" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Role *</p>
          <div className="grid grid-cols-2 gap-2">
            {VALID_ROLES.map((r) => {
              const cfg = ROLE_CFG[r];
              const Icon = cfg.icon;
              return (
                <button key={r} onClick={() => set("role", r)}
                  className={cn("flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left",
                    form.role === r ? "border-blue-500 bg-blue-50" : "border-slate-200")}>
                  <Icon className={cn("w-4 h-4", form.role === r ? "text-blue-600" : cfg.color)} />
                  <span className={cn("text-xs font-bold", form.role === r ? "text-blue-700" : "text-slate-700")}>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Import Excel Modal ──────────────────────────────────── */

interface ImportRow {
  email: string;
  password: string;
  full_name: string;
  role: string;
  phone?: string;
  status?: "pending" | "success" | "error";
  message?: string;
}

function ImportExcelPanel({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json<Record<string, string>>(ws);

        // Validate rows
        const parsed: ImportRow[] = data
          .filter((r) => r.email && r.full_name)
          .map((r) => ({
            email: String(r.email ?? "").trim(),
            password: String(r.password ?? "").trim(),
            full_name: String(r.full_name ?? "").trim(),
            role: String(r.role ?? "siswa").trim().toLowerCase(),
            phone: r.phone ? String(r.phone).trim() : undefined,
            status: "pending" as const,
          }));

        if (parsed.length === 0) {
          toast.error("File kosong atau format tidak sesuai");
          return;
        }

        // Validate each row
        parsed.forEach((r) => {
          if (!r.email.includes("@")) {
            r.status = "error";
            r.message = "Email tidak valid";
          } else if (!r.password || r.password.length < 6) {
            r.status = "error";
            r.message = "Password minimal 6 karakter";
          } else if (!VALID_ROLES.includes(r.role as UserRole)) {
            r.status = "error";
            r.message = `Role tidak valid: ${r.role}`;
          }
        });

        setRows(parsed);
        toast.success(`${parsed.length} baris data ditemukan`);
      } catch {
        toast.error("Gagal membaca file Excel");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    const validRows = rows.filter((r) => r.status === "pending");
    if (validRows.length === 0) {
      toast.error("Tidak ada data valid untuk diimpor");
      return;
    }

    setImporting(true);
    setProgress({ done: 0, total: validRows.length });

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.status !== "pending") continue;

      try {
        const { data, error } = await supabase.auth.signUp({
          email: row.email,
          password: row.password,
          options: {
            data: { full_name: row.full_name, role: row.role },
          },
        });
        if (error) throw error;

        // Update profile
        if (data.user) {
          await supabase.from("profiles").update({
            full_name: row.full_name,
            role: row.role as UserRole,
            phone: row.phone || null,
          }).eq("id", data.user.id);
        }

        setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, status: "success" as const, message: "Berhasil" } : r));
        successCount++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Gagal";
        setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, status: "error" as const, message: msg } : r));
        errorCount++;
      }

      setProgress((prev) => ({ ...prev, done: prev.done + 1 }));
    }

    setImporting(false);
    toast.success(`Import selesai: ${successCount} berhasil, ${errorCount} gagal`);
    if (successCount > 0) onSuccess();
  };

  const pendingCount = rows.filter((r) => r.status === "pending").length;
  const successCount = rows.filter((r) => r.status === "success").length;
  const errorCount = rows.filter((r) => r.status === "error").length;

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
        <h1 className="text-[16px] font-bold text-slate-900 flex-1">Import dari Excel</h1>
        {rows.length > 0 && pendingCount > 0 && (
          <button onClick={handleImport} disabled={importing}
            className="flex items-center gap-1.5 px-3 h-8 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-60">
            {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Import ({pendingCount})
          </button>
        )}
      </header>

      <div className="px-4 py-5 max-w-2xl mx-auto space-y-4 pb-28">
        {/* Download template */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-5.5 h-5.5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">Template Excel</p>
              <p className="text-[11px] text-slate-400">Download dan isi data pengguna</p>
            </div>
            <a href="/template-import-user.xlsx" download
              className="flex items-center gap-1.5 px-3 h-8 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors">
              <Download className="w-3 h-3" />
              Download
            </a>
          </div>
        </div>

        {/* Upload file */}
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm p-6">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
          <button onClick={() => fileInputRef.current?.click()} className="w-full text-center">
            <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Upload File Excel</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Klik untuk memilih file .xlsx</p>
          </button>
        </div>

        {/* Progress bar */}
        {importing && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-600">Mengimpor pengguna...</p>
              <p className="text-xs text-slate-500">{progress.done}/{progress.total}</p>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${(progress.done / progress.total) * 100}%` }} />
            </div>
          </div>
        )}

        {/* Summary badges */}
        {rows.length > 0 && (
          <div className="flex gap-2">
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">{rows.length} total</span>
            {pendingCount > 0 && <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600">{pendingCount} siap</span>}
            {successCount > 0 && <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600">{successCount} berhasil</span>}
            {errorCount > 0 && <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-red-50 text-red-600">{errorCount} gagal</span>}
          </div>
        )}

        {/* Preview rows */}
        {rows.length > 0 && (
          <div className="space-y-2">
            {rows.map((row, i) => (
              <div key={i} className={cn(
                "bg-white rounded-2xl border shadow-sm p-3.5 flex items-center gap-3",
                row.status === "success" ? "border-emerald-200" : row.status === "error" ? "border-red-200" : "border-slate-100"
              )}>
                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
                  row.status === "success" ? "bg-emerald-100" : row.status === "error" ? "bg-red-100" : "bg-slate-100")}>
                  {row.status === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> :
                   row.status === "error" ? <AlertCircle className="w-4 h-4 text-red-600" /> :
                   <span className="text-xs font-bold text-slate-500">{i + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{row.full_name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{row.email}</p>
                  {row.message && row.status === "error" && (
                    <p className="text-[11px] text-red-500 font-medium mt-0.5">{row.message}</p>
                  )}
                </div>
                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0",
                  ROLE_CFG[row.role as UserRole]?.bg ?? "bg-slate-100",
                  ROLE_CFG[row.role as UserRole]?.color ?? "text-slate-600")}>
                  {ROLE_CFG[row.role as UserRole]?.label ?? row.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Student Data Section ────────────────────────────────── */

interface StudentRecord {
  id?: string;
  nis: string;
  department_id: string | null;
  class_id: string | null;
  address: string;
  parent_name: string;
  parent_phone: string;
}

function StudentDataSection({ profileId }: { profileId: string }) {
  const supabase = createClient();
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [departments, setDepartments] = useState<{ id: string; name: string; code: string }[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string; department_id: string | null }[]>([]);
  const [form, setForm] = useState<StudentRecord>({
    nis: "", department_id: null, class_id: null, address: "", parent_name: "", parent_phone: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof StudentRecord, v: string | null) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      const [stuRes, deptRes, clsRes] = await Promise.all([
        supabase.from("students").select("id, nis, department_id, class_id, address, parent_name, parent_phone")
          .eq("profile_id", profileId).maybeSingle(),
        supabase.from("departments").select("id, name, code").order("code"),
        supabase.from("classes").select("id, name, department_id").order("name"),
      ]);
      setDepartments((deptRes.data ?? []) as { id: string; name: string; code: string }[]);
      setClasses((clsRes.data ?? []) as { id: string; name: string; department_id: string | null }[]);
      if (stuRes.data) {
        setStudent(stuRes.data as StudentRecord);
        setForm(stuRes.data as StudentRecord);
      }
      setLoading(false);
    };
    loadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  const filteredClasses = form.department_id
    ? classes.filter((c) => c.department_id === form.department_id)
    : classes;

  const handleSave = async () => {
    if (!form.nis?.trim()) { toast.error("NIS wajib diisi"); return; }
    setSaving(true);
    try {
      const payload = {
        profile_id: profileId,
        nis: form.nis.trim(),
        department_id: form.department_id,
        class_id: form.class_id,
        address: form.address?.trim() || null,
        parent_name: form.parent_name?.trim() || null,
        parent_phone: form.parent_phone?.trim() || null,
      };
      if (student?.id) {
        const { error } = await supabase.from("students").update(payload).eq("id", student.id);
        if (error) throw error;
      } else {
        const { data: newStu, error } = await supabase.from("students").insert(payload).select().single();
        if (error) throw error;
        setStudent(newStu as StudentRecord);
      }
      toast.success("Data siswa disimpan ✅");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
        <div className="h-8 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-8 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-emerald-50">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-emerald-600" />
          <p className="text-sm font-bold text-emerald-800">Data Siswa</p>
        </div>
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full",
          student?.id ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
          {student?.id ? "✓ Sudah diisi" : "⚠ Belum diisi"}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* NIS */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Hash className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">NIS *</p>
          </div>
          <input value={form.nis ?? ""} onChange={(e) => set("nis", e.target.value)}
            placeholder="Nomor Induk Siswa"
            className="w-full text-sm text-slate-800 placeholder:text-slate-300 outline-none border border-slate-200 rounded-xl px-3 py-2.5" />
        </div>

        {/* Jurusan */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jurusan</p>
          </div>
          {departments.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Belum ada jurusan. Buat jurusan dulu di menu Jurusan.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { set("department_id", null); set("class_id", null); }}
                className={cn("px-3 h-8 rounded-full text-xs font-bold transition-all",
                  !form.department_id ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600")}>
                Belum ditentukan
              </button>
              {departments.map((d) => (
                <button key={d.id} onClick={() => { set("department_id", d.id); set("class_id", null); }}
                  className={cn("px-3 h-8 rounded-full text-xs font-bold transition-all",
                    form.department_id === d.id ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600")}>
                  {d.code}
                </button>
              ))}
            </div>
          )}
          {form.department_id && (
            <p className="text-xs text-emerald-700 font-medium mt-1.5">
              {departments.find((d) => d.id === form.department_id)?.name}
            </p>
          )}
        </div>

        {/* Kelas */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kelas</p>
          </div>
          {filteredClasses.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              {form.department_id ? "Belum ada kelas untuk jurusan ini" : "Pilih jurusan dulu untuk melihat kelas"}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => set("class_id", null)}
                className={cn("px-3 h-8 rounded-full text-xs font-bold transition-all",
                  !form.class_id ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600")}>
                Belum ditentukan
              </button>
              {filteredClasses.map((c) => (
                <button key={c.id} onClick={() => set("class_id", c.id)}
                  className={cn("px-3 h-8 rounded-full text-xs font-bold transition-all",
                    form.class_id === c.id ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600")}>
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Alamat */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Alamat</p>
          <input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)}
            placeholder="Jl. Contoh No. 1, Kota"
            className="w-full text-sm text-slate-800 placeholder:text-slate-300 outline-none border border-slate-200 rounded-xl px-3 py-2.5" />
        </div>

        {/* Orang tua */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Ortu</p>
            <input value={form.parent_name ?? ""} onChange={(e) => set("parent_name", e.target.value)}
              placeholder="Nama Orang Tua"
              className="w-full text-sm text-slate-800 placeholder:text-slate-300 outline-none border border-slate-200 rounded-xl px-3 py-2.5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">HP Ortu</p>
            <input value={form.parent_phone ?? ""} onChange={(e) => set("parent_phone", e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="w-full text-sm text-slate-800 placeholder:text-slate-300 outline-none border border-slate-200 rounded-xl px-3 py-2.5" />
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full h-11 rounded-2xl bg-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-60 transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {student?.id ? "Perbarui Data Siswa" : "Simpan Data Siswa"}
        </button>
      </div>
    </div>
  );
}

/* ── User Detail ──────────────────────────────────────── */

function UserDetail({
  user, onClose, onToggleStatus, toggling,
}: {
  user: UserItem; onClose: () => void;
  onToggleStatus: (id: string, active: boolean) => Promise<void>; toggling: boolean;
}) {
  const rc = ROLE_CFG[user.role];
  const RoleIcon = rc.icon;

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
        <h1 className="text-[16px] font-bold text-slate-900 flex-1">Detail Pengguna</h1>
        <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold", rc.bg, rc.color)}>{rc.label}</span>
      </header>

      <div className="px-4 py-5 max-w-2xl mx-auto space-y-4 pb-28">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{user.full_name.charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{user.full_name}</h2>
              <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold mt-1", rc.bg, rc.color)}>
                <RoleIcon className="w-3 h-3" />{rc.label}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            {user.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /><p className="text-sm text-slate-700">{user.phone}</p></div>}
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /><p className="text-sm text-slate-500">Bergabung {formatDate(user.created_at, "dd MMMM yyyy")}</p></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Status Akun</p>
              <p className={cn("text-xs font-medium mt-0.5", user.is_active ? "text-emerald-600" : "text-red-600")}>
                {user.is_active ? "✓ Aktif" : "✗ Nonaktif"}
              </p>
            </div>
            <button
              onClick={() => onToggleStatus(user.id, user.is_active)}
              disabled={toggling || user.role === "super_admin"}
              className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50",
                user.is_active ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
              )}
            >
              {toggling ? <Loader2 className="w-4 h-4 animate-spin" /> : user.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {user.is_active ? "Nonaktifkan" : "Aktifkan"}
            </button>
          </div>
          {user.role === "super_admin" && <p className="text-[11px] text-slate-400 mt-2">Status Super Admin tidak dapat diubah</p>}
        </div>

        {/* Siswa data section */}
        {user.role === "siswa" && <StudentDataSection profileId={user.id} />}

      </div>
    </motion.div>
  );
}

/* ── User Card ──────────────────────────────────────────── */

function UserCard({ user, index, onClick }: { user: UserItem; index: number; onClick: () => void }) {
  const rc = ROLE_CFG[user.role];
  const RoleIcon = rc.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}>
      <button onClick={onClick}
        className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-px active:scale-[0.98] transition-all flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center flex-shrink-0">
          <span className="text-base font-bold text-white">{user.full_name.charAt(0)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-slate-900 flex-1 truncate">{user.full_name}</p>
            {!user.is_active && <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-full flex-shrink-0">Nonaktif</span>}
          </div>
          <p className="text-[11px] text-slate-500 truncate">{user.phone ?? rc.label}</p>
          <span className={cn("inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold", rc.bg, rc.color)}>
            <RoleIcon className="w-2.5 h-2.5" />{rc.label}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
      </button>
    </motion.div>
  );
}

/* ── Main Page ──────────────────────────────────────────── */

type Panel = "none" | "add" | "import";

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all");
  const [selected, setSelected] = useState<UserItem | null>(null);
  const [toggling, setToggling] = useState(false);
  const [panel, setPanel] = useState<Panel>("none");

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, role, is_active, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      setUsers((data ?? []) as UserItem[]);
    } catch {
      toast.error("Gagal memuat data pengguna");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleToggleStatus = async (id: string, currentActive: boolean) => {
    setToggling(true);
    try {
      const { error } = await supabase.from("profiles").update({ is_active: !currentActive }).eq("id", id);
      if (error) throw error;
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, is_active: !currentActive } : u));
      setSelected((prev) => prev?.id === id ? { ...prev, is_active: !currentActive } : prev);
      toast.success(currentActive ? "Akun dinonaktifkan" : "Akun diaktifkan ✅");
    } catch {
      toast.error("Gagal mengubah status akun");
    } finally {
      setToggling(false);
    }
  };

  const filtered = useMemo(() => {
    let r = [...users];
    if (filterRole !== "all") r = r.filter((u) => u.role === filterRole);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((u) => u.full_name.toLowerCase().includes(q) || (u.phone ?? "").toLowerCase().includes(q));
    }
    return r;
  }, [users, filterRole, search]);

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-extrabold text-slate-900">Manajemen Pengguna</h1>
              <p className="text-xs text-slate-400 mt-px">{users.length} pengguna terdaftar</p>
            </div>
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.88 }} onClick={() => loadData(true)} disabled={refreshing}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500">
                <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
              </motion.button>
              <button onClick={() => setPanel("import")}
                className="h-9 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-700 transition-colors">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Import
              </button>
              <button onClick={() => setPanel("add")}
                className="h-9 px-3 rounded-xl bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-slate-700 transition-colors">
                <Plus className="w-3.5 h-3.5" />
                Tambah
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3.5 h-12 rounded-2xl bg-white border border-slate-200">
            <Search className="w-4 h-4 text-slate-400" />
            <input type="search" placeholder="Cari nama atau telepon..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none text-slate-800 placeholder:text-slate-400" />
            {search && <button onClick={() => setSearch("")} className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center"><X className="w-3 h-3 text-slate-500" /></button>}
          </div>

          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
            {(["all", "super_admin", "ketua_jurusan", "guru_pembimbing", "siswa"] as (UserRole | "all")[]).map((role) => {
              const cnt = role === "all" ? users.length : users.filter((u) => u.role === role).length;
              return (
                <button key={role} onClick={() => setFilterRole(role)}
                  className={cn("flex-shrink-0 px-4 h-8 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5",
                    filterRole === role ? "bg-slate-800 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600")}>
                  {role === "all" ? "Semua" : ROLE_CFG[role].label}
                  <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                    filterRole === role ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500")}>{cnt}</span>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500">Tidak ada pengguna ditemukan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((u, i) => <UserCard key={u.id} user={u} index={i} onClick={() => setSelected(u)} />)}
            </div>
          )}

          <div className="h-4" />
        </div>
      </div>

      <AnimatePresence>
        {selected && <UserDetail user={selected} onClose={() => setSelected(null)} onToggleStatus={handleToggleStatus} toggling={toggling} />}
        {panel === "add" && <AddUserForm onClose={() => setPanel("none")} onSuccess={() => loadData(true)} />}
        {panel === "import" && <ImportExcelPanel onClose={() => setPanel("none")} onSuccess={() => loadData(true)} />}
      </AnimatePresence>
    </>
  );
}
