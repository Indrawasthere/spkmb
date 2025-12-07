import { useState, useEffect } from 'react';
import PageBreadcrumb from '../components/common/PageBreadCrumb';
import PageMeta from '../components/common/PageMeta';
import Button from '../components/ui/button/Button';
import Badge from '../components/ui/badge/Badge';
import { PlusIcon } from '../icons';
import { Modal } from '../components/ui/modal';
import { useModal } from '../hooks/useModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import Input from '../components/form/input/InputField';
import Label from '../components/form/Label';
import { DataTable } from '../components/common/DataTable';
import { useToast } from '../hooks/useToast';
import { AlertIcon } from '../icons';
import { ActionButtons } from '../components/common/ActionButtons';
import { DetailsModal } from '../components/common/DetailsModal';
import { ColumnDef } from '@tanstack/react-table';
import { StatsCard } from '../components/common/StatsCard';
import {
  DocumentChartBarIcon as DocumentIcon,
  UserGroupIcon,
  ChartBarIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import { TemuanResponseModal } from '../components/common/TemuanResponseModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Kontraktor {
  id: string;
  namaVendor: string;
  jenisVendor: 'KONSTRUKSI';
  nomorIzin: string;
  spesialisasi: string | null;
  jumlahProyek: number;
  rating: number | null;
  status: 'AKTIF' | 'NON_AKTIF' | 'SUSPENDED';
  kontak: string | null;
  alamat: string | null;
  deskripsi?: string;
  dokumenDED?: string;
  lamaKontrak?: number;
  namaProyek?: string;
  deskripsiLaporan?: string;
  dokumenLaporan?: string;
  deskripsiProgress?: string;
  uploadDokumen?: string;
  uploadFoto?: string;
  warningTemuan?: boolean;
  jumlahTemuan?: number;
  createdAt: string;
}

interface KontraktorFormData {
  namaVendor: string;
  nomorIzin: string;
  spesialisasi: string;
  kontak: string;
  alamat: string;
  namaProyek: string;
  deskripsiProgress: string;
  uploadDokumen: File | null;
  uploadFoto: File | null;
  rating: string;
}

interface FormErrors {
  namaVendor?: string;
  nomorIzin?: string;
  alamat?: string;
  uploadDokumen?: string;
  uploadFoto?: string;
}

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

export default function Konstruksi() {
  const [kontraktor, setKontraktor] = useState<Kontraktor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedData, setSelectedData] = useState<Kontraktor | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingKontraktor, setEditingKontraktor] = useState<Kontraktor | null>(null);
  const [deletingKontraktor, setDeletingKontraktor] = useState<Kontraktor | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [temuanData, setTemuanData] = useState<TemuanVendor[]>([]);
  const [activeTab, setActiveTab] = useState<'data' | 'temuan'>('data');
  const [selectedTemuan, setSelectedTemuan] = useState<TemuanVendor | null>(null);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);

  const [formData, setFormData] = useState<KontraktorFormData>({
    namaVendor: '',
    nomorIzin: '',
    spesialisasi: '',
    kontak: '',
    alamat: '',
    namaProyek: '',
    deskripsiProgress: '',
    uploadDokumen: null,
    uploadFoto: null,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const { isOpen, openModal, closeModal } = useModal();
  const { success, error, info, loading } = useToast();

  // Fetch kontraktor data from API
  useEffect(() => {
    fetchKontraktor();
  }, []);

  const fetchKontraktor = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendor?jenis=KONSTRUKSI`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setKontraktor(data);
      }
    } catch (err) {
      error('Gagal memuat data kontraktor');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTemuan = async (vendorId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendors/${vendorId}/temuan`, {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();

        if (result.success && result.data) {
          setTemuanData(result.data);
        } else if (Array.isArray(result)) {
          setTemuanData(result);
        } else {
          setTemuanData([]);
        }
      } else {
        console.error('Failed to fetch temuan');
        setTemuanData([]);
      }
    } catch (err) {
      console.error('Failed to fetch temuan:', err);
      setTemuanData([]);
      error('Gagal memuat data temuan');
    }
  };

  const handleRespond = (temuan: TemuanVendor) => {
    setSelectedTemuan(temuan);
    setIsResponseModalOpen(true);
  };

  // NEW: Handle response success
  const handleResponseSuccess = async () => {
    // Refresh temuan data
    if (selectedData) {
      await fetchTemuan(selectedData.id);
    }
    success('Tanggapan berhasil dikirim!');
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.namaVendor.trim()) {
      newErrors.namaVendor = 'Nama kontraktor wajib diisi';
    }
    if (!formData.nomorIzin.trim()) {
      newErrors.nomorIzin = 'Nomor izin wajib diisi';
    }
    if (!formData.alamat.trim()) {
      newErrors.alamat = 'Alamat wajib diisi';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (data: KontraktorFormData) => {
    if (!validateForm()) return;

    setIsLoading(true);
    loading(editingKontraktor ? 'Memperbarui kontraktor...' : 'Menyimpan kontraktor...');

    try {
      const fd = new FormData();
      fd.append('namaVendor', data.namaVendor);
      fd.append('jenisVendor', 'KONSTRUKSI');
      fd.append('nomorIzin', data.nomorIzin);
      fd.append('spesialisasi', data.spesialisasi || '');
      fd.append('kontak', data.kontak || '');
      fd.append('alamat', data.alamat || '');
      fd.append('namaProyek', data.namaProyek || '');
      fd.append('deskripsiProgress', data.deskripsiProgress || '');

      if (data.rating) {
        fd.append('rating', data.rating);
      }

      if (data.uploadDokumen) {
        fd.append('uploadDokumen', data.uploadDokumen);
      }
      if (data.uploadFoto) {
        fd.append('uploadFoto', data.uploadFoto);
      }

      let response;
      if (editingKontraktor) {
        response = await fetch(`${API_BASE_URL}/api/vendor/${editingKontraktor.id}`, {
          method: 'PUT',
          credentials: 'include',
          body: fd,
        });
      } else {
        response = await fetch(`${API_BASE_URL}/api/vendor`, {
          method: 'POST',
          credentials: 'include',
          body: fd,
        });
      }

      if (response.ok) {
        await fetchKontraktor();
        closeModal();
        resetForm();
        setEditingKontraktor(null);
        success(
          editingKontraktor ? 'Kontraktor berhasil diperbarui!' : 'Kontraktor berhasil disimpan!'
        );
      } else {
        const errorText = await response.text();
        error('Gagal menyimpan kontraktor: ' + errorText);
      }
    } catch (err) {
      error('Terjadi kesalahan saat menyimpan kontraktor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (kontraktor: Kontraktor) => {
    setEditingKontraktor(kontraktor);
    setFormData({
      namaVendor: kontraktor.namaVendor,
      nomorIzin: kontraktor.nomorIzin,
      spesialisasi: kontraktor.spesialisasi || '',
      kontak: kontraktor.kontak || '',
      alamat: kontraktor.alamat || '',
      namaProyek: kontraktor.namaProyek || '',
      deskripsiProgress: kontraktor.deskripsiProgress || '',
      uploadDokumen: null,
      uploadFoto: null,
      rating: kontraktor.rating ? kontraktor.rating.toString() : '',
    });
    openModal();
  };

  const handleViewDetails = async (data: Kontraktor) => {
    setSelectedData(data);
    setActiveTab('data');
    await fetchTemuan(data.id);
    setViewDetailsOpen(true);
  };

  const handleDelete = (kontraktor: Kontraktor) => {
    setDeletingKontraktor(kontraktor);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingKontraktor) return;
    setIsLoading(true);
    loading('Menghapus kontraktor...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/vendor/${deletingKontraktor.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await fetchKontraktor();
        success('Kontraktor berhasil dihapus!');
      } else {
        const errorData = await response.json();
        error('Gagal menghapus: ' + (errorData.error || 'Unknown error'));
      }
    } catch (err) {
      error('Terjadi kesalahan saat menghapus kontraktor');
    } finally {
      setIsLoading(false);
      setIsConfirmModalOpen(false);
      setDeletingKontraktor(null);
    }
  };

  const handleSubmit = () => onSubmit(formData);

  const handleDokumenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setFormErrors({ ...formErrors, uploadDokumen: 'Ukuran file maksimal 10MB' });
        return;
      }

      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

      if (!allowedTypes.includes(file.type)) {
        setFormErrors({
          ...formErrors,
          uploadDokumen: 'Format file tidak didukung. Hanya PDF dan DOC/DOCX',
        });
        return;
      }

      setFormData({ ...formData, uploadDokumen: file });
      setFormErrors({ ...formErrors, uploadDokumen: undefined });
    }
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors({ ...formErrors, uploadFoto: 'Ukuran foto maksimal 5MB' });
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

      if (!allowedTypes.includes(file.type)) {
        setFormErrors({
          ...formErrors,
          uploadFoto: 'Format foto tidak didukung. Hanya JPG, JPEG, dan PNG',
        });
        return;
      }

      setFormData({ ...formData, uploadFoto: file });
      setFormErrors({ ...formErrors, uploadFoto: undefined });
    }
  };

  const resetForm = () => {
    setFormData({
      namaVendor: '',
      nomorIzin: '',
      spesialisasi: '',
      kontak: '',
      alamat: '',
      namaProyek: '',
      deskripsiProgress: '',
      uploadDokumen: null,
      uploadFoto: null,
      rating: '',
    });
    setFormErrors({});
    setEditingKontraktor(null);
  };

  const getStatusColor = (status: Kontraktor['status']) => {
    switch (status) {
      case 'AKTIF':
        return 'success';
      case 'NON_AKTIF':
        return 'warning';
      case 'SUSPENDED':
        return 'error';
      default:
        return 'light';
    }
  };
  const getTemuanStatusColor = (status: TemuanVendor['status']) => {
    switch (status) {
      case 'BARU':
        return 'error';
      case 'DALAM_PERBAIKAN':
        return 'warning';
      case 'DIPERBAIKI':
        return 'success';
      case 'DITOLAK':
        return 'error';
      default:
        return 'light';
    }
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

  const temuanColumns: ColumnDef<TemuanVendor>[] = [
    {
      accessorKey: 'nomorTemuan',
      header: 'No. Temuan',
      cell: ({ getValue }) => <span className="font-medium text-sm">{getValue() as string}</span>,
    },
    {
      accessorKey: 'judul',
      header: 'Judul Temuan',
    },
    {
      accessorKey: 'tingkat',
      header: 'Tingkat',
      cell: ({ getValue }) => (
        <Badge size="sm" color={getTingkatColor(getValue() as string)}>
          {getValue() as string}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => (
        <Badge size="sm" color={getTemuanStatusColor(getValue() as TemuanVendor['status'])}>
          {getValue() as string}
        </Badge>
      ),
    },
    {
      accessorKey: 'tanggalTemuan',
      header: 'Tanggal',
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString('id-ID'),
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => {
        const canRespond = row.original.status === 'BARU' || row.original.status === 'DITOLAK';
        return (
          <div className="flex gap-2">
            <Button
              size="xs"
              variant={canRespond ? 'primary' : 'outline'}
              onClick={() => handleRespond(row.original)}
            >
              {canRespond ? '✍️ Tanggapi' : '👁️ Lihat'}
            </Button>
          </div>
        );
      },
    },
  ];

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-gray-400">-</span>;

    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, index) => (
          <svg
            key={index}
            className={`size-4 ${
              index < Math.floor(rating)
                ? 'fill-warning-500 text-warning-500'
                : 'fill-gray-300 text-gray-300 dark:fill-gray-600 dark:text-gray-600'
            }`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const filteredKontraktor = kontraktor.filter((kontrak) => {
    const matchSearch =
      searchQuery === '' ||
      kontrak.namaVendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kontrak.nomorIzin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kontrak.spesialisasi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kontrak.namaProyek?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = filterStatus === 'all' || kontrak.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const columns: ColumnDef<Kontraktor>[] = [
    {
      accessorKey: 'namaVendor',
      header: 'Nama Kontraktor',
      cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span>,
    },
    {
      accessorKey: 'nomorIzin',
      header: 'No. Izin',
    },
    {
      accessorKey: 'spesialisasi',
      header: 'Spesialisasi',
      cell: ({ getValue }) => (getValue() as string) || '-',
    },
    {
      accessorKey: 'namaProyek',
      header: 'Nama Proyek',
      cell: ({ getValue }) => (getValue() as string) || '-',
    },
    {
      accessorKey: 'jumlahProyek',
      header: 'Jumlah Proyek',
      cell: ({ getValue }) => `${getValue() as number} proyek`,
    },
    {
      accessorKey: 'rating',
      header: 'Rating',
      cell: ({ row }) => renderStars(row.original.rating),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => (
        <Badge size="sm" color={getStatusColor(getValue() as Kontraktor['status'])}>
          {getValue() as string}
        </Badge>
      ),
    },
    {
      accessorKey: 'warningTemuan',
      header: 'Warning',
      cell: ({ row }) =>
        row.original.warningTemuan ? (
          <Badge size="sm" color="error">
            ⚠️ {row.original.jumlahTemuan || 0} Temuan
          </Badge>
        ) : (
          <Badge size="sm" color="success">
            ✓ Aman
          </Badge>
        ),
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <ActionButtons
          onView={() => handleViewDetails(row.original)}
          onEdit={() => handleEdit(row.original)}
          onDelete={() => handleDelete(row.original)}
        />
      ),
    },
  ];

  // Stats Cards
  const stats = [
    {
      label: 'Total Kontraktor',
      value: kontraktor.length,
      color: 'text-brand-500',
    },
    {
      label: 'Kontraktor Aktif',
      value: kontraktor.filter((k) => k.status === 'AKTIF').length,
      color: 'text-success-500',
    },
    {
      label: 'Total Proyek',
      value: kontraktor.reduce((acc, k) => acc + k.jumlahProyek, 0),
      color: 'text-blue-light-500',
    },
    {
      label: 'Rating Rata-rata',
      value:
        kontraktor.length > 0
          ? (kontraktor.reduce((sum, k) => sum + (k.rating || 0), 0) / kontraktor.length).toFixed(1)
          : '0.0',
      color: 'text-warning-500',
    },
  ];

  const detailsSections = selectedData
    ? [
        {
          title: 'Informasi Kontraktor',
          fields: [
            { label: 'Nama Vendor', value: selectedData.namaVendor },
            { label: 'Nomor Izin', value: selectedData.nomorIzin },
            { label: 'Spesialisasi', value: selectedData.spesialisasi || '-' },
            { label: 'Nama Proyek', value: selectedData.namaProyek || '-' },
            { label: 'Jumlah Proyek', value: selectedData.jumlahProyek },
            {
              label: 'Rating',
              value: renderStars(selectedData.rating),
            },
            {
              label: 'Status',
              value: (
                <Badge color={getStatusColor(selectedData.status)}>{selectedData.status}</Badge>
              ),
            },
            {
              label: 'Warning Temuan',
              value: selectedData.warningTemuan ? (
                <Badge color="error">⚠️ Ada Temuan Audit</Badge>
              ) : (
                <Badge color="success">✓ Tidak Ada Temuan</Badge>
              ),
            },
            { label: 'Kontak', value: selectedData.kontak || '-' },
            { label: 'Alamat', value: selectedData.alamat || '-', fullWidth: true },
            {
              label: 'Deskripsi Progress',
              value: selectedData.deskripsiProgress || '-',
              fullWidth: true,
            },
            {
              label: 'Lama Kontrak',
              value: selectedData.lamaKontrak ? `${selectedData.lamaKontrak} hari` : '-',
            },
          ],
        },
      ]
    : [];

  const detailsDocuments = [
    ...(selectedData?.uploadDokumen
      ? [
          {
            id: selectedData.id + '-dokumen',
            namaDokumen: 'Dokumen Jaminan',
            filePath: selectedData.uploadDokumen,
            uploadedAt: selectedData.createdAt,
          },
        ]
      : []),
    ...(selectedData?.uploadFoto
      ? [
          {
            id: selectedData.id + '-foto',
            namaDokumen: 'Foto Progress',
            filePath: selectedData.uploadFoto,
            uploadedAt: selectedData.createdAt,
          },
        ]
      : []),
    ...(selectedData?.dokumenLaporan
      ? [
          {
            id: selectedData.id + '-laporan',
            namaDokumen: 'Dokumen Laporan',
            filePath: selectedData.dokumenLaporan,
            uploadedAt: selectedData.createdAt,
          },
        ]
      : []),
  ];

  return (
    <>
      <PageMeta
        title="SIPAKAT-PBJ - Konstruksi"
        description="Halaman Konstruksi untuk Vendor Penyedia"
      />
      <PageBreadcrumb pageTitle="Konstruksi" />

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title="Total Kontraktor"
            value={kontraktor.length}
            subtitle="Kontraktor terdaftar"
            icon={UserGroupIcon}
            fromColor="from-blue-500"
            toColor="to-blue-600"
          />
          <StatsCard
            title="Kontraktor Aktif"
            value={kontraktor.filter((k) => k.status === 'AKTIF').length}
            subtitle="Sedang aktif bekerja"
            icon={BuildingStorefrontIcon}
            fromColor="from-green-500"
            toColor="to-green-600"
          />
          <StatsCard
            title="Total Proyek"
            value={kontraktor.reduce((acc, k) => acc + k.jumlahProyek, 0)}
            subtitle="Proyek yang dikerjakan"
            icon={DocumentIcon}
            fromColor="from-purple-500"
            toColor="to-purple-600"
          />
          <StatsCard
            title="Rating Rata-rata"
            value={
              kontraktor.length > 0
                ? (
                    kontraktor.reduce((sum, k) => sum + (k.rating || 0), 0) / kontraktor.length
                  ).toFixed(1)
                : '0.0'
            }
            subtitle="Rata-rata rating kontraktor"
            icon={ChartBarIcon}
            fromColor="from-warning-500"
            toColor="to-warning-600"
          />
        </div>

        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Daftar Kontraktor Konstruksi
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola data kontraktor konstruksi dan evaluasi kinerja
            </p>
          </div>
          <Button
            size="md"
            variant="primary"
            startIcon={<PlusIcon />}
            onClick={openModal}
            disabled={isLoading}
          >
            Tambah Kontraktor
          </Button>
        </div>

        {/* Filter + Data Table */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              className="border border-gray-300 dark:border-gray-600 rounded-lg py-2 pl-3 pr-10 text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="AKTIF">Aktif</option>
              <option value="NON_AKTIF">Nonaktif</option>
              <option value="SUSPENDED">Ditangguhkan</option>
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredKontraktor}
          loading={isLoading}
          enableExport={true}
          enableColumnVisibility={false}
          pageSize={10}
          searchPlaceholder="Cari nama, nomor izin, spesialisasi, atau proyek..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          fixedHeight="750px"
          fixedWidth="1300px"
          minVisibleRows={10}
        />
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        size="2xl"
        title={editingKontraktor ? 'Edit Kontraktor' : 'Tambah Kontraktor Baru'}
        showHeader={true}
      >
        <div className="flex flex-col max-h-[80vh] overflow-y-auto px-6 py-4 space-y-4">
          <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            {editingKontraktor ? 'Edit Kontraktor' : 'Tambah Kontraktor Baru'}
          </h3>

          <div className="space-y-4">
            <div>
              <Label>Nama Kontraktor *</Label>
              <Input
                type="text"
                value={formData.namaVendor}
                onChange={(e) => setFormData({ ...formData, namaVendor: e.target.value })}
                placeholder="PT/CV Nama Kontraktor"
                error={!!formErrors.namaVendor}
                hint={formErrors.namaVendor}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nomor Izin *</Label>
                <Input
                  type="text"
                  value={formData.nomorIzin}
                  onChange={(e) => setFormData({ ...formData, nomorIzin: e.target.value })}
                  placeholder="IUJK-KON-XXX/2024"
                  error={!!formErrors.nomorIzin}
                  hint={formErrors.nomorIzin}
                />
              </div>
              <div>
                <Label>Spesialisasi</Label>
                <Input
                  type="text"
                  value={formData.spesialisasi}
                  onChange={(e) => setFormData({ ...formData, spesialisasi: e.target.value })}
                  placeholder="Bangunan, Jalan, dll"
                />
              </div>
            </div>

            <div>
              <Label>Alamat *</Label>
              <Input
                type="text"
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                placeholder="Kota/Kabupaten"
                error={!!formErrors.alamat}
                hint={formErrors.alamat}
              />
            </div>

            <div>
              <Label>Rating (0-5)</Label>
              <Input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (value >= 0 && value <= 5) {
                    setFormData({ ...formData, rating: e.target.value });
                  }
                }}
                placeholder="4.5"
              />
              <p className="text-xs text-gray-500 mt-1">Rating vendor dari 0 hingga 5</p>
            </div>

            <div>
              <Label>Nama Proyek</Label>
              <Input
                type="text"
                value={formData.namaProyek}
                onChange={(e) => setFormData({ ...formData, namaProyek: e.target.value })}
                placeholder="Nama proyek konstruksi"
              />
            </div>

            <div>
              <Label>Deskripsi Laporan Progress</Label>
              <textarea
                className="w-full h-24 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                value={formData.deskripsiProgress}
                onChange={(e) => setFormData({ ...formData, deskripsiProgress: e.target.value })}
                placeholder="Laporan progress mingguan, bulanan, akhir..."
              />
            </div>

            <div>
              <Label>Upload Dokumen Jaminan {!editingKontraktor && '*'}</Label>
              <p className="text-xs text-gray-500 mb-2">
                (Jaminan Uang Muka, Pelaksanaan, Pemeliharaan) - Maksimal 10MB, format PDF/DOC/DOCX
              </p>
              <input
                type="file"
                onChange={handleDokumenChange}
                accept=".pdf,.doc,.docx"
                className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              />
              {formErrors.uploadDokumen && (
                <p className="mt-1 text-xs text-error-500">{formErrors.uploadDokumen}</p>
              )}
              {editingKontraktor && (
                <p className="mt-1 text-xs text-warning-600">
                  Kosongkan jika tidak ingin mengubah file
                </p>
              )}
              {formData.uploadDokumen && (
                <p className="mt-1 text-xs text-green-600">✓ {formData.uploadDokumen.name}</p>
              )}
            </div>

            <div>
              <Label>Upload Foto Progress</Label>
              <p className="text-xs text-gray-500 mb-2">Maksimal 5MB, format JPG/JPEG/PNG</p>
              <input
                type="file"
                onChange={handleFotoChange}
                accept=".jpg,.jpeg,.png"
                className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              />
              {formErrors.uploadFoto && (
                <p className="mt-1 text-xs text-error-500">{formErrors.uploadFoto}</p>
              )}
              {editingKontraktor && (
                <p className="mt-1 text-xs text-warning-600">
                  Kosongkan jika tidak ingin mengubah foto
                </p>
              )}
              {formData.uploadFoto && (
                <p className="mt-1 text-xs text-green-600">✓ {formData.uploadFoto.name}</p>
              )}
            </div>

            <div>
              <Label>Kontak</Label>
              <Input
                type="email"
                value={formData.kontak}
                onChange={(e) => setFormData({ ...formData, kontak: e.target.value })}
                placeholder="email@kontraktor.com"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={closeModal} disabled={isLoading}>
              Batal
            </Button>
            <Button size="sm" variant="primary" onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Menyimpan...' : editingKontraktor ? 'Update' : 'Simpan'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title="Hapus Kontraktor"
        message={`Apakah Anda yakin ingin menghapus kontraktor "${deletingKontraktor?.namaVendor}"?`}
        confirmText="Hapus"
        cancelText="Batal"
        loading={isLoading}
      />

      {selectedData && (
        <DetailsModal
          isOpen={viewDetailsOpen}
          onClose={() => {
            setViewDetailsOpen(false);
            setActiveTab('data');
            setTemuanData([]);
          }}
          title="Detail Kontraktor Konstruksi"
          sections={detailsSections}
          documents={detailsDocuments}
          customTabs={[
            {
              id: 'temuan',
              label: (
                <div className="flex items-center gap-2">
                  <AlertIcon className="w-4 h-4" />
                  Temuan Audit
                  {temuanData.length > 0 && (
                    <Badge size="sm" color="error">
                      {temuanData.length}
                    </Badge>
                  )}
                </div>
              ),
              content: (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-semibold">Daftar Temuan Audit</h4>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-500">Total: {temuanData.length} temuan</div>
                      {temuanData.filter((t) => t.status === 'BARU' || t.status === 'DITOLAK')
                        .length > 0 && (
                        <Badge size="sm" color="error">
                          {
                            temuanData.filter((t) => t.status === 'BARU' || t.status === 'DITOLAK')
                              .length
                          }{' '}
                          Perlu Tanggapan
                        </Badge>
                      )}
                    </div>
                  </div>

                  {temuanData.length > 0 ? (
                    <DataTable
                      columns={temuanColumns}
                      data={temuanData}
                      loading={false}
                      pageSize={5}
                      searchPlaceholder="Cari temuan..."
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <AlertIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Tidak ada temuan audit</p>
                    </div>
                  )}
                </div>
              ),
            },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}

      {/* NEW: Temuan Response Modal */}
      <TemuanResponseModal
        isOpen={isResponseModalOpen}
        onClose={() => {
          setIsResponseModalOpen(false);
          setSelectedTemuan(null);
        }}
        temuan={selectedTemuan}
        vendorId={selectedData?.id || ''}
        onSuccess={handleResponseSuccess}
      />
    </>
  );
}
