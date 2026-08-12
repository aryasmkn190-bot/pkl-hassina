export type SiswaBimbingan = {
  id: string; nama: string; nis: string; kelas: string; dudi: string;
  hadir: number; izin: number; jurnalMenunggu: number; foto: string;
};
export type JurnalValidasi = {
  id: string; siswa: string; nis: string; tanggal: string; judul: string;
  kegiatan: string; status: "terkirim" | "disetujui" | "revisi";
};

export const SISWA_BIMBINGAN: SiswaBimbingan[] = [
  { id: "s1", nama: "Arya Putra", nis: "232410007", kelas: "XII TKJ 1", dudi: "PT Hassina Digital", hadir: 18, izin: 2, jurnalMenunggu: 1, foto: "https://i.pravatar.cc/150?img=15" },
  { id: "s2", nama: "Siti Nurhaliza", nis: "232410012", kelas: "XII TKJ 1", dudi: "CV Solusi Jaringan", hadir: 16, izin: 3, jurnalMenunggu: 2, foto: "https://i.pravatar.cc/150?img=5" },
  { id: "s3", nama: "Rizky Maulana", nis: "232410021", kelas: "XII RPL 2", dudi: "PT Hassina Digital", hadir: 20, izin: 0, jurnalMenunggu: 0, foto: "https://i.pravatar.cc/150?img=12" },
  { id: "s4", nama: "Dewi Lestari", nis: "232410033", kelas: "XII MM 1", dudi: "Studio Hassina Creative", hadir: 14, izin: 4, jurnalMenunggu: 1, foto: "https://i.pravatar.cc/150?img=9" },
];

export const JURNAL_ANTRIAN: JurnalValidasi[] = [
  { id: "j2", siswa: "Siti Nurhaliza", nis: "232410012", tanggal: "2026-08-12", judul: "Konfigurasi VLAN & trunk", kegiatan: "Konfigurasi VLAN 10/20 di switch, trunk ke router, uji inter-VLAN routing. Dokumentasi topologi.", status: "terkirim" },
  { id: "j4", siswa: "Arya Putra", nis: "232410007", tanggal: "2026-08-11", judul: "Troubleshoot AP lantai 2", kegiatan: "AP down, reset & rekonfigurasi SSID, monitoring bandwidth Mikrotik. Foto AP & hasil speedtest terlampir.", status: "terkirim" },
  { id: "j5", siswa: "Dewi Lestari", nis: "232410033", tanggal: "2026-08-11", judul: "Desain banner PPDB", kegiatan: "Desain 3 opsi banner PPDB di Figma, revisi warna sesuai brand guide.", status: "terkirim" },
];

export type Dudi = { id: string; nama: string; alamat: string; kuota: number; terisi: number; pic: string; telp: string; };
export const DUDI_LIST: Dudi[] = [
  { id: "d1", nama: "PT Hassina Digital Solution", alamat: "Jl. Raya Cikarang-Cibarusah No.88, Bekasi", kuota: 10, terisi: 6, pic: "Pak Hendra", telp: "0812-xxxx-001" },
  { id: "d2", nama: "CV Solusi Jaringan", alamat: "Jl. Industri No.12, Cikarang", kuota: 6, terisi: 4, pic: "Bu Rina", telp: "0812-xxxx-002" },
  { id: "d3", nama: "Studio Hassina Creative", alamat: "Jl. Fajar No.5, Bekasi", kuota: 8, terisi: 3, pic: "Kak Dimas", telp: "0812-xxxx-003" },
];
