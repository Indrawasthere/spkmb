// src/pages/PPKData/components/PreviewPPKModal.tsx
import { Modal } from '../../../components/ui/modal';
import { PPKData } from './columns';

interface PreviewPPKModalProps {
  isOpen: boolean;
  onClose: () => void;
  ppkData: PPKData | null;
}

const formatCurrency = (value: number): string =>
  value.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  });

export const PreviewPPKModal = ({
  isOpen,
  onClose,
  ppkData,
}: PreviewPPKModalProps) => {
  if (!ppkData) return null;

  const terminData = [
    { label: 'Termin 1', value: ppkData.realisasiTermin1 },
    { label: 'Termin 2', value: ppkData.realisasiTermin2 },
    { label: 'Termin 3', value: ppkData.realisasiTermin3 },
    { label: 'Termin 4', value: ppkData.realisasiTermin4 },
  ];

  const completedTermins = terminData.filter(t => t.value).length;
  const terminPercentage = (completedTermins / 4) * 100;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      title={`Detail Data PPK - ${ppkData.namaPPK}`}
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
                  Nama PPK
                </p>
                <div className="text-base font-medium text-gray-900 dark:text-white">
                  {ppkData.namaPPK}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  No. Sertifikasi
                </p>
                <div className="text-base font-medium text-gray-900 dark:text-white">
                  {ppkData.noSertifikasi}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Jumlah Anggaran
                </p>
                <div className="text-base font-medium text-green-600 dark:text-green-400">
                  {formatCurrency(ppkData.jumlahAnggaran)}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Lama Proyek
                </p>
                <div className="text-base font-medium text-gray-900 dark:text-white">
                  {ppkData.lamaProyek} hari
                </div>
              </div>
            </div>
          </div>

          {/* Informasi Paket */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white border-b pb-2">
              Informasi Paket
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Kode Paket
                </p>
                <div className="text-base font-medium text-gray-900 dark:text-white">
                  {ppkData.paket?.kodePaket || '-'}
                </div>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Nama Paket
                </p>
                <div className="text-base font-medium text-gray-900 dark:text-white">
                  {ppkData.paket?.namaPaket || '-'}
                </div>
              </div>
            </div>
          </div>

          {/* Realisasi Termin */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Realisasi Termin
              </h3>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${terminPercentage}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {completedTermins}/4
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {terminData.map((termin, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    {termin.label}
                  </p>
                  <div className="text-base font-medium text-gray-900 dark:text-white">
                    {termin.value ? formatCurrency(termin.value) : (
                      <span className="text-gray-400">Belum Direalisasi</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PHO & FHO */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white border-b pb-2">
              Serah Terima
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  PHO (Provisional Hand Over)
                </p>
                <div className="text-base font-medium text-gray-900 dark:text-white">
                  {ppkData.PHO
                    ? new Date(ppkData.PHO).toLocaleDateString('id-ID')
                    : '-'}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  FHO (Final Hand Over)
                </p>
                <div className="text-base font-medium text-gray-900 dark:text-white">
                  {ppkData.FHO
                    ? new Date(ppkData.FHO).toLocaleDateString('id-ID')
                    : '-'}
                </div>
              </div>
            </div>
          </div>
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