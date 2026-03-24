"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const THEMES = [
  { key: "light",  label: "Terang",  Icon: Sun },
  { key: "dark",   label: "Gelap",   Icon: Moon },
  { key: "system", label: "Sistem",  Icon: Monitor },
] as const;

interface ThemeToggleProps {
  /** Jika compact=true, tampilkan sebagai tombol ikon saja */
  compact?: boolean;
  className?: string;
}

export function ThemeToggle({ compact = false, className }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  /* Hindari hydration mismatch */
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  if (compact) {
    const isDark = resolvedTheme === "dark";
    return (
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={cn(
          "w-9 h-9 rounded-xl border transition-all active:scale-95",
          isDark
            ? "bg-slate-700 border-slate-600 text-yellow-400"
            : "bg-white border-slate-200 text-slate-600",
          className
        )}
        aria-label="Toggle dark mode"
      >
        {isDark ? <Sun className="w-4 h-4 mx-auto" /> : <Moon className="w-4 h-4 mx-auto" />}
      </button>
    );
  }

  return (
    <div className={cn("flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 gap-1", className)}>
      {THEMES.map(({ key, label, Icon }) => (
        <button
          key={key}
          onClick={() => setTheme(key)}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-bold transition-all",
            theme === key
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          )}
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
