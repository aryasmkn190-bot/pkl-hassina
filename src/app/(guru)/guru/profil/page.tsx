"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Camera,
  Edit2,
  LogOut,
  ChevronRight,
  Bell,
  Shield,
  Lock,
  BookOpen,
  CalendarCheck,
  Star,
  Users,
  AlertCircle,
  X,
  Save,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { cn, getInitials, stringToAvatarColor } from "@/lib/utils";
import { toast } from "sonner";

export default function GuruProfilPage() {
  const router = useRouter();
  const { profile, clearAuth } = useAuthStore();
  const supabase = createClient();

  const [showSignOut, setShowSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const fullName = profile?.full_name ?? "Guru Pembimbing";
  const email = (profile as { email?: string })?.email ?? "guru@hassina.sch.id";
  const colorClass = stringToAvatarColor(fullName);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      clearAuth();
      router.replace("/login");
    } finally {
      setSigningOut(false);
    }
  };

  const STATS = [
    { label: "Siswa Bimbingan", value: "5", icon: Users, color: "text-blue-600" },
    { label: "Jurnal Direview", value: "48", icon: BookOpen, color: "text-purple-600" },
    { label: "Presensi Diverifikasi", value: "124", icon: CalendarCheck, color: "text-emerald-600" },
    { label: "Penilaian Selesai", value: "3", icon: Star, color: "text-amber-600" },
  ];

  const MENU = [
    { icon: Bell, label: "Notifikasi", desc: "Atur preferensi notifikasi", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
    { icon: Lock, label: "Ubah Password", desc: "Ganti kata sandi akun", iconBg: "bg-purple-100", iconColor: "text-purple-600" },
    { icon: Shield, label: "Keamanan Akun", desc: "Verifikasi 2 langkah dan sesi aktif", iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
  ];

  return (
    <>
      <div className="min-h-screen bg-slate-50 pb-8">
        {/* Hero */}
        <div className="bg-gradient-to-b from-blue-600 to-blue-500 px-4 pt-6 pb-16">
          <div className="flex items-center gap-4">
            <div className={cn("w-20 h-20 rounded-3xl flex items-center justify-center border-4 border-white shadow-xl flex-shrink-0", colorClass)}>
              <span className="text-2xl font-extrabold text-white">{getInitials(fullName)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-white truncate">{fullName}</h1>
              <p className="text-sm text-blue-100">Guru Pembimbing PKL</p>
              <p className="text-xs text-blue-200 mt-0.5 truncate">{email}</p>
            </div>
            <button
              onClick={() => setShowEdit(true)}
              className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center border border-white/30 text-white"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-4 -mt-8 space-y-4 max-w-2xl mx-auto">
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-4 bg-white rounded-2xl border border-slate-100 shadow-sm divide-x divide-slate-100 overflow-hidden"
          >
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex flex-col items-center py-4 px-1">
                  <Icon className={cn("w-4 h-4 mb-1", s.color)} />
                  <p className={cn("text-base font-bold", s.color)}>{s.value}</p>
                  <p className="text-[9px] text-slate-500 text-center mt-0.5 leading-tight">{s.label}</p>
                </div>
              );
            })}
          </motion.div>

          {/* Menu */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100"
          >
            {MENU.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.label} className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", item.iconBg)}>
                    <Icon className={cn("w-4.5 h-4.5", item.iconColor)} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              );
            })}
          </motion.div>

          {/* Sign out */}
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            onClick={() => setShowSignOut(true)}
            className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-red-100 shadow-sm hover:bg-red-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <LogOut className="w-4.5 h-4.5 text-red-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-red-600">Keluar</p>
              <p className="text-xs text-red-400">Sign out dari akun</p>
            </div>
            <ChevronRight className="w-4 h-4 text-red-300" />
          </motion.button>
        </div>
      </div>

      {/* Sign out confirm */}
      <AnimatePresence>
        {showSignOut && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowSignOut(false)} />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 left-4 right-4 z-50 bg-white rounded-3xl p-5 shadow-2xl max-w-sm mx-auto"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center"><LogOut className="w-5.5 h-5.5 text-red-600" /></div>
                <div><p className="text-base font-bold text-slate-900">Keluar?</p><p className="text-xs text-slate-500">Konfirmasi untuk sign out</p></div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowSignOut(false)} className="flex-1 h-12 rounded-2xl border border-slate-200 text-sm font-bold text-slate-700">Batal</button>
                <button onClick={handleSignOut} disabled={signingOut} className="flex-1 h-12 rounded-2xl bg-red-500 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                  {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                  Keluar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
