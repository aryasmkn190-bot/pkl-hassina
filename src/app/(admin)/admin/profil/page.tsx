"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronRight, LogOut, Bell, Lock, Shield, Database, Activity, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { cn, getInitials, stringToAvatarColor } from "@/lib/utils";

export default function AdminProfilPage() {
  const router = useRouter();
  const { profile, clearAuth } = useAuthStore();
  const supabase = createClient();
  const [showSignOut, setShowSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [stats, setStats] = useState({ totalUsers: 0, activeSiswa: 0, totalCompanies: 0 });

  const fullName = profile?.full_name ?? "Administrator";

  const email = (profile as { email?: string })?.email ?? "admin@hassina.sch.id";
  const colorClass = stringToAvatarColor(fullName);

  useEffect(() => {
    const load = async () => {
      try {
        const [uRes, assignRes, cRes] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("pkl_assignments").select("id", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("companies").select("id", { count: "exact", head: true }).eq("is_active", true),
        ]);
        setStats({ totalUsers: uRes.count ?? 0, activeSiswa: assignRes.count ?? 0, totalCompanies: cRes.count ?? 0 });
      } catch { /* ignore */ }
    };
    load();
  }, []);

  const STATS = [
    { label: "Total User",   value: String(stats.totalUsers),   color: "text-blue-600" },
    { label: "Siswa Aktif", value: String(stats.activeSiswa),  color: "text-emerald-600" },
    { label: "Mitra",       value: String(stats.totalCompanies), color: "text-amber-600" },
    { label: "Uptime",      value: "99%",                       color: "text-purple-600" },
  ];

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    clearAuth();
    router.replace("/login");
  };

  const MENU = [
    { icon: Bell,     label: "Notifikasi Sistem", desc: "Konfigurasi notifikasi push & email", iconBg: "bg-blue-100",   iconColor: "text-blue-600" },
    { icon: Lock,     label: "Ubah Password",     desc: "Ganti kata sandi admin",             iconBg: "bg-purple-100", iconColor: "text-purple-600" },
    { icon: Database, label: "Backup & Restore",  desc: "Backup database dan restore data",   iconBg: "bg-emerald-100",iconColor: "text-emerald-600" },
    { icon: Activity, label: "Log Aktivitas",     desc: "Riwayat aktivitas sistem",           iconBg: "bg-amber-100",  iconColor: "text-amber-600" },
    { icon: Shield,   label: "Keamanan Sistem",   desc: "Pengaturan keamanan dan akses",      iconBg: "bg-red-100",   iconColor: "text-red-600" },
  ];

  return (
    <>
      <div className="min-h-screen bg-slate-50 pb-8">
        <div className="bg-gradient-to-b from-slate-800 to-slate-900 px-4 pt-6 pb-16">
          <div className="flex items-center gap-4">
            <div className={cn("w-20 h-20 rounded-3xl flex items-center justify-center border-4 border-white shadow-xl flex-shrink-0", colorClass)}>
              <span className="text-2xl font-extrabold text-white">{getInitials(fullName)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-white truncate">{fullName}</h1>
              <div className="inline-flex items-center gap-1.5 bg-red-500/20 border border-red-400/30 rounded-full px-2.5 py-0.5 mt-1">
                <Shield className="w-3 h-3 text-red-300" />
                <span className="text-xs font-bold text-red-300">Super Admin</span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5 truncate">{email}</p>
            </div>
          </div>
        </div>

        <div className="px-4 -mt-8 space-y-4 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-4 bg-white rounded-2xl border border-slate-100 shadow-sm divide-x divide-slate-100 overflow-hidden"
          >
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col items-center py-4 px-1">
                <p className={cn("text-lg font-bold", s.color)}>{s.value}</p>
                <p className="text-[9px] text-slate-500 text-center mt-0.5 leading-tight">{s.label}</p>
              </div>
            ))}
          </motion.div>

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
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", item.iconBg)}><Icon className={cn("w-4.5 h-4.5", item.iconColor)} /></div>
                  <div className="flex-1 text-left"><p className="text-sm font-semibold text-slate-800">{item.label}</p><p className="text-xs text-slate-500">{item.desc}</p></div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              );
            })}
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            onClick={() => setShowSignOut(true)}
            className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-red-100 shadow-sm hover:bg-red-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center"><LogOut className="w-4.5 h-4.5 text-red-600" /></div>
            <div className="flex-1 text-left"><p className="text-sm font-semibold text-red-600">Keluar</p><p className="text-xs text-red-400">Sign out dari admin panel</p></div>
            <ChevronRight className="w-4 h-4 text-red-300" />
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showSignOut && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/40" onClick={() => setShowSignOut(false)} />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-24 left-4 right-4 z-[70] bg-white rounded-3xl p-5 shadow-2xl max-w-sm mx-auto">
              <p className="text-base font-bold text-slate-900 mb-1">Keluar dari Admin Panel?</p>
              <p className="text-xs text-slate-500 mb-4">Semua sesi aktif akan diakhiri</p>
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
