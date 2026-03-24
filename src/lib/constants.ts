// Konstanta aplikasi PKL SMK HASSINA

export const APP_NAME = "PKL SMK HASSINA";
export const APP_DESCRIPTION = "Aplikasi Manajemen Praktek Kerja Industri";

export const ROUTES = {
  // Auth
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",

  // Siswa
  SISWA_DASHBOARD: "/siswa/dashboard",
  SISWA_PRESENSI: "/siswa/presensi",
  SISWA_PRESENSI_RIWAYAT: "/siswa/presensi/riwayat",
  SISWA_IZIN: "/siswa/izin",
  SISWA_IZIN_BUAT: "/siswa/izin/buat",
  SISWA_JURNAL: "/siswa/jurnal",
  SISWA_JURNAL_BUAT: "/siswa/jurnal/buat",
  SISWA_PENGUMUMAN: "/siswa/pengumuman",
  SISWA_CHAT: "/siswa/chat",
  SISWA_NOTIFIKASI: "/siswa/notifikasi",
  SISWA_DOKUMEN: "/siswa/dokumen",
  SISWA_PROFIL: "/siswa/profil",

  // Guru Pembimbing
  GURU_DASHBOARD: "/guru/dashboard",
  GURU_SISWA: "/guru/siswa",
  GURU_PRESENSI: "/guru/presensi",
  GURU_JURNAL: "/guru/jurnal",
  GURU_IZIN: "/guru/izin",
  GURU_PENGUMUMAN: "/guru/pengumuman",
  GURU_CHAT: "/guru/chat",
  GURU_NOTIFIKASI: "/guru/notifikasi",
  GURU_LAPORAN: "/guru/laporan",
  GURU_PENILAIAN: "/guru/penilaian",
  GURU_PROFIL: "/guru/profil",

  // Ketua Jurusan
  KAJUR_DASHBOARD: "/kajur/dashboard",
  KAJUR_SISWA: "/kajur/siswa",
  KAJUR_GURU: "/kajur/guru",
  KAJUR_PERUSAHAAN: "/kajur/perusahaan",
  KAJUR_PENEMPATAN: "/kajur/penempatan",
  KAJUR_PRESENSI: "/kajur/presensi",
  KAJUR_LAPORAN: "/kajur/laporan",
  KAJUR_DOKUMEN: "/kajur/dokumen",
  KAJUR_PROFIL: "/kajur/profil",

  // Super Admin
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_USERS: "/admin/users",
  ADMIN_JURUSAN: "/admin/jurusan",
  ADMIN_KELAS: "/admin/kelas",
  ADMIN_PERUSAHAAN: "/admin/perusahaan",
  ADMIN_PERIODE: "/admin/periode-pkl",
  ADMIN_PENGUMUMAN: "/admin/pengumuman",
  ADMIN_DOKUMEN: "/admin/dokumen",
  ADMIN_LAPORAN: "/admin/laporan",
  ADMIN_PENGATURAN: "/admin/pengaturan",
  ADMIN_PROFIL: "/admin/profil",
} as const;

// Peta dashboard berdasarkan peran pengguna
export const ROLE_DASHBOARD: Record<string, string> = {
  super_admin: ROUTES.ADMIN_DASHBOARD,
  ketua_jurusan: ROUTES.KAJUR_DASHBOARD,
  guru_pembimbing: ROUTES.GURU_DASHBOARD,
  siswa: ROUTES.SISWA_DASHBOARD,
};

// Warna status presensi
export const ATTENDANCE_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  verified: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

// Warna jenis izin/sakit
export const ABSENCE_TYPE_COLORS: Record<string, string> = {
  sick: "bg-red-100 text-red-800",
  permission: "bg-blue-100 text-blue-800",
  emergency: "bg-orange-100 text-orange-800",
  other: "bg-gray-100 text-gray-800",
};

// Warna status izin/sakit
export const ABSENCE_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

// Warna status jurnal harian
export const JOURNAL_STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  submitted: "bg-blue-100 text-blue-800",
  reviewed: "bg-green-100 text-green-800",
  revision: "bg-yellow-100 text-yellow-800",
};

// Warna jenis pengumuman
export const ANNOUNCEMENT_TYPE_COLORS: Record<string, string> = {
  general: "bg-blue-100 text-blue-800",
  urgent: "bg-red-100 text-red-800",
  event: "bg-purple-100 text-purple-800",
  reminder: "bg-yellow-100 text-yellow-800",
};

// Warna status penempatan PKL
export const PKL_ASSIGNMENT_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
};

// Nama hari dalam Bahasa Indonesia
export const DAYS_IN_INDONESIAN = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

// Nama bulan dalam Bahasa Indonesia
export const MONTHS_IN_INDONESIAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

// Batas ukuran file
export const MAX_SELFIE_SIZE_MB = 5;
export const MAX_DOCUMENT_SIZE_MB = 20;
export const MAX_JOURNAL_PHOTOS = 5;
export const MAX_CHAT_FILE_SIZE_MB = 10;
export const MAX_AVATAR_SIZE_MB = 2;

// Batas karakter
export const MAX_JOURNAL_TITLE_LENGTH = 150;
export const MAX_JOURNAL_CONTENT_LENGTH = 5000;
export const MAX_ABSENCE_REASON_LENGTH = 500;
export const MAX_ANNOUNCEMENT_CONTENT_LENGTH = 10000;
export const MAX_CHAT_MESSAGE_LENGTH = 2000;

// Konfigurasi presensi
export const ATTENDANCE_RADIUS_DEFAULT_METER = 100;
export const ATTENDANCE_SELFIE_QUALITY = 0.8;

// Konfigurasi pagination
export const DEFAULT_PAGE_SIZE = 10;
export const CHAT_MESSAGE_PAGE_SIZE = 30;
export const NOTIFICATION_PAGE_SIZE = 20;

// Konfigurasi nilai/grade
export const GRADE_THRESHOLDS: Record<string, number> = {
  A: 90,
  B: 80,
  C: 70,
  D: 60,
};

// Bobot penilaian PKL (dalam persen)
export const ASSESSMENT_WEIGHTS = {
  attendance: 25,   // Kehadiran
  journal: 25,      // Jurnal harian
  performance: 30,  // Kinerja/prestasi
  attitude: 20,     // Sikap
} as const;

// Kategori dokumen
export const DOCUMENT_CATEGORIES = [
  { value: "template", label: "Template" },
  { value: "panduan", label: "Panduan" },
  { value: "surat", label: "Surat" },
  { value: "laporan", label: "Laporan" },
  { value: "lainnya", label: "Lainnya" },
] as const;

// Jenis industri perusahaan DU/DI
export const INDUSTRY_TYPES = [
  "Teknologi Informasi",
  "Manufaktur",
  "Perdagangan",
  "Jasa Keuangan",
  "Kesehatan",
  "Pendidikan",
  "Konstruksi",
  "Perhotelan & Pariwisata",
  "Media & Komunikasi",
  "Pertanian",
  "Transportasi & Logistik",
  "Energi",
  "Lainnya",
] as const;

// Format tanggal yang digunakan di seluruh aplikasi
export const DATE_FORMAT = "dd MMMM yyyy";
export const DATE_TIME_FORMAT = "dd MMM yyyy, HH:mm";
export const TIME_FORMAT = "HH:mm";
export const API_DATE_FORMAT = "yyyy-MM-dd";
