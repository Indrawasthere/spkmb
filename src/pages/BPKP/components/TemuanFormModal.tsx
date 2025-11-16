// src/pages/BPKP/components/TemuanFormModal.tsx
import { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/modal';
import Button from '../../../components/ui/button/Button';
import Input from '../../../components/form/input/InputField';
import Label from '../../../components/form/Label';
import TextArea from '../../../components/form/input/TextArea';
import Select from '../../../components/form/Select';
import { TemuanBPKP } from './columns';

interface TemuanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
  editingTemuan: TemuanBPKP | null;
  eligiblePakets: Array<{ id: string; kodePaket: string; namaPaket: string }>;
  isSubmitting: boolean;
  validateForm: (formData: any, isEditing: boolean) => Record<string, string>;
}

export const TemuanFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  editingTemuan,
  eligiblePakets,
  isSubmitting,
  validateForm,
}: TemuanFormModalProps) => {
  const [formData, setFormData] = useState({
    nomorTemuan: '',
    paketId: '' as string | null,
    jenisTemuan: '',
    deskripsi: '',
    tingkatKualitasTemuan: '' as TemuanBPKP['tingkatKualitasTemuan'] | '',
    auditor: '',
    pic: '',
    file: null as File | null,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingTemuan) {
      setFormData({
        nomorTemuan: editingTemuan.nomorTemuan,
        paketId: editingTemuan.paketId,
        jenisTemuan: editingTemuan.jenisTemuan,
        deskripsi: editingTemuan.deskripsi,
        tingkatKualitasTemuan: editingTemuan.tingkatKualitasTemuan,
        auditor: editingTemuan.auditor,
        pic: editingTemuan.pic,
        file: null,
      });
    } else {
      resetForm();
    }
  }, [editingTemuan, isOpen]);

  const resetForm = () => {
    setFormData({
      nomorTemuan: '',
      paketId: '',
      jenisTemuan: '',
      deskripsi: '',
      tingkatKualitasTemuan: '',
      auditor: '',
      pic: '',
      file: null,
    });
    setFormErrors({});
  };

  const handleSubmit = async () => {
    const errors = validateForm(formData, !!editingTemuan);
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

  const jenisTemuanOptions = [
    { value: 'Administrasi', label: 'Administrasi' },
    { value: 'Teknis', label: 'Teknis' },
    { value: 'Keuangan', label: 'Keuangan' },
    { value: 'Waktu', label: 'Waktu' },
    { value: 'Kualitas', label: 'Kualitas' },
  ];

  const kualitasOptions = [
    { value: 'RENDAH', label: 'Rendah' },
    { value: 'SEDANG', label: 'Sedang' },
    { value: 'TINGGI', label: 'Tinggi' },
    { value: 'KRITIS', label: 'Kritis' },
  ];

  const paketOptions = [
    { value: '', label: 'Tidak terkait paket (optional)' },
    ...eligiblePakets.map((paket) => ({
      value: paket.id,
      label: `${paket.kodePaket} - ${paket.namaPaket}`,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      title={editingTemuan ? 'Edit Temuan Audit' : 'Tambah Temuan Audit'}
      showHeader={true}
    >
      <div className="flex flex-col max-h-[80vh] overflow-y-auto px-6 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Nomor Temuan *</Label>
            <Input
              type="text"
              value={formData.nomorTemuan}
              onChange={(e) =>
                setFormData({ ...formData, nomorTemuan: e.target.value })
              }
              placeholder="TMN-2024-XXX"
              error={!!formErrors.nomorTemuan}
              hint={formErrors.nomorTemuan}
            />
          </div>
          <div>
            <Label>Paket (Optional)</Label>
            <Select
              options={paketOptions}
              placeholder="Pilih paket"
              onChange={(value) =>
                setFormData({ ...formData, paketId: value || null })
              }
              value={formData.paketId || ''}
            />
            {formErrors.paketId && (
              <p className="mt-1 text-xs text-error-500">{formErrors.paketId}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Hanya paket dengan laporan Itwasda yang ditampilkan
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Jenis Temuan *</Label>
            <Select
              options={jenisTemuanOptions}
              placeholder="Pilih jenis"
              onChange={(value) =>
                setFormData({ ...formData, jenisTemuan: value })
              }
              value={formData.jenisTemuan}
            />
            {formErrors.jenisTemuan && (
              <p className="mt-1 text-xs text-error-500">{formErrors.jenisTemuan}</p>
            )}
          </div>
          <div>
            <Label>Tingkat Kualitas Temuan *</Label>
            <Select
              options={kualitasOptions}
              placeholder="Pilih tingkat kualitas"
              onChange={(value) =>
                setFormData({
                  ...formData,
                  tingkatKualitasTemuan: value as TemuanBPKP['tingkatKualitasTemuan'],
                })
              }
              value={formData.tingkatKualitasTemuan}
            />
            {formErrors.tingkatKualitasTemuan && (
              <p className="mt-1 text-xs text-error-500">
                {formErrors.tingkatKualitasTemuan}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label>Deskripsi Temuan *</Label>
          <TextArea
            rows={4}
            value={formData.deskripsi}
            onChange={(value) => setFormData({ ...formData, deskripsi: value })}
            placeholder="Jelaskan temuan audit secara detail..."
            error={!!formErrors.deskripsi}
            hint={formErrors.deskripsi}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Auditor *</Label>
            <Input
              type="text"
              value={formData.auditor}
              onChange={(e) =>
                setFormData({ ...formData, auditor: e.target.value })
              }
              placeholder="Nama auditor"
              error={!!formErrors.auditor}
              hint={formErrors.auditor}
            />
          </div>
          <div>
            <Label>PIC (Person in Charge) *</Label>
            <Input
              type="text"
              value={formData.pic}
              onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
              placeholder="Nama penanggung jawab"
              error={!!formErrors.pic}
              hint={formErrors.pic}
            />
          </div>
        </div>

        <div>
          <Label>Upload Dokumen (Optional)</Label>
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              if (file && file.size > 10 * 1024 * 1024) {
                setFormErrors({
                  ...formErrors,
                  file: 'Ukuran file maksimal 10MB',
                });
                return;
              }
              setFormData({ ...formData, file });
              setFormErrors({ ...formErrors, file: undefined });
            }}
            accept=".pdf,.doc,.docx,.xlsx,.jpg,.jpeg,.png"
            className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
          />
          {formData.file && (
            <p className="mt-1 text-xs text-green-600">
              ✓ {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
          {editingTemuan && (
            <p className="mt-1 text-xs text-gray-500">
              File baru akan ditambahkan ke daftar dokumen
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t pt-4">
          <Button size="sm" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button size="sm" variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan Temuan'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};