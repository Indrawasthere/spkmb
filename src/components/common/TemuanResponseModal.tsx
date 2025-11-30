// FILE: src/pages/Vendor/components/TemuanResponseModal.tsx

import { useState } from 'react';
import { Modal } from '../ui/modal';
import Button from '../ui/button/Button';
import Label from '../form/Label';
import Badge from '../ui/badge/Badge';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface TemuanVendor {
  id: string;
  nomorTemuan: string;
  judul: string;
  deskripsi: string;
  tingkat: string;
  status: 'BARU' | 'DALAM_PERBAIKAN' | 'DIPERBAIKI' | 'DITOLAK';
  tanggalTemuan: string;
  tanggapanVendor?: string;
  dokumenPerbaikan?: string[];
  paket: {
    kodePaket: string;
    namaPaket: string;
  };
  sourceType: 'ITWASDA' | 'BPKP' | 'PUPR';
}

interface TemuanResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  temuan: TemuanVendor | null;
  vendorId: string;
  onSuccess: () => void;
}

export function TemuanResponseModal({
  isOpen,
  onClose,
  temuan,
  vendorId,
  onSuccess,
}: TemuanResponseModalProps) {
  const [tanggapan, setTanggapan] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate file count
    if (selectedFiles.length > 5) {
      toast.error('Maksimal 5 file');
      return;
    }

    // Validate file size (max 10MB per file)
    const oversizedFiles = selectedFiles.filter(f => f.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(`File terlalu besar: ${oversizedFiles.map(f => f.name).join(', ')}. Maksimal 10MB per file.`);
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];

    const invalidFiles = selectedFiles.filter(f => !allowedTypes.includes(f.type));
    if (invalidFiles.length > 0) {
      toast.error(`Format file tidak didukung: ${invalidFiles.map(f => f.name).join(', ')}`);
      return;
    }

    setFiles(selectedFiles);
  };

  const handleSubmit = async () => {
    if (!temuan) return;

    // Validation
    if (!tanggapan.trim()) {
      toast.error('Tanggapan wajib diisi');
      return;
    }

    if (tanggapan.length < 20) {
      toast.error('Tanggapan minimal 20 karakter');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('tanggapan', tanggapan.trim());

      // Append files
      files.forEach(file => {
        formData.append('dokumen', file);
      });

      const response = await fetch(
        `${API_BASE_URL}/api/vendors/${vendorId}/temuan/${temuan.id}/response`,
        {
          method: 'POST',
          credentials: 'include',
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan tanggapan');
      }

      toast.success('Tanggapan berhasil dikirim!');
      
      // Reset form
      setTanggapan('');
      setFiles([]);
      
      // Callback
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Submit response error:', error);
      toast.error(error.message || 'Gagal menyimpan tanggapan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setTanggapan('');
    setFiles([]);
    onClose();
  };

  const getTingkatColor = (tingkat: string) => {
    switch (tingkat) {
      case 'KRITIS':
        return 'error';
      case 'TINGGI':
        return 'error';
      case 'SEDANG':
        return 'warning';
      case 'RENDAH':
        return 'success';
      default:
        return 'light';
    }
  };

  if (!temuan) return null;

  // Check if can respond
  const canRespond = temuan.status === 'BARU' || temuan.status === 'DITOLAK';
  const isUnderReview = temuan.status === 'DALAM_PERBAIKAN';
  const isCompleted = temuan.status === 'DIPERBAIKI';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
      title="Tanggapi Temuan Audit"
      showHeader
    >
      <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
        {/* Temuan Info */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <Label>Nomor Temuan</Label>
              <p className="text-lg font-semibold">{temuan.nomorTemuan}</p>
            </div>
            <Badge color={getTingkatColor(temuan.tingkat)}>
              {temuan.tingkat}
            </Badge>
          </div>

          <div>
            <Label>Judul Temuan</Label>
            <p className="font-medium">{temuan.judul}</p>
          </div>

          <div>
            <Label>Deskripsi</Label>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {temuan.deskripsi}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Paket</Label>
              <p className="text-sm">{temuan.paket.namaPaket}</p>
              <p className="text-xs text-gray-500">{temuan.paket.kodePaket}</p>
            </div>
            <div>
              <Label>Sumber</Label>
              <p className="text-sm">{temuan.sourceType}</p>
              <p className="text-xs text-gray-500">
                {new Date(temuan.tanggalTemuan).toLocaleDateString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        {/* Status Info */}
        {isCompleted && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✅ Temuan ini sudah diselesaikan dan tidak dapat ditanggapi lagi.
            </p>
          </div>
        )}

        {isUnderReview && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              ⏳ Tanggapan Anda sedang dalam proses verifikasi oleh auditor.
            </p>
            {temuan.tanggapanVendor && (
              <div className="mt-3 space-y-2">
                <Label>Tanggapan Sebelumnya:</Label>
                <p className="text-sm bg-white dark:bg-gray-800 rounded p-3">
                  {temuan.tanggapanVendor}
                </p>
              </div>
            )}
          </div>
        )}

        {temuan.status === 'DITOLAK' && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              ❌ Perbaikan ditolak. Silakan perbaiki kembali sesuai catatan auditor.
            </p>
          </div>
        )}

        {/* Response Form */}
        {canRespond && (
          <>
            <div>
              <Label>
                Tanggapan *
                <span className="text-xs text-gray-500 ml-2">(Min. 20 karakter)</span>
              </Label>
              <textarea
                className="w-full h-32 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={tanggapan}
                onChange={(e) => setTanggapan(e.target.value)}
                placeholder="Jelaskan tindakan perbaikan yang telah dilakukan..."
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                {tanggapan.length} / 500 karakter
              </p>
            </div>

            <div>
              <Label>
                Dokumen Perbaikan
                <span className="text-xs text-gray-500 ml-2">
                  (Opsional, Maks. 5 file @ 10MB)
                </span>
              </Label>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                disabled={isSubmitting}
                className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                Format: PDF, DOC, DOCX, JPG, PNG
              </p>

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded p-2"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xs">📄</span>
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFiles(files.filter((_, i) => i !== index))}
                        className="text-red-500 hover:text-red-700 text-xs ml-2"
                        disabled={isSubmitting}
                      >
                        Hapus
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Existing Documents */}
            {temuan.dokumenPerbaikan && temuan.dokumenPerbaikan.length > 0 && (
              <div>
                <Label>Dokumen Sebelumnya</Label>
                <div className="space-y-2 mt-2">
                  {temuan.dokumenPerbaikan.map((doc, index) => (
                    <a
                      key={index}
                      href={doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <span>📎</span>
                      <span>Dokumen {index + 1}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            {canRespond ? 'Batal' : 'Tutup'}
          </Button>
          {canRespond && (
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting || !tanggapan.trim() || tanggapan.length < 20}
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim Tanggapan'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}