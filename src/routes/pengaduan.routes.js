const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Generate ticket number
function generateTicketNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `TKT-${year}${month}${day}${random}`;
}

// Submit pengaduan dari masyarakat
router.post('/masyarakat', async (req, res) => {
  try {
    const { nama, email, telepon, judul, isi, kategori } = req.body;

    const pengaduan = await prisma.pengaduan.create({
      data: {
        judul,
        isi,
        pelapor: nama,
        status: 'BARU',
        tanggal: new Date(),
        email,
        telepon,
        kategori,
        nomor_tiket: generateTicketNumber(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Pengaduan berhasil dikirim',
      id: pengaduan.id,
      nomor_tiket: pengaduan.nomor_tiket
    });
  } catch (error) {
    console.error('Create pengaduan error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengirim pengaduan'
    });
  }
});

// Tracking pengaduan by ticket number
router.get('/tracking/:nomorTiket', async (req, res) => {
  try {
    const { nomorTiket } = req.params;

    const pengaduan = await prisma.pengaduan.findFirst({
      where: {
        nomor_tiket: nomorTiket.toUpperCase()
      },
      select: {
        id: true,
        judul: true,
        status: true,
        tanggal: true,
        nomor_tiket: true,
        createdAt: true
      }
    });

    if (!pengaduan) {
      return res.status(404).json({
        success: false,
        message: 'Nomor tiket tidak ditemukan'
      });
    }

    res.json(pengaduan);
  } catch (error) {
    console.error('Tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memeriksa status pengaduan'
    });
  }
});

module.exports = router;