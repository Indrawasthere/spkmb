// src/pages/PUPR/components/PreviewProyekModal.tsx
import { Modal } from '../../../components/ui/modal';
import Badge from '../../../components/ui/badge/Badge';
import { ProyekPUPR } from './columns';

interface PreviewProyekModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyek: ProyekPUPR | null;
}

const formatCurrency = (value: number): string =>
  value.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  });

const getStatusColor = (status: ProyekPUPR['status']) => {
  switch (status) {
    case 'SELESAI':
      return 'success';
    case 'PELAKSANAAN':
      return 'warning';
    case 'PERENCANAAN':
      return 'info';
    case 'DITUNDA':
      return 'error';
    default:
      return 'light';
  }
};

export const PreviewProyekModal = ({
  isOpen,
  onClose,
  proyek,
}: PreviewProyekModalProps) => {
  if (!proyek) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      title={`Detail Proyek - ${proyek.namaProyek}`}
      showHeader={true}
    >
      <div className="max-h-[80vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Informasi Dasar */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white border-b pb-2">
              Informasi Dasar
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Nama Proyek
                </p>
                <div className="text-base font-medium text-gray-900 dark:text-white">
                  {proyek.namaProyek}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Lokasi
                </p>
                <div className="text-base font-medium text-gray-900 dark:text-white">
                  {proyek.lokasi}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Anggaran
                </p>
                <div className="text-base font-medium text-green-600 dark:text-green-400">
                  {formatCurrency(proyek.anggaran)}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Kontraktor
                </p>
                <div className="text-base font-medium text-gray-900 dark:text-white">
                  {proyek.kontraktor}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Status
                </p>
                <div>
                  <Badge size="sm" color={getStatusColor(proyek.status)}>
                    {proyek.status}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Progress
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${proyek.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{proyek.progress}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white border-b pb-2">
              Timeline
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Tanggal Mulai
                </p>
                <div className="text-base font-medium text-gray-900 dark:text-white">
                  {new Date(proyek.tanggalMulai).toLocaleDateString('id-ID')}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Tanggal Selesai
                </p>
                <div className="text-base font-medium text-gray-900 dark:text-white">
                  {new Date(proyek.tanggalSelesai).toLocaleDateString('id-ID')}
                </div>
              </div>
            </div>
          </div>

          {/* Deskripsi Catatan */}
          {proyek.deskripsiCatatan && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white border-b pb-2">
                Deskripsi Catatan
              </h3>
              <div className="text-sm text-gray-700 dark:text-gray-400 whitespace-pre-wrap">
                {proyek.deskripsiCatatan}
              </div>
            </div>
          )}

          {/* Dokumen Catatan - Preview Inline */}
          {proyek.dokumenCatatan && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white border-b pb-2">
                Dokumen Catatan Proyek
              </h3>
              
              {proyek.dokumenCatatan.endsWith('.pdf') ? (
                <iframe
                  src={proyek.dokumenCatatan}
                  className="w-full h-[500px] border rounded-lg"
                  title="Preview PDF"
                ></iframe>
              ) : proyek.dokumenCatatan.match(/\.(jpg|jpeg|png)$/i) ? (
                <img
                  src={proyek.dokumenCatatan}
                  alt="Preview Dokumen"
                  className="w-full rounded-lg border"
                />
              ) : (
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {proyek.dokumenCatatan.split('/').pop()}
                  </p>
                  <a
                    href={proyek.dokumenCatatan}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Lihat / Unduh
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Additional Documents (if stored as array) */}
          {proyek.dokumen && proyek.dokumen.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white border-b pb-2">
                Dokumen Tambahan
              </h3>
              <div className="space-y-2">
                {proyek.dokumen.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {doc.namaDokumen}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(doc.uploadedAt).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <a
                      href={doc.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
};