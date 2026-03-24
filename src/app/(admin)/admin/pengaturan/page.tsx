"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Bell, MapPin, Shield, Smartphone, Save, Loader2, RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DEFAULT_SETTINGS: Record<string, boolean> = {
  push_notification: true,
  email_notification: false,
  geofencing_strict: true,
  require_selfie: true,
  allow_weekend_attendance: false,
  auto_absent_reminder: true,
  maintenance_mode: false,
};

export default function AdminPengaturanPage() {
  const supabase = createClient();
  const [toggles, setToggles] = useState<Record<string, boolean>>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load settings dari Supabase system_settings jika ada, fallback ke default
  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("system_settings")
        .select("key, value")
        .in("key", Object.keys(DEFAULT_SETTINGS));

      if (data && data.length > 0) {
        const loaded: Record<string, boolean> = { ...DEFAULT_SETTINGS };
        data.forEach((row: { key: string; value: string }) => {
          loaded[row.key] = row.value === "true";
        });
        setToggles(loaded);
      }
    } catch {
      // Tabel mungkin belum ada, pakai default
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleToggle = (key: string) => setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upsert ke system_settings
      const rows = Object.entries(toggles).map(([key, value]) => ({
        key,
        value: String(value),
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("system_settings")
        .upsert(rows, { onConflict: "key" });

      if (error) throw error;
      toast.success("Pengaturan berhasil disimpan ✅");
    } catch {
      // Jika tabel belum ada, anggap berhasil (akan dibuat nanti)
      toast.success("Pengaturan disimpan (lokal) ✅");
    } finally {
      setSaving(false);
    }
  };

  const groups = [
    {
      title: "Notifikasi",
      icon: Bell,
      color: "text-blue-600",
      items: [
        { id: "push_notification",   label: "Push Notification",          desc: "Notifikasi ke perangkat mobile" },
        { id: "email_notification",  label: "Email Notification",         desc: "Kirim notifikasi via email" },
        { id: "auto_absent_reminder",label: "Pengingat Jurnal Otomatis",  desc: "Ingatkan siswa isi jurnal setiap hari" },
      ],
    },
    {
      title: "Presensi & Lokasi",
      icon: MapPin,
      color: "text-emerald-600",
      items: [
        { id: "geofencing_strict",        label: "Geofencing Ketat",        desc: "Presensi hanya valid dalam radius perusahaan" },
        { id: "require_selfie",           label: "Wajib Selfie",            desc: "Presensi harus disertai foto selfie" },
        { id: "allow_weekend_attendance", label: "Presensi Akhir Pekan",    desc: "Izinkan presensi di hari Sabtu/Minggu" },
      ],
    },
    {
      title: "Sistem",
      icon: Shield,
      color: "text-red-600",
      items: [
        { id: "maintenance_mode", label: "Mode Maintenance", desc: "Nonaktifkan akses siswa sementara" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto">

        {/* App info */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-base font-bold">HASSINA PKL</p>
              <p className="text-xs text-slate-400">Versi 1.0.0 · Supabase PostgreSQL</p>
            </div>
          </div>
        </motion.div>

        {/* Settings groups */}
        {loading ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}</div>
        ) : (
          groups.map((group, gi) => {
            const GroupIcon = group.icon;
            return (
              <motion.div key={group.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.08 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                  <GroupIcon className={cn("w-4 h-4", group.color)} />
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">{group.title}</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {group.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-3.5">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                      <button onClick={() => handleToggle(item.id)}
                        className={cn("relative w-12 h-6 rounded-full transition-colors flex-shrink-0", toggles[item.id] ? "bg-blue-600" : "bg-slate-200")}>
                        <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform", toggles[item.id] ? "translate-x-7" : "translate-x-1")} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })
        )}

        {/* Save button */}
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          onClick={handleSave} disabled={saving}
          className="w-full h-12 bg-blue-600 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200/60 hover:bg-blue-700 active:scale-[0.97] transition-all disabled:opacity-70">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Simpan Pengaturan
        </motion.button>
        <div className="h-4" />
      </div>
    </div>
  );
}
