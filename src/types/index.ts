// ============================================================
// Tipe-tipe TypeScript untuk Aplikasi PKL SMK HASSINA
// ============================================================

// ------------------------------------
// Peran Pengguna (User Roles)
// ------------------------------------
export type UserRole =
  | "super_admin"
  | "ketua_jurusan"
  | "guru_pembimbing"
  | "siswa";

// ------------------------------------
// Profil Pengguna
// ------------------------------------
export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  fcm_token: string | null;
  created_at: string;
  updated_at: string;
}

// ------------------------------------
// Jurusan (Departments)
// ------------------------------------
export interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  head_id: string | null;
  is_active: boolean;
  created_at: string;
}

// ------------------------------------
// Kelas (Classes)
// ------------------------------------
export interface Class {
  id: string;
  name: string;
  department_id: string;
  academic_year_id: string;
  homeroom_teacher_id: string | null;
  created_at: string;
  // Relasi
  department?: Department;
}

// ------------------------------------
// Tahun Ajaran (Academic Years)
// ------------------------------------
export interface AcademicYear {
  id: string;
  year: string; // contoh: "2024/2025"
  semester: 1 | 2;
  is_active: boolean;
  created_at: string;
}

// ------------------------------------
// Siswa (Students)
// ------------------------------------
export interface Student {
  id: string;
  profile_id: string;
  nis: string;
  class_id: string;
  department_id: string;
  address: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  created_at: string;
  // Relasi
  profile?: Profile;
  class?: Class;
  department?: Department;
}

// ------------------------------------
// Guru (Teachers)
// ------------------------------------
export interface Teacher {
  id: string;
  profile_id: string;
  nip: string | null;
  subject: string | null;
  department_id: string;
  created_at: string;
  // Relasi
  profile?: Profile;
  department?: Department;
}

// ------------------------------------
// Perusahaan / DU-DI (Companies)
// ------------------------------------
export interface Company {
  id: string;
  name: string;
  industry_type: string | null;
  address: string;
  city: string;
  phone: string | null;
  email: string | null;
  contact_person: string | null;
  latitude: number | null;
  longitude: number | null;
  radius_meter: number;
  is_active: boolean;
  logo_url: string | null;
  created_at: string;
}

// ------------------------------------
// Periode PKL (PKL Periods)
// ------------------------------------
export interface PKLPeriod {
  id: string;
  academic_year_id: string;
  name: string;
  start_date: string;
  end_date: string;
  check_in_start: string;   // format "HH:mm"
  check_in_end: string;     // format "HH:mm"
  check_out_start: string;  // format "HH:mm"
  check_out_end: string;    // format "HH:mm"
  is_active: boolean;
  created_at: string;
  // Relasi
  academic_year?: AcademicYear;
}

// ------------------------------------
// Penempatan PKL (PKL Assignments)
// ------------------------------------
export type PKLAssignmentStatus =
  | "pending"
  | "active"
  | "completed"
  | "cancelled";

export interface PKLAssignment {
  id: string;
  student_id: string;
  company_id: string;
  pkl_period_id: string;
  teacher_id: string;
  supervisor_name: string | null;
  supervisor_phone: string | null;
  start_date: string;
  end_date: string;
  status: PKLAssignmentStatus;
  created_at: string;
  // Relasi
  student?: Student;
  company?: Company;
  pkl_period?: PKLPeriod;
  teacher?: Teacher;
}

// ------------------------------------
// Presensi / Kehadiran (Attendance)
// ------------------------------------
export type AttendanceType = "check_in" | "check_out";

export type AttendanceStatus = "pending" | "verified" | "rejected";

export interface Attendance {
  id: string;
  pkl_assignment_id: string;
  student_id: string;
  date: string;           // format "YYYY-MM-DD"
  type: AttendanceType;
  selfie_url: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  is_within_radius: boolean;
  status: AttendanceStatus;
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
  created_at: string;
  // Relasi
  student?: Student;
  pkl_assignment?: PKLAssignment;
}

// Tipe untuk insert presensi baru
export type AttendanceInsert = Omit<
  Attendance,
  "id" | "created_at" | "student" | "pkl_assignment"
>;

// ------------------------------------
// Izin / Absen (Absence Requests)
// ------------------------------------
export type AbsenceType = "sick" | "permission" | "emergency" | "other";

export type AbsenceStatus = "pending" | "approved" | "rejected";

export interface AbsenceRequest {
  id: string;
  student_id: string;
  pkl_assignment_id: string;
  date: string;           // format "YYYY-MM-DD"
  type: AbsenceType;
  reason: string;
  attachment_url: string | null;
  status: AbsenceStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  // Relasi
  student?: Student;
}

// ------------------------------------
// Jurnal Harian (Daily Journals)
// ------------------------------------
export type JournalStatus = "draft" | "submitted" | "reviewed" | "revision";

export interface Journal {
  id: string;
  student_id: string;
  pkl_assignment_id: string;
  date: string;           // format "YYYY-MM-DD"
  title: string;
  content: string;
  photos: string[];       // array URL foto
  status: JournalStatus;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  // Relasi
  student?: Student;
  feedbacks?: JournalFeedback[];
}

// Tipe untuk insert jurnal baru
export type JournalInsert = Omit<
  Journal,
  "id" | "created_at" | "updated_at" | "student" | "feedbacks"
>;

// Tipe untuk update jurnal
export type JournalUpdate = Partial<JournalInsert>;

// ------------------------------------
// Umpan Balik Jurnal (Journal Feedbacks)
// ------------------------------------
export interface JournalFeedback {
  id: string;
  journal_id: string;
  teacher_id: string;
  content: string;
  rating: number | null;  // nilai 1-5
  created_at: string;
  updated_at: string;
  // Relasi
  teacher?: Teacher & { profile?: Profile };
}

// ------------------------------------
// Pengumuman (Announcements)
// ------------------------------------
export type AnnouncementType =
  | "general"
  | "urgent"
  | "event"
  | "reminder";

export interface Announcement {
  id: string;
  author_id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  target_roles: UserRole[];
  target_departments: string[];
  attachment_urls: string[];
  is_pinned: boolean;
  published_at: string;
  expires_at: string | null;
  view_count: number;
  created_at: string;
  // Relasi
  author?: Profile;
}

// ------------------------------------
// Ruang Chat (Chat Rooms)
// ------------------------------------
export type ChatRoomType = "direct" | "group";

export interface ChatRoom {
  id: string;
  name: string;
  type: ChatRoomType;
  avatar_url: string | null;
  created_by: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  // Relasi
  members?: ChatRoomMember[];
}

export interface ChatRoomMember {
  id: string;
  room_id: string;
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
  last_read_at: string | null;
  // Relasi
  profile?: Profile;
}

// ------------------------------------
// Pesan Chat (Chat Messages)
// ------------------------------------
export type MessageType = "text" | "image" | "file" | "system";

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  type: MessageType;
  file_url: string | null;
  reply_to_id: string | null;
  is_deleted: boolean;
  read_by: string[];
  created_at: string;
  // Relasi
  sender?: Profile;
  reply_to?: ChatMessage;
}

// ------------------------------------
// Notifikasi (Notifications)
// ------------------------------------
export type NotificationType =
  | "attendance"
  | "journal"
  | "absence"
  | "announcement"
  | "chat"
  | "assessment"
  | "system";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: NotificationType;
  data: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

// ------------------------------------
// Dokumen (Documents)
// ------------------------------------
export type DocumentCategory =
  | "template"
  | "panduan"
  | "surat"
  | "laporan"
  | "lainnya";

export interface Document {
  id: string;
  uploader_id: string;
  name: string;
  description: string | null;
  category: DocumentCategory;
  file_url: string;
  file_size: number;    // dalam bytes
  file_type: string;    // MIME type
  download_count: number;
  is_public: boolean;
  target_roles: UserRole[];
  created_at: string;
  updated_at: string;
  // Relasi
  uploader?: Profile;
}

// ------------------------------------
// Penilaian (Assessments)
// ------------------------------------
export interface Assessment {
  id: string;
  pkl_assignment_id: string;
  teacher_id: string;
  attendance_score: number | null;    // nilai kehadiran
  journal_score: number | null;       // nilai jurnal
  performance_score: number | null;   // nilai kinerja
  attitude_score: number | null;      // nilai sikap
  final_score: number | null;         // nilai akhir
  grade: string | null;               // predikat: A, B, C, D, E
  notes: string | null;
  is_finalized: boolean;
  created_at: string;
  updated_at: string;
  // Relasi
  pkl_assignment?: PKLAssignment;
  teacher?: Teacher;
}

// ------------------------------------
// Tipe Insert / Update untuk Company
// ------------------------------------
export type CompanyInsert = Omit<Company, "id" | "created_at">;
export type CompanyUpdate = Partial<CompanyInsert>;

// ------------------------------------
// Tipe Respons API
// ------------------------------------
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// ------------------------------------
// Statistik Dashboard Siswa
// ------------------------------------
export interface StudentDashboardStats {
  total_days: number;
  present_days: number;
  absent_days: number;
  permission_days: number;
  sick_days: number;
  attendance_percentage: number;
  total_journals: number;
  submitted_journals: number;
  reviewed_journals: number;
  pending_journals: number;
  unread_notifications: number;
}

// ------------------------------------
// Statistik Dashboard Guru Pembimbing
// ------------------------------------
export interface TeacherDashboardStats {
  total_students: number;
  active_students: number;
  pending_attendance: number;
  pending_journals: number;
  pending_absences: number;
  unread_notifications: number;
}

// ------------------------------------
// Statistik Dashboard Admin
// ------------------------------------
export interface AdminDashboardStats {
  total_students: number;
  total_teachers: number;
  total_companies: number;
  active_pkl: number;
  total_departments: number;
  unread_notifications: number;
}

// ------------------------------------
// Tipe Pagination
// ------------------------------------
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ------------------------------------
// Tipe Filter Presensi
// ------------------------------------
export interface AttendanceFilter {
  student_id?: string;
  month?: number;
  year?: number;
  status?: AttendanceStatus;
  date_from?: string;
  date_to?: string;
}

// ------------------------------------
// Tipe Filter Jurnal
// ------------------------------------
export interface JournalFilter {
  student_id?: string;
  status?: JournalStatus;
  date_from?: string;
  date_to?: string;
  search?: string;
}

// ------------------------------------
// Tipe Rekap Presensi
// ------------------------------------
export interface AttendanceRecap {
  date: string;
  check_in: Attendance | null;
  check_out: Attendance | null;
  absence_request: AbsenceRequest | null;
  status: "hadir" | "izin" | "sakit" | "alfa" | "libur";
}

// ------------------------------------
// Tipe untuk form registrasi siswa
// ------------------------------------
export interface StudentRegistrationForm {
  full_name: string;
  email: string;
  password: string;
  nis: string;
  class_id: string;
  department_id: string;
  phone: string;
  address: string;
  parent_name: string;
  parent_phone: string;
}

// ------------------------------------
// Tipe untuk form registrasi guru
// ------------------------------------
export interface TeacherRegistrationForm {
  full_name: string;
  email: string;
  password: string;
  nip: string;
  subject: string;
  department_id: string;
  phone: string;
}

// ------------------------------------
// Tipe upload file
// ------------------------------------
export interface FileUploadResult {
  url: string;
  path: string;
  size: number;
  type: string;
}

// ------------------------------------
// Tipe koordinat lokasi
// ------------------------------------
export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}
