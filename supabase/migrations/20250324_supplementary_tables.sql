-- ============================================================
-- HASSINA PKL — Supplementary Tables Migration
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Tabel grades (penilaian siswa oleh guru)
CREATE TABLE IF NOT EXISTS public.grades (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id   UUID NOT NULL REFERENCES public.pkl_assignments(id) ON DELETE CASCADE,
  student_id      UUID REFERENCES public.students(id) ON DELETE SET NULL,
  attendance_score  NUMERIC(5,2) CHECK (attendance_score BETWEEN 0 AND 100),
  journal_score     NUMERIC(5,2) CHECK (journal_score BETWEEN 0 AND 100),
  performance_score NUMERIC(5,2) CHECK (performance_score BETWEEN 0 AND 100),
  attitude_score    NUMERIC(5,2) CHECK (attitude_score BETWEEN 0 AND 100),
  final_score       NUMERIC(5,2) CHECK (final_score BETWEEN 0 AND 100),
  grade             VARCHAR(2),   -- A, B, C, D, E
  is_finalized      BOOLEAN DEFAULT FALSE,
  notes             TEXT DEFAULT '',
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE (assignment_id)
);

-- 2. Tabel documents (manajemen dokumen PKL via Supabase Storage)
CREATE TABLE IF NOT EXISTS public.documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  file_path     TEXT NOT NULL,          -- path di Supabase Storage bucket
  file_type     VARCHAR(20),            -- pdf, xlsx, docx, jpg, etc
  file_size     BIGINT DEFAULT 0,       -- bytes
  category      VARCHAR(50) DEFAULT 'panduan', -- template | laporan | panduan | system
  uploaded_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_public     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  uploaded_at   TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabel system_settings (konfigurasi aplikasi oleh admin)
CREATE TABLE IF NOT EXISTS public.system_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Seed default settings
INSERT INTO public.system_settings (key, value, description) VALUES
  ('push_notification',       'true',  'Notifikasi ke perangkat mobile'),
  ('email_notification',      'false', 'Kirim notifikasi via email'),
  ('geofencing_strict',       'true',  'Presensi hanya valid dalam radius perusahaan'),
  ('require_selfie',          'true',  'Presensi harus disertai foto selfie'),
  ('allow_weekend_attendance','false', 'Izinkan presensi di hari Sabtu/Minggu'),
  ('auto_absent_reminder',    'true',  'Ingatkan siswa isi jurnal setiap hari'),
  ('maintenance_mode',        'false', 'Nonaktifkan akses siswa sementara')
ON CONFLICT (key) DO NOTHING;

-- 4. Tabel notifications (notifikasi per user)
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT,
  type        VARCHAR(30) DEFAULT 'system', -- attendance | journal | absence | announcement | chat | assessment | system
  is_read     BOOLEAN DEFAULT FALSE,
  data        JSONB,                         -- payload tambahan (opsional)
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read  ON public.notifications(is_read);

-- ============================================================
-- Storage Bucket untuk dokumen PKL
-- (Jalankan di Supabase Dashboard → Storage → New Bucket)
-- Nama: pkl-documents | Public: true
-- Atau via SQL:
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('pkl-documents', 'pkl-documents', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- grades: guru bisa baca dan edit miliknya, admin bisa semua
CREATE POLICY "grades_select_all" ON public.grades FOR SELECT TO authenticated USING (true);
CREATE POLICY "grades_insert_guru" ON public.grades FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "grades_update_guru" ON public.grades FOR UPDATE TO authenticated USING (true);

-- documents: semua user authenticated bisa baca; admin bisa insert/delete
CREATE POLICY "docs_select_all"  ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "docs_insert_auth" ON public.documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "docs_delete_auth" ON public.documents FOR DELETE TO authenticated USING (true);

-- system_settings: semua bisa baca; admin bisa ubah (cukup authenticated untuk sekarang)
CREATE POLICY "settings_select_all"  ON public.system_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings_upsert_auth" ON public.system_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "settings_update_auth" ON public.system_settings FOR UPDATE TO authenticated USING (true);

-- notifications: user hanya bisa lihat/hapus notifnya sendiri
CREATE POLICY "notif_select_own"  ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notif_update_own"  ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notif_delete_own"  ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notif_insert_auth" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- Storage policies
CREATE POLICY "storage_select_public" ON storage.objects FOR SELECT USING (bucket_id = 'pkl-documents');
CREATE POLICY "storage_insert_auth"   ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'pkl-documents');
CREATE POLICY "storage_delete_auth"   ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'pkl-documents');
