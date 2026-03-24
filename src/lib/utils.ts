import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { id } from "date-fns/locale";

// Menggabungkan class names dengan tailwind merge
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format tanggal ke format Indonesia
export function formatDate(date: string | Date, formatStr = "dd MMMM yyyy") {
  return format(new Date(date), formatStr, { locale: id });
}

// Format tanggal dan waktu
export function formatDateTime(date: string | Date) {
  return format(new Date(date), "dd MMM yyyy, HH:mm", { locale: id });
}

// Format waktu saja
export function formatTime(date: string | Date) {
  return format(new Date(date), "HH:mm", { locale: id });
}

// Format waktu relatif (hari ini, kemarin, dst.)
export function formatRelativeTime(date: string | Date) {
  const d = new Date(date);
  if (isToday(d)) return `Hari ini, ${format(d, "HH:mm")}`;
  if (isYesterday(d)) return `Kemarin, ${format(d, "HH:mm")}`;
  return formatDistanceToNow(d, { addSuffix: true, locale: id });
}

// Format ukuran file ke format yang mudah dibaca
export function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Mendapatkan inisial nama
export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Label status presensi
export function getAttendanceStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Menunggu Verifikasi",
    verified: "Terverifikasi",
    rejected: "Ditolak",
  };
  return labels[status] ?? status;
}

// Label tipe izin/absensi
export function getAbsenceTypeLabel(type: string) {
  const labels: Record<string, string> = {
    sick: "Sakit",
    permission: "Izin",
    emergency: "Darurat",
    other: "Lainnya",
  };
  return labels[type] ?? type;
}

// Label status izin/absensi
export function getAbsenceStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Menunggu Persetujuan",
    approved: "Disetujui",
    rejected: "Ditolak",
  };
  return labels[status] ?? status;
}

// Label status jurnal
export function getJournalStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: "Draft",
    submitted: "Terkirim",
    reviewed: "Sudah Direview",
    revision: "Perlu Revisi",
  };
  return labels[status] ?? status;
}

// Label tipe pengumuman
export function getAnnouncementTypeLabel(type: string) {
  const labels: Record<string, string> = {
    general: "Umum",
    urgent: "Penting",
    event: "Kegiatan",
    reminder: "Pengingat",
  };
  return labels[type] ?? type;
}

// Label peran pengguna
export function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    super_admin: "Super Admin",
    ketua_jurusan: "Ketua Jurusan",
    guru_pembimbing: "Guru Pembimbing",
    siswa: "Siswa",
  };
  return labels[role] ?? role;
}

// Label status penempatan PKL
export function getPKLAssignmentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Menunggu",
    active: "Aktif",
    completed: "Selesai",
    cancelled: "Dibatalkan",
  };
  return labels[status] ?? status;
}

// Label kategori dokumen
export function getDocumentCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    template: "Template",
    panduan: "Panduan",
    surat: "Surat",
    laporan: "Laporan",
    lainnya: "Lainnya",
  };
  return labels[category] ?? category;
}

// Menghitung persentase kehadiran
export function calculateAttendancePercentage(present: number, total: number) {
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
}

// Mendapatkan nilai huruf dari nilai angka
export function getGradeFromScore(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "E";
}

// Mendapatkan warna badge berdasarkan persentase kehadiran
export function getAttendanceBadgeColor(percentage: number): string {
  if (percentage >= 90) return "bg-green-100 text-green-800";
  if (percentage >= 75) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

// Mengkonversi data URL ke Blob untuk upload
export function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) throw new Error("Format data URL tidak valid");
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// Mengkompresi gambar sebelum upload
export async function compressImage(
  file: File,
  maxWidthPx = 1280,
  qualityPercent = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      if (width > maxWidthPx) {
        height = Math.round((height * maxWidthPx) / width);
        width = maxWidthPx;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Gagal membuat canvas context"));

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Gagal mengkompresi gambar"));
          resolve(blob);
        },
        "image/jpeg",
        qualityPercent
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gagal memuat gambar"));
    };

    img.src = url;
  });
}

// Menghitung jarak antara dua koordinat (Haversine formula) dalam meter
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius bumi dalam meter
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Memeriksa apakah koordinat berada dalam radius tertentu
export function isWithinRadius(
  userLat: number,
  userLon: number,
  targetLat: number,
  targetLon: number,
  radiusMeter: number
): boolean {
  const distance = calculateDistance(userLat, userLon, targetLat, targetLon);
  return distance <= radiusMeter;
}

// Memotong teks panjang dengan ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

// Memformat nomor telepon Indonesia
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    return "+62" + cleaned.slice(1);
  }
  if (cleaned.startsWith("62")) {
    return "+" + cleaned;
  }
  return phone;
}

// Memvalidasi format NIS
export function isValidNIS(nis: string): boolean {
  return /^\d{5,15}$/.test(nis);
}

// Mendapatkan salam berdasarkan waktu
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Selamat Pagi";
  if (hour >= 12 && hour < 15) return "Selamat Siang";
  if (hour >= 15 && hour < 18) return "Selamat Sore";
  return "Selamat Malam";
}

// Menghasilkan warna avatar dari string
export function stringToAvatarColor(str: string): string {
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Mengelompokkan array berdasarkan key
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (result, item) => {
      const groupKey = String(item[key]);
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    },
    {} as Record<string, T[]>
  );
}

// Mengubah snake_case ke Title Case
export function snakeToTitleCase(str: string): string {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Menghasilkan slug dari string
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}
