"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";

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

/* ── User Detail ──────────────────────────────────────── */

function UserDetail({
  user,
  onClose,
  onToggleStatus,
  toggling,
}: {
  user: UserItem;
  onClose: () => void;
  onToggleStatus: (id: string, active: boolean) => Promise<void>;
  toggling: boolean;
}) {
  const rc = ROLE_CFG[user.role];
  const RoleIcon = rc.icon;

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
        <h1 className="text-[16px] font-bold text-slate-900 flex-1">Detail Pengguna</h1>
        <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold", rc.bg, rc.color)}>
          {rc.label}
        </span>
      </header>

      <div className="px-4 py-5 max-w-2xl mx-auto space-y-4 pb-8">
        {/* Profile */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{user.full_name.charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{user.full_name}</h2>
              <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold mt-1", rc.bg, rc.color)}>
                <RoleIcon className="w-3 h-3" />
                {rc.label}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            {user.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /><p className="text-sm text-slate-700">{user.phone}</p></div>}
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /><p className="text-sm text-slate-500">Bergabung {formatDate(user.created_at, "dd MMMM yyyy")}</p></div>
          </div>
        </div>

        {/* Status toggle */}
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
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50",
                user.is_active ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
              )}
            >
              {toggling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : user.is_active ? (
                <XCircle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {user.is_active ? "Nonaktifkan" : "Aktifkan"}
            </button>
          </div>
          {user.role === "super_admin" && (
            <p className="text-[11px] text-slate-400 mt-2">Status Super Admin tidak dapat diubah</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── User Card ──────────────────────────────────────────── */

function UserCard({ user, index, onClick }: { user: UserItem; index: number; onClick: () => void }) {
  const rc = ROLE_CFG[user.role];
  const RoleIcon = rc.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
    >
      <button
        onClick={onClick}
        className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-px active:scale-[0.98] transition-all flex items-center gap-3"
      >
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
            <RoleIcon className="w-2.5 h-2.5" />
            {rc.label}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
      </button>
    </motion.div>
  );
}

/* ── Main Page ──────────────────────────────────────────── */

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all");
  const [selected, setSelected] = useState<UserItem | null>(null);
  const [toggling, setToggling] = useState(false);

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
    } catch (err) {
      console.error("loadUsers error:", err);
      toast.error("Gagal memuat data pengguna");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleStatus = async (id: string, currentActive: boolean) => {
    setToggling(true);
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !currentActive })
      .eq("id", id);

    if (error) {
      toast.error("Gagal mengubah status akun");
    } else {
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, is_active: !currentActive } : u));
      setSelected((prev) => prev?.id === id ? { ...prev, is_active: !currentActive } : prev);
      toast.success(currentActive ? "Akun dinonaktifkan" : "Akun diaktifkan ✅");
    }
    setToggling(false);
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
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => loadData(true)}
                disabled={refreshing}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500"
              >
                <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
              </motion.button>
              <button
                onClick={() => toast.info("Form tambah pengguna dalam pengembangan")}
                className="h-9 px-3 rounded-xl bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-slate-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3.5 h-12 rounded-2xl bg-white border border-slate-200">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="search"
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none text-slate-800 placeholder:text-slate-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
                <X className="w-3 h-3 text-slate-500" />
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
            {(["all", "super_admin", "ketua_jurusan", "guru_pembimbing", "siswa"] as (UserRole | "all")[]).map((role) => {
              const cnt = role === "all" ? users.length : users.filter((u) => u.role === role).length;
              return (
                <button
                  key={role}
                  onClick={() => setFilterRole(role)}
                  className={cn(
                    "flex-shrink-0 px-4 h-8 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5",
                    filterRole === role ? "bg-slate-800 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600"
                  )}
                >
                  {role === "all" ? "Semua" : ROLE_CFG[role].label}
                  <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                    filterRole === role ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500")}>
                    {cnt}
                  </span>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => <div key={i} className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500">Tidak ada pengguna ditemukan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((u, i) => (
                <UserCard key={u.id} user={u} index={i} onClick={() => setSelected(u)} />
              ))}
            </div>
          )}

          <div className="h-4" />
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <UserDetail
            user={selected}
            onClose={() => setSelected(null)}
            onToggleStatus={handleToggleStatus}
            toggling={toggling}
          />
        )}
      </AnimatePresence>
    </>
  );
}
