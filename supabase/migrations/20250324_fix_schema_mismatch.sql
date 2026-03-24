-- ============================================================
-- Fix Schema Mismatch: ganti academic_year_id FK → academic_year TEXT
-- Masalah: halaman kelas & periode PKL mengirim academic_year (text)
-- tapi DB punya academic_year_id (UUID FK) yang NOT NULL
-- ============================================================

-- ── 1. KELAS (classes) ──────────────────────────────────────

-- Hapus constraint NOT NULL dan FK pada academic_year_id
ALTER TABLE public.classes
  ALTER COLUMN academic_year_id DROP NOT NULL;

-- Tambah kolom text academic_year
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS academic_year TEXT;

-- Tambah kolom homeroom_teacher_name text (opsional, bukan FK wajib)
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS homeroom_teacher_name TEXT;

-- Drop unique constraint yang menyertakan academic_year_id
ALTER TABLE public.classes
  DROP CONSTRAINT IF EXISTS classes_name_department_id_academic_year_id_key;

-- ── 2. PERIODE PKL (pkl_periods) ─────────────────────────────

-- Hapus constraint NOT NULL pada academic_year_id
ALTER TABLE public.pkl_periods
  ALTER COLUMN academic_year_id DROP NOT NULL;

-- Tambah kolom text academic_year
ALTER TABLE public.pkl_periods
  ADD COLUMN IF NOT EXISTS academic_year TEXT;

-- ── 3. KELAS — department_id juga perlu nullable ──────────────
-- (agar kelas bisa dibuat tanpa jurusan jika belum ada)
ALTER TABLE public.classes
  ALTER COLUMN department_id DROP NOT NULL;

-- ── 4. Pastikan RLS delete ada untuk classes ──────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'classes' AND policyname = 'classes_delete_admin'
  ) THEN
    EXECUTE '
      CREATE POLICY "classes_delete_admin"
        ON public.classes FOR DELETE
        TO authenticated
        USING (get_current_user_role() = ''super_admin'')
    ';
  END IF;
END $$;

-- ── 5. Pastikan RLS delete ada untuk pkl_periods ──────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'pkl_periods' AND policyname = 'pkl_periods_delete_admin'
  ) THEN
    EXECUTE '
      CREATE POLICY "pkl_periods_delete_admin"
        ON public.pkl_periods FOR DELETE
        TO authenticated
        USING (get_current_user_role() = ''super_admin'')
    ';
  END IF;
END $$;

-- ── 6. Pastikan documents punya kolom yang dibutuhkan ─────────
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS file_path TEXT;

-- Sync file_path dari file_url jika ada
UPDATE public.documents SET file_path = file_url WHERE file_path IS NULL AND file_url IS NOT NULL;

-- uploaded_by alias untuk uploader_id
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ DEFAULT NOW();

-- Sync uploaded_by dari uploader_id
UPDATE public.documents SET uploaded_by = uploader_id WHERE uploaded_by IS NULL;
UPDATE public.documents SET uploaded_at = created_at WHERE uploaded_at IS NULL;

-- ── 7. Tabel grades (untuk guru penilaian) ───────────────────
CREATE TABLE IF NOT EXISTS public.grades (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pkl_period_id      UUID REFERENCES public.pkl_periods(id) ON DELETE SET NULL,
  attendance_score   NUMERIC(5,2) DEFAULT 0,
  journal_score      NUMERIC(5,2) DEFAULT 0,
  performance_score  NUMERIC(5,2) DEFAULT 0,
  attitude_score     NUMERIC(5,2) DEFAULT 0,
  final_score        NUMERIC(5,2) DEFAULT 0,
  grade              TEXT,
  notes              TEXT,
  is_finalized       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, teacher_id)
);

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='grades' AND policyname='grades_select') THEN
    EXECUTE 'CREATE POLICY "grades_select" ON public.grades FOR SELECT TO authenticated USING (TRUE)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='grades' AND policyname='grades_insert_teacher') THEN
    EXECUTE 'CREATE POLICY "grades_insert_teacher" ON public.grades FOR INSERT TO authenticated WITH CHECK (get_current_user_role() IN (''super_admin'', ''ketua_jurusan'', ''guru_pembimbing''))';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='grades' AND policyname='grades_update_teacher') THEN
    EXECUTE 'CREATE POLICY "grades_update_teacher" ON public.grades FOR UPDATE TO authenticated USING (get_current_user_role() IN (''super_admin'', ''ketua_jurusan'', ''guru_pembimbing''))';
  END IF;
END $$;

-- ── 8. system_settings table ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.system_settings (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key        TEXT NOT NULL UNIQUE,
  value      JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='system_settings' AND policyname='system_settings_select') THEN
    EXECUTE 'CREATE POLICY "system_settings_select" ON public.system_settings FOR SELECT TO authenticated USING (TRUE)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='system_settings' AND policyname='system_settings_upsert_admin') THEN
    EXECUTE 'CREATE POLICY "system_settings_upsert_admin" ON public.system_settings FOR ALL TO authenticated USING (get_current_user_role() = ''super_admin'')';
  END IF;
END $$;
