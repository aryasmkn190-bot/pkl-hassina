-- ============================================================
-- FIX: Buat record teachers untuk guru yang sudah ada
-- Jalankan SETELAH migration 20250330_nullable_department.sql
-- ============================================================

-- Insert teachers record untuk semua guru_pembimbing yang belum punya
INSERT INTO public.teachers (profile_id)
SELECT p.id 
FROM public.profiles p
WHERE p.role = 'guru_pembimbing'
  AND NOT EXISTS (
    SELECT 1 FROM public.teachers t WHERE t.profile_id = p.id
  );

-- Insert students record untuk semua siswa yang belum punya
INSERT INTO public.students (profile_id)
SELECT p.id 
FROM public.profiles p
WHERE p.role = 'siswa'
  AND NOT EXISTS (
    SELECT 1 FROM public.students s WHERE s.profile_id = p.id
  );
