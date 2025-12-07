import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import expressListEndpoints from 'express-list-endpoints';
import { prisma } from './lib/prisma.js';
import path from 'path';
import fs from 'fs';
import { createTemuanForVendors } from './utils/temuanHelper.js';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
      };
      isPortalSubdomain?: boolean;
      isDevelopment?: boolean;
    }
  }
}

// Load environment variables
dotenv.config();

const validateEnvironment = () => {
  const required = ['JWT_SECRET', 'DATABASE_URL'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);

    if (IS_PRODUCTION) {
      console.error('🚨 CRITICAL: Cannot start in production without env vars');
      process.exit(1);
    } else {
      console.log('⚠️  Development mode: Using default values');
    }
  }
};

validateEnvironment();

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Enhanced Helmet configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: [
          "'self'",
          'https://sipakat-bpj.com',
          'https://portal.sipakat-bpj.com',
          'https://www.sipakat-bpj.com',
        ],
        fontSrc: ["'self'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // ✅ TAMBAH untuk file serving
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // ✅ TAMBAH
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:5173',
        'https://localhost:5173',
        'http://localhost:3000',
        'https://localhost:3000',
        'http://localhost:3001',
        'https://localhost:3001',
        // PRODUCTION DOMAINS
        'https://sipakat-bpj.com',
        'https://www.sipakat-bpj.com',
        'https://portal.sipakat-bpj.com',
        // Development subdomains
        'http://portal.localhost:3001',
        'https://portal.localhost:3001',
        'http://sipakat.localhost:3001',
        'https://sipakat.localhost:3001',
        /\.sipakat-bpj\.com$/,
        /\.devtunnels\.ms$/,
        /\.ngrok-free\.app$/,
      ];

      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.some((pattern) =>
        pattern instanceof RegExp ? pattern.test(origin) : origin === pattern
      );

      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`❌ Blocked by CORS: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['set-cookie'],
    maxAge: 86400, // 24 hours
  })
);

// ============================================
// MIDDLEWARE: Domain & Environment Detection
// ============================================
app.use((req, res, next) => {
  const host = req.get('host') || '';

  req.isPortalSubdomain = host.includes('portal.');

  req.isDevelopment = !IS_PRODUCTION;

  next();
});

// ============================================
// ROOT ROUTE HANDLER
// ============================================
app.get('/', (req, res) => {
  if (req.isPortalSubdomain) {
    return res.sendFile(path.join(process.cwd(), 'public', 'portal-pengaduan.html'));
  }

  if (IS_PRODUCTION) {
    return res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
  }

  return res.json({
    message: 'SIPAKAT BPJ API - Development Mode',
    version: '2.0.1',
    timestamp: new Date().toISOString(),
    endpoints: {
      admin: 'http://sipakat.localhost:3001',
      portal: 'http://portal.localhost:3001',
      api: 'http://localhost:3001/api',
      health: 'http://localhost:3001/api/health',
      docs: 'http://localhost:3001/api/endpoints',
    },
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
  });
});

// ============================================
// TRACKING PAGE (untuk portal subdomain)
// ============================================
app.get('/tracking', (req, res) => {
  // Only serve tracking page on portal subdomain
  if (req.isPortalSubdomain) {
    return res.sendFile(path.join(process.cwd(), 'public', 'portal-pengaduan-tracking.html'));
  }

  // Redirect to main domain if accessed from wrong domain
  res.redirect('https://portal.sipakat-bpj.com/tracking');
});

// Trust proxy for production
app.set('trust proxy', true);

// Middleware
app.use(cookieParser());
app.use(morgan(IS_PRODUCTION ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files - CRITICAL for file serving
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files with proper headers
app.use(
  '/uploads',
  express.static(uploadsDir, {
    setHeaders: (res, filePath) => {
      // Set proper content types
      if (filePath.endsWith('.pdf')) {
        res.setHeader('Content-Type', 'application/pdf');
      } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/jpeg');
      } else if (filePath.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      }

      // Security headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    },
    maxAge: '1y',
    immutable: true,
  })
);

// Multer configuration with security enhancements
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const ext = path.extname(sanitizedName);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5, // Max 5 files per request (temporary)
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'image/jpeg',
      'image/png',
      'image/jpg',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type: ${file.mimetype}. Only PDF, DOC, DOCX, XLSX, CSV, JPG, PNG allowed.`
        )
      );
    }
  },
});

// Authentication middleware with enhanced security
const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret') as JwtPayload;

    if (!decoded.userId) {
      return res.status(403).json({ error: 'Invalid token format.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired.' });
    }
    return res.status(403).json({ error: 'Invalid token.' });
  }
};

// Role-based authorization with better error messages
const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role.toLowerCase())) {
      return res.status(403).json({
        error: 'Access denied. Insufficient permissions.',
        requiredRoles: roles,
        userRole: req.user.role,
      });
    }

    next();
  };
};

// Utility function to safely delete files
const deleteFile = (filePath: string): boolean => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`🗑️ Deleted file: ${fullPath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Failed to delete file: ${filePath}`, error);
    return false;
  }
};
// ============================================
// PORTAL PENGADUAN ROUTES (ADVANCED)
// ============================================

// Serve portal pengaduan utama
app.get('/portal', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'portal-pengaduan.html'));
});

// Serve tracking page
app.get('/portal/tracking', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'portal-pengaduan-tracking.html'));
});

// API untuk get history pengaduan by email
app.get('/api/pengaduan/history/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const pengaduan = await prisma.pengaduan.findMany({
      where: { email },
      select: {
        id: true,
        nomor_tiket: true,
        judul: true,
        status: true,
        tanggal: true,
        createdAt: true,
        kategori: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({
      success: true,
      data: pengaduan,
    });
  } catch (error) {
    console.error('Fetch history error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil history pengaduan',
    });
  }
});

// ============================================
// PORTAL PENGADUAN SUBDOMAIN ROUTES
// ============================================

// Middleware untuk detect subdomain
app.use((req, res, next) => {
  req.isPortalSubdomain = req.get('host')?.includes('portal.') || false;
  next();
});

// Serve portal pengaduan ketika akses dari portal.sipakat-bpj.com
app.get('/', (req, res) => {
  if (req.isPortalSubdomain) {
    return res.sendFile(path.join(process.cwd(), 'public', 'portal-pengaduan.html'));
  }

  // Default behavior untuk domain utama
  if (IS_PRODUCTION) {
    res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
  } else {
    res.json({ message: 'SIPAKAT BPJ API' });
  }
});

// Route tracking untuk subdomain
app.get('/tracking', (req, res) => {
  if (req.isPortalSubdomain) {
    return res.sendFile(path.join(process.cwd(), 'public', 'portal-pengaduan-tracking.html'));
  }
  next();
});

// ============================================
// AUTH ROUTES
// ============================================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is inactive. Contact administrator.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const tokenExpiry = rememberMe ? '7d' : '6h';
    const cookieMaxAge = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 6 * 60 * 60 * 1000;

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'dev_jwt_secret', {
      expiresIn: tokenExpiry,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: cookieMaxAge,
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'AUTH',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
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
    const { email, password, firstName, lastName, role, isActive } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role || 'USER',
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'dev_jwt_secret', {
      expiresIn: '7d',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret') as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      res.clearCookie('token');
      return res.status(401).json({ user: null });
    }

    // Refresh token
    //  const newToken = jwt.sign(
    //    { userId: user.id },
    //    process.env.JWT_SECRET || 'dev_jwt_secret',
    //    { expiresIn: '7d' }
    //  );
    //
    //  res.cookie('token', newToken, {
    //    httpOnly: true,
    //    secure: IS_PRODUCTION,
    //    sameSite: IS_PRODUCTION ? 'strict' : 'lax',
    //    maxAge: 7 * 24 * 60 * 60 * 1000,
    //  });

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
    res.clearCookie('token');
    res.status(200).json({ user: null });
  }
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    // Log audit
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'LOGOUT',
          entity: 'AUTH',
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });
    }

    res.clearCookie('token', {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: IS_PRODUCTION ? 'strict' : 'lax',
    });

    res.json({ ok: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// ============================================
// USER MANAGEMENT ROUTES (FIXED!)
// ============================================

// GET all users - Admin only
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
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET single user - Admin only
app.get('/api/users/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Fetch user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST create user - Admin only
app.post('/api/users', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, isActive } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role || 'USER',
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE',
        entity: 'USER',
        entityId: user.id,
        details: { email: user.email, role: user.role },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT update user - Admin only (can update anyone) or Self (can only update own profile)
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, role, isActive, password } = req.body;

    const isSelfUpdate = req.user!.id === id;
    const isAdmin = req.user!.role.toLowerCase() === 'admin';

    if (!isSelfUpdate && !isAdmin) {
      return res
        .status(403)
        .json({ error: 'Access denied. You can only update your own account.' });
    }

    const updateData: any = {};

    // Self-update fields
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;

    // Password update (self only)
    if (password && password.trim()) {
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      }
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Admin-only fields
    if (isAdmin) {
      if (role !== undefined) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;
    }

    // Check email uniqueness
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: { email, NOT: { id } },
      });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE',
        entity: 'USER',
        entityId: user.id,
        details: updateData,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// PATCH toggle user status - Admin only (NEW!)
app.patch('/api/users/:id/status', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean' });
    }

    // Prevent admin from deactivating themselves
    if (req.user!.id === id && !isActive) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_STATUS',
        entity: 'USER',
        entityId: user.id,
        details: { isActive, previousStatus: !isActive },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ error: 'Failed to toggle user status' });
  }
});

// DELETE user - Admin only
app.delete('/api/users/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (req.user!.id === id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if user exists
    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (!userToDelete) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.user.delete({ where: { id } });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'DELETE',
        entity: 'USER',
        entityId: id,
        details: { email: userToDelete.email, role: userToDelete.role },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ============================================
// PAKET ROUTES
// ============================================

app.get('/api/paket', authenticateToken, async (req, res) => {
  try {
    const paket = await prisma.paket.findMany({
      include: {
        dokumen: true,
        laporan: true,
        temuanBPKP: true,
        ppkData: true,
      },
      orderBy: { tanggalBuat: 'desc' },
    });
    res.json(paket);
  } catch (error) {
    console.error('Fetch paket error:', error);
    res.status(500).json({ error: 'Failed to fetch paket' });
  }
});

app.get('/api/paket/:id', authenticateToken, async (req, res) => {
  try {
    const paket = await prisma.paket.findUnique({
      where: { id: req.params.id },
      include: {
        dokumen: true,
        laporan: true,
        temuanBPKP: true,
        ppkData: true,
      },
    });

    if (!paket) {
      return res.status(404).json({ error: 'Paket not found' });
    }

    res.json(paket);
  } catch (error) {
    console.error('Fetch paket error:', error);
    res.status(500).json({ error: 'Failed to fetch paket' });
  }
});

app.post('/api/paket', authenticateToken, upload.single('dokumenKontrak'), async (req, res) => {
  try {
    const {
      kodePaket,
      kodeRUP,
      namaPaket,
      jenisPaket,
      nilaiPaket,
      metodePengadaan,
      tanggalMulai,
      tanggalSelesai,
      status,
    } = req.body;

    if (!kodePaket || !namaPaket || !jenisPaket || !nilaiPaket || !metodePengadaan) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check for duplicate kodePaket
    const existingPaket = await prisma.paket.findUnique({ where: { kodePaket } });
    if (existingPaket) {
      return res.status(400).json({ error: 'Kode paket already exists' });
    }

    const file = req.file;
    let dokumenKontrak = null;
    if (file) {
      dokumenKontrak = `/uploads/${file.filename}`;
    }

    const tanggalMulaiDate = tanggalMulai ? new Date(tanggalMulai) : null;
    const tanggalSelesaiDate = tanggalSelesai ? new Date(tanggalSelesai) : null;

    let lamaProyek = null;
    if (tanggalMulaiDate && tanggalSelesaiDate) {
      const diffTime = Math.abs(tanggalSelesaiDate.getTime() - tanggalMulaiDate.getTime());
      lamaProyek = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const paket = await prisma.paket.create({
      data: {
        kodePaket,
        kodeRUP: kodeRUP || null,
        namaPaket,
        jenisPaket,
        nilaiPaket: parseFloat(nilaiPaket),
        metodePengadaan,
        status: status || 'DRAFT',
        tanggalMulai: tanggalMulaiDate,
        tanggalSelesai: tanggalSelesaiDate,
        lamaProyek,
        dokumenKontrak,
        createdBy: req.user!.id,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE',
        entity: 'PAKET',
        entityId: paket.id,
        details: { kodePaket, namaPaket },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json(paket);
  } catch (error) {
    console.error('Create paket error:', error);
    res.status(500).json({ error: 'Failed to create paket' });
  }
});

app.put('/api/paket/:id', authenticateToken, upload.single('dokumenKontrak'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      kodePaket,
      kodeRUP,
      namaPaket,
      jenisPaket,
      nilaiPaket,
      metodePengadaan,
      status,
      tanggalMulai,
      tanggalSelesai,
    } = req.body;

    if (!kodePaket || !namaPaket || !jenisPaket || !nilaiPaket || !metodePengadaan) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if paket exists
    const existingPaket = await prisma.paket.findUnique({ where: { id } });
    if (!existingPaket) {
      return res.status(404).json({ error: 'Paket not found' });
    }

    // Check for duplicate kodePaket (excluding current paket)
    if (kodePaket !== existingPaket.kodePaket) {
      const duplicatePaket = await prisma.paket.findUnique({ where: { kodePaket } });
      if (duplicatePaket) {
        return res.status(400).json({ error: 'Kode paket already exists' });
      }
    }

    const tanggalMulaiDate = tanggalMulai ? new Date(tanggalMulai) : undefined;
    const tanggalSelesaiDate = tanggalSelesai ? new Date(tanggalSelesai) : undefined;

    let lamaProyek = undefined;
    if (tanggalMulaiDate && tanggalSelesaiDate) {
      const diffTime = Math.abs(tanggalSelesaiDate.getTime() - tanggalMulaiDate.getTime());
      lamaProyek = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const file = req.file;
    let dokumenKontrak = undefined;
    if (file) {
      // Delete old file if exists
      if (existingPaket.dokumenKontrak) {
        deleteFile(existingPaket.dokumenKontrak);
      }
      dokumenKontrak = `/uploads/${file.filename}`;
    }

    const paket = await prisma.paket.update({
      where: { id },
      data: {
        kodePaket,
        kodeRUP: kodeRUP || null,
        namaPaket,
        jenisPaket,
        nilaiPaket: parseFloat(nilaiPaket),
        metodePengadaan,
        status: status || undefined,
        tanggalMulai: tanggalMulaiDate,
        tanggalSelesai: tanggalSelesaiDate,
        lamaProyek,
        dokumenKontrak,
        updatedBy: req.user!.id,
        tanggalUpdate: new Date(),
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE',
        entity: 'PAKET',
        entityId: paket.id,
        details: { kodePaket, namaPaket },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json(paket);
  } catch (error) {
    console.error('Update paket error:', error);
    res.status(500).json({ error: 'Failed to update paket' });
  }
});

app.delete('/api/paket/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const paket = await prisma.paket.findUnique({
      where: { id },
      include: { dokumen: true },
    });

    if (!paket) {
      return res.status(404).json({ error: 'Paket not found' });
    }

    // Delete associated files
    if (paket.dokumenKontrak) {
      deleteFile(paket.dokumenKontrak);
    }

    // Delete all associated dokumen files
    for (const doc of paket.dokumen) {
      if (doc.filePath) {
        deleteFile(doc.filePath);
      }
    }

    // Delete paket (cascade will handle relations)
    await prisma.paket.delete({ where: { id } });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'DELETE',
        entity: 'PAKET',
        entityId: id,
        details: { kodePaket: paket.kodePaket, namaPaket: paket.namaPaket },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ message: 'Paket and associated files deleted successfully' });
  } catch (error) {
    console.error('Delete paket error:', error);
    res.status(500).json({ error: 'Failed to delete paket' });
  }
});

// ============================================
// LAPORAN ITWASDA ROUTES
// ============================================

app.get('/api/laporan-itwasda', authenticateToken, async (req, res) => {
  try {
    const laporan = await prisma.laporanItwasda.findMany({
      include: {
        paket: { select: { kodePaket: true, namaPaket: true } },
        dokumen: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(laporan);
  } catch (error) {
    console.error('Fetch laporan itwasda error:', error);
    res.status(500).json({ error: 'Failed to fetch laporan itwasda' });
  }
});

app.get('/api/laporan-itwasda/:id', authenticateToken, async (req, res) => {
  try {
    const laporan = await prisma.laporanItwasda.findUnique({
      where: { id: req.params.id },
      include: {
        paket: { select: { kodePaket: true, namaPaket: true } },
        dokumen: true,
      },
    });

    if (!laporan) {
      return res.status(404).json({ error: 'Laporan not found' });
    }

    res.json(laporan);
  } catch (error) {
    console.error('Fetch laporan error:', error);
    res.status(500).json({ error: 'Failed to fetch laporan' });
  }
});

app.post('/api/laporan-itwasda', authenticateToken, upload.single('filePath'), async (req, res) => {
  try {
    const { nomorLaporan, paketId, jenisLaporan, deskripsi, tingkatKualitasTemuan, auditor, pic } =
      req.body;

    if (!nomorLaporan || !jenisLaporan) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check for duplicate nomorLaporan
    const existingLaporan = await prisma.laporanItwasda.findUnique({ where: { nomorLaporan } });
    if (existingLaporan) {
      return res.status(400).json({ error: 'Nomor laporan already exists' });
    }

    const file = req.file;
    let filePath = null;
    if (file) {
      filePath = `/uploads/${file.filename}`;
    }

    // 1. Create laporan
    const laporan = await prisma.laporanItwasda.create({
      data: {
        nomorLaporan,
        paketId: paketId || null,
        jenisLaporan,
        deskripsi: deskripsi || '',
        tingkatKualitasTemuan: tingkatKualitasTemuan || 'RENDAH',
        auditor: auditor || `${req.user!.firstName} ${req.user!.lastName}`,
        pic: pic || '',
        tanggal: new Date(),
        filePath,
      },
    });

    if (paketId) {
      try {
        await createTemuanForVendors({
          paketId,
          sourceType: 'ITWASDA',
          sourceId: laporan.id,
          nomorTemuan: nomorLaporan,
          judul: `Temuan Audit Itwasda: ${jenisLaporan}`,
          deskripsi: deskripsi || 'Lihat detail laporan untuk informasi lengkap',
          tingkat: tingkatKualitasTemuan || 'RENDAH',
          createdByUserId: req.user!.id,
        });
      } catch (error) {
        console.error('⚠️ Error creating temuan for vendors (non-fatal):', error);
        // Don't fail the main operation
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE',
        entity: 'LAPORAN_ITWASDA',
        entityId: laporan.id,
        details: { nomorLaporan, jenisLaporan, paketId },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({
      success: true,
      message: 'Laporan berhasil dibuat dan vendor telah diberitahu',
      data: laporan,
    });
  } catch (error) {
    console.error('Create laporan itwasda error:', error);
    res.status(500).json({ error: 'Failed to create laporan itwasda' });
  }
});

app.put(
  '/api/laporan-itwasda/:id',
  authenticateToken,
  upload.single('filePath'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        nomorLaporan,
        paketId,
        jenisLaporan,
        deskripsi,
        tingkatKualitasTemuan,
        status,
        auditor,
        pic,
      } = req.body;

      const existingLaporan = await prisma.laporanItwasda.findUnique({ where: { id } });
      if (!existingLaporan) {
        return res.status(404).json({ error: 'Laporan not found' });
      }

      // Check for duplicate nomorLaporan (excluding current)
      if (nomorLaporan && nomorLaporan !== existingLaporan.nomorLaporan) {
        const duplicateLaporan = await prisma.laporanItwasda.findUnique({
          where: { nomorLaporan },
        });
        if (duplicateLaporan) {
          return res.status(400).json({ error: 'Nomor laporan already exists' });
        }
      }

      const file = req.file;
      let filePath = undefined;
      if (file) {
        // Delete old file if exists
        if (existingLaporan.filePath) {
          deleteFile(existingLaporan.filePath);
        }
        filePath = `/uploads/${file.filename}`;
      }

      const laporan = await prisma.laporanItwasda.update({
        where: { id },
        data: {
          nomorLaporan: nomorLaporan || undefined,
          paketId: paketId || undefined,
          jenisLaporan: jenisLaporan || undefined,
          deskripsi: deskripsi || undefined,
          tingkatKualitasTemuan: tingkatKualitasTemuan || undefined,
          status: status || undefined,
          auditor: auditor || undefined,
          pic: pic || undefined,
          filePath,
          updatedAt: new Date(),
        },
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'UPDATE',
          entity: 'LAPORAN_ITWASDA',
          entityId: laporan.id,
          details: { nomorLaporan, jenisLaporan },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      res.json(laporan);
    } catch (error) {
      console.error('Update laporan itwasda error:', error);
      res.status(500).json({ error: 'Failed to update laporan itwasda' });
    }
  }
);

app.delete(
  '/api/laporan-itwasda/:id',
  authenticateToken,
  authorizeRoles('admin'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const laporan = await prisma.laporanItwasda.findUnique({
        where: { id },
        include: { dokumen: true },
      });

      if (!laporan) {
        return res.status(404).json({ error: 'Laporan not found' });
      }

      // Delete associated files
      if (laporan.filePath) {
        deleteFile(laporan.filePath);
      }

      for (const doc of laporan.dokumen) {
        if (doc.filePath) {
          deleteFile(doc.filePath);
        }
      }

      await prisma.laporanItwasda.delete({ where: { id } });

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'DELETE',
          entity: 'LAPORAN_ITWASDA',
          entityId: id,
          details: { nomorLaporan: laporan.nomorLaporan },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      res.json({ message: 'Laporan Itwasda and associated files deleted successfully' });
    } catch (error) {
      console.error('Delete laporan itwasda error:', error);
      res.status(500).json({ error: 'Failed to delete laporan itwasda' });
    }
  }
);

// ============================================
// TEMUAN BPKP ROUTES
// ============================================

app.get('/api/temuan-bpkp', authenticateToken, async (req, res) => {
  try {
    const temuan = await prisma.temuanBPKP.findMany({
      include: {
        paket: { select: { kodePaket: true, namaPaket: true, status: true } },
        dokumen: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(temuan);
  } catch (error) {
    console.error('Fetch temuan bpkp error:', error);
    res.status(500).json({ error: 'Failed to fetch temuan bpkp' });
  }
});

app.get('/api/temuan-bpkp/:id', authenticateToken, async (req, res) => {
  try {
    const temuan = await prisma.temuanBPKP.findUnique({
      where: { id: req.params.id },
      include: {
        paket: { select: { kodePaket: true, namaPaket: true, status: true } },
        dokumen: true,
      },
    });

    if (!temuan) {
      return res.status(404).json({ error: 'Temuan not found' });
    }

    res.json(temuan);
  } catch (error) {
    console.error('Fetch temuan error:', error);
    res.status(500).json({ error: 'Failed to fetch temuan' });
  }
});

app.post('/api/temuan-bpkp', authenticateToken, upload.single('filePath'), async (req, res) => {
  try {
    const { nomorTemuan, paketId, jenisTemuan, deskripsi, tingkatKualitasTemuan, auditor, pic } =
      req.body;

    if (!nomorTemuan || !jenisTemuan) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check for duplicate
    const existingTemuan = await prisma.temuanBPKP.findUnique({ where: { nomorTemuan } });
    if (existingTemuan) {
      return res.status(400).json({ error: 'Nomor temuan already exists' });
    }

    const file = req.file;
    let filePath = null;
    if (file) {
      filePath = `/uploads/${file.filename}`;
    }

    // 1. Create temuan BPKP
    const temuan = await prisma.temuanBPKP.create({
      data: {
        nomorTemuan,
        paketId: paketId || null,
        jenisTemuan,
        deskripsi: deskripsi || '',
        tingkatKualitasTemuan: tingkatKualitasTemuan || 'RENDAH',
        auditor: auditor || `${req.user!.firstName} ${req.user!.lastName}`,
        pic: pic || '',
        tanggal: new Date(),
        filePath,
      },
    });

    if (paketId) {
      try {
        await createTemuanForVendors({
          paketId,
          sourceType: 'BPKP',
          sourceId: temuan.id,
          nomorTemuan,
          judul: `Temuan BPKP: ${jenisTemuan}`,
          deskripsi: deskripsi || 'Lihat detail temuan untuk informasi lengkap',
          tingkat: tingkatKualitasTemuan || 'RENDAH',
          createdByUserId: req.user!.id,
        });
      } catch (error) {
        console.error('⚠️ Error creating temuan for vendors (non-fatal):', error);
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE',
        entity: 'TEMUAN_BPKP',
        entityId: temuan.id,
        details: { nomorTemuan, jenisTemuan, paketId },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({
      success: true,
      message: 'Temuan berhasil dibuat dan vendor telah diberitahu',
      data: temuan,
    });
  } catch (error) {
    console.error('Create temuan bpkp error:', error);
    res.status(500).json({ error: 'Failed to create temuan bpkp' });
  }
});

app.put('/api/temuan-bpkp/:id', authenticateToken, upload.single('filePath'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nomorTemuan,
      paketId,
      jenisTemuan,
      deskripsi,
      tingkatKualitasTemuan,
      status,
      auditor,
      pic,
    } = req.body;

    const existingTemuan = await prisma.temuanBPKP.findUnique({ where: { id } });
    if (!existingTemuan) {
      return res.status(404).json({ error: 'Temuan not found' });
    }

    // Check for duplicate nomorTemuan (excluding current)
    if (nomorTemuan && nomorTemuan !== existingTemuan.nomorTemuan) {
      const duplicateTemuan = await prisma.temuanBPKP.findUnique({ where: { nomorTemuan } });
      if (duplicateTemuan) {
        return res.status(400).json({ error: 'Nomor temuan already exists' });
      }
    }

    const file = req.file;
    let filePath = undefined;
    if (file) {
      // Delete old file if exists
      if (existingTemuan.filePath) {
        deleteFile(existingTemuan.filePath);
      }
      filePath = `/uploads/${file.filename}`;
    }

    const temuan = await prisma.temuanBPKP.update({
      where: { id },
      data: {
        nomorTemuan: nomorTemuan || undefined,
        paketId: paketId !== undefined ? paketId || null : undefined,
        jenisTemuan: jenisTemuan || undefined,
        deskripsi: deskripsi || undefined,
        tingkatKualitasTemuan: tingkatKualitasTemuan || undefined,
        status: status || undefined,
        auditor: auditor || undefined,
        pic: pic || undefined,
        filePath,
        updatedAt: new Date(),
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE',
        entity: 'TEMUAN_BPKP',
        entityId: temuan.id,
        details: { nomorTemuan, jenisTemuan },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json(temuan);
  } catch (error) {
    console.error('Update temuan bpkp error:', error);
    res.status(500).json({ error: 'Failed to update temuan bpkp' });
  }
});

app.delete('/api/temuan-bpkp/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const temuan = await prisma.temuanBPKP.findUnique({
      where: { id },
      include: { dokumen: true },
    });

    if (!temuan) {
      return res.status(404).json({ error: 'Temuan not found' });
    }

    // Delete associated files
    if (temuan.filePath) {
      deleteFile(temuan.filePath);
    }

    for (const doc of temuan.dokumen) {
      if (doc.filePath) {
        deleteFile(doc.filePath);
      }
    }

    await prisma.temuanBPKP.delete({ where: { id } });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'DELETE',
        entity: 'TEMUAN_BPKP',
        entityId: id,
        details: { nomorTemuan: temuan.nomorTemuan },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ message: 'Temuan BPKP and associated files deleted successfully' });
  } catch (error) {
    console.error('Delete temuan bpkp error:', error);
    res.status(500).json({ error: 'Failed to delete temuan bpkp' });
  }
});

// ============================================
// PROYEK PUPR ROUTES
// ============================================

app.get('/api/proyek-pupr', authenticateToken, async (req, res) => {
  try {
    const { search, status, sort } = req.query;

    const proyek = await prisma.proyekPUPR.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { namaProyek: { contains: String(search), mode: 'insensitive' } },
                  { lokasi: { contains: String(search), mode: 'insensitive' } },
                  { kontraktor: { contains: String(search), mode: 'insensitive' } },
                ],
              }
            : {},
          status ? { status: String(status).toUpperCase() as any } : {},
        ],
      },
      orderBy: {
        createdAt: sort === 'asc' ? 'asc' : 'desc',
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        dokumen: true,
      },
    });

    res.json(proyek);
  } catch (error) {
    console.error('Fetch proyek error:', error);
    res.status(500).json({ error: 'Failed to fetch proyek PUPR' });
  }
});

app.get('/api/proyek-pupr/:id', authenticateToken, async (req, res) => {
  try {
    const proyek = await prisma.proyekPUPR.findUnique({
      where: { id: req.params.id },
      include: {
        dokumen: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });

    if (!proyek) {
      return res.status(404).json({ error: 'Proyek not found' });
    }

    res.json(proyek);
  } catch (error) {
    console.error('Fetch proyek detail error:', error);
    res.status(500).json({ error: 'Failed to fetch proyek detail' });
  }
});

app.post(
  '/api/proyek-pupr',
  authenticateToken,
  upload.single('dokumenCatatan'),
  async (req, res) => {
    try {
      const {
        namaProyek,
        lokasi,
        anggaran,
        kontraktor,
        tanggalMulai,
        tanggalSelesai,
        status,
        progress,
        deskripsiCatatan,
        tingkatKualitasTemuan,
      } = req.body;

      if (!namaProyek || !lokasi || !anggaran || !tanggalMulai || !tanggalSelesai) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const file = req.file;
      let dokumenCatatan = null;
      if (file) {
        dokumenCatatan = `/uploads/${file.filename}`;
      }

      const proyek = await prisma.proyekPUPR.create({
        data: {
          namaProyek,
          lokasi,
          anggaran: parseFloat(anggaran),
          kontraktor: kontraktor || null,
          tanggalMulai: new Date(tanggalMulai),
          tanggalSelesai: new Date(tanggalSelesai),
          status: status || 'PERENCANAAN',
          progress: progress ? parseInt(progress) : 0,
          deskripsiCatatan: deskripsiCatatan || null,
          dokumenCatatan,
          tingkatKualitasTemuan: tingkatKualitasTemuan || null,
          createdBy: req.user!.id,
        },
      });

      if (tingkatKualitasTemuan && tingkatKualitasTemuan !== 'null') {
        // Get paketId from namaProyek or lokasi matching (adjust sesuai logic lu)
        // ATAU tambah field paketId di ProyekPUPR (recommended)

        // For now, skip PUPR temuan creation until paketId added
        console.log('⚠️ PUPR temuan creation skipped (paketId not linked yet)');
      }

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'CREATE',
          entity: 'PROYEK_PUPR',
          entityId: proyek.id,
          details: { namaProyek, lokasi },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      res.status(201).json(proyek);
    } catch (error) {
      console.error('Create proyek error:', error);
      res.status(500).json({ error: 'Failed to create proyek PUPR' });
    }
  }
);

app.put(
  '/api/proyek-pupr/:id',
  authenticateToken,
  upload.single('dokumenCatatan'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        namaProyek,
        lokasi,
        anggaran,
        kontraktor,
        tanggalMulai,
        tanggalSelesai,
        status,
        progress,
        deskripsiCatatan,
        tingkatKualitasTemuan,
      } = req.body;

      const existingProyek = await prisma.proyekPUPR.findUnique({ where: { id } });
      if (!existingProyek) {
        return res.status(404).json({ error: 'Proyek not found' });
      }

      const file = req.file;
      let dokumenCatatan = undefined;
      if (file) {
        // Delete old file if exists
        if (existingProyek.dokumenCatatan) {
          deleteFile(existingProyek.dokumenCatatan);
        }
        dokumenCatatan = `/uploads/${file.filename}`;
      }

      const proyek = await prisma.proyekPUPR.update({
        where: { id },
        data: {
          namaProyek: namaProyek || undefined,
          lokasi: lokasi || undefined,
          anggaran: anggaran ? parseFloat(anggaran) : undefined,
          kontraktor: kontraktor !== undefined ? kontraktor || null : undefined,
          tanggalMulai: tanggalMulai ? new Date(tanggalMulai) : undefined,
          tanggalSelesai: tanggalSelesai ? new Date(tanggalSelesai) : undefined,
          status: status ? (String(status).toUpperCase() as any) : undefined,
          progress: progress !== undefined ? parseInt(progress) : undefined,
          deskripsiCatatan: deskripsiCatatan !== undefined ? deskripsiCatatan || null : undefined,
          dokumenCatatan,
          tingkatKualitasTemuan:
            tingkatKualitasTemuan !== undefined ? tingkatKualitasTemuan || null : undefined,
          updatedAt: new Date(),
        },
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'UPDATE',
          entity: 'PROYEK_PUPR',
          entityId: proyek.id,
          details: { namaProyek, lokasi },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      res.json(proyek);
    } catch (error) {
      console.error('Update proyek error:', error);
      res.status(500).json({ error: 'Failed to update proyek PUPR' });
    }
  }
);

app.delete('/api/proyek-pupr/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const proyek = await prisma.proyekPUPR.findUnique({
      where: { id },
      include: { dokumen: true },
    });

    if (!proyek) {
      return res.status(404).json({ error: 'Proyek not found' });
    }

    // Delete associated files
    if (proyek.dokumenCatatan) {
      deleteFile(proyek.dokumenCatatan);
    }

    for (const doc of proyek.dokumen) {
      if (doc.filePath) {
        deleteFile(doc.filePath);
      }
    }

    await prisma.proyekPUPR.delete({ where: { id } });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'DELETE',
        entity: 'PROYEK_PUPR',
        entityId: id,
        details: { namaProyek: proyek.namaProyek },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ message: 'Proyek PUPR and associated files deleted successfully' });
  } catch (error) {
    console.error('Delete proyek error:', error);
    res.status(500).json({ error: 'Failed to delete proyek PUPR' });
  }
});

// ============================================
// VENDOR-PAKET MANAGEMENT ROUTES
// ============================================

// Assign vendor ke paket
app.post('/api/vendor-paket', authenticateToken, async (req, res) => {
  try {
    const { vendorId, paketId, role } = req.body;

    if (!vendorId || !paketId || !role) {
      return res.status(400).json({ error: 'vendorId, paketId, dan role wajib diisi' });
    }

    const vendorPaket = await prisma.vendorPaket.create({
      data: {
        vendorId,
        paketId,
        role,
      },
      include: {
        vendor: { select: { namaVendor: true, jenisVendor: true } },
        paket: { select: { kodePaket: true, namaPaket: true } },
      },
    });

    res.json({
      success: true,
      message: 'Vendor berhasil ditambahkan ke paket',
      data: vendorPaket,
    });
  } catch (error) {
    console.error('Assign vendor to paket error:', error);
    res.status(500).json({ error: 'Gagal menambahkan vendor ke paket' });
  }
});

// Get pakets with vendors (untuk dropdown di audit forms)
app.get('/api/paket/with-vendors', authenticateToken, async (req, res) => {
  try {
    const pakets = await prisma.paket.findMany({
      where: {
        vendorPakets: {
          some: {}, // Hanya paket yang punya minimal 1 vendor
        },
      },
      include: {
        vendorPakets: {
          include: {
            vendor: {
              select: {
                id: true,
                namaVendor: true,
                jenisVendor: true,
              },
            },
          },
        },
        _count: {
          select: {
            vendorPakets: true,
          },
        },
      },
      orderBy: { namaPaket: 'asc' },
    });

    res.json({
      success: true,
      data: pakets,
    });
  } catch (error) {
    console.error('Fetch pakets with vendors error:', error);
    res.status(500).json({ error: 'Gagal mengambil data paket' });
  }
});

// Get vendors by paket
app.get('/api/paket/:paketId/vendors', authenticateToken, async (req, res) => {
  try {
    const { paketId } = req.params;

    const vendors = await prisma.vendorPaket.findMany({
      where: { paketId },
      include: {
        vendor: {
          select: {
            id: true,
            namaVendor: true,
            jenisVendor: true,
            kontak: true,
            status: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: vendors,
    });
  } catch (error) {
    console.error('Fetch vendors by paket error:', error);
    res.status(500).json({ error: 'Gagal mengambil data vendor' });
  }
});

// ============================================
// ENHANCED TEMUAN CREATION FUNCTION
// ============================================

// Enhanced createTemuanForVendors function
async function createTemuanForVendors(params: {
  paketId: string;
  sourceType: 'ITWASDA' | 'BPKP' | 'PUPR';
  sourceId: string;
  nomorTemuan: string;
  judul: string;
  deskripsi: string;
  tingkat: string;
  createdByUserId: string;
}) {
  try {
    console.log(`🔄 Creating temuan for vendors in paket: ${params.paketId}`);

    // 1. Get semua vendor yang terkait paket ini
    const vendorPakets = await prisma.vendorPaket.findMany({
      where: {
        paketId: params.paketId,
        vendor: { status: 'AKTIF' }, // Hanya vendor aktif
      },
      include: {
        vendor: true,
      },
    });

    if (vendorPakets.length === 0) {
      console.warn(`⚠️ No active vendors found for paket: ${params.paketId}`);
      return [];
    }

    console.log(`📦 Found ${vendorPakets.length} vendors for this paket`);

    // 2. Create temuan untuk setiap vendor
    const temuanPromises = vendorPakets.map((vp) =>
      prisma.temuanVendor.create({
        data: {
          vendorId: vp.vendorId,
          paketId: params.paketId,
          sourceType: params.sourceType,
          sourceId: params.sourceId,
          nomorTemuan: params.nomorTemuan,
          judul: params.judul,
          deskripsi: params.deskripsi,
          tingkat: params.tingkat,
          status: 'BARU',
          tanggalTemuan: new Date(),
        },
        include: {
          vendor: {
            select: {
              namaVendor: true,
              jenisVendor: true,
            },
          },
        },
      })
    );

    const temuanList = await Promise.all(temuanPromises);

    // 3. Update vendor's temuan count
    const updateVendorPromises = vendorPakets.map((vp) =>
      prisma.vendor.update({
        where: { id: vp.vendorId },
        data: {
          jumlahTemuan: { increment: 1 },
          warningTemuan: true, // Set warning jika ada temuan baru
        },
      })
    );

    await Promise.all(updateVendorPromises);

    // 4. Create notifications untuk vendor
    const notificationPromises = temuanList.map((temuan) =>
      prisma.notification.create({
        data: {
          vendorId: temuan.vendorId,
          type: 'TEMUAN_BARU',
          title: 'Temuan Audit Baru',
          message: `Terdapat temuan audit baru: ${params.judul}. Status: ${params.tingkat}. Silakan ditanggapi.`,
          entityType: 'TEMUAN',
          entityId: temuan.id,
        },
      })
    );

    await Promise.all(notificationPromises);

    console.log(`✅ Created ${temuanList.length} temuan for vendors`);
    return temuanList;
  } catch (error) {
    console.error('❌ Error in createTemuanForVendors:', error);
    throw error;
  }
}

// ============================================
// UPDATE EXISTING AUDIT ENDPOINTS
// ============================================

// UPDATE: Laporan Itwasda - Wajib paketId dan auto-create temuan
app.post('/api/laporan-itwasda', authenticateToken, upload.single('filePath'), async (req, res) => {
  try {
    const { nomorLaporan, paketId, jenisLaporan, deskripsi, tingkatKualitasTemuan, auditor, pic } =
      req.body;

    if (!nomorLaporan || !jenisLaporan || !paketId) {
      return res.status(400).json({
        success: false,
        error: 'nomorLaporan, jenisLaporan, dan paketId wajib diisi',
      });
    }

    // Check for duplicate nomorLaporan
    const existingLaporan = await prisma.laporanItwasda.findUnique({ where: { nomorLaporan } });
    if (existingLaporan) {
      return res.status(400).json({ error: 'Nomor laporan already exists' });
    }

    // Verify paket exists and has vendors
    const paketWithVendors = await prisma.paket.findFirst({
      where: {
        id: paketId,
        vendorPakets: {
          some: {},
        },
      },
      include: {
        _count: {
          select: { vendorPakets: true },
        },
      },
    });

    if (!paketWithVendors) {
      return res.status(400).json({
        success: false,
        error: 'Paket tidak ditemukan atau tidak memiliki vendor',
      });
    }

    const file = req.file;
    let filePath = null;
    if (file) {
      filePath = `/uploads/${file.filename}`;
    }

    // 1. Create laporan
    const laporan = await prisma.laporanItwasda.create({
      data: {
        nomorLaporan,
        paketId,
        jenisLaporan,
        deskripsi: deskripsi || '',
        tingkatKualitasTemuan: tingkatKualitasTemuan || 'RENDAH',
        auditor: auditor || `${req.user!.firstName} ${req.user!.lastName}`,
        pic: pic || '',
        tanggal: new Date(),
        filePath,
      },
    });

    // 2. AUTO-CREATE TEMUAN UNTUK VENDORS
    try {
      const createdTemuan = await createTemuanForVendors({
        paketId,
        sourceType: 'ITWASDA',
        sourceId: laporan.id,
        nomorTemuan: nomorLaporan,
        judul: `Temuan Audit Itwasda: ${jenisLaporan}`,
        deskripsi: deskripsi || 'Lihat detail laporan untuk informasi lengkap',
        tingkat: tingkatKualitasTemuan || 'RENDAH',
        createdByUserId: req.user!.id,
      });

      console.log(`✅ Auto-created ${createdTemuan.length} temuan for vendors`);
    } catch (temuanError) {
      console.error('⚠️ Error creating temuan for vendors:', temuanError);
      // Continue anyway, don't fail the main operation
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE',
        entity: 'LAPORAN_ITWASDA',
        entityId: laporan.id,
        details: { nomorLaporan, jenisLaporan, paketId },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({
      success: true,
      message: 'Laporan berhasil dibuat dan vendor telah diberitahu',
      data: laporan,
    });
  } catch (error) {
    console.error('Create laporan itwasda error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create laporan itwasda',
    });
  }
});

// UPDATE: Temuan BPKP - Wajib paketId dan auto-create temuan
app.post('/api/temuan-bpkp', authenticateToken, upload.single('filePath'), async (req, res) => {
  try {
    const { nomorTemuan, paketId, jenisTemuan, deskripsi, tingkatKualitasTemuan, auditor, pic } =
      req.body;

    if (!nomorTemuan || !jenisTemuan || !paketId) {
      return res.status(400).json({
        success: false,
        error: 'nomorTemuan, jenisTemuan, dan paketId wajib diisi',
      });
    }

    // Check for duplicate
    const existingTemuan = await prisma.temuanBPKP.findUnique({ where: { nomorTemuan } });
    if (existingTemuan) {
      return res.status(400).json({ error: 'Nomor temuan already exists' });
    }

    // Verify paket exists and has vendors
    const paketWithVendors = await prisma.paket.findFirst({
      where: {
        id: paketId,
        vendorPakets: {
          some: {},
        },
      },
    });

    if (!paketWithVendors) {
      return res.status(400).json({
        success: false,
        error: 'Paket tidak ditemukan atau tidak memiliki vendor',
      });
    }

    const file = req.file;
    let filePath = null;
    if (file) {
      filePath = `/uploads/${file.filename}`;
    }

    // 1. Create temuan BPKP
    const temuan = await prisma.temuanBPKP.create({
      data: {
        nomorTemuan,
        paketId,
        jenisTemuan,
        deskripsi: deskripsi || '',
        tingkatKualitasTemuan: tingkatKualitasTemuan || 'RENDAH',
        auditor: auditor || `${req.user!.firstName} ${req.user!.lastName}`,
        pic: pic || '',
        tanggal: new Date(),
        filePath,
      },
    });

    // 2. AUTO-CREATE TEMUAN UNTUK VENDORS
    try {
      const createdTemuan = await createTemuanForVendors({
        paketId,
        sourceType: 'BPKP',
        sourceId: temuan.id,
        nomorTemuan,
        judul: `Temuan BPKP: ${jenisTemuan}`,
        deskripsi: deskripsi || 'Lihat detail temuan untuk informasi lengkap',
        tingkat: tingkatKualitasTemuan || 'RENDAH',
        createdByUserId: req.user!.id,
      });

      console.log(`✅ Auto-created ${createdTemuan.length} temuan for vendors`);
    } catch (temuanError) {
      console.error('⚠️ Error creating temuan for vendors:', temuanError);
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE',
        entity: 'TEMUAN_BPKP',
        entityId: temuan.id,
        details: { nomorTemuan, jenisTemuan, paketId },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({
      success: true,
      message: 'Temuan berhasil dibuat dan vendor telah diberitahu',
      data: temuan,
    });
  } catch (error) {
    console.error('Create temuan bpkp error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create temuan bpkp',
    });
  }
});

// ============================================
// VENDOR TEMUAN MANAGEMENT ROUTES
// ============================================

// Get temuan untuk vendor tertentu
app.get('/api/vendors/:vendorId/temuan', authenticateToken, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { status, tingkat } = req.query;

    const temuan = await prisma.temuanVendor.findMany({
      where: {
        vendorId,
        ...(status && { status: status as string }),
        ...(tingkat && { tingkat: tingkat as string }),
      },
      include: {
        paket: {
          select: {
            kodePaket: true,
            namaPaket: true,
          },
        },
      },
      orderBy: { tanggalTemuan: 'desc' },
    });

    res.json({
      success: true,
      data: temuan,
      meta: {
        total: temuan.length,
        baru: temuan.filter((t) => t.status === 'BARU').length,
        dalamPerbaikan: temuan.filter((t) => t.status === 'DALAM_PERBAIKAN').length,
        diperbaiki: temuan.filter((t) => t.status === 'DIPERBAIKI').length,
      },
    });
  } catch (error) {
    console.error('Fetch vendor temuan error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch temuan',
      details: error.message,
    });
  }
});

// Vendor respond to temuan
app.post(
  '/api/vendors/:vendorId/temuan/:temuanId/response',
  authenticateToken,
  upload.array('dokumen', 5),
  async (req, res) => {
    try {
      const { vendorId, temuanId } = req.params;
      const { tanggapan } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!tanggapan) {
        return res.status(400).json({
          success: false,
          error: 'Tanggapan wajib diisi',
        });
      }

      // Verify temuan belongs to vendor
      const temuan = await prisma.temuanVendor.findFirst({
        where: {
          id: temuanId,
          vendorId,
        },
      });

      if (!temuan) {
        return res.status(404).json({
          success: false,
          error: 'Temuan tidak ditemukan',
        });
      }

      const dokumenPaths = files ? files.map((f) => `/uploads/${f.filename}`) : [];

      const updatedTemuan = await prisma.temuanVendor.update({
        where: { id: temuanId },
        data: {
          tanggapanVendor: tanggapan,
          dokumenPerbaikan: dokumenPaths,
          status: 'DALAM_PERBAIKAN',
          tanggalDitanggapi: new Date(),
        },
      });

      // Notify auditor (get from source)
      let auditorUserId = null;
      if (temuan.sourceType === 'ITWASDA') {
        const laporan = await prisma.laporanItwasda.findUnique({
          where: { id: temuan.sourceId },
          select: { auditor: true },
        });
        // TODO: Map auditor name to user ID if needed
      }

      res.json({
        success: true,
        message: 'Tanggapan berhasil disimpan',
        data: updatedTemuan,
      });
    } catch (error) {
      console.error('Respond temuan error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit response',
      });
    }
  }
);

// GET SINGLE TEMUAN DETAIL
// ============================================

app.get('/api/vendors/:vendorId/temuan/:temuanId', authenticateToken, async (req, res) => {
  try {
    const { vendorId, temuanId } = req.params;

    const temuan = await prisma.temuanVendor.findFirst({
      where: {
        id: temuanId,
        vendorId,
      },
      include: {
        paket: {
          select: {
            id: true,
            kodePaket: true,
            namaPaket: true,
            status: true,
          },
        },
        vendor: {
          select: {
            id: true,
            namaVendor: true,
            jenisVendor: true,
          },
        },
      },
    });

    if (!temuan) {
      return res.status(404).json({
        success: false,
        error: 'Temuan tidak ditemukan atau tidak terkait dengan vendor ini',
      });
    }

    res.json({
      success: true,
      data: temuan,
    });
  } catch (error) {
    console.error('Fetch temuan detail error:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil detail temuan',
      details: error.message,
    });
  }
});

// ============================================
// UPDATE: Fix file upload array response
// ============================================

app.post(
  '/api/vendors/:vendorId/temuan/:temuanId/response',
  authenticateToken,
  upload.array('dokumen', 5),
  async (req, res) => {
    try {
      const { vendorId, temuanId } = req.params;
      const { tanggapan } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!tanggapan || !tanggapan.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Tanggapan wajib diisi',
        });
      }

      // Verify temuan belongs to vendor
      const temuan = await prisma.temuanVendor.findFirst({
        where: {
          id: temuanId,
          vendorId,
        },
      });

      if (!temuan) {
        return res.status(404).json({
          success: false,
          error: 'Temuan tidak ditemukan atau tidak terkait dengan vendor ini',
        });
      }

      // Check if already responded (optional - bisa di-allow multiple response)
      if (temuan.status === 'DIPERBAIKI') {
        return res.status(400).json({
          success: false,
          error: 'Temuan sudah diselesaikan, tidak bisa ditanggapi lagi',
        });
      }

      // Build dokumen paths
      const dokumenPaths =
        files && files.length > 0 ? files.map((f) => `/uploads/${f.filename}`) : [];

      // Merge with existing dokumen if any (allow multiple responses)
      const existingDokumen = Array.isArray(temuan.dokumenPerbaikan) ? temuan.dokumenPerbaikan : [];
      const allDokumen = [...existingDokumen, ...dokumenPaths];

      // Update temuan
      const updatedTemuan = await prisma.temuanVendor.update({
        where: { id: temuanId },
        data: {
          tanggapanVendor: tanggapan,
          dokumenPerbaikan: allDokumen,
          status: 'DALAM_PERBAIKAN',
          tanggalDitanggapi: new Date(),
        },
        include: {
          paket: {
            select: {
              kodePaket: true,
              namaPaket: true,
            },
          },
        },
      });

      // Create notification for auditor (get original auditor from source)
      try {
        let auditorNotification = null;

        if (temuan.sourceType === 'ITWASDA') {
          const laporan = await prisma.laporanItwasda.findUnique({
            where: { id: temuan.sourceId },
            select: { auditor: true, nomorLaporan: true },
          });

          // TODO: Map auditor name to userId if needed
          // For now, just log it
          console.log(`📧 Notify auditor: ${laporan?.auditor} for temuan ${temuan.nomorTemuan}`);
        }
      } catch (notifError) {
        console.error('Failed to create auditor notification:', notifError);
        // Don't fail the main operation
      }

      res.json({
        success: true,
        message: 'Tanggapan berhasil disimpan',
        data: updatedTemuan,
      });
    } catch (error) {
      console.error('Submit response error:', error);
      res.status(500).json({
        success: false,
        error: 'Gagal menyimpan tanggapan',
        details: error.message,
      });
    }
  }
);

// Auditor verify vendor response
app.post('/api/temuan-vendor/:temuanId/verify', authenticateToken, async (req, res) => {
  try {
    const { temuanId } = req.params;
    const { status, catatan } = req.body; // status: 'DIPERBAIKI' | 'DITOLAK'

    if (!status || !['DIPERBAIKI', 'DITOLAK'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status harus DIPERBAIKI atau DITOLAK',
      });
    }

    const temuan = await prisma.temuanVendor.update({
      where: { id: temuanId },
      data: {
        status,
        tanggalSelesai: status === 'DIPERBAIKI' ? new Date() : null,
      },
    });

    // Update vendor warning if approved
    if (status === 'DIPERBAIKI') {
      const vendor = await prisma.vendor.findUnique({
        where: { id: temuan.vendorId },
        include: {
          temuanVendor: {
            where: {
              status: { in: ['BARU', 'DALAM_PERBAIKAN'] },
            },
          },
        },
      });

      await prisma.vendor.update({
        where: { id: temuan.vendorId },
        data: {
          warningTemuan: (vendor?.temuanVendor.length || 0) > 0,
          jumlahTemuan: { decrement: 1 },
        },
      });

      // Notify vendor
      await prisma.notification.create({
        data: {
          vendorId: temuan.vendorId,
          type: 'TEMUAN_APPROVED',
          title: 'Perbaikan Diterima',
          message: catatan || `Temuan ${temuan.nomorTemuan} telah diselesaikan`,
          entityType: 'TEMUAN',
          entityId: temuanId,
        },
      });
    } else {
      // Notify vendor (rejected)
      await prisma.notification.create({
        data: {
          vendorId: temuan.vendorId,
          type: 'TEMUAN_REJECTED',
          title: 'Perbaikan Ditolak',
          message:
            catatan || `Perbaikan temuan ${temuan.nomorTemuan} ditolak. Silakan perbaiki kembali.`,
          entityType: 'TEMUAN',
          entityId: temuanId,
        },
      });
    }

    res.json({
      success: true,
      message: 'Verifikasi berhasil',
      data: temuan,
    });
  } catch (error) {
    console.error('Verify temuan error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify temuan',
    });
  }
});

// ============================================
// NOTIFICATION ROUTES
// ============================================

// Get notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const { userId, vendorId } = req.query;

    const notifications = await prisma.notification.findMany({
      where: {
        ...(userId && { userId: userId as string }),
        ...(vendorId && { vendorId: vendorId as string }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
    });
  }
});

// Mark notification as read
app.post('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark as read',
    });
  }
});

// ============================================
// VENDOR ROUTES
// ============================================

app.get('/api/vendor', authenticateToken, async (req, res) => {
  try {
    const { jenis } = req.query;

    // Build where clause
    const whereClause: any = {};
    if (jenis) {
      whereClause.jenisVendor = jenis as string;
    }

    const vendors = await prisma.vendor.findMany({
      where: whereClause,
      include: {
        vendorPakets: {
          include: {
            paket: {
              select: {
                kodePaket: true,
                namaPaket: true,
              },
            },
          },
        },
        dokumen: true,
        temuanVendor: {
          where: {
            status: { in: ['BARU', 'DALAM_PERBAIKAN'] },
          },
          orderBy: { tanggalTemuan: 'desc' },
        },
        notifications: {
          where: { isRead: false },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            temuanVendor: true,
            notifications: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // CRITICAL FIX: Return array directly, not wrapped in object
    res.json(vendors);
  } catch (error) {
    console.error('Fetch vendor error:', error);
    res.status(500).json({
      error: 'Failed to fetch vendor',
      details: error.message,
    });
  }
});

app.get('/api/vendor/:id/detail', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        vendorPakets: {
          include: {
            paket: {
              select: {
                id: true,
                kodePaket: true,
                namaPaket: true,
                jenisPaket: true,
                status: true,
              },
            },
          },
        },
        dokumen: true,
        temuanVendor: {
          include: {
            paket: {
              select: {
                kodePaket: true,
                namaPaket: true,
              },
            },
          },
          orderBy: { tanggalTemuan: 'desc' },
        },
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: {
          select: {
            temuanVendor: true,
            vendorPakets: true,
          },
        },
      },
    });

    if (!vendor) {
      return res.status(404).json({
        error: 'Vendor not found',
      });
    }

    res.json(vendor);
  } catch (error) {
    console.error('Fetch vendor detail error:', error);
    res.status(500).json({
      error: 'Failed to fetch vendor detail',
      details: error.message,
    });
  }
});

app.get('/api/vendor/:id', authenticateToken, async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.params.id },
      include: {
        paket: { select: { kodePaket: true, namaPaket: true } },
        dokumen: true,
      },
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json(vendor);
  } catch (error) {
    console.error('Fetch vendor error:', error);
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
});

app.post(
  '/api/vendor',
  authenticateToken,
  upload.fields([
    { name: 'dokumenDED', maxCount: 1 },
    { name: 'dokumenLaporan', maxCount: 1 },
    { name: 'uploadDokumen', maxCount: 1 },
    { name: 'uploadFoto', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        namaVendor,
        jenisVendor,
        nomorIzin,
        spesialisasi,
        kontak,
        alamat,
        status,
        noKontrak,
        deskripsi,
        lamaKontrak,
        namaProyek,
        deskripsiLaporan,
        deskripsiProgress,
      } = req.body;

      if (!namaVendor || !jenisVendor || !nomorIzin) {
        return res
          .status(400)
          .json({ error: 'Missing required fields: namaVendor, jenisVendor, nomorIzin' });
      }

      // Check for duplicate nomorIzin
      const existingVendor = await prisma.vendor.findUnique({ where: { nomorIzin } });
      if (existingVendor) {
        return res.status(400).json({ error: 'Nomor izin already exists' });
      }

      // Handle file uploads
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      const vendorData: any = {
        namaVendor,
        jenisVendor,
        nomorIzin,
        spesialisasi: spesialisasi || null,
        kontak: kontak || null,
        alamat: alamat || null,
        status: status || 'AKTIF',
        noKontrak: noKontrak || null,
        deskripsi: deskripsi || null,
        lamaKontrak: lamaKontrak ? parseInt(lamaKontrak) : null,
        rating: rating ? parseFloat(rating) : null,
        namaProyek: namaProyek || null,
        deskripsiLaporan: deskripsiLaporan || null,
        deskripsiProgress: deskripsiProgress || null,
        warningTemuan: false,
        jumlahTemuan: 0,
      };

      // Add file paths if uploaded
      if (files?.dokumenDED?.[0]) {
        vendorData.dokumenDED = `/uploads/${files.dokumenDED[0].filename}`;
      }
      if (files?.dokumenLaporan?.[0]) {
        vendorData.dokumenLaporan = `/uploads/${files.dokumenLaporan[0].filename}`;
      }
      if (files?.uploadDokumen?.[0]) {
        vendorData.uploadDokumen = `/uploads/${files.uploadDokumen[0].filename}`;
      }
      if (files?.uploadFoto?.[0]) {
        vendorData.uploadFoto = `/uploads/${files.uploadFoto[0].filename}`;
      }

      const vendor = await prisma.vendor.create({
        data: vendorData,
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'CREATE',
          entity: 'VENDOR',
          entityId: vendor.id,
          details: { namaVendor, jenisVendor },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      res.json(vendor);
    } catch (error) {
      console.error('Create vendor error:', error);
      res.status(500).json({
        error: 'Failed to create vendor',
        details: error.message,
      });
    }
  }
);

app.put(
  '/api/vendor/:id',
  authenticateToken,
  upload.fields([
    { name: 'dokumenDED', maxCount: 1 },
    { name: 'dokumenLaporan', maxCount: 1 },
    { name: 'uploadDokumen', maxCount: 1 },
    { name: 'uploadFoto', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        namaVendor,
        jenisVendor,
        nomorIzin,
        spesialisasi,
        kontak,
        alamat,
        status,
        noKontrak,
        deskripsi,
        lamaKontrak,
        namaProyek,
        deskripsiLaporan,
        deskripsiProgress,
        rating,
      } = req.body;

      const parsedRating = rating ? parseFloat(rating) : undefined;

      const existingVendor = await prisma.vendor.findUnique({ where: { id } });
      if (!existingVendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      // Check for duplicate nomorIzin (excluding current)
      if (nomorIzin && nomorIzin !== existingVendor.nomorIzin) {
        const duplicateVendor = await prisma.vendor.findUnique({ where: { nomorIzin } });
        if (duplicateVendor) {
          return res.status(400).json({ error: 'Nomor izin already exists' });
        }
      }

      // Handle file uploads
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const updateData: any = {
        namaVendor: namaVendor || undefined,
        jenisVendor: jenisVendor || undefined,
        nomorIzin: nomorIzin || undefined,
        spesialisasi: spesialisasi !== undefined ? spesialisasi || null : undefined,
        kontak: kontak !== undefined ? kontak || null : undefined,
        alamat: alamat !== undefined ? alamat || null : undefined,
        status: status || undefined,
        noKontrak: noKontrak !== undefined ? noKontrak || null : undefined,
        deskripsi: deskripsi !== undefined ? deskripsi || null : undefined,
        lamaKontrak: lamaKontrak ? parseInt(lamaKontrak) : undefined,
        namaProyek: namaProyek !== undefined ? namaProyek || null : undefined,
        deskripsiLaporan: deskripsiLaporan !== undefined ? deskripsiLaporan || null : undefined,
        deskripsiProgress: deskripsiProgress !== undefined ? deskripsiProgress || null : undefined,
        updatedAt: new Date(),
        rating: rating ? parseFloat(rating) : undefined,
      };

      // Add file paths if uploaded
      if (files?.dokumenDED?.[0]) {
        if (existingVendor.dokumenDED) deleteFile(existingVendor.dokumenDED);
        updateData.dokumenDED = `/uploads/${files.dokumenDED[0].filename}`;
      }
      if (files?.dokumenLaporan?.[0]) {
        if (existingVendor.dokumenLaporan) deleteFile(existingVendor.dokumenLaporan);
        updateData.dokumenLaporan = `/uploads/${files.dokumenLaporan[0].filename}`;
      }
      if (files?.uploadDokumen?.[0]) {
        if (existingVendor.uploadDokumen) deleteFile(existingVendor.uploadDokumen);
        updateData.uploadDokumen = `/uploads/${files.uploadDokumen[0].filename}`;
      }
      if (files?.uploadFoto?.[0]) {
        if (existingVendor.uploadFoto) deleteFile(existingVendor.uploadFoto);
        updateData.uploadFoto = `/uploads/${files.uploadFoto[0].filename}`;
      }

      const vendor = await prisma.vendor.update({
        where: { id },
        data: updateData,
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'UPDATE',
          entity: 'VENDOR',
          entityId: vendor.id,
          details: { namaVendor, jenisVendor },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      res.json(vendor);
    } catch (error) {
      console.error('Update vendor error:', error);
      res.status(500).json({
        error: 'Failed to update vendor',
        details: error.message,
      });
    }
  }
);

app.delete('/api/vendor/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: { dokumen: true },
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Delete associated files
    if (vendor.dokumenDED) deleteFile(vendor.dokumenDED);
    if (vendor.dokumenLaporan) deleteFile(vendor.dokumenLaporan);
    if (vendor.uploadDokumen) deleteFile(vendor.uploadDokumen);
    if (vendor.uploadFoto) deleteFile(vendor.uploadFoto);

    for (const doc of vendor.dokumen) {
      if (doc.filePath) {
        deleteFile(doc.filePath);
      }
    }

    await prisma.vendor.delete({ where: { id } });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'DELETE',
        entity: 'VENDOR',
        entityId: id,
        details: { namaVendor: vendor.namaVendor },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ message: 'Vendor and associated files deleted successfully' });
  } catch (error) {
    console.error('Delete vendor error:', error);
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
});

// ============================================
// VENDOR TEMUAN ROUTES (NEW!)
// ============================================

// Get temuan untuk vendor tertentu
app.get('/api/vendors/:vendorId/temuan', authenticateToken, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { status, tingkat } = req.query;

    const temuan = await prisma.temuanVendor.findMany({
      where: {
        vendorId,
        ...(status && { status: status as string }),
        ...(tingkat && { tingkat: tingkat as string }),
      },
      include: {
        paket: {
          select: {
            kodePaket: true,
            namaPaket: true,
          },
        },
      },
      orderBy: { tanggalTemuan: 'desc' },
    });

    res.json({
      success: true,
      data: temuan,
      meta: {
        total: temuan.length,
        baru: temuan.filter((t) => t.status === 'BARU').length,
        dalamPerbaikan: temuan.filter((t) => t.status === 'DALAM_PERBAIKAN').length,
        diperbaiki: temuan.filter((t) => t.status === 'DIPERBAIKI').length,
      },
    });
  } catch (error) {
    console.error('Fetch vendor temuan error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch temuan',
      details: error.message,
    });
  }
});

// Vendor respond to temuan
app.post(
  '/api/vendors/:vendorId/temuan/:temuanId/response',
  authenticateToken,
  upload.array('dokumen', 5),
  async (req, res) => {
    try {
      const { vendorId, temuanId } = req.params;
      const { tanggapan } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!tanggapan) {
        return res.status(400).json({
          success: false,
          error: 'Tanggapan wajib diisi',
        });
      }

      const dokumenPaths = files ? files.map((f) => f.path) : [];

      const updatedTemuan = await prisma.temuanVendor.update({
        where: { id: temuanId },
        data: {
          tanggapanVendor: tanggapan,
          dokumenPerbaikan: dokumenPaths,
          status: 'DALAM_PERBAIKAN',
          tanggalDitanggapi: new Date(),
        },
      });

      // Notify auditor (get from source)
      // TODO: Implement notification to original auditor

      res.json({
        success: true,
        message: 'Tanggapan berhasil disimpan',
        data: updatedTemuan,
      });
    } catch (error) {
      console.error('Respond temuan error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit response',
      });
    }
  }
);

// Auditor verify vendor response
app.post('/api/temuan-vendor/:temuanId/verify', authenticateToken, async (req, res) => {
  try {
    const { temuanId } = req.params;
    const { status, catatan } = req.body; // status: 'DIPERBAIKI' | 'DITOLAK'

    if (!status || !['DIPERBAIKI', 'DITOLAK'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status harus DIPERBAIKI atau DITOLAK',
      });
    }

    const temuan = await prisma.temuanVendor.update({
      where: { id: temuanId },
      data: {
        status,
        tanggalSelesai: status === 'DIPERBAIKI' ? new Date() : null,
      },
    });

    // Update vendor warning if approved
    if (status === 'DIPERBAIKI') {
      const vendor = await prisma.vendor.findUnique({
        where: { id: temuan.vendorId },
        include: {
          temuanVendor: {
            where: {
              status: { in: ['BARU', 'DALAM_PERBAIKAN'] },
            },
          },
        },
      });

      await prisma.vendor.update({
        where: { id: temuan.vendorId },
        data: {
          warningTemuan: (vendor?.temuanVendor.length || 0) > 1,
          jumlahTemuan: { decrement: 1 },
        },
      });

      // Notify vendor
      await prisma.notification.create({
        data: {
          vendorId: temuan.vendorId,
          type: 'TEMUAN_APPROVED',
          title: 'Perbaikan Diterima',
          message: catatan || `Temuan ${temuan.nomorTemuan} telah diselesaikan`,
          entityType: 'TEMUAN',
          entityId: temuanId,
        },
      });
    } else {
      // Notify vendor (rejected)
      await prisma.notification.create({
        data: {
          vendorId: temuan.vendorId,
          type: 'TEMUAN_REJECTED',
          title: 'Perbaikan Ditolak',
          message:
            catatan || `Perbaikan temuan ${temuan.nomorTemuan} ditolak. Silakan perbaiki kembali.`,
          entityType: 'TEMUAN',
          entityId: temuanId,
        },
      });
    }

    res.json({
      success: true,
      message: 'Verifikasi berhasil',
      data: temuan,
    });
  } catch (error) {
    console.error('Verify temuan error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify temuan',
    });
  }
});

// Get notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const { userId, vendorId } = req.query;

    const notifications = await prisma.notification.findMany({
      where: {
        ...(userId && { userId: userId as string }),
        ...(vendorId && { vendorId: vendorId as string }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
    });
  }
});

// Mark notification as read
app.post('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark as read',
    });
  }
});

// ============================================
// PPK ROUTES
// ============================================

// GET all PPK
app.get('/api/ppk', authenticateToken, async (req, res) => {
  try {
    const ppk = await prisma.pPK.findMany({
      include: { dokumen: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(ppk);
  } catch (error) {
    console.error('Fetch PPK error:', error);
    res.status(500).json({ error: 'Failed to fetch PPK' });
  }
});

// GET single PPK
app.get('/api/ppk/:id', authenticateToken, async (req, res) => {
  try {
    const ppk = await prisma.pPK.findUnique({
      where: { id: req.params.id },
      include: { dokumen: true },
    });

    if (!ppk) {
      return res.status(404).json({ error: 'PPK not found' });
    }

    res.json(ppk);
  } catch (error) {
    console.error('Fetch PPK error:', error);
    res.status(500).json({ error: 'Failed to fetch PPK' });
  }
});

app.get('/api/ppk/:id/dokumen', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const dokumen = await prisma.dokumen.findMany({
      where: { ppkId: id },
      orderBy: { uploadedAt: 'desc' },
    });

    res.json(dokumen);
  } catch (error) {
    console.error('Fetch PPK dokumen error:', error);
    res.status(500).json({ error: 'Failed to fetch PPK documents' });
  }
});

app.post(
  '/api/ppk',
  authenticateToken,
  upload.fields([
    { name: 'kakRab', maxCount: 1 },
    { name: 'spesifikasiTeknis', maxCount: 1 },
    { name: 'kontrak', maxCount: 1 },
    { name: 'timeline', maxCount: 1 },
    { name: 'syaratKhusus', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        namaLengkap,
        nip,
        jabatan,
        unitKerja,
        bidangKompetensi,
        tingkatKompetensi,
        pengalamanKompetensi,
        nomorSertifikat,
        jenisSertifikat,
        masaBerlakuSertifikat,
        pengalaman,
        status,
      } = req.body;

      if (!namaLengkap || !nip || !jabatan) {
        return res
          .status(400)
          .json({ error: 'Missing required fields: namaLengkap, nip, jabatan' });
      }

      // Check for duplicate NIP
      const existingPPK = await prisma.pPK.findUnique({ where: { nip } });
      if (existingPPK) {
        return res.status(400).json({ error: 'NIP already exists' });
      }

      // Build kompetensi object dari field individual
      const kompetensiObj: any = {};
      if (bidangKompetensi) kompetensiObj.bidang = bidangKompetensi;
      if (tingkatKompetensi) kompetensiObj.tingkat = tingkatKompetensi;
      if (pengalamanKompetensi) kompetensiObj.pengalaman = pengalamanKompetensi;

      // Build sertifikasi object dari field individual
      const sertifikasiObj: any = {};
      if (nomorSertifikat) sertifikasiObj.nomor = nomorSertifikat;
      if (jenisSertifikat) sertifikasiObj.jenis = jenisSertifikat;
      if (masaBerlakuSertifikat) sertifikasiObj.masaBerlaku = masaBerlakuSertifikat;

      // Create PPK
      const ppk = await prisma.pPK.create({
        data: {
          namaLengkap,
          nip,
          jabatan,
          unitKerja: unitKerja || '',
          kompetensi: kompetensiObj,
          sertifikasi: sertifikasiObj,
          pengalaman: pengalaman ? parseInt(pengalaman) : 0,
          status: status || 'AKTIF',
        },
      });

      // Handle dokumen uploads
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (files) {
        const dokumenData = [];

        if (files?.kakRab?.[0]) {
          dokumenData.push({
            namaDokumen: 'KAK RAB',
            jenisDokumen: 'KAK_RAB',
            filePath: `/uploads/${files.kakRab[0].filename}`,
            fileSize: files.kakRab[0].size,
            mimeType: files.kakRab[0].mimetype,
            uploadedBy: req.user!.id,
            ppkId: ppk.id,
          });
        }

        if (files?.spesifikasiTeknis?.[0]) {
          dokumenData.push({
            namaDokumen: 'Spesifikasi Teknis',
            jenisDokumen: 'SPESIFIKASI_TEKNIS',
            filePath: `/uploads/${files.spesifikasiTeknis[0].filename}`,
            fileSize: files.spesifikasiTeknis[0].size,
            mimeType: files.spesifikasiTeknis[0].mimetype,
            uploadedBy: req.user!.id,
            ppkId: ppk.id,
          });
        }

        if (files?.kontrak?.[0]) {
          dokumenData.push({
            namaDokumen: 'Kontrak',
            jenisDokumen: 'KONTRAK',
            filePath: `/uploads/${files.kontrak[0].filename}`,
            fileSize: files.kontrak[0].size,
            mimeType: files.kontrak[0].mimetype,
            uploadedBy: req.user!.id,
            ppkId: ppk.id,
          });
        }

        if (files?.timeline?.[0]) {
          dokumenData.push({
            namaDokumen: 'Timeline',
            jenisDokumen: 'TIMELINE',
            filePath: `/uploads/${files.timeline[0].filename}`,
            fileSize: files.timeline[0].size,
            mimeType: files.timeline[0].mimetype,
            uploadedBy: req.user!.id,
            ppkId: ppk.id,
          });
        }

        if (files?.syaratKhusus?.[0]) {
          dokumenData.push({
            namaDokumen: 'Syarat Khusus',
            jenisDokumen: 'SYARAT_KHUSUS',
            filePath: `/uploads/${files.syaratKhusus[0].filename}`,
            fileSize: files.syaratKhusus[0].size,
            mimeType: files.syaratKhusus[0].mimetype,
            uploadedBy: req.user!.id,
            ppkId: ppk.id,
          });
        }

        // Bulk create dokumen
        if (dokumenData.length > 0) {
          await prisma.dokumen.createMany({
            data: dokumenData,
          });
        }
      }

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'CREATE',
          entity: 'PPK',
          entityId: ppk.id,
          details: { namaLengkap, nip },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      res.json(ppk);
    } catch (error) {
      console.error('Create PPK error:', error);
      res.status(500).json({
        error: 'Failed to create PPK',
        details: error.message,
      });
    }
  }
);

app.put(
  '/api/ppk/:id',
  authenticateToken,
  upload.fields([
    { name: 'kakRab', maxCount: 1 },
    { name: 'spesifikasiTeknis', maxCount: 1 },
    { name: 'kontrak', maxCount: 1 },
    { name: 'timeline', maxCount: 1 },
    { name: 'syaratKhusus', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        namaLengkap,
        nip,
        jabatan,
        unitKerja,
        bidangKompetensi,
        tingkatKompetensi,
        pengalamanKompetensi,
        nomorSertifikat,
        jenisSertifikat,
        masaBerlakuSertifikat,
        pengalaman,
        status,
      } = req.body;

      const existingPPK = await prisma.pPK.findUnique({ where: { id } });
      if (!existingPPK) {
        return res.status(404).json({ error: 'PPK not found' });
      }

      // Check for duplicate NIP (excluding current)
      if (nip && nip !== existingPPK.nip) {
        const duplicatePPK = await prisma.pPK.findUnique({ where: { nip } });
        if (duplicatePPK) {
          return res.status(400).json({ error: 'NIP already exists' });
        }
      }

      // Build kompetensi object dari field individual
      let kompetensiObj: any = undefined;
      if (
        bidangKompetensi !== undefined ||
        tingkatKompetensi !== undefined ||
        pengalamanKompetensi !== undefined
      ) {
        kompetensiObj = {};
        if (bidangKompetensi) kompetensiObj.bidang = bidangKompetensi;
        if (tingkatKompetensi) kompetensiObj.tingkat = tingkatKompetensi;
        if (pengalamanKompetensi) kompetensiObj.pengalaman = pengalamanKompetensi;
      }

      // Build sertifikasi object dari field individual
      let sertifikasiObj: any = undefined;
      if (
        nomorSertifikat !== undefined ||
        jenisSertifikat !== undefined ||
        masaBerlakuSertifikat !== undefined
      ) {
        sertifikasiObj = {};
        if (nomorSertifikat) sertifikasiObj.nomor = nomorSertifikat;
        if (jenisSertifikat) sertifikasiObj.jenis = jenisSertifikat;
        if (masaBerlakuSertifikat) sertifikasiObj.masaBerlaku = masaBerlakuSertifikat;
      }

      const updateData: any = {
        namaLengkap: namaLengkap || undefined,
        nip: nip || undefined,
        jabatan: jabatan || undefined,
        unitKerja: unitKerja || undefined,
        kompetensi: kompetensiObj,
        sertifikasi: sertifikasiObj,
        pengalaman: pengalaman ? parseInt(pengalaman) : undefined,
        status: status || undefined,
        updatedAt: new Date(),
        rating: rating ? parseFloat(rating) : undefined,
      };

      // Update PPK data
      const ppk = await prisma.pPK.update({
        where: { id },
        data: updateData,
      });

      // Handle dokumen uploads
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (files) {
        const dokumenData = [];

        if (files?.kakRab?.[0]) {
          dokumenData.push({
            namaDokumen: 'KAK RAB',
            jenisDokumen: 'KAK_RAB',
            filePath: `/uploads/${files.kakRab[0].filename}`,
            fileSize: files.kakRab[0].size,
            mimeType: files.kakRab[0].mimetype,
            uploadedBy: req.user!.id,
            ppkId: ppk.id,
          });
        }

        if (files?.spesifikasiTeknis?.[0]) {
          dokumenData.push({
            namaDokumen: 'Spesifikasi Teknis',
            jenisDokumen: 'SPESIFIKASI_TEKNIS',
            filePath: `/uploads/${files.spesifikasiTeknis[0].filename}`,
            fileSize: files.spesifikasiTeknis[0].size,
            mimeType: files.spesifikasiTeknis[0].mimetype,
            uploadedBy: req.user!.id,
            ppkId: ppk.id,
          });
        }

        if (files?.kontrak?.[0]) {
          dokumenData.push({
            namaDokumen: 'Kontrak',
            jenisDokumen: 'KONTRAK',
            filePath: `/uploads/${files.kontrak[0].filename}`,
            fileSize: files.kontrak[0].size,
            mimeType: files.kontrak[0].mimetype,
            uploadedBy: req.user!.id,
            ppkId: ppk.id,
          });
        }

        if (files?.timeline?.[0]) {
          dokumenData.push({
            namaDokumen: 'Timeline',
            jenisDokumen: 'TIMELINE',
            filePath: `/uploads/${files.timeline[0].filename}`,
            fileSize: files.timeline[0].size,
            mimeType: files.timeline[0].mimetype,
            uploadedBy: req.user!.id,
            ppkId: ppk.id,
          });
        }

        if (files?.syaratKhusus?.[0]) {
          dokumenData.push({
            namaDokumen: 'Syarat Khusus',
            jenisDokumen: 'SYARAT_KHUSUS',
            filePath: `/uploads/${files.syaratKhusus[0].filename}`,
            fileSize: files.syaratKhusus[0].size,
            mimeType: files.syaratKhusus[0].mimetype,
            uploadedBy: req.user!.id,
            ppkId: ppk.id,
          });
        }

        // Create dokumen records
        if (dokumenData.length > 0) {
          await prisma.dokumen.createMany({
            data: dokumenData,
          });
        }
      }

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'UPDATE',
          entity: 'PPK',
          entityId: ppk.id,
          details: { namaLengkap, nip },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      res.json(ppk);
    } catch (error) {
      console.error('Update PPK error:', error);
      res.status(500).json({
        error: 'Failed to update PPK',
        details: error.message,
      });
    }
  }
);

// DELETE PPK
app.delete('/api/ppk/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const ppk = await prisma.pPK.findUnique({
      where: { id },
      include: { dokumen: true },
    });

    if (!ppk) {
      return res.status(404).json({ error: 'PPK not found' });
    }

    // Delete all uploaded files
    if (ppk.kakRab) deleteFile(ppk.kakRab);
    if (ppk.spesifikasiTeknis) deleteFile(ppk.spesifikasiTeknis);
    if (ppk.kontrak) deleteFile(ppk.kontrak);
    if (ppk.timeline) deleteFile(ppk.timeline);
    if (ppk.syaratKhusus) deleteFile(ppk.syaratKhusus);

    // Delete associated dokumen files
    for (const doc of ppk.dokumen) {
      if (doc.filePath) {
        deleteFile(doc.filePath);
      }
    }

    await prisma.pPK.delete({ where: { id } });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'DELETE',
        entity: 'PPK',
        entityId: id,
        details: { namaLengkap: ppk.namaLengkap, nip: ppk.nip },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ message: 'PPK and associated files deleted successfully' });
  } catch (error) {
    console.error('Delete PPK error:', error);
    res.status(500).json({ error: 'Failed to delete PPK' });
  }
});

// ============================================
// PPK DATA ROUTES
// ============================================

app.get('/api/ppk-data', authenticateToken, async (req, res) => {
  try {
    const ppkData = await prisma.pPKData.findMany({
      include: {
        paket: { select: { kodePaket: true, namaPaket: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(ppkData);
  } catch (error) {
    console.error('Fetch PPK data error:', error);
    res.status(500).json({ error: 'Failed to fetch PPK data' });
  }
});

app.get('/api/ppk-data/:id', authenticateToken, async (req, res) => {
  try {
    const ppkData = await prisma.pPKData.findUnique({
      where: { id: req.params.id },
      include: {
        paket: { select: { kodePaket: true, namaPaket: true } },
      },
    });

    if (!ppkData) {
      return res.status(404).json({ error: 'PPK data not found' });
    }

    res.json(ppkData);
  } catch (error) {
    console.error('Fetch PPK data error:', error);
    res.status(500).json({ error: 'Failed to fetch PPK data' });
  }
});

app.post('/api/ppk-data', authenticateToken, async (req, res) => {
  try {
    const {
      paketId,
      namaPPK,
      noSertifikasi,
      jumlahAnggaran,
      lamaProyek,
      realisasiTermin1,
      realisasiTermin2,
      realisasiTermin3,
      realisasiTermin4,
      PHO,
      FHO,
    } = req.body;

    if (!paketId || !namaPPK || !noSertifikasi || !jumlahAnggaran || !lamaProyek) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const ppkData = await prisma.pPKData.create({
      data: {
        paketId,
        namaPPK,
        noSertifikasi,
        jumlahAnggaran: parseFloat(jumlahAnggaran),
        lamaProyek: parseInt(lamaProyek),
        realisasiTermin1: realisasiTermin1 ? parseFloat(realisasiTermin1) : null,
        realisasiTermin2: realisasiTermin2 ? parseFloat(realisasiTermin2) : null,
        realisasiTermin3: realisasiTermin3 ? parseFloat(realisasiTermin3) : null,
        realisasiTermin4: realisasiTermin4 ? parseFloat(realisasiTermin4) : null,
        PHO: PHO ? new Date(PHO) : null,
        FHO: FHO ? new Date(FHO) : null,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE',
        entity: 'PPK_DATA',
        entityId: ppkData.id,
        details: { namaPPK, paketId },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json(ppkData);
  } catch (error) {
    console.error('Create PPK data error:', error);
    res.status(500).json({ error: 'Failed to create PPK data' });
  }
});

app.put('/api/ppk-data/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      paketId,
      namaPPK,
      noSertifikasi,
      jumlahAnggaran,
      lamaProyek,
      realisasiTermin1,
      realisasiTermin2,
      realisasiTermin3,
      realisasiTermin4,
      PHO,
      FHO,
    } = req.body;

    const existingPPKData = await prisma.pPKData.findUnique({ where: { id } });
    if (!existingPPKData) {
      return res.status(404).json({ error: 'PPK data not found' });
    }

    const ppkData = await prisma.pPKData.update({
      where: { id },
      data: {
        paketId: paketId || undefined,
        namaPPK: namaPPK || undefined,
        noSertifikasi: noSertifikasi || undefined,
        jumlahAnggaran: jumlahAnggaran ? parseFloat(jumlahAnggaran) : undefined,
        lamaProyek: lamaProyek ? parseInt(lamaProyek) : undefined,
        realisasiTermin1:
          realisasiTermin1 !== undefined
            ? realisasiTermin1
              ? parseFloat(realisasiTermin1)
              : null
            : undefined,
        realisasiTermin2:
          realisasiTermin2 !== undefined
            ? realisasiTermin2
              ? parseFloat(realisasiTermin2)
              : null
            : undefined,
        realisasiTermin3:
          realisasiTermin3 !== undefined
            ? realisasiTermin3
              ? parseFloat(realisasiTermin3)
              : null
            : undefined,
        realisasiTermin4:
          realisasiTermin4 !== undefined
            ? realisasiTermin4
              ? parseFloat(realisasiTermin4)
              : null
            : undefined,
        PHO: PHO !== undefined ? (PHO ? new Date(PHO) : null) : undefined,
        FHO: FHO !== undefined ? (FHO ? new Date(FHO) : null) : undefined,
        updatedAt: new Date(),
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE',
        entity: 'PPK_DATA',
        entityId: ppkData.id,
        details: { namaPPK, paketId },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json(ppkData);
  } catch (error) {
    console.error('Update PPK data error:', error);
    res.status(500).json({ error: 'Failed to update PPK data' });
  }
});

app.delete('/api/ppk-data/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const ppkData = await prisma.pPKData.findUnique({ where: { id } });
    if (!ppkData) {
      return res.status(404).json({ error: 'PPK data not found' });
    }

    await prisma.pPKData.delete({ where: { id } });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'DELETE',
        entity: 'PPK_DATA',
        entityId: id,
        details: { namaPPK: ppkData.namaPPK },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ message: 'PPK data deleted successfully' });
  } catch (error) {
    console.error('Delete PPK data error:', error);
    res.status(500).json({ error: 'Failed to delete PPK data' });
  }
});

// ============================================
// MONITORING ROUTES
// ============================================

app.get('/api/monitoring', authenticateToken, async (req, res) => {
  try {
    const monitoring = await prisma.monitoring.findMany({
      include: { dokumen: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(monitoring);
  } catch (error) {
    console.error('Fetch monitoring error:', error);
    res.status(500).json({ error: 'Failed to fetch monitoring' });
  }
});

app.post('/api/monitoring', authenticateToken, async (req, res) => {
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
    } = req.body;

    if (!jenisMonitoring || !periode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const monitoring = await prisma.monitoring.create({
      data: {
        paketId: paketId || null,
        jenisMonitoring,
        periode,
        status: status || 'ON_TRACK',
        progress: progress ? parseInt(progress) : 0,
        issues: issues || null,
        rekomendasi: rekomendasi || null,
        tanggalMonitoring: tanggalMonitoring ? new Date(tanggalMonitoring) : new Date(),
        monitoredBy: req.user!.id,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE',
        entity: 'MONITORING',
        entityId: monitoring.id,
        details: { jenisMonitoring, periode },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json(monitoring);
  } catch (error) {
    console.error('Create monitoring error:', error);
    res.status(500).json({ error: 'Failed to create monitoring' });
  }
});

app.put('/api/monitoring/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      paketId,
      jenisMonitoring,
      periode,
      status,
      progress,
      issues,
      rekomendasi,
      tanggalMonitoring,
    } = req.body;

    const existingMonitoring = await prisma.monitoring.findUnique({ where: { id } });
    if (!existingMonitoring) {
      return res.status(404).json({ error: 'Monitoring not found' });
    }

    const monitoring = await prisma.monitoring.update({
      where: { id },
      data: {
        paketId: paketId !== undefined ? paketId || null : undefined,
        jenisMonitoring: jenisMonitoring || undefined,
        periode: periode || undefined,
        status: status || undefined,
        progress: progress !== undefined ? parseInt(progress) : undefined,
        issues: issues !== undefined ? issues || null : undefined,
        rekomendasi: rekomendasi !== undefined ? rekomendasi || null : undefined,
        tanggalMonitoring: tanggalMonitoring ? new Date(tanggalMonitoring) : undefined,
        monitoredBy: req.user!.id,
        updatedAt: new Date(),
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE',
        entity: 'MONITORING',
        entityId: monitoring.id,
        details: { jenisMonitoring, periode },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json(monitoring);
  } catch (error) {
    console.error('Update monitoring error:', error);
    res.status(500).json({ error: 'Failed to update monitoring' });
  }
});

app.delete('/api/monitoring/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const monitoring = await prisma.monitoring.findUnique({
      where: { id },
      include: { dokumen: true },
    });

    if (!monitoring) {
      return res.status(404).json({ error: 'Monitoring not found' });
    }

    // Delete associated dokumen files
    for (const doc of monitoring.dokumen) {
      if (doc.filePath) {
        deleteFile(doc.filePath);
      }
    }

    await prisma.monitoring.delete({ where: { id } });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'DELETE',
        entity: 'MONITORING',
        entityId: id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ message: 'Monitoring and associated files deleted successfully' });
  } catch (error) {
    console.error('Delete monitoring error:', error);
    res.status(500).json({ error: 'Failed to delete monitoring' });
  }
});

// ============================================
// PENGADUAN MASYARAKAT ROUTES (TANPA AUTH)
// ============================================

// POST pengaduan dari masyarakat (tanpa auth)
app.post('/api/pengaduan/masyarakat', async (req, res) => {
  try {
    const { nama, email, telepon, judul, isi, kategori } = req.body;

    if (!nama || !judul || !isi) {
      return res.status(400).json({
        success: false,
        message: 'Nama, judul, dan isi pengaduan wajib diisi',
      });
    }

    // Generate ticket number
    function generateTicketNumber() {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0');
      return `TKT-${year}${month}${day}${random}`;
    }

    const pengaduan = await prisma.pengaduan.create({
      data: {
        judul,
        isi,
        pelapor: nama,
        status: 'BARU',
        tanggal: new Date(),
        email: email || null,
        telepon: telepon || null,
        kategori: kategori || 'UMUM',
        nomor_tiket: generateTicketNumber(),
      },
    });

    res.json({
      success: true,
      message: 'Pengaduan berhasil dikirim',
      data: {
        id: pengaduan.id,
        nomor_tiket: pengaduan.nomor_tiket,
        tanggal: pengaduan.tanggal,
      },
    });
  } catch (error) {
    console.error('Create pengaduan masyarakat error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengirim pengaduan',
    });
  }
});

// Tracking pengaduan by ticket number (tanpa auth)
app.get('/api/pengaduan/masyarakat/tracking/:nomorTiket', async (req, res) => {
  try {
    const { nomorTiket } = req.params;

    const pengaduan = await prisma.pengaduan.findFirst({
      where: {
        nomor_tiket: nomorTiket.toUpperCase(),
      },
      select: {
        id: true,
        judul: true,
        status: true,
        tanggal: true,
        nomor_tiket: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!pengaduan) {
      return res.status(404).json({
        success: false,
        message: 'Nomor tiket tidak ditemukan',
      });
    }

    res.json({
      success: true,
      data: pengaduan,
    });
  } catch (error) {
    console.error('Tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memeriksa status pengaduan',
    });
  }
});

// GET semua pengaduan untuk admin (dengan auth)
app.get('/api/pengaduan', authenticateToken, async (req, res) => {
  try {
    const pengaduan = await prisma.pengaduan.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(pengaduan);
  } catch (error) {
    console.error('Fetch pengaduan error:', error);
    res.status(500).json({ error: 'Failed to fetch pengaduan' });
  }
});

// POST pengaduan dari admin (dengan auth)
app.post('/api/pengaduan', authenticateToken, async (req, res) => {
  try {
    const { judul, isi, status, pelapor } = req.body;

    if (!judul || !isi) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const pengaduan = await prisma.pengaduan.create({
      data: {
        judul,
        isi,
        status: status || 'BARU',
        pelapor: pelapor || `${req.user!.firstName} ${req.user!.lastName}`,
        tanggal: new Date(),
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE',
        entity: 'PENGADUAN',
        entityId: pengaduan.id,
        details: { judul },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json(pengaduan);
  } catch (error) {
    console.error('Create pengaduan error:', error);
    res.status(500).json({ error: 'Failed to create pengaduan' });
  }
});

// ============================================
// PENGADUAN ROUTES
// ============================================

// GET all pengaduan (untuk admin)
app.get('/api/pengaduan', authenticateToken, async (req, res) => {
  try {
    const pengaduan = await prisma.pengaduan.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(pengaduan);
  } catch (error) {
    console.error('Fetch pengaduan error:', error);
    res.status(500).json({ error: 'Failed to fetch pengaduan' });
  }
});

// POST pengaduan dari masyarakat (tanpa auth)
app.post('/api/pengaduan/masyarakat', async (req, res) => {
  try {
    const { nama, email, telepon, judul, isi, kategori } = req.body;

    // Generate ticket number
    function generateTicketNumber() {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0');
      return `TKT-${year}${month}${day}${random}`;
    }

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
      },
    });

    res.json({
      success: true,
      message: 'Pengaduan berhasil dikirim',
      id: pengaduan.id,
      nomor_tiket: pengaduan.nomor_tiket,
    });
  } catch (error) {
    console.error('Create pengaduan error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengirim pengaduan',
    });
  }
});

// Tracking pengaduan by ticket number (tanpa auth)
app.get('/api/pengaduan/tracking/:nomorTiket', async (req, res) => {
  try {
    const { nomorTiket } = req.params;

    const pengaduan = await prisma.pengaduan.findFirst({
      where: {
        nomor_tiket: nomorTiket.toUpperCase(),
      },
      select: {
        id: true,
        judul: true,
        status: true,
        tanggal: true,
        nomor_tiket: true,
        createdAt: true,
      },
    });

    if (!pengaduan) {
      return res.status(404).json({
        success: false,
        message: 'Nomor tiket tidak ditemukan',
      });
    }

    res.json(pengaduan);
  } catch (error) {
    console.error('Tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memeriksa status pengaduan',
    });
  }
});

// POST pengaduan dari admin (dengan auth)
app.post('/api/pengaduan', authenticateToken, async (req, res) => {
  try {
    const { judul, isi, status, pelapor } = req.body;

    if (!judul || !isi) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const pengaduan = await prisma.pengaduan.create({
      data: {
        judul,
        isi,
        status: status || 'BARU',
        pelapor: pelapor || `${req.user!.firstName} ${req.user!.lastName}`,
        tanggal: new Date(),
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE',
        entity: 'PENGADUAN',
        entityId: pengaduan.id,
        details: { judul },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json(pengaduan);
  } catch (error) {
    console.error('Create pengaduan error:', error);
    res.status(500).json({ error: 'Failed to create pengaduan' });
  }
});

// PUT update pengaduan
app.put('/api/pengaduan/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { judul, isi, status, pelapor } = req.body;

    const existingPengaduan = await prisma.pengaduan.findUnique({ where: { id } });
    if (!existingPengaduan) {
      return res.status(404).json({ error: 'Pengaduan not found' });
    }

    const pengaduan = await prisma.pengaduan.update({
      where: { id },
      data: {
        judul: judul || undefined,
        isi: isi || undefined,
        status: status || undefined,
        pelapor: pelapor || undefined,
        updatedAt: new Date(),
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE',
        entity: 'PENGADUAN',
        entityId: pengaduan.id,
        details: { judul },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json(pengaduan);
  } catch (error) {
    console.error('Update pengaduan error:', error);
    res.status(500).json({ error: 'Failed to update pengaduan' });
  }
});

// DELETE pengaduan
app.delete('/api/pengaduan/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const pengaduan = await prisma.pengaduan.findUnique({ where: { id } });
    if (!pengaduan) {
      return res.status(404).json({ error: 'Pengaduan not found' });
    }

    await prisma.pengaduan.delete({ where: { id } });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'DELETE',
        entity: 'PENGADUAN',
        entityId: id,
        details: { judul: pengaduan.judul },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ message: 'Pengaduan deleted successfully' });
  } catch (error) {
    console.error('Delete pengaduan error:', error);
    res.status(500).json({ error: 'Failed to delete pengaduan' });
  }
});

// ============================================
// DOKUMEN ROUTES
// ============================================

app.get('/api/dokumen', authenticateToken, async (req, res) => {
  try {
    const dokumen = await prisma.dokumen.findMany({
      include: { paket: { select: { kodePaket: true, namaPaket: true } } },
      orderBy: { uploadedAt: 'desc' },
    });
    res.json(dokumen);
  } catch (error) {
    console.error('Fetch dokumen error:', error);
    res.status(500).json({ error: 'Failed to fetch dokumen' });
  }
});

app.post('/api/dokumen/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { paketId, jenisDokumen, laporanItwasdaId, temuanBPKPId, proyekPUPRId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!jenisDokumen) {
      return res.status(400).json({ error: 'Jenis dokumen is required' });
    }

    const publicPath = `/uploads/${file.filename}`;

    const dokumen = await prisma.dokumen.create({
      data: {
        paketId: paketId || null,
        laporanItwasdaId: laporanItwasdaId || null,
        temuanBPKPId: temuanBPKPId || null,
        proyekPUPRId: proyekPUPRId || null,
        namaDokumen: file.originalname,
        jenisDokumen,
        filePath: publicPath,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy: req.user!.id,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPLOAD',
        entity: 'DOKUMEN',
        entityId: dokumen.id,
        details: { namaDokumen: file.originalname, jenisDokumen },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({
      message: 'Dokumen berhasil diupload',
      dokumen,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload dokumen' });
  }
});

app.delete('/api/dokumen/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const dokumen = await prisma.dokumen.findUnique({ where: { id } });
    if (!dokumen) {
      return res.status(404).json({ error: 'Dokumen not found' });
    }

    // Check permissions: Only admin or uploader can delete
    if (req.user!.role.toLowerCase() !== 'admin' && req.user!.id !== dokumen.uploadedBy) {
      return res
        .status(403)
        .json({ error: 'Access denied. You can only delete your own documents.' });
    }

    // Delete physical file
    if (dokumen.filePath) {
      deleteFile(dokumen.filePath);
    }

    // Delete record from DB
    await prisma.dokumen.delete({ where: { id } });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'DELETE',
        entity: 'DOKUMEN',
        entityId: id,
        details: { namaDokumen: dokumen.namaDokumen },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ message: 'Dokumen deleted successfully (file removed)' });
  } catch (error) {
    console.error('Delete dokumen error:', error);
    res.status(500).json({ error: 'Failed to delete dokumen' });
  }
});

// ============================================
// DASHBOARD & ANALYTICS ROUTES
// ============================================

app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const [
      paketCount,
      laporanCount,
      temuanCount,
      vendorCount,
      ppkCount,
      pengaduanCount,
      proyekCount,
    ] = await Promise.all([
      prisma.paket.count(),
      prisma.laporanItwasda.count(),
      prisma.temuanBPKP.count(),
      prisma.vendor.count(),
      prisma.pPK.count(),
      prisma.pengaduan.count(),
      prisma.proyekPUPR.count(),
    ]);

    res.json({
      paket: paketCount,
      laporan: laporanCount,
      temuan: temuanCount,
      vendor: vendorCount,
      ppk: ppkCount,
      pengaduan: pengaduanCount,
      proyek: proyekCount,
    });
  } catch (error) {
    console.error('Fetch dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

app.get('/api/dashboard/recent-activity', authenticateToken, async (req, res) => {
  try {
    const [recentPaket, recentLaporan, recentTemuan] = await Promise.all([
      prisma.paket.findMany({
        take: 5,
        orderBy: { tanggalBuat: 'desc' },
        select: { id: true, kodePaket: true, namaPaket: true, tanggalBuat: true, status: true },
      }),
      prisma.laporanItwasda.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, nomorLaporan: true, jenisLaporan: true, createdAt: true, status: true },
      }),
      prisma.temuanBPKP.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, nomorTemuan: true, jenisTemuan: true, createdAt: true, status: true },
      }),
    ]);

    res.json({
      recentPaket,
      recentLaporan,
      recentTemuan,
    });
  } catch (error) {
    console.error('Fetch recent activity error:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

// ============================================
// SEARCH ROUTE
// ============================================

app.get('/api/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchTerm = q.trim();

    if (searchTerm.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const [paket, laporan, temuan, vendor, ppk, proyek] = await Promise.all([
      prisma.paket.findMany({
        where: {
          OR: [
            { kodePaket: { contains: searchTerm, mode: 'insensitive' } },
            { namaPaket: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        select: { id: true, kodePaket: true, namaPaket: true, jenisPaket: true, status: true },
        take: 10,
      }),
      prisma.laporanItwasda.findMany({
        where: {
          OR: [
            { nomorLaporan: { contains: searchTerm, mode: 'insensitive' } },
            { jenisLaporan: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        select: { id: true, nomorLaporan: true, jenisLaporan: true, status: true },
        take: 10,
      }),
      prisma.temuanBPKP.findMany({
        where: {
          OR: [
            { nomorTemuan: { contains: searchTerm, mode: 'insensitive' } },
            { jenisTemuan: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        select: { id: true, nomorTemuan: true, jenisTemuan: true, status: true },
        take: 10,
      }),
      prisma.vendor.findMany({
        where: {
          namaVendor: { contains: searchTerm, mode: 'insensitive' },
        },
        select: { id: true, namaVendor: true, jenisVendor: true, status: true },
        take: 10,
      }),
      prisma.pPK.findMany({
        where: {
          OR: [
            { namaLengkap: { contains: searchTerm, mode: 'insensitive' } },
            { nip: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        select: { id: true, namaLengkap: true, jabatan: true, status: true },
        take: 10,
      }),
      prisma.proyekPUPR.findMany({
        where: {
          OR: [
            { namaProyek: { contains: searchTerm, mode: 'insensitive' } },
            { lokasi: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        select: { id: true, namaProyek: true, lokasi: true, status: true },
        take: 10,
      }),
    ]);

    res.json({
      paket,
      laporan,
      temuan,
      vendor,
      ppk,
      proyek,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ============================================
// LAPORAN ANALISIS ROUTES
// ============================================

app.get('/api/laporan-analisis', authenticateToken, async (req, res) => {
  try {
    const laporan = await prisma.laporanAnalisis.findMany({
      orderBy: { generatedAt: 'desc' },
    });
    res.json(laporan);
  } catch (error) {
    console.error('Fetch laporan analisis error:', error);
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
        data: data || {},
        kesimpulan: kesimpulan || '',
        rekomendasi: rekomendasi || null,
        generatedBy: req.user!.id,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE',
        entity: 'LAPORAN_ANALISIS',
        entityId: laporan.id,
        details: { jenisLaporan, periode },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json(laporan);
  } catch (error) {
    console.error('Create laporan analisis error:', error);
    res.status(500).json({ error: 'Failed to create laporan analisis' });
  }
});

app.delete(
  '/api/laporan-analisis/:id',
  authenticateToken,
  authorizeRoles('admin'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const laporan = await prisma.laporanAnalisis.findUnique({ where: { id } });
      if (!laporan) {
        return res.status(404).json({ error: 'Laporan analisis not found' });
      }

      await prisma.laporanAnalisis.delete({ where: { id } });

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'DELETE',
          entity: 'LAPORAN_ANALISIS',
          entityId: id,
          details: { jenisLaporan: laporan.jenisLaporan },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      res.json({ message: 'Laporan analisis deleted successfully' });
    } catch (error) {
      console.error('Delete laporan analisis error:', error);
      res.status(500).json({ error: 'Failed to delete laporan analisis' });
    }
  }
);

// ============================================
// ROLE & PERMISSION ROUTES
// ============================================

app.get('/api/roles', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(roles);
  } catch (error) {
    console.error('Fetch roles error:', error);
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
        description: description || null,
        permissions: permissions || {},
      },
    });

    res.json(role);
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
});

app.delete('/api/roles/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.role.delete({ where: { id } });
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
});

app.get('/api/permissions', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(permissions);
  } catch (error) {
    console.error('Fetch permissions error:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

// ============================================
// HEALTH CHECK & ROOT ROUTES
// ============================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'SIP-KPBJ API is running',
    timestamp: new Date().toISOString(),
    environment: IS_PRODUCTION ? 'production' : 'development',
  });
});

app.get('/api/health/deep', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    // Test file system
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const canWrite = fs.accessSync(uploadsDir, fs.constants.W_OK);

    res.json({
      status: 'HEALTHY',
      timestamp: new Date().toISOString(),
      database: 'CONNECTED',
      fileSystem: canWrite ? 'WRITABLE' : 'READ_ONLY',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    res.status(503).json({
      status: 'UNHEALTHY',
      timestamp: new Date().toISOString(),
      error: error.message,
      uptime: process.uptime(),
    });
  }
});

app.get('/api/welcome', (req, res) => {
  res.json({
    message: 'Welcome, this is endpoint API for SIPAKAT-PBJ',
    version: '1.2.0',
    endpoints: '/api/endpoints',
  });
});

app.get('/api/endpoints', (req, res) => {
  const routes = expressListEndpoints(app);
  res.json(routes);
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum is 5 files.' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({ error: err.message });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  res.status(500).json({
    error: IS_PRODUCTION ? 'Internal server error' : err.message,
    ...(IS_PRODUCTION ? {} : { stack: err.stack }),
  });
});

// ============================================
// 404 HANDLER - API Routes (harus SEBELUM static serving)
// ============================================
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// ============================================
// PRODUCTION: Serve React App
// ============================================
if (IS_PRODUCTION) {
  // Serve static files dengan caching
  app.use(
    express.static('dist', {
      maxAge: '1y',
      immutable: true,
      setHeaders: (res, filePath) => {
        // No cache untuk HTML files
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      },
    })
  );

  // SPA Fallback - HARUS di paling bawah
  app.get('*', (req, res) => {
    // Skip jika bukan untuk main domain
    if (req.isPortalSubdomain) {
      return res.status(404).send('Not Found');
    }

    // Skip jika request untuk uploads
    if (req.path.startsWith('/uploads')) {
      return res.status(404).send('Not Found');
    }

    // Serve React app
    res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
  });
}

// ============================================
// START SERVER
// ============================================

const server = app.listen(Number(PORT), '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log(`🚀 SIPAKAT BPJ API Server`);
  console.log('='.repeat(60));
  console.log(`📍 Environment: ${IS_PRODUCTION ? '🔴 PRODUCTION' : '🟢 DEVELOPMENT'}`);
  console.log(
    `🌐 Main Domain: ${IS_PRODUCTION ? 'https://sipakat-bpj.com' : `http://localhost:${PORT}`}`
  );
  console.log(
    `🌐 Portal Domain: ${IS_PRODUCTION ? 'https://portal.sipakat-bpj.com' : `http://portal.localhost:${PORT}`}`
  );
  console.log(`🔌 API Endpoint: /api`);
  console.log(`📂 Upload directory: ${uploadsDir}`);
  console.log(`🔒 Security: Rate limiting ${IS_PRODUCTION ? '✅ ENABLED' : '⚠️  RELAXED'}`);
  console.log(`📊 Database: ${process.env.DATABASE_URL ? '✅ CONNECTED' : '❌ NOT CONFIGURED'}`);
  console.log('='.repeat(60));
});
