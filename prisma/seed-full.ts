import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database dengan data lengkap...');
  await prisma.$connect();

  // ===== USERS =====
  const adminHashedPassword = await bcrypt.hash('sip345', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sip.com' },
    update: {},
    create: {
      email: 'admin@sip.com',
      firstName: 'Administrator',
      lastName: 'Sistem',
      password: adminHashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'ppk@sip.com' },
      update: {},
      create: {
        email: 'ppk@sip.com',
        firstName: 'PPK',
        lastName: 'SIPAKAT',
        password: await bcrypt.hash('ppk123', 10),
        role: 'MANAGER',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'auditor@sip.com' },
      update: {},
      create: {
        email: 'auditor@sip.com',
        firstName: 'Auditor',
        lastName: 'SIPAKAT',
        password: await bcrypt.hash('auditor123', 10),
        role: 'AUDITOR',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'manager@sip.com' },
      update: {},
      create: {
        email: 'manager@sip.com',
        firstName: 'Manager',
        lastName: 'SIPAKAT',
        password: await bcrypt.hash('manager123', 10),
        role: 'MANAGER',
        isActive: true,
      },
    }),
  ]);

  // ===== PPK =====
  const ppkData = [
    {
      namaLengkap: 'Ir. Ahmad Fauzi, M.T.',
      nip: '197505101998031001',
      jabatan: 'Kepala Seksi Perencanaan dan Pengadaan',
      unitKerja: 'Dinas Pekerjaan Umum dan Penataan Ruang',
      kompetensi: { 
        bidang: 'Pengadaan Konstruksi', 
        tingkat: 'Ahli', 
        pengalaman: '15 tahun'
      },
      sertifikasi: { 
        nomor: 'LKPP-2023-001234', 
        masaBerlaku: '2026-12-31',
        jenis: 'Sertifikasi Pengadaan Tingkat Ahli'
      },
      pengalaman: 15,
      status: 'AKTIF' as const,
    },
    {
      namaLengkap: 'Dr. Siti Nurhaliza, S.E., M.Ak.',
      nip: '198203152005012002',
      jabatan: 'Auditor Ahli Muda',
      unitKerja: 'Inspektorat Daerah',
      kompetensi: { 
        bidang: 'Audit Keuangan dan Pengadaan', 
        tingkat: 'Ahli Muda', 
        pengalaman: '12 tahun'
      },
      sertifikasi: { 
        nomor: 'BPKP-2022-005678', 
        masaBerlaku: '2025-06-30',
        jenis: 'Sertifikasi Auditor Pemerintah'
      },
      pengalaman: 12,
      status: 'AKTIF' as const,
    },
    {
      namaLengkap: 'Budi Santoso, S.E.',
      nip: '198907202010011003',
      jabatan: 'Kepala Sub Bagian Keuangan',
      unitKerja: 'Biro Keuangan dan Aset',
      kompetensi: { 
        bidang: 'Pengelolaan Keuangan Daerah', 
        tingkat: 'Terampil', 
        pengalaman: '10 tahun'
      },
      sertifikasi: { 
        nomor: 'LKPP-2023-009012', 
        masaBerlaku: '2026-03-15',
        jenis: 'Sertifikasi Pengadaan Tingkat Terampil'
      },
      pengalaman: 10,
      status: 'AKTIF' as const,
    },
  ];

  const createdPPK = [];
  for (const ppk of ppkData) {
    const existing = await prisma.pPK.findUnique({ where: { nip: ppk.nip } });
    if (!existing) {
      createdPPK.push(await prisma.pPK.create({ data: ppk }));
    } else {
      createdPPK.push(existing);
    }
  }

  // ===== PAKET =====
  const paketData = [
    {
      kodePaket: 'PKG-PUPR-2024-001',
      kodeRUP: 'RUP-15782-2024-001',
      namaPaket: 'Pembangunan Jalan Lingkar Utara Kabupaten Makmur Jaya',
      jenisPaket: 'Konstruksi',
      nilaiPaket: 15750000000, // 15.75 Miliar
      metodePengadaan: 'TENDER',
      createdBy: admin.id,
      status: 'ON_PROGRESS' as const,
      tanggalMulai: new Date('2024-03-15'),
      tanggalSelesai: new Date('2025-03-14'),
      lamaProyek: 365,
    },
    {
      kodePaket: 'PKG-PUPR-2024-002',
      kodeRUP: 'RUP-15782-2024-002',
      namaPaket: 'Rehabilitasi Jembatan Sungai Besar Desa Sukamaju',
      jenisPaket: 'Konstruksi',
      nilaiPaket: 8500000000, // 8.5 Miliar
      metodePengadaan: 'TENDER',
      createdBy: users[0].id,
      status: 'ON_PROGRESS' as const,
      tanggalMulai: new Date('2024-05-01'),
      tanggalSelesai: new Date('2024-11-30'),
      lamaProyek: 214,
    },
    {
      kodePaket: 'PKG-PUPR-2024-003',
      kodeRUP: 'RUP-15782-2024-003',
      namaPaket: 'Pembangunan Gedung Kantor Dinas PUPR 3 Lantai',
      jenisPaket: 'Konstruksi',
      nilaiPaket: 12300000000, // 12.3 Miliar
      metodePengadaan: 'SWAKELOLA',
      createdBy: users[0].id,
      status: 'ON_PROGRESS' as const,
      tanggalMulai: new Date('2024-06-01'),
      tanggalSelesai: new Date('2025-05-31'),
      lamaProyek: 365,
    },
    {
      kodePaket: 'PKG-DISDIK-2024-001',
      kodeRUP: 'RUP-15783-2024-001',
      namaPaket: 'Pengadaan Laptop dan Komputer untuk Sekolah se-Kabupaten',
      jenisPaket: 'Barang',
      nilaiPaket: 2850000000, // 2.85 Miliar
      metodePengadaan: 'E_PURCHASING',
      createdBy: users[2].id,
      status: 'COMPLETED' as const,
      tanggalMulai: new Date('2024-01-15'),
      tanggalSelesai: new Date('2024-03-30'),
      lamaProyek: 75,
    },
    {
      kodePaket: 'PKG-DINKES-2024-001',
      kodeRUP: 'RUP-15784-2024-001',
      namaPaket: 'Pengadaan Alat Kesehatan dan Obat-obatan Puskesmas',
      jenisPaket: 'Barang',
      nilaiPaket: 1750000000, // 1.75 Miliar
      metodePengadaan: 'PENUNJUKAN_LANGSUNG',
      createdBy: admin.id,
      status: 'COMPLETED' as const,
      tanggalMulai: new Date('2024-02-01'),
      tanggalSelesai: new Date('2024-04-15'),
      lamaProyek: 74,
    },
    {
      kodePaket: 'PKG-PUPR-2024-004',
      kodeRUP: 'RUP-15782-2024-004',
      namaPaket: 'Konsultan Pengawas Pembangunan Jalan Lingkar Utara',
      jenisPaket: 'Jasa Konsultansi',
      nilaiPaket: 850000000, // 850 Juta
      metodePengadaan: 'SELEKSI',
      createdBy: users[0].id,
      status: 'ON_PROGRESS' as const,
      tanggalMulai: new Date('2024-03-15'),
      tanggalSelesai: new Date('2025-03-14'),
      lamaProyek: 365,
    },
    {
      kodePaket: 'PKG-PUPR-2024-005',
      kodeRUP: 'RUP-15782-2024-005',
      namaPaket: 'Konsultan Perencanaan Detail Engineering Design (DED) Jalan Tol Dalam Kota',
      jenisPaket: 'Jasa Konsultansi',
      nilaiPaket: 1200000000, // 1.2 Miliar
      metodePengadaan: 'SELEKSI',
      createdBy: users[0].id,
      status: 'ON_PROGRESS' as const,
      tanggalMulai: new Date('2024-04-01'),
      tanggalSelesai: new Date('2024-10-31'),
      lamaProyek: 214,
    },
    {
      kodePaket: 'PKG-PUPR-2024-006',
      kodeRUP: 'RUP-15782-2024-006',
      namaPaket: 'Pemeliharaan Rutin Jalan Kabupaten (50 KM)',
      jenisPaket: 'Konstruksi',
      nilaiPaket: 4500000000, // 4.5 Miliar
      metodePengadaan: 'TENDER',
      createdBy: users[0].id,
      status: 'ON_PROGRESS' as const,
      tanggalMulai: new Date('2024-07-01'),
      tanggalSelesai: new Date('2024-12-31'),
      lamaProyek: 184,
    },
    {
      kodePaket: 'PKG-BAPPEDA-2024-001',
      kodeRUP: 'RUP-15785-2024-001',
      namaPaket: 'Penyusunan Rencana Tata Ruang Wilayah (RTRW) Kabupaten 2025-2045',
      jenisPaket: 'Jasa Konsultansi',
      nilaiPaket: 2100000000, // 2.1 Miliar
      metodePengadaan: 'SELEKSI',
      createdBy: admin.id,
      status: 'ON_PROGRESS' as const,
      tanggalMulai: new Date('2024-06-01'),
      tanggalSelesai: new Date('2025-05-31'),
      lamaProyek: 365,
    },
    {
      kodePaket: 'PKG-DISHUB-2024-001',
      kodeRUP: 'RUP-15786-2024-001',
      namaPaket: 'Pengadaan Bus Sekolah untuk Daerah Terpencil (10 Unit)',
      jenisPaket: 'Barang',
      nilaiPaket: 3500000000, // 3.5 Miliar
      metodePengadaan: 'E_PURCHASING',
      createdBy: admin.id,
      status: 'PUBLISHED' as const,
      tanggalMulai: new Date('2024-11-01'),
      tanggalSelesai: new Date('2025-01-31'),
      lamaProyek: 92,
    },
  ];

  const createdPaket = [];
  for (const paket of paketData) {
    const existing = await prisma.paket.findUnique({ where: { kodePaket: paket.kodePaket } });
    if (!existing) {
      createdPaket.push(await prisma.paket.create({ data: paket }));
    } else {
      createdPaket.push(existing);
    }
  }

  // ===== VENDOR =====
  const vendorData = [
    {
      namaVendor: 'PT Wijaya Karya Konstruksi',
      jenisVendor: 'KONSTRUKSI' as const,
      nomorIzin: 'IUJK-001/LPJK/2023',
      spesialisasi: 'Jalan, Jembatan, dan Bangunan Gedung',
      kontak: '+62 21 85906789',
      alamat: 'Jl. Gatot Subroto Kav. 54, Jakarta Selatan',
      status: 'AKTIF' as const,
      jumlahProyek: 24,
      rating: 4.7,
      paketId: createdPaket[0].id,
      namaProyek: 'Pembangunan Jalan Lingkar Utara',
      deskripsi: 'Kontraktor utama untuk pembangunan jalan lingkar dengan total panjang 12 kilometer',
      lamaKontrak: 365,
      deskripsiProgress: 'Progress fisik minggu ke-28: Pekerjaan tanah 100%, Pondasi 85%, Perkerasan 60%',
      warningTemuan: false,
    },
    {
      namaVendor: 'PT Adhi Karya Persero Tbk',
      jenisVendor: 'KONSTRUKSI' as const,
      nomorIzin: 'IUJK-002/LPJK/2023',
      spesialisasi: 'Konstruksi Gedung dan Infrastruktur',
      kontak: '+62 21 7182828',
      alamat: 'Jl. Raya Pasar Minggu No. 7, Jakarta Selatan',
      status: 'AKTIF' as const,
      jumlahProyek: 18,
      rating: 4.5,
      paketId: createdPaket[1].id,
      namaProyek: 'Rehabilitasi Jembatan Sungai Besar',
      deskripsi: 'Rehabilitasi struktur jembatan dengan panjang 180 meter',
      lamaKontrak: 214,
      deskripsiProgress: 'Progress fisik minggu ke-18: Perkuatan pondasi 100%, Struktur utama 75%, Finishing 30%',
      warningTemuan: true, // Ada temuan audit
    },
    {
      namaVendor: 'PT Nindya Karya Persero',
      jenisVendor: 'KONSTRUKSI' as const,
      nomorIzin: 'IUJK-003/LPJK/2023',
      spesialisasi: 'Bangunan Gedung Bertingkat',
      kontak: '+62 21 8370709',
      alamat: 'Jl. Letjen MT Haryono Kav. 22, Jakarta Selatan',
      status: 'AKTIF' as const,
      jumlahProyek: 15,
      rating: 4.6,
      paketId: createdPaket[2].id,
      namaProyek: 'Pembangunan Gedung Kantor Dinas PUPR',
      deskripsi: 'Pembangunan gedung kantor 3 lantai dengan luas total 2.500 m²',
      lamaKontrak: 365,
      deskripsiProgress: 'Progress fisik minggu ke-20: Pondasi 100%, Struktur lantai 1-2 100%, Lantai 3 70%, MEP 40%',
      warningTemuan: false,
    },
    {
      namaVendor: 'CV Intan Konsultan Engineering',
      jenisVendor: 'KONSULTAN_PERENCANAAN' as const,
      nomorIzin: 'KONTRAK-2024-001',
      spesialisasi: 'Perencanaan Jalan dan Jembatan',
      kontak: '+62 812 3456 7890',
      alamat: 'Jl. Diponegoro No. 45, Kota Makmur Jaya',
      status: 'AKTIF' as const,
      jumlahProyek: 12,
      rating: 4.4,
      paketId: createdPaket[6].id,
      namaProyek: 'Perencanaan DED Jalan Tol Dalam Kota',
      deskripsi: 'Penyusunan Detail Engineering Design untuk jalan tol sepanjang 25 kilometer termasuk analisis kelayakan teknis dan lingkungan',
      lamaKontrak: 214,
      warningTemuan: false,
    },
    {
      namaVendor: 'PT Mitra Karya Consultant',
      jenisVendor: 'KONSULTAN_PENGAWAS' as const,
      nomorIzin: 'KONTRAK-2024-002',
      spesialisasi: 'Pengawasan Konstruksi Jalan dan Jembatan',
      kontak: '+62 813 5678 9012',
      alamat: 'Jl. Veteran No. 88, Kota Makmur Jaya',
      status: 'AKTIF' as const,
      jumlahProyek: 16,
      rating: 4.6,
      paketId: createdPaket[5].id,
      namaProyek: 'Pengawasan Pembangunan Jalan Lingkar Utara',
      deskripsi: 'Supervisi dan pengawasan teknis konstruksi jalan lingkar dengan dokumentasi harian, mingguan, dan bulanan',
      deskripsiLaporan: 'Laporan Harian: Monitoring pekerjaan galian tanah dan pemadatan subgrade. Laporan Mingguan: Progress fisik 62%, volume pekerjaan sesuai kontrak, tidak ada deviasi material. Laporan Bulanan: Realisasi keuangan 58%, kualitas pekerjaan baik, rekomendasi percepatan pada segmen 3.',
      lamaKontrak: 365,
      warningTemuan: false,
    },
    {
      namaVendor: 'CV Wahana Teknik Nusantara',
      jenisVendor: 'KONSULTAN_PERENCANAAN' as const,
      nomorIzin: 'KONTRAK-2024-003',
      spesialisasi: 'Perencanaan Tata Ruang dan Lingkungan',
      kontak: '+62 814 9012 3456',
      alamat: 'Jl. Sudirman No. 123, Kota Makmur Jaya',
      status: 'AKTIF' as const,
      jumlahProyek: 8,
      rating: 4.3,
      paketId: createdPaket[8].id,
      namaProyek: 'Penyusunan RTRW Kabupaten',
      deskripsi: 'Penyusunan dokumen Rencana Tata Ruang Wilayah periode 2025-2045 meliputi analisis spasial, kajian daya dukung lingkungan, dan arahan pemanfaatan ruang',
      lamaKontrak: 365,
      warningTemuan: false,
    },
    {
      namaVendor: 'PT Cahaya Bintang Persada',
      jenisVendor: 'KONSTRUKSI' as const,
      nomorIzin: 'IUJK-004/LPJK/2023',
      spesialisasi: 'Pemeliharaan Jalan',
      kontak: '+62 815 3456 7890',
      alamat: 'Jl. Ahmad Yani No. 67, Kota Makmur Jaya',
      status: 'AKTIF' as const,
      jumlahProyek: 22,
      rating: 4.4,
      paketId: createdPaket[7].id,
      namaProyek: 'Pemeliharaan Rutin Jalan Kabupaten',
      deskripsi: 'Pemeliharaan rutin jalan kabupaten sepanjang 50 KM meliputi patching, overlay, dan perbaikan drainase',
      lamaKontrak: 184,
      deskripsiProgress: 'Progress fisik minggu ke-12: Survei kondisi jalan 100%, Patching jalan rusak 80%, Overlay 45%, Perbaikan drainase 60%',
      warningTemuan: true, // Ada temuan
    },
  ];

  const createdVendor = [];
  for (const vendor of vendorData) {
    const existing = await prisma.vendor.findUnique({ where: { nomorIzin: vendor.nomorIzin } });
    if (!existing) {
      createdVendor.push(await prisma.vendor.create({ data: vendor }));
    } else {
      createdVendor.push(existing);
    }
  }

  // ===== LAPORAN ITWASDA =====
  const laporanItwasdaData = [
    {
      nomorLaporan: 'ITW/2024/001/PUPR',
      paketId: createdPaket[1].id, // Rehabilitasi Jembatan
      jenisLaporan: 'Inspeksi Teknis',
      deskripsi: 'Ditemukan ketidaksesuaian spesifikasi beton ready mix K-350 pada pekerjaan struktur pier jembatan. Hasil uji lab menunjukkan mutu beton K-320. Rekomendasi: Peningkatan quality control dan pengujian material.',
      tingkatKualitasTemuan: 'TINGGI',
      auditor: 'Dr. Siti Nurhaliza, S.E., M.Ak.',
      pic: 'Ir. Ahmad Fauzi, M.T.',
      tanggal: new Date('2024-08-15'),
      status: 'PROSES',
    },
    {
      nomorLaporan: 'ITW/2024/002/PUPR',
      paketId: createdPaket[0].id, // Jalan Lingkar
      jenisLaporan: 'Audit Kemajuan Fisik',
      deskripsi: 'Progress fisik pekerjaan pada minggu ke-28 adalah 62%, sedangkan progress rencana seharusnya 70%. Terdapat keterlambatan 8% terutama pada pekerjaan perkerasan akibat cuaca buruk dan keterlambatan material agregat.',
      tingkatKualitasTemuan: 'SEDANG',
      auditor: 'Ir. Bambang Wijaya, M.T.',
      pic: 'Ir. Ahmad Fauzi, M.T.',
      tanggal: new Date('2024-09-20'),
      status: 'PROSES',
    },
    {
      nomorLaporan: 'ITW/2024/003/PUPR',
      paketId: createdPaket[7].id, // Pemeliharaan Jalan
      jenisLaporan: 'Inspeksi Pelaksanaan',
      deskripsi: 'Ditemukan volume pekerjaan patching yang tidak sesuai kontrak. Kontrak menyebutkan 2.500 m² namun realisasi di lapangan hanya 2.100 m². Penyedia belum memberikan klarifikasi tertulis.',
      tingkatKualitasTemuan: 'TINGGI',
      auditor: 'Drs. Agus Salim, M.M.',
      pic: 'Budi Santoso, S.E.',
      tanggal: new Date('2024-10-05'),
      status: 'BARU',
    },
    {
      nomorLaporan: 'ITW/2024/004/DISDIK',
      paketId: createdPaket[3].id, // Pengadaan Laptop
      jenisLaporan: 'Audit Administrasi',
      deskripsi: 'Dokumen BA Serah Terima barang tidak lengkap. Dari 150 unit laptop yang diterima, 12 unit tidak memiliki stiker inventaris dan nomor seri tidak tercatat dengan benar di BAST.',
      tingkatKualitasTemuan: 'RENDAH',
      auditor: 'Siti Aminah, S.E.',
      pic: 'Drs. Hendra Gunawan',
      tanggal: new Date('2024-03-25'),
      status: 'SELESAI',
    },
  ];

  for (const laporan of laporanItwasdaData) {
    const existing = await prisma.laporanItwasda.findUnique({ where: { nomorLaporan: laporan.nomorLaporan } });
    if (!existing) {
      await prisma.laporanItwasda.create({ data: laporan });
    }
  }

  // ===== TEMUAN BPKP =====
  const temuanBPKPData = [
    {
      nomorTemuan: 'BPKP/2024/001/PUPR',
      paketId: createdPaket[1].id, // Rehabilitasi Jembatan
      jenisTemuan: 'Keuangan',
      deskripsi: 'Terdapat selisih pembayaran termin 2 sebesar Rp 125.000.000 yang tidak didukung oleh volume pekerjaan di lapangan. Progress fisik tercatat 45% namun pembayaran sudah mencapai 55%. Rekomendasi: Verifikasi ulang volume pekerjaan dan perhitungan termin.',
      tingkatKualitasTemuan: 'KRITIS',
      auditor: 'Tim BPKP Provinsi',
      pic: 'Budi Santoso, S.E.',
      tanggal: new Date('2024-08-20'),
      status: 'PROSES',
    },
    {
      nomorTemuan: 'BPKP/2024/002/PUPR',
      paketId: createdPaket[7].id, // Pemeliharaan Jalan
      jenisTemuan: 'Administrasi',
      deskripsi: 'Dokumen Jaminan Pelaksanaan yang diserahkan penyedia tidak sesuai format standar dan nilai jaminan hanya 4,5% dari nilai kontrak (seharusnya 5%). Perlu addendum kontrak atau penambahan nilai jaminan.',
      tingkatKualitasTemuan: 'SEDANG',
      auditor: 'BPKP Perwakilan Wilayah',
      pic: 'Ir. Ahmad Fauzi, M.T.',
      tanggal: new Date('2024-09-10'),
      status: 'PROSES',
    },
    {
      nomorTemuan: 'BPKP/2024/003/DISDIK',
      paketId: createdPaket[3].id,
      jenisTemuan: 'Teknis',
      deskripsi: 'Spesifikasi laptop yang diterima tidak sesuai kontrak. Kontrak menyebutkan RAM 16GB namun 8 unit yang diperiksa hanya memiliki RAM 8GB. Rekomendasi: Pengembalian barang atau kompensasi harga.',
      tingkatKualitasTemuan: 'TINGGI',
      auditor: 'Tim BPKP Kabupaten',
      pic: 'Drs. Hendra Gunawan',
      tanggal: new Date('2024-03-28'),
      status: 'SELESAI',
    },
  ];

  for (const temuan of temuanBPKPData) {
    const existing = await prisma.temuanBPKP.findUnique({ where: { nomorTemuan: temuan.nomorTemuan } });
    if (!existing) {
      await prisma.temuanBPKP.create({ data: temuan });
    }
  }

  // ===== PROYEK PUPR =====
  const proyekPUPRData = [
    {
      namaProyek: 'Pembangunan Jalan Lingkar Utara Kabupaten Makmur Jaya',
      lokasi: 'Kecamatan Sukamaju - Kecamatan Mekar Sari',
      anggaran: 15750000000,
      kontraktor: 'PT Wijaya Karya Konstruksi',
      tanggalMulai: new Date('2024-03-15'),
      tanggalSelesai: new Date('2025-03-14'),
      status: 'PELAKSANAAN' as const,
      progress: 62,
      deskripsiCatatan: 'Progress minggu ke-28: Pekerjaan galian dan timbunan tanah telah selesai 100%. Pekerjaan struktur pondasi jalan dan drainase mencapai 85%. Pekerjaan lapis perkerasan jalan (base course dan sub base) mencapai 60%. Kendala cuaca hujan pada minggu ke-24-25 menyebabkan sedikit keterlambatan namun telah dilakukan catching up.',
      tingkatKualitasTemuan: 'SEDANG',
      createdBy: users[0].id,
    },
    {
      namaProyek: 'Rehabilitasi Jembatan Sungai Besar Desa Sukamaju',
      lokasi: 'Desa Sukamaju, Kecamatan Mekar Jaya',
      anggaran: 8500000000,
      kontraktor: 'PT Adhi Karya Persero Tbk',
      tanggalMulai: new Date('2024-05-01'),
      tanggalSelesai: new Date('2024-11-30'),
      status: 'PELAKSANAAN' as const,
      progress: 75,
      deskripsiCatatan: 'Progress minggu ke-18: Perkuatan pondasi jembatan menggunakan metode micropile telah selesai 100%. Struktur pier dan abutment jembatan selesai 90%. Pekerjaan girder dan deck jembatan mencapai 75%. Instalasi railing dan pengecatan mencapai 30%. Terdapat temuan audit terkait mutu beton K-350 yang tidak sesuai spesifikasi (hasil lab K-320).',
      tingkatKualitasTemuan: 'TINGGI',
      createdBy: users[0].id,
    },
    {
      namaProyek: 'Pembangunan Gedung Kantor Dinas PUPR 3 Lantai',
      lokasi: 'Jl. Raya Pembangunan No. 1, Kota Makmur Jaya',
      anggaran: 12300000000,
      kontraktor: 'PT Nindya Karya Persero',
      tanggalMulai: new Date('2024-06-01'),
      tanggalSelesai: new Date('2025-05-31'),
      status: 'PELAKSANAAN' as const,
      progress: 55,
      deskripsiCatatan: 'Progress minggu ke-20: Pekerjaan pondasi tiang pancang dan pile cap selesai 100%. Struktur beton bertulang lantai 1 dan 2 selesai 100%. Struktur lantai 3 mencapai 70%. Pekerjaan dinding bata dan plesteran lantai 1-2 mencapai 80%. Instalasi MEP (mekanikal, elektrikal, plumbing) mencapai 40%. Pengadaan furniture dan interior dalam proses tender.',
      tingkatKualitasTemuan: null,
      createdBy: users[0].id,
    },
    {
      namaProyek: 'Pemeliharaan Rutin Jalan Kabupaten (50 KM)',
      lokasi: 'Berbagai lokasi di wilayah Kabupaten Makmur Jaya',
      anggaran: 4500000000,
      kontraktor: 'PT Cahaya Bintang Persada',
      tanggalMulai: new Date('2024-07-01'),
      tanggalSelesai: new Date('2024-12-31'),
      status: 'PELAKSANAAN' as const,
      progress: 68,
      deskripsiCatatan: 'Progress minggu ke-12: Survei dan pemetaan kondisi jalan selesai 100% (50 KM). Pekerjaan patching lubang dan retak jalan mencapai 80% (40 KM selesai). Pekerjaan overlay hotmix mencapai 45% (22,5 KM selesai). Perbaikan dan pembersihan drainase jalan mencapai 60% (30 KM selesai). Terdapat temuan terkait volume pekerjaan patching yang tidak sesuai kontrak.',
      tingkatKualitasTemuan: 'TINGGI',
      createdBy: users[0].id,
    },
  ];

  for (const proyek of proyekPUPRData) {
    const existing = await prisma.proyekPUPR.findFirst({ 
      where: { 
        namaProyek: proyek.namaProyek,
        tanggalMulai: proyek.tanggalMulai 
      } 
    });
    if (!existing) {
      await prisma.proyekPUPR.create({ data: proyek });
    }
  }

  // ===== PPK DATA =====
  const ppkDataEntries = [
    {
      paketId: createdPaket[0].id,
      namaPPK: 'Ir. Ahmad Fauzi, M.T.',
      noSertifikasi: 'LKPP-2023-001234',
      jumlahAnggaran: 15750000000,
      lamaProyek: 365,
      realisasiTermin1: 3937500000, // 25%
      realisasiTermin2: 3937500000, // 25%
      realisasiTermin3: 2362500000, // 15% (total 65%)
      realisasiTermin4: null,
      PHO: null,
      FHO: null,
    },
    {
      paketId: createdPaket[1].id,
      namaPPK: 'Ir. Ahmad Fauzi, M.T.',
      noSertifikasi: 'LKPP-2023-001234',
      jumlahAnggaran: 8500000000,
      lamaProyek: 214,
      realisasiTermin1: 2550000000, // 30%
      realisasiTermin2: 2550000000, // 30%
      realisasiTermin3: 1275000000, // 15% (total 75%)
      realisasiTermin4: null,
      PHO: null,
      FHO: null,
    },
    {
      paketId: createdPaket[2].id,
      namaPPK: 'Ir. Ahmad Fauzi, M.T.',
      noSertifikasi: 'LKPP-2023-001234',
      jumlahAnggaran: 12300000000,
      lamaProyek: 365,
      realisasiTermin1: 3075000000, // 25%
      realisasiTermin2: 3690000000, // 30% (total 55%)
      realisasiTermin3: null,
      realisasiTermin4: null,
      PHO: null,
      FHO: null,
    },
    {
      paketId: createdPaket[3].id,
      namaPPK: 'Budi Santoso, S.E.',
      noSertifikasi: 'LKPP-2023-009012',
      jumlahAnggaran: 2850000000,
      lamaProyek: 75,
      realisasiTermin1: 1425000000, // 50%
      realisasiTermin2: 1425000000, // 50%
      realisasiTermin3: null,
      realisasiTermin4: null,
      PHO: new Date('2024-03-25'),
      FHO: new Date('2024-03-30'),
    },
    {
      paketId: createdPaket[4].id,
      namaPPK: 'Budi Santoso, S.E.',
      noSertifikasi: 'LKPP-2023-009012',
      jumlahAnggaran: 1750000000,
      lamaProyek: 74,
      realisasiTermin1: 875000000, // 50%
      realisasiTermin2: 875000000, // 50%
      realisasiTermin3: null,
      realisasiTermin4: null,
      PHO: new Date('2024-04-10'),
      FHO: new Date('2024-04-15'),
    },
  ];

  for (const ppkDataEntry of ppkDataEntries) {
    const existing = await prisma.pPKData.findFirst({ 
      where: { 
        paketId: ppkDataEntry.paketId,
        namaPPK: ppkDataEntry.namaPPK 
      } 
    });
    if (!existing) {
      await prisma.pPKData.create({ data: ppkDataEntry });
    }
  }

  // ===== PENGADUAN =====
  const pengaduanData = [
    {
      judul: 'Kualitas Perkerasan Jalan Lingkar Utara Tidak Rata',
      isi: 'Saya warga Desa Sukamaju ingin melaporkan bahwa kualitas perkerasan jalan lingkar utara yang baru dibangun tidak rata. Terdapat gelombang dan permukaan tidak halus di beberapa titik terutama di Km 5+200 hingga Km 5+800. Mohon ditindaklanjuti agar pekerjaan sesuai dengan standar yang telah ditetapkan.',
      status: 'DIPROSES' as const,
      pelapor: 'Bapak Joko Widodo (Warga Desa Sukamaju)',
      tanggal: new Date('2024-09-15'),
    },
    {
      judul: 'Progress Rehabilitasi Jembatan Lambat',
      isi: 'Saya mewakili masyarakat Desa Sukamaju ingin menyampaikan bahwa progress rehabilitasi jembatan Sungai Besar terkesan lambat. Sudah 4 bulan berjalan namun jembatan masih belum bisa dilewati. Akses ke desa menjadi terhambat dan merugikan warga. Mohon dipercepat penyelesaiannya.',
      status: 'DIPROSES' as const,
      pelapor: 'Kepala Desa Sukamaju',
      tanggal: new Date('2024-09-01'),
    },
    {
      judul: 'Dugaan Markup Harga Pengadaan Laptop Sekolah',
      isi: 'Saya sebagai orang tua siswa ingin melaporkan dugaan markup harga pada pengadaan laptop untuk sekolah. Harga per unit laptop di kontrak adalah Rp 19.000.000 namun laptop dengan spesifikasi serupa di pasaran hanya Rp 13.000.000. Mohon dilakukan audit menyeluruh terhadap pengadaan ini.',
      status: 'SELESAI' as const,
      pelapor: 'Ibu Siti Fatimah (Komite Sekolah)',
      tanggal: new Date('2024-03-10'),
    },
    {
      judul: 'Pekerjaan Pemeliharaan Jalan Tidak Sesuai Volume',
      isi: 'Saya warga Kecamatan Mekar Sari melaporkan bahwa pekerjaan pemeliharaan jalan di ruas Jl. Raya Mekar tidak sesuai volume. Kontrak menyebutkan panjang 5 KM namun realisasi di lapangan hanya sekitar 3,5 KM. Mohon dilakukan verifikasi dan tindak lanjut.',
      status: 'BARU' as const,
      pelapor: 'Bapak Agus Santoso (Warga Mekar Sari)',
      tanggal: new Date('2024-10-20'),
    },
    {
      judul: 'Material Konstruksi Jembatan Tidak Sesuai Spesifikasi',
      isi: 'Saya tukang bangunan yang bekerja di proyek rehabilitasi jembatan ingin melaporkan bahwa material beton yang digunakan tidak sesuai spesifikasi kontrak. Seharusnya K-350 namun yang datang kualitasnya lebih rendah. Mohon dilakukan pengujian laboratorium.',
      status: 'SELESAI' as const,
      pelapor: 'Anonim (Pekerja Konstruksi)',
      tanggal: new Date('2024-08-10'),
    },
  ];

  for (const pengaduan of pengaduanData) {
    const existing = await prisma.pengaduan.findFirst({ 
      where: { 
        judul: pengaduan.judul,
        tanggal: pengaduan.tanggal 
      } 
    });
    if (!existing) {
      await prisma.pengaduan.create({ data: pengaduan });
    }
  }

  // ===== MONITORING =====
  const monitoringData = [
    {
      paketId: createdPaket[0].id,
      jenisMonitoring: 'Progress Fisik dan Keuangan',
      periode: 'Oktober 2024',
      status: 'DELAYED' as const,
      progress: 62,
      issues: 'Keterlambatan progress 8% dari rencana (target 70%). Penyebab: Cuaca hujan dan keterlambatan pengiriman material agregat dari supplier.',
      rekomendasi: 'Koordinasi intensif dengan supplier material, penambahan shift kerja pada cuaca cerah, dan percepatan pekerjaan perkerasan pada segmen yang sudah siap.',
      tanggalMonitoring: new Date('2024-10-15'),
      monitoredBy: users[1].id,
    },
    {
      paketId: createdPaket[1].id,
      jenisMonitoring: 'Kualitas Pekerjaan',
      periode: 'September 2024',
      status: 'CRITICAL' as const,
      progress: 75,
      issues: 'Mutu beton K-350 tidak sesuai spesifikasi (hasil uji lab K-320). Berpotensi mempengaruhi kekuatan struktur jembatan.',
      rekomendasi: 'Perbaikan quality control, pengujian ulang seluruh batch beton yang sudah terpasang, dan evaluasi kemampuan kontraktor. Pertimbangan penalti atau perbaikan struktur.',
      tanggalMonitoring: new Date('2024-09-20'),
      monitoredBy: users[1].id,
    },
    {
      paketId: createdPaket[2].id,
      jenisMonitoring: 'Progress Fisik',
      periode: 'Oktober 2024',
      status: 'ON_TRACK' as const,
      progress: 55,
      issues: 'Tidak ada kendala signifikan. Progress sesuai jadwal rencana (target 55%).',
      rekomendasi: 'Pertahankan ritme pekerjaan, monitoring rutin kualitas material, dan koordinasi pengadaan furniture untuk tahap finishing.',
      tanggalMonitoring: new Date('2024-10-10'),
      monitoredBy: users[1].id,
    },
    {
      paketId: createdPaket[7].id,
      jenisMonitoring: 'Volume Pekerjaan',
      periode: 'Oktober 2024',
      status: 'CRITICAL' as const,
      progress: 68,
      issues: 'Volume pekerjaan patching tidak sesuai kontrak. Kontrak 2.500 m² realisasi 2.100 m². Selisih 400 m² belum ada klarifikasi dari penyedia.',
      rekomendasi: 'Verifikasi lapangan bersama penyedia, perintah tertulis untuk penyelesaian kekurangan volume, dan pertimbangan penalti jika tidak ditindaklanjuti.',
      tanggalMonitoring: new Date('2024-10-18'),
      monitoredBy: users[1].id,
    },
  ];

  for (const monitoring of monitoringData) {
    const existing = await prisma.monitoring.findFirst({ 
      where: { 
        paketId: monitoring.paketId,
        periode: monitoring.periode 
      } 
    });
    if (!existing) {
      await prisma.monitoring.create({ data: monitoring });
    }
  }

  console.log('✅ Database seeded successfully dengan data lengkap dan profesional!');
  console.log('\n📊 Ringkasan Data:');
  console.log(`- Users: ${users.length + 1} akun`);
  console.log(`- PPK: ${createdPPK.length} orang`);
  console.log(`- Paket: ${createdPaket.length} paket`);
  console.log(`- Vendor: ${createdVendor.length} vendor`);
  console.log(`- Laporan Itwasda: ${laporanItwasdaData.length} laporan`);
  console.log(`- Temuan BPKP: ${temuanBPKPData.length} temuan`);
  console.log(`- Proyek PUPR: ${proyekPUPRData.length} proyek`);
  console.log(`- PPK Data: ${ppkDataEntries.length} data`);
  console.log(`- Pengaduan: ${pengaduanData.length} pengaduan`);
  console.log(`- Monitoring: ${monitoringData.length} monitoring`);
  console.log('\n🔐 Demo credentials:');
  console.log(' - Admin: admin@sip.com / sip345');
  console.log(' - PPK: ppk@sip.com / ppk123');
  console.log(' - Auditor: auditor@sip.com / auditor123');
  console.log(' - Manager: manager@sip.com / manager123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });