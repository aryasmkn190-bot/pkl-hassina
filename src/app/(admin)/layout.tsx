"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BottomNav } from "@/components/layouts/bottom-nav";
import { SidebarNav } from "@/components/layouts/bottom-nav";
import { LoadingScreen } from "@/components/shared/stat-card";
import { useAuthStore } from "@/stores/auth-store";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/card";
import { Bell, Search, Shield } from "lucide-react";
import Link from "next/link";
import { cn, getGreeting } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────
   Top App Bar for Admin
───────────────────────────────────────────────────────── */

function AdminAppBar() {
  const { profile } = useAuthStore();
  const pathname = usePathname();

  const getPageTitle = (): { title: string; showGreeting: boolean } => {
    if (pathname === "/admin/dashboard") {
      return { title: "", showGreeting: true };
    }
    const titles: Record<string, string> = {
      "/admin/users": "Manajemen Pengguna",
      "/admin/jurusan": "Manajemen Jurusan",
      "/admin/kelas": "Manajemen Kelas",
      "/admin/perusahaan": "Data Perusahaan",
      "/admin/periode-pkl": "Periode PKL",
      "/admin/pengumuman": "Pengumuman",
      "/admin/dokumen": "Dokumen",
      "/admin/laporan": "Laporan",
      "/admin/pengaturan": "Pengaturan Sistem",
      "/admin/notifikasi": "Notifikasi",
      "/admin/profil": "Profil Saya",
    };

    for (const [path, title] of Object.entries(titles)) {
      if (pathname === path || pathname.startsWith(path + "/")) {
        return { title, showGreeting: false };
      }
    }
    return { title: "PKL SMK HASSINA", showGreeting: false };
  };

  const { title, showGreeting } = getPageTitle();
  const firstName = profile?.full_name?.split(" ")[0] ?? "Admin";

  return (
    <header
      className={cn(
        "sticky top-0 z-40",
        "h-[60px] px-4",
        "flex items-center justify-between gap-3",
        "bg-white/85 backdrop-blur-xl border-b border-slate-200/60",
        "md:hidden"
      )}
    >
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Logo pill with Admin indicator */}
        <div
          className={cn(
            "w-8 h-8 rounded-xl flex-shrink-0",
            "bg-gradient-to-br from-slate-700 to-slate-900",
            "flex items-center justify-center shadow-sm"
          )}
          aria-hidden="true"
        >
          <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>

        <AnimatePresence mode="wait">
          {showGreeting ? (
            <motion.div
              key="greeting"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="min-w-0"
            >
              <p className="text-[11px] text-slate-400 font-medium leading-none">
                {getGreeting()} 👋
              </p>
              <p className="text-[15px] font-bold text-slate-900 leading-tight truncate">
                {firstName}
              </p>
            </motion.div>
          ) : (
            <motion.h1
              key={title}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="text-[17px] font-bold text-slate-900 truncate"
            >
              {title}
            </motion.h1>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Notif + Avatar */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Link
          href="/admin/notifikasi"
          className={cn(
            "relative flex items-center justify-center",
            "w-9 h-9 rounded-xl",
            "hover:bg-slate-100 transition-colors duration-150",
            "tap-highlight-none"
          )}
          aria-label="Notifikasi"
        >
          <Bell className="w-5 h-5 text-slate-600" strokeWidth={2} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-white"
            aria-hidden="true"
          />
        </Link>

        <Link
          href="/admin/profil"
          className="tap-highlight-none"
          aria-label="Profil saya"
        >
          <Avatar
            name={profile?.full_name ?? "A"}
            src={profile?.avatar_url ?? undefined}
            size="sm"
          />
        </Link>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────
   Desktop Top Bar
───────────────────────────────────────────────────────── */

function DesktopTopBar() {
  const { profile } = useAuthStore();

  return (
    <header
      className={cn(
        "hidden md:flex",
        "sticky top-0 z-40",
        "h-[60px] px-6",
        "items-center justify-between gap-4",
        "bg-white/90 backdrop-blur-xl border-b border-slate-200/60",
        "col-start-2"
      )}
    >
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Cari pengguna, data, laporan..."
          className={cn(
            "w-full h-9 pl-10 pr-4",
            "bg-slate-100 rounded-xl",
            "text-sm text-slate-700 placeholder:text-slate-400",
            "border-none outline-none",
            "focus:bg-white focus:ring-2 focus:ring-slate-500/30",
            "transition-all duration-200"
          )}
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Admin badge */}
        <div
          className={cn(
            "hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full",
            "bg-slate-100 border border-slate-200"
          )}
        >
          <Shield className="w-3.5 h-3.5 text-slate-600" strokeWidth={2.5} />
          <span className="text-xs font-bold text-slate-700">Super Admin</span>
        </div>

        <Link
          href="/admin/notifikasi"
          className={cn(
            "relative flex items-center justify-center",
            "w-9 h-9 rounded-xl",
            "hover:bg-slate-100 transition-colors duration-150",
            "tap-highlight-none"
          )}
          aria-label="Notifikasi"
        >
          <Bell className="w-5 h-5 text-slate-600" strokeWidth={2} />
          <span
            className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border border-white"
            aria-hidden="true"
          />
        </Link>

        <div className="flex items-center gap-2.5 cursor-pointer">
          <Avatar
            name={profile?.full_name ?? "A"}
            src={profile?.avatar_url ?? undefined}
            size="sm"
          />
          <div className="hidden lg:block min-w-0">
            <p className="text-sm font-semibold text-slate-900 leading-tight truncate max-w-[120px]">
              {profile?.full_name ?? "Administrator"}
            </p>
            <p className="text-[11px] text-slate-400 leading-tight">
              Super Admin
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────
   Admin Layout
───────────────────────────────────────────────────────── */

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { profile, isLoading, isHydrated, role } = useAuthStore();
  const supabase = createClient();
  // Lapisan kedua: jika loading masih true setelah 8 detik → redirect login
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  useEffect(() => {
    if (!isLoading && !isHydrated) return;
    const t = setTimeout(() => {
      if (isLoading || !isHydrated) {
        console.warn("[AdminLayout] Auth loading timeout — redirecting to login");
        setLoadingTimedOut(true);
        router.replace("/login");
      }
    }, 8000);
    return () => clearTimeout(t);
  }, [isLoading, isHydrated, router]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isLoading && (!profile || role !== "super_admin")) {
      router.replace("/login");
    }
  }, [profile, isLoading, isHydrated, role, router]);

  if (loadingTimedOut) {
    return <LoadingScreen message="Mengalihkan ke login..." />;
  }

  if (!isHydrated || isLoading) {
    return <LoadingScreen message="Memuat halaman administrator..." />;
  }

  if (!profile || role !== "super_admin") {
    return <LoadingScreen message="Mengalihkan..." />;
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen-safe bg-[var(--color-background)]">
      {/* ── Desktop Layout ─── */}
      <div className="hidden md:flex min-h-screen-safe">
        <SidebarNav
          role="super_admin"
          userName={profile.full_name}
          userAvatar={profile.avatar_url ?? undefined}
          onSignOut={handleSignOut}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <DesktopTopBar />
          <main className="flex-1 overflow-y-auto p-6">
            <motion.div
              key="desktop-content"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>

      {/* ── Mobile Layout ─── */}
      <div className="md:hidden flex flex-col min-h-screen-safe">
        <AdminAppBar />
        <main className="flex-1 overflow-y-auto pb-nav">
          <AnimatePresence mode="wait">
            <motion.div
              key="mobile-content"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        <BottomNav role="super_admin" />
      </div>
    </div>
  );
}
