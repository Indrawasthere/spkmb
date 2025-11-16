// src/pages/BPKP/components/PreviewTemuanModal.tsx
import { DetailsModal } from '../../../components/common/DetailsModal';
import Badge from '../../../components/ui/badge/Badge';
import { TemuanBPKP } from './columns';

interface PreviewTemuanModalProps {
  isOpen: boolean;
  onClose: () => void;
  temuan: TemuanBPKP | null;
}

const getStatusColor = (status: TemuanBPKP['status']) => {
  switch (status) {
    case 'SELESAI':
      return 'success';
    case 'PROSES':
      return 'warning';
    case 'BARU':
      return 'info';
    case 'DITUNDA':
      return 'error';
    default:
      return 'light';
  }
};

const getKualitasTemuanColor = (kualitas: TemuanBPKP['tingkatKualitasTemuan']) => {
  switch (kualitas) {
    case 'KRITIS':
      return 'error';
    case 'TINGGI':
      return 'warning';
    case 'SEDANG':
      return 'info';
    case 'RENDAH':
      return 'success';
    default:
      return 'light';
  }
};

export const PreviewTemuanModal = ({
  isOpen,
  onClose,
  temuan,
}: PreviewTemuanModalProps) => {
  if (!temuan) return null;

  const detailsSections = [
    {
      title: 'Informasi Temuan',
      fields: [
        { label: 'Nomor Temuan', value: temuan.nomorTemuan },
        { label: 'Jenis Temuan', value: temuan.jenisTemuan },
        {
          label: 'Tingkat Kualitas',
          value: (
            <Badge size="sm" color={getKualitasTemuanColor(temuan.tingkatKualitasTemuan)}>
              {temuan.tingkatKualitasTemuan}
            </Badge>
          ),
        },
        {
          label: 'Status',
          value: (
            <Badge size="sm" color={getStatusColor(temuan.status)}>
              {temuan.status}
            </Badge>
          ),
        },
        { label: 'Auditor', value: temuan.auditor },
        { label: 'PIC', value: temuan.pic },
        {
          label: 'Tanggal',
          value: temuan.tanggal
            ? new Date(temuan.tanggal).toLocaleDateString('id-ID')
            : '-',
        },
      ],
    },
    {
      title: 'Deskripsi Temuan',
      fields: [
        {
          label: 'Deskripsi',
          value: temuan.deskripsi || '-',
          fullWidth: true,
        },
      ],
    },
  ];

  // Add paket info if exists
  if (temuan.paket) {
    detailsSections.push({
      title: 'Informasi Paket',
      fields: [
        { label: 'Kode Paket', value: temuan.paket.kodePaket },
        { label: 'Nama Paket', value: temuan.paket.namaPaket },
        { label: 'Status Paket', value: temuan.paket.status },
      ],
    });
  }

  // Prepare documents array (all uploaded files)
  const documents = temuan.dokumen || [];

  // Add legacy filePath if exists and not in dokumen array
  if (temuan.filePath && !documents.some(doc => doc.filePath === temuan.filePath)) {
    documents.unshift({
      id: temuan.id,
      namaDokumen: 'Dokumen Temuan (Awal)',
      filePath: temuan.filePath,
      uploadedAt: temuan.createdAt,
    });
  }

  return (
    <DetailsModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detail Temuan - ${temuan.nomorTemuan}`}
      sections={detailsSections}
      documents={documents}
    />
  );
};