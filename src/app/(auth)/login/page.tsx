"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, GraduationCap, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { ROLE_DASHBOARD } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

/* ─────────────────────────────────────────────────────────
   Schema validasi form
───────────────────────────────────────────────────────── */

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

/* ─────────────────────────────────────────────────────────
   Animasi & konstanta
───────────────────────────────────────────────────────── */

const FLOATING_ICONS = [
  { emoji: "📋", x: "10%", delay: 0, duration: 6 },
  { emoji: "✅", x: "80%", delay: 1.2, duration: 7 },
  { emoji: "📸", x: "60%", delay: 0.6, duration: 5.5 },
  { emoji: "🏭", x: "25%", delay: 1.8, duration: 6.5 },
  { emoji: "📊", x: "90%", delay: 0.3, duration: 7.5 },
  { emoji: "🗂️", x: "45%", delay: 2.1, duration: 5 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
} as const;

/* ─────────────────────────────────────────────────────────
   Floating icon component
───────────────────────────────────────────────────────── */

function FloatingIcon({
  emoji,
  x,
  delay,
  duration,
}: {
  emoji: string;
  x: string;
  delay: number;
  duration: number;
}) {
  return (
    <motion.div
      className="absolute text-2xl select-none pointer-events-none"
      style={{ left: x, bottom: -40 }}
      animate={{
        y: [0, -420],
        opacity: [0, 0.6, 0.6, 0],
        rotate: [-8, 8, -4, 6, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        repeatDelay: 3,
        ease: "easeInOut",
      }}
      aria-hidden="true"
    >
      {emoji}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Hero / Branding section
───────────────────────────────────────────────────────── */

function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 pt-14 pb-10 px-6 flex-shrink-0">
      {/* Floating background icons */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {FLOATING_ICONS.map((icon, i) => (
          <FloatingIcon key={i} {...icon} />
        ))}
      </div>

      {/* Background blob shapes */}
      <div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-20"
        style={{ background: "rgba(255,255,255,0.3)" }}
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-8 -left-12 w-36 h-36 rounded-full opacity-15"
        style={{ background: "rgba(255,255,255,0.4)" }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center gap-4">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{
            duration: 0.7,
            ease: [0.34, 1.56, 0.64, 1],
            delay: 0.1,
          }}
          className={cn(
            "w-20 h-20 rounded-3xl",
            "bg-white/20 backdrop-blur-sm",
            "border-2 border-white/40",
            "flex items-center justify-center",
            "shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
          )}
          aria-hidden="true"
        >
          {/* Custom briefcase icon */}
          <svg
            width="40"
            height="40"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect x="6" y="16" width="36" height="26" rx="5" fill="white" fillOpacity="0.95" />
            <path
              d="M17 16V13C17 10.791 18.791 9 21 9H27C29.209 9 31 10.791 31 13V16"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeOpacity="0.7"
            />
            <path
              d="M6 28H42"
              stroke="#2563EB"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="24" cy="28" r="3.5" fill="#2563EB" />
            <rect x="21" y="26" width="6" height="4" rx="1" fill="#2563EB" />
          </svg>
        </motion.div>

        {/* App name */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-2xl font-extrabold text-white leading-tight tracking-tight drop-shadow-sm">
            PKL SMK HASSINA
          </h1>
          <p className="text-sm text-blue-100 font-medium mt-0.5 leading-snug">
            Aplikasi Praktek Kerja Industri
          </p>
        </motion.div>

        {/* Stats chips */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.38 }}
          className="flex items-center gap-2 flex-wrap justify-center"
        >
          {[
            { icon: "📸", label: "Presensi Digital" },
            { icon: "📝", label: "Jurnal Online" },
            { icon: "📊", label: "Monitoring Real-time" },
          ].map((chip) => (
            <div
              key={chip.label}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5",
                "bg-white/15 backdrop-blur-sm",
                "rounded-full border border-white/25",
                "text-white text-xs font-medium"
              )}
            >
              <span aria-hidden="true">{chip.icon}</span>
              {chip.label}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Wave separator */}
      <div className="absolute bottom-0 left-0 right-0" aria-hidden="true">
        <svg
          viewBox="0 0 390 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0 24 C97.5 8 195 0 390 16 L390 24 Z"
            fill="white"
          />
        </svg>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Input field component
───────────────────────────────────────────────────────── */

interface FormFieldProps {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  error?: string;
  icon: React.ReactNode;
  rightAction?: React.ReactNode;
  registration: Record<string, unknown>;
  autoComplete?: string;
}

function FormField({
  label,
  id,
  type = "text",
  placeholder,
  error,
  icon,
  rightAction,
  registration,
  autoComplete,
}: FormFieldProps) {
  return (
    <motion.div variants={itemVariants} className="form-group">
      <label htmlFor={id} className="form-label text-slate-700">
        {label}
      </label>
      <div
        className={cn(
          "flex items-center",
          "bg-white border-[1.5px] rounded-[var(--radius-xl)]",
          "transition-colors duration-150",
          "focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10",
          error ? "border-red-500 ring-2 ring-red-500/10" : "border-slate-200"
        )}
        style={{ height: 52 }}
      >
        {/* Left icon */}
        <span
          className="flex items-center justify-center w-11 flex-shrink-0 text-slate-400 pointer-events-none"
          aria-hidden="true"
        >
          {icon}
        </span>

        <input
          id={id}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "flex-1 h-full bg-transparent outline-none",
            "text-[15px] text-slate-800 placeholder:text-slate-400",
            rightAction ? "pr-1" : "pr-4"
          )}
          {...(registration as React.InputHTMLAttributes<HTMLInputElement>)}
        />

        {/* Right action (e.g. show/hide password) */}
        {rightAction && (
          <span className="flex items-center justify-center w-11 flex-shrink-0">
            {rightAction}
          </span>
        )}
      </div>
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            key={error}
            id={`${id}-error`}
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="form-error"
            role="alert"
          >
            <AlertCircle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


/* ─────────────────────────────────────────────────────────
   Network status banner
───────────────────────────────────────────────────────── */

function NetworkBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "fixed top-0 left-0 right-0 z-[200]",
            "flex items-center justify-center gap-2",
            "py-2.5 px-4",
            "text-sm font-semibold text-white",
            isOnline ? "bg-emerald-500" : "bg-red-500"
          )}
          role="status"
          aria-live="polite"
        >
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4" aria-hidden="true" />
              Koneksi internet pulih
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" aria-hidden="true" />
              Tidak ada koneksi internet
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────────────
   Role info tooltip
───────────────────────────────────────────────────────── */

function RoleInfoCard() {
  const [isOpen, setIsOpen] = useState(false);

  const roles = [
    { icon: "🎓", name: "Siswa", desc: "Presensi, jurnal & monitoring PKL" },
    { icon: "👨‍🏫", name: "Guru Pembimbing", desc: "Monitor & verifikasi siswa" },
    { icon: "👔", name: "Ketua Jurusan", desc: "Manajemen & laporan jurusan" },
    { icon: "⚙️", name: "Super Admin", desc: "Kelola seluruh sistem" },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-center gap-1.5",
          "text-xs text-blue-600 font-medium",
          "hover:text-blue-700 transition-colors duration-150",
          "py-1 tap-highlight-none"
        )}
        aria-expanded={isOpen}
      >
        <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
        Informasi peran pengguna
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-2 p-3.5 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-[11px] font-bold text-blue-500 uppercase tracking-wider mb-2.5">
                Akses per Peran
              </p>
              <div className="space-y-2">
                {roles.map((role) => (
                  <div key={role.name} className="flex items-center gap-2.5">
                    <span className="text-base flex-shrink-0" aria-hidden="true">
                      {role.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-700 leading-none">
                        {role.name}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                        {role.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-blue-500 mt-3 leading-snug">
                💡 Halaman akan otomatis menyesuaikan dengan peran Anda
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Login Page
───────────────────────────────────────────────────────── */

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [successAnim, setSuccessAnim] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    mode: "onTouched",
  });

  // Auto-fokus email saat mount
  useEffect(() => {
    const timer = setTimeout(() => setFocus("email"), 600);
    return () => clearTimeout(timer);
  }, [setFocus]);

  /* ── Submit handler ─────────────────────────────────── */

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setLoginError(null);

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });

      if (error) {
        // Terjemahkan pesan error ke Bahasa Indonesia
        const errorMessages: Record<string, string> = {
          "Invalid login credentials":
            "Email atau password salah. Periksa kembali dan coba lagi.",
          "Email not confirmed":
            "Akun belum dikonfirmasi. Cek email Anda untuk verifikasi.",
          "Too many requests":
            "Terlalu banyak percobaan login. Tunggu beberapa menit.",
          "User not found": "Akun tidak ditemukan. Hubungi administrator.",
          "Invalid email or password":
            "Email atau password tidak valid.",
        };
        const msg =
          errorMessages[error.message] ||
          "Login gagal. Periksa email dan password Anda.";
        setLoginError(msg);
        setIsSubmitting(false);

        // Shake animation hint — focus kembali ke email
        setTimeout(() => setFocus("password"), 100);
        return;
      }

      if (!authData.user) {
        setLoginError("Terjadi kesalahan. Silakan coba lagi.");
        setIsSubmitting(false);
        return;
      }

      // Ambil profil untuk menentukan role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, full_name, is_active")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profile) {
        setLoginError(
          "Profil pengguna tidak ditemukan. Hubungi administrator."
        );
        await supabase.auth.signOut();
        setIsSubmitting(false);
        return;
      }

      if (!profile.is_active) {
        setLoginError(
          "Akun Anda telah dinonaktifkan. Hubungi administrator."
        );
        await supabase.auth.signOut();
        setIsSubmitting(false);
        return;
      }

      // Sukses!
      setSuccessAnim(true);
      const firstName = profile.full_name?.split(" ")[0] ?? "kamu";
      toast.success(`Selamat datang, ${firstName}! 👋`, {
        description: "Login berhasil. Memuat dashboard...",
        duration: 3000,
      });

      // Redirect ke dashboard sesuai role
      const dashboard =
        ROLE_DASHBOARD[profile.role as UserRole] ?? "/siswa/dashboard";

      await new Promise((r) => setTimeout(r, 800));
      router.push(dashboard);
      router.refresh();
    } catch {
      setLoginError("Terjadi kesalahan jaringan. Periksa koneksi internet Anda.");
      setIsSubmitting(false);
    }
  };

  /* ── Render ─────────────────────────────────────────── */

  return (
    <>
      <NetworkBanner />

      <div
        className="min-h-screen-safe bg-white flex flex-col"
        style={{ maxWidth: 480, margin: "0 auto" }}
      >
        {/* Hero Section */}
        <HeroSection />

        {/* Form Section */}
        <div className="flex-1 px-5 py-6 overflow-y-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-5"
          >
            {/* Welcome heading */}
            <motion.div variants={itemVariants}>
              <h2 className="text-[22px] font-extrabold text-slate-900 leading-tight">
                Masuk ke Akun Anda
              </h2>
              <p className="text-sm text-slate-500 mt-1 leading-snug">
                Gunakan email dan password yang telah diberikan
                oleh sekolah
              </p>
            </motion.div>

            {/* Login error banner */}
            <AnimatePresence mode="wait">
              {loginError && (
                <motion.div
                  key="login-error"
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-2xl",
                    "bg-red-50 border border-red-200"
                  )}
                  role="alert"
                  aria-live="assertive"
                >
                  <AlertCircle
                    className="w-4.5 h-4.5 text-red-500 flex-shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-red-800 leading-tight">
                      Login Gagal
                    </p>
                    <p className="text-sm text-red-700 mt-0.5 leading-snug">
                      {loginError}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLoginError(null)}
                    className="flex-shrink-0 p-0.5 text-red-400 hover:text-red-600 transition-colors rounded-lg tap-highlight-none"
                    aria-label="Tutup pesan error"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path
                        d="M1 1l12 12M13 1L1 13"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-4"
              aria-label="Form login"
            >
              {/* Email */}
              <FormField
                label="Email"
                id="email"
                type="email"
                placeholder="contoh@email.com"
                error={errors.email?.message}
                icon={<Mail className="w-4.5 h-4.5" />}
                autoComplete="email"
                registration={register("email")}
              />

              {/* Password */}
              <FormField
                label="Password"
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan password Anda"
                error={errors.password?.message}
                icon={<Lock className="w-4.5 h-4.5" />}
                autoComplete="current-password"
                registration={register("password")}
                rightAction={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={cn(
                      "p-1.5 rounded-lg",
                      "text-slate-400 hover:text-slate-600",
                      "transition-colors duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                      "tap-highlight-none"
                    )}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    aria-pressed={showPassword}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={showPassword ? "hide" : "show"}
                        initial={{ scale: 0.7, opacity: 0, rotate: -30 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0.7, opacity: 0, rotate: 30 }}
                        transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                        className="flex"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4.5 h-4.5" aria-hidden="true" />
                        ) : (
                          <Eye className="w-4.5 h-4.5" aria-hidden="true" />
                        )}
                      </motion.span>
                    </AnimatePresence>
                  </button>
                }
              />

              {/* Remember me + Lupa password */}
              <motion.div
                variants={itemVariants}
                className="flex items-center justify-between"
              >
                <label className="flex items-center gap-2 cursor-pointer tap-highlight-none select-none">
                  <input
                    type="checkbox"
                    className={cn(
                      "w-4 h-4 rounded",
                      "border-slate-300",
                      "text-blue-600 accent-blue-600",
                      "cursor-pointer"
                    )}
                    {...register("rememberMe")}
                  />
                  <span className="text-sm text-slate-600 font-medium">
                    Ingat saya
                  </span>
                </label>

                <button
                  type="button"
                  className={cn(
                    "text-sm font-semibold text-blue-600",
                    "hover:text-blue-700 transition-colors duration-150",
                    "tap-highlight-none"
                  )}
                  onClick={() =>
                    toast.info("Hubungi administrator untuk reset password", {
                      description:
                        "Fitur lupa password hanya tersedia melalui admin sekolah.",
                      duration: 5000,
                    })
                  }
                >
                  Lupa password?
                </button>
              </motion.div>

              {/* Submit button */}
              <motion.div variants={itemVariants} className="pt-1">
                <motion.button
                  type="submit"
                  disabled={isSubmitting || successAnim}
                  whileTap={{ scale: isSubmitting ? 1 : 0.97 }}
                  className={cn(
                    "w-full h-14 rounded-2xl",
                    "text-base font-bold text-white",
                    "flex items-center justify-center gap-3",
                    "transition-all duration-300",
                    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300",
                    "disabled:opacity-70 disabled:cursor-not-allowed",
                    "shadow-lg shadow-blue-200/60",
                    successAnim
                      ? "bg-emerald-500 shadow-emerald-200/60"
                      : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 hover:shadow-xl hover:shadow-blue-200/70"
                  )}
                  aria-live="polite"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {isSubmitting && !successAnim ? (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-3"
                      >
                        {/* Dots loader */}
                        <span className="flex gap-1" aria-hidden="true">
                          {[0, 1, 2].map((i) => (
                            <motion.span
                              key={i}
                              className="block w-2 h-2 rounded-full bg-white"
                              animate={{ scaleY: [1, 1.8, 1], opacity: [0.6, 1, 0.6] }}
                              transition={{
                                duration: 0.7,
                                repeat: Infinity,
                                delay: i * 0.14,
                              }}
                            />
                          ))}
                        </span>
                        <span>Memverifikasi...</span>
                      </motion.span>
                    ) : successAnim ? (
                      <motion.span
                        key="success"
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        className="flex items-center gap-2"
                      >
                        <motion.svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.4, delay: 0.1 }}
                          aria-hidden="true"
                        >
                          <motion.path
                            d="M20 6L9 17L4 12"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                          />
                        </motion.svg>
                        Login Berhasil!
                      </motion.span>
                    ) : (
                      <motion.span
                        key="idle"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex items-center gap-2"
                      >
                        Masuk ke Dashboard
                        <motion.svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          whileHover={{ x: 3 }}
                          transition={{ type: "spring", stiffness: 400 }}
                          aria-hidden="true"
                        >
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </motion.svg>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>
            </form>

            {/* Divider */}
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-3"
            >
              <div className="flex-1 h-px bg-slate-100" aria-hidden="true" />
              <span className="text-xs text-slate-400 font-medium px-1">
                atau
              </span>
              <div className="flex-1 h-px bg-slate-100" aria-hidden="true" />
            </motion.div>

            {/* Role info */}
            <motion.div variants={itemVariants}>
              <RoleInfoCard />
            </motion.div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="flex-shrink-0 pb-safe px-5 pb-6 pt-2 text-center"
        >
          <p className="text-xs text-slate-400 leading-relaxed">
            Dengan masuk, Anda menyetujui{" "}
            <button
              type="button"
              className="text-blue-600 font-medium hover:underline tap-highlight-none"
              onClick={() =>
                toast.info("Kebijakan Privasi", {
                  description: "Kebijakan privasi SMK HASSINA berlaku untuk penggunaan aplikasi ini.",
                })
              }
            >
              Kebijakan Privasi
            </button>{" "}
            dan{" "}
            <button
              type="button"
              className="text-blue-600 font-medium hover:underline tap-highlight-none"
              onClick={() =>
                toast.info("Syarat & Ketentuan", {
                  description: "Harap gunakan aplikasi ini sesuai dengan ketentuan yang berlaku.",
                })
              }
            >
              Syarat & Ketentuan
            </button>{" "}
            SMK HASSINA.
          </p>
          <p className="text-[11px] text-slate-300 mt-2 font-medium">
            © {new Date().getFullYear()} PKL SMK HASSINA — v1.0.0
          </p>
        </motion.footer>
      </div>
    </>
  );
}
