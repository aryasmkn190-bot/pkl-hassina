"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  GraduationCap,
  BookUser,
  Building2,
  Calendar,
  Activity,
  Clock,
  Shield,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { cn, formatRelativeTime } from "@/lib/utils";

interface DashboardStats {
  total_users: number;
  active_students: number;
  total_teachers: number;
  total_companies: number;
  pending_presensi: number;
  pending_jurnal: number;
  pending_izin: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  created_at: string;
}

const SYSTEM_STATUS = [
  { label: "Database", status: "Online", ok: true },
  { label: "Auth Service", status: "Online", ok: true },
  { label: "Storage", status: "Online", ok: true },
  { label: "Realtime", status: "Online", ok: true },
];

export default function AdminDashboardPage() {
  const { profile } = useAuthStore();
  const supabase = createClient();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const [
        usersRes,
        studentsRes,
        teachersRes,
        companiesRes,
        attendanceRes,
        journalRes,
        absenceRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("pkl_assignments").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "guru_pembimbing"),
        supabase.from("companies").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("attendance").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("journals").select("*", { count: "exact", head: true }).eq("status", "submitted"),
        supabase.from("absence_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      setStats({
        total_users: usersRes.count ?? 0,
        active_students: studentsRes.count ?? 0,
        total_teachers: teachersRes.count ?? 0,
        total_companies: companiesRes.count ?? 0,
        pending_presensi: attendanceRes.count ?? 0,
        pending_jurnal: journalRes.count ?? 0,
        pending_izin: absenceRes.count ?? 0,
      });

      // Recent notifications as activity feed
      const { data: notifData } = await supabase
        .from("notifications")
        .select("id, title, body, type, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      if (notifData) {
        setActivities(notifData.map((n) => ({
          id: n.id,
          type: n.type,
          description: n.title,
          created_at: n.created_at,
        })));
      }
    } catch (err) {
      console.error("adminDashboard load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summaryCards = stats
    ? [
        { label: "Total Pengguna", value: stats.total_users, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Siswa Aktif PKL", value: stats.active_students, icon: GraduationCap, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Guru Pembimbing", value: stats.total_teachers, icon: BookUser, color: "text-purple-600", bg: "bg-purple-50" },
        { label: "Perusahaan Mitra", value: stats.total_companies, icon: Building2, color: "text-amber-600", bg: "bg-amber-50" },
      ]
    : [];

  const pendingItems = stats
    ? [
        { label: "Presensi Pending", value: stats.pending_presensi, color: "text-blue-600", bg: "bg-blue-50", icon: CheckCircle2 },
        { label: "Jurnal Pending Review", value: stats.pending_jurnal, color: "text-purple-600", bg: "bg-purple-50", icon: Activity },
        { label: "Izin Pending", value: stats.pending_izin, color: "text-amber-600", bg: "bg-amber-50", icon: AlertTriangle },
      ]
    : [];

  const totalPending = stats ? stats.pending_presensi + stats.pending_jurnal + stats.pending_izin : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto">

        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-5 shadow-xl"
        >
          <div>
            <p className="text-sm text-slate-400">Selamat datang,</p>
            <p className="text-lg font-bold text-white mt-0.5">{profile?.full_name ?? "Administrator"}</p>
            <p className="text-xs text-slate-400 mt-1">Super Admin · PKL HASSINA</p>
          </div>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4 text-white", refreshing && "animate-spin")} />
          </button>
        </motion.div>

        {/* Summary cards */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {summaryCards.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
                >
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-2", s.bg)}>
                    <Icon className={cn("w-4.5 h-4.5", s.color)} />
                  </div>
                  <p className={cn("text-2xl font-extrabold", s.color)}>{s.value}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pending items */}
        {!loading && totalPending > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <p className="text-sm font-bold text-amber-800">{totalPending} item menunggu tindak lanjut</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {pendingItems.map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.label} className={cn("rounded-xl p-2.5 text-center bg-white")}>
                    <p className={cn("text-lg font-extrabold", p.color)}>{p.value}</p>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{p.label}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* System status */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
        >
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Status Sistem</p>
          <div className="grid grid-cols-2 gap-2">
            {SYSTEM_STATUS.map((s) => (
              <div key={s.label} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
                <div className={cn("w-2 h-2 rounded-full flex-shrink-0", s.ok ? "bg-emerald-500" : "bg-amber-500")} />
                <div>
                  <p className="text-[11px] font-semibold text-slate-700">{s.label}</p>
                  <p className={cn("text-[10px]", s.ok ? "text-emerald-600" : "text-amber-600")}>{s.status}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent activity */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-500" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aktivitas Terbaru</p>
          </div>
          {loading ? (
            <div className="p-4 space-y-3">
              {[0, 1, 2].map((i) => <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : activities.length === 0 ? (
            <div className="p-8 text-center">
              <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Belum ada aktivitas</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activities.map((act) => (
                <div key={act.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 leading-snug truncate">{act.description}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5 text-slate-400" />
                      <p className="text-[10px] text-slate-400">{formatRelativeTime(act.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <div className="h-4" />
      </div>
    </div>
  );
}
