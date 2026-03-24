-- ============================================================
-- 003: Supabase Storage Buckets & RLS Policies
-- Jalankan di SQL Editor Supabase SETELAH 001 dan 002
-- ============================================================

-- ============================================================
-- BUAT STORAGE BUCKETS
-- ============================================================

-- Bucket untuk selfie presensi
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'selfies',
  'selfies',
  TRUE,                        -- Public agar foto bisa ditampilkan tanpa auth
  5242880,                     -- Max 5MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = TRUE,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Bucket untuk foto jurnal
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'journals',
  'journals',
  TRUE,
  10485760,                    -- Max 10MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = TRUE,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Bucket untuk dokumen/file (PDF, dll.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  FALSE,                       -- Private, harus authenticated untuk akses
  20971520,                    -- Max 20MB per file
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 20971520;

-- Bucket untuk avatar profil
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  2097152,                     -- Max 2MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = TRUE,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Bucket untuk lampiran izin/sakit
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'absences',
  'absences',
  FALSE,
  10485760,                    -- Max 10MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RLS POLICIES: BUCKET selfies
-- ============================================================

-- Siapa saja yang ter-auth bisa melihat selfie (untuk guru verifikasi)
CREATE POLICY "selfies_select_authenticated"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'selfies');

-- Siswa hanya bisa upload ke folder miliknya sendiri
-- Path: attendance/{student_uuid}/...
CREATE POLICY "selfies_insert_student"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'selfies'
    AND (storage.foldername(name))[1] = 'attendance'
  );

-- Siswa bisa update file milik sendiri
CREATE POLICY "selfies_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'selfies' AND owner = auth.uid());

-- ============================================================
-- RLS POLICIES: BUCKET journals
-- ============================================================

CREATE POLICY "journals_storage_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'journals');

CREATE POLICY "journals_storage_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'journals');

CREATE POLICY "journals_storage_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'journals' AND owner = auth.uid());

CREATE POLICY "journals_storage_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'journals' AND owner = auth.uid());

-- ============================================================
-- RLS POLICIES: BUCKET avatars
-- ============================================================

CREATE POLICY "avatars_select_authenticated"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND owner = auth.uid());

-- ============================================================
-- RLS POLICIES: BUCKET documents
-- ============================================================

CREATE POLICY "documents_storage_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');

-- Hanya staff yang bisa upload dokumen
CREATE POLICY "documents_storage_insert_staff"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND get_current_user_role() IN ('super_admin', 'ketua_jurusan', 'guru_pembimbing')
  );

CREATE POLICY "documents_storage_delete_staff"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND (
      owner = auth.uid()
      OR get_current_user_role() = 'super_admin'
    )
  );

-- ============================================================
-- RLS POLICIES: BUCKET absences
-- ============================================================

CREATE POLICY "absences_storage_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'absences');

CREATE POLICY "absences_storage_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'absences');

CREATE POLICY "absences_storage_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'absences' AND owner = auth.uid());
