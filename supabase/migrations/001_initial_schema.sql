-- ============================================================
-- Migrasi Awal: Skema Lengkap Aplikasi PKL SMK HASSINA
-- Dibuat untuk Supabase PostgreSQL
-- ============================================================

-- Aktifkan ekstensi yang diperlukan
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Untuk pencarian teks (ILIKE performa tinggi)

-- ============================================================
-- FUNGSI PEMBANTU (Helper Functions)
-- ============================================================

-- Fungsi untuk otomatis memperbarui kolom updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fungsi untuk membuat profil otomatis saat pengguna baru mendaftar
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Pengguna Baru'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'siswa')::public.user_role,
    TRUE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fungsi untuk menambah view count pengumuman
CREATE OR REPLACE FUNCTION increment_announcement_view(announcement_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.announcements
  SET view_count = view_count + 1
  WHERE id = announcement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fungsi untuk menambah download count dokumen
CREATE OR REPLACE FUNCTION increment_document_download(document_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.documents
  SET download_count = download_count + 1
  WHERE id = document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CATATAN: get_current_user_role() dan is_admin_or_kajur() didefinisikan
-- SETELAH tabel profiles dibuat (lihat bawah), karena LANGUAGE sql
-- memvalidasi referensi tabel langsung saat CREATE FUNCTION.

-- ============================================================
-- TIPE ENUM (Custom Types)
-- ============================================================

CREATE TYPE public.user_role AS ENUM (
  'super_admin',
  'ketua_jurusan',
  'guru_pembimbing',
  'siswa'
);

CREATE TYPE public.pkl_assignment_status AS ENUM (
  'pending',
  'active',
  'completed',
  'cancelled'
);

CREATE TYPE public.attendance_type AS ENUM (
  'check_in',
  'check_out'
);

CREATE TYPE public.attendance_status AS ENUM (
  'pending',
  'verified',
  'rejected'
);

CREATE TYPE public.absence_type AS ENUM (
  'sick',
  'permission',
  'emergency',
  'other'
);

CREATE TYPE public.absence_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

CREATE TYPE public.journal_status AS ENUM (
  'draft',
  'submitted',
  'reviewed',
  'revision'
);

CREATE TYPE public.announcement_type AS ENUM (
  'general',
  'urgent',
  'event',
  'reminder'
);

CREATE TYPE public.chat_room_type AS ENUM (
  'direct',
  'group'
);

CREATE TYPE public.message_type AS ENUM (
  'text',
  'image',
  'file',
  'system'
);

CREATE TYPE public.notification_type AS ENUM (
  'attendance',
  'journal',
  'absence',
  'announcement',
  'chat',
  'assessment',
  'system'
);

CREATE TYPE public.document_category AS ENUM (
  'template',
  'panduan',
  'surat',
  'laporan',
  'lainnya'
);

-- ============================================================
-- TABEL: PROFIL PENGGUNA (profiles)
-- ============================================================
CREATE TABLE public.profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name      TEXT NOT NULL,
  avatar_url     TEXT,
  phone          TEXT,
  role           public.user_role NOT NULL DEFAULT 'siswa',
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  fcm_token      TEXT,                        -- Token untuk push notification
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Profil pengguna yang disinkronisasi dengan auth.users';

-- Trigger: Buat profil otomatis saat pengguna baru mendaftar
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger: Perbarui updated_at otomatis
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FUNGSI YANG MEMERLUKAN TABEL profiles (didefinisikan setelah tabel)
-- ============================================================

-- Fungsi untuk mendapatkan peran pengguna saat ini
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::TEXT
  FROM public.profiles
  WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Fungsi untuk mengecek apakah pengguna adalah admin atau ketua jurusan
CREATE OR REPLACE FUNCTION is_admin_or_kajur()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('super_admin', 'ketua_jurusan')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- TABEL: JURUSAN (departments)
-- ============================================================
CREATE TABLE public.departments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  code        TEXT NOT NULL UNIQUE,           -- Kode jurusan, misal: "RPL", "TKJ"
  description TEXT,
  head_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.departments IS 'Data jurusan/program keahlian di sekolah';

-- ============================================================
-- TABEL: TAHUN AJARAN (academic_years)
-- ============================================================
CREATE TABLE public.academic_years (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year       TEXT NOT NULL,                  -- Contoh: "2024/2025"
  semester   SMALLINT NOT NULL CHECK (semester IN (1, 2)),
  is_active  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (year, semester)
);

COMMENT ON TABLE public.academic_years IS 'Tahun ajaran dan semester aktif';

-- ============================================================
-- TABEL: KELAS (classes)
-- ============================================================
CREATE TABLE public.classes (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                 TEXT NOT NULL,
  department_id        UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  academic_year_id     UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE RESTRICT,
  homeroom_teacher_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (name, department_id, academic_year_id)
);

COMMENT ON TABLE public.classes IS 'Data kelas per jurusan dan tahun ajaran';

-- ============================================================
-- TABEL: SISWA (students)
-- ============================================================
CREATE TABLE public.students (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id    UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  nis           TEXT NOT NULL UNIQUE,         -- Nomor Induk Siswa
  class_id      UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  address       TEXT,
  parent_name   TEXT,
  parent_phone  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.students IS 'Data siswa peserta PKL';

-- ============================================================
-- TABEL: GURU (teachers)
-- ============================================================
CREATE TABLE public.teachers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id    UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  nip           TEXT UNIQUE,                  -- Nomor Induk Pegawai (bisa null untuk honorer)
  subject       TEXT,                         -- Mata pelajaran yang diampu
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.teachers IS 'Data guru pembimbing PKL';

-- ============================================================
-- TABEL: PERUSAHAAN / DU-DI (companies)
-- ============================================================
CREATE TABLE public.companies (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  industry_type   TEXT,
  address         TEXT NOT NULL,
  city            TEXT NOT NULL,
  phone           TEXT,
  email           TEXT,
  contact_person  TEXT,
  latitude        DOUBLE PRECISION,           -- Koordinat untuk validasi absensi
  longitude       DOUBLE PRECISION,
  radius_meter    INTEGER NOT NULL DEFAULT 100, -- Radius absensi dalam meter
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  logo_url        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.companies IS 'Data perusahaan/DU-DI tempat PKL';

-- ============================================================
-- TABEL: PERIODE PKL (pkl_periods)
-- ============================================================
CREATE TABLE public.pkl_periods (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE RESTRICT,
  name             TEXT NOT NULL,             -- Contoh: "PKL Semester Ganjil 2024/2025"
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  check_in_start   TIME NOT NULL DEFAULT '07:00',
  check_in_end     TIME NOT NULL DEFAULT '08:00',
  check_out_start  TIME NOT NULL DEFAULT '15:00',
  check_out_end    TIME NOT NULL DEFAULT '17:00',
  is_active        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_period_dates CHECK (end_date > start_date),
  CONSTRAINT valid_check_in_window CHECK (check_in_end > check_in_start),
  CONSTRAINT valid_check_out_window CHECK (check_out_end > check_out_start)
);

COMMENT ON TABLE public.pkl_periods IS 'Periode / rentang waktu pelaksanaan PKL';

-- ============================================================
-- TABEL: PENEMPATAN PKL (pkl_assignments)
-- ============================================================
CREATE TABLE public.pkl_assignments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id       UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
  company_id       UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  pkl_period_id    UUID NOT NULL REFERENCES public.pkl_periods(id) ON DELETE RESTRICT,
  teacher_id       UUID NOT NULL REFERENCES public.teachers(id) ON DELETE RESTRICT,
  supervisor_name  TEXT,                      -- Nama pembimbing dari perusahaan
  supervisor_phone TEXT,
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  status           public.pkl_assignment_status NOT NULL DEFAULT 'pending',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Satu siswa hanya boleh memiliki satu penempatan aktif per periode
  UNIQUE (student_id, pkl_period_id),
  CONSTRAINT valid_assignment_dates CHECK (end_date > start_date)
);

COMMENT ON TABLE public.pkl_assignments IS 'Data penempatan siswa ke perusahaan PKL';

-- ============================================================
-- TABEL: PRESENSI (attendance)
-- ============================================================
CREATE TABLE public.attendance (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pkl_assignment_id  UUID NOT NULL REFERENCES public.pkl_assignments(id) ON DELETE CASCADE,
  student_id         UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date               DATE NOT NULL,
  type               public.attendance_type NOT NULL,
  selfie_url         TEXT,                    -- URL foto selfie absensi
  latitude           DOUBLE PRECISION,
  longitude          DOUBLE PRECISION,
  address            TEXT,                    -- Alamat hasil reverse geocoding
  is_within_radius   BOOLEAN NOT NULL DEFAULT FALSE,
  status             public.attendance_status NOT NULL DEFAULT 'pending',
  verified_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at        TIMESTAMPTZ,
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Siswa hanya boleh melakukan check_in dan check_out satu kali per hari
  UNIQUE (student_id, date, type)
);

COMMENT ON TABLE public.attendance IS 'Data presensi harian siswa PKL';

-- ============================================================
-- TABEL: PENGAJUAN IZIN/SAKIT (absence_requests)
-- ============================================================
CREATE TABLE public.absence_requests (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id         UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  pkl_assignment_id  UUID NOT NULL REFERENCES public.pkl_assignments(id) ON DELETE CASCADE,
  date               DATE NOT NULL,
  type               public.absence_type NOT NULL,
  reason             TEXT NOT NULL,
  attachment_url     TEXT,                    -- URL bukti (surat dokter, dll.)
  status             public.absence_status NOT NULL DEFAULT 'pending',
  reviewed_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at        TIMESTAMPTZ,
  review_notes       TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Satu siswa hanya boleh mengajukan satu izin per tanggal
  UNIQUE (student_id, date)
);

COMMENT ON TABLE public.absence_requests IS 'Pengajuan izin atau sakit siswa PKL';

-- ============================================================
-- TABEL: JURNAL HARIAN (journals)
-- ============================================================
CREATE TABLE public.journals (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id         UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  pkl_assignment_id  UUID NOT NULL REFERENCES public.pkl_assignments(id) ON DELETE CASCADE,
  date               DATE NOT NULL,
  title              TEXT NOT NULL,
  content            TEXT NOT NULL,
  photos             TEXT[] NOT NULL DEFAULT '{}', -- Array URL foto
  status             public.journal_status NOT NULL DEFAULT 'draft',
  submitted_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Satu siswa hanya boleh membuat satu jurnal per tanggal
  UNIQUE (student_id, date)
);

COMMENT ON TABLE public.journals IS 'Jurnal harian kegiatan siswa PKL';

-- Trigger: Perbarui updated_at otomatis
CREATE TRIGGER set_journals_updated_at
  BEFORE UPDATE ON public.journals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABEL: UMPAN BALIK JURNAL (journal_feedbacks)
-- ============================================================
CREATE TABLE public.journal_feedbacks (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_id UUID NOT NULL REFERENCES public.journals(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  rating     SMALLINT CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.journal_feedbacks IS 'Komentar dan penilaian guru terhadap jurnal siswa';

-- Trigger: Perbarui updated_at otomatis
CREATE TRIGGER set_journal_feedbacks_updated_at
  BEFORE UPDATE ON public.journal_feedbacks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABEL: PENILAIAN PKL (assessments)
-- ============================================================
CREATE TABLE public.assessments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pkl_assignment_id   UUID NOT NULL UNIQUE REFERENCES public.pkl_assignments(id) ON DELETE CASCADE,
  teacher_id          UUID NOT NULL REFERENCES public.teachers(id) ON DELETE RESTRICT,
  attendance_score    NUMERIC(5,2) CHECK (attendance_score BETWEEN 0 AND 100),
  journal_score       NUMERIC(5,2) CHECK (journal_score BETWEEN 0 AND 100),
  performance_score   NUMERIC(5,2) CHECK (performance_score BETWEEN 0 AND 100),
  attitude_score      NUMERIC(5,2) CHECK (attitude_score BETWEEN 0 AND 100),
  final_score         NUMERIC(5,2) CHECK (final_score BETWEEN 0 AND 100),
  grade               CHAR(1) CHECK (grade IN ('A','B','C','D','E')),
  notes               TEXT,
  is_finalized        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.assessments IS 'Nilai akhir PKL siswa dari guru pembimbing';

-- Trigger: Perbarui updated_at otomatis
CREATE TRIGGER set_assessments_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABEL: PENGUMUMAN (announcements)
-- ============================================================
CREATE TABLE public.announcements (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title              TEXT NOT NULL,
  content            TEXT NOT NULL,
  type               public.announcement_type NOT NULL DEFAULT 'general',
  target_roles       public.user_role[] NOT NULL DEFAULT '{}',
  target_departments UUID[] NOT NULL DEFAULT '{}', -- Kosong = semua jurusan
  attachment_urls    TEXT[] NOT NULL DEFAULT '{}',
  is_pinned          BOOLEAN NOT NULL DEFAULT FALSE,
  published_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at         TIMESTAMPTZ,
  view_count         INTEGER NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.announcements IS 'Pengumuman untuk siswa, guru, dan pengelola';

-- ============================================================
-- TABEL: RUANG CHAT (chat_rooms)
-- ============================================================
CREATE TABLE public.chat_rooms (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  type            public.chat_room_type NOT NULL DEFAULT 'direct',
  avatar_url      TEXT,
  created_by      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  last_message    TEXT,
  last_message_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.chat_rooms IS 'Ruang percakapan antara pengguna';

-- ============================================================
-- TABEL: ANGGOTA RUANG CHAT (chat_room_members)
-- ============================================================
CREATE TABLE public.chat_room_members (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id      UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,

  UNIQUE (room_id, user_id)
);

COMMENT ON TABLE public.chat_room_members IS 'Daftar anggota dalam setiap ruang chat';

-- ============================================================
-- TABEL: PESAN CHAT (chat_messages)
-- ============================================================
CREATE TABLE public.chat_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id     UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  type        public.message_type NOT NULL DEFAULT 'text',
  file_url    TEXT,
  reply_to_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
  read_by     UUID[] NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.chat_messages IS 'Pesan dalam ruang chat';

-- ============================================================
-- TABEL: NOTIFIKASI (notifications)
-- ============================================================
CREATE TABLE public.notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  type       public.notification_type NOT NULL DEFAULT 'system',
  data       JSONB NOT NULL DEFAULT '{}',
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.notifications IS 'Notifikasi in-app untuk setiap pengguna';

-- ============================================================
-- TABEL: DOKUMEN (documents)
-- ============================================================
CREATE TABLE public.documents (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uploader_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  description    TEXT,
  category       public.document_category NOT NULL DEFAULT 'lainnya',
  file_url       TEXT NOT NULL,
  file_size      BIGINT NOT NULL DEFAULT 0,   -- Ukuran dalam bytes
  file_type      TEXT NOT NULL,               -- MIME type
  download_count INTEGER NOT NULL DEFAULT 0,
  is_public      BOOLEAN NOT NULL DEFAULT FALSE,
  target_roles   public.user_role[] NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.documents IS 'Dokumen yang dapat diunduh oleh pengguna';

-- Trigger: Perbarui updated_at otomatis
CREATE TRIGGER set_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- INDEKS (Indexes) untuk Performa Query
-- ============================================================

-- Profiles
CREATE INDEX idx_profiles_role ON public.profiles (role);
CREATE INDEX idx_profiles_is_active ON public.profiles (is_active);

-- Students
CREATE INDEX idx_students_profile_id ON public.students (profile_id);
CREATE INDEX idx_students_class_id ON public.students (class_id);
CREATE INDEX idx_students_department_id ON public.students (department_id);
CREATE INDEX idx_students_nis ON public.students (nis);

-- Teachers
CREATE INDEX idx_teachers_profile_id ON public.teachers (profile_id);
CREATE INDEX idx_teachers_department_id ON public.teachers (department_id);

-- Companies
CREATE INDEX idx_companies_is_active ON public.companies (is_active);
CREATE INDEX idx_companies_city ON public.companies (city);

-- PKL Assignments
CREATE INDEX idx_pkl_assignments_student_id ON public.pkl_assignments (student_id);
CREATE INDEX idx_pkl_assignments_teacher_id ON public.pkl_assignments (teacher_id);
CREATE INDEX idx_pkl_assignments_company_id ON public.pkl_assignments (company_id);
CREATE INDEX idx_pkl_assignments_status ON public.pkl_assignments (status);
CREATE INDEX idx_pkl_assignments_period_id ON public.pkl_assignments (pkl_period_id);

-- Attendance
CREATE INDEX idx_attendance_student_id ON public.attendance (student_id);
CREATE INDEX idx_attendance_pkl_assignment_id ON public.attendance (pkl_assignment_id);
CREATE INDEX idx_attendance_date ON public.attendance (date);
CREATE INDEX idx_attendance_status ON public.attendance (status);
CREATE INDEX idx_attendance_student_date ON public.attendance (student_id, date);

-- Absence Requests
CREATE INDEX idx_absence_requests_student_id ON public.absence_requests (student_id);
CREATE INDEX idx_absence_requests_assignment_id ON public.absence_requests (pkl_assignment_id);
CREATE INDEX idx_absence_requests_status ON public.absence_requests (status);
CREATE INDEX idx_absence_requests_date ON public.absence_requests (date);

-- Journals
CREATE INDEX idx_journals_student_id ON public.journals (student_id);
CREATE INDEX idx_journals_assignment_id ON public.journals (pkl_assignment_id);
CREATE INDEX idx_journals_status ON public.journals (status);
CREATE INDEX idx_journals_date ON public.journals (date DESC);
CREATE INDEX idx_journals_search ON public.journals USING gin (to_tsvector('indonesian', title || ' ' || content));

-- Journal Feedbacks
CREATE INDEX idx_journal_feedbacks_journal_id ON public.journal_feedbacks (journal_id);
CREATE INDEX idx_journal_feedbacks_teacher_id ON public.journal_feedbacks (teacher_id);

-- Assessments
CREATE INDEX idx_assessments_assignment_id ON public.assessments (pkl_assignment_id);
CREATE INDEX idx_assessments_teacher_id ON public.assessments (teacher_id);

-- Announcements
CREATE INDEX idx_announcements_author_id ON public.announcements (author_id);
CREATE INDEX idx_announcements_published_at ON public.announcements (published_at DESC);
CREATE INDEX idx_announcements_type ON public.announcements (type);
CREATE INDEX idx_announcements_is_pinned ON public.announcements (is_pinned);

-- Chat Rooms
CREATE INDEX idx_chat_rooms_created_by ON public.chat_rooms (created_by);
CREATE INDEX idx_chat_rooms_last_message_at ON public.chat_rooms (last_message_at DESC);

-- Chat Room Members
CREATE INDEX idx_chat_room_members_room_id ON public.chat_room_members (room_id);
CREATE INDEX idx_chat_room_members_user_id ON public.chat_room_members (user_id);

-- Chat Messages
CREATE INDEX idx_chat_messages_room_id ON public.chat_messages (room_id);
CREATE INDEX idx_chat_messages_sender_id ON public.chat_messages (sender_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages (room_id, created_at DESC);

-- Notifications
CREATE INDEX idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications (user_id, is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications (created_at DESC);
CREATE INDEX idx_notifications_type ON public.notifications (type);

-- Documents
CREATE INDEX idx_documents_uploader_id ON public.documents (uploader_id);
CREATE INDEX idx_documents_category ON public.documents (category);
CREATE INDEX idx_documents_is_public ON public.documents (is_public);

-- ============================================================
-- AKTIFKAN ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pkl_periods        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pkl_assignments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absence_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_feedbacks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents          ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- KEBIJAKAN RLS: PROFIL (profiles)
-- ============================================================

-- Pengguna bisa melihat semua profil yang aktif (untuk keperluan chat, pencarian, dll.)
CREATE POLICY "profiles_select_all_authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (TRUE);

-- Pengguna hanya bisa memperbarui profil sendiri
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admin bisa memperbarui semua profil
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (get_current_user_role() = 'super_admin');

-- ============================================================
-- KEBIJAKAN RLS: JURUSAN (departments)
-- ============================================================

-- Semua pengguna terautentikasi bisa melihat jurusan
CREATE POLICY "departments_select_authenticated"
  ON public.departments FOR SELECT
  TO authenticated
  USING (TRUE);

-- Hanya admin yang bisa membuat/mengubah/menghapus jurusan
CREATE POLICY "departments_insert_admin"
  ON public.departments FOR INSERT
  TO authenticated
  WITH CHECK (get_current_user_role() = 'super_admin');

CREATE POLICY "departments_update_admin"
  ON public.departments FOR UPDATE
  TO authenticated
  USING (get_current_user_role() = 'super_admin');

CREATE POLICY "departments_delete_admin"
  ON public.departments FOR DELETE
  TO authenticated
  USING (get_current_user_role() = 'super_admin');

-- ============================================================
-- KEBIJAKAN RLS: TAHUN AJARAN (academic_years)
-- ============================================================

CREATE POLICY "academic_years_select_authenticated"
  ON public.academic_years FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "academic_years_insert_admin"
  ON public.academic_years FOR INSERT
  TO authenticated
  WITH CHECK (get_current_user_role() = 'super_admin');

CREATE POLICY "academic_years_update_admin"
  ON public.academic_years FOR UPDATE
  TO authenticated
  USING (get_current_user_role() = 'super_admin');

-- ============================================================
-- KEBIJAKAN RLS: KELAS (classes)
-- ============================================================

CREATE POLICY "classes_select_authenticated"
  ON public.classes FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "classes_insert_admin_kajur"
  ON public.classes FOR INSERT
  TO authenticated
  WITH CHECK (get_current_user_role() IN ('super_admin', 'ketua_jurusan'));

CREATE POLICY "classes_update_admin_kajur"
  ON public.classes FOR UPDATE
  TO authenticated
  USING (get_current_user_role() IN ('super_admin', 'ketua_jurusan'));

-- ============================================================
-- KEBIJAKAN RLS: SISWA (students)
-- ============================================================

-- Siswa hanya bisa melihat profil sendiri
CREATE POLICY "students_select_own"
  ON public.students FOR SELECT
  TO authenticated
  USING (
    profile_id = auth.uid()
    OR get_current_user_role() IN ('super_admin', 'ketua_jurusan', 'guru_pembimbing')
  );

-- Admin dan kajur bisa membuat data siswa
CREATE POLICY "students_insert_admin_kajur"
  ON public.students FOR INSERT
  TO authenticated
  WITH CHECK (get_current_user_role() IN ('super_admin', 'ketua_jurusan'));

-- Admin, kajur, dan siswa sendiri bisa memperbarui data siswa
CREATE POLICY "students_update_own_or_admin"
  ON public.students FOR UPDATE
  TO authenticated
  USING (
    profile_id = auth.uid()
    OR get_current_user_role() IN ('super_admin', 'ketua_jurusan')
  );

-- ============================================================
-- KEBIJAKAN RLS: GURU (teachers)
-- ============================================================

CREATE POLICY "teachers_select_authenticated"
  ON public.teachers FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "teachers_insert_admin"
  ON public.teachers FOR INSERT
  TO authenticated
  WITH CHECK (get_current_user_role() = 'super_admin');

CREATE POLICY "teachers_update_admin_or_own"
  ON public.teachers FOR UPDATE
  TO authenticated
  USING (
    profile_id = auth.uid()
    OR get_current_user_role() = 'super_admin'
  );

-- ============================================================
-- KEBIJAKAN RLS: PERUSAHAAN (companies)
-- ============================================================

CREATE POLICY "companies_select_authenticated"
  ON public.companies FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "companies_insert_admin_kajur"
  ON public.companies FOR INSERT
  TO authenticated
  WITH CHECK (get_current_user_role() IN ('super_admin', 'ketua_jurusan'));

CREATE POLICY "companies_update_admin_kajur"
  ON public.companies FOR UPDATE
  TO authenticated
  USING (get_current_user_role() IN ('super_admin', 'ketua_jurusan'));

CREATE POLICY "companies_delete_admin"
  ON public.companies FOR DELETE
  TO authenticated
  USING (get_current_user_role() = 'super_admin');

-- ============================================================
-- KEBIJAKAN RLS: PERIODE PKL (pkl_periods)
-- ============================================================

CREATE POLICY "pkl_periods_select_authenticated"
  ON public.pkl_periods FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "pkl_periods_insert_admin_kajur"
  ON public.pkl_periods FOR INSERT
  TO authenticated
  WITH CHECK (get_current_user_role() IN ('super_admin', 'ketua_jurusan'));

CREATE POLICY "pkl_periods_update_admin_kajur"
  ON public.pkl_periods FOR UPDATE
  TO authenticated
  USING (get_current_user_role() IN ('super_admin', 'ketua_jurusan'));

-- ============================================================
-- KEBIJAKAN RLS: PENEMPATAN PKL (pkl_assignments)
-- ============================================================

-- Siswa hanya bisa melihat penempatan sendiri; guru bisa melihat penempatan yang mereka tangani
CREATE POLICY "pkl_assignments_select"
  ON public.pkl_assignments FOR SELECT
  TO authenticated
  USING (
    -- Siswa hanya lihat penempatan sendiri
    (
      get_current_user_role() = 'siswa'
      AND student_id IN (
        SELECT id FROM public.students WHERE profile_id = auth.uid()
      )
    )
    -- Guru hanya lihat penempatan yang mereka pegang
    OR (
      get_current_user_role() = 'guru_pembimbing'
      AND teacher_id IN (
        SELECT id FROM public.teachers WHERE profile_id = auth.uid()
      )
    )
    -- Admin dan kajur bisa melihat semua
    OR get_current_user_role() IN ('super_admin', 'ketua_jurusan')
  );

CREATE POLICY "pkl_assignments_insert_admin_kajur"
  ON public.pkl_assignments FOR INSERT
  TO authenticated
  WITH CHECK (get_current_user_role() IN ('super_admin', 'ketua_jurusan'));

CREATE POLICY "pkl_assignments_update_admin_kajur"
  ON public.pkl_assignments FOR UPDATE
  TO authenticated
  USING (get_current_user_role() IN ('super_admin', 'ketua_jurusan'));

-- ============================================================
-- KEBIJAKAN RLS: PRESENSI (attendance)
-- ============================================================

CREATE POLICY "attendance_select"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (
    -- Siswa hanya lihat presensi sendiri
    (
      get_current_user_role() = 'siswa'
      AND student_id IN (
        SELECT id FROM public.students WHERE profile_id = auth.uid()
      )
    )
    -- Guru lihat presensi siswa bimbingannya
    OR (
      get_current_user_role() = 'guru_pembimbing'
      AND pkl_assignment_id IN (
        SELECT id FROM public.pkl_assignments
        WHERE teacher_id IN (
          SELECT id FROM public.teachers WHERE profile_id = auth.uid()
        )
      )
    )
    -- Admin dan kajur bisa melihat semua
    OR get_current_user_role() IN ('super_admin', 'ketua_jurusan')
  );

-- Siswa bisa menambahkan presensi sendiri
CREATE POLICY "attendance_insert_student"
  ON public.attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id IN (
      SELECT id FROM public.students WHERE profile_id = auth.uid()
    )
  );

-- Guru dan admin bisa memperbarui (verifikasi/tolak) presensi
CREATE POLICY "attendance_update_teacher_admin"
  ON public.attendance FOR UPDATE
  TO authenticated
  USING (
    get_current_user_role() IN ('guru_pembimbing', 'super_admin', 'ketua_jurusan')
  );

-- ============================================================
-- KEBIJAKAN RLS: IZIN / SAKIT (absence_requests)
-- ============================================================

CREATE POLICY "absence_requests_select"
  ON public.absence_requests FOR SELECT
  TO authenticated
  USING (
    (
      get_current_user_role() = 'siswa'
      AND student_id IN (
        SELECT id FROM public.students WHERE profile_id = auth.uid()
      )
    )
    OR (
      get_current_user_role() = 'guru_pembimbing'
      AND pkl_assignment_id IN (
        SELECT id FROM public.pkl_assignments
        WHERE teacher_id IN (
          SELECT id FROM public.teachers WHERE profile_id = auth.uid()
        )
      )
    )
    OR get_current_user_role() IN ('super_admin', 'ketua_jurusan')
  );

-- Siswa bisa mengajukan izin/sakit sendiri
CREATE POLICY "absence_requests_insert_student"
  ON public.absence_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id IN (
      SELECT id FROM public.students WHERE profile_id = auth.uid()
    )
  );

-- Guru dan admin bisa memperbarui status izin
CREATE POLICY "absence_requests_update_teacher_admin"
  ON public.absence_requests FOR UPDATE
  TO authenticated
  USING (
    get_current_user_role() IN ('guru_pembimbing', 'super_admin', 'ketua_jurusan')
  );

-- Siswa bisa membatalkan izin yang masih pending
CREATE POLICY "absence_requests_delete_student_pending"
  ON public.absence_requests FOR DELETE
  TO authenticated
  USING (
    status = 'pending'
    AND student_id IN (
      SELECT id FROM public.students WHERE profile_id = auth.uid()
    )
  );

-- ============================================================
-- KEBIJAKAN RLS: JURNAL HARIAN (journals)
-- ============================================================

CREATE POLICY "journals_select"
  ON public.journals FOR SELECT
  TO authenticated
  USING (
    -- Siswa lihat jurnal sendiri
    (
      get_current_user_role() = 'siswa'
      AND student_id IN (
        SELECT id FROM public.students WHERE profile_id = auth.uid()
      )
    )
    -- Guru lihat jurnal siswa bimbingannya
    OR (
      get_current_user_role() = 'guru_pembimbing'
      AND pkl_assignment_id IN (
        SELECT id FROM public.pkl_assignments
        WHERE teacher_id IN (
          SELECT id FROM public.teachers WHERE profile_id = auth.uid()
        )
      )
    )
    -- Admin dan kajur lihat semua
    OR get_current_user_role() IN ('super_admin', 'ketua_jurusan')
  );

-- Siswa bisa membuat jurnal sendiri
CREATE POLICY "journals_insert_student"
  ON public.journals FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id IN (
      SELECT id FROM public.students WHERE profile_id = auth.uid()
    )
  );

-- Siswa bisa memperbarui jurnal sendiri (selama belum difinalisasi)
CREATE POLICY "journals_update_student"
  ON public.journals FOR UPDATE
  TO authenticated
  USING (
    (
      student_id IN (
        SELECT id FROM public.students WHERE profile_id = auth.uid()
      )
      AND status IN ('draft', 'revision')
    )
    -- Guru bisa mengubah status jurnal (reviewed/revision)
    OR (
      get_current_user_role() = 'guru_pembimbing'
      AND pkl_assignment_id IN (
        SELECT id FROM public.pkl_assignments
        WHERE teacher_id IN (
          SELECT id FROM public.teachers WHERE profile_id = auth.uid()
        )
      )
    )
  );

-- Siswa hanya bisa menghapus jurnal yang masih draft
CREATE POLICY "journals_delete_student_draft"
  ON public.journals FOR DELETE
  TO authenticated
  USING (
    status = 'draft'
    AND student_id IN (
      SELECT id FROM public.students WHERE profile_id = auth.uid()
    )
  );

-- ============================================================
-- KEBIJAKAN RLS: UMPAN BALIK JURNAL (journal_feedbacks)
-- ============================================================

-- Semua pihak terkait bisa melihat umpan balik
CREATE POLICY "journal_feedbacks_select"
  ON public.journal_feedbacks FOR SELECT
  TO authenticated
  USING (
    -- Pemilik jurnal
    journal_id IN (
      SELECT id FROM public.journals
      WHERE student_id IN (
        SELECT id FROM public.students WHERE profile_id = auth.uid()
      )
    )
    -- Guru yang memberi umpan balik
    OR teacher_id IN (
      SELECT id FROM public.teachers WHERE profile_id = auth.uid()
    )
    -- Admin dan kajur
    OR get_current_user_role() IN ('super_admin', 'ketua_jurusan')
  );

-- Guru bisa menambahkan umpan balik untuk jurnal siswa bimbingannya
CREATE POLICY "journal_feedbacks_insert_teacher"
  ON public.journal_feedbacks FOR INSERT
  TO authenticated
  WITH CHECK (
    get_current_user_role() = 'guru_pembimbing'
    AND teacher_id IN (
      SELECT id FROM public.teachers WHERE profile_id = auth.uid()
    )
    AND journal_id IN (
      SELECT j.id FROM public.journals j
      JOIN public.pkl_assignments pa ON j.pkl_assignment_id = pa.id
      JOIN public.teachers t ON pa.teacher_id = t.id
      WHERE t.profile_id = auth.uid()
    )
  );

-- Guru bisa memperbarui umpan balik yang mereka buat
CREATE POLICY "journal_feedbacks_update_own"
  ON public.journal_feedbacks FOR UPDATE
  TO authenticated
  USING (
    teacher_id IN (
      SELECT id FROM public.teachers WHERE profile_id = auth.uid()
    )
  );

-- ============================================================
-- KEBIJAKAN RLS: PENILAIAN (assessments)
-- ============================================================

CREATE POLICY "assessments_select"
  ON public.assessments FOR SELECT
  TO authenticated
  USING (
    -- Siswa lihat penilaian sendiri
    pkl_assignment_id IN (
      SELECT id FROM public.pkl_assignments
      WHERE student_id IN (
        SELECT id FROM public.students WHERE profile_id = auth.uid()
      )
    )
    -- Guru lihat penilaian siswa bimbingan
    OR teacher_id IN (
      SELECT id FROM public.teachers WHERE profile_id = auth.uid()
    )
    -- Admin dan kajur
    OR get_current_user_role() IN ('super_admin', 'ketua_jurusan')
  );

-- Guru bisa membuat/mengubah penilaian (selama belum final)
CREATE POLICY "assessments_insert_teacher"
  ON public.assessments FOR INSERT
  TO authenticated
  WITH CHECK (
    get_current_user_role() = 'guru_pembimbing'
    AND teacher_id IN (
      SELECT id FROM public.teachers WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "assessments_update_teacher_not_final"
  ON public.assessments FOR UPDATE
  TO authenticated
  USING (
    (
      get_current_user_role() = 'guru_pembimbing'
      AND teacher_id IN (
        SELECT id FROM public.teachers WHERE profile_id = auth.uid()
      )
      AND is_finalized = FALSE
    )
    OR get_current_user_role() = 'super_admin'
  );

-- ============================================================
-- KEBIJAKAN RLS: PENGUMUMAN (announcements)
-- ============================================================

-- Pengguna bisa melihat pengumuman yang ditujukan kepada mereka
CREATE POLICY "announcements_select"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (
    get_current_user_role()::TEXT = ANY(target_roles::TEXT[])
    OR get_current_user_role() IN ('super_admin', 'ketua_jurusan')
  );

-- Admin, kajur, dan guru bisa membuat pengumuman
CREATE POLICY "announcements_insert_staff"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    get_current_user_role() IN ('super_admin', 'ketua_jurusan', 'guru_pembimbing')
    AND author_id = auth.uid()
  );

-- Penulis pengumuman dan admin bisa mengubahnya
CREATE POLICY "announcements_update_author_or_admin"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid()
    OR get_current_user_role() = 'super_admin'
  );

-- Penulis atau admin bisa menghapus pengumuman
CREATE POLICY "announcements_delete_author_or_admin"
  ON public.announcements FOR DELETE
  TO authenticated
  USING (
    author_id = auth.uid()
    OR get_current_user_role() = 'super_admin'
  );

-- ============================================================
-- KEBIJAKAN RLS: RUANG CHAT (chat_rooms)
-- ============================================================

-- Pengguna hanya bisa melihat ruang chat tempat mereka menjadi anggota
CREATE POLICY "chat_rooms_select_member"
  ON public.chat_rooms FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT room_id FROM public.chat_room_members
      WHERE user_id = auth.uid()
    )
  );

-- Pengguna terautentikasi bisa membuat ruang chat
CREATE POLICY "chat_rooms_insert_authenticated"
  ON public.chat_rooms FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Admin ruangan atau admin sistem bisa memperbarui ruang chat
CREATE POLICY "chat_rooms_update_admin"
  ON public.chat_rooms FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT room_id FROM public.chat_room_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR get_current_user_role() = 'super_admin'
  );

-- ============================================================
-- KEBIJAKAN RLS: ANGGOTA RUANG CHAT (chat_room_members)
-- ============================================================

-- Anggota bisa melihat daftar anggota ruangan yang mereka ikuti
CREATE POLICY "chat_room_members_select"
  ON public.chat_room_members FOR SELECT
  TO authenticated
  USING (
    room_id IN (
      SELECT room_id FROM public.chat_room_members
      WHERE user_id = auth.uid()
    )
  );

-- Admin ruangan bisa menambahkan anggota baru
CREATE POLICY "chat_room_members_insert"
  ON public.chat_room_members FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Pengguna menambahkan dirinya sendiri (saat membuat ruangan)
    user_id = auth.uid()
    -- Atau admin ruangan yang menambahkan
    OR room_id IN (
      SELECT room_id FROM public.chat_room_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Pengguna bisa memperbarui status baca sendiri
CREATE POLICY "chat_room_members_update_own"
  ON public.chat_room_members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- KEBIJAKAN RLS: PESAN CHAT (chat_messages)
-- ============================================================

-- Anggota bisa melihat pesan di ruang chat mereka
CREATE POLICY "chat_messages_select_member"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (
    room_id IN (
      SELECT room_id FROM public.chat_room_members
      WHERE user_id = auth.uid()
    )
  );

-- Anggota bisa mengirim pesan ke ruang chat mereka
CREATE POLICY "chat_messages_insert_member"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND room_id IN (
      SELECT room_id FROM public.chat_room_members
      WHERE user_id = auth.uid()
    )
  );

-- Pengirim bisa menghapus (soft delete) pesan sendiri
CREATE POLICY "chat_messages_update_own"
  ON public.chat_messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid());

-- ============================================================
-- KEBIJAKAN RLS: NOTIFIKASI (notifications)
-- ============================================================

-- Pengguna hanya bisa melihat notifikasi milik sendiri
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Notifikasi dibuat oleh server (service role), bukan langsung dari client
-- Namun kita izinkan insert via authenticated untuk kemudahan pengembangan
CREATE POLICY "notifications_insert_authenticated"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR get_current_user_role() IN ('super_admin', 'ketua_jurusan', 'guru_pembimbing')
  );

-- Pengguna hanya bisa memperbarui notifikasi milik sendiri (untuk menandai sudah dibaca)
CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Pengguna bisa menghapus notifikasi sendiri
CREATE POLICY "notifications_delete_own"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- KEBIJAKAN RLS: DOKUMEN (documents)
-- ============================================================

-- Pengguna bisa melihat dokumen publik atau yang ditujukan kepada peran mereka
CREATE POLICY "documents_select"
  ON public.documents FOR SELECT
  TO authenticated
  USING (
    is_public = TRUE
    OR get_current_user_role()::TEXT = ANY(target_roles::TEXT[])
    OR uploader_id = auth.uid()
    OR get_current_user_role() IN ('super_admin', 'ketua_jurusan')
  );

-- Guru, kajur, dan admin bisa mengunggah dokumen
CREATE POLICY "documents_insert_staff"
  ON public.documents FOR INSERT
  TO authenticated
  WITH CHECK (
    get_current_user_role() IN ('super_admin', 'ketua_jurusan', 'guru_pembimbing')
    AND uploader_id = auth.uid()
  );

-- Pengunggah atau admin bisa memperbarui dokumen
CREATE POLICY "documents_update_uploader_or_admin"
  ON public.documents FOR UPDATE
  TO authenticated
  USING (
    uploader_id = auth.uid()
    OR get_current_user_role() = 'super_admin'
  );

-- Pengunggah atau admin bisa menghapus dokumen
CREATE POLICY "documents_delete_uploader_or_admin"
  ON public.documents FOR DELETE
  TO authenticated
  USING (
    uploader_id = auth.uid()
    OR get_current_user_role() = 'super_admin'
  );

-- ============================================================
-- FUNGSI STATISTIK DASHBOARD
-- ============================================================

-- Fungsi: Statistik dashboard siswa
CREATE OR REPLACE FUNCTION get_student_dashboard_stats(
  p_student_id      UUID,
  p_assignment_id   UUID
)
RETURNS TABLE (
  total_days            INTEGER,
  present_days          INTEGER,
  absent_days           INTEGER,
  permission_days       INTEGER,
  sick_days             INTEGER,
  attendance_percentage NUMERIC,
  total_journals        INTEGER,
  submitted_journals    INTEGER,
  reviewed_journals     INTEGER,
  pending_journals      INTEGER,
  unread_notifications  BIGINT
) AS $$
DECLARE
  v_present_days    INTEGER;
  v_sick_days       INTEGER;
  v_permission_days INTEGER;
  v_total_days      INTEGER;
BEGIN
  -- Hitung hari hadir (terverifikasi)
  SELECT COUNT(*) INTO v_present_days
  FROM public.attendance
  WHERE student_id = p_student_id
    AND pkl_assignment_id = p_assignment_id
    AND type = 'check_in'
    AND status = 'verified';

  -- Hitung hari sakit yang disetujui
  SELECT COUNT(*) INTO v_sick_days
  FROM public.absence_requests
  WHERE student_id = p_student_id
    AND pkl_assignment_id = p_assignment_id
    AND type = 'sick'
    AND status = 'approved';

  -- Hitung hari izin yang disetujui
  SELECT COUNT(*) INTO v_permission_days
  FROM public.absence_requests
  WHERE student_id = p_student_id
    AND pkl_assignment_id = p_assignment_id
    AND type IN ('permission', 'emergency', 'other')
    AND status = 'approved';

  v_total_days := v_present_days + v_sick_days + v_permission_days;

  RETURN QUERY
  SELECT
    v_total_days                                                          AS total_days,
    v_present_days                                                        AS present_days,
    (v_sick_days + v_permission_days)                                     AS absent_days,
    v_permission_days                                                     AS permission_days,
    v_sick_days                                                           AS sick_days,
    CASE
      WHEN v_total_days = 0 THEN 0
      ELSE ROUND((v_present_days::NUMERIC / v_total_days) * 100, 1)
    END                                                                   AS attendance_percentage,
    (SELECT COUNT(*)::INTEGER FROM public.journals
      WHERE student_id = p_student_id AND pkl_assignment_id = p_assignment_id) AS total_journals,
    (SELECT COUNT(*)::INTEGER FROM public.journals
      WHERE student_id = p_student_id AND pkl_assignment_id = p_assignment_id
        AND status != 'draft')                                            AS submitted_journals,
    (SELECT COUNT(*)::INTEGER FROM public.journals
      WHERE student_id = p_student_id AND pkl_assignment_id = p_assignment_id
        AND status = 'reviewed')                                          AS reviewed_journals,
    (SELECT COUNT(*)::INTEGER FROM public.journals
      WHERE student_id = p_student_id AND pkl_assignment_id = p_assignment_id
        AND status = 'submitted')                                         AS pending_journals,
    (SELECT COUNT(*) FROM public.notifications
      WHERE user_id = (
        SELECT profile_id FROM public.students WHERE id = p_student_id
      ) AND is_read = FALSE)                                              AS unread_notifications;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Fungsi: Statistik dashboard guru
CREATE OR REPLACE FUNCTION get_teacher_dashboard_stats(p_teacher_id UUID)
RETURNS TABLE (
  total_students        INTEGER,
  active_students       INTEGER,
  pending_attendance    BIGINT,
  pending_journals      BIGINT,
  pending_absences      BIGINT,
  unread_notifications  BIGINT
) AS $$
DECLARE
  v_active_assignment_ids UUID[];
BEGIN
  -- Ambil ID penempatan aktif yang dipegang guru ini
  SELECT ARRAY_AGG(id) INTO v_active_assignment_ids
  FROM public.pkl_assignments
  WHERE teacher_id = p_teacher_id AND status = 'active';

  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM public.pkl_assignments
      WHERE teacher_id = p_teacher_id)                       AS total_students,
    (SELECT COUNT(*)::INTEGER FROM public.pkl_assignments
      WHERE teacher_id = p_teacher_id AND status = 'active') AS active_students,
    COALESCE((
      SELECT COUNT(*) FROM public.attendance
      WHERE pkl_assignment_id = ANY(v_active_assignment_ids)
        AND status = 'pending'
    ), 0)                                                    AS pending_attendance,
    COALESCE((
      SELECT COUNT(*) FROM public.journals
      WHERE pkl_assignment_id = ANY(v_active_assignment_ids)
        AND status = 'submitted'
    ), 0)                                                    AS pending_journals,
    COALESCE((
      SELECT COUNT(*) FROM public.absence_requests
      WHERE pkl_assignment_id = ANY(v_active_assignment_ids)
        AND status = 'pending'
    ), 0)                                                    AS pending_absences,
    (SELECT COUNT(*) FROM public.notifications
      WHERE user_id = (
        SELECT profile_id FROM public.teachers WHERE id = p_teacher_id
      ) AND is_read = FALSE)                                 AS unread_notifications;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Fungsi: Statistik dashboard admin
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats(p_user_id UUID)
RETURNS TABLE (
  total_students        BIGINT,
  total_teachers        BIGINT,
  total_companies       BIGINT,
  active_pkl            BIGINT,
  total_departments     BIGINT,
  unread_notifications  BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.students)                                        AS total_students,
    (SELECT COUNT(*) FROM public.teachers)                                        AS total_teachers,
    (SELECT COUNT(*) FROM public.companies WHERE is_active = TRUE)                AS total_companies,
    (SELECT COUNT(*) FROM public.pkl_assignments WHERE status = 'active')         AS active_pkl,
    (SELECT COUNT(*) FROM public.departments WHERE is_active = TRUE)              AS total_departments,
    (SELECT COUNT(*) FROM public.notifications
      WHERE user_id = p_user_id AND is_read = FALSE)                              AS unread_notifications;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Fungsi: Rekap presensi bulanan siswa
CREATE OR REPLACE FUNCTION get_monthly_attendance_recap(
  p_student_id UUID,
  p_month      INTEGER,
  p_year       INTEGER
)
RETURNS TABLE (
  date           DATE,
  check_in_time  TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  check_in_status public.attendance_status,
  check_out_status public.attendance_status,
  absence_type   public.absence_type,
  absence_status public.absence_status,
  day_status     TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-01'),
      DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day',
      INTERVAL '1 day'
    )::DATE AS d
  ),
  check_ins AS (
    SELECT date, created_at, status
    FROM public.attendance
    WHERE student_id = p_student_id
      AND type = 'check_in'
      AND EXTRACT(MONTH FROM date) = p_month
      AND EXTRACT(YEAR FROM date) = p_year
  ),
  check_outs AS (
    SELECT date, created_at, status
    FROM public.attendance
    WHERE student_id = p_student_id
      AND type = 'check_out'
      AND EXTRACT(MONTH FROM date) = p_month
      AND EXTRACT(YEAR FROM date) = p_year
  ),
  absences AS (
    SELECT date, type, status
    FROM public.absence_requests
    WHERE student_id = p_student_id
      AND EXTRACT(MONTH FROM date) = p_month
      AND EXTRACT(YEAR FROM date) = p_year
  )
  SELECT
    ds.d                                  AS date,
    ci.created_at                         AS check_in_time,
    co.created_at                         AS check_out_time,
    ci.status                             AS check_in_status,
    co.status                             AS check_out_status,
    ab.type                               AS absence_type,
    ab.status                             AS absence_status,
    CASE
      WHEN EXTRACT(DOW FROM ds.d) IN (0, 6) THEN 'libur'
      WHEN ci.status = 'verified'          THEN 'hadir'
      WHEN ab.status = 'approved' AND ab.type = 'sick' THEN 'sakit'
      WHEN ab.status = 'approved'          THEN 'izin'
      WHEN ci.date IS NOT NULL             THEN 'menunggu_verifikasi'
      ELSE 'alfa'
    END                                   AS day_status
  FROM date_series ds
  LEFT JOIN check_ins ci ON ci.date = ds.d
  LEFT JOIN check_outs co ON co.date = ds.d
  LEFT JOIN absences ab ON ab.date = ds.d
  ORDER BY ds.d;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- KONFIGURASI REALTIME (untuk chat dan notifikasi)
-- ============================================================

-- Aktifkan publikasi realtime untuk tabel-tabel yang dibutuhkan
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.absence_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.journals;

-- ============================================================
-- DATA AWAL (Seed Data)
-- ============================================================

-- Masukkan tahun ajaran awal
INSERT INTO public.academic_years (year, semester, is_active)
VALUES ('2024/2025', 1, TRUE)
ON CONFLICT (year, semester) DO NOTHING;

-- ============================================================
-- GRANT PERMISSIONS untuk service_role dan authenticated
-- ============================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
