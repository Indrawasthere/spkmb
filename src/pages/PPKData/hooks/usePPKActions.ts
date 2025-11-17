// src/pages/PPKData/hooks/usePPKActions.ts
import { useState } from 'react';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface FormData {
  paketId: string;
  namaPPK: string;
  noSertifikasi: string;
  jumlahAnggaran: string;
  jumlahAnggaranValue: number;
  lamaProyek: string;
  realisasiTermin1: string;
  realisasiTermin1Value: number;
  realisasiTermin2: string;
  realisasiTermin2Value: number;
  realisasiTermin3: string;
  realisasiTermin3Value: number;
  realisasiTermin4: string;
  realisasiTermin4Value: number;
  PHO: string;
  FHO: string;
}

interface FormErrors {
  paketId?: string;
  namaPPK?: string;
  noSertifikasi?: string;
  jumlahAnggaran?: string;
  lamaProyek?: string;
}

export const usePPKActions = (onSuccess: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (formData: FormData): FormErrors => {
    const errors: FormErrors = {};

    if (!formData.paketId) {
      errors.paketId = 'Paket wajib dipilih';
    }

    if (!formData.namaPPK.trim()) {
      errors.namaPPK = 'Nama PPK wajib diisi';
    }

    if (!formData.noSertifikasi.trim()) {
      errors.noSertifikasi = 'Nomor sertifikasi wajib diisi';
    }

    if (!formData.jumlahAnggaranValue || formData.jumlahAnggaranValue <= 0) {
      errors.jumlahAnggaran = 'Jumlah anggaran wajib diisi';
    }

    if (!formData.lamaProyek || parseInt(formData.lamaProyek) <= 0) {
      errors.lamaProyek = 'Lama proyek wajib diisi dengan nilai yang valid';
    }

    return errors;
  };

  const createPPKData = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      const ppkDataPayload = {
        paketId: formData.paketId,
        namaPPK: formData.namaPPK,
        noSertifikasi: formData.noSertifikasi,
        jumlahAnggaran: formData.jumlahAnggaranValue,
        lamaProyek: parseInt(formData.lamaProyek) || 0,
        realisasiTermin1: formData.realisasiTermin1Value || null,
        realisasiTermin2: formData.realisasiTermin2Value || null,
        realisasiTermin3: formData.realisasiTermin3Value || null,
        realisasiTermin4: formData.realisasiTermin4Value || null,
        PHO: formData.PHO ? new Date(formData.PHO) : null,
        FHO: formData.FHO ? new Date(formData.FHO) : null,
      };

      const response = await fetch(`${API_BASE_URL}/api/ppk-data`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ppkDataPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Gagal membuat data PPK');
      }

      toast.success('Data PPK berhasil ditambahkan!');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating PPK data:', error);
      toast.error(error.message || 'Terjadi kesalahan saat membuat data PPK');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePPKData = async (id: string, formData: FormData) => {
    setIsSubmitting(true);
    try {
      const ppkDataPayload = {
        paketId: formData.paketId,
        namaPPK: formData.namaPPK,
        noSertifikasi: formData.noSertifikasi,
        jumlahAnggaran: formData.jumlahAnggaranValue,
        lamaProyek: parseInt(formData.lamaProyek) || 0,
        realisasiTermin1: formData.realisasiTermin1Value || null,
        realisasiTermin2: formData.realisasiTermin2Value || null,
        realisasiTermin3: formData.realisasiTermin3Value || null,
        realisasiTermin4: formData.realisasiTermin4Value || null,
        PHO: formData.PHO ? new Date(formData.PHO) : null,
        FHO: formData.FHO ? new Date(formData.FHO) : null,
      };

      const response = await fetch(`${API_BASE_URL}/api/ppk-data/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ppkDataPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Gagal memperbarui data PPK');
      }

      toast.success('Data PPK berhasil diperbarui!');
      onSuccess();
    } catch (error: any) {
      console.error('Error updating PPK data:', error);
      toast.error(error.message || 'Terjadi kesalahan saat memperbarui data PPK');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deletePPKData = async (id: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/ppk-data/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Gagal menghapus data PPK');
      }

      toast.success('Data PPK berhasil dihapus!');
      onSuccess();
    } catch (error: any) {
      console.error('Error deleting PPK data:', error);
      toast.error(error.message || 'Terjadi kesalahan saat menghapus data PPK');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    validateForm,
    createPPKData,
    updatePPKData,
    deletePPKData,
  };
};