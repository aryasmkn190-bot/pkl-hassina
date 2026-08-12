export type AbsensiStatus = "hadir" | "izin" | "sakit" | "alpha";
export type JurnalStatus = "draft" | "terkirim" | "disetujui" | "revisi";

export type Siswa = {
  id: string; nama: string; nis: string; kelas: string; jurusan: string;
  dudi: string; alamatDudi: string; pembimbing: string; foto: string;
};

export type Absensi = {
  id: string; tanggal: string; jamMasuk?: string; jamPulang?: string;
  status: AbsensiStatus; fotoMasuk?: string; lat?: number; lng?: number;
  jarakMeter?: number; catatan?: string;
};

export type Jurnal = {
  id: string; tanggal: string; judul: string; kegiatan: string;
  jamMulai: string; jamSelesai: string; kendala?: string;
  foto?: string[]; status: JurnalStatus; feedback?: string;
};

export const MOCK_SISWA: Siswa = {
  id: "s1", nama: "Arya Putra", nis: "232410007", kelas: "XII TKJ 1", jurusan: "Teknik Komputer & Jaringan",
  dudi: "PT Hassina Digital Solution", alamatDudi: "Jl. Raya Cikarang-Cibarusah No. 88, Bekasi",
  pembimbing: "Bu Siti Aminah, S.Kom", foto: "https://i.pravatar.cc/200?img=15",
};

export const MOCK_ABSENSI: Absensi[] = [
  { id: "a1", tanggal: "2026-08-12", jamMasuk: "07:58", jamPulang: "16:05", status: "hadir", jarakMeter: 18 },
  { id: "a2", tanggal: "2026-08-11", jamMasuk: "08:02", jamPulang: "16:10", status: "hadir", jarakMeter: 42 },
  { id: "a3", tanggal: "2026-08-10", status: "izin", catatan: "Demam" },
  { id: "a4", tanggal: "2026-08-09", jamMasuk: "07:55", jamPulang: "16:00", status: "hadir", jarakMeter: 12 },
  { id: "a5", tanggal: "2026-08-08", jamMasuk: "08:12", status: "hadir", jarakMeter: 35 },
];

export const MOCK_JURNAL: Jurnal[] = [
  { id: "j1", tanggal: "2026-08-12", judul: "Instalasi & crimping kabel UTP", kegiatan: "Membuat 6 kabel straight untuk lab RPL, uji dengan LAN tester, semua OK. Belajar VLAN dasar di switch.", jamMulai: "08:00", jamSelesai: "12:00", status: "disetujui", feedback: "Bagus, lanjutkan dokumentasi VLAN." },
  { id: "j2", tanggal: "2026-08-11", judul: "Troubleshoot jaringan lab", kegiatan: "Cek koneksi AP lantai 2 yang down, reset AP dan konfigurasi ulang SSID. Monitoring bandwidth Mikrotik.", jamMulai: "09:00", jamSelesai: "15:00", status: "terkirim" },
  { id: "j3", tanggal: "2026-08-09", judul: "Backup & inventory", kegiatan: "Backup konfigurasi router, update inventaris perangkat, label ulang port patch panel.", jamMulai: "08:30", jamSelesai: "14:00", status: "revisi", feedback: "Tambahkan foto patch panel ya." },
];

export const STATS = { hadir: 18, izin: 2, sakit: 1, alpha: 0, jurnalDisetujui: 14, jurnalRevisi: 1 };
