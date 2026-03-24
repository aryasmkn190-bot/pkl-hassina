/**
 * HASSINA PKL — Export Utilities
 * Gunakan library `xlsx` (sudah ada di package.json)
 * Semua fungsi export ada di sini agar konsisten
 */

import * as XLSX from "xlsx";

/* ── Types ─────────────────────────────────────────────── */

export interface SheetColumn {
  key: string;
  header: string;
  width?: number;
}

export interface ExportSheet {
  name: string;
  columns: SheetColumn[];
  rows: Record<string, string | number | boolean | null | undefined>[];
}

/* ── Core Excel Export ──────────────────────────────────── */

/**
 * Ekspor satu atau beberapa sheet ke .xlsx dan auto-download
 */
export function exportToExcel(sheets: ExportSheet[], filename: string) {
  const wb = XLSX.utils.book_new();

  for (const sheet of sheets) {
    // Header row
    const headerRow = sheet.columns.map((c) => c.header);

    // Data rows
    const dataRows = sheet.rows.map((row) =>
      sheet.columns.map((col) => {
        const val = row[col.key];
        if (val === null || val === undefined) return "";
        return val;
      })
    );

    const wsData = [headerRow, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws["!cols"] = sheet.columns.map((c) => ({ wch: c.width ?? 20 }));

    // Style header row (bold + background) — basic approach via cell styles
    const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[cellAddress]) continue;
      ws[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "4F46E5" }, patternType: "solid" },
        alignment: { horizontal: "center" },
      };
    }

    XLSX.utils.book_append_sheet(wb, ws, sheet.name.substring(0, 31));
  }

  const safeFilename = filename.replace(/[^a-zA-Z0-9_\- ]/g, "_");
  XLSX.writeFile(wb, `${safeFilename}.xlsx`);
}

/* ── Specific Export Functions ──────────────────────────── */

/**
 * Export data presensi siswa
 */
export function exportAttendanceExcel(
  rows: {
    student_name: string;
    student_nis: string;
    student_class: string;
    company_name: string;
    total_days: number;
    hadir: number;
    izin: number;
    sakit: number;
    alfa: number;
    attendance_pct: number;
  }[],
  label: string
) {
  exportToExcel(
    [
      {
        name: "Rekap Presensi",
        columns: [
          { key: "student_name",  header: "Nama Siswa",       width: 25 },
          { key: "student_nis",   header: "NIS",              width: 15 },
          { key: "student_class", header: "Kelas",            width: 12 },
          { key: "company_name",  header: "Perusahaan",       width: 30 },
          { key: "total_days",    header: "Total Hari",       width: 12 },
          { key: "hadir",         header: "Hadir",            width: 10 },
          { key: "izin",          header: "Izin",             width: 10 },
          { key: "sakit",         header: "Sakit",            width: 10 },
          { key: "alfa",          header: "Alfa",             width: 10 },
          { key: "attendance_pct",header: "% Kehadiran",      width: 14 },
        ],
        rows,
      },
    ],
    `Rekap_Presensi_${label}`
  );
}

/**
 * Export data penilaian siswa
 */
export function exportGradesExcel(
  rows: {
    student_name: string;
    student_nis: string;
    company_name: string;
    attendance_score: number | null;
    journal_score: number | null;
    performance_score: number | null;
    attitude_score: number | null;
    final_score: number | null;
    grade: string | null;
    notes: string;
  }[],
  label: string
) {
  exportToExcel(
    [
      {
        name: "Penilaian PKL",
        columns: [
          { key: "student_name",      header: "Nama Siswa",   width: 25 },
          { key: "student_nis",       header: "NIS",          width: 15 },
          { key: "company_name",      header: "Perusahaan",   width: 28 },
          { key: "attendance_score",  header: "Kehadiran",    width: 12 },
          { key: "journal_score",     header: "Jurnal",       width: 12 },
          { key: "performance_score", header: "Kinerja",      width: 12 },
          { key: "attitude_score",    header: "Sikap",        width: 12 },
          { key: "final_score",       header: "Nilai Akhir",  width: 13 },
          { key: "grade",             header: "Predikat",     width: 11 },
          { key: "notes",             header: "Catatan",      width: 35 },
        ],
        rows,
      },
    ],
    `Penilaian_PKL_${label}`
  );
}

/**
 * Export rekap penugasan (admin)
 */
export function exportAssignmentsExcel(
  rows: {
    student_name: string;
    student_nis: string;
    student_class: string;
    company_name: string;
    company_city: string;
    teacher_name: string;
    start_date: string;
    end_date: string;
    status: string;
  }[],
  label: string
) {
  exportToExcel(
    [
      {
        name: "Penugasan PKL",
        columns: [
          { key: "student_name",  header: "Nama Siswa",    width: 25 },
          { key: "student_nis",   header: "NIS",           width: 15 },
          { key: "student_class", header: "Kelas",         width: 12 },
          { key: "company_name",  header: "Perusahaan",    width: 28 },
          { key: "company_city",  header: "Kota",          width: 15 },
          { key: "teacher_name",  header: "Guru Pembimbing",width: 25 },
          { key: "start_date",    header: "Mulai",         width: 14 },
          { key: "end_date",      header: "Selesai",       width: 14 },
          { key: "status",        header: "Status",        width: 14 },
        ],
        rows,
      },
    ],
    `Penugasan_PKL_${label}`
  );
}

/**
 * Export rekap jurnal siswa
 */
export function exportJournalsExcel(
  rows: {
    date: string;
    student_name: string;
    student_nis: string;
    title: string;
    activities: string;
    status: string;
  }[],
  label: string
) {
  exportToExcel(
    [
      {
        name: "Rekap Jurnal",
        columns: [
          { key: "date",          header: "Tanggal",       width: 14 },
          { key: "student_name",  header: "Nama Siswa",    width: 25 },
          { key: "student_nis",   header: "NIS",           width: 15 },
          { key: "title",         header: "Judul",         width: 28 },
          { key: "activities",    header: "Kegiatan",      width: 50 },
          { key: "status",        header: "Status",        width: 14 },
        ],
        rows,
      },
    ],
    `Rekap_Jurnal_${label}`
  );
}

/* ── Date helper ─────────────────────────────────────────── */

export function getExportDateLabel(): string {
  return new Date().toLocaleDateString("id-ID", {
    year: "numeric", month: "2-digit", day: "2-digit",
  }).replace(/\//g, "-");
}
