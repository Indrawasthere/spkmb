// src/pages/PPKData/components/PPKFormModal.tsx
import { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/modal';
import Button from '../../../components/ui/button/Button';
import Input from '../../../components/form/input/InputField';
import Label from '../../../components/form/Label';
import Select from '../../../components/form/Select';
import { PPKData } from './columns';

interface PPKFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
  editingPPK: PPKData | null;
  pakets: Array<{ id: string; kodePaket: string; namaPaket: string }>;
  isSubmitting: boolean;
  validateForm: (formData: any) => Record<string, string>;
}

const formatCurrency = (value: number): string =>
  value.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  });

export const PPKFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  editingPPK,
  pakets,
  isSubmitting,
  validateForm,
}: PPKFormModalProps) => {
  const [formData, setFormData] = useState({
    paketId: '',
    namaPPK: '',
    noSertifikasi: '',
    jumlahAnggaran: '',
    jumlahAnggaranValue: 0,
    lamaProyek: '',
    realisasiTermin1: '',
    realisasiTermin1Value: 0,
    realisasiTermin2: '',
    realisasiTermin2Value: 0,
    realisasiTermin3: '',
    realisasiTermin3Value: 0,
    realisasiTermin4: '',
    realisasiTermin4Value: 0,
    PHO: '',
    FHO: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingPPK) {
      setFormData({
        paketId: editingPPK.paketId,
        namaPPK: editingPPK.namaPPK,
        noSertifikasi: editingPPK.noSertifikasi,
        jumlahAnggaran: formatCurrency(editingPPK.jumlahAnggaran),
        jumlahAnggaranValue: editingPPK.jumlahAnggaran,
        lamaProyek: editingPPK.lamaProyek.toString(),
        realisasiTermin1: editingPPK.realisasiTermin1 ? formatCurrency(editingPPK.realisasiTermin1) : '',
        realisasiTermin1Value: editingPPK.realisasiTermin1 || 0,
        realisasiTermin2: editingPPK.realisasiTermin2 ? formatCurrency(editingPPK.realisasiTermin2) : '',
        realisasiTermin2Value: editingPPK.realisasiTermin2 || 0,
        realisasiTermin3: editingPPK.realisasiTermin3 ? formatCurrency(editingPPK.realisasiTermin3) : '',
        realisasiTermin3Value: editingPPK.realisasiTermin3 || 0,
        realisasiTermin4: editingPPK.realisasiTermin4 ? formatCurrency(editingPPK.realisasiTermin4) : '',
        realisasiTermin4Value: editingPPK.realisasiTermin4 || 0,
        PHO: editingPPK.PHO ? new Date(editingPPK.PHO).toISOString().split('T')[0] : '',
        FHO: editingPPK.FHO ? new Date(editingPPK.FHO).toISOString().split('T')[0] : '',
      });
    } else {
      resetForm();
    }
  }, [editingPPK, isOpen]);

  const resetForm = () => {
    setFormData({
      paketId: '',
      namaPPK: '',
      noSertifikasi: '',
      jumlahAnggaran: '',
      jumlahAnggaranValue: 0,
      lamaProyek: '',
      realisasiTermin1: '',
      realisasiTermin1Value: 0,
      realisasiTermin2: '',
      realisasiTermin2Value: 0,
      realisasiTermin3: '',
      realisasiTermin3Value: 0,
      realisasiTermin4: '',
      realisasiTermin4Value: 0,
      PHO: '',
      FHO: '',
    });
    setFormErrors({});
  };

  const handleCurrencyInput = (fieldName: string, value: string) => {
    const numericValue = value.replace(/\D/g, '');
    const parsed = numericValue ? parseInt(numericValue, 10) : 0;
    
    const updated = {
      ...formData,
      [fieldName]: parsed ? formatCurrency(parsed) : '',
      [`${fieldName}Value`]: parsed,
    };

    // Recalculate total if termin fields
    if (fieldName.startsWith('realisasiTermin')) {
      const total =
        (updated.realisasiTermin1Value || 0) +
        (updated.realisasiTermin2Value || 0) +
        (updated.realisasiTermin3Value || 0) +
        (updated.realisasiTermin4Value || 0);

      updated.jumlahAnggaran = total ? formatCurrency(total) : '';
      updated.jumlahAnggaranValue = total;
    }

    setFormData(updated);
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

  const paketOptions = [
    { value: '', label: 'Pilih Paket' },
    ...pakets.map((paket) => ({
      value: paket.id,
      label: `${paket.kodePaket} - ${paket.namaPaket}`,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      title={editingPPK ? 'Edit Data PPK' : 'Tambah Data PPK'}
      showHeader={true}
    >
      <div className="flex flex-col max-h-[80vh] overflow-y-auto px-6 py-4 space-y-4">
        <div>
          <Label>Paket *</Label>
          <Select
            options={paketOptions}
            value={formData.paketId}
            onChange={(value) => setFormData({ ...formData, paketId: value })}
          />
          {formErrors.paketId && (
            <p className="mt-1 text-xs text-error-500">{formErrors.paketId}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Nama PPK *</Label>
            <Input
              type="text"
              value={formData.namaPPK}
              onChange={(e) =>
                setFormData({ ...formData, namaPPK: e.target.value })
              }
              placeholder="Masukkan nama PPK"
              error={!!formErrors.namaPPK}
              hint={formErrors.namaPPK}
            />
          </div>
          <div>
            <Label>No Sertifikasi *</Label>
            <Input
              type="text"
              value={formData.noSertifikasi}
              onChange={(e) =>
                setFormData({ ...formData, noSertifikasi: e.target.value })
              }
              placeholder="Masukkan nomor sertifikasi"
              error={!!formErrors.noSertifikasi}
              hint={formErrors.noSertifikasi}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Jumlah Anggaran (Rp) *</Label>
            <Input
              type="text"
              value={formData.jumlahAnggaran}
              readOnly
              placeholder="Dihitung otomatis dari termin"
              error={!!formErrors.jumlahAnggaran}
              hint={formErrors.jumlahAnggaran}
            />
            <p className="mt-1 text-xs text-gray-500">
              Total anggaran dihitung otomatis dari realisasi termin
            </p>
          </div>
          <div>
            <Label>Lama Proyek (hari) *</Label>
            <Input
              type="number"
              value={formData.lamaProyek}
              onChange={(e) =>
                setFormData({ ...formData, lamaProyek: e.target.value })
              }
              placeholder="365"
              error={!!formErrors.lamaProyek}
              hint={formErrors.lamaProyek}
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-lg font-medium mb-4">Realisasi Termin</h4>
          <div className="grid grid-cols-2 gap-4">
            {['1', '2', '3', '4'].map((num) => (
              <div key={num}>
                <Label>Termin {num} (Rp)</Label>
                <Input
                  type="text"
                  value={formData[`realisasiTermin${num}` as keyof typeof formData] as string}
                  onChange={(e) => handleCurrencyInput(`realisasiTermin${num}`, e.target.value)}
                  placeholder="25000000"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t pt-4">
          <div>
            <Label>PHO (Provisional Hand Over)</Label>
            <Input
              type="date"
              value={formData.PHO}
              onChange={(e) =>
                setFormData({ ...formData, PHO: e.target.value })
              }
            />
          </div>
          <div>
            <Label>FHO (Final Hand Over)</Label>
            <Input
              type="date"
              value={formData.FHO}
              onChange={(e) =>
                setFormData({ ...formData, FHO: e.target.value })
              }
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t pt-4">
          <Button size="sm" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button size="sm" variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : editingPPK ? 'Simpan Perubahan' : 'Simpan Data'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};