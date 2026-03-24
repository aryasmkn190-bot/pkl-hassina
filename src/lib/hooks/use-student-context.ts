/**
 * Hook: useStudentContext
 * Mengambil data siswa + penempatan PKL aktif untuk user yang sedang login.
 * Di-cache di sessionStorage agar tidak fetch ulang setiap render.
 */
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

export interface StudentContext {
  studentId: string;          // UUID dari tabel students
  pklAssignmentId: string;    // UUID dari tabel pkl_assignments (aktif)
  companyId: string;
  companyName: string;
  companyCity: string;
  companyLogo: string | null;
  companyLatitude: number | null;
  companyLongitude: number | null;
  companyRadius: number;      // geofencing radius dalam meter
  teacherName: string;
  supervisorName: string | null;
  startDate: string;
  endDate: string;
  status: string;
}

interface UseStudentContextReturn {
  context: StudentContext | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useStudentContext(): UseStudentContextReturn {
  const { profile } = useAuthStore();
  const [context, setContext] = useState<StudentContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    if (!profile?.id || profile.role !== "siswa") {
      setLoading(false);
      return;
    }

    async function fetchContext() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        // 1. Ambil data siswa
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("id")
          .eq("profile_id", profile!.id)
          .maybeSingle();

        if (studentError || !studentData) {
          setError("Data siswa tidak ditemukan. Hubungi administrator.");
          setContext(null);
          return;
        }

        // 2. Ambil penempatan PKL aktif
        const { data: assignment, error: assignmentError } = await supabase
          .from("pkl_assignments")
          .select(`
            id,
            start_date,
            end_date,
            status,
            supervisor_name,
            company_id,
            companies (
              id,
              name,
              city,
              logo_url,
              latitude,
              longitude,
              radius_meter
            ),
            teachers (
              profiles (full_name)
            )
          `)
          .eq("student_id", studentData.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (assignmentError) {
          throw new Error(assignmentError.message);
        }

        if (!assignment) {
          setError("Belum ada penempatan PKL aktif.");
          setContext(null);
          return;
        }

        const company = (assignment.companies as unknown) as {
          id: string;
          name: string;
          city: string;
          logo_url: string | null;
          latitude: number | null;
          longitude: number | null;
          radius_meter: number;
        } | null;

        const teacher = (assignment.teachers as unknown) as {
          profiles: { full_name: string } | null;
        } | null;

        setContext({
          studentId: studentData.id,
          pklAssignmentId: assignment.id,
          companyId: company?.id ?? "",
          companyName: company?.name ?? "Perusahaan",
          companyCity: company?.city ?? "",
          companyLogo: company?.logo_url ?? null,
          companyLatitude: company?.latitude ?? null,
          companyLongitude: company?.longitude ?? null,
          companyRadius: company?.radius_meter ?? 100,
          teacherName: teacher?.profiles?.full_name ?? "",
          supervisorName: assignment.supervisor_name ?? null,
          startDate: assignment.start_date,
          endDate: assignment.end_date,
          status: assignment.status,
        });
      } catch (err) {
        console.error("useStudentContext error:", err);
        setError("Gagal memuat data PKL. Coba refresh halaman.");
        setContext(null);
      } finally {
        setLoading(false);
      }
    }

    fetchContext();
  }, [profile?.id, trigger]);

  return {
    context,
    loading,
    error,
    refetch: () => setTrigger((t) => t + 1),
  };
}
