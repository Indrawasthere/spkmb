import * as yup from 'yup';

// Vendor schemas
export const vendorSchema = yup.object().shape({
  namaVendor: yup.string().required('Nama vendor wajib diisi'),
  jenisVendor: yup.string().required('Jenis vendor wajib dipilih'),
  nomorIzin: yup.string().required('Nomor izin wajib diisi'),
  spesialisasi: yup.string().nullable(),
  kontak: yup.string().email('Format email tidak valid').nullable(),
  alamat: yup.string().nullable(),
});

// Paket schemas
export const paketSchema = yup.object().shape({
  kodePaket: yup.string().required('Kode paket wajib diisi'),
  namaPaket: yup.string().required('Nama paket wajib diisi'),
  deskripsi: yup.string().nullable(),
  nilaiKontrak: yup.number().positive('Nilai kontrak harus positif').nullable(),
  tanggalMulai: yup.date().nullable(),
  tanggalSelesai: yup.date().nullable(),
  status: yup.string().oneOf(['DRAFT', 'PUBLISHED', 'ON_PROGRESS', 'COMPLETED', 'CANCELLED']).required(),
});

// Dokumen schemas
export const dokumenSchema = yup.object().shape({
  namaDokumen: yup.string().required('Nama dokumen wajib diisi'),
  jenisDokumen: yup.string().required('Jenis dokumen wajib dipilih'),
  paketId: yup.string().required('Paket wajib dipilih'),
  file: yup.mixed().required('File wajib dipilih'),
});

// User schemas
export const userSchema = yup.object().shape({
  name: yup.string().required('Nama wajib diisi'),
  email: yup.string().email('Format email tidak valid').required('Email wajib diisi'),
  role: yup.string().required('Role wajib dipilih'),
});

// Login schema
export const loginSchema = yup.object().shape({
  email: yup.string().email('Format email tidak valid').required('Email wajib diisi'),
  password: yup.string().required('Password wajib diisi'),
});

// Register schema
export const registerSchema = yup.object().shape({
  name: yup.string().required('Nama wajib diisi'),
  email: yup.string().email('Format email tidak valid').required('Email wajib diisi'),
  password: yup.string().min(6, 'Password minimal 6 karakter').required('Password wajib diisi'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Password tidak cocok')
    .required('Konfirmasi password wajib diisi'),
});
