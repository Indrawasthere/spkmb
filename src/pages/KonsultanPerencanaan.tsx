import { useState, useEffect } from 'react';
import PageBreadcrumb from '../components/common/PageBreadCrumb';
import PageMeta from '../components/common/PageMeta';
import Button from '../components/ui/button/Button';
import Badge from '../components/ui/badge/Badge';
import { PlusIcon, AlertIcon } from '../icons';
import { Modal } from '../components/ui/modal';
import { useModal } from '../hooks/useModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import Input from '../components/form/input/InputField';
import Label from '../components/form/Label';
import { DataTable } from '../components/common/DataTable';
import { useToast } from '../hooks/useToast';
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

interface Konsultan {
  id: string;
  namaVendor: string;
  jenisVendor: 'KONSULTAN_PERENCANAAN';
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

interface TemuanVendor {
  id: string;
  nomorTemuan: string;
  judul: string;
  deskripsi: string;
  tingkat: string;
  status: 'BARU' | 'DALAM_PERBAIKAN' | 'DIPERBAIKI' | 'DITOLAK';
  tanggalTemuan: string;
  tanggalDitanggapi?: string;
  tanggalSelesai?: string;
  tanggapanVendor?: string;
  dokumenPerbaikan?: string[];
  paket: {
    kodePaket: string;
    namaPaket: string;
  };
  sourceType: 'ITWASDA' | 'BPKP' | 'PUPR';
}

interface KonsultanFormData {
  namaVendor: string;
  nomorIzin: string;
  spesialisasi: string;
  kontak: string;
  alamat: string;
  deskripsi: string;
  lamaKontrak: string;
  dokumenDED: File | null;
  rating: string;
}

interface FormErrors {
  namaVendor?: string;
  nomorIzin?: string;
  alamat?: string;
  dokumenDED?: string;
}

export default function KonsultanPerencanaan() {
  const [konsultan, setKonsultan] = useState<Konsultan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedData, setSelectedData] = useState<Konsultan | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingKonsultan, setEditingKonsultan] = useState<Konsultan | null>(null);
  const [deletingKonsultan, setDeletingKonsultan] = useState<Konsultan | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [temuanData, setTemuanData] = useState<TemuanVendor[]>([]);
  const [selectedTemuan, setSelectedTemuan] = useState<TemuanVendor | null>(null);
  const [viewTemuanModalOpen, setViewTemuanModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'data' | 'temuan'>('data');
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);

  const [formData, setFormData] = useState<KonsultanFormData>({
    namaVendor: '',
    nomorIzin: '',
    spesialisasi: '',
    kontak: '',
    alamat: '',
    deskripsi: '',
    lamaKontrak: '',
    dokumenDED: null,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const { isOpen, openModal, closeModal } = useModal();
  const { success, error, info, loading } = useToast();

  // Fetch konsultan data from API
  useEffect(() => {
    fetchKonsultan();
  }, []);

  const fetchKonsultan = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendor?jenis=KONSULTAN_PERENCANAAN`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();

        // CRITICAL FIX: Check if data is array or wrapped object
        if (Array.isArray(data)) {
          setKonsultan(data);
        } else if (data.data && Array.isArray(data.data)) {
          setKonsultan(data.data);
        } else if (data.vendors && Array.isArray(data.vendors)) {
          setKonsultan(data.vendors);
        } else {
          console.error('Unexpected API response format:', data);
          error('Format data tidak sesuai');
          setKonsultan([]);
        }
      } else {
        error('Gagal memuat data konsultan');
        setKonsultan([]);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      error('Gagal memuat data konsultan');
      setKonsultan([]);
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Fetch temuan data for selected konsultan
  const fetchTemuan = async (vendorId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendors/${vendorId}/temuan`, {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();

        // Handle both wrapped and unwrapped responses
        if (result.success && result.data) {
          setTemuanData(result.data);
        } else if (Array.isArray(result)) {
          setTemuanData(result);
        } else {
          console.warn('No temuan data found');
          setTemuanData([]);
        }
      } else {
        console.error('Failed to fetch temuan');
        setTemuanData([]);
      }
    } catch (err) {
      console.error('Gagal memuat data temuan:', err);
      setTemuanData([]);
    }
  };

  const handleViewTemuan = (temuan: TemuanVendor) => {
    setSelectedTemuan(temuan);
    setViewTemuanModalOpen(true);
  };

  const handleViewDetails = async (data: Konsultan) => {
    setSelectedData(data);
    setActiveTab('data'); // Reset to data tab
    await fetchTemuan(data.id);
    setViewDetailsOpen(true);
  };

  const handleRespond = (temuan: TemuanVendor) => {
    setSelectedTemuan(temuan);
    setIsResponseModalOpen(true);
  };

  const handleResponseSuccess = async () => {
    if (selectedData) {
      await fetchTemuan(selectedData.id);
    }
    success('Tanggapan berhasil dikirim!');
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

  // NEW: Get tingkat color for temuan
  const getTingkatColor = (tingkat: string) => {
    switch (tingkat) {
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
      cell: ({ getValue }) => <span className="text-sm">{getValue() as string}</span>,
    },
    {
      accessorKey: 'paket.namaPaket',
      header: 'Paket Terkait',
      cell: ({ row }) => (
        <div className="text-xs">
          <div className="font-medium">{row.original.paket?.namaPaket}</div>
          <div className="text-gray-500">{row.original.paket?.kodePaket}</div>
        </div>
      ),
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
      cell: ({ getValue }) => (
        <span className="text-xs text-gray-600">
          {new Date(getValue() as string).toLocaleDateString('id-ID')}
        </span>
      ),
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

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.namaVendor.trim()) {
      newErrors.namaVendor = 'Nama konsultan wajib diisi';
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

  const onSubmit = async (data: KonsultanFormData) => {
    if (!validateForm()) return;

    setIsLoading(true);
    loading(editingKonsultan ? 'Memperbarui konsultan...' : 'Menyimpan konsultan...');

    try {
      const fd = new FormData();
      fd.append('namaVendor', data.namaVendor);
      fd.append('jenisVendor', 'KONSULTAN_PERENCANAAN');
      fd.append('nomorIzin', data.nomorIzin);
      fd.append('spesialisasi', data.spesialisasi || '');
      fd.append('kontak', data.kontak || '');
      fd.append('alamat', data.alamat || '');
      fd.append('deskripsi', data.deskripsi || '');
      fd.append('lamaKontrak', data.lamaKontrak || '0');

      if (data.rating) {
        fd.append('rating', data.rating);
      }

      if (data.dokumenDED) {
        fd.append('dokumenDED', data.dokumenDED);
      }

      let response;
      if (editingKonsultan) {
        response = await fetch(`${API_BASE_URL}/api/vendor/${editingKonsultan.id}`, {
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
        await fetchKonsultan();
        closeModal();
        resetForm();
        setEditingKonsultan(null);
        success(
          editingKonsultan ? 'Konsultan berhasil diperbarui!' : 'Konsultan berhasil disimpan!'
        );
      } else {
        const errorText = await response.text();
        error('Gagal menyimpan konsultan: ' + errorText);
      }
    } catch (err) {
      error('Terjadi kesalahan saat menyimpan konsultan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (konsultan: Konsultan) => {
    setEditingKonsultan(konsultan);
    setFormData({
      namaVendor: konsultan.namaVendor,
      nomorIzin: konsultan.nomorIzin,
      spesialisasi: konsultan.spesialisasi || '',
      kontak: konsultan.kontak || '',
      alamat: konsultan.alamat || '',
      deskripsi: konsultan.deskripsi || '',
      lamaKontrak: konsultan.lamaKontrak?.toString() || '',
      dokumenDED: null,
      rating: konsultan.rating ? konsultan.rating.toString() : '',
    });
    openModal();
  };

  const handleDelete = (konsultan: Konsultan) => {
    setDeletingKonsultan(konsultan);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingKonsultan) return;
    setIsLoading(true);
    loading('Menghapus konsultan...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/vendor/${deletingKonsultan.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await fetchKonsultan();
        success('Konsultan berhasil dihapus!');
      } else {
        const errorData = await response.json();
        error('Gagal menghapus: ' + (errorData.error || 'Unknown error'));
      }
    } catch (err) {
      error('Terjadi kesalahan saat menghapus konsultan');
    } finally {
      setIsLoading(false);
      setIsConfirmModalOpen(false);
      setDeletingKonsultan(null);
    }
  };

  const handleSubmit = () => onSubmit(formData);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setFormErrors({ ...formErrors, dokumenDED: 'Ukuran file maksimal 10MB' });
        return;
      }

      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
      ];

      if (!allowedTypes.includes(file.type)) {
        setFormErrors({ ...formErrors, dokumenDED: 'Format file tidak didukung' });
        return;
      }

      setFormData({ ...formData, dokumenDED: file });
      setFormErrors({ ...formErrors, dokumenDED: undefined });
    }
  };

  const resetForm = () => {
    setFormData({
      namaVendor: '',
      nomorIzin: '',
      spesialisasi: '',
      kontak: '',
      alamat: '',
      deskripsi: '',
      lamaKontrak: '',
      dokumenDED: null,
      rating: '',
    });
    setFormErrors({});
    setEditingKonsultan(null);
  };

  const getStatusColor = (status: Konsultan['status']) => {
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

  const filteredKonsultan = (konsultan || []).filter((kons) => {
    const matchSearch =
      searchQuery === '' ||
      kons.namaVendor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kons.nomorIzin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kons.spesialisasi?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = filterStatus === 'all' || kons.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const columns: ColumnDef<Konsultan>[] = [
    {
      accessorKey: 'namaVendor',
      header: 'Nama Konsultan',
      cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span>,
    },
    {
      accessorKey: 'nomorIzin',
      header: 'No. Kontrak',
    },
    {
      accessorKey: 'spesialisasi',
      header: 'Spesialisasi',
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
        <Badge size="sm" color={getStatusColor(getValue() as Konsultan['status'])}>
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

  // Stats Cards - UPDATED with temuan stats
  const stats = [
    {
      label: 'Total Konsultan',
      value: konsultan?.length || 0,
      color: 'text-brand-500',
    },
    {
      label: 'Konsultan Aktif',
      value: konsultan?.filter((k) => k.status === 'AKTIF').length || 0,
      color: 'text-success-500',
    },
    {
      label: 'Total Proyek',
      value: konsultan?.reduce((acc, k) => acc + (k.jumlahProyek || 0), 0) || 0,
      color: 'text-blue-light-500',
    },
    {
      label: 'Temuan Aktif',
      value: konsultan?.reduce((acc, k) => acc + (k.jumlahTemuan || 0), 0) || 0,
      color: 'text-error-500',
    },
  ];

  // UPDATED: Details sections with temuan info
  const detailsSections = selectedData
    ? [
        {
          title: 'Informasi Dasar',
          fields: [
            { label: 'Nama Vendor', value: selectedData.namaVendor },
            { label: 'No. Kontrak', value: selectedData.nomorIzin },
            { label: 'Spesialisasi', value: selectedData.spesialisasi || '-' },
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
              label: 'Temuan Aktif',
              value: (
                <div className="flex items-center gap-2">
                  <Badge color={selectedData.warningTemuan ? 'error' : 'success'}>
                    {selectedData.warningTemuan
                      ? `⚠️ ${selectedData.jumlahTemuan || 0} Temuan`
                      : '✓ Tidak Ada Temuan'}
                  </Badge>
                </div>
              ),
            },
            { label: 'Kontak', value: selectedData.kontak || '-' },
            { label: 'Alamat', value: selectedData.alamat || '-', fullWidth: true },
            { label: 'Deskripsi', value: selectedData.deskripsi || '-', fullWidth: true },
            {
              label: 'Lama Kontrak',
              value: selectedData.lamaKontrak ? `${selectedData.lamaKontrak} hari` : '-',
            },
          ],
        },
      ]
    : [];

  const detailsDocuments = selectedData?.dokumenDED
    ? [
        {
          id: selectedData.id + '-ded',
          namaDokumen: 'Dokumen DED',
          filePath: selectedData.dokumenDED,
          uploadedAt: selectedData.createdAt,
        },
      ]
    : [];

  return (
    <>
      <PageMeta
        title="SIPAKAT-PBJ - Konsultan Perencanaan"
        description="Halaman Konsultan Perencanaan untuk Vendor Penyedia"
      />
      <PageBreadcrumb pageTitle="Konsultan Perencanaan" />

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title="Total Konsultan"
            value={konsultan.length}
            subtitle="Konsultan terdaftar"
            icon={UserGroupIcon}
            fromColor="from-blue-500"
            toColor="to-blue-600"
          />
          <StatsCard
            title="Konsultan Aktif"
            value={konsultan.filter((k) => k.status === 'AKTIF').length}
            subtitle="Sedang aktif bekerja"
            icon={BuildingStorefrontIcon}
            fromColor="from-green-500"
            toColor="to-green-600"
          />
          <StatsCard
            title="Total Proyek"
            value={konsultan.reduce((acc, k) => acc + k.jumlahProyek, 0)}
            subtitle="Proyek yang dikerjakan"
            icon={DocumentIcon}
            fromColor="from-purple-500"
            toColor="to-purple-600"
          />
          <StatsCard
            title="Temuan Aktif"
            value={konsultan.reduce((acc, k) => acc + (k.jumlahTemuan || 0), 0)}
            subtitle="Temuan yang perlu ditindak"
            icon={AlertIcon}
            fromColor="from-red-500"
            toColor="to-red-600"
          />
        </div>

        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Daftar Konsultan Perencanaan
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola data konsultan perencanaan dan evaluasi kinerja
            </p>
          </div>
          <Button
            size="md"
            variant="primary"
            startIcon={<PlusIcon />}
            onClick={openModal}
            disabled={isLoading}
          >
            Tambah Konsultan
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
          data={filteredKonsultan}
          loading={isLoading}
          enableExport={true}
          enableColumnVisibility={false}
          pageSize={10}
          searchPlaceholder="Cari nama, nomor kontrak, atau spesialisasi..."
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
        title={editingKonsultan ? 'Edit Konsultan' : 'Tambah Konsultan Baru'}
        showHeader={true}
      >
        <div className="flex flex-col max-h-[80vh] overflow-y-auto px-6 py-4 space-y-4">
          <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            {editingKonsultan ? 'Edit Konsultan' : 'Tambah Konsultan Baru'}
          </h3>

          <div className="space-y-4">
            <div>
              <Label>Nama Konsultan *</Label>
              <Input
                type="text"
                value={formData.namaVendor}
                onChange={(e) => setFormData({ ...formData, namaVendor: e.target.value })}
                placeholder="PT/CV Nama Konsultan"
                error={!!formErrors.namaVendor}
                hint={formErrors.namaVendor}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nomor Kontrak *</Label>
                <Input
                  type="text"
                  value={formData.nomorIzin}
                  onChange={(e) => setFormData({ ...formData, nomorIzin: e.target.value })}
                  placeholder="IUJK-XXX/2024"
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
                  placeholder="Jalan, Bangunan, dll"
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
              <Label>Kontak</Label>
              <Input
                type="email"
                value={formData.kontak}
                onChange={(e) => setFormData({ ...formData, kontak: e.target.value })}
                placeholder="email@konsultan.com"
              />
            </div>

            <div>
              <Label>Deskripsi</Label>
              <textarea
                className="w-full h-24 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                value={formData.deskripsi}
                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                placeholder="Deskripsi pekerjaan konsultan..."
              />
            </div>

            <div>
              <Label>Lama Kontrak (hari)</Label>
              <Input
                type="number"
                value={formData.lamaKontrak}
                onChange={(e) => setFormData({ ...formData, lamaKontrak: e.target.value })}
                placeholder="90"
              />
            </div>

            <div>
              <Label>Upload DED / Gambar {!editingKonsultan && '*'}</Label>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              />
              {formErrors.dokumenDED && (
                <p className="mt-1 text-xs text-error-500">{formErrors.dokumenDED}</p>
              )}
              {editingKonsultan && (
                <p className="mt-1 text-xs text-warning-600">
                  Kosongkan jika tidak ingin mengubah file
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={closeModal} disabled={isLoading}>
              Batal
            </Button>
            <Button size="sm" variant="primary" onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Menyimpan...' : editingKonsultan ? 'Update' : 'Simpan'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title="Hapus Konsultan"
        message={`Apakah Anda yakin ingin menghapus konsultan "${deletingKonsultan?.namaVendor}"?`}
        confirmText="Hapus"
        cancelText="Batal"
        loading={isLoading}
      />

      {/* UPDATED: Details Modal with Temuan Tab */}
      {selectedData && (
        <DetailsModal
          isOpen={viewDetailsOpen}
          onClose={() => {
            setViewDetailsOpen(false);
            setActiveTab('data');
            setTemuanData([]);
          }}
          title="Detail Konsultan Perencanaan"
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

      {/* NEW: Temuan Detail Modal */}
      {selectedTemuan && (
        <Modal
          isOpen={viewTemuanModalOpen}
          onClose={() => setViewTemuanModalOpen(false)}
          size="lg"
          title="Detail Temuan Audit"
          showHeader={true}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nomor Temuan</Label>
                <div className="font-medium">{selectedTemuan.nomorTemuan}</div>
              </div>
              <div>
                <Label>Status</Label>
                <div>
                  <Badge color={getTemuanStatusColor(selectedTemuan.status)}>
                    {selectedTemuan.status}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Tingkat</Label>
                <div>
                  <Badge color={getTingkatColor(selectedTemuan.tingkat)}>
                    {selectedTemuan.tingkat}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Tanggal Temuan</Label>
                <div>{new Date(selectedTemuan.tanggalTemuan).toLocaleDateString('id-ID')}</div>
              </div>
            </div>

            <div>
              <Label>Judul Temuan</Label>
              <div className="font-medium">{selectedTemuan.judul}</div>
            </div>

            <div>
              <Label>Deskripsi</Label>
              <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                {selectedTemuan.deskripsi}
              </div>
            </div>

            <div>
              <Label>Paket Terkait</Label>
              <div className="font-medium">{selectedTemuan.paket?.namaPaket}</div>
              <div className="text-sm text-gray-500">{selectedTemuan.paket?.kodePaket}</div>
            </div>

            <div>
              <Label>Sumber Temuan</Label>
              <div className="font-medium">{selectedTemuan.sourceType}</div>
            </div>

            {selectedTemuan.tanggapanVendor && (
              <div>
                <Label>Tanggapan Vendor</Label>
                <div className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
                  {selectedTemuan.tanggapanVendor}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setViewTemuanModalOpen(false)}>
                Tutup
              </Button>
            </div>
          </div>
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
        </Modal>
      )}
    </>
  );
}
