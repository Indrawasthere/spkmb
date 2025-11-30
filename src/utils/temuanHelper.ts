// src/utils/temuanHelper.ts
import { prisma } from '../lib/prisma.js';

interface CreateTemuanVendorParams {
  paketId: string;
  sourceType: 'ITWASDA' | 'BPKP' | 'PUPR';
  sourceId: string;
  nomorTemuan: string;
  judul: string;
  deskripsi: string;
  tingkat: string;
  createdByUserId: string;
}

export async function createTemuanForVendors(params: CreateTemuanVendorParams) {
  const { paketId, sourceType, sourceId, nomorTemuan, judul, deskripsi, tingkat } = params;

  try {
    console.log(`🔄 Creating temuan for vendors in paket: ${paketId}`);

    const vendorPakets = await prisma.vendorPaket.findMany({
      where: {
        paketId,
        vendor: { status: 'AKTIF' }, // Only active vendors
      },
      include: {
        vendor: true,
        paket: {
          select: {
            namaPaket: true,
            kodePaket: true,
          },
        },
      },
    });

    if (vendorPakets.length === 0) {
      console.warn(`⚠️ No active vendors found for paket: ${paketId}`);
      return { success: true, vendorCount: 0 };
    }

    console.log(`📦 Found ${vendorPakets.length} vendors for this paket`);

    const temuanPromises = vendorPakets.map((vp) =>
      prisma.temuanVendor.create({
        data: {
          vendorId: vp.vendorId,
          paketId,
          sourceType,
          sourceId,
          nomorTemuan,
          judul,
          deskripsi,
          tingkat,
          status: 'BARU',
          tanggalTemuan: new Date(),
        },
      })
    );

    const vendorUpdatePromises = vendorPakets.map((vp) =>
      prisma.vendor.update({
        where: { id: vp.vendorId },
        data: {
          warningTemuan: true,
          jumlahTemuan: { increment: 1 },
        },
      })
    );

    // 4. Create notifications for vendors
    const notificationPromises = vendorPakets.map((vp) =>
      prisma.notification.create({
        data: {
          vendorId: vp.vendorId,
          type: 'TEMUAN_BARU',
          title: `Temuan Audit Baru: ${nomorTemuan}`,
          message: `Anda memiliki temuan audit ${tingkat} pada paket ${vp.paket.namaPaket}. Silakan segera ditindaklanjuti.`,
          entityType: 'TEMUAN',
          entityId: sourceId,
        },
      })
    );

    // Execute all in parallel
    const results = await Promise.all([
      ...temuanPromises,
      ...vendorUpdatePromises,
      ...notificationPromises,
    ]);

    const createdTemuan = results.slice(0, vendorPakets.length);

    console.log(`✅ Created ${createdTemuan.length} temuan for vendors`);
    return {
      success: true,
      vendorCount: createdTemuan.length,
      data: createdTemuan,
    };
  } catch (error) {
    console.error('❌ Error creating temuan for vendors:', error);
    throw error;
  }
}
