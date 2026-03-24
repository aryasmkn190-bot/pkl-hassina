// ============================================================
// Fungsi-fungsi Query Supabase untuk Aplikasi PKL SMK HASSINA
// ============================================================

import { createClient } from "./client";
import type {
  Profile,
  Student,
  Teacher,
  Company,
  PKLAssignment,
  PKLPeriod,
  Attendance,
  AttendanceInsert,
  AbsenceRequest,
  Journal,
  JournalInsert,
  JournalUpdate,
  JournalFeedback,
  Announcement,
  ChatRoom,
  ChatRoomMember,
  ChatMessage,
  Notification,
  Document,
  Assessment,
  Department,
  Class,
  AcademicYear,
  UserRole,
  MessageType,
  StudentDashboardStats,
  TeacherDashboardStats,
  AdminDashboardStats,
  CompanyInsert,
  CompanyUpdate,
  AbsenceStatus,
  AttendanceStatus,
  JournalStatus,
} from "@/types";

// ============================================================
// PROFIL PENGGUNA (Profiles)
// ============================================================

/** Mendapatkan profil pengguna yang sedang login */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Gagal mengambil profil:", error.message);
    return null;
  }

  return data as Profile;
}

/** Mendapatkan profil berdasarkan ID */
export async function getProfileById(id: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Gagal mengambil profil berdasarkan ID:", error.message);
    return null;
  }

  return data as Profile;
}

/** Memperbarui profil pengguna */
export async function updateProfile(
  id: string,
  updates: Partial<
    Pick<Profile, "full_name" | "avatar_url" | "phone" | "fcm_token">
  >,
): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Gagal memperbarui profil:", error.message);
    return null;
  }

  return data as Profile;
}

/** Memperbarui FCM token untuk push notification */
export async function updateFCMToken(
  userId: string,
  fcmToken: string,
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ fcm_token: fcmToken, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    console.error("Gagal memperbarui FCM token:", error.message);
    return false;
  }

  return true;
}

// ============================================================
// SISWA (Students)
// ============================================================

/** Mendapatkan data siswa berdasarkan profile_id */
export async function getStudentByProfileId(
  profileId: string,
): Promise<Student | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("students")
    .select(
      `
      *,
      profile:profiles(*),
      class:classes(*, department:departments(*)),
      department:departments(*)
    `,
    )
    .eq("profile_id", profileId)
    .single();

  if (error) {
    console.error("Gagal mengambil data siswa:", error.message);
    return null;
  }

  return data as Student;
}

/** Mendapatkan data siswa berdasarkan ID siswa */
export async function getStudentById(id: string): Promise<Student | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("students")
    .select(
      `
      *,
      profile:profiles(*),
      class:classes(*, department:departments(*)),
      department:departments(*)
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Gagal mengambil data siswa berdasarkan ID:", error.message);
    return null;
  }

  return data as Student;
}

/** Mendapatkan semua siswa (untuk admin) */
export async function getAllStudentsForAdmin(): Promise<Student[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("students")
    .select(
      `
      *,
      profile:profiles(*),
      class:classes(name),
      department:departments(name, code)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal mengambil semua data siswa:", error.message);
    return [];
  }

  return (data as Student[]) ?? [];
}

/** Mendapatkan siswa bimbingan guru */
export async function getTeacherStudents(
  teacherId: string,
): Promise<Student[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pkl_assignments")
    .select(
      `
      student:students(
        *,
        profile:profiles(*),
        class:classes(name),
        department:departments(name, code)
      )
    `,
    )
    .eq("teacher_id", teacherId)
    .eq("status", "active");

  if (error) {
    console.error("Gagal mengambil siswa bimbingan:", error.message);
    return [];
  }

  return (
    (data?.map((d) => d.student).filter(Boolean) as unknown as Student[]) ?? []
  );
}

/** Mendapatkan statistik dashboard siswa */
export async function getStudentDashboardStats(
  studentId: string,
  pklAssignmentId: string,
): Promise<StudentDashboardStats> {
  const supabase = createClient();

  // Hitung presensi
  const { data: attendanceData } = await supabase
    .from("attendance")
    .select("date, type, status")
    .eq("student_id", studentId)
    .eq("pkl_assignment_id", pklAssignmentId)
    .eq("type", "check_in");

  // Hitung izin/sakit
  const { data: absenceData } = await supabase
    .from("absence_requests")
    .select("date, type, status")
    .eq("student_id", studentId)
    .eq("pkl_assignment_id", pklAssignmentId)
    .eq("status", "approved");

  // Hitung jurnal
  const { data: journalData } = await supabase
    .from("journals")
    .select("status")
    .eq("student_id", studentId)
    .eq("pkl_assignment_id", pklAssignmentId);

  // Hitung notifikasi yang belum dibaca
  const { count: unreadNotifications } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", studentId)
    .eq("is_read", false);

  const presentDays =
    attendanceData?.filter((a) => a.status === "verified").length ?? 0;
  const sickDays = absenceData?.filter((a) => a.type === "sick").length ?? 0;
  const permissionDays =
    absenceData?.filter((a) => a.type === "permission").length ?? 0;
  const emergencyDays =
    absenceData?.filter((a) => a.type === "emergency").length ?? 0;
  const totalAbsentDays = sickDays + permissionDays + emergencyDays;
  const totalDays = presentDays + totalAbsentDays;
  const totalJournals = journalData?.length ?? 0;
  const submittedJournals =
    journalData?.filter((j) => j.status !== "draft").length ?? 0;
  const reviewedJournals =
    journalData?.filter((j) => j.status === "reviewed").length ?? 0;
  const pendingJournals =
    journalData?.filter((j) => j.status === "submitted").length ?? 0;

  return {
    total_days: totalDays,
    present_days: presentDays,
    absent_days: totalAbsentDays,
    permission_days: permissionDays,
    sick_days: sickDays,
    attendance_percentage:
      totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
    total_journals: totalJournals,
    submitted_journals: submittedJournals,
    reviewed_journals: reviewedJournals,
    pending_journals: pendingJournals,
    unread_notifications: unreadNotifications ?? 0,
  };
}

// ============================================================
// GURU PEMBIMBING (Teachers)
// ============================================================

/** Mendapatkan data guru berdasarkan profile_id */
export async function getTeacherByProfileId(
  profileId: string,
): Promise<Teacher | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("teachers")
    .select(
      `
      *,
      profile:profiles(*),
      department:departments(*)
    `,
    )
    .eq("profile_id", profileId)
    .single();

  if (error) {
    console.error("Gagal mengambil data guru:", error.message);
    return null;
  }

  return data as Teacher;
}

/** Mendapatkan statistik dashboard guru */
export async function getTeacherDashboardStats(
  teacherId: string,
): Promise<TeacherDashboardStats> {
  const supabase = createClient();

  // Total dan siswa aktif
  const { data: assignmentData } = await supabase
    .from("pkl_assignments")
    .select("id, status")
    .eq("teacher_id", teacherId);

  const totalStudents = assignmentData?.length ?? 0;
  const activeStudents =
    assignmentData?.filter((a) => a.status === "active").length ?? 0;
  const activeAssignmentIds =
    assignmentData?.filter((a) => a.status === "active").map((a) => a.id) ?? [];

  let pendingAttendance = 0;
  let pendingAbsences = 0;

  if (activeAssignmentIds.length > 0) {
    // Presensi yang menunggu verifikasi
    const { count: attCount } = await supabase
      .from("attendance")
      .select("*", { count: "exact", head: true })
      .in("pkl_assignment_id", activeAssignmentIds)
      .eq("status", "pending");
    pendingAttendance = attCount ?? 0;

    // Izin/sakit yang menunggu persetujuan
    const { count: absCount } = await supabase
      .from("absence_requests")
      .select("*", { count: "exact", head: true })
      .in("pkl_assignment_id", activeAssignmentIds)
      .eq("status", "pending");
    pendingAbsences = absCount ?? 0;
  }

  // Jurnal yang menunggu review
  const { count: pendingJournals } = await supabase
    .from("journals")
    .select("*", { count: "exact", head: true })
    .in("pkl_assignment_id", activeAssignmentIds)
    .eq("status", "submitted");

  // Notifikasi yang belum dibaca
  const { count: unreadNotifications } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", teacherId)
    .eq("is_read", false);

  return {
    total_students: totalStudents,
    active_students: activeStudents,
    pending_attendance: pendingAttendance,
    pending_journals: pendingJournals ?? 0,
    pending_absences: pendingAbsences,
    unread_notifications: unreadNotifications ?? 0,
  };
}

// ============================================================
// PRESENSI (Attendance)
// ============================================================

/** Mendapatkan presensi hari ini untuk siswa */
export async function getTodayAttendance(
  studentId: string,
  date: string,
): Promise<{ check_in: Attendance | null; check_out: Attendance | null }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("student_id", studentId)
    .eq("date", date);

  if (error) {
    console.error("Gagal mengambil presensi hari ini:", error.message);
    return { check_in: null, check_out: null };
  }

  const checkIn =
    (data as Attendance[]).find((a) => a.type === "check_in") ?? null;
  const checkOut =
    (data as Attendance[]).find((a) => a.type === "check_out") ?? null;

  return { check_in: checkIn, check_out: checkOut };
}

/** Mendapatkan riwayat presensi bulanan */
export async function getAttendanceHistory(
  studentId: string,
  month: number,
  year: number,
): Promise<Attendance[]> {
  const supabase = createClient();
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0).toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("student_id", studentId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Gagal mengambil riwayat presensi:", error.message);
    return [];
  }

  return (data as Attendance[]) ?? [];
}

/** Membuat catatan presensi baru (check-in / check-out) */
export async function createAttendance(
  data: AttendanceInsert,
): Promise<Attendance | null> {
  const supabase = createClient();
  const { data: result, error } = await supabase
    .from("attendance")
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error("Gagal membuat presensi:", error.message);
    return null;
  }

  return result as Attendance;
}

/** Mendapatkan presensi yang menunggu verifikasi oleh guru */
export async function getPendingAttendance(
  teacherId: string,
): Promise<Attendance[]> {
  const supabase = createClient();

  // Ambil ID penempatan yang dipegang guru ini
  const { data: assignments } = await supabase
    .from("pkl_assignments")
    .select("id")
    .eq("teacher_id", teacherId)
    .eq("status", "active");

  if (!assignments || assignments.length === 0) return [];

  const assignmentIds = assignments.map((a) => a.id);

  const { data, error } = await supabase
    .from("attendance")
    .select(
      `
      *,
      student:students(*, profile:profiles(full_name, avatar_url)),
      pkl_assignment:pkl_assignments(*, company:companies(name))
    `,
    )
    .in("pkl_assignment_id", assignmentIds)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "Gagal mengambil presensi yang menunggu verifikasi:",
      error.message,
    );
    return [];
  }

  return (data as Attendance[]) ?? [];
}

/** Memverifikasi presensi siswa */
export async function verifyAttendance(
  id: string,
  verifiedBy: string,
  notes?: string,
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("attendance")
    .update({
      status: "verified" as AttendanceStatus,
      verified_by: verifiedBy,
      verified_at: new Date().toISOString(),
      notes: notes ?? null,
    })
    .eq("id", id);

  if (error) {
    console.error("Gagal memverifikasi presensi:", error.message);
    return false;
  }

  return true;
}

/** Menolak presensi siswa */
export async function rejectAttendance(
  id: string,
  verifiedBy: string,
  notes: string,
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("attendance")
    .update({
      status: "rejected" as AttendanceStatus,
      verified_by: verifiedBy,
      verified_at: new Date().toISOString(),
      notes,
    })
    .eq("id", id);

  if (error) {
    console.error("Gagal menolak presensi:", error.message);
    return false;
  }

  return true;
}

// ============================================================
// IZIN / SAKIT (Absence Requests)
// ============================================================

/** Mendapatkan semua pengajuan izin/sakit siswa */
export async function getAbsenceRequests(
  studentId: string,
): Promise<AbsenceRequest[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("absence_requests")
    .select("*")
    .eq("student_id", studentId)
    .order("date", { ascending: false });

  if (error) {
    console.error("Gagal mengambil data izin/sakit:", error.message);
    return [];
  }

  return (data as AbsenceRequest[]) ?? [];
}

/** Membuat pengajuan izin/sakit baru */
export async function createAbsenceRequest(
  data: Omit<
    AbsenceRequest,
    | "id"
    | "created_at"
    | "status"
    | "reviewed_by"
    | "reviewed_at"
    | "review_notes"
    | "student"
  >,
): Promise<AbsenceRequest | null> {
  const supabase = createClient();
  const { data: result, error } = await supabase
    .from("absence_requests")
    .insert({ ...data, status: "pending" })
    .select()
    .single();

  if (error) {
    console.error("Gagal membuat pengajuan izin/sakit:", error.message);
    return null;
  }

  return result as AbsenceRequest;
}

/** Mendapatkan pengajuan izin/sakit yang menunggu persetujuan guru */
export async function getPendingAbsences(
  teacherId: string,
): Promise<AbsenceRequest[]> {
  const supabase = createClient();

  const { data: assignments } = await supabase
    .from("pkl_assignments")
    .select("id")
    .eq("teacher_id", teacherId)
    .eq("status", "active");

  if (!assignments || assignments.length === 0) return [];

  const assignmentIds = assignments.map((a) => a.id);

  const { data, error } = await supabase
    .from("absence_requests")
    .select(
      `
      *,
      student:students(*, profile:profiles(full_name, avatar_url))
    `,
    )
    .in("pkl_assignment_id", assignmentIds)
    .eq("status", "pending")
    .order("date", { ascending: false });

  if (error) {
    console.error(
      "Gagal mengambil izin/sakit yang menunggu persetujuan:",
      error.message,
    );
    return [];
  }

  return (data as AbsenceRequest[]) ?? [];
}

/** Menyetujui pengajuan izin/sakit */
export async function approveAbsence(
  id: string,
  reviewedBy: string,
  notes: string,
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("absence_requests")
    .update({
      status: "approved" as AbsenceStatus,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      review_notes: notes,
    })
    .eq("id", id);

  if (error) {
    console.error("Gagal menyetujui izin/sakit:", error.message);
    return false;
  }

  return true;
}

/** Menolak pengajuan izin/sakit */
export async function rejectAbsence(
  id: string,
  reviewedBy: string,
  notes: string,
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("absence_requests")
    .update({
      status: "rejected" as AbsenceStatus,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      review_notes: notes,
    })
    .eq("id", id);

  if (error) {
    console.error("Gagal menolak izin/sakit:", error.message);
    return false;
  }

  return true;
}

// ============================================================
// JURNAL HARIAN (Daily Journals)
// ============================================================

/** Mendapatkan semua jurnal milik siswa */
export async function getJournals(
  studentId: string,
  filters?: { status?: JournalStatus; search?: string },
): Promise<Journal[]> {
  const supabase = createClient();
  let query = supabase
    .from("journals")
    .select(
      `
      *,
      feedbacks:journal_feedbacks(
        *,
        teacher:teachers(*, profile:profiles(full_name, avatar_url))
      )
    `,
    )
    .eq("student_id", studentId)
    .order("date", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Gagal mengambil jurnal:", error.message);
    return [];
  }

  return (data as Journal[]) ?? [];
}

/** Mendapatkan detail jurnal berdasarkan ID */
export async function getJournalById(id: string): Promise<Journal | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("journals")
    .select(
      `
      *,
      student:students(*, profile:profiles(full_name, avatar_url)),
      feedbacks:journal_feedbacks(
        *,
        teacher:teachers(*, profile:profiles(full_name, avatar_url))
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Gagal mengambil detail jurnal:", error.message);
    return null;
  }

  return data as Journal;
}

/** Membuat jurnal harian baru */
export async function createJournal(
  data: JournalInsert,
): Promise<Journal | null> {
  const supabase = createClient();
  const { data: result, error } = await supabase
    .from("journals")
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error("Gagal membuat jurnal:", error.message);
    return null;
  }

  return result as Journal;
}

/** Memperbarui jurnal harian */
export async function updateJournal(
  id: string,
  data: JournalUpdate,
): Promise<Journal | null> {
  const supabase = createClient();
  const { data: result, error } = await supabase
    .from("journals")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Gagal memperbarui jurnal:", error.message);
    return null;
  }

  return result as Journal;
}

/** Mengirim jurnal (mengubah status dari draft ke submitted) */
export async function submitJournal(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("journals")
    .update({
      status: "submitted" as JournalStatus,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Gagal mengirim jurnal:", error.message);
    return false;
  }

  return true;
}

/** Menghapus jurnal (hanya jika masih draft) */
export async function deleteJournal(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("journals")
    .delete()
    .eq("id", id)
    .eq("status", "draft");

  if (error) {
    console.error("Gagal menghapus jurnal:", error.message);
    return false;
  }

  return true;
}

/** Mendapatkan jurnal yang perlu direview oleh guru */
export async function getJournalsForTeacher(
  teacherId: string,
  status?: JournalStatus,
): Promise<Journal[]> {
  const supabase = createClient();

  const { data: assignments } = await supabase
    .from("pkl_assignments")
    .select("id")
    .eq("teacher_id", teacherId)
    .eq("status", "active");

  if (!assignments || assignments.length === 0) return [];

  const assignmentIds = assignments.map((a) => a.id);

  let query = supabase
    .from("journals")
    .select(
      `
      *,
      student:students(*, profile:profiles(full_name, avatar_url)),
      feedbacks:journal_feedbacks(id)
    `,
    )
    .in("pkl_assignment_id", assignmentIds)
    .order("date", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Gagal mengambil jurnal untuk guru:", error.message);
    return [];
  }

  return (data as Journal[]) ?? [];
}

/** Menambahkan umpan balik jurnal */
export async function addJournalFeedback(
  journalId: string,
  teacherId: string,
  content: string,
  rating: number | null,
): Promise<JournalFeedback | null> {
  const supabase = createClient();

  // Tambahkan feedback
  const { data, error } = await supabase
    .from("journal_feedbacks")
    .insert({
      journal_id: journalId,
      teacher_id: teacherId,
      content,
      rating,
    })
    .select(
      `
      *,
      teacher:teachers(*, profile:profiles(full_name, avatar_url))
    `,
    )
    .single();

  if (error) {
    console.error("Gagal menambahkan umpan balik jurnal:", error.message);
    return null;
  }

  // Update status jurnal menjadi reviewed
  await supabase
    .from("journals")
    .update({
      status: "reviewed" as JournalStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", journalId);

  return data as JournalFeedback;
}

/** Menandai jurnal perlu revisi */
export async function requestJournalRevision(
  journalId: string,
  teacherId: string,
  content: string,
): Promise<boolean> {
  const supabase = createClient();

  await supabase.from("journal_feedbacks").insert({
    journal_id: journalId,
    teacher_id: teacherId,
    content,
    rating: null,
  });

  const { error } = await supabase
    .from("journals")
    .update({
      status: "revision" as JournalStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", journalId);

  if (error) {
    console.error("Gagal menandai jurnal perlu revisi:", error.message);
    return false;
  }

  return true;
}

// ============================================================
// PENEMPATAN PKL (PKL Assignments)
// ============================================================

/** Mendapatkan penempatan PKL aktif siswa */
export async function getActivePKLAssignment(
  studentId: string,
): Promise<PKLAssignment | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pkl_assignments")
    .select(
      `
      *,
      student:students(*, profile:profiles(*)),
      company:companies(*),
      pkl_period:pkl_periods(*, academic_year:academic_years(*)),
      teacher:teachers(*, profile:profiles(*))
    `,
    )
    .eq("student_id", studentId)
    .eq("status", "active")
    .single();

  if (error) {
    console.error("Gagal mengambil penempatan PKL aktif:", error.message);
    return null;
  }

  return data as PKLAssignment;
}

/** Mendapatkan semua penempatan PKL (admin/kajur) */
export async function getAllPKLAssignments(): Promise<PKLAssignment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pkl_assignments")
    .select(
      `
      *,
      student:students(*, profile:profiles(full_name, avatar_url)),
      company:companies(name, city),
      pkl_period:pkl_periods(name),
      teacher:teachers(*, profile:profiles(full_name))
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal mengambil semua penempatan PKL:", error.message);
    return [];
  }

  return (data as PKLAssignment[]) ?? [];
}

/** Membuat penempatan PKL baru */
export async function createPKLAssignment(
  data: Omit<
    PKLAssignment,
    "id" | "created_at" | "student" | "company" | "pkl_period" | "teacher"
  >,
): Promise<PKLAssignment | null> {
  const supabase = createClient();
  const { data: result, error } = await supabase
    .from("pkl_assignments")
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error("Gagal membuat penempatan PKL:", error.message);
    return null;
  }

  return result as PKLAssignment;
}

// ============================================================
// PERUSAHAAN / DU-DI (Companies)
// ============================================================

/** Mendapatkan semua perusahaan */
export async function getAllCompanies(): Promise<Company[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Gagal mengambil data perusahaan:", error.message);
    return [];
  }

  return (data as Company[]) ?? [];
}

/** Mendapatkan perusahaan yang aktif saja */
export async function getActiveCompanies(): Promise<Company[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Gagal mengambil perusahaan aktif:", error.message);
    return [];
  }

  return (data as Company[]) ?? [];
}

/** Mendapatkan detail perusahaan berdasarkan ID */
export async function getCompanyById(id: string): Promise<Company | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Gagal mengambil detail perusahaan:", error.message);
    return null;
  }

  return data as Company;
}

/** Membuat perusahaan baru */
export async function createCompany(
  data: CompanyInsert,
): Promise<Company | null> {
  const supabase = createClient();
  const { data: result, error } = await supabase
    .from("companies")
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error("Gagal membuat data perusahaan:", error.message);
    return null;
  }

  return result as Company;
}

/** Memperbarui data perusahaan */
export async function updateCompany(
  id: string,
  data: CompanyUpdate,
): Promise<Company | null> {
  const supabase = createClient();
  const { data: result, error } = await supabase
    .from("companies")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Gagal memperbarui data perusahaan:", error.message);
    return null;
  }

  return result as Company;
}

/** Menghapus (soft delete) perusahaan */
export async function deactivateCompany(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("companies")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    console.error("Gagal menonaktifkan perusahaan:", error.message);
    return false;
  }

  return true;
}

// ============================================================
// PENGUMUMAN (Announcements)
// ============================================================

/** Mendapatkan pengumuman berdasarkan peran pengguna */
export async function getAnnouncements(
  role: UserRole,
  departmentId?: string,
): Promise<Announcement[]> {
  const supabase = createClient();
  const now = new Date().toISOString();

  let query = supabase
    .from("announcements")
    .select(
      `
      *,
      author:profiles(full_name, avatar_url, role)
    `,
    )
    .contains("target_roles", [role])
    .lte("published_at", now)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false });

  if (departmentId) {
    query = query.or(
      `target_departments.eq.{},target_departments.cs.{${departmentId}}`,
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Gagal mengambil pengumuman:", error.message);
    return [];
  }

  return (data as Announcement[]) ?? [];
}

/** Mendapatkan detail pengumuman berdasarkan ID */
export async function getAnnouncementById(
  id: string,
): Promise<Announcement | null> {
  const supabase = createClient();

  // Tambahkan view count
  await supabase.rpc("increment_announcement_view", { announcement_id: id });

  const { data, error } = await supabase
    .from("announcements")
    .select(
      `
      *,
      author:profiles(full_name, avatar_url, role)
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Gagal mengambil detail pengumuman:", error.message);
    return null;
  }

  return data as Announcement;
}

/** Membuat pengumuman baru */
export async function createAnnouncement(
  data: Omit<Announcement, "id" | "created_at" | "view_count" | "author">,
): Promise<Announcement | null> {
  const supabase = createClient();
  const { data: result, error } = await supabase
    .from("announcements")
    .insert({ ...data, view_count: 0 })
    .select()
    .single();

  if (error) {
    console.error("Gagal membuat pengumuman:", error.message);
    return null;
  }

  return result as Announcement;
}

// ============================================================
// CHAT
// ============================================================

/** Mendapatkan semua ruang chat pengguna */
export async function getChatRooms(userId: string): Promise<ChatRoom[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("chat_room_members")
    .select(
      `
      room:chat_rooms(
        *,
        members:chat_room_members(
          *,
          profile:profiles(id, full_name, avatar_url)
        )
      )
    `,
    )
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });

  if (error) {
    console.error("Gagal mengambil ruang chat:", error.message);
    return [];
  }

  return (
    (data?.map((d) => d.room).filter(Boolean) as unknown as ChatRoom[]) ?? []
  );
}

/** Mendapatkan atau membuat ruang chat langsung (DM) antara dua pengguna */
export async function getOrCreateDirectRoom(
  userId: string,
  otherUserId: string,
): Promise<ChatRoom | null> {
  const supabase = createClient();

  // Cari ruang chat langsung yang sudah ada
  const { data: existingRooms } = await supabase
    .from("chat_rooms")
    .select(
      `
      *,
      members:chat_room_members(user_id)
    `,
    )
    .eq("type", "direct");

  const existingRoom = existingRooms?.find((room) => {
    const memberIds = room.members?.map((m: ChatRoomMember) => m.user_id) ?? [];
    return memberIds.includes(userId) && memberIds.includes(otherUserId);
  });

  if (existingRoom) return existingRoom as ChatRoom;

  // Buat ruang chat baru jika belum ada
  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", otherUserId)
    .single();

  const { data: newRoom, error } = await supabase
    .from("chat_rooms")
    .insert({
      name: otherProfile?.full_name ?? "Percakapan",
      type: "direct",
      created_by: userId,
    })
    .select()
    .single();

  if (error || !newRoom) {
    console.error("Gagal membuat ruang chat:", error?.message);
    return null;
  }

  // Tambahkan kedua pengguna sebagai anggota
  await supabase.from("chat_room_members").insert([
    { room_id: newRoom.id, user_id: userId, role: "admin" },
    { room_id: newRoom.id, user_id: otherUserId, role: "member" },
  ]);

  return newRoom as ChatRoom;
}

/** Mendapatkan pesan dalam ruang chat dengan pagination */
export async function getChatMessages(
  roomId: string,
  limit = 30,
  before?: string,
): Promise<ChatMessage[]> {
  const supabase = createClient();
  let query = supabase
    .from("chat_messages")
    .select(
      `
      *,
      sender:profiles(id, full_name, avatar_url),
      reply_to:chat_messages(id, content, type, sender:profiles(full_name))
    `,
    )
    .eq("room_id", roomId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Gagal mengambil pesan chat:", error.message);
    return [];
  }

  // Kembalikan dalam urutan ascending untuk tampilan chat
  return ((data as ChatMessage[]) ?? []).reverse();
}

/** Mengirim pesan baru */
export async function sendMessage(
  roomId: string,
  senderId: string,
  content: string,
  type: MessageType = "text",
  options?: { fileUrl?: string; replyToId?: string },
): Promise<ChatMessage | null> {
  const supabase = createClient();

  const messageData = {
    room_id: roomId,
    sender_id: senderId,
    content,
    type,
    file_url: options?.fileUrl ?? null,
    reply_to_id: options?.replyToId ?? null,
    is_deleted: false,
    read_by: [senderId],
  };

  const { data, error } = await supabase
    .from("chat_messages")
    .insert(messageData)
    .select(
      `
      *,
      sender:profiles(id, full_name, avatar_url)
    `,
    )
    .single();

  if (error) {
    console.error("Gagal mengirim pesan:", error.message);
    return null;
  }

  // Perbarui last_message di ruang chat
  await supabase
    .from("chat_rooms")
    .update({
      last_message: content,
      last_message_at: new Date().toISOString(),
    })
    .eq("id", roomId);

  return data as ChatMessage;
}

/** Menandai pesan sudah dibaca */
export async function markMessagesAsRead(
  roomId: string,
  userId: string,
): Promise<void> {
  const supabase = createClient();

  // Perbarui last_read_at untuk member
  await supabase
    .from("chat_room_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("room_id", roomId)
    .eq("user_id", userId);
}

/** Menghapus pesan (soft delete) */
export async function deleteMessage(
  messageId: string,
  userId: string,
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("chat_messages")
    .update({ is_deleted: true, content: "Pesan telah dihapus" })
    .eq("id", messageId)
    .eq("sender_id", userId);

  if (error) {
    console.error("Gagal menghapus pesan:", error.message);
    return false;
  }

  return true;
}

// ============================================================
// NOTIFIKASI (Notifications)
// ============================================================

/** Mendapatkan notifikasi pengguna */
export async function getNotifications(
  userId: string,
  limit = 20,
  onlyUnread = false,
): Promise<Notification[]> {
  const supabase = createClient();
  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (onlyUnread) {
    query = query.eq("is_read", false);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Gagal mengambil notifikasi:", error.message);
    return [];
  }

  return (data as Notification[]) ?? [];
}

/** Mendapatkan jumlah notifikasi yang belum dibaca */
export async function getUnreadNotificationCount(
  userId: string,
): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    console.error("Gagal menghitung notifikasi belum dibaca:", error.message);
    return 0;
  }

  return count ?? 0;
}

/** Menandai satu notifikasi sudah dibaca */
export async function markNotificationRead(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Gagal menandai notifikasi sudah dibaca:", error.message);
    return false;
  }

  return true;
}

/** Menandai semua notifikasi sudah dibaca */
export async function markAllNotificationsRead(
  userId: string,
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    console.error(
      "Gagal menandai semua notifikasi sudah dibaca:",
      error.message,
    );
    return false;
  }

  return true;
}

/** Membuat notifikasi baru (biasanya dipanggil dari server) */
export async function createNotification(
  data: Omit<Notification, "id" | "created_at" | "is_read" | "read_at">,
): Promise<Notification | null> {
  const supabase = createClient();
  const { data: result, error } = await supabase
    .from("notifications")
    .insert({ ...data, is_read: false, read_at: null })
    .select()
    .single();

  if (error) {
    console.error("Gagal membuat notifikasi:", error.message);
    return null;
  }

  return result as Notification;
}

// ============================================================
// DOKUMEN (Documents)
// ============================================================

/** Mendapatkan dokumen berdasarkan peran pengguna */
export async function getDocuments(
  role: UserRole,
  category?: string,
): Promise<Document[]> {
  const supabase = createClient();
  let query = supabase
    .from("documents")
    .select(
      `
      *,
      uploader:profiles(full_name, avatar_url)
    `,
    )
    .or(`is_public.eq.true,target_roles.cs.{${role}}`)
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Gagal mengambil dokumen:", error.message);
    return [];
  }

  return (data as Document[]) ?? [];
}

/** Menambahkan hitungan unduhan dokumen */
export async function incrementDocumentDownload(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.rpc("increment_document_download", { document_id: id });
}

/** Mengunggah metadata dokumen baru */
export async function createDocument(
  data: Omit<
    Document,
    "id" | "created_at" | "updated_at" | "download_count" | "uploader"
  >,
): Promise<Document | null> {
  const supabase = createClient();
  const { data: result, error } = await supabase
    .from("documents")
    .insert({ ...data, download_count: 0 })
    .select()
    .single();

  if (error) {
    console.error("Gagal membuat dokumen:", error.message);
    return null;
  }

  return result as Document;
}

/** Menghapus dokumen */
export async function deleteDocument(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("documents").delete().eq("id", id);

  if (error) {
    console.error("Gagal menghapus dokumen:", error.message);
    return false;
  }

  return true;
}

// ============================================================
// PENILAIAN (Assessments)
// ============================================================

/** Mendapatkan penilaian PKL siswa */
export async function getAssessment(
  pklAssignmentId: string,
): Promise<Assessment | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("assessments")
    .select(
      `
      *,
      pkl_assignment:pkl_assignments(
        *,
        student:students(*, profile:profiles(full_name)),
        company:companies(name)
      ),
      teacher:teachers(*, profile:profiles(full_name))
    `,
    )
    .eq("pkl_assignment_id", pklAssignmentId)
    .single();

  if (error) {
    console.error("Gagal mengambil penilaian:", error.message);
    return null;
  }

  return data as Assessment;
}

/** Membuat atau memperbarui penilaian */
export async function upsertAssessment(
  data: Omit<
    Assessment,
    "id" | "created_at" | "updated_at" | "pkl_assignment" | "teacher"
  >,
): Promise<Assessment | null> {
  const supabase = createClient();
  const { data: result, error } = await supabase
    .from("assessments")
    .upsert(
      { ...data, updated_at: new Date().toISOString() },
      { onConflict: "pkl_assignment_id" },
    )
    .select()
    .single();

  if (error) {
    console.error("Gagal menyimpan penilaian:", error.message);
    return null;
  }

  return result as Assessment;
}

/** Finalisasi penilaian PKL */
export async function finalizeAssessment(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("assessments")
    .update({
      is_finalized: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Gagal memfinalisasi penilaian:", error.message);
    return false;
  }

  return true;
}

// ============================================================
// JURUSAN (Departments)
// ============================================================

/** Mendapatkan semua jurusan */
export async function getDepartments(): Promise<Department[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Gagal mengambil data jurusan:", error.message);
    return [];
  }

  return (data as Department[]) ?? [];
}

/** Membuat jurusan baru */
export async function createDepartment(
  data: Omit<Department, "id" | "created_at">,
): Promise<Department | null> {
  const supabase = createClient();
  const { data: result, error } = await supabase
    .from("departments")
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error("Gagal membuat jurusan:", error.message);
    return null;
  }

  return result as Department;
}

// ============================================================
// KELAS (Classes)
// ============================================================

/** Mendapatkan semua kelas */
export async function getClasses(departmentId?: string): Promise<Class[]> {
  const supabase = createClient();
  let query = supabase
    .from("classes")
    .select("*, department:departments(name, code)")
    .order("name", { ascending: true });

  if (departmentId) {
    query = query.eq("department_id", departmentId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Gagal mengambil data kelas:", error.message);
    return [];
  }

  return (data as Class[]) ?? [];
}

/** Membuat kelas baru */
export async function createClass(
  data: Omit<Class, "id" | "created_at" | "department">,
): Promise<Class | null> {
  const supabase = createClient();
  const { data: result, error } = await supabase
    .from("classes")
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error("Gagal membuat kelas:", error.message);
    return null;
  }

  return result as Class;
}

// ============================================================
// TAHUN AJARAN (Academic Years)
// ============================================================

/** Mendapatkan tahun ajaran aktif */
export async function getActiveAcademicYear(): Promise<AcademicYear | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("academic_years")
    .select("*")
    .eq("is_active", true)
    .single();

  if (error) {
    console.error("Gagal mengambil tahun ajaran aktif:", error.message);
    return null;
  }

  return data as AcademicYear;
}

/** Mendapatkan semua tahun ajaran */
export async function getAllAcademicYears(): Promise<AcademicYear[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("academic_years")
    .select("*")
    .order("year", { ascending: false });

  if (error) {
    console.error("Gagal mengambil tahun ajaran:", error.message);
    return [];
  }

  return (data as AcademicYear[]) ?? [];
}

// ============================================================
// PERIODE PKL (PKL Periods)
// ============================================================

/** Mendapatkan periode PKL yang aktif */
export async function getActivePKLPeriod(): Promise<PKLPeriod | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pkl_periods")
    .select("*, academic_year:academic_years(*)")
    .eq("is_active", true)
    .single();

  if (error) {
    console.error("Gagal mengambil periode PKL aktif:", error.message);
    return null;
  }

  return data as PKLPeriod;
}

/** Mendapatkan semua periode PKL */
export async function getAllPKLPeriods(): Promise<PKLPeriod[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pkl_periods")
    .select("*, academic_year:academic_years(*)")
    .order("start_date", { ascending: false });

  if (error) {
    console.error("Gagal mengambil semua periode PKL:", error.message);
    return [];
  }

  return (data as PKLPeriod[]) ?? [];
}

// ============================================================
// STATISTIK ADMIN
// ============================================================

/** Mendapatkan statistik dashboard admin */
export async function getAdminDashboardStats(
  adminUserId: string,
): Promise<AdminDashboardStats> {
  const supabase = createClient();

  const [
    { count: totalStudents },
    { count: totalTeachers },
    { count: totalCompanies },
    { count: activePKL },
    { count: totalDepartments },
    { count: unreadNotifications },
  ] = await Promise.all([
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase.from("teachers").select("*", { count: "exact", head: true }),
    supabase
      .from("companies")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("pkl_assignments")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("departments")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", adminUserId)
      .eq("is_read", false),
  ]);

  return {
    total_students: totalStudents ?? 0,
    total_teachers: totalTeachers ?? 0,
    total_companies: totalCompanies ?? 0,
    active_pkl: activePKL ?? 0,
    total_departments: totalDepartments ?? 0,
    unread_notifications: unreadNotifications ?? 0,
  };
}

// ============================================================
// UPLOAD FILE (Storage)
// ============================================================

/** Mengunggah foto selfie presensi ke Supabase Storage */
export async function uploadSelfie(
  studentId: string,
  blob: Blob,
  fileName: string,
): Promise<string | null> {
  const supabase = createClient();
  const path = `selfies/${studentId}/${fileName}`;

  const { error } = await supabase.storage
    .from("attendance")
    .upload(path, blob, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (error) {
    console.error("Gagal mengunggah foto selfie:", error.message);
    return null;
  }

  const { data } = supabase.storage.from("attendance").getPublicUrl(path);
  return data.publicUrl;
}

/** Mengunggah foto jurnal ke Supabase Storage */
export async function uploadJournalPhoto(
  studentId: string,
  blob: Blob,
  fileName: string,
): Promise<string | null> {
  const supabase = createClient();
  const path = `journals/${studentId}/${fileName}`;

  const { error } = await supabase.storage.from("journals").upload(path, blob, {
    contentType: "image/jpeg",
    upsert: false,
  });

  if (error) {
    console.error("Gagal mengunggah foto jurnal:", error.message);
    return null;
  }

  const { data } = supabase.storage.from("journals").getPublicUrl(path);
  return data.publicUrl;
}

/** Mengunggah lampiran izin ke Supabase Storage */
export async function uploadAbsenceAttachment(
  studentId: string,
  file: File,
  fileName: string,
): Promise<string | null> {
  const supabase = createClient();
  const path = `absences/${studentId}/${fileName}`;

  const { error } = await supabase.storage
    .from("documents")
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("Gagal mengunggah lampiran izin:", error.message);
    return null;
  }

  const { data } = supabase.storage.from("documents").getPublicUrl(path);
  return data.publicUrl;
}

/** Mengunggah foto avatar profil ke Supabase Storage */
export async function uploadAvatar(
  userId: string,
  blob: Blob,
  fileName: string,
): Promise<string | null> {
  const supabase = createClient();
  const path = `avatars/${userId}/${fileName}`;

  const { error } = await supabase.storage.from("avatars").upload(path, blob, {
    contentType: "image/jpeg",
    upsert: true,
  });

  if (error) {
    console.error("Gagal mengunggah avatar:", error.message);
    return null;
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}
