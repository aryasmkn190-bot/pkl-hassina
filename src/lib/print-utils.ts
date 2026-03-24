/**
 * HASSINA PKL — PDF Export via Browser Print
 * Tanpa library eksternal — pakai window.print() dengan CSS @media print
 * Cocok untuk laporan, rekap presensi, dan penilaian
 */

/* ── Types ─────────────────────────────────────────────── */

export interface PrintRow {
  [key: string]: string | number | null | undefined;
}

export interface PrintColumn {
  key: string;
  header: string;
}

export interface PrintTableOptions {
  title: string;
  subtitle?: string;
  columns: PrintColumn[];
  rows: PrintRow[];
  schoolName?: string;
  printedBy?: string;
  date?: string;
}

/* ── PDF via Print ──────────────────────────────────────── */

export function printTable(options: PrintTableOptions) {
  const {
    title,
    subtitle,
    columns,
    rows,
    schoolName = "SMK HASSINA",
    printedBy = "Sistem PKL",
    date = new Date().toLocaleDateString("id-ID", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    }),
  } = options;

  const tableRows = rows
    .map(
      (row, i) => `
      <tr class="${i % 2 === 0 ? "even" : "odd"}">
        <td class="no">${i + 1}</td>
        ${columns.map((col) => `<td>${row[col.key] ?? "-"}</td>`).join("")}
      </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <title>${title} — ${schoolName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #1e293b; }

    .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px; }
    .school-name { font-size: 16pt; font-weight: 800; color: #1e3a8a; letter-spacing: 0.5px; }
    .doc-title { font-size: 13pt; font-weight: 700; color: #2563eb; margin-top: 4px; }
    .subtitle { font-size: 10pt; color: #64748b; margin-top: 2px; }

    .meta { display: flex; justify-content: space-between; margin-bottom: 14px; font-size: 9.5pt; color: #475569; }
    .meta span { display: flex; gap: 4px; }

    table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
    th { background: #1e40af; color: white; font-weight: 700; padding: 7px 8px; text-align: left; }
    th.no { width: 32px; text-align: center; }
    td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    td.no { text-align: center; color: #94a3b8; }
    tr.even td { background: #f8fafc; }
    tr:hover td { background: #eff6ff; }

    .footer { margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between; font-size: 9pt; color: #94a3b8; }
    .sign-area { text-align: center; }
    .sign-box { margin-top: 48px; border-top: 1px solid #1e293b; display: inline-block; min-width: 160px; font-size: 9.5pt; color: #1e293b; padding-top: 4px; }

    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 8.5pt; font-weight: 600; }
    .badge-active  { background: #dcfce7; color: #15803d; }
    .badge-done    { background: #dbeafe; color: #1d4ed8; }
    .badge-pending { background: #fef9c3; color: #a16207; }
    .badge-cancel  { background: #fee2e2; color: #dc2626; }

    @media print {
      @page { margin: 15mm 12mm; size: A4 portrait; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="school-name">${schoolName}</div>
    <div class="doc-title">${title}</div>
    ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ""}
  </div>

  <div class="meta">
    <span>📅 Tanggal cetak: <strong>${date}</strong></span>
    <span>👤 Dicetak oleh: <strong>${printedBy}</strong></span>
  </div>

  <table>
    <thead>
      <tr>
        <th class="no">No</th>
        ${columns.map((col) => `<th>${col.header}</th>`).join("")}
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <div class="footer">
    <div>
      <div>Total data: <strong>${rows.length}</strong> baris</div>
      <div style="margin-top:4px; font-size: 8pt;">© ${new Date().getFullYear()} PKL SMK HASSINA — Dicetak oleh sistem</div>
    </div>
    <div class="sign-area">
      <div style="font-size: 9pt; margin-bottom: 4px;">Mengetahui,</div>
      <div class="sign-box">Ketua Jurusan / Admin PKL</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
    };
  <\/script>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "width=800,height=600");
  if (!printWindow) {
    alert("Popup diblokir! Izinkan popup untuk halaman ini.");
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
}

/* ── Specific Print Functions ───────────────────────────── */

export function printGrades(
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
  }[],
  printedBy?: string
) {
  printTable({
    title: "Rekap Penilaian PKL",
    subtitle: "Data nilai akhir seluruh siswa PKL",
    printedBy,
    columns: [
      { key: "student_name",      header: "Nama Siswa" },
      { key: "student_nis",       header: "NIS" },
      { key: "company_name",      header: "Perusahaan" },
      { key: "attendance_score",  header: "Kehadiran" },
      { key: "journal_score",     header: "Jurnal" },
      { key: "performance_score", header: "Kinerja" },
      { key: "attitude_score",    header: "Sikap" },
      { key: "final_score",       header: "Nilai" },
      { key: "grade",             header: "Predikat" },
    ],
    rows,
  });
}

export function printAssignments(
  rows: {
    student_name: string;
    student_nis: string;
    student_class: string;
    company_name: string;
    teacher_name: string;
    start_date: string;
    end_date: string;
    status: string;
  }[],
  printedBy?: string
) {
  printTable({
    title: "Rekap Penugasan PKL",
    subtitle: "Data seluruh penugasan siswa PKL",
    printedBy,
    columns: [
      { key: "student_name",  header: "Nama Siswa" },
      { key: "student_nis",   header: "NIS" },
      { key: "student_class", header: "Kelas" },
      { key: "company_name",  header: "Perusahaan" },
      { key: "teacher_name",  header: "Guru Pembimbing" },
      { key: "start_date",    header: "Mulai" },
      { key: "end_date",      header: "Selesai" },
      { key: "status",        header: "Status" },
    ],
    rows,
  });
}
