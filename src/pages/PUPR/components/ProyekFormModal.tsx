// src/pages/PUPR/components/ProyekFormModal.tsx
import { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/modal';
import Button from '../../../components/ui/button/Button';
import Input from '../../../components/form/input/InputField';
import Label from '../../../components/form/Label';
import { ProyekPUPR } from './columns';

interface ProyekFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
  editingProyek: ProyekPUPR | null;
  isSubmitting: boolean;
  validateForm: (formData: any) => Record<string, string>;
}

const formatCurrency = (value: number): string =>
  value.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  });

export const ProyekFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  editingProyek,
  isSubmitting,
  validateForm,
}: ProyekFormModalProps) => {
  const [formData, setFormData] = useState({
    namaProyek: '',
    lokasi: '',
    anggaran: '',
    anggaranValue: 0,
    kontraktor: '',
    tanggalMulai: '',
    tanggalSelesai: '',
    deskripsiCatatan: '',
    dokumenCatatan: null as File | null,
    progress: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingProyek) {
      setFormData({
        namaProyek: editingProyek.namaProyek,
        lokasi: editingProyek.lokasi,
        anggaran: formatCurrency(editingProyek.anggaran),
        anggaranValue: editingProyek.anggaran,
        kontraktor: editingProyek.kontraktor,
        tanggalMulai: editingProyek.tanggalMulai.split('T')[0],
        tanggalSelesai: editingProyek.tanggalSelesai.split('T')[0],
        deskripsiCatatan: editingProyek.deskripsiCatatan || '',
        dokumenCatatan: null,
        progress: editingProyek.progress || 0,
      });
    } else {
      resetForm();
    }
  }, [editingProyek, isOpen]);

  const resetForm = () => {
    setFormData({
      namaProyek: '',
      lokasi: '',
      anggaran: '',
      anggaranValue: 0,
      kontraktor: '',
      tanggalMulai: '',
      tanggalSelesai: '',
      deskripsiCatatan: '',
      dokumenCatatan: null,
      progress: 0,
    });
    setFormErrors({});
  };

  const handleCurrencyInput = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    const parsed = numericValue ? parseInt(numericValue, 10) : 0;
    setFormData({
      ...formData,
      anggaran: parsed ? formatCurrency(parsed) : '',
      anggaranValue: parsed,
    });
  };

  const handleSubmit = async () => {
    const errors = validateForm(formData);
    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      try {
        await onSubmit(formData);
        resetForm();
      } catch (error) {
        // Error handled in hook
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      title={editingProyek ? 'Edit Catatan Proyek' : 'Tambah Catatan Proyek'}
      showHeader={true}
    >
      <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
        <div>
          <Label>Nama Proyek *</Label>
          <Input
            value={formData.namaProyek}
            onChange={(e) =>
              setFormData({ ...formData, namaProyek: e.target.value })
            }
            placeholder="Nama proyek lengkap"
            error={!!formErrors.namaProyek}
            hint={formErrors.namaProyek}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Lokasi *</Label>
            <Input
              value={formData.lokasi}
              onChange={(e) =>
                setFormData({ ...formData, lokasi: e.target.value })
              }
              placeholder="Kota/Kabupaten"
              error={!!formErrors.lokasi}
              hint={formErrors.lokasi}
            />
          </div>
          <div>
            <Label>Anggaran *</Label>
            <Input
              value={formData.anggaran}
              onChange={(e) => handleCurrencyInput(e.target.value)}
              placeholder="Rp 0"
              error={!!formErrors.anggaran}
              hint={formErrors.anggaran}
            />
          </div>
        </div>

        <div>
          <Label>Kontraktor *</Label>
          <Input
            value={formData.kontraktor}
            onChange={(e) =>
              setFormData({ ...formData, kontraktor: e.target.value })
            }
            placeholder="PT. Nama Kontraktor"
            error={!!formErrors.kontraktor}
            hint={formErrors.kontraktor}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Tanggal Mulai *</Label>
            <Input
              type="date"
              value={formData.tanggalMulai}
              onChange={(e) =>
                setFormData({ ...formData, tanggalMulai: e.target.value })
              }
              error={!!formErrors.tanggalMulai}
              hint={formErrors.tanggalMulai}
            />
          </div>
          <div>
            <Label>Tanggal Selesai *</Label>
            <Input
              type="date"
              value={formData.tanggalSelesai}
              onChange={(e) =>
                setFormData({ ...formData, tanggalSelesai: e.target.value })
              }
              error={!!formErrors.tanggalSelesai}
              hint={formErrors.tanggalSelesai}
            />
          </div>
        </div>

        <div>
          <Label>Progress (%)</Label>
          <Input
            type="number"
            min="0"
            max="100"
            value={formData.progress}
            onChange={(e) =>
              setFormData({
                ...formData,
                progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)),
              })
            }
            placeholder="0–100"
          />
        </div>

        <div>
          <Label>Deskripsi Catatan</Label>
          <textarea
            value={formData.deskripsiCatatan}
            onChange={(e) =>
              setFormData({ ...formData, deskripsiCatatan: e.target.value })
            }
            placeholder="Deskripsi catatan proyek..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <Label>Dokumen Catatan</Label>
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              if (file && file.size > 10 * 1024 * 1024) {
                setFormErrors({ ...formErrors, file: 'Ukuran file maksimal 10MB' });
                return;
              }
              setFormData({ ...formData, dokumenCatatan: file });
              setFormErrors({ ...formErrors, file: undefined });
            }}
            accept=".pdf,.doc,.docx,.xlsx,.jpg,.jpeg,.png"
            className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
          />
          {formData.dokumenCatatan && (
            <p className="mt-1 text-xs text-green-600">
              ✓ {formData.dokumenCatatan.name} (
              {(formData.dokumenCatatan.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
          {editingProyek && (
            <p className="mt-1 text-xs text-gray-500">
              File baru akan ditambahkan ke daftar dokumen
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : editingProyek ? 'Simpan Perubahan' : 'Simpan Catatan'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};