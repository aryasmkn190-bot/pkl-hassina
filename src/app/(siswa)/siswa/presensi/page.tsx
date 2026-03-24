"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Camera,
  MapPin,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  Clock,
  RotateCcw,
  Loader2,
  Navigation,
  ChevronRight,
  Calendar,
  ArrowLeft,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { useStudentContext } from "@/lib/hooks/use-student-context";
import {
  formatDate,
  formatTime,
  formatDateTime,
  dataURLtoBlob,
  compressImage,
  cn,
} from "@/lib/utils";
import Link from "next/link";


/* ─────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────── */

type AttendanceType = "check_in" | "check_out";
type Step = "camera" | "preview" | "location" | "submitting" | "success" | "error";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address: string | null;
}

interface TodayRecord {
  check_in: { time: string; status: string; selfie_url: string | null } | null;
  check_out: { time: string; status: string; selfie_url: string | null } | null;
}

/* ─────────────────────────────────────────────────────────
   Hooks
───────────────────────────────────────────────────────── */

function useGeolocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const getLocation = useCallback((): Promise<LocationData> => {
    setLocationLoading(true);
    setLocationError(null);

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = "Browser tidak mendukung geolokasi.";
        setLocationError(err);
        setLocationLoading(false);
        reject(new Error(err));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;

          let address: string | null = null;
          try {
            const resp = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=id`
            );
            const geo = await resp.json();
            const { road, suburb, city, town, county, state } =
              geo.address ?? {};
            address = [road, suburb, city || town || county, state]
              .filter(Boolean)
              .join(", ");
          } catch {
            address = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          }

          const loc: LocationData = { latitude, longitude, accuracy, address };
          setLocation(loc);
          setLocationLoading(false);
          resolve(loc);
        },
        (err) => {
          const messages: Record<number, string> = {
            1: "Akses lokasi ditolak. Izinkan akses lokasi di pengaturan browser.",
            2: "Lokasi tidak tersedia. Pastikan GPS aktif.",
            3: "Waktu permintaan lokasi habis. Coba lagi.",
          };
          const msg = messages[err.code] ?? "Gagal mendapatkan lokasi.";
          setLocationError(msg);
          setLocationLoading(false);
          reject(new Error(msg));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  return { location, locationError, locationLoading, getLocation };
}

/* ─────────────────────────────────────────────────────────
   Camera component
───────────────────────────────────────────────────────── */

interface CameraViewProps {
  onCapture: (dataURL: string) => void;
  attendanceType: AttendanceType;
}

function CameraView({ onCapture, attendanceType }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [capturing, setCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const startCamera = useCallback(async (mode: "user" | "environment") => {
    setCameraError(null);
    setCameraReady(false);

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraReady(true);
        };
      }
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Akses kamera ditolak. Izinkan akses kamera di browser."
          : "Kamera tidak tersedia atau sedang digunakan aplikasi lain.";
      setCameraError(msg);
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [facingMode, startCamera]);

  const flipCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const captureWithCountdown = () => {
    if (!cameraReady || capturing) return;
    setCapturing(true);
    setCountdown(3);

    let count = 3;
    const timer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(timer);
        setCountdown(null);
        doCapture();
      }
    }, 1000);
  };

  const doCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror for selfie (front camera)
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0);

    // Timestamp overlay
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    const now = new Date();
    const ts = formatDateTime(now);
    const tsLabel = `PKL SMK HASSINA • ${ts}`;

    ctx.font = "bold 14px Inter, sans-serif";
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, canvas.height - 36, canvas.width, 36);
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.fillText(tsLabel, 12, canvas.height - 12);

    const dataURL = canvas.toDataURL("image/jpeg", 0.88);
    setCapturing(false);
    onCapture(dataURL);

    // Stop camera stream after capture
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  if (cameraError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-6 bg-slate-100 rounded-3xl aspect-[3/4]">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-800 mb-1">
            Kamera Tidak Tersedia
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">{cameraError}</p>
        </div>
        <button
          onClick={() => startCamera(facingMode)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors active:scale-[0.97]"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Camera frame */}
      <div className="camera-frame mx-auto shadow-xl">
        {/* Video stream */}
        <video
          ref={videoRef}
          className={cn(
            "w-full h-full object-cover",
            facingMode === "user" && "scale-x-[-1]"
          )}
          playsInline
          muted
          autoPlay
        />

        {/* Loading overlay */}
        {!cameraReady && (
          <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
            <div className="text-center text-white">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-sm font-medium">Memuat kamera...</p>
            </div>
          </div>
        )}

        {/* Face guide overlay */}
        {cameraReady && (
          <div className="camera-face-guide" aria-hidden="true" />
        )}

        {/* Countdown overlay */}
        <AnimatePresence>
          {countdown !== null && (
            <motion.div
              key={countdown}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none"
            >
              <span className="text-8xl font-black text-white drop-shadow-xl">
                {countdown}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top badge — attendance type */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2">
          <span
            className={cn(
              "px-3 py-1 rounded-full text-xs font-bold text-white shadow-md",
              attendanceType === "check_in"
                ? "bg-blue-600/90 backdrop-blur-sm"
                : "bg-orange-500/90 backdrop-blur-sm"
            )}
          >
            {attendanceType === "check_in" ? "📷 Absen Masuk" : "📷 Absen Pulang"}
          </span>
        </div>

        {/* Flip camera button */}
        {cameraReady && (
          <button
            onClick={flipCamera}
            className={cn(
              "absolute top-3 right-3",
              "w-9 h-9 rounded-xl",
              "bg-black/30 backdrop-blur-sm",
              "flex items-center justify-center",
              "text-white transition-transform active:scale-90",
              "tap-highlight-none"
            )}
            aria-label="Ganti kamera"
          >
            <RotateCcw className="w-4.5 h-4.5" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* Capture button */}
      <div className="flex justify-center mt-6">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={captureWithCountdown}
          disabled={!cameraReady || capturing}
          className={cn(
            "relative w-18 h-18 rounded-full",
            "flex items-center justify-center",
            "transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            "tap-highlight-none select-none",
            attendanceType === "check_in"
              ? "bg-blue-600 shadow-lg shadow-blue-300/60"
              : "bg-orange-500 shadow-lg shadow-orange-300/60"
          )}
          style={{ width: 72, height: 72 }}
          aria-label="Ambil foto"
        >
          {/* Outer ring */}
          <span
            className="absolute inset-0 rounded-full border-4 border-white/40"
            aria-hidden="true"
          />

          {capturing ? (
            <Loader2 className="w-7 h-7 text-white animate-spin" />
          ) : (
            <Camera className="w-7 h-7 text-white" strokeWidth={2} />
          )}

          {/* Pulse animation when ready */}
          {cameraReady && !capturing && (
            <motion.span
              className={cn(
                "absolute inset-0 rounded-full",
                attendanceType === "check_in" ? "bg-blue-400" : "bg-orange-400"
              )}
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden="true"
            />
          )}
        </motion.button>
      </div>

      <p className="text-center text-xs text-slate-400 mt-2 font-medium">
        Pastikan wajah Anda terlihat jelas dalam bingkai
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Preview component
───────────────────────────────────────────────────────── */

interface PreviewProps {
  photoDataURL: string;
  location: LocationData | null;
  locationLoading: boolean;
  locationError: string | null;
  onRetake: () => void;
  onSubmit: () => void;
  submitting: boolean;
  attendanceType: AttendanceType;
}

function PreviewStep({
  photoDataURL,
  location,
  locationLoading,
  locationError,
  onRetake,
  onSubmit,
  submitting,
  attendanceType,
}: PreviewProps) {
  return (
    <div className="space-y-4">
      {/* Photo preview */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="camera-frame mx-auto overflow-hidden rounded-3xl shadow-xl"
      >
        <img
          src={photoDataURL}
          alt="Foto selfie presensi"
          className="w-full h-full object-cover"
        />

        {/* Success overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="absolute top-3 left-1/2 -translate-x-1/2"
        >
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/90 backdrop-blur-sm rounded-full text-white text-xs font-bold shadow-md">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Foto berhasil diambil
          </span>
        </motion.div>
      </motion.div>

      {/* Location card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "rounded-2xl p-4 border",
          locationError
            ? "bg-red-50 border-red-200"
            : location
            ? "bg-emerald-50 border-emerald-200"
            : "bg-blue-50 border-blue-200"
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
              locationError
                ? "bg-red-100"
                : location
                ? "bg-emerald-100"
                : "bg-blue-100"
            )}
          >
            {locationLoading ? (
              <Loader2
                className="w-4.5 h-4.5 text-blue-500 animate-spin"
                aria-label="Memuat lokasi"
              />
            ) : locationError ? (
              <AlertCircle className="w-4.5 h-4.5 text-red-500" />
            ) : (
              <MapPin
                className={cn(
                  "w-4.5 h-4.5",
                  location ? "text-emerald-600" : "text-blue-500"
                )}
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-sm font-semibold leading-tight",
                locationError
                  ? "text-red-800"
                  : location
                  ? "text-emerald-800"
                  : "text-blue-800"
              )}
            >
              {locationLoading
                ? "Mendapatkan lokasi GPS..."
                : locationError
                ? "Gagal mendapatkan lokasi"
                : location
                ? "Lokasi berhasil didapatkan"
                : "Lokasi GPS"}
            </p>

            {location && (
              <p className="text-xs text-emerald-700 mt-0.5 leading-snug">
                {location.address ?? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`}
              </p>
            )}

            {location && (
              <p className="text-[11px] text-emerald-600 mt-0.5 flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                Akurasi: ±{Math.round(location.accuracy)} meter
              </p>
            )}

            {locationError && (
              <p className="text-xs text-red-600 mt-0.5 leading-snug">
                {locationError}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Time & type info */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.4 }}
        className="flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm"
      >
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
            attendanceType === "check_in" ? "bg-blue-100" : "bg-orange-100"
          )}
        >
          <Clock
            className={cn(
              "w-4.5 h-4.5",
              attendanceType === "check_in" ? "text-blue-600" : "text-orange-600"
            )}
          />
        </div>
        <div className="flex-1">
          <p className="text-xs text-slate-400 font-medium leading-none mb-0.5">
            {attendanceType === "check_in" ? "Waktu Absen Masuk" : "Waktu Absen Pulang"}
          </p>
          <p className="text-sm font-bold text-slate-900">
            {formatTime(new Date())} WIB •{" "}
            {formatDate(new Date(), "EEEE, dd MMMM yyyy")}
          </p>
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="grid grid-cols-2 gap-3"
      >
        {/* Retake */}
        <button
          onClick={onRetake}
          disabled={submitting}
          className={cn(
            "flex items-center justify-center gap-2",
            "h-13 rounded-2xl",
            "border-2 border-slate-200 bg-white",
            "text-sm font-semibold text-slate-700",
            "hover:bg-slate-50 hover:border-slate-300",
            "active:scale-[0.97] transition-all duration-150",
            "disabled:opacity-50 disabled:pointer-events-none",
            "tap-highlight-none"
          )}
          style={{ height: 52 }}
        >
          <RotateCcw className="w-4 h-4" />
          Foto Ulang
        </button>

        {/* Submit */}
        <button
          onClick={onSubmit}
          disabled={submitting || locationLoading}
          className={cn(
            "flex items-center justify-center gap-2",
            "h-13 rounded-2xl",
            "text-sm font-bold text-white",
            "active:scale-[0.97] transition-all duration-150",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            "shadow-md tap-highlight-none",
            attendanceType === "check_in"
              ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
              : "bg-orange-500 hover:bg-orange-600 shadow-orange-200"
          )}
          style={{ height: 52 }}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Kirim Presensi
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Success screen
───────────────────────────────────────────────────────── */

function SuccessScreen({
  attendanceType,
  time,
  location,
}: {
  attendanceType: AttendanceType;
  time: string;
  location: LocationData | null;
}) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      className="flex flex-col items-center text-center py-8 px-4"
    >
      {/* Success icon */}
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.15, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        className={cn(
          "w-24 h-24 rounded-3xl flex items-center justify-center mb-5",
          "shadow-xl",
          attendanceType === "check_in"
            ? "bg-emerald-500 shadow-emerald-200"
            : "bg-orange-500 shadow-orange-200"
        )}
      >
        <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2} />
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="text-xl font-extrabold text-slate-900 mb-1.5"
      >
        {attendanceType === "check_in" ? "Absen Masuk Berhasil! 🎉" : "Absen Pulang Berhasil! 👋"}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38, duration: 0.4 }}
        className="text-sm text-slate-500 leading-relaxed max-w-xs"
      >
        {attendanceType === "check_in"
          ? "Kehadiran Anda telah tercatat. Semangat dalam kegiatan PKL hari ini!"
          : "Presensi pulang Anda telah dicatat. Selamat beristirahat dan sampai jumpa besok!"}
      </motion.p>

      {/* Details card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.46, duration: 0.4 }}
        className="w-full max-w-xs mt-6 bg-slate-50 rounded-2xl p-4 space-y-3 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Waktu</p>
            <p className="text-sm font-bold text-slate-800">{time} WIB</p>
          </div>
        </div>

        {location && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <MapPin className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-slate-400 font-medium">Lokasi</p>
              <p className="text-sm font-medium text-slate-800 leading-snug">
                {location.address ?? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Status</p>
            <p className="text-sm font-semibold text-amber-600">
              Menunggu Verifikasi Guru
            </p>
          </div>
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.4 }}
        className="w-full max-w-xs mt-6 space-y-3"
      >
        <Link
          href="/siswa/jurnal/buat"
          className={cn(
            "flex items-center justify-center gap-2",
            "w-full h-12 rounded-2xl",
            "bg-blue-600 text-white",
            "text-sm font-semibold",
            "hover:bg-blue-700 active:scale-[0.97]",
            "transition-all duration-150 shadow-md shadow-blue-200",
            "tap-highlight-none"
          )}
        >
          Isi Jurnal Sekarang
          <ChevronRight className="w-4 h-4" />
        </Link>

        <button
          onClick={() => router.push("/siswa/dashboard")}
          className={cn(
            "flex items-center justify-center gap-2",
            "w-full h-12 rounded-2xl",
            "bg-slate-100 text-slate-700",
            "text-sm font-semibold",
            "hover:bg-slate-200 active:scale-[0.97]",
            "transition-all duration-150",
            "tap-highlight-none"
          )}
        >
          Kembali ke Dashboard
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   History tab
───────────────────────────────────────────────────────── */

function AttendanceHistory({
  record,
  loading,
}: {
  record: TodayRecord;
  loading: boolean;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-slate-700 px-1">Presensi Hari Ini</h3>

      {loading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Check In */}
          <div
            className={cn(
              "flex items-center gap-3 p-4 rounded-2xl border",
              record.check_in
                ? "bg-emerald-50 border-emerald-200"
                : "bg-slate-50 border-slate-200"
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                record.check_in ? "bg-emerald-100" : "bg-slate-200"
              )}
            >
              {record.check_in ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <Camera className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-semibold leading-tight",
                  record.check_in ? "text-emerald-800" : "text-slate-500"
                )}
              >
                Absen Masuk
              </p>
              <p
                className={cn(
                  "text-xs mt-0.5",
                  record.check_in ? "text-emerald-600" : "text-slate-400"
                )}
              >
                {record.check_in ? `${record.check_in.time} WIB` : "Belum absen"}
              </p>
            </div>
            {record.check_in && (
              <span
                className={cn(
                  "text-[10px] font-semibold px-2 py-1 rounded-full",
                  record.check_in.status === "verified"
                    ? "bg-emerald-100 text-emerald-700"
                    : record.check_in.status === "rejected"
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
                )}
              >
                {record.check_in.status === "verified"
                  ? "✓ Terverifikasi"
                  : record.check_in.status === "rejected"
                  ? "✗ Ditolak"
                  : "⏳ Menunggu"}
              </span>
            )}
          </div>

          {/* Check Out */}
          <div
            className={cn(
              "flex items-center gap-3 p-4 rounded-2xl border",
              record.check_out
                ? "bg-orange-50 border-orange-200"
                : "bg-slate-50 border-slate-200"
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                record.check_out ? "bg-orange-100" : "bg-slate-200"
              )}
            >
              {record.check_out ? (
                <CheckCircle2 className="w-5 h-5 text-orange-600" />
              ) : (
                <Clock className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-semibold leading-tight",
                  record.check_out ? "text-orange-800" : "text-slate-500"
                )}
              >
                Absen Pulang
              </p>
              <p
                className={cn(
                  "text-xs mt-0.5",
                  record.check_out ? "text-orange-600" : "text-slate-400"
                )}
              >
                {record.check_out ? `${record.check_out.time} WIB` : "Belum absen"}
              </p>
            </div>
            {record.check_out && (
              <span
                className={cn(
                  "text-[10px] font-semibold px-2 py-1 rounded-full",
                  record.check_out.status === "verified"
                    ? "bg-emerald-100 text-emerald-700"
                    : record.check_out.status === "rejected"
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
                )}
              >
                {record.check_out.status === "verified"
                  ? "✓ Terverifikasi"
                  : record.check_out.status === "rejected"
                  ? "✗ Ditolak"
                  : "⏳ Menunggu"}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Link riwayat lengkap */}
      <Link
        href="/siswa/presensi/riwayat"
        className={cn(
          "flex items-center justify-center gap-2",
          "w-full h-11 rounded-2xl",
          "border border-slate-200 bg-white",
          "text-sm font-semibold text-slate-600",
          "hover:bg-slate-50 hover:border-slate-300",
          "active:scale-[0.97] transition-all duration-150",
          "tap-highlight-none"
        )}
      >
        <Calendar className="w-4 h-4" />
        Lihat Riwayat Lengkap
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main Presensi Page
───────────────────────────────────────────────────────── */

export default function PresensiPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useAuthStore();
  const supabase = createClient();

  // Ambil context siswa (studentId + pklAssignmentId) dari Supabase
  const { context: studentCtx, loading: ctxLoading, error: ctxError } = useStudentContext();

  const typeParam = searchParams.get("type");
  const [attendanceType, setAttendanceType] = useState<AttendanceType>(
    typeParam === "check_out" ? "check_out" : "check_in"
  );

  const [step, setStep] = useState<Step>("camera");
  const [photoDataURL, setPhotoDataURL] = useState<string | null>(null);
  const [successTime, setSuccessTime] = useState<string>("");

  const [todayRecord, setTodayRecord] = useState<TodayRecord>({
    check_in: null,
    check_out: null,
  });
  const [historyLoading, setHistoryLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"camera" | "history">("camera");

  const { location, locationError, locationLoading, getLocation } =
    useGeolocation();

  /* ── Load today's record ───────────────────────────── */

  useEffect(() => {
    async function loadToday() {
      if (!studentCtx) return; // Tunggu context siap
      setHistoryLoading(true);
      try {
        const todayStr = new Date().toISOString().split("T")[0];
        const { data } = await supabase
          .from("attendance")
          .select("type, created_at, status")
          .eq("student_id", studentCtx.studentId)
          .eq("pkl_assignment_id", studentCtx.pklAssignmentId)
          .eq("date", todayStr)
          .order("created_at");

        if (data) {
          const ci = data.find((a: { type: string }) => a.type === "check_in");
          const co = data.find((a: { type: string }) => a.type === "check_out");
          setTodayRecord({
            check_in: ci
              ? { time: formatTime(ci.created_at), status: ci.status, selfie_url: null }
              : null,
            check_out: co
              ? { time: formatTime(co.created_at), status: co.status, selfie_url: null }
              : null,
          });

          // Auto-switch type: if check_in done, default to check_out
          if (ci && !co && typeParam !== "check_in") {
            setAttendanceType("check_out");
          }
        }
      } catch {
        // Silent fail
      } finally {
        setHistoryLoading(false);
      }
    }

    loadToday();
  }, [studentCtx]);


  /* ── Handlers ──────────────────────────────────────── */

  const handleCapture = async (dataURL: string) => {
    setPhotoDataURL(dataURL);
    setStep("preview");
    // Start getting location in background
    getLocation().catch(() => {}); // Don't block on error
  };

  const handleRetake = () => {
    setPhotoDataURL(null);
    setStep("camera");
  };

  const handleSubmit = async () => {
    if (!photoDataURL || !profile?.id) {
      toast.error("Data tidak lengkap. Coba lagi.");
      return;
    }

    if (!studentCtx) {
      toast.error("Data PKL belum siap. Coba lagi.");
      return;
    }

    setStep("submitting");

    try {
      // 1. Compress & upload photo ke Supabase Storage
      const blob = dataURLtoBlob(photoDataURL);
      const file = new File([blob], `selfie-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      const compressed = await compressImage(file, 1280, 0.82);
      const filePath = `attendance/${studentCtx.studentId}/${new Date().toISOString().split("T")[0]}-${attendanceType}.jpg`;

      let selfieUrl: string | null = null;

      const { error: uploadError } = await supabase.storage
        .from("selfies")
        .upload(filePath, compressed, { upsert: true, contentType: "image/jpeg" });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("selfies")
          .getPublicUrl(filePath);
        selfieUrl = urlData.publicUrl;
      } else {
        console.warn("Selfie upload warning:", uploadError.message);
        // Lanjut meskipun upload gagal — presensi tetap dicatat
      }

      // 2. Get location (jika belum)
      let loc = location;
      if (!loc) {
        try {
          loc = await getLocation();
        } catch {
          // continue without location
        }
      }

      // 3. Cek geofencing (jika koordinat tersedia)
      let isWithinRadius = true;
      if (
        loc &&
        studentCtx.companyLatitude !== null &&
        studentCtx.companyLongitude !== null
      ) {
        const R = 6371000; // radius bumi dalam meter
        const dLat = (loc.latitude - studentCtx.companyLatitude) * (Math.PI / 180);
        const dLon = (loc.longitude - studentCtx.companyLongitude) * (Math.PI / 180);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(studentCtx.companyLatitude * (Math.PI / 180)) *
            Math.cos(loc.latitude * (Math.PI / 180)) *
            Math.sin(dLon / 2) ** 2;
        const distance = 2 * R * Math.asin(Math.sqrt(a));
        isWithinRadius = distance <= studentCtx.companyRadius;
      }

      // 4. Insert ke tabel attendance
      const todayStr = new Date().toISOString().split("T")[0];
      const { error: insertError } = await supabase
        .from("attendance")
        .insert({
          student_id: studentCtx.studentId,       // UUID dari tabel students
          pkl_assignment_id: studentCtx.pklAssignmentId,
          date: todayStr,
          type: attendanceType,
          selfie_url: selfieUrl,
          latitude: loc?.latitude ?? null,
          longitude: loc?.longitude ?? null,
          address: loc?.address ?? null,
          is_within_radius: isWithinRadius,
          status: "pending",
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      // 5. Buat notifikasi untuk diri sendiri (konfirmasi)
      await supabase.from("notifications").insert({
        user_id: profile.id,
        title: attendanceType === "check_in" ? "Presensi Masuk Tercatat" : "Presensi Pulang Tercatat",
        body: `Presensi ${attendanceType === "check_in" ? "masuk" : "pulang"} Anda pada pukul ${formatTime(new Date())} telah tercatat dan menunggu verifikasi guru.`,
        type: "attendance",
        data: JSON.stringify({ type: attendanceType, assignment_id: studentCtx.pklAssignmentId }),
        is_read: false,
      });

      const time = formatTime(new Date());
      setSuccessTime(time);
      setStep("success");

      toast.success(
        attendanceType === "check_in"
          ? "Absen masuk berhasil! ✅"
          : "Absen pulang berhasil! 👋",
        { duration: 4000 }
      );
    } catch (err) {
      console.error("Presensi error:", err);
      setStep("error");
      toast.error("Gagal menyimpan presensi. Coba lagi.");
    }
  };


  /* ── Render ─────────────────────────────────────────── */

  // Banner error jika tidak ada PKL aktif
  if (!ctxLoading && ctxError) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-3 px-4 h-[60px] bg-white/85 backdrop-blur-xl border-b border-slate-200/60">
          <button
            onClick={() => router.push("/siswa/dashboard")}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors tap-highlight-none"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-4.5 h-4.5" strokeWidth={2.5} />
          </button>
          <h1 className="text-[17px] font-bold text-slate-900">Presensi</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center">
            <Building2 className="w-10 h-10 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Penempatan PKL Belum Ada</h2>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">{ctxError}</p>
          </div>
          <button
            onClick={() => router.push("/siswa/dashboard")}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-semibold hover:bg-blue-700 transition-colors tap-highlight-none"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center gap-3 px-4 h-[60px] bg-white/85 backdrop-blur-xl border-b border-slate-200/60">
        <button
          onClick={() => router.push("/siswa/dashboard")}
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors tap-highlight-none"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-4.5 h-4.5" strokeWidth={2.5} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[17px] font-bold text-slate-900">Presensi</h1>
          <p className="text-xs text-slate-400">
            {formatDate(new Date(), "EEEE, dd MMMM yyyy")}
          </p>
        </div>
      </header>

      <div className="px-4 py-5 max-w-md mx-auto space-y-5">
        {/* ── Only show tabs & type switcher when NOT in success/error step ── */}
        {step !== "success" && step !== "error" && (
          <>
            {/* Tab bar */}
            <div className="flex gap-1 bg-slate-100 rounded-2xl p-1">
              {(["camera", "history"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                    "tap-highlight-none",
                    activeTab === tab
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {tab === "camera" ? "📷 Presensi" : "📅 Riwayat Hari Ini"}
                </button>
              ))}
            </div>

            {/* Attendance type switcher — only on camera tab */}
            {activeTab === "camera" && (
              <div className="flex gap-2">
                {(["check_in", "check_out"] as AttendanceType[]).map((type) => {
                  const done =
                    type === "check_in"
                      ? !!todayRecord.check_in
                      : !!todayRecord.check_out;

                  return (
                    <motion.button
                      key={type}
                      onClick={() => setAttendanceType(type)}
                      whileTap={{ scale: 0.96 }}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2",
                        "py-3 rounded-2xl border-2",
                        "text-sm font-semibold",
                        "transition-all duration-200",
                        "tap-highlight-none select-none",
                        attendanceType === type
                          ? type === "check_in"
                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200"
                            : "bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-200"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      )}
                    >
                      {done && (
                        <CheckCircle2 className="w-4 h-4 text-current opacity-80" />
                      )}
                      {type === "check_in" ? "Masuk" : "Pulang"}
                      {done && (
                        <span className="text-[10px] opacity-70">
                          ({type === "check_in"
                            ? todayRecord.check_in?.time
                            : todayRecord.check_out?.time})
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── Main content ────────────────────────────── */}
        <AnimatePresence mode="wait">
          {/* SUCCESS */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <SuccessScreen
                attendanceType={attendanceType}
                time={successTime}
                location={location}
              />
            </motion.div>
          )}

          {/* ERROR */}
          {step === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center text-center py-10 gap-4"
            >
              <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  Presensi Gagal
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                  Terjadi kesalahan saat menyimpan presensi. Pastikan koneksi
                  internet Anda stabil dan coba lagi.
                </p>
              </div>
              <button
                onClick={() => {
                  setStep("camera");
                  setPhotoDataURL(null);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-semibold hover:bg-blue-700 active:scale-[0.97] transition-all shadow-md shadow-blue-200 tap-highlight-none"
              >
                <RefreshCw className="w-4 h-4" />
                Coba Lagi
              </button>
            </motion.div>
          )}

          {/* CAMERA TAB */}
          {step !== "success" &&
            step !== "error" &&
            activeTab === "camera" && (
              <motion.div
                key="camera-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {/* Already submitted for this type */}
                {(attendanceType === "check_in" && todayRecord.check_in) ||
                (attendanceType === "check_out" && todayRecord.check_out) ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center py-10 gap-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: 0.1,
                        type: "spring",
                        stiffness: 300,
                      }}
                      className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                    </motion.div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 mb-1">
                        {attendanceType === "check_in"
                          ? "Sudah Absen Masuk"
                          : "Sudah Absen Pulang"}
                      </h3>
                      <p className="text-sm text-slate-500">
                        Pukul{" "}
                        <strong>
                          {attendanceType === "check_in"
                            ? todayRecord.check_in?.time
                            : todayRecord.check_out?.time}{" "}
                          WIB
                        </strong>
                      </p>
                    </div>
                    {attendanceType === "check_in" && !todayRecord.check_out && (
                      <button
                        onClick={() => setAttendanceType("check_out")}
                        className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-2xl text-sm font-semibold hover:bg-orange-600 active:scale-[0.97] transition-all shadow-md shadow-orange-200 tap-highlight-none"
                      >
                        Lanjut Absen Pulang
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                ) : step === "camera" ? (
                  <CameraView
                    onCapture={handleCapture}
                    attendanceType={attendanceType}
                  />
                ) : step === "preview" && photoDataURL ? (
                  <PreviewStep
                    photoDataURL={photoDataURL}
                    location={location}
                    locationLoading={locationLoading}
                    locationError={locationError}
                    onRetake={handleRetake}
                    onSubmit={handleSubmit}
                    submitting={false}
                    attendanceType={attendanceType}
                  />
                ) : step === "submitting" && photoDataURL ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-14 h-14 rounded-full border-4 border-blue-200 border-t-blue-600"
                    />
                    <p className="text-sm font-medium text-slate-600">
                      Menyimpan presensi...
                    </p>
                  </div>
                ) : null}
              </motion.div>
            )}

          {/* HISTORY TAB */}
          {step !== "success" &&
            step !== "error" &&
            activeTab === "history" && (
              <motion.div
                key="history-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <AttendanceHistory
                  record={todayRecord}
                  loading={historyLoading}
                />
              </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}
