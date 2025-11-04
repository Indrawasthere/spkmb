-- CreateEnum
CREATE TYPE "ProyekStatus" AS ENUM ('PERENCANAAN', 'PELAKSANAAN', 'SELESAI', 'DITUNDA');

-- AlterTable
ALTER TABLE "dokumen" ADD COLUMN     "proyekPUPRId" TEXT,
ADD COLUMN     "temuanBPKPId" TEXT;

-- CreateTable
CREATE TABLE "temuan_bpkp" (
    "id" TEXT NOT NULL,
    "nomorTemuan" TEXT NOT NULL,
    "paketId" TEXT,
    "jenisTemuan" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "tingkatKeparahan" "KeparahanLevel" NOT NULL,
    "status" "LaporanStatus" NOT NULL DEFAULT 'BARU',
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auditor" TEXT NOT NULL,
    "pic" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "temuan_bpkp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proyek_pupr" (
    "id" TEXT NOT NULL,
    "namaProyek" TEXT NOT NULL,
    "lokasi" TEXT NOT NULL,
    "anggaran" DOUBLE PRECISION NOT NULL,
    "kontraktor" TEXT,
    "tanggalMulai" TIMESTAMP(3) NOT NULL,
    "tanggalSelesai" TIMESTAMP(3) NOT NULL,
    "status" "ProyekStatus" NOT NULL DEFAULT 'PERENCANAAN',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "proyek_pupr_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "temuan_bpkp_nomorTemuan_key" ON "temuan_bpkp"("nomorTemuan");

-- AddForeignKey
ALTER TABLE "dokumen" ADD CONSTRAINT "dokumen_temuanBPKPId_fkey" FOREIGN KEY ("temuanBPKPId") REFERENCES "temuan_bpkp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dokumen" ADD CONSTRAINT "dokumen_proyekPUPRId_fkey" FOREIGN KEY ("proyekPUPRId") REFERENCES "proyek_pupr"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temuan_bpkp" ADD CONSTRAINT "temuan_bpkp_paketId_fkey" FOREIGN KEY ("paketId") REFERENCES "paket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyek_pupr" ADD CONSTRAINT "proyek_pupr_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
