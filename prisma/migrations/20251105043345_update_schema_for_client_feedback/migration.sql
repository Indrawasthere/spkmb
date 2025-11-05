/*
  Warnings:

  - Changed the type of `jenisDokumen` on the `dokumen` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "DokumenJenis" AS ENUM ('JAMINAN_UANG_MUKA', 'JAMINAN_PELAKSANAAN', 'JAMINAN_PEMELIHARAAN');

-- CreateEnum
CREATE TYPE "PengaduanStatus" AS ENUM ('BARU', 'DIPROSES', 'SELESAI', 'DITOLAK');

-- AlterTable
ALTER TABLE "dokumen" DROP COLUMN "jenisDokumen",
ADD COLUMN     "jenisDokumen" "DokumenJenis" NOT NULL;

-- AlterTable
ALTER TABLE "laporan_itwasda" ADD COLUMN     "filePath" TEXT;

-- AlterTable
ALTER TABLE "paket" ADD COLUMN     "dokumenKontrak" TEXT,
ADD COLUMN     "lamaProyek" INTEGER,
ADD COLUMN     "tanggalMulai" TIMESTAMP(3),
ADD COLUMN     "tanggalSelesai" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "proyek_pupr" ADD COLUMN     "deskripsiCatatan" TEXT,
ADD COLUMN     "dokumenCatatan" TEXT;

-- AlterTable
ALTER TABLE "temuan_bpkp" ADD COLUMN     "filePath" TEXT;

-- AlterTable
ALTER TABLE "vendor" ADD COLUMN     "deskripsi" TEXT,
ADD COLUMN     "deskripsiLaporan" TEXT,
ADD COLUMN     "deskripsiProgress" TEXT,
ADD COLUMN     "dokumenDED" TEXT,
ADD COLUMN     "dokumenLaporan" TEXT,
ADD COLUMN     "lamaKontrak" INTEGER,
ADD COLUMN     "namaProyek" TEXT,
ADD COLUMN     "noKontrak" TEXT,
ADD COLUMN     "paketId" TEXT,
ADD COLUMN     "uploadDokumen" TEXT,
ADD COLUMN     "uploadFoto" TEXT,
ADD COLUMN     "warningTemuan" BOOLEAN DEFAULT false;

-- CreateTable
CREATE TABLE "ppk_data" (
    "id" TEXT NOT NULL,
    "paketId" TEXT NOT NULL,
    "namaPPK" TEXT NOT NULL,
    "noSertifikasi" TEXT NOT NULL,
    "jumlahAnggaran" DOUBLE PRECISION NOT NULL,
    "lamaProyek" INTEGER NOT NULL,
    "realisasiTermin1" DOUBLE PRECISION,
    "realisasiTermin2" DOUBLE PRECISION,
    "realisasiTermin3" DOUBLE PRECISION,
    "realisasiTermin4" DOUBLE PRECISION,
    "PHO" TIMESTAMP(3),
    "FHO" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ppk_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengaduan" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "status" "PengaduanStatus" NOT NULL DEFAULT 'BARU',
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pelapor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pengaduan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "vendor" ADD CONSTRAINT "vendor_paketId_fkey" FOREIGN KEY ("paketId") REFERENCES "paket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppk_data" ADD CONSTRAINT "ppk_data_paketId_fkey" FOREIGN KEY ("paketId") REFERENCES "paket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
