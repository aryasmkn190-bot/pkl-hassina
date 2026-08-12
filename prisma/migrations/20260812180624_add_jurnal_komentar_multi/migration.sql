-- CreateEnum
CREATE TYPE "JurnalKomentarRole" AS ENUM ('SISWA', 'PEMBIMBING', 'ADMIN', 'SUPERADMIN');

-- AlterTable
ALTER TABLE "Jurnal" ALTER COLUMN "status" SET DEFAULT 'DISETUJUI';

-- CreateTable
CREATE TABLE "JurnalKomentar" (
    "id" TEXT NOT NULL,
    "jurnalId" TEXT NOT NULL,
    "siswaId" TEXT,
    "authorId" TEXT NOT NULL,
    "authorRole" "JurnalKomentarRole" NOT NULL,
    "authorName" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JurnalKomentar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JurnalKomentar_jurnalId_createdAt_idx" ON "JurnalKomentar"("jurnalId", "createdAt");

-- AddForeignKey
ALTER TABLE "JurnalKomentar" ADD CONSTRAINT "JurnalKomentar_jurnalId_fkey" FOREIGN KEY ("jurnalId") REFERENCES "Jurnal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JurnalKomentar" ADD CONSTRAINT "JurnalKomentar_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "JurnalKomentar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
