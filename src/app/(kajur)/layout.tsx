"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BottomNav } from "@/components/layouts/bottom-nav";
import { SidebarNav } from "@/components/layouts/bottom-nav";
import { LoadingScreen } from "@/components/shared/stat-card";
import { useAuthStore } from "@/stores/auth-store";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/card";
import { Bell, Search } from "lucide-react";
import Link from "next/link";
import { cn, getGreeting } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────
   Top App Bar for Kajur
───────────────────────────────────────────────────────── */

function KajurAppBar() {
  const { profile } = useAuthStore();
  const pathname = usePathname();

  const getPageTitle = (): { title: string; showGreeting: boolean } => {
    if (pathname === "/kajur/dashboard") {
      return { title: "", showGreeting: true };
    }
    const titles: Record<string, string> = {
      "/kajur/siswa": "Data Siswa",
      "/kajur/guru": "Guru Pembimbing",
      "/kajur/perusahaan": "Perusahaan Mitra",
      "/kajur/penempatan": "Penempatan PKL",
      "/kajur/presensi": "Rekap Presensi",
      "/kajur/laporan": "Laporan",
      "/kajur/pengumuman": "Pengumuman",
      "/kajur/dokumen": "Dokumen",
      "/kajur/chat": "Pesan",
      "/kajur/notifikasi": "Notifikasi",
      "/kajur/profil": "Profil Saya",
    };

    for (const [path, title] of Object.entries(titles)) {
      if (pathname === path || pathname.startsWith(path + "/")) {
        return { title, showGreeting: false };
      }
    }
    return { title: "PKL SMK HASSINA", showGreeting: false };
  };

  const { title, showGreeting } = getPageTitle();
  const firstName = profile?.full_name?.split(" ")[0] ?? "Kajur";

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
        <div
          className={cn(
            "w-8 h-8 rounded-xl flex-shrink-0",
            "bg-gradient-to-br from-purple-600 to-purple-700",
            "flex items-center justify-center shadow-sm"
          )}
          aria-hidden="true"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 40 40"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="6"
              y="14"
              width="28"
              height="20"
              rx="4"
              fill="white"
              opacity="0.95"
            />
            <path
              d="M14 14V11C14 9.343 15.343 8 17 8H23C24.657 8 26 9.343 26 11V14"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.7"
            />
            <path
              d="M6 22H34"
              stroke="#7c3aed"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="20" cy="22" r="2.5" fill="#7c3aed" />
          </svg>
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
          href="/kajur/notifikasi"
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
          href="/kajur/profil"
          className="tap-highlight-none"
          aria-label="Profil saya"
        >
          <Avatar
            name={profile?.full_name ?? "K"}
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
          placeholder="Cari siswa, guru, laporan..."
          className={cn(
            "w-full h-9 pl-10 pr-4",
            "bg-slate-100 rounded-xl",
            "text-sm text-slate-700 placeholder:text-slate-400",
            "border-none outline-none",
            "focus:bg-white focus:ring-2 focus:ring-purple-500/30",
            "transition-all duration-200"
          )}
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <Link
          href="/kajur/notifikasi"
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
            name={profile?.full_name ?? "K"}
            src={profile?.avatar_url ?? undefined}
            size="sm"
          />
          <div className="hidden lg:block min-w-0">
            <p className="text-sm font-semibold text-slate-900 leading-tight truncate max-w-[120px]">
              {profile?.full_name ?? "Ketua Jurusan"}
            </p>
            <p className="text-[11px] text-slate-400 leading-tight">
              Ketua Jurusan
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────
   Kajur Layout
───────────────────────────────────────────────────────── */

export default function KajurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { profile, isLoading, isHydrated, role } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    if (!isHydrated) return;
    if (!isLoading && (!profile || role !== "ketua_jurusan")) {
      router.replace("/login");
    }
  }, [profile, isLoading, isHydrated, role, router]);

  if (!isHydrated || isLoading) {
    return <LoadingScreen message="Memuat halaman ketua jurusan..." />;
  }

  if (!profile || role !== "ketua_jurusan") {
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
          role="ketua_jurusan"
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
        <KajurAppBar />
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
        <BottomNav role="ketua_jurusan" />
      </div>
    </div>
  );
}
