-- AlterTable
ALTER TABLE "Dudi" ADD COLUMN     "deskripsi" TEXT,
ADD COLUMN     "kategori" TEXT;

-- CreateTable
CREATE TABLE "JurnalRekomendasi" (
    "id" TEXT NOT NULL,
    "dudiId" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "items" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JurnalRekomendasi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JurnalRekomendasi_dudiId_tanggal_key" ON "JurnalRekomendasi"("dudiId", "tanggal");

-- AddForeignKey
ALTER TABLE "JurnalRekomendasi" ADD CONSTRAINT "JurnalRekomendasi_dudiId_fkey" FOREIGN KEY ("dudiId") REFERENCES "Dudi"("id") ON DELETE CASCADE ON UPDATE CASCADE;
