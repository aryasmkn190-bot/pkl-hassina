"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUp, ArrowDown, Minus, LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/* ============================================================
   STAT CARD
   ============================================================ */

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: "blue" | "green" | "red" | "yellow" | "purple" | "orange" | "teal";
  trend?: {
    value: number;
    label?: string;
  };
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  index?: number;
}

const colorMap = {
  blue: {
    bg: "bg-blue-50",
    icon: "bg-blue-100 text-blue-600",
    text: "text-blue-600",
    glow: "hover:shadow-blue-100/60",
  },
  green: {
    bg: "bg-emerald-50",
    icon: "bg-emerald-100 text-emerald-600",
    text: "text-emerald-600",
    glow: "hover:shadow-emerald-100/60",
  },
  red: {
    bg: "bg-red-50",
    icon: "bg-red-100 text-red-600",
    text: "text-red-600",
    glow: "hover:shadow-red-100/60",
  },
  yellow: {
    bg: "bg-amber-50",
    icon: "bg-amber-100 text-amber-600",
    text: "text-amber-600",
    glow: "hover:shadow-amber-100/60",
  },
  purple: {
    bg: "bg-purple-50",
    icon: "bg-purple-100 text-purple-600",
    text: "text-purple-600",
    glow: "hover:shadow-purple-100/60",
  },
  orange: {
    bg: "bg-orange-50",
    icon: "bg-orange-100 text-orange-600",
    text: "text-orange-600",
    glow: "hover:shadow-orange-100/60",
  },
  teal: {
    bg: "bg-teal-50",
    icon: "bg-teal-100 text-teal-600",
    text: "text-teal-600",
    glow: "hover:shadow-teal-100/60",
  },
};

function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl p-4 border border-slate-100 shadow-sm",
        className
      )}
      aria-hidden="true"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-slate-100 animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-0.5">
          <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
          <div className="h-7 w-16 bg-slate-100 rounded animate-pulse" />
          <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "blue",
  trend,
  loading = false,
  onClick,
  className,
  index = 0,
}: StatCardProps) {
  if (loading) {
    return <StatCardSkeleton className={className} />;
  }

  const colors = colorMap[color];
  const isPositiveTrend = trend && trend.value > 0;
  const isNegativeTrend = trend && trend.value < 0;
  const isFlatTrend = trend && trend.value === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.07,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileTap={onClick ? { scale: 0.97 } : undefined}
      className={cn(
        "bg-white rounded-2xl p-4",
        "border border-slate-100",
        "shadow-sm hover:shadow-md",
        "transition-shadow duration-300",
        onClick && "cursor-pointer select-none tap-highlight-none",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick();
            }
          : undefined
      }
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
            colors.icon
          )}
          aria-hidden="true"
        >
          <Icon className="w-5 h-5" strokeWidth={2.2} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 truncate mb-0.5">
            {title}
          </p>
          <motion.p
            key={String(value)}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="text-2xl font-bold text-slate-900 leading-none mb-1"
          >
            {value}
          </motion.p>

          {/* Subtitle & trend */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {subtitle && (
              <span className="text-xs text-slate-400 truncate">{subtitle}</span>
            )}
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-[11px] font-semibold rounded-full px-1.5 py-0.5",
                  isPositiveTrend && "bg-emerald-50 text-emerald-700",
                  isNegativeTrend && "bg-red-50 text-red-700",
                  isFlatTrend && "bg-slate-100 text-slate-500"
                )}
              >
                {isPositiveTrend && <ArrowUp className="w-2.5 h-2.5" />}
                {isNegativeTrend && <ArrowDown className="w-2.5 h-2.5" />}
                {isFlatTrend && <Minus className="w-2.5 h-2.5" />}
                {Math.abs(trend.value)}%
                {trend.label && (
                  <span className="font-normal opacity-70">{trend.label}</span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   STAT CARD GRID
   ============================================================ */

interface StatCardGridProps {
  children: React.ReactNode;
  cols?: 2 | 3 | 4;
  className?: string;
}

function StatCardGrid({ children, cols = 2, className }: StatCardGridProps) {
  const colsMap = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-3", colsMap[cols], className)}>
      {children}
    </div>
  );
}

/* ============================================================
   PAGE HEADER
   ============================================================ */

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  sticky?: boolean;
  transparent?: boolean;
  className?: string;
}

function PageHeader({
  title,
  subtitle,
  backHref,
  onBack,
  rightAction,
  sticky = true,
  transparent = false,
  className,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  const showBack = backHref !== undefined || onBack !== undefined;

  return (
    <header
      className={cn(
        "z-40 flex items-center gap-3 px-4",
        "h-[60px]",
        sticky && "sticky top-0",
        !transparent && [
          "bg-white/85 backdrop-blur-xl",
          "border-b border-slate-200/60",
        ],
        transparent && "bg-transparent",
        className
      )}
    >
      {/* Back button */}
      {showBack && (
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={handleBack}
          className={cn(
            "flex items-center justify-center",
            "w-9 h-9 rounded-xl flex-shrink-0",
            "bg-slate-100 hover:bg-slate-200",
            "text-slate-700",
            "transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            "tap-highlight-none"
          )}
          aria-label="Kembali"
        >
          <ArrowLeft className="w-4.5 h-4.5" strokeWidth={2.5} />
        </motion.button>
      )}

      {/* Title area */}
      <div className="flex-1 min-w-0">
        <motion.h1
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="text-[17px] font-bold text-slate-900 truncate leading-tight"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="text-xs text-slate-500 truncate leading-tight mt-px"
          >
            {subtitle}
          </motion.p>
        )}
      </div>

      {/* Right action */}
      {rightAction && (
        <div className="flex items-center gap-2 flex-shrink-0">{rightAction}</div>
      )}
    </header>
  );
}

/* ============================================================
   EMPTY STATE
   ============================================================ */

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline";
  };
  size?: "sm" | "default" | "lg";
  className?: string;
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = "default",
  className,
}: EmptyStateProps) {
  const sizeMap = {
    sm: {
      wrapper: "py-8",
      iconWrap: "w-14 h-14",
      iconSize: "w-6 h-6",
      title: "text-sm font-semibold",
      desc: "text-xs",
    },
    default: {
      wrapper: "py-14",
      iconWrap: "w-18 h-18",
      iconSize: "w-8 h-8",
      title: "text-base font-bold",
      desc: "text-sm",
    },
    lg: {
      wrapper: "py-20",
      iconWrap: "w-24 h-24",
      iconSize: "w-10 h-10",
      title: "text-lg font-bold",
      desc: "text-base",
    },
  };

  const s = sizeMap[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex flex-col items-center justify-center text-center px-6",
        s.wrapper,
        className
      )}
    >
      {Icon && (
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
          className={cn(
            "flex items-center justify-center rounded-3xl mb-4",
            "bg-slate-100",
            s.iconWrap
          )}
          style={{ width: 72, height: 72 }}
          aria-hidden="true"
        >
          <Icon
            className={cn("text-slate-400", s.iconSize)}
            strokeWidth={1.5}
          />
        </motion.div>
      )}

      <motion.h3
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className={cn("text-slate-700 mb-1.5", s.title)}
      >
        {title}
      </motion.h3>

      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.28 }}
          className={cn("text-slate-400 max-w-xs leading-relaxed mb-5", s.desc)}
        >
          {description}
        </motion.p>
      )}

      {action && (
        <motion.button
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.36 }}
          whileTap={{ scale: 0.96 }}
          onClick={action.onClick}
          className={cn(
            "inline-flex items-center justify-center gap-2",
            "h-10 px-5 rounded-xl",
            "text-sm font-semibold",
            "transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            action.variant === "outline"
              ? "border-2 border-slate-200 text-slate-700 hover:bg-slate-50"
              : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md"
          )}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}

/* ============================================================
   LOADING SCREEN
   ============================================================ */

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
  transparent?: boolean;
}

function LoadingScreen({
  message = "Memuat data...",
  fullScreen = true,
  transparent = false,
}: LoadingScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex flex-col items-center justify-center gap-5",
        fullScreen && "fixed inset-0 z-50",
        !fullScreen && "w-full py-20",
        !transparent && "bg-white",
        transparent && "bg-white/80 backdrop-blur-sm"
      )}
      role="status"
      aria-label={message}
      aria-live="polite"
    >
      {/* Logo / App icon */}
      <motion.div
        animate={{
          scale: [1, 1.06, 1],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={cn(
          "w-20 h-20 rounded-3xl",
          "bg-gradient-to-br from-blue-600 to-blue-700",
          "flex items-center justify-center",
          "shadow-lg shadow-blue-200"
        )}
        aria-hidden="true"
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Briefcase icon */}
          <rect x="6" y="14" width="28" height="20" rx="4" fill="white" opacity="0.95" />
          <path
            d="M14 14V11C14 9.343 15.343 8 17 8H23C24.657 8 26 9.343 26 11V14"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.7"
          />
          <path
            d="M6 22H34"
            stroke="#2563EB"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="20" cy="22" r="2.5" fill="#2563EB" />
        </svg>
      </motion.div>

      {/* App name */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-slate-900 leading-tight">
          PKL SMK HASSINA
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Aplikasi Praktek Kerja Industri
        </p>
      </div>

      {/* Spinner + message */}
      <div className="flex flex-col items-center gap-3">
        {/* Wave loader */}
        <div
          className="flex items-center gap-1"
          aria-hidden="true"
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.span
              key={i}
              className="block w-1.5 h-1.5 rounded-full bg-blue-600"
              animate={{
                scaleY: [1, 2.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                delay: i * 0.12,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
        <p className="text-sm text-slate-400 font-medium">{message}</p>
      </div>
    </motion.div>
  );
}

/* ============================================================
   SECTION HEADER
   ============================================================ */

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

function SectionHeader({
  title,
  subtitle,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-3 mb-3", className)}>
      <div className="flex-1 min-w-0">
        <h2 className="text-[15px] font-bold text-slate-900 leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5 leading-snug">{subtitle}</p>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            "flex-shrink-0 text-xs font-semibold text-blue-600",
            "hover:text-blue-700 transition-colors duration-150",
            "py-0.5 tap-highlight-none"
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/* ============================================================
   INFO BANNER
   ============================================================ */

interface InfoBannerProps {
  type?: "info" | "success" | "warning" | "error";
  title?: string;
  message: string;
  icon?: LucideIcon;
  onDismiss?: () => void;
  className?: string;
}

function InfoBanner({
  type = "info",
  title,
  message,
  icon: Icon,
  onDismiss,
  className,
}: InfoBannerProps) {
  const typeStyles = {
    info: "bg-blue-50 border-blue-200 text-blue-900",
    success: "bg-emerald-50 border-emerald-200 text-emerald-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
    error: "bg-red-50 border-red-200 text-red-900",
  };

  const iconStyles = {
    info: "text-blue-500",
    success: "text-emerald-500",
    warning: "text-amber-500",
    error: "text-red-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex items-start gap-3 p-3.5 rounded-2xl border",
        typeStyles[type],
        className
      )}
      role="alert"
    >
      {Icon && (
        <Icon
          className={cn("w-4.5 h-4.5 flex-shrink-0 mt-0.5", iconStyles[type])}
          aria-hidden="true"
        />
      )}
      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-sm font-semibold leading-tight mb-0.5">{title}</p>
        )}
        <p className="text-sm leading-snug opacity-90">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={cn(
            "flex-shrink-0 p-0.5 rounded-lg opacity-60 hover:opacity-100",
            "transition-opacity duration-150",
            "tap-highlight-none"
          )}
          aria-label="Tutup"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M1 1l12 12M13 1L1 13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </motion.div>
  );
}

/* ============================================================
   EXPORTS
   ============================================================ */

export {
  StatCard,
  StatCardSkeleton,
  StatCardGrid,
  PageHeader,
  EmptyState,
  LoadingScreen,
  SectionHeader,
  InfoBanner,
};
export type { StatCardProps, PageHeaderProps, EmptyStateProps, InfoBannerProps };
