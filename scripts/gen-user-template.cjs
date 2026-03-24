const XLSX = require('xlsx');

const wb = XLSX.utils.book_new();

const headers = [
  ['email', 'password', 'full_name', 'role', 'phone'],
  ['admin@sekolah.id', 'Admin123!', 'Nama Admin', 'super_admin', '08123456789'],
  ['guru1@sekolah.id', 'Pass123!', 'Budi Santoso', 'guru_pembimbing', '08111222333'],
  ['kajur1@sekolah.id', 'Pass123!', 'Dewi Lestari', 'ketua_jurusan', '08222333444'],
  ['siswa1@sekolah.id', 'Pass123!', 'Andi Pratama', 'siswa', '08333444555'],
  ['siswa2@sekolah.id', 'Pass123!', 'Siti Nurhaliza', 'siswa', '08444555666'],
];
const ws = XLSX.utils.aoa_to_sheet(headers);
ws['!cols'] = [
  { wch: 25 },
  { wch: 15 },
  { wch: 25 },
  { wch: 18 },
  { wch: 15 },
];
XLSX.utils.book_append_sheet(wb, ws, 'Data Pengguna');

const guide = [
  ['PANDUAN PENGISIAN TEMPLATE IMPORT USER'],
  [''],
  ['Kolom', 'Keterangan', 'Wajib', 'Contoh'],
  ['email', 'Email pengguna (digunakan untuk login)', 'YA', 'guru@sekolah.id'],
  ['password', 'Password minimal 6 karakter', 'YA', 'Pass123!'],
  ['full_name', 'Nama lengkap pengguna', 'YA', 'Budi Santoso'],
  ['role', 'Pilih: siswa / guru_pembimbing / ketua_jurusan / super_admin', 'YA', 'siswa'],
  ['phone', 'Nomor HP (opsional)', 'TIDAK', '08123456789'],
  [''],
  ['CATATAN PENTING:'],
  ['1. Hapus baris contoh (baris 2-6) sebelum mengisi data asli'],
  ['2. Baris pertama (header) JANGAN dihapus atau diubah'],
  ['3. Role yang valid: siswa, guru_pembimbing, ketua_jurusan, super_admin'],
  ['4. Email harus unik (tidak boleh sama)'],
  ['5. Password minimal 6 karakter'],
];
const ws2 = XLSX.utils.aoa_to_sheet(guide);
ws2['!cols'] = [{ wch: 15 }, { wch: 55 }, { wch: 8 }, { wch: 20 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Panduan');

XLSX.writeFile(wb, './public/template-import-user.xlsx');
console.log('✅ Template created');
