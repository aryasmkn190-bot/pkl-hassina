📋 PERENCANAAN APLIKASI PKL SMK HASSINA

## 🎯 Ringkasan Eksekutif

Aplikasi **HASSINA PKL** adalah Progressive Web App (PWA) untuk mengelola seluruh siklus Praktek Kerja Industri (PKL) siswa SMK HASSINA — mulai dari presensi digital, jurnal harian, monitoring guru, hingga laporan akhir — semua dalam satu platform yang modern, cepat, dan dapat diinstall layaknya aplikasi native di perangkat mobile.

---

## 🏗️ ARSITEKTUR & TECH STACK

### Frontend
| Teknologi | Versi | Alasan |
|-----------|-------|--------|
| **Next.js** | 15 (App Router) | SSR/SSG, file-based routing, API routes built-in, optimal untuk PWA |
| **TypeScript** | 5.x | Type safety, DX lebih baik, deteksi error dini |
| **Tailwind CSS** | v4 | Utility-first, cepat, konsisten |
| **Shadcn/UI** | Latest | Komponen siap pakai, accessible, customizable |
| **Framer Motion** | 11.x | Micro animasi, gesture, layout animation |
| **Lucide React** | Latest | Icon set modern & konsisten |

### Backend & Database
| Teknologi | Alasan |
|-----------|--------|
| **Supabase** | PostgreSQL, Auth, Storage, Realtime — semua-dalam-satu |
| **Next.js API Routes** | Edge runtime untuk API cepat |
| **Supabase Realtime** | WebSocket untuk chat & notifikasi live |
| **Supabase Storage** | File upload (foto presensi, dokumen laporan) |
| **Supabase Edge Functions** | Logika server kompleks (push notification, PDF generation) |

### State & Data Fetching
| Teknologi | Alasan |
|-----------|--------|
| **TanStack Query v5** | Server state, caching, background refetch |
| **Zustand v4** | Client/UI state management |
| **React Hook Form + Zod** | Form handling + validasi schema |

### PWA & Fitur Native
| Teknologi | Alasan |
|-----------|--------|
| **@ducanh2912/next-pwa** | PWA manifest, service worker, offline support |
| **Web Push API** | Push notification ke device (termasuk saat app ditutup) |
| **MediaDevices API** | Akses kamera untuk selfie presensi |
| **Geolocation API** | Tracking lokasi real-time |
| **Leaflet.js** | Peta interaktif untuk visualisasi lokasi |

### Tools Pendukung
| Teknologi | Fungsi |
|-----------|--------|
| **pdf-lib / jsPDF** | Generate sertifikat & laporan PDF |
| **Recharts** | Grafik & visualisasi data |
| **date-fns** | Manipulasi tanggal |
| **React Webcam** | Komponen kamera |
| **xlsx** | Export ke Excel |

---

## 🎨 DESIGN SYSTEM

### Color Palette
```
Primary    → #2563EB (Blue 600) — kepercayaan, profesional
Secondary  → #059669 (Emerald 600) — hadir, aktif, sukses  
Accent     → #F59E0B (Amber 500) — peringatan, highlight
Danger     → #DC2626 (Red 600) — tidak hadir, error
Surface    → #F8FAFC (Slate 50) — background utama
Card       → #FFFFFF — permukaan kartu
Text       → #0F172A (Slate 900)
Muted      → #64748B (Slate 500)
```

### Design Principles
- **Mobile-first** — Dirancang untuk layar 375px, kemudian scale up
- **Bottom Navigation** — Tab bar bawah seperti app native (iOS/Android)
- **Cards & Rounded Corners** — Radius 16-24px, shadow halus
- **Glassmorphism subtle** — Untuk header & overlay
- **Micro animations** — Spring physics dengan Framer Motion
- **Skeleton Loading** — Setiap komponen punya loading state
- **Dark Mode Ready** — Support tema gelap
- **Haptic-style feedback** — Visual bounce & ripple effect

---

## 👥 ROLE & PERMISSION MATRIX

| Fitur | Super Admin | Ketua Jurusan | Guru Pembimbing | Siswa |
|-------|:-----------:|:-------------:|:---------------:|:-----:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Presensi (Selfie+GPS) | — | — | — | ✅ |
| Lihat Presensi Siswa | ✅ | ✅ | ✅ (siswa binaan) | ✅ (sendiri) |
| Verifikasi Presensi | — | ✅ | ✅ | — |
| Pengajuan Izin/Sakit | — | — | — | ✅ |
| Approval Izin/Sakit | — | ✅ | ✅ | — |
| Jurnal Harian | — | — | — | ✅ |
| Review Jurnal | — | ✅ | ✅ | — |
| Feedback Jurnal | — | — | ✅ | — |
| Pengumuman (buat) | ✅ | ✅ | ✅ | — |
| Pengumuman (lihat) | ✅ | ✅ | ✅ | ✅ |
| Chat | ✅ | ✅ | ✅ | ✅ |
| Notifikasi | ✅ | ✅ | ✅ | ✅ |
| Dokumen/Template | ✅ (CRUD) | ✅ (CRUD) | ✅ (read) | ✅ (read) |
| Penilaian | — | ✅ | ✅ | ✅ (lihat) |
| Manaj. User | ✅ | — | — | — |
| Manaj. Jurusan | ✅ | — | — | — |
| Manaj. Perusahaan | ✅ | ✅ | — | — |
| Manaj. Periode PKL | ✅ | ✅ | — | — |
| Laporan & Rekap | ✅ | ✅ | ✅ (terbatas) | — |
| Konfigurasi Sistem | ✅ | — | — | — |

---

## 📱 STRUKTUR HALAMAN & ROUTING

### 🔐 Auth Routes
```
/login                    → Halaman login
/register                 → Registrasi (opsional, bisa via admin)
/forgot-password          → Reset password
/onboarding               → Setup pertama kali setelah login
```

### 👨‍🎓 Siswa Routes (`/siswa/*`)
```
/siswa/dashboard          → Beranda utama
/siswa/presensi           → Halaman presensi (kamera + GPS)
/siswa/presensi/riwayat   → Riwayat kehadiran + kalender
/siswa/izin               → Pengajuan tidak hadir
/siswa/izin/buat          → Form pengajuan izin/sakit
/siswa/izin/riwayat       → Riwayat pengajuan
/siswa/jurnal             → Daftar jurnal harian
/siswa/jurnal/buat        → Form isi jurnal baru
/siswa/jurnal/[id]        → Detail jurnal + feedback guru
/siswa/pengumuman         → Daftar pengumuman
/siswa/pengumuman/[id]    → Detail pengumuman
/siswa/chat               → Daftar chat room
/siswa/chat/[roomId]      → Percakapan chat
/siswa/notifikasi         → Pusat notifikasi
/siswa/dokumen            → Daftar dokumen/template
/siswa/profil             → Profil & pengaturan
/siswa/pkl-info           → Info perusahaan tempat PKL
```

### 👨‍🏫 Guru Pembimbing Routes (`/guru/*`)
```
/guru/dashboard           → Dashboard monitoring
/guru/siswa               → Daftar siswa binaan
/guru/siswa/[id]          → Profil detail siswa + progress
/guru/presensi            → Monitoring presensi semua siswa
/guru/presensi/verifikasi → Verifikasi presensi pending
/guru/izin                → Daftar pengajuan izin/sakit
/guru/izin/[id]           → Detail + approval izin
/guru/jurnal              → Semua jurnal siswa
/guru/jurnal/[id]         → Detail jurnal + beri feedback
/guru/pengumuman          → Kelola pengumuman
/guru/chat                → Chat dengan siswa/admin
/guru/notifikasi          → Notifikasi
/guru/dokumen             → Kelola dokumen
/guru/laporan             → Rekap & laporan
/guru/penilaian           → Input nilai PKL
/guru/profil              → Profil & pengaturan
```

### 🎓 Ketua Jurusan Routes (`/kajur/*`)
```
/kajur/dashboard          → Dashboard jurusan
/kajur/siswa              → Semua siswa jurusan
/kajur/guru               → Manajemen guru pembimbing
/kajur/perusahaan         → Data perusahaan mitra
/kajur/penempatan         → Penempatan siswa ke perusahaan
/kajur/presensi           → Rekap presensi jurusan
/kajur/jurnal             → Overview jurnal
/kajur/izin               → Approval izin (backup)
/kajur/pengumuman         → Kelola pengumuman
/kajur/dokumen            → Kelola template dokumen
/kajur/chat               → Chat
/kajur/laporan            → Laporan komprehensif
/kajur/penilaian          → Overview penilaian
/kajur/notifikasi         → Notifikasi
/kajur/profil             → Profil & pengaturan
```

### 🔧 Super Admin Routes (`/admin/*`)
```
/admin/dashboard          → System overview
/admin/users              → CRUD semua user
/admin/users/[id]         → Detail user
/admin/jurusan            → Manajemen jurusan
/admin/kelas              → Manajemen kelas
/admin/tahun-ajaran       → Manajemen tahun ajaran
/admin/periode-pkl        → Konfigurasi periode PKL
/admin/perusahaan         → Master data perusahaan
/admin/pengumuman         → Semua pengumuman
/admin/dokumen            → Manajemen file
/admin/laporan            → Laporan global
/admin/notifikasi         → Broadcast notifikasi
/admin/pengaturan         → Konfigurasi sistem
/admin/profil             → Profil admin
```

---

## 🗄️ DATABASE SCHEMA (Supabase/PostgreSQL)

### Core Tables

```sql
-- 1. PROFILES (extend auth.users)
profiles {
  id: uuid (FK → auth.users.id)
  full_name: text
  avatar_url: text
  phone: text
  role: enum('super_admin','ketua_jurusan','guru_pembimbing','siswa')
  is_active: boolean
  fcm_token: text (for push notifications)
  created_at: timestamptz
  updated_at: timestamptz
}

-- 2. DEPARTMENTS (Jurusan)
departments {
  id: uuid PK
  name: text (e.g. "Teknik Komputer & Jaringan")
  code: text (e.g. "TKJ")
  description: text
  head_id: uuid (FK → profiles.id)
  is_active: boolean
  created_at: timestamptz
}

-- 3. CLASSES
classes {
  id: uuid PK
  name: text (e.g. "XII TKJ 1")
  department_id: uuid FK
  academic_year_id: uuid FK
  homeroom_teacher_id: uuid FK
  created_at: timestamptz
}

-- 4. ACADEMIC YEARS
academic_years {
  id: uuid PK
  year: text (e.g. "2024/2025")
  semester: int (1 or 2)
  is_active: boolean
  created_at: timestamptz
}

-- 5. STUDENTS (detail siswa)
students {
  id: uuid PK
  profile_id: uuid FK
  nis: text (Nomor Induk Siswa)
  class_id: uuid FK
  department_id: uuid FK
  address: text
  parent_name: text
  parent_phone: text
  created_at: timestamptz
}

-- 6. TEACHERS (detail guru)
teachers {
  id: uuid PK
  profile_id: uuid FK
  nip: text
  subject: text
  department_id: uuid FK
  created_at: timestamptz
}

-- 7. COMPANIES (Perusahaan/DU-DI)
companies {
  id: uuid PK
  name: text
  industry_type: text
  address: text
  city: text
  phone: text
  email: text
  contact_person: text
  latitude: decimal
  longitude: decimal
  radius_meter: int (geofencing radius)
  is_active: boolean
  logo_url: text
  created_at: timestamptz
}

-- 8. PKL PERIODS
pkl_periods {
  id: uuid PK
  academic_year_id: uuid FK
  name: text (e.g. "PKL Semester Genap 2025")
  start_date: date
  end_date: date
  check_in_start: time
  check_in_end: time
  check_out_start: time
  check_out_end: time
  is_active: boolean
  created_at: timestamptz
}

-- 9. PKL ASSIGNMENTS (Penempatan)
pkl_assignments {
  id: uuid PK
  student_id: uuid FK
  company_id: uuid FK
  pkl_period_id: uuid FK
  teacher_id: uuid FK (guru pembimbing)
  supervisor_name: text (pembimbing industri)
  supervisor_phone: text
  start_date: date
  end_date: date
  status: enum('pending','active','completed','cancelled')
  created_at: timestamptz
}
```

### Attendance & Activity Tables

```sql
-- 10. ATTENDANCE (Presensi)
attendance {
  id: uuid PK
  pkl_assignment_id: uuid FK
  student_id: uuid FK
  date: date
  type: enum('check_in','check_out')
  selfie_url: text (Supabase Storage)
  latitude: decimal
  longitude: decimal
  address: text (reverse geocoded)
  is_within_radius: boolean
  status: enum('pending','verified','rejected')
  verified_by: uuid FK
  verified_at: timestamptz
  notes: text
  created_at: timestamptz
}

-- 11. ABSENCE REQUESTS (Izin/Sakit)
absence_requests {
  id: uuid PK
  student_id: uuid FK
  pkl_assignment_id: uuid FK
  date: date
  type: enum('sick','permission','emergency','other')
  reason: text
  attachment_url: text
  status: enum('pending','approved','rejected')
  reviewed_by: uuid FK
  reviewed_at: timestamptz
  review_notes: text
  created_at: timestamptz
}

-- 12. JOURNALS (Jurnal Harian)
journals {
  id: uuid PK
  student_id: uuid FK
  pkl_assignment_id: uuid FK
  date: date
  title: text
  content: text (rich text)
  photos: text[] (array of URLs)
  status: enum('draft','submitted','reviewed','revision')
  submitted_at: timestamptz
  created_at: timestamptz
  updated_at: timestamptz
}

-- 13. JOURNAL FEEDBACKS
journal_feedbacks {
  id: uuid PK
  journal_id: uuid FK
  teacher_id: uuid FK
  content: text
  rating: int (1-5)
  created_at: timestamptz
  updated_at: timestamptz
}

-- 14. ASSESSMENTS (Penilaian)
assessments {
  id: uuid PK
  pkl_assignment_id: uuid FK
  teacher_id: uuid FK
  attendance_score: decimal
  journal_score: decimal
  performance_score: decimal
  attitude_score: decimal
  final_score: decimal (auto-computed)
  grade: text (A/B/C/D)
  notes: text
  is_finalized: boolean
  created_at: timestamptz
  updated_at: timestamptz
}
```

### Communication Tables

```sql
-- 15. ANNOUNCEMENTS
announcements {
  id: uuid PK
  author_id: uuid FK
  title: text
  content: text (rich text/html)
  type: enum('general','urgent','event','reminder')
  target_roles: text[] (e.g. ['siswa','guru_pembimbing'])
  target_departments: uuid[]
  attachment_urls: text[]
  is_pinned: boolean
  published_at: timestamptz
  expires_at: timestamptz
  view_count: int
  created_at: timestamptz
}

-- 16. CHAT ROOMS
chat_rooms {
  id: uuid PK
  name: text
  type: enum('direct','group')
  avatar_url: text
  created_by: uuid FK
  last_message: text
  last_message_at: timestamptz
  created_at: timestamptz
}

-- 17. CHAT ROOM MEMBERS
chat_room_members {
  id: uuid PK
  room_id: uuid FK
  user_id: uuid FK
  role: enum('admin','member')
  joined_at: timestamptz
  last_read_at: timestamptz
}

-- 18. CHAT MESSAGES
chat_messages {
  id: uuid PK
  room_id: uuid FK
  sender_id: uuid FK
  content: text
  type: enum('text','image','file','system')
  file_url: text
  reply_to_id: uuid FK (self-referential)
  is_deleted: boolean
  read_by: uuid[]
  created_at: timestamptz
}

-- 19. NOTIFICATIONS
notifications {
  id: uuid PK
  user_id: uuid FK
  title: text
  body: text
  type: enum('attendance','journal','absence','announcement','chat','assessment','system')
  data: jsonb (payload)
  is_read: boolean
  read_at: timestamptz
  created_at: timestamptz
}

-- 20. DOCUMENTS (File & Template)
documents {
  id: uuid PK
  uploader_id: uuid FK
  name: text
  description: text
  category: enum('template','panduan','surat','laporan','lainnya')
  file_url: text
  file_size: int
  file_type: text
  download_count: int
  is_public: boolean
  target_roles: text[]
  created_at: timestamptz
  updated_at: timestamptz
}
```

---

## ✨ FITUR DETAIL PER MODUL

### 1. 📸 Modul Presensi (Siswa)
- **Kamera selfie** real-time via `getUserMedia` API
- **Face overlay guide** untuk arahkan posisi wajah
- **Geolocation capture** otomatis saat foto diambil
- **Peta mini** tampil lokasi terkini sebelum submit
- **Geofencing** — sistem otomatis tandai apakah lokasi valid
- **Status real-time**: Hadir ✅ / Di luar area ⚠️ / Tidak Hadir ❌
- **Kalender bulanan** warna-warni per status kehadiran
- **Rekap statistik**: persentase kehadiran, total hari, grafik mingguan
- **QR Code backup** — sebagai alternatif jika kamera tidak tersedia

### 2. 📝 Modul Jurnal Harian (Siswa)
- **Rich text editor** (bold, italic, bullet list, dst)
- **Upload foto kegiatan** (multi-photo, max 5 foto)
- **Auto-save draft** setiap 30 detik
- **Template jurnal** yang bisa dipilih
- **Status tracking**: Draft → Submitted → Reviewed → Revision
- **Timeline view** jurnal per minggu
- **Feedback inline** dari guru (dengan highlight text)
- **Progress indicator** jurnal bulan ini vs target

### 3. 🤒 Modul Izin/Sakit
- **Form wizard** 3 langkah: pilih tipe → isi alasan → upload bukti
- **Upload surat dokter** / foto bukti (opsional untuk izin)
- **Status tracking real-time** (Menunggu → Disetujui/Ditolak)
- **Notifikasi push** saat status berubah
- **History izin** lengkap dengan filter

### 4. 📢 Modul Pengumuman
- **Feed bergaya sosial media** dengan card modern
- **Pin pengumuman** penting di atas
- **Badge tipe**: Umum / Penting / Event / Pengingat
- **Rich content**: teks, gambar, lampiran file
- **Like/Acknowledge** — siswa bisa konfirmasi sudah baca
- **Filter & search** pengumuman

### 5. 💬 Modul Chat
- **Direct Message** antara siswa ↔ guru, guru ↔ admin
- **Group Chat** per kelas PKL / jurusan
- **Real-time** via Supabase Realtime Channels
- **Typing indicator** 
- **Pesan terbaca/belum** (read receipts)
- **Upload gambar & file** dalam chat
- **Reply pesan** (quote reply)
- **Notifikasi badge** jumlah pesan belum dibaca

### 6. 🔔 Modul Notifikasi
- **Real-time in-app** via Supabase Realtime
- **Push notification** ke device (Web Push API + Service Worker)
- **Categorized feed**: Presensi, Jurnal, Izin, Pengumuman, Chat
- **Mark all as read**
- **Deep link** — klik notif langsung ke halaman relevan

### 7. 📁 Modul Dokumen
- **Kategori**: Template Laporan, Panduan PKL, Surat-Surat, Lainnya
- **Preview file** inline (PDF viewer, image viewer)
- **Download** langsung dari app
- **Counter download** 
- **Search & filter** dokumen
- **Upload** (untuk admin/guru)

### 8. 📊 Modul Laporan & Penilaian
- **Dashboard rekap** visual (grafik kehadiran, jurnal, nilai)
- **Export PDF** laporan presensi, jurnal, penilaian
- **Export Excel** rekap data
- **Cetak sertifikat PKL** (auto-generate)
- **Penilaian multi-aspek**: kehadiran, jurnal, kinerja, sikap
- **Grade otomatis** berdasarkan rata-rata

---

## 🗂️ FASE IMPLEMENTASI

### Phase 1 — Foundation (Core Setup)
- [x] Setup project Next.js 15 + TypeScript + Tailwind + Shadcn
- [x] Setup Supabase (DB schema, RLS policies, Storage buckets)
- [x] Autentikasi (login, session, middleware route guard)
- [x] Design system: warna, typography, komponen dasar
- [x] PWA manifest + service worker (@ducanh2912/next-pwa, icons, splash, InstallPrompt)
- [x] Layout per role (bottom nav, sidebar, header)

### Phase 2 — Fitur Siswa (Core)
- [x] Dashboard siswa (data real Supabase: stats, kalender, jurnal, pengumuman)
- [x] Modul presensi (kamera + GPS + geofencing + upload Storage)
- [x] Modul jurnal harian (CRUD, foto upload ke bucket 'journals', draft+submit)
- [x] Modul izin/sakit (wizard 3 langkah, upload lampiran ke bucket 'absences')
- [x] Profil siswa (data real, upload avatar ke bucket 'avatars', edit info)

### Phase 3 — Fitur Guru & Kajur
- [x] Dashboard guru (data real: siswa binaan, pending presensi/jurnal/izin, notif)
- [x] Verifikasi presensi siswa (approve/reject, lihat foto selfie, filter status)
- [x] Review jurnal (baca isi+foto, beri bintang+komentar, setuju/minta revisi)
- [x] Approval izin/sakit (setujui/tolak + catatan, lihat lampiran)
- [x] Daftar siswa binaan + detail profil (stats, breakdown kehadiran/jurnal)
- [x] Laporan rekap (real stats dari Supabase: kehadiran, jurnal, izin)

### Phase 4 — Komunikasi & Notifikasi
- [x] Modul pengumuman siswa (Supabase real, pinned, filter type, search)
- [x] Modul notifikasi siswa (real-time via Supabase Realtime, read/delete)
- [x] Pengumuman guru (Supabase real, filter target roles)
- [x] Modul chat real-time — Supabase Realtime channels, room list, send & receive, auto-scroll, create room baru, unread badge (shared ChatPage.tsx)
- [ ] Push notification via Web Push API (dalam pengembangan)

### Phase 5 — Admin & Manajemen
- [x] Super admin dashboard (real stats: users, siswa aktif, teacher, company, pending items)
- [x] Manajemen user (load dari profiles, toggle aktif/nonaktif, filter role)
- [x] Manajemen perusahaan (CRUD lengkap: insert/update/delete, geofencing radius, hitung siswa aktif)
- [x] Manajemen pengumuman (create form + terbitkan, delete, load dari DB)
- [x] Manajemen periode PKL (create/edit form, toggle aktif, auto-deactivate)
- [x] Manajemen jurusan (CRUD departments, hitung siswa & guru per jurusan)
- [x] Manajemen kelas (CRUD classes, pilih jurusan, hitung siswa)
- [x] Modul dokumen/file admin (upload, delete, filter kategori → shared DokumenPage + Supabase Storage)

### Phase 6 — Kajur & Polish
- [x] Kajur dashboard (real Supabase stats: siswa aktif, at-risk, top students, trend, pengumuman)
- [x] Kajur siswa (load dari DB, filter status, hitung kehadiran & jurnal real)
- [x] Kajur laporan (real stats + alert at-risk, export button)
- [x] Kajur penempatan (load pkl_assignments, join student+company+teacher, filter status)
- [x] Kajur presensi (kehadiran hari ini + chart 5 hari kerja terakhir, alert alfa)
- [x] Kajur guru (load teachers, hitung siswa aktif & pending jurnal per guru)
- [x] Kajur pengumuman (load dari DB, filter target ketua_jurusan/all)
- [x] Admin laporan (real stats: total user, siswa aktif, avg kehadiran, at-risk, pending jurnal)
- [x] Admin penugasan PKL (CRUD pkl_assignments: assign siswa→guru+perusahaan, form lengkap, filter status, quick action)
- [x] Admin pengaturan (load/upsert ke system_settings, fallback ke default)
- [x] Admin profil (real stats: total user, siswa aktif, mitra perusahaan)
- [x] Sidebar nav admin: menu Penugasan PKL ditambahkan
- [x] Guru penilaian (upsert ke tabel grades, finalisasi nilai, progress bar, baca dari DB)
- [x] Semua dokumen pages (admin/guru/kajur/siswa) pakai shared DokumenPage → Supabase Storage
- [x] Guru notifikasi tersambung Supabase — load dan mark-read dari DB
- [x] Kajur notifikasi tersambung Supabase — load dari notifications table
- [x] Kajur perusahaan tersambung Supabase — load companies + hitung siswa aktif real
- [x] Export Excel — guru penilaian, guru laporan, kajur laporan, admin laporan (lib/export-utils.ts)
- [x] SQL migration: tabel grades, documents, system_settings, notifications + RLS + Storage bucket
- [x] Export PDF — guru laporan, guru penilaian, kajur laporan, admin laporan (lib/print-utils.ts via window.print)
- [x] PWA icons — 22 asset digenerate: icon 72-512px, apple-touch-icon, splash screens, shortcut icons (scripts/generate-icons.mjs)
- [x] PWA InstallPrompt — A2HS prompt otomatis (Android + iOS), dismiss 7 hari, standalone detection
- [x] PWA konfigurasi aktif — @ducanh2912/next-pwa, manifest.json, layout meta tags lengkap
- [ ] Optimasi performa (lazy loading, code splitting)
- [ ] Dark mode (opsional)

---

## 🏗️ STRUKTUR PROJECT

```
hassina-pkl/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Login, Register
│   │   ├── (siswa)/siswa/      # Halaman siswa
│   │   ├── (guru)/guru/        # Halaman guru
│   │   ├── (kajur)/kajur/      # Halaman ketua jurusan
│   │   ├── (admin)/admin/      # Halaman super admin
│   │   └── api/                # API Routes
│   ├── components/
│   │   ├── ui/                 # Shadcn base components
│   │   ├── shared/             # Komponen yang dipakai semua role
│   │   ├── presensi/           # Komponen modul presensi
│   │   ├── jurnal/             # Komponen modul jurnal
│   │   ├── chat/               # Komponen modul chat
│   │   └── dashboard/          # Widget dashboard
│   ├── lib/
│   │   ├── supabase/           # Client, server, middleware
│   │   ├── hooks/              # Custom React hooks
│   │   ├── stores/             # Zustand stores
│   │   ├── queries/            # TanStack Query hooks
│   │   ├── utils/              # Helper functions
│   │   └── validations/        # Zod schemas
│   └── types/                  # TypeScript type definitions
├── public/
│   ├── icons/                  # PWA icons
│   └── sw.js                   # Service worker
└── supabase/
    ├── migrations/             # DB migrations
    └── functions/              # Edge functions
```

---

Ini adalah perencanaan yang sangat komprehensif. **Apakah Anda setuju dengan perencanaan ini?** Setelah konfirmasi, saya akan langsung mulai implementasi fase per fase dimulai dari **Phase 1 (Foundation)** — setup project, design system, database schema, dan autentikasi. 

Beberapa hal yang perlu Anda konfirmasi atau sesuaikan:

1. **Nama aplikasi** — Apakah "HASSINA PKL" atau ada nama lain yang diinginkan?
2. **Bahasa antarmuka** — Full Bahasa Indonesia?
3. **Geofencing** — Apakah ingin batasan radius lokasi yang ketat atau hanya tracking saja?
4. **Google Maps API** — Apakah ada API key Google Maps, atau pakai Leaflet.js (gratis/open-source)?
5. **Email/domain** — Untuk konfigurasi Supabase Auth & push notification