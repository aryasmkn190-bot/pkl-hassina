import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();
const H = (s: string) => hashSync(s, 10);

async function main() {
  // DUDI
  const d1 = await prisma.dudi.upsert({ where: { id: "dudi-1" }, update: {}, create: { id: "dudi-1", name: "PT Hassina Digital Solution", alamat: "Jl. Pelabuhan II, Sukabumi", lat: -6.904, lng: 106.93, radiusM: 150, kuota: 20 } });
  const d2 = await prisma.dudi.upsert({ where: { id: "dudi-2" }, update: {}, create: { id: "dudi-2", name: "CV Solusi Jaringan Sukabumi", alamat: "Jl. Bhayangkara, Sukabumi", lat: -6.924, lng: 106.928, radiusM: 150, kuota: 15 } });
  const d3 = await prisma.dudi.upsert({ where: { id: "dudi-3" }, update: {}, create: { id: "dudi-3", name: "Studio Hassina Creative", alamat: "Sukabumi Kota", lat: -6.92, lng: 106.92, radiusM: 150, kuota: 12 } });

  // Users: pembimbing + admin
  const pwPemb = H("pembimbing123");
  const pwAdmin = H("admin123");
  const pemb1 = await prisma.user.upsert({
    where: { email: "siti@smkhassina.sch.id" }, update: { passwordHash: pwPemb },
    create: { email: "siti@smkhassina.sch.id", name: "Bu Siti Aminah", role: "PEMBIMBING", passwordHash: pwPemb, mustChangePassword: false },
  });
  const pemb2 = await prisma.user.upsert({
    where: { email: "budi@smkhassina.sch.id" }, update: { passwordHash: pwPemb },
    create: { email: "budi@smkhassina.sch.id", name: "Pak Budi Santoso", role: "PEMBIMBING", passwordHash: pwPemb, mustChangePassword: false },
  });
  const admin = await prisma.user.upsert({
    where: { email: "admin@smkhassina.sch.id" }, update: { passwordHash: pwAdmin },
    create: { email: "admin@smkhassina.sch.id", name: "Admin PKL", role: "ADMIN", passwordHash: pwAdmin, mustChangePassword: false },
  });

  // 10 siswa
  const pwSiswa = H("123456");
  const siswaData = [
    ["232410001", "Ahmad Fauzi", "XII TKJ 1", "TKJ"], ["232410002", "Dewi Lestari", "XII TKJ 1", "TKJ"],
    ["232410003", "Rizki Pratama", "XII TKJ 2", "TKJ"], ["232410004", "Siti Nurhaliza", "XII RPL 1", "RPL"],
    ["232410005", "Budi Hartono", "XII RPL 1", "RPL"], ["232410006", "Ani Wijaya", "XII MM 1", "MM"],
    ["232410007", "Arya Putra", "XII TKJ 1", "TKJ"], ["232410008", "Maya Sari", "XII TKJ 2", "TKJ"],
    ["232410009", "Fajar Nugroho", "XII RPL 2", "RPL"], ["232410010", "Linda Permata", "XII MM 1", "MM"],
  ] as const;

  for (let i = 0; i < siswaData.length; i++) {
    const [nis, name, kelas, jurusan] = siswaData[i];
    const dudiId = [d1.id, d2.id, d3.id][i % 3];
    const pembId = i % 2 === 0 ? pemb1.id : pemb2.id;
    const user = await prisma.user.upsert({
      where: { nis }, update: { passwordHash: pwSiswa, name },
      create: { nis, name, role: "SISWA", passwordHash: pwSiswa, mustChangePassword: true },
    });
    await prisma.siswa.upsert({
      where: { nis }, update: { dudiId, pembimbingId: pembId, kelas, jurusan, name },
      create: { nis, name, kelas, jurusan, dudiId, pembimbingId: pembId },
    });
    console.log(`  siswa ${nis} ${name} -> ${dudiId} pembimbing ${pembId.slice(0, 6)}`);
  }

  // Sample jurnal 2 for Arya (232410007) for E2E
  const arya = await prisma.siswa.findUnique({ where: { nis: "232410007" } });
  if (arya) {
    await prisma.jurnal.createMany({
      data: [
        { siswaId: arya.id, tanggal: new Date(), judul: "Konfigurasi VLAN di Mikrotik", kegiatan: "Melakukan konfigurasi VLAN ID 10 & 20, testing ping antar VLAN, dokumentasi topologi.", kendala: "-", jamMulai: "08:00", jamSelesai: "12:00", status: "DISETUJUI", feedback: "Bagus, lengkapi screenshot!" },
        { siswaId: arya.id, tanggal: new Date(Date.now() - 86400000), judul: "Instalasi AP Outdoor", kegiatan: "Pasang AP, crimping kabel, uji throughput.", kendala: "Kabel kurang panjang", jamMulai: "08:00", jamSelesai: "15:00", status: "TERKIRIM" },
      ],
      skipDuplicates: true,
    });
  }

  console.log("Seed done. Users:", await prisma.user.count(), "Siswa:", await prisma.siswa.count());
}

main().finally(() => prisma.$disconnect());
