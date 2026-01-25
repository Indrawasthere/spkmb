// src/validators/paket.validator.ts
import { z } from 'zod';

export const createPaketSchema = z.object({
  kodePaket: z.string().min(3, 'Kode paket min 3 karakter'),
  namaPaket: z.string().min(5, 'Nama paket min 5 karakter'),
  nilaiPaket: z.number().positive('Nilai harus positif'),
  jenisPaket: z.enum(['KONSTRUKSI', 'KONSULTAN', 'BARANG_JASA']),
});

// Middleware
const validate = (schema: z.ZodSchema) => {
  return async (req, res, next) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
  };
};

// Usage
app.post('/api/paket', authenticateToken, validate(createPaketSchema), async (req, res) => {});
