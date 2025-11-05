import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  // Ensure Prisma uses DATABASE_URL from .env and open a DB connection
  await prisma.$connect();

  // Create sample users
  // Hash admin password so we can set a new credential: admin@sip.com / sip345
  const adminHashedPassword = await bcrypt.hash('sip345', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sip.com' },
    update: {},
    create: {
      email: 'admin@sip.com',
      firstName: 'Admin',
      lastName: 'SIP-KPBJ',
      password: adminHashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: 'ppk@sipkp.go.id' },
    update: {},
    create: {
      email: 'ppk@sipkp.go.id',
      firstName: 'Ahmad',
      lastName: 'Sutrisno',
      password: '$2b$10$8u4/KX7zdNcz9MUKwFsOIeFPKL8QG.xrbSOzCaT/XP0krydm5vWDe', // password
      role: 'MANAGER',
      isActive: true,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'auditor@sipkp.go.id' },
    update: {},
    create: {
      email: 'auditor@sipkp.go.id',
      firstName: 'Siti',
      lastName: 'Nurhaliza',
      password: '$2b$10$8u4/KX7zdNcz9MUKwFsOIeFPKL8QG.xrbSOzCaT/XP0krydm5vWDe', // password
      role: 'AUDITOR',
      isActive: true,
    },
  });

  // Additional demo users with known credentials for testing
  const managerPlain = 'manager123';
  const auditorPlain = 'auditor123';
  const userPlain = 'user123';

  const managerHashed = await bcrypt.hash(managerPlain, 10);
  const auditorHashed = await bcrypt.hash(auditorPlain, 10);
  const userHashed = await bcrypt.hash(userPlain, 10);

  const demoManager = await prisma.user.upsert({
    where: { email: 'manager.demo@sip.com' },
    update: {},
    create: {
      email: 'manager.demo@sip.com',
      firstName: 'Manager',
      lastName: 'Demo',
      password: managerHashed,
      role: 'MANAGER',
      isActive: true,
    },
  });

  const demoAuditor = await prisma.user.upsert({
    where: { email: 'auditor.demo@sip.com' },
    update: {},
    create: {
      email: 'auditor.demo@sip.com',
      firstName: 'Auditor',
      lastName: 'Demo',
      password: auditorHashed,
      role: 'AUDITOR',
      isActive: true,
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: 'user.demo@sip.com' },
    update: {},
    create: {
      email: 'user.demo@sip.com',
      firstName: 'User',
      lastName: 'Demo',
      password: userHashed,
      role: 'USER',
      isActive: true,
    },
  });

  // Create sample PPK
  let ppk1 = await prisma.pPK.findUnique({ where: { nip: '198501012010011001' } });
  if (!ppk1) {
    ppk1 = await prisma.pPK.create({
      data: {
        namaLengkap: 'Ahmad Sutrisno',
        nip: '198501012010011001',
        jabatan: 'Kepala Seksi Pengadaan Barang/Jasa',
        unitKerja: 'Dinas PUPR Kabupaten XYZ',
        kompetensi: { pengadaan: 'Tinggi', pengalaman: 8 },
        sertifikasi: { nomor: 'Sertifikat PPK No. 001/2024', masaBerlaku: '2025-12-31' },
        pengalaman: 8,
        status: 'AKTIF',
      },
    });
  }

  let ppk2 = await prisma.pPK.findUnique({ where: { nip: '198703152010011002' } });
  if (!ppk2) {
    ppk2 = await prisma.pPK.create({
      data: {
        namaLengkap: 'Budi Santoso',
        nip: '198703152010011002',
        jabatan: 'Pejabat Pembuat Komitmen',
        unitKerja: 'Dinas PUPR Kabupaten XYZ',
        kompetensi: { pengadaan: 'Sedang', pengalaman: 5 },
        sertifikasi: { nomor: 'Sertifikat PPK No. 002/2024', masaBerlaku: '2025-12-31' },
        pengalaman: 5,
        status: 'AKTIF',
      },
    });
  }

  // Create sample paket
  let paket1 = await prisma.paket.findUnique({ where: { kodePaket: 'PKG-2024-001' } });
  if (!paket1) {
    paket1 = await prisma.paket.create({
      data: {
        kodePaket: 'PKG-2024-001',
        namaPaket: 'Pembangunan Jalan Desa ABC',
        jenisPaket: 'Konstruksi',
        nilaiPaket: 500000000, // 500 juta
        metodePengadaan: 'Tender',
        createdBy: admin.id,
        status: 'DRAFT',
      },
    });
  }

  let paket2 = await prisma.paket.findUnique({ where: { kodePaket: 'PKG-2024-002' } });
  if (!paket2) {
    paket2 = await prisma.paket.create({
      data: {
        kodePaket: 'PKG-2024-002',
        namaPaket: 'Pengadaan Alat Tulis Kantor',
        jenisPaket: 'Barang',
        nilaiPaket: 25000000, // 25 juta
        metodePengadaan: 'Pengadaan Langsung',
        createdBy: user1.id,
        status: 'ON_PROGRESS',
      },
    });
  }

  // Create sample vendor
  let vendor1 = await prisma.vendor.findUnique({ where: { nomorIzin: 'IUJK-001/2024' } });
  if (!vendor1) {
    vendor1 = await prisma.vendor.create({
      data: {
        namaVendor: 'PT. Konstruksi Maju Jaya',
        jenisVendor: 'KONSTRUKSI',
        nomorIzin: 'IUJK-001/2024',
        spesialisasi: 'Pembangunan Jalan',
        kontak: '+6281234567890',
        alamat: 'Jl. Raya No. 123, Kota ABC',
        status: 'AKTIF',
      },
    });
  }

  let vendor2 = await prisma.vendor.findUnique({ where: { nomorIzin: 'SIUP-002/2024' } });
  if (!vendor2) {
    vendor2 = await prisma.vendor.create({
      data: {
        namaVendor: 'CV. Supplier Berkah',
        jenisVendor: 'KONSULTAN_PERENCANAAN',
        nomorIzin: 'SIUP-002/2024',
        spesialisasi: 'Alat Tulis Kantor',
        kontak: '+6281234567891',
        alamat: 'Jl. Merdeka No. 456, Kota DEF',
        status: 'AKTIF',
      },
    });
  }

  // Create sample dokumen
  const existingDok1 = await prisma.dokumen.findFirst({ where: { filePath: '/uploads/rab-pkg-2024-001.pdf' } });
  if (!existingDok1) {
    await prisma.dokumen.create({
      data: {
        namaDokumen: 'RAB Pembangunan Jalan Desa ABC',
        jenisDokumen: 'JAMINAN_UANG_MUKA',
        filePath: '/uploads/rab-pkg-2024-001.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        paketId: paket1.id,
        uploadedBy: user1.id,
      },
    });
  }

  const existingDok2 = await prisma.dokumen.findFirst({ where: { filePath: '/uploads/kontrak-pkg-2024-002.pdf' } });
  if (!existingDok2) {
    await prisma.dokumen.create({
      data: {
        namaDokumen: 'Kontrak Pengadaan ATK',
        jenisDokumen: 'JAMINAN_PELAKSANAAN',
        filePath: '/uploads/kontrak-pkg-2024-002.pdf',
        fileSize: 512000,
        mimeType: 'application/pdf',
        paketId: paket2.id,
        uploadedBy: user1.id,
      },
    });
  }

  // Create sample laporan Itwasda
  const existingLaporan = await prisma.laporanItwasda.findUnique({ where: { nomorLaporan: 'ITW-2024-001' } });
  if (!existingLaporan) {
    await prisma.laporanItwasda.create({
      data: {
        nomorLaporan: 'ITW-2024-001',
        paketId: paket1.id,
        jenisLaporan: 'Temuan',
        deskripsi: 'Ditemukan ketidaksesuaian spesifikasi material pada pekerjaan pengaspalan',
        tingkatKeparahan: 'SEDANG',
        auditor: 'Siti Nurhaliza',
        pic: 'Ahmad Sutrisno',
        tanggal: new Date('2024-10-15'),
        status: 'BARU',
      },
    });
  }

  // Create sample monitoring
  const existingMonitoring = await prisma.monitoring.findFirst({ where: { paketId: paket1.id, periode: 'Q4 2024' } });
  if (!existingMonitoring) {
    await prisma.monitoring.create({
      data: {
        paketId: paket1.id,
        jenisMonitoring: 'Fisik',
        periode: 'Q4 2024',
        progress: 45,
        issues: 'Keterlambatan pengiriman material',
        rekomendasi: 'Koordinasi dengan vendor untuk percepatan pengiriman',
        tanggalMonitoring: new Date('2024-10-20'),
        monitoredBy: user2.id,
      },
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('Demo credentials:');
  console.log(' - Admin: admin@sip.com / sip345');
  console.log(' - Manager demo: manager.demo@sip.com / manager123');
  console.log(' - Auditor demo: auditor.demo@sip.com / auditor123');
  console.log(' - User demo: user.demo@sip.com / user123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
