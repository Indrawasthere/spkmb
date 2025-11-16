// src/pages/BPKP/hooks/useTemuanActions.ts
import { useState } from 'react';
import toast from 'react-hot-toast';
import { TemuanBPKP } from '../components/columns';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface FormData {
  nomorTemuan: string;
  paketId: string | null;
  jenisTemuan: string;
  deskripsi: string;
  tingkatKualitasTemuan: TemuanBPKP['tingkatKualitasTemuan'] | '';
  auditor: string;
  pic: string;
  file?: File | null;
}

interface FormErrors {
  nomorTemuan?: string;
  paketId?: string;
  jenisTemuan?: string;
  deskripsi?: string;
  tingkatKualitasTemuan?: string;
  auditor?: string;
  pic?: string;
}

export const useTemuanActions = (
  onSuccess: () => void,
  laporanItwasda: Array<{ paketId: string }>
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (formData: FormData, isEditing: boolean): FormErrors => {
    const errors: FormErrors = {};

    if (!formData.nomorTemuan.trim()) {
      errors.nomorTemuan = 'Nomor temuan wajib diisi';
    }

    if (!formData.jenisTemuan) {
      errors.jenisTemuan = 'Jenis temuan wajib dipilih';
    }

    if (!formData.deskripsi.trim()) {
      errors.deskripsi = 'Deskripsi wajib diisi';
    }

    if (!formData.tingkatKualitasTemuan) {
      errors.tingkatKualitasTemuan = 'Tingkat kualitas temuan wajib dipilih';
    }

    if (!formData.auditor.trim()) {
      errors.auditor = 'Nama auditor wajib diisi';
    }

    if (!formData.pic.trim()) {
      errors.pic = 'PIC wajib diisi';
    }

    // Validate paket eligibility - optional but must have Itwasda report if provided
    if (formData.paketId) {
      const hasLaporanItwasda = laporanItwasda.some(
        (l) => l.paketId === formData.paketId
      );
      if (!hasLaporanItwasda) {
        errors.paketId =
          'Paket yang dipilih belum memiliki laporan Itwasda. Temuan BPKP hanya bisa dibuat untuk paket yang sudah memiliki laporan Itwasda.';
      }
    }

    return errors;
  };

  const createTemuan = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      // 1. Create base temuan record
      const temuanData = {
        nomorTemuan: formData.nomorTemuan.trim(),
        paketId: formData.paketId || null,
        jenisTemuan: formData.jenisTemuan,
        deskripsi: formData.deskripsi.trim(),
        tingkatKualitasTemuan: formData.tingkatKualitasTemuan,
        auditor: formData.auditor.trim(),
        pic: formData.pic.trim(),
      };

      const response = await fetch(`${API_BASE_URL}/api/temuan-bpkp`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(temuanData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal membuat temuan');
      }

      const createdTemuan = await response.json();

      // 2. Upload file if provided
      if (formData.file && createdTemuan.id) {
        const fd = new FormData();
        fd.append('filePath', formData.file);
        fd.append('nomorTemuan', createdTemuan.nomorTemuan);

        const uploadResponse = await fetch(
          `${API_BASE_URL}/api/temuan-bpkp/${createdTemuan.id}`,
          {
            method: 'PUT',
            credentials: 'include',
            body: fd,
          }
        );

        if (!uploadResponse.ok) {
          toast.warning('Temuan dibuat, tapi upload file gagal');
        }
      }

      toast.success('Temuan berhasil dibuat!');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating temuan:', error);
      toast.error(error.message || 'Terjadi kesalahan saat membuat temuan');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateTemuan = async (id: string, formData: FormData) => {
    setIsSubmitting(true);
    try {
      // 1. Update base data
      const temuanData = {
        nomorTemuan: formData.nomorTemuan.trim(),
        paketId: formData.paketId || null,
        jenisTemuan: formData.jenisTemuan,
        deskripsi: formData.deskripsi.trim(),
        tingkatKualitasTemuan: formData.tingkatKualitasTemuan,
        auditor: formData.auditor.trim(),
        pic: formData.pic.trim(),
      };

      const response = await fetch(`${API_BASE_URL}/api/temuan-bpkp/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(temuanData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal update temuan');
      }

      // 2. Upload file if provided (append to dokumen array)
      if (formData.file) {
        const fd = new FormData();
        fd.append('filePath', formData.file);
        fd.append('nomorTemuan', formData.nomorTemuan);

        const uploadResponse = await fetch(
          `${API_BASE_URL}/api/temuan-bpkp/${id}`,
          {
            method: 'PUT',
            credentials: 'include',
            body: fd,
          }
        );

        if (!uploadResponse.ok) {
          toast.warning('Data diupdate, tapi upload file gagal');
        }
      }

      toast.success('Temuan berhasil diperbarui!');
      onSuccess();
    } catch (error: any) {
      console.error('Error updating temuan:', error);
      toast.error(error.message || 'Terjadi kesalahan saat mengupdate temuan');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteTemuan = async (id: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/temuan-bpkp/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menghapus temuan');
      }

      toast.success('Temuan berhasil dihapus!');
      onSuccess();
    } catch (error: any) {
      console.error('Error deleting temuan:', error);
      toast.error(error.message || 'Terjadi kesalahan saat menghapus temuan');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    validateForm,
    createTemuan,
    updateTemuan,
    deleteTemuan,
  };
};