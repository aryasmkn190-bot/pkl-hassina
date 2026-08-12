-- CreateEnum
CREATE TYPE "AjuanType" AS ENUM ('TERLEWAT', 'IZIN', 'SAKIT');

-- CreateEnum
CREATE TYPE "AjuanStatus" AS ENUM ('MENUNGGU', 'DISETUJUI', 'DITOLAK');

-- CreateTable
CREATE TABLE "AbsensiAjuan" (
    "id" TEXT NOT NULL,
    "siswaId" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "type" "AjuanType" NOT NULL,
    "alasan" TEXT NOT NULL,
    "buktiFoto" TEXT,
    "status" "AjuanStatus" NOT NULL DEFAULT 'MENUNGGU',
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbsensiAjuan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AbsensiAjuan_siswaId_tanggal_type_key" ON "AbsensiAjuan"("siswaId", "tanggal", "type");

-- AddForeignKey
ALTER TABLE "AbsensiAjuan" ADD CONSTRAINT "AbsensiAjuan_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "Siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
