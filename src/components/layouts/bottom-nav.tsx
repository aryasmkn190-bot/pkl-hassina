"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Camera,
  BookOpen,
  Bell,
  User,
  Users,
  ClipboardList,
  BarChart2,
  Settings,
  MessageCircle,
  FileText,
  Building2,
  GraduationCap,
  CheckSquare,
  Megaphone,
  CalendarCheck,
  Link2,
  LayoutGrid,
  X,
  BookCopy,
  CalendarDays,
  FolderOpen,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

/* ─────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────── */

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  matchPaths?: string[];
}

interface BottomNavProps {
  role: UserRole;
  badges?: Partial<Record<string, number>>;
}

/* ─────────────────────────────────────────────────────────
   Nav configs per role
───────────────────────────────────────────────────────── */

function getSiswaNav(badges?: Partial<Record<string, number>>): NavItem[] {
  return [
    {
      href: "/siswa/dashboard",
      label: "Beranda",
      icon: Home,
      matchPaths: ["/siswa/dashboard"],
    },
    {
      href: "/siswa/presensi",
      label: "Presensi",
      icon: Camera,
      matchPaths: ["/siswa/presensi"],
    },
    {
      href: "/siswa/jurnal",
      label: "Jurnal",
      icon: BookOpen,
      matchPaths: ["/siswa/jurnal"],
    },
    {
      href: "/siswa/chat",
      label: "Chat",
      icon: MessageCircle,
      badge: badges?.chat,
      matchPaths: ["/siswa/chat"],
    },
    {
      href: "/siswa/notifikasi",
      label: "Notifikasi",
      icon: Bell,
      badge: badges?.notifikasi,
      matchPaths: ["/siswa/notifikasi"],
    },
  ];
}

function getGuruNav(badges?: Partial<Record<string, number>>): NavItem[] {
  return [
    {
      href: "/guru/dashboard",
      label: "Beranda",
      icon: Home,
      matchPaths: ["/guru/dashboard"],
    },
    {
      href: "/guru/siswa",
      label: "Siswa",
      icon: Users,
      matchPaths: ["/guru/siswa"],
    },
    {
      href: "/guru/presensi",
      label: "Presensi",
      icon: CalendarCheck,
      badge: badges?.presensi,
      matchPaths: ["/guru/presensi"],
    },
    {
      href: "/guru/jurnal",
      label: "Jurnal",
      icon: CheckSquare,
      badge: badges?.jurnal,
      matchPaths: ["/guru/jurnal"],
    },
    {
      href: "/guru/chat",
      label: "Chat",
      icon: MessageCircle,
      badge: badges?.chat,
      matchPaths: ["/guru/chat"],
    },
  ];
}

function getKajurNav(badges?: Partial<Record<string, number>>): NavItem[] {
  return [
    {
      href: "/kajur/dashboard",
      label: "Beranda",
      icon: Home,
      matchPaths: ["/kajur/dashboard"],
    },
    {
      href: "/kajur/siswa",
      label: "Siswa",
      icon: GraduationCap,
      matchPaths: ["/kajur/siswa"],
    },
    {
      href: "/kajur/laporan",
      label: "Laporan",
      icon: BarChart2,
      matchPaths: ["/kajur/laporan"],
    },
    {
      href: "/kajur/pengumuman",
      label: "Pengumuman",
      icon: Megaphone,
      badge: badges?.pengumuman,
      matchPaths: ["/kajur/pengumuman"],
    },
    {
      href: "/kajur/profil",
      label: "Profil",
      icon: User,
      matchPaths: ["/kajur/profil"],
    },
  ];
}

function getAdminNav(badges?: Partial<Record<string, number>>): NavItem[] {
  return [
    {
      href: "/admin/dashboard",
      label: "Beranda",
      icon: Home,
      matchPaths: ["/admin/dashboard"],
    },
    {
      href: "/admin/users",
      label: "Pengguna",
      icon: Users,
      matchPaths: ["/admin/users"],
    },
    {
      href: "/admin/laporan",
      label: "Laporan",
      icon: BarChart2,
      matchPaths: ["/admin/laporan"],
    },
    {
      href: "/admin/pengumuman",
      label: "Pengumuman",
      icon: Megaphone,
      badge: badges?.pengumuman,
      matchPaths: ["/admin/pengumuman"],
    },
    {
      href: "/admin/pengaturan",
      label: "Pengaturan",
      icon: Settings,
      matchPaths: ["/admin/pengaturan"],
    },
  ];
}

function getNavItems(
  role: UserRole,
  badges?: Partial<Record<string, number>>
): NavItem[] {
  switch (role) {
    case "siswa":
      return getSiswaNav(badges);
    case "guru_pembimbing":
      return getGuruNav(badges);
    case "ketua_jurusan":
      return getKajurNav(badges);
    case "super_admin":
      return getAdminNav(badges);
    default:
      return [];
  }
}

/* ─────────────────────────────────────────────────────────
   Nav Item component
───────────────────────────────────────────────────────── */

interface NavItemProps {
  item: NavItem;
  isActive: boolean;
  index: number;
}

function NavItemComponent({ item, isActive, index }: NavItemProps) {
  const Icon = item.icon;
  const hasBadge = item.badge !== undefined && item.badge > 0;

  return (
    <Link
      href={item.href}
      className={cn(
        "bottom-nav-item tap-highlight-none",
        isActive && "active"
      )}
      aria-current={isActive ? "page" : undefined}
      aria-label={`${item.label}${hasBadge ? `, ${item.badge} notifikasi baru` : ""}`}
    >
      {/* Icon wrapper with indicator pill */}
      <div className="nav-icon relative">
        {/* Active background pill animation */}
        {isActive && (
          <motion.div
            layoutId="nav-active-pill"
            className="absolute inset-0 bg-blue-50 rounded-full"
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 30,
            }}
          />
        )}

        {/* Icon */}
        <motion.span
          animate={
            isActive
              ? { scale: [1, 1.22, 1], y: [0, -2, 0] }
              : { scale: 1, y: 0 }
          }
          transition={
            isActive
              ? {
                  duration: 0.35,
                  ease: [0.34, 1.56, 0.64, 1],
                }
              : { duration: 0.2 }
          }
          className="relative z-10"
        >
          <Icon
            className={cn(
              "transition-all duration-200",
              isActive
                ? "w-[22px] h-[22px] stroke-[2.4]"
                : "w-[22px] h-[22px] stroke-2"
            )}
          />
        </motion.span>

        {/* Badge */}
        <AnimatePresence>
          {hasBadge && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 25,
              }}
              className="notif-badge"
              aria-hidden="true"
            >
              {item.badge! > 99 ? "99+" : item.badge}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Label */}
      <motion.span
        animate={{
          fontWeight: isActive ? 700 : 500,
          color: isActive ? "#2563eb" : "#64748b",
        }}
        transition={{ duration: 0.15 }}
        className="nav-label"
        style={{ fontSize: 10 }}
      >
        {item.label}
      </motion.span>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────
   Admin Full Menu Drawer (mobile)
───────────────────────────────────────────────────────── */

const ADMIN_FULL_MENU = [
  {
    group: "UTAMA",
    items: [
      { href: "/admin/dashboard", label: "Beranda", icon: Home },
    ],
  },
  {
    group: "MANAJEMEN",
    items: [
      { href: "/admin/users",       label: "Manajemen User",  icon: UserCog },
      { href: "/admin/jurusan",     label: "Jurusan",         icon: GraduationCap },
      { href: "/admin/kelas",       label: "Kelas",           icon: BookCopy },
      { href: "/admin/perusahaan",  label: "Perusahaan",      icon: Building2 },
      { href: "/admin/penugasan",   label: "Penugasan PKL",   icon: Link2 },
      { href: "/admin/periode-pkl", label: "Periode PKL",     icon: CalendarDays },
    ],
  },
  {
    group: "LAPORAN",
    items: [
      { href: "/admin/laporan", label: "Laporan", icon: BarChart2 },
    ],
  },
  {
    group: "KOMUNIKASI",
    items: [
      { href: "/admin/pengumuman", label: "Pengumuman", icon: Megaphone },
      { href: "/admin/dokumen",    label: "Dokumen",    icon: FolderOpen },
    ],
  },
  {
    group: "SISTEM",
    items: [
      { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
    ],
  },
  {
    group: "AKUN",
    items: [
      { href: "/admin/profil", label: "Profil Saya", icon: User },
    ],
  },
];

function AdminMenuDrawer({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 350, damping: 35 }}
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl pb-safe max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-1" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <div>
              <p className="text-base font-extrabold text-slate-900">Menu Admin</p>
              <p className="text-xs text-slate-400">PKL SMK HASSINA</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center active:scale-95 transition-transform">
              <X className="w-4 h-4 text-slate-600" />
            </button>
          </div>

          {/* Menu list */}
          <div className="overflow-y-auto flex-1 px-4 py-3 space-y-4">
            {ADMIN_FULL_MENU.map((section) => (
              <div key={section.group}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-1.5">{section.group}</p>
                <div className="space-y-0.5">
                  {section.items.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href || pathname.startsWith(href + "/");
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-2xl transition-all active:scale-[0.98]",
                          isActive
                            ? "bg-blue-50 text-blue-700"
                            : "text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", isActive ? "bg-blue-600" : "bg-slate-100")}>
                          <Icon className={cn("w-4.5 h-4.5", isActive ? "text-white" : "text-slate-600")} />
                        </div>
                        <span className={cn("text-sm font-semibold", isActive ? "text-blue-700" : "text-slate-700")}>{label}</span>
                        {isActive && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="h-2" />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────────────
   Bottom Nav
───────────────────────────────────────────────────────── */

export function BottomNav({ role, badges }: BottomNavProps) {
  const pathname = usePathname();
  const navItems = getNavItems(role, badges);
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  function isItemActive(item: NavItem): boolean {
    if (item.matchPaths) {
      return item.matchPaths.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
      );
    }
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  /* For admin: show 4 main items + "More" button */
  if (role === "super_admin") {
    const mainItems = navItems.slice(0, 4);
    const hasMoreActive = !mainItems.some(isItemActive);
    return (
      <>
        <nav className="bottom-nav" aria-label="Navigasi utama">
          {mainItems.map((item, index) => (
            <NavItemComponent
              key={item.href}
              item={item}
              isActive={isItemActive(item)}
              index={index}
            />
          ))}
          {/* More button */}
          <button
            onClick={() => setShowAdminMenu(true)}
            className={cn("bottom-nav-item tap-highlight-none", hasMoreActive && "active")}
            aria-label="Semua Menu Admin"
          >
            <div className={cn("nav-icon relative", hasMoreActive && "bg-blue-50 rounded-full")}>
              <motion.span whileTap={{ scale: 0.85 }}>
                <LayoutGrid className={cn("w-5 h-5", hasMoreActive ? "text-blue-600" : "text-slate-500")} strokeWidth={2} />
              </motion.span>
            </div>
            <motion.span
              animate={{ fontWeight: hasMoreActive ? 700 : 500, color: hasMoreActive ? "#2563eb" : "#64748b" }}
              transition={{ duration: 0.15 }}
              className="nav-label"
              style={{ fontSize: 10 }}
            >
              Menu
            </motion.span>
          </button>
        </nav>
        {showAdminMenu && <AdminMenuDrawer onClose={() => setShowAdminMenu(false)} />}
      </>
    );
  }

  return (
    <nav className="bottom-nav" aria-label="Navigasi utama">
      {navItems.map((item, index) => (
        <NavItemComponent
          key={item.href}
          item={item}
          isActive={isItemActive(item)}
          index={index}
        />
      ))}
    </nav>
  );
}

/* ─────────────────────────────────────────────────────────
   Sidebar Nav (Desktop)
───────────────────────────────────────────────────────── */

interface SidebarNavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  matchPaths?: string[];
  group?: string;
}

function getFullSiswaNav(
  badges?: Partial<Record<string, number>>
): SidebarNavItem[] {
  return [
    { href: "/siswa/dashboard", label: "Beranda", icon: Home, group: "Utama" },
    {
      href: "/siswa/presensi",
      label: "Presensi",
      icon: Camera,
      group: "Aktivitas PKL",
    },
    {
      href: "/siswa/jurnal",
      label: "Jurnal Harian",
      icon: BookOpen,
      group: "Aktivitas PKL",
    },
    {
      href: "/siswa/izin",
      label: "Izin & Sakit",
      icon: ClipboardList,
      group: "Aktivitas PKL",
    },
    {
      href: "/siswa/pengumuman",
      label: "Pengumuman",
      icon: Megaphone,
      group: "Informasi",
    },
    {
      href: "/siswa/dokumen",
      label: "Dokumen",
      icon: FileText,
      group: "Informasi",
    },
    {
      href: "/siswa/chat",
      label: "Chat",
      icon: MessageCircle,
      badge: badges?.chat,
      group: "Komunikasi",
    },
    {
      href: "/siswa/notifikasi",
      label: "Notifikasi",
      icon: Bell,
      badge: badges?.notifikasi,
      group: "Komunikasi",
    },
    { href: "/siswa/profil", label: "Profil Saya", icon: User, group: "Akun" },
  ];
}

function getFullGuruNav(
  badges?: Partial<Record<string, number>>
): SidebarNavItem[] {
  return [
    { href: "/guru/dashboard", label: "Beranda", icon: Home, group: "Utama" },
    {
      href: "/guru/siswa",
      label: "Data Siswa",
      icon: Users,
      group: "Monitoring",
    },
    {
      href: "/guru/presensi",
      label: "Presensi",
      icon: CalendarCheck,
      badge: badges?.presensi,
      group: "Monitoring",
    },
    {
      href: "/guru/jurnal",
      label: "Review Jurnal",
      icon: CheckSquare,
      badge: badges?.jurnal,
      group: "Monitoring",
    },
    {
      href: "/guru/izin",
      label: "Pengajuan Izin",
      icon: ClipboardList,
      badge: badges?.izin,
      group: "Monitoring",
    },
    {
      href: "/guru/penilaian",
      label: "Penilaian",
      icon: BarChart2,
      group: "Evaluasi",
    },
    {
      href: "/guru/laporan",
      label: "Laporan",
      icon: FileText,
      group: "Evaluasi",
    },
    {
      href: "/guru/pengumuman",
      label: "Pengumuman",
      icon: Megaphone,
      group: "Komunikasi",
    },
    {
      href: "/guru/chat",
      label: "Chat",
      icon: MessageCircle,
      badge: badges?.chat,
      group: "Komunikasi",
    },
    {
      href: "/guru/notifikasi",
      label: "Notifikasi",
      icon: Bell,
      badge: badges?.notifikasi,
      group: "Komunikasi",
    },
    { href: "/guru/profil", label: "Profil Saya", icon: User, group: "Akun" },
  ];
}

function getFullKajurNav(
  badges?: Partial<Record<string, number>>
): SidebarNavItem[] {
  return [
    { href: "/kajur/dashboard", label: "Beranda", icon: Home, group: "Utama" },
    {
      href: "/kajur/siswa",
      label: "Data Siswa",
      icon: GraduationCap,
      group: "Manajemen",
    },
    {
      href: "/kajur/guru",
      label: "Guru Pembimbing",
      icon: Users,
      group: "Manajemen",
    },
    {
      href: "/kajur/perusahaan",
      label: "Perusahaan Mitra",
      icon: Building2,
      group: "Manajemen",
    },
    {
      href: "/kajur/penempatan",
      label: "Penempatan PKL",
      icon: CalendarCheck,
      group: "Manajemen",
    },
    {
      href: "/kajur/presensi",
      label: "Rekap Presensi",
      icon: ClipboardList,
      group: "Monitoring",
    },
    {
      href: "/kajur/laporan",
      label: "Laporan",
      icon: BarChart2,
      group: "Evaluasi",
    },
    {
      href: "/kajur/pengumuman",
      label: "Pengumuman",
      icon: Megaphone,
      group: "Komunikasi",
    },
    {
      href: "/kajur/dokumen",
      label: "Dokumen",
      icon: FileText,
      group: "Komunikasi",
    },
    {
      href: "/kajur/chat",
      label: "Chat",
      icon: MessageCircle,
      badge: badges?.chat,
      group: "Komunikasi",
    },
    { href: "/kajur/profil", label: "Profil Saya", icon: User, group: "Akun" },
  ];
}

function getFullAdminNav(
  badges?: Partial<Record<string, number>>
): SidebarNavItem[] {
  return [
    { href: "/admin/dashboard", label: "Beranda", icon: Home, group: "Utama" },
    {
      href: "/admin/users",
      label: "Manajemen User",
      icon: Users,
      group: "Manajemen",
    },
    {
      href: "/admin/jurusan",
      label: "Jurusan",
      icon: GraduationCap,
      group: "Manajemen",
    },
    {
      href: "/admin/kelas",
      label: "Kelas",
      icon: BookOpen,
      group: "Manajemen",
    },
    {
      href: "/admin/perusahaan",
      label: "Perusahaan",
      icon: Building2,
      group: "Manajemen",
    },
    {
      href: "/admin/penugasan",
      label: "Penugasan PKL",
      icon: Link2,
      group: "Manajemen",
    },
    {
      href: "/admin/periode-pkl",
      label: "Periode PKL",
      icon: CalendarCheck,
      group: "Manajemen",
    },
    {
      href: "/admin/laporan",
      label: "Laporan",
      icon: BarChart2,
      group: "Laporan",
    },
    {
      href: "/admin/pengumuman",
      label: "Pengumuman",
      icon: Megaphone,
      group: "Komunikasi",
    },
    {
      href: "/admin/dokumen",
      label: "Dokumen",
      icon: FileText,
      group: "Komunikasi",
    },
    {
      href: "/admin/pengaturan",
      label: "Pengaturan",
      icon: Settings,
      group: "Sistem",
    },
    { href: "/admin/profil", label: "Profil Saya", icon: User, group: "Akun" },
  ];
}

function getFullNavItems(
  role: UserRole,
  badges?: Partial<Record<string, number>>
): SidebarNavItem[] {
  switch (role) {
    case "siswa":
      return getFullSiswaNav(badges);
    case "guru_pembimbing":
      return getFullGuruNav(badges);
    case "ketua_jurusan":
      return getFullKajurNav(badges);
    case "super_admin":
      return getFullAdminNav(badges);
    default:
      return [];
  }
}

interface SidebarNavProps {
  role: UserRole;
  badges?: Partial<Record<string, number>>;
  userName?: string;
  userAvatar?: string;
  onSignOut?: () => void;
}

export function SidebarNav({
  role,
  badges,
  userName,
  userAvatar,
  onSignOut,
}: SidebarNavProps) {
  const pathname = usePathname();
  const items = getFullNavItems(role, badges);

  // Group items
  const groups: Record<string, SidebarNavItem[]> = {};
  for (const item of items) {
    const group = item.group ?? "Lainnya";
    if (!groups[group]) groups[group] = [];
    groups[group].push(item);
  }

  function isActive(item: SidebarNavItem): boolean {
    if (item.matchPaths) {
      return item.matchPaths.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
      );
    }
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  return (
    <aside className="sidebar flex-col gap-1 overflow-y-auto hidden md:flex">
      {/* App logo */}
      <div className="flex items-center gap-3 px-3 py-4 mb-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-sm flex-shrink-0">
          <svg
            width="20"
            height="20"
            viewBox="0 0 40 40"
            fill="none"
            aria-hidden="true"
          >
            <rect x="6" y="14" width="28" height="20" rx="4" fill="white" opacity="0.95" />
            <path
              d="M14 14V11C14 9.343 15.343 8 17 8H23C24.657 8 26 9.343 26 11V14"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.7"
            />
            <path d="M6 22H34" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="20" cy="22" r="2.5" fill="#2563EB" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-extrabold text-slate-900 leading-tight truncate">
            PKL SMK HASSINA
          </p>
          <p className="text-[10px] text-slate-400 font-medium leading-tight truncate">
            Praktek Kerja Industri
          </p>
        </div>
      </div>

      {/* Nav groups */}
      <div className="flex-1 space-y-4 px-2 pb-4">
        {Object.entries(groups).map(([group, groupItems]) => (
          <div key={group}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-1.5">
              {group}
            </p>
            <div className="space-y-0.5">
              {groupItems.map((item) => {
                const active = isActive(item);
                const Icon = item.icon;
                const hasBadge = item.badge !== undefined && item.badge > 0;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-2.5 rounded-xl",
                      "text-sm font-medium",
                      "transition-all duration-150",
                      "group tap-highlight-none select-none",
                      active
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    {/* Active indicator */}
                    {active && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-full"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}

                    <Icon
                      className={cn(
                        "w-4.5 h-4.5 flex-shrink-0 transition-colors duration-150",
                        active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                      )}
                      strokeWidth={active ? 2.4 : 2}
                    />

                    <span className="flex-1 truncate">{item.label}</span>

                    {hasBadge && (
                      <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {item.badge! > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sign out */}
      {onSignOut && (
        <div className="px-2 py-3 border-t border-slate-100">
          <button
            onClick={onSignOut}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl",
              "text-sm font-medium text-slate-500 hover:text-red-600",
              "hover:bg-red-50 transition-all duration-150",
              "tap-highlight-none"
            )}
          >
            <svg
              className="w-4.5 h-4.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Keluar</span>
          </button>
        </div>
      )}
    </aside>
  );
}
