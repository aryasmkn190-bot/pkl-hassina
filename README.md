# PKL HASSINA — Monitoring Kehadiran & Jurnal PKL/Magang

**Domain produksi (halaman Siswa):** `https://portal.smkhassina.sch.id`
- Mobile-first, style **Pulse** (violet #7c3aed, card rounded-2xl, bottom nav)
- VPS 43.129.35.127 (Caddy) → Next.js `127.0.0.1:3456` ; Cloudflare proxy ON → Full Strict + LE

## Jalankan
```bash
cd /home/ubuntu/projects/pkl-hassina
npm install
npm run dev              # http://localhost:3000  (test mobile 390x844)
npm run build && npm run start -- -p 3456 -H 127.0.0.1
```

## Deploy ke portal.smkhassina.sch.id
Opsi A — Next di VPS yang sama dengan Caddy (disarankan):
```
portal.smkhassina.sch.id {
  encode zstd gzip
  reverse_proxy 127.0.0.1:3456
}
```
`caddy validate && systemctl reload caddy`

Opsi B — CloudPanel Node site (jika ada template Node): site portal.smkhassina.sch.id → start `npm run start -- -p 3000`.

## Fitur halaman Siswa (sudah live preview lokal)
- **Beranda:** ringkasan hadir/jurnal, kartu DUDI, CTA Absen/Jurnal, "Hari ini", jurnal terbaru
- **Absensi:** foto selfie + GPS (validasi radius DUDI di server), Absen Masuk/Pulang, riwayat 7 hari
- **Jurnal:** form harian (judul/kegiatan/kendala) + status draft/terkirim/disetujui/revisi + feedback pembimbing
- **Profil:** data siswa, DUDI, pembimbing, domain

## Next (butuh konfirmasi sebelum lanjut)
- Auth siswa (NIS+password/OTP), role pembimbing & admin, middleware
- API: POST /api/absensi (multipart foto+lat/lng), POST /api/jurnal, GET /api/rekap
- Storage foto (R2/S3), validasi GPS Haversine, ekspor Excel rekap
