# Panduan Rilis — PKL HASSINA (portal.smkhassina.sch.id)

## Akses
- Siswa: https://portal.smkhassina.sch.id/login → NIS + password awal **123456** (wajib ganti setelah login)
- Pembimbing: email + password
- Admin: admin@smkhassina.sch.id / admin123

## Akun Seed (10 siswa + 2 pembimbing)
Siswa (NIS → nama): 232410001 Ahmad Fauzi … 232410010 Linda Permata. Pembimbing: siti@smkhassina.sch.id / budi@smkhassina.sch.id (pw: pembimbing123).

## Alur
1. Siswa login → /siswa (Pulse mobile, logo HASSINA bulat)
2. Tab Absensi → Masuk/Pulang (butuh GPS + izinkan lokasi) → foto (jika diminta browser) → server validasi radius DUDI
3. Tab Jurnal → Tulis → Kirim (status TERKIRIM)
4. Pembimbing login → /pembimbing → approve/revisi + feedback

## Admin
- Import Excel: siapkan CSV (NIS,nama,kelas,jurusan,dudiId) lalu hubungi admin untuk seed ulang.
- Kelola DUDI di DB: lat/lng + radiusM (meter).

## Operasional
- DB: postgres:16 di 127.0.0.1:5433 (container pkl-hassina-db), `DATABASE_URL` di .env
- Backup: cron 02:00 → /var/backups/pkl-hassina/YYYYMMDD.sql.gz (retain 14 hari) via /usr/local/bin/pkl-backup.sh
- Uploads: /var/lib/pkl-hassina/uploads (serve via Caddy /uploads/*)
- Service: systemctl status pkl-hassina (Next start 3456), caddy validate && reload
