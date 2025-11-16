// src/pages/PUPR/hooks/useProyekActions.ts
import { useState } from 'react';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface FormData {
  namaProyek: string;
  lokasi: string;
  anggaran: string;
  anggaranValue: number;
  kontraktor: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  deskripsiCatatan: string;
  dokumenCatatan: File | null;
  progress: number;
}

interface FormErrors {
  namaProyek?: string;
  lokasi?: string;
  anggaran?: string;
  kontraktor?: string;
  tanggalMulai?: string;
  tanggalSelesai?: string;
}

export const useProyekActions = (onSuccess: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (formData: FormData): FormErrors => {
    const errors: FormErrors = {};

    if (!formData.namaProyek.trim()) {
      errors.namaProyek = 'Nama proyek wajib diisi';
    }

    if (!formData.lokasi.trim()) {
      errors.lokasi = 'Lokasi wajib diisi';
    }

    if (!formData.anggaranValue || formData.anggaranValue <= 0) {
      errors.anggaran = 'Anggaran wajib diisi dengan nilai yang valid';
    }

    if (!formData.kontraktor.trim()) {
      errors.kontraktor = 'Kontraktor wajib diisi';
    }

    if (!formData.tanggalMulai) {
      errors.tanggalMulai = 'Tanggal mulai wajib diisi';
    }

    if (!formData.tanggalSelesai) {
      errors.tanggalSelesai = 'Tanggal selesai wajib diisi';
    }

    if (formData.tanggalMulai && formData.tanggalSelesai) {
      const start = new Date(formData.tanggalMulai);
      const end = new Date(formData.tanggalSelesai);
      if (end <= start) {
        errors.tanggalSelesai = 'Tanggal selesai harus setelah tanggal mulai';
      }
    }

    return errors;
  };

  const createProyek = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('namaProyek', formData.namaProyek);
      fd.append('lokasi', formData.lokasi);
      fd.append('anggaran', String(formData.anggaranValue));
      fd.append('kontraktor', formData.kontraktor);
      fd.append('tanggalMulai', formData.tanggalMulai);
      fd.append('tanggalSelesai', formData.tanggalSelesai);
      fd.append('deskripsiCatatan', formData.deskripsiCatatan);
      fd.append('progress', String(formData.progress));
      
      if (formData.dokumenCatatan) {
        fd.append('dokumenCatatan', formData.dokumenCatatan);
      }

      const response = await fetch(`${API_BASE_URL}/api/proyek-pupr`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });

      if (!response.ok) {
        throw new Error('Gagal membuat proyek');
      }

      toast.success('Catatan proyek berhasil ditambahkan!');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating proyek:', error);
      toast.error(error.message || 'Terjadi kesalahan saat membuat proyek');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateProyek = async (id: string, formData: FormData) => {
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('namaProyek', formData.namaProyek);
      fd.append('lokasi', formData.lokasi);
      fd.append('anggaran', String(formData.anggaranValue));
      fd.append('kontraktor', formData.kontraktor);
      fd.append('tanggalMulai', formData.tanggalMulai);
      fd.append('tanggalSelesai', formData.tanggalSelesai);
      fd.append('deskripsiCatatan', formData.deskripsiCatatan);
      fd.append('progress', String(formData.progress));
      
      // File baru akan ditambahkan ke array dokumen
      if (formData.dokumenCatatan) {
        fd.append('dokumenCatatan', formData.dokumenCatatan);
      }

      const response = await fetch(`${API_BASE_URL}/api/proyek-pupr/${id}`, {
        method: 'PUT',
        credentials: 'include',
        body: fd,
      });

      if (!response.ok) {
        throw new Error('Gagal memperbarui proyek');
      }

      toast.success('Catatan proyek berhasil diperbarui!');
      onSuccess();
    } catch (error: any) {
      console.error('Error updating proyek:', error);
      toast.error(error.message || 'Terjadi kesalahan saat memperbarui proyek');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteProyek = async (id: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/proyek-pupr/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Gagal menghapus proyek');
      }

      toast.success('Catatan proyek berhasil dihapus!');
      onSuccess();
    } catch (error: any) {
      console.error('Error deleting proyek:', error);
      toast.error(error.message || 'Terjadi kesalahan saat menghapus proyek');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    validateForm,
    createProyek,
    updateProyek,
    deleteProyek,
  };
};