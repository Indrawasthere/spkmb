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
  const { paketId, sourceType, sourceId, nomorTemuan, judul, deskripsi, tingkat, createdByUserId } = params;

  try {
    // 1. Get all vendors related to this paket
    const vendors = await prisma.vendor.findMany({
      where: { paketId },
      include: { paket: { select: { namaPaket: true, kodePaket: true } } }
    });

    if (vendors.length === 0) {
      console.log(`⚠️ No vendors found for paket ${paketId}`);
      return { success: true, vendorCount: 0 };
    }

    // 2. Create TemuanVendor for each vendor
    const temuanVendorPromises = vendors.map(vendor =>
      prisma.temuanVendor.create({
        data: {
          vendorId: vendor.id,
          paketId,
          sourceType,
          sourceId,
          nomorTemuan,
          judul,
          deskripsi,
          tingkat,
          status: 'BARU',
          tanggalTemuan: new Date(),
        }
      })
    );

    // 3. Update vendor warning & count
    const vendorUpdatePromises = vendors.map(vendor =>
      prisma.vendor.update({
        where: { id: vendor.id },
        data: {
          warningTemuan: true,
          jumlahTemuan: { increment: 1 }
        }
      })
    );

    // 4. Create notifications for vendors
    const notificationPromises = vendors.map(vendor =>
      prisma.notification.create({
        data: {
          vendorId: vendor.id,
          type: 'TEMUAN_BARU',
          title: `Temuan Audit Baru: ${nomorTemuan}`,
          message: `Anda memiliki temuan audit ${tingkat} pada paket ${vendor.paket?.namaPaket}. Silakan segera ditindaklanjuti.`,
          entityType: 'TEMUAN',
          entityId: sourceId,
        }
      })
    );

    // Execute all in parallel
    await Promise.all([
      ...temuanVendorPromises,
      ...vendorUpdatePromises,
      ...notificationPromises
    ]);

    console.log(`✅ Created temuan for ${vendors.length} vendors`);
    return { success: true, vendorCount: vendors.length };

  } catch (error) {
    console.error('❌ Error creating temuan for vendors:', error);
    throw error;
  }
}