-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SISWA', 'PEMBIMBING', 'ADMIN');

-- CreateEnum
CREATE TYPE "AbsensiStatus" AS ENUM ('HADIR', 'IZIN', 'SAKIT', 'ALPHA');

-- CreateEnum
CREATE TYPE "JurnalStatus" AS ENUM ('DRAFT', 'TERKIRIM', 'DISETUJUI', 'REVISI');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "email" TEXT,
    "nis" TEXT,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Siswa" (
    "id" TEXT NOT NULL,
    "nis" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kelas" TEXT NOT NULL,
    "jurusan" TEXT NOT NULL,
    "foto" TEXT,
    "dudiId" TEXT NOT NULL,
    "pembimbingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dudi" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "radiusM" INTEGER NOT NULL DEFAULT 150,
    "kuota" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dudi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Absensi" (
    "id" TEXT NOT NULL,
    "siswaId" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "jamMasuk" TEXT,
    "jamPulang" TEXT,
    "status" "AbsensiStatus" NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "jarakM" INTEGER,
    "fotoMasuk" TEXT,
    "fotoPulang" TEXT,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Absensi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jurnal" (
    "id" TEXT NOT NULL,
    "siswaId" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "judul" TEXT NOT NULL,
    "kegiatan" TEXT NOT NULL,
    "kendala" TEXT,
    "jamMulai" TEXT,
    "jamSelesai" TEXT,
    "foto" TEXT[],
    "status" "JurnalStatus" NOT NULL DEFAULT 'TERKIRIM',
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Jurnal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_nis_key" ON "User"("nis");

-- CreateIndex
CREATE UNIQUE INDEX "Siswa_nis_key" ON "Siswa"("nis");

-- CreateIndex
CREATE UNIQUE INDEX "Absensi_siswaId_tanggal_key" ON "Absensi"("siswaId", "tanggal");

-- AddForeignKey
ALTER TABLE "Siswa" ADD CONSTRAINT "Siswa_dudiId_fkey" FOREIGN KEY ("dudiId") REFERENCES "Dudi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Siswa" ADD CONSTRAINT "Siswa_pembimbingId_fkey" FOREIGN KEY ("pembimbingId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absensi" ADD CONSTRAINT "Absensi_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "Siswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jurnal" ADD CONSTRAINT "Jurnal_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "Siswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
