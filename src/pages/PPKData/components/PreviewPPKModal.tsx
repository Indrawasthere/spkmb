// src/pages/PPKData/components/PreviewPPKModal.tsx - REFACTORED
import { DetailsModal } from '../../../components/common/DetailsModal';
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

  const detailsSections = [
    {
      title: 'Informasi Dasar',
      fields: [
        { label: 'Nama PPK', value: ppkData.namaPPK },
        { label: 'No. Sertifikasi', value: ppkData.noSertifikasi },
        {
          label: 'Jumlah Anggaran',
          value: formatCurrency(ppkData.jumlahAnggaran),
        },
        { label: 'Lama Proyek', value: `${ppkData.lamaProyek} hari` },
      ],
    },
    {
      title: 'Informasi Paket',
      fields: [
        { label: 'Kode Paket', value: ppkData.paket?.kodePaket || '-' },
        {
          label: 'Nama Paket',
          value: ppkData.paket?.namaPaket || '-',
          fullWidth: true,
        },
      ],
    },
    {
      title: 'Realisasi Termin',
      fields: [
        {
          label: 'Progress Termin',
          value: (
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
          ),
          fullWidth: true,
        },
        ...terminData.map((termin) => ({
          label: termin.label,
          value: termin.value ? formatCurrency(termin.value) : (
            <span className="text-gray-400">Belum Direalisasi</span>
          ),
        })),
      ],
    },
    {
      title: 'Serah Terima',
      fields: [
        {
          label: 'PHO (Provisional Hand Over)',
          value: ppkData.PHO
            ? new Date(ppkData.PHO).toLocaleDateString('id-ID')
            : '-',
        },
        {
          label: 'FHO (Final Hand Over)',
          value: ppkData.FHO
            ? new Date(ppkData.FHO).toLocaleDateString('id-ID')
            : '-',
        },
      ],
    },
  ];

  // Prepare documents array if any exist
  const documents = ppkData.dokumen || [];

  return (
    <DetailsModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detail Data PPK - ${ppkData.namaPPK}`}
      sections={detailsSections}
      documents={documents}
    />
  );
};