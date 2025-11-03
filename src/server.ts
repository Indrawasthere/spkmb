import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import expressListEndpoints from 'express-list-endpoints';
import { prisma } from './lib/prisma';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Allow credentials and set specific origin for CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://sipakat-bpj.com' : 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['set-cookie']
}));

app.use(cookieParser());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'image/jpeg',
      'image/png'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLSX, CSV, JPG, PNG allowed.'));
    }
  }
});

// Debug middleware to log all requests and cookies (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log('Request URL:', req.url);
    console.log('Cookies:', req.cookies);
    console.log('Headers:', req.headers);
    next();
  });
}

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret');
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token.' });
  }
};

// Role-based authorization middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'dev_jwt_secret', { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, firstName, lastName },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'dev_jwt_secret', { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ user: null });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret');
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      res.clearCookie('token', { path: '/' });
      return res.status(401).json({ user: null });
    }

    const newToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'dev_jwt_secret', { expiresIn: '7d' });
    res.cookie('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (err) {
    res.clearCookie('token');
    res.status(200).json({ user: null });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.cookie('token', '', { httpOnly: true, maxAge: 0 });
  res.json({ ok: true });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SIP-KPBJ API is running', timestamp: new Date().toISOString() });
});

// User management routes (protected)
app.get('/api/users', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, firstName, lastName, role: role || 'user' },
    });

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/api/users/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, role, isActive } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { email, firstName, lastName, role, isActive },
    });

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Paket routes (protected)
app.get('/api/paket', authenticateToken, async (req, res) => {
  try {
    const paket = await prisma.paket.findMany({
      include: { dokumen: true, laporan: true },
      orderBy: { tanggalBuat: 'desc' },
    });
    res.json(paket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch paket' });
  }
});

app.get('/api/paket/:id', authenticateToken, async (req, res) => {
  try {
    const paket = await prisma.paket.findUnique({
      where: { id: req.params.id },
      include: { dokumen: true, laporan: true },
    });
    if (!paket) return res.status(404).json({ error: 'Paket not found' });
    res.json(paket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch paket' });
  }
});

app.post('/api/paket', authenticateToken, async (req, res) => {
  try {
    const { kodePaket, namaPaket, jenisPaket, nilaiPaket, metodePengadaan, createdBy } = req.body;
    if (!kodePaket || !namaPaket || !jenisPaket || !nilaiPaket || !metodePengadaan) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const paket = await prisma.paket.create({
      data: {
        kodePaket,
        namaPaket,
        jenisPaket,
        nilaiPaket: parseFloat(nilaiPaket),
        metodePengadaan,
        createdBy: req.user.id,
      },
    });
    res.json(paket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create paket' });
  }
});

app.put('/api/paket/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      kodePaket,
      namaPaket,
      jenisPaket,
      nilaiPaket,
      metodePengadaan,
      status,
    } = req.body;

    // Validasi input wajib
    if (
      !kodePaket ||
      !namaPaket ||
      !jenisPaket ||
      nilaiPaket === undefined ||
      nilaiPaket === null ||
      isNaN(parseFloat(nilaiPaket)) ||
      !metodePengadaan
    ) {
      return res.status(400).json({ error: 'Invalid or missing fields in request body' });
    }

    // Update paket di database
    const paket = await prisma.paket.update({
      where: { id },
      data: {
        kodePaket,
        namaPaket,
        jenisPaket,
        nilaiPaket: parseFloat(nilaiPaket),
        metodePengadaan,
        status: status || undefined, // jika status tidak ada, jangan update field ini
        updatedBy: req.user.id,
        tanggalUpdate: new Date(),
      },
    });

    res.json(paket);
  } catch (error) {
    console.error('Failed to update paket:', error);
    res.status(500).json({ error: 'Failed to update paket' });
  }
});


app.delete('/api/paket/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.paket.delete({ where: { id } });
    res.json({ message: 'Paket deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete paket' });
  }
});

// Laporan Itwasda routes
app.get('/api/laporan-itwasda', authenticateToken, async (req, res) => {
  try {
    const laporan = await prisma.laporanItwasda.findMany({
      include: { paket: { select: { kodePaket: true, namaPaket: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(laporan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch laporan itwasda' });
  }
});

app.get('/api/laporan-itwasda/:id', authenticateToken, async (req, res) => {
  try {
    const laporan = await prisma.laporanItwasda.findUnique({
      where: { id: req.params.id },
      include: { paket: { select: { kodePaket: true, namaPaket: true } } },
    });
    if (!laporan) return res.status(404).json({ error: 'Laporan not found' });
    res.json(laporan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch laporan' });
  }
});

app.post('/api/laporan-itwasda', authenticateToken, async (req, res) => {
  try {
    const { nomorLaporan, paketId, jenisLaporan, deskripsi, tingkatKeparahan, auditor, pic } = req.body;
    if (!nomorLaporan || !paketId || !jenisLaporan) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const laporan = await prisma.laporanItwasda.create({
      data: {
        nomorLaporan,
        paketId,
        jenisLaporan,
        deskripsi,
        tingkatKeparahan,
        auditor,
        pic,
        tanggal: new Date(),
      },
    });
    res.json(laporan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create laporan itwasda' });
  }
});

app.put('/api/laporan-itwasda/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nomorLaporan, paketId, jenisLaporan, deskripsi, tingkatKeparahan, status, auditor, pic } = req.body;

    const laporan = await prisma.laporanItwasda.update({
      where: { id },
      data: {
        nomorLaporan,
        paketId,
        jenisLaporan,
        deskripsi,
        tingkatKeparahan,
        status,
        auditor,
        pic,
        updatedAt: new Date(),
      },
    });
    res.json(laporan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update laporan itwasda' });
  }
});

app.delete('/api/laporan-itwasda/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.laporanItwasda.delete({ where: { id } });
    res.json({ message: 'Laporan Itwasda deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete laporan itwasda' });
  }
});

// Temuan BPKP routes
app.get('/api/temuan-bpkp', authenticateToken, async (req, res) => {
  try {
    const temuan = await prisma.temuanBPKP.findMany({
      include: { paket: { select: { kodePaket: true, namaPaket: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(temuan);
  } catch (error) {
    console.error('Error fetching temuan bpkp:', error);
    res.status(500).json({ error: 'Failed to fetch temuan bpkp' });
  }
});

app.get('/api/temuan-bpkp/:id', authenticateToken, async (req, res) => {
  try {
    const temuan = await prisma.temuanBPKP.findUnique({
      where: { id: req.params.id },
      include: { paket: { select: { kodePaket: true, namaPaket: true } } },
    });
    if (!temuan) return res.status(404).json({ error: 'Temuan not found' });
    res.json(temuan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch temuan' });
  }
});

app.post('/api/temuan-bpkp', authenticateToken, async (req, res) => {
  try {
    const { nomorTemuan, paketId, jenisTemuan, deskripsi, tingkatKeparahan, auditor, pic } = req.body;
    if (!nomorTemuan || !jenisTemuan) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const temuan = await prisma.temuanBPKP.create({
      data: {
        nomorTemuan,
        paketId: paketId || null,
        jenisTemuan,
        deskripsi,
        tingkatKeparahan,
        auditor: auditor || `${req.user?.firstName || 'Unknown'} ${req.user?.lastName || 'User'}`,
        pic,
      },
    });

    res.json(temuan);
  } catch (error) {
    console.error('Error creating temuan bpkp:', error);
    res.status(500).json({ error: 'Failed to create temuan bpkp' });
  }
});

app.put('/api/temuan-bpkp/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nomorTemuan, paketId, jenisTemuan, deskripsi, tingkatKeparahan, status, auditor, pic } = req.body;

    const temuan = await prisma.temuanBPKP.update({
      where: { id },
      data: {
        nomorTemuan,
        paketId,
        jenisTemuan,
        deskripsi,
        tingkatKeparahan,
        status,
        auditor,
        pic,
        updatedAt: new Date(),
      },
    });
    res.json(temuan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update temuan bpkp' });
  }
});

app.delete('/api/temuan-bpkp/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.temuanBPKP.delete({ where: { id } });
    res.json({ message: 'Temuan BPKP deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete temuan bpkp' });
  }
});

// Proyek PUPR routes (using Paket model with jenisPaket filter)
app.get('/api/proyek-pupr', authenticateToken, async (req, res) => {
  try {
    const proyek = await prisma.paket.findMany({
      where: { jenisPaket: 'PUPR' },
      include: { dokumen: true, laporan: true },
      orderBy: { tanggalBuat: 'desc' },
    });
    res.json(proyek);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch proyek pupr' });
  }
});

app.get('/api/proyek-pupr/:id', authenticateToken, async (req, res) => {
  try {
    const proyek = await prisma.paket.findUnique({
      where: { id: req.params.id },
      include: { dokumen: true, laporan: true },
    });
    if (!proyek) return res.status(404).json({ error: 'Proyek not found' });
    res.json(proyek);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch proyek' });
  }
});

app.post('/api/proyek-pupr', authenticateToken, async (req, res) => {
  try {
    const { kodePaket, namaPaket, nilaiPaket, metodePengadaan } = req.body;
    if (!kodePaket || !namaPaket || !nilaiPaket || !metodePengadaan) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const proyek = await prisma.paket.create({
      data: {
        kodePaket,
        namaPaket,
        jenisPaket: 'PUPR',
        nilaiPaket: parseFloat(nilaiPaket),
        metodePengadaan,
        createdBy: req.user.id,
      },
    });
    res.json(proyek);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create proyek pupr' });
  }
});

app.put('/api/proyek-pupr/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { kodePaket, namaPaket, nilaiPaket, metodePengadaan, status } = req.body;

    const proyek = await prisma.paket.update({
      where: { id },
      data: {
        kodePaket,
        namaPaket,
        nilaiPaket: parseFloat(nilaiPaket),
        metodePengadaan,
        status,
        updatedBy: req.user.id,
        tanggalUpdate: new Date(),
      },
    });
    res.json(proyek);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update proyek pupr' });
  }
});

app.delete('/api/proyek-pupr/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.paket.delete({ where: { id } });
    res.json({ message: 'Proyek PUPR deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete proyek pupr' });
  }
});

// Vendor routes
app.get('/api/vendor', authenticateToken, async (req, res) => {
  try {
    const vendor = await prisma.vendor.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
});

app.get('/api/vendor/:id', authenticateToken, async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { id: req.params.id } });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
});

app.post('/api/vendor', authenticateToken, async (req, res) => {
  try {
    const { namaVendor, jenisVendor, nomorIzin, spesialisasi, kontak, alamat } = req.body;
    if (!namaVendor || !jenisVendor) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const vendor = await prisma.vendor.create({
      data: {
        namaVendor,
        jenisVendor,
        nomorIzin,
        spesialisasi,
        kontak,
        alamat,
      },
    });
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create vendor' });
  }
});

app.put('/api/vendor/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { namaVendor, jenisVendor, nomorIzin, spesialisasi, kontak, alamat, status } = req.body;

    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        namaVendor,
        jenisVendor,
        nomorIzin,
        spesialisasi,
        kontak,
        alamat,
        status,
        updatedAt: new Date(),
      },
    });
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update vendor' });
  }
});

app.delete('/api/vendor/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.vendor.delete({ where: { id } });
    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
});

// PPK routes
app.get('/api/ppk', authenticateToken, async (req, res) => {
  try {
    const ppk = await prisma.pPK.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(ppk);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch PPK' });
  }
});

app.get('/api/ppk/:id', authenticateToken, async (req, res) => {
  try {
    const ppk = await prisma.pPK.findUnique({ where: { id: req.params.id } });
    if (!ppk) return res.status(404).json({ error: 'PPK not found' });
    res.json(ppk);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch PPK' });
  }
});

app.post('/api/ppk', authenticateToken, async (req, res) => {
  try {
    const { namaLengkap, nip, jabatan, unitKerja, kompetensi, sertifikasi, pengalaman } = req.body;
    if (!namaLengkap || !nip || !jabatan) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const ppk = await prisma.pPK.create({
      data: {
        namaLengkap,
        nip,
        jabatan,
        unitKerja,
        kompetensi,
        sertifikasi,
        pengalaman: parseInt(pengalaman) || 0,
      },
    });
    res.json(ppk);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create PPK' });
  }
});

app.put('/api/ppk/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { namaLengkap, nip, jabatan, unitKerja, kompetensi, sertifikasi, pengalaman, status } = req.body;

    const ppk = await prisma.pPK.update({
      where: { id },
      data: {
        namaLengkap,
        nip,
        jabatan,
        unitKerja,
        kompetensi,
        sertifikasi,
        pengalaman: parseInt(pengalaman),
        status,
        updatedAt: new Date(),
      },
    });
    res.json(ppk);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update PPK' });
  }
});

app.delete('/api/ppk/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.pPK.delete({ where: { id } });
    res.json({ message: 'PPK deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete PPK' });
  }
});

// Monitoring routes
app.get('/api/monitoring', authenticateToken, async (req, res) => {
  try {
    const monitoring = await prisma.monitoring.findMany({
      include: { paket: { select: { kodePaket: true, namaPaket: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(monitoring);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch monitoring' });
  }
});

app.get('/api/monitoring/:id', authenticateToken, async (req, res) => {
  try {
    const monitoring = await prisma.monitoring.findUnique({
      where: { id: req.params.id },
      include: { paket: { select: { kodePaket: true, namaPaket: true } } },
    });
    if (!monitoring) return res.status(404).json({ error: 'Monitoring not found' });
    res.json(monitoring);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch monitoring' });
  }
});

app.post('/api/monitoring', authenticateToken, async (req, res) => {
  try {
    const { paketId, jenisMonitoring, periode, status, progress, issues, rekomendasi, tanggalMonitoring } = req.body;
    if (!paketId || !jenisMonitoring || !periode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const monitoring = await prisma.monitoring.create({
      data: {
        paketId,
        jenisMonitoring,
        periode,
        status: status || 'ON_TRACK',
        progress: parseInt(progress) || 0,
        issues,
        rekomendasi,
        tanggalMonitoring: tanggalMonitoring ? new Date(tanggalMonitoring) : new Date(),
        monitoredBy: req.user.id,
      },
    });
    res.json(monitoring);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create monitoring' });
  }
});

app.put('/api/monitoring/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { paketId, jenisMonitoring, periode, status, progress, issues, rekomendasi, tanggalMonitoring } = req.body;

    const monitoring = await prisma.monitoring.update({
      where: { id },
      data: {
        paketId,
        jenisMonitoring,
        periode,
        status,
        progress: parseInt(progress),
        issues,
        rekomendasi,
        tanggalMonitoring: new Date(tanggalMonitoring),
        monitoredBy: req.user.id,
        updatedAt: new Date(),
      },
    });
    res.json(monitoring);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update monitoring' });
  }
});

app.delete('/api/monitoring/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.monitoring.delete({ where: { id } });
    res.json({ message: 'Monitoring deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete monitoring' });
  }
});

// Dokumen routes
app.get('/api/dokumen', authenticateToken, async (req, res) => {
  try {
    const dokumen = await prisma.dokumen.findMany({
      include: { paket: { select: { kodePaket: true, namaPaket: true } } },
      orderBy: { uploadedAt: 'desc' },
    });
    res.json(dokumen);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dokumen' });
  }
});

app.get('/api/dokumen/:id', authenticateToken, async (req, res) => {
  try {
    const dokumen = await prisma.dokumen.findUnique({
      where: { id: req.params.id },
      include: { paket: { select: { kodePaket: true, namaPaket: true } } },
    });
    if (!dokumen) return res.status(404).json({ error: 'Dokumen not found' });
    res.json(dokumen);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dokumen' });
  }
});

app.post('/api/dokumen', authenticateToken, async (req, res) => {
  try {
    const { paketId, namaDokumen, jenisDokumen, filePath, fileSize, mimeType } = req.body;
    if (!paketId || !namaDokumen || !jenisDokumen) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const dokumen = await prisma.dokumen.create({
      data: {
        paketId,
        namaDokumen,
        jenisDokumen,
        filePath,
        fileSize: parseInt(fileSize),
        mimeType,
        uploadedBy: req.user.id,
      },
    });
    res.json(dokumen);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create dokumen' });
  }
});

app.put('/api/dokumen/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { namaDokumen, jenisDokumen, paketId, filePath, fileSize, mimeType } = req.body;

    const updateData = {
      namaDokumen,
      jenisDokumen,
      paketId,
    };

    if (filePath) {
      updateData.filePath = filePath;
      updateData.fileSize = parseInt(fileSize);
      updateData.mimeType = mimeType;
    }

    const dokumen = await prisma.dokumen.update({
      where: { id },
      data: updateData,
    });
    res.json(dokumen);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update dokumen' });
  }
});

app.delete('/api/dokumen/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.dokumen.delete({ where: { id } });
    res.json({ message: 'Dokumen deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete dokumen' });
  }
});

// Upload dokumen dengan file handling
app.post('/api/dokumen/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { paketId, jenisDokumen } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!paketId || !jenisDokumen) {
      return res.status(400).json({ error: 'Paket ID and jenis dokumen are required' });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Save file to disk
    const filePath = path.join(uploadsDir, uniqueFilename);
    fs.writeFileSync(filePath, file.buffer);

    // Save to database
        // Save to database
    const dokumen = await prisma.dokumen.create({
      data: {
        paketId,
        namaDokumen: file.originalname,
        jenisDokumen,
        filePath: `/uploads/${uniqueFilename}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy: req.user.id,
      },
    });

    res.json(dokumen);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload dokumen' });
  }
});

// Laporan Analisis routes
app.get('/api/laporan-analisis', authenticateToken, async (req, res) => {
  try {
    const laporan = await prisma.laporanAnalisis.findMany({
      orderBy: { generatedAt: 'desc' },
    });
    res.json(laporan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch laporan analisis' });
  }
});

app.get('/api/laporan-analisis/:id', authenticateToken, async (req, res) => {
  try {
    const laporan = await prisma.laporanAnalisis.findUnique({
      where: { id: req.params.id },
    });
    if (!laporan) return res.status(404).json({ error: 'Laporan analisis not found' });
    res.json(laporan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch laporan analisis' });
  }
});

app.post('/api/laporan-analisis', authenticateToken, async (req, res) => {
  try {
    const { jenisLaporan, periode, data, kesimpulan, rekomendasi } = req.body;
    if (!jenisLaporan || !periode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const laporan = await prisma.laporanAnalisis.create({
      data: {
        jenisLaporan,
        periode,
        data,
        kesimpulan,
        rekomendasi,
        generatedBy: req.user.id,
      },
    });
    res.json(laporan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create laporan analisis' });
  }
});

app.put('/api/laporan-analisis/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { jenisLaporan, periode, data, kesimpulan, rekomendasi } = req.body;

    const laporan = await prisma.laporanAnalisis.update({
      where: { id },
      data: {
        jenisLaporan,
        periode,
        data,
        kesimpulan,
        rekomendasi,
        generatedBy: req.user.id,
      },
    });
    res.json(laporan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update laporan analisis' });
  }
});

app.delete('/api/laporan-analisis/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.laporanAnalisis.delete({ where: { id } });
    res.json({ message: 'Laporan analisis deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete laporan analisis' });
  }
});

// Role routes
app.get('/api/roles', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const roles = await prisma.role.findMany();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

app.post('/api/roles', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Role name is required' });
    }

    const role = await prisma.role.create({
      data: {
        name,
        description,
        permissions,
      },
    });
    res.json(role);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create role' });
  }
});

app.put('/api/roles/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    const role = await prisma.role.update({
      where: { id },
      data: {
        name,
        description,
        permissions,
      },
    });
    res.json(role);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update role' });
  }
});

app.delete('/api/roles/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.role.delete({ where: { id } });
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete role' });
  }
});

// Permission routes
app.get('/api/permissions', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const permissions = await prisma.permission.findMany();
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

app.post('/api/permissions', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Permission name is required' });
    }

    const permission = await prisma.permission.create({
      data: {
        name,
        description,
      },
    });
    res.json(permission);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create permission' });
  }
});

app.put('/api/permissions/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const permission = await prisma.permission.update({
      where: { id },
      data: {
        name,
        description,
      },
    });
    res.json(permission);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update permission' });
  }
});

app.delete('/api/permissions/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.permission.delete({ where: { id } });
    res.json({ message: 'Permission deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete permission' });
  }
});

// Dashboard/Analytics routes (new)
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const [paketCount, laporanCount, vendorCount, ppkCount] = await Promise.all([
      prisma.paket.count(),
      prisma.laporanItwasda.count(),
      prisma.vendor.count(),
      prisma.pPK.count(),
    ]);

    res.json({
      paket: paketCount,
      laporan: laporanCount,
      vendor: vendorCount,
      ppk: ppkCount,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

app.get('/api/dashboard/recent-activity', authenticateToken, async (req, res) => {
  try {
    const [recentPaket, recentLaporan] = await Promise.all([
      prisma.paket.findMany({
        take: 5,
        orderBy: { tanggalBuat: 'desc' },
        select: { id: true, kodePaket: true, namaPaket: true, tanggalBuat: true },
      }),
      prisma.laporanItwasda.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, nomorLaporan: true, jenisLaporan: true, createdAt: true },
      }),
    ]);

    res.json({
      recentPaket,
      recentLaporan,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

// Search routes (new)
app.get('/api/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const [paket, laporan, vendor, ppk] = await Promise.all([
      prisma.paket.findMany({
        where: {
          OR: [
            { kodePaket: { contains: q, mode: 'insensitive' } },
            { namaPaket: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, kodePaket: true, namaPaket: true, jenisPaket: true },
        take: 10,
      }),
      prisma.laporanItwasda.findMany({
        where: {
          OR: [
            { nomorLaporan: { contains: q, mode: 'insensitive' } },
            { jenisLaporan: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, nomorLaporan: true, jenisLaporan: true },
        take: 10,
      }),
      prisma.vendor.findMany({
        where: {
          namaVendor: { contains: q, mode: 'insensitive' },
        },
        select: { id: true, namaVendor: true, jenisVendor: true },
        take: 10,
      }),
      prisma.pPK.findMany({
        where: {
          namaLengkap: { contains: q, mode: 'insensitive' },
        },
        select: { id: true, namaLengkap: true, jabatan: true },
        take: 10,
      }),
    ]);

    res.json({
      paket,
      laporan,
      vendor,
      ppk,
    });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  res.status(500).json({ error: 'Something went wrong!' });
});

// API endpoints list
app.get('/', (req, res) => {
  const routes = expressListEndpoints(app);
  res.json(routes);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Serve static files from the React app build directory
app.use(express.static('dist'));

// Catch all handler: send back React's index.html file for any non-API routes
app.use((req, res) => {
  res.sendFile('index.html', { root: 'dist' });
});

// Start server
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 SIP-KPBJ API server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});