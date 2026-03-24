-- ============================================================
-- PATCH 002: Fix & Seed Data
-- Jalankan SETELAH 001_initial_schema.sql berhasil
-- ============================================================

-- ============================================================
-- FIX 1: Hapus policy profiles UPDATE yang duplikat
-- Ada 2 policy UPDATE untuk profiles, bisa konflik
-- ============================================================

DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;

-- Buat ulang dengan nama yang lebih jelas, gabungkan kondisi
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()                              -- Update profil sendiri
    OR get_current_user_role() = 'super_admin'   -- Admin bisa update siapapun
  )
  WITH CHECK (
    id = auth.uid()
    OR get_current_user_role() = 'super_admin'
  );

-- Hapus policy yang pertama agar tidak duplikat
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- ============================================================
-- FIX 2: Perbaiki policy announcements_select
-- Jika target_roles = '{}' (kosong), artinya pengumuman untuk SEMUA role
-- ============================================================

DROP POLICY IF EXISTS "announcements_select" ON public.announcements;

CREATE POLICY "announcements_select"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (
    -- Pengumuman umum (target_roles kosong = semua role)
    array_length(target_roles, 1) IS NULL
    -- Pengumuman untuk role pengguna ini
    OR get_current_user_role()::TEXT = ANY(target_roles::TEXT[])
    -- Admin dan kajur selalu bisa lihat semua pengumuman
    OR get_current_user_role() IN ('super_admin', 'ketua_jurusan')
  );

-- ============================================================
-- FIX 3: Izinkan admin membuat notifikasi untuk user lain
-- (Policy lama terlalu ketat — user_id = auth.uid() blokir admin)
-- ============================================================

DROP POLICY IF EXISTS "notifications_insert_authenticated" ON public.notifications;

CREATE POLICY "notifications_insert_authenticated"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User insert notifikasi untuk diri sendiri
    user_id = auth.uid()
    -- Staff boleh insert notifikasi untuk siapapun (kirim notif ke siswa, dll.)
    OR get_current_user_role() IN ('super_admin', 'ketua_jurusan', 'guru_pembimbing')
  );

-- ============================================================
-- FIX 4: Tambahkan INSERT policy untuk profiles
-- Saat ini tidak ada INSERT policy — trigger handle_new_user
-- bisa gagal jika RLS terlalu ketat
-- ============================================================

DROP POLICY IF EXISTS "profiles_insert_service_role" ON public.profiles;

CREATE POLICY "profiles_insert_service_role"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    id = auth.uid()                            -- User bisa insert profil diri sendiri
    OR get_current_user_role() = 'super_admin' -- Admin bisa insert profil siapapun
  );

-- ============================================================
-- SEED DATA: Tambahkan tahun ajaran semester genap
-- ============================================================

INSERT INTO public.academic_years (year, semester, is_active)
VALUES ('2024/2025', 2, FALSE)
ON CONFLICT (year, semester) DO NOTHING;

-- ============================================================
-- SEED DATA: Jurusan awal
-- ============================================================

INSERT INTO public.departments (name, code, description, is_active) VALUES
  ('Teknik Komputer dan Jaringan', 'TKJ', 'Jurusan TKJ - Instalasi jaringan dan komputer', TRUE),
  ('Rekayasa Perangkat Lunak', 'RPL', 'Jurusan RPL - Pengembangan perangkat lunak', TRUE),
  ('Multimedia', 'MM', 'Jurusan Multimedia - Desain grafis dan produksi media', TRUE)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- CATATAN PENTING: Cara membuat user Admin pertama
-- ============================================================
-- Jalankan perintah di bawah ini di SQL Editor Supabase,
-- SETELAH menjalankan migration ini.
--
-- Ganti EMAIL dan PASSWORD sesuai keinginan kamu.
--
-- LANGKAH 1: Buat user di Supabase Auth Dashboard:
--   Authentication > Users > Add User > Create New User
--   Email: admin@hassina.sch.id
--   Password: Admin@12345
--
-- LANGKAH 2: Jalankan SQL ini untuk set role menjadi super_admin:
--
--   UPDATE public.profiles
--   SET role = 'super_admin', full_name = 'Administrator PKL'
--   WHERE id = (
--     SELECT id FROM auth.users WHERE email = 'admin@hassina.sch.id'
--   );
--
-- ============================================================
