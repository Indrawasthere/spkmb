/*
  Warnings:

  - You are about to drop the column `tingkatKeparahan` on the `laporan_itwasda` table. All the data in the column will be lost.
  - You are about to drop the column `tingkatKeparahan` on the `temuan_bpkp` table. All the data in the column will be lost.
  - You are about to drop the column `paketId` on the `vendor` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nomor_tiket]` on the table `pengaduan` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `jenisDokumen` on the `dokumen` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `tingkatKualitasTemuan` to the `laporan_itwasda` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `metodePengadaan` on the `paket` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `tingkatKualitasTemuan` to the `temuan_bpkp` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MetodePengadaan" AS ENUM ('E_PURCHASING', 'SWAKELOLA', 'TENDER', 'PENUNJUKAN_LANGSUNG', 'SELEKSI');

-- CreateEnum
CREATE TYPE "KualitasTemuanLevel" AS ENUM ('RENDAH', 'SEDANG', 'TINGGI', 'KRITIS');

-- DropForeignKey
ALTER TABLE "vendor" DROP CONSTRAINT "vendor_paketId_fkey";

-- AlterTable
ALTER TABLE "dokumen" ALTER COLUMN "mimeType" DROP NOT NULL,
DROP COLUMN "jenisDokumen",
ADD COLUMN     "jenisDokumen" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "laporan_itwasda" DROP COLUMN "tingkatKeparahan",
ADD COLUMN     "tingkatKualitasTemuan" "KualitasTemuanLevel" NOT NULL;

-- AlterTable
ALTER TABLE "paket" ADD COLUMN     "kodeRUP" TEXT,
DROP COLUMN "metodePengadaan",
ADD COLUMN     "metodePengadaan" "MetodePengadaan" NOT NULL;

-- AlterTable
ALTER TABLE "pengaduan" ADD COLUMN     "email" TEXT,
ADD COLUMN     "kategori" TEXT,
ADD COLUMN     "nomor_tiket" TEXT,
ADD COLUMN     "telepon" TEXT;

-- AlterTable
ALTER TABLE "proyek_pupr" ADD COLUMN     "tingkatKualitasTemuan" "KualitasTemuanLevel";

-- AlterTable
ALTER TABLE "temuan_bpkp" DROP COLUMN "tingkatKeparahan",
ADD COLUMN     "tingkatKualitasTemuan" "KualitasTemuanLevel" NOT NULL;

-- AlterTable
ALTER TABLE "vendor" DROP COLUMN "paketId",
ADD COLUMN     "jumlahTemuan" INTEGER NOT NULL DEFAULT 0;

-- DropEnum
DROP TYPE "KeparahanLevel";

-- CreateTable
CREATE TABLE "vendor_paket" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "paketId" TEXT NOT NULL,
    "role" "VendorType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "vendor_paket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temuan_vendor" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "paketId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "nomorTemuan" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "tingkat" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'BARU',
    "tanggapanVendor" TEXT,
    "dokumenPerbaikan" JSONB,
    "tanggalTemuan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggalDitanggapi" TIMESTAMP(3),
    "tanggalSelesai" TIMESTAMP(3),

    CONSTRAINT "temuan_vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "vendorId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vendor_paket_vendorId_paketId_role_key" ON "vendor_paket"("vendorId", "paketId", "role");

-- CreateIndex
CREATE INDEX "temuan_vendor_vendorId_status_idx" ON "temuan_vendor"("vendorId", "status");

-- CreateIndex
CREATE INDEX "temuan_vendor_paketId_idx" ON "temuan_vendor"("paketId");

-- CreateIndex
CREATE INDEX "temuan_vendor_sourceType_sourceId_idx" ON "temuan_vendor"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_vendorId_isRead_idx" ON "notifications"("vendorId", "isRead");

-- CreateIndex
CREATE UNIQUE INDEX "pengaduan_nomor_tiket_key" ON "pengaduan"("nomor_tiket");

-- AddForeignKey
ALTER TABLE "vendor_paket" ADD CONSTRAINT "vendor_paket_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_paket" ADD CONSTRAINT "vendor_paket_paketId_fkey" FOREIGN KEY ("paketId") REFERENCES "paket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temuan_vendor" ADD CONSTRAINT "temuan_vendor_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temuan_vendor" ADD CONSTRAINT "temuan_vendor_paketId_fkey" FOREIGN KEY ("paketId") REFERENCES "paket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
