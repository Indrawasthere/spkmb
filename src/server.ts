import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import { prisma } from './lib/prisma';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLSX, CSV allowed.'));
    }
  }
});

// Debug middleware to log all requests and cookies
app.use((req, res, next) => {
  console.log('Request URL:', req.url);
  console.log('Cookies:', req.cookies);
  console.log('Headers:', req.headers);
  next();
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    console.log('Found user:', user ? { ...user, password: '[REDACTED]' } : null);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Sign JWT and set as HttpOnly cookie
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'dev_jwt_secret', { expiresIn: '7d' });
    
    // Set cookie with development-friendly options (no domain)
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Set to false for development
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    console.log('Login successful, token set:', { token: token.substring(0, 20) + '...' });

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

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
      },
    });

    // Sign JWT and set cookie
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
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Return current user from token cookie and refresh token
app.get('/api/auth/me', async (req, res) => {
  // Disable caching for auth endpoints
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  try {
    const token = req.cookies?.token;
    console.log('Received token:', token); // Debug log
    
    if (!token) {
      console.log('No token found'); // Debug log
      return res.status(401).json({ user: null });
    }
    
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret');
    console.log('Decoded token:', decoded); // Debug log
    
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    console.log('Found user:', user); // Debug log
    
    if (!user) {
      console.log('No user found for token'); // Debug log
      res.clearCookie('token', { path: '/' });
      return res.status(401).json({ user: null });
    }

    // Refresh token
    const newToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'dev_jwt_secret',
      { expiresIn: '7d' }
    );

    // Set refreshed token cookie
    res.cookie('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SIP-KPBJ API is running' });
});

// User routes
app.get('/api/users', async (req, res) => {
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

// Paket routes
app.get('/api/paket', async (req, res) => {
  try {
    const paket = await prisma.paket.findMany({
      include: {
        dokumen: true,
        laporan: true,
      },
    });
    res.json(paket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch paket' });
  }
});

app.post('/api/paket', async (req, res) => {
  try {
    console.log('Creating paket with data:', req.body);
    const { kodePaket, namaPaket, jenisPaket, nilaiPaket, metodePengadaan, createdBy } = req.body;

    if (!kodePaket || !namaPaket || !jenisPaket || !nilaiPaket || !metodePengadaan || !createdBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const paket = await prisma.paket.create({
      data: {
        kodePaket,
        namaPaket,
        jenisPaket,
        nilaiPaket: parseFloat(nilaiPaket),
        metodePengadaan,
        createdBy,
      },
    });
    console.log('Paket created successfully:', paket);
    res.json(paket);
  } catch (error) {
    console.error('Error creating paket:', error);
    res.status(500).json({ error: 'Failed to create paket' });
  }
});

// Laporan Itwasda routes
app.get('/api/itwasda', async (req, res) => {
  try {
    const laporan = await prisma.laporanItwasda.findMany({
      include: {
        paket: {
          select: {
            kodePaket: true,
            namaPaket: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(laporan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch laporan itwasda' });
  }
});

app.post('/api/itwasda', async (req, res) => {
  try {
    const {
      nomorLaporan,
      paketId,
      jenisLaporan,
      deskripsi,
      tingkatKeparahan,
      auditor,
      pic,
    } = req.body;

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

// Vendor routes
app.get('/api/vendor', async (req, res) => {
  try {
    const vendor = await prisma.vendor.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
});

app.post('/api/vendor', async (req, res) => {
  try {
    const {
      namaVendor,
      jenisVendor,
      nomorIzin,
      spesialisasi,
      kontak,
      alamat,
    } = req.body;

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

// PPK routes
app.get('/api/ppk', async (req, res) => {
  try {
    const ppk = await prisma.pPK.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(ppk);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch PPK' });
  }
});

// Monitoring routes
app.get('/api/monitoring', async (req, res) => {
  try {
    const monitoring = await prisma.monitoring.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(monitoring);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch monitoring' });
  }
});



app.put('/api/dokumen/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { namaDokumen, jenisDokumen, paketId, filePath, fileSize, mimeType } = req.body;

    const updateData: any = {
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

app.delete('/api/dokumen/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.dokumen.delete({
      where: { id },
    });
    res.json({ message: 'Dokumen deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete dokumen' });
  }
});

app.post('/api/monitoring', async (req, res) => {
  try {
    const {
      paketId,
      jenisMonitoring,
      periode,
      status,
      progress,
      issues,
      rekomendasi,
      tanggalMonitoring,
      monitoredBy,
    } = req.body;

    const monitoring = await prisma.monitoring.create({
      data: {
        paketId,
        jenisMonitoring,
        periode,
        status: status || 'ON_TRACK',
        progress: parseInt(progress) || 0,
        issues,
        rekomendasi,
        tanggalMonitoring: new Date(tanggalMonitoring),
        monitoredBy,
      },
    });
    res.json(monitoring);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create monitoring' });
  }
});

// Laporan Analisis routes
app.get('/api/laporan-analisis', async (req, res) => {
  try {
    const laporan = await prisma.laporanAnalisis.findMany({
      orderBy: {
        generatedAt: 'desc',
      },
    });
    res.json(laporan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch laporan analisis' });
  }
});

app.post('/api/laporan-analisis', async (req, res) => {
  try {
    const {
      jenisLaporan,
      periode,
      data,
      kesimpulan,
      rekomendasi,
      generatedBy,
    } = req.body;

    const laporan = await prisma.laporanAnalisis.create({
      data: {
        jenisLaporan,
        periode,
        data,
        kesimpulan,
        rekomendasi,
        generatedBy,
      },
    });
    res.json(laporan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create laporan analisis' });
  }
});

// Role routes
app.get('/api/roles', async (req, res) => {
  try {
    const roles = await prisma.role.findMany();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

app.post('/api/roles', async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

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

// Permission routes
app.get('/api/permissions', async (req, res) => {
  try {
    const permissions = await prisma.permission.findMany();
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

// Dokumen routes
app.get('/api/dokumen', async (req, res) => {
  try {
    const dokumen = await prisma.dokumen.findMany({
      include: {
        paket: {
          select: {
            kodePaket: true,
            namaPaket: true,
          },
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });
    res.json(dokumen);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dokumen' });
  }
});

app.post('/api/dokumen', async (req, res) => {
  try {
    const {
      paketId,
      namaDokumen,
      jenisDokumen,
      filePath,
      fileSize,
      mimeType,
      uploadedBy,
    } = req.body;

    const dokumen = await prisma.dokumen.create({
      data: {
        paketId,
        namaDokumen,
        jenisDokumen,
        filePath,
        fileSize: parseInt(fileSize),
        mimeType,
        uploadedBy,
      },
    });
    res.json(dokumen);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create dokumen' });
  }
});

// Upload dokumen dengan file handling
app.post('/api/dokumen/upload', upload.single('file'), async (req, res) => {
  try {
    const { paketId, jenisDokumen } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate unique filename
    const fileExtension = file.originalname.split('.').pop();
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;

    // Create uploads directory if it doesn't exist
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, 'uploads');

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Move file to uploads directory
    const filePath = path.join(uploadsDir, uniqueFilename);
    fs.writeFileSync(filePath, file.buffer);

    // Get user from token
    const token = req.cookies?.token;
    let uploadedBy = 'system';

    if (token) {
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret');
        uploadedBy = decoded.userId;
      } catch (err) {
        // Continue with system user
      }
    }

    // Save to database
    const dokumen = await prisma.dokumen.create({
      data: {
        paketId,
        namaDokumen: file.originalname,
        jenisDokumen,
        filePath: `/uploads/${uniqueFilename}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy,
      },
    });

    res.json(dokumen);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload dokumen' });
  }
});

// PUT routes for CRUD completion
app.put('/api/paket/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { kodePaket, namaPaket, jenisPaket, nilaiPaket, metodePengadaan, status, updatedBy } = req.body;

    const paket = await prisma.paket.update({
      where: { id },
      data: {
        kodePaket,
        namaPaket,
        jenisPaket,
        nilaiPaket: parseFloat(nilaiPaket),
        metodePengadaan,
        status,
        updatedBy,
        tanggalUpdate: new Date(),
      },
    });
    res.json(paket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update paket' });
  }
});

app.put('/api/vendor/:id', async (req, res) => {
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

app.put('/api/ppk/:id', async (req, res) => {
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

app.put('/api/itwasda/:id', async (req, res) => {
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

app.put('/api/monitoring/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { paketId, jenisMonitoring, periode, status, progress, issues, rekomendasi, tanggalMonitoring, monitoredBy } = req.body;

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
        monitoredBy,
        updatedAt: new Date(),
      },
    });
    res.json(monitoring);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update monitoring' });
  }
});

// DELETE routes for CRUD completion
app.delete('/api/paket/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.paket.delete({
      where: { id },
    });
    res.json({ message: 'Paket deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete paket' });
  }
});

app.delete('/api/vendor/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.vendor.delete({
      where: { id },
    });
    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
});

app.delete('/api/ppk/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.pPK.delete({
      where: { id },
    });
    res.json({ message: 'PPK deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete PPK' });
  }
});

app.delete('/api/itwasda/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.laporanItwasda.delete({
      where: { id },
    });
    res.json({ message: 'Laporan Itwasda deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete laporan itwasda' });
  }
});

app.delete('/api/monitoring/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.monitoring.delete({
      where: { id },
    });
    res.json({ message: 'Monitoring deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete monitoring' });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
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
app.listen(PORT, '0.0.0.0', () => {
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
