// src/routes/monitoring.ts
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { PaketStatus } from '../constants/enums';

const prisma = new PrismaClient();
const router = express.Router();

// Optional: jika punya middleware autentikasi.
// import { authenticateToken, authorizeRoles } from '../middleware/auth';
// router.use(authenticateToken);

/**
 * GET /api/monitoring
 * Query params:
 *  - paketId (optional)
 *  - page, limit (optional)
 */
router.get('/', async (req, res) => {
  try {
    const { paketId, page = '1', limit = '25' } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (paketId) where.paketId = paketId;

    const [items, total] = await Promise.all([
      prisma.monitoring.findMany({
        where,
        include: { paket: true, createdBy: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.monitoring.count({ where }),
    ]);

    res.json({ data: items, meta: { total, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    console.error('GET /api/monitoring error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/monitoring/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const item = await prisma.monitoring.findUnique({
      where: { id },
      include: { paket: true, createdBy: true },
    });
    if (!item) return res.status(404).json({ message: 'Monitoring not found' });
    res.json(item);
  } catch (err) {
    console.error('GET /api/monitoring/:id', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/monitoring
 * Body: { paketId, jenisMonitoring, periode, status?, progress?, issues?, rekomendasi? }
 *
 * Validation:
 *  - paketId required and paket must exist
 *  - paket must have Itwasda laporan with status 'SELESAI' (or at least a laporan)
 */
router.post('/', async (req, res) => {
  try {
    const { paketId, jenisMonitoring, periode, status, progress, issues, rekomendasi } = req.body;
    if (!paketId) return res.status(400).json({ message: 'paketId is required' });
    if (!jenisMonitoring) return res.status(400).json({ message: 'jenisMonitoring is required' });
    if (!periode) return res.status(400).json({ message: 'periode is required' });

    const paket = await prisma.paket.findUnique({
      where: { id: paketId },
      include: { laporanItwasda: true },
    });
    if (!paket) return res.status(400).json({ message: 'Paket tidak ditemukan' });

    // Check Itwasda laporan existence and (optionally) status === 'SELESAI'
    const laporan = await prisma.laporanItwasda.findFirst({
      where: { paketId },
    });
    if (!laporan) {
      return res.status(400).json({ message: 'Tidak ada laporan Itwasda untuk paket ini. Monitoring hanya bisa dibuat setelah laporan selesai.' });
    }

    // Optionally check laporan.status === 'SELESAI'
    // if (laporan.status !== 'SELESAI') {
    //  return res.status(400).json({ message: 'Laporan Itwasda belum selesai.' });
    // }

    const newItem = await prisma.monitoring.create({
      data: {
        paketId,
        jenisMonitoring,
        periode,
        status: status ?? 'DRAFT',
        progress: progress ?? 0,
        issues: issues ?? null,
        rekomendasi: rekomendasi ?? null,
        // createdById: req.user?.id // jika middleware auth memberikan req.user
      },
    });

    res.status(201).json(newItem);
  } catch (err) {
    console.error('POST /api/monitoring', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PUT /api/monitoring/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { jenisMonitoring, periode, status, progress, issues, rekomendasi } = req.body;

    const existing = await prisma.monitoring.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Monitoring not found' });

    const updated = await prisma.monitoring.update({
      where: { id },
      data: {
        jenisMonitoring: jenisMonitoring ?? existing.jenisMonitoring,
        periode: periode ?? existing.periode,
        status: status ?? existing.status,
        progress: typeof progress === 'number' ? progress : existing.progress,
        issues: issues ?? existing.issues,
        rekomendasi: rekomendasi ?? existing.rekomendasi,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('PUT /api/monitoring/:id', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * DELETE /api/monitoring/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const existing = await prisma.monitoring.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Monitoring not found' });

    await prisma.monitoring.delete({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('DELETE /api/monitoring/:id', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
