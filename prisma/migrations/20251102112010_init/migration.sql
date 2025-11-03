-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER', 'AUDITOR', 'MANAGER');

-- CreateEnum
CREATE TYPE "PaketStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ON_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "KeparahanLevel" AS ENUM ('RENDAH', 'SEDANG', 'TINGGI', 'KRITIS');

-- CreateEnum
CREATE TYPE "LaporanStatus" AS ENUM ('BARU', 'PROSES', 'SELESAI', 'DITUNDA');

-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('KONSULTAN_PERENCANAAN', 'KONSULTAN_PENGAWAS', 'KONSTRUKSI');

-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('AKTIF', 'NON_AKTIF', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PPKStatus" AS ENUM ('AKTIF', 'NON_AKTIF', 'CUTI');

-- CreateEnum
CREATE TYPE "MonitoringStatus" AS ENUM ('ON_TRACK', 'DELAYED', 'CRITICAL', 'COMPLETED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paket" (
    "id" TEXT NOT NULL,
    "kodePaket" TEXT NOT NULL,
    "namaPaket" TEXT NOT NULL,
    "jenisPaket" TEXT NOT NULL,
    "nilaiPaket" DOUBLE PRECISION NOT NULL,
    "metodePengadaan" TEXT NOT NULL,
    "status" "PaketStatus" NOT NULL DEFAULT 'DRAFT',
    "tanggalBuat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggalUpdate" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "paket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dokumen" (
    "id" TEXT NOT NULL,
    "paketId" TEXT,
    "namaDokumen" TEXT NOT NULL,
    "jenisDokumen" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "laporanItwasdaId" TEXT,
    "vendorId" TEXT,
    "ppkId" TEXT,
    "monitoringId" TEXT,
    "laporanAnalisisId" TEXT,

    CONSTRAINT "dokumen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laporan_itwasda" (
    "id" TEXT NOT NULL,
    "nomorLaporan" TEXT NOT NULL,
    "paketId" TEXT,
    "jenisLaporan" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "tingkatKeparahan" "KeparahanLevel" NOT NULL,
    "status" "LaporanStatus" NOT NULL DEFAULT 'BARU',
    "tanggal" TIMESTAMP(3) NOT NULL,
    "auditor" TEXT NOT NULL,
    "pic" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laporan_itwasda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor" (
    "id" TEXT NOT NULL,
    "namaVendor" TEXT NOT NULL,
    "jenisVendor" "VendorType" NOT NULL,
    "nomorIzin" TEXT NOT NULL,
    "spesialisasi" TEXT,
    "jumlahProyek" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION DEFAULT 0,
    "status" "VendorStatus" NOT NULL DEFAULT 'AKTIF',
    "kontak" TEXT,
    "alamat" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppk" (
    "id" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "nip" TEXT NOT NULL,
    "jabatan" TEXT NOT NULL,
    "unitKerja" TEXT NOT NULL,
    "kompetensi" JSONB NOT NULL,
    "sertifikasi" JSONB NOT NULL,
    "pengalaman" INTEGER NOT NULL DEFAULT 0,
    "status" "PPKStatus" NOT NULL DEFAULT 'AKTIF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ppk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring" (
    "id" TEXT NOT NULL,
    "paketId" TEXT,
    "jenisMonitoring" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "status" "MonitoringStatus" NOT NULL DEFAULT 'ON_TRACK',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "issues" TEXT,
    "rekomendasi" TEXT,
    "tanggalMonitoring" TIMESTAMP(3) NOT NULL,
    "monitoredBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monitoring_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laporan_analisis" (
    "id" TEXT NOT NULL,
    "jenisLaporan" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "kesimpulan" TEXT NOT NULL,
    "rekomendasi" TEXT,
    "generatedBy" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "laporan_analisis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "paket_kodePaket_key" ON "paket"("kodePaket");

-- CreateIndex
CREATE UNIQUE INDEX "laporan_itwasda_nomorLaporan_key" ON "laporan_itwasda"("nomorLaporan");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_nomorIzin_key" ON "vendor"("nomorIzin");

-- CreateIndex
CREATE UNIQUE INDEX "ppk_nip_key" ON "ppk"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dokumen" ADD CONSTRAINT "dokumen_paketId_fkey" FOREIGN KEY ("paketId") REFERENCES "paket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dokumen" ADD CONSTRAINT "dokumen_laporanItwasdaId_fkey" FOREIGN KEY ("laporanItwasdaId") REFERENCES "laporan_itwasda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dokumen" ADD CONSTRAINT "dokumen_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dokumen" ADD CONSTRAINT "dokumen_ppkId_fkey" FOREIGN KEY ("ppkId") REFERENCES "ppk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dokumen" ADD CONSTRAINT "dokumen_monitoringId_fkey" FOREIGN KEY ("monitoringId") REFERENCES "monitoring"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dokumen" ADD CONSTRAINT "dokumen_laporanAnalisisId_fkey" FOREIGN KEY ("laporanAnalisisId") REFERENCES "laporan_analisis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laporan_itwasda" ADD CONSTRAINT "laporan_itwasda_paketId_fkey" FOREIGN KEY ("paketId") REFERENCES "paket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
