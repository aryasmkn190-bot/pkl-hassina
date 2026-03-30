-- ============================================================
-- FIX: Buat department_id nullable di teachers & students
-- Agar bisa auto-create record saat user dibuat tanpa harus
-- langsung assign ke jurusan tertentu
-- ============================================================

-- Teachers: department_id jadi nullable
ALTER TABLE public.teachers ALTER COLUMN department_id DROP NOT NULL;

-- Students: department_id jadi nullable (agar StudentDataSection bisa save tanpa jurusan)
ALTER TABLE public.students ALTER COLUMN department_id DROP NOT NULL;

-- Students: nis jadi nullable (agar bisa auto-create saat signup, diisi nanti)
ALTER TABLE public.students ALTER COLUMN nis DROP NOT NULL;
-- Drop unique constraint agar bisa insert tanpa NIS, lalu tambah unique yang bisa null
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_nis_key;
CREATE UNIQUE INDEX IF NOT EXISTS students_nis_unique ON public.students (nis) WHERE nis IS NOT NULL;
