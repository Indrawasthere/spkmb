import { useState, useEffect } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import Badge from "../components/ui/badge/Badge";
import { PlusIcon, PencilIcon, TrashBinIcon } from "../icons";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import { DataTable } from "../components/common/DataTable";
import { useToast } from "../hooks/useToast";

const API_BASE_URL = 'http://localhost:3001';

interface Konsultan {
  id: string;
  namaVendor: string;
  jenisVendor: "KONSULTAN_PERENCANAAN";
  nomorIzin: string;
  spesialisasi: string | null;
  jumlahProyek: number;
  rating: number | null;
  status: "AKTIF" | "NON_AKTIF" | "SUSPENDED";
  kontak: string | null;
  alamat: string | null;
  createdAt: string;
}

export default function KonsultanPerencanaan() {
  const [konsultan, setKonsultan] = useState<Konsultan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [formData, setFormData] = useState({
    namaVendor: "",
    nomorIzin: "",
    spesialisasi: "",
    kontak: "",
    alamat: "",
  });
  const [editingKonsultan, setEditingKonsultan] = useState<Konsultan | null>(null);
  const [deletingKonsultan, setDeletingKonsultan] = useState<Konsultan | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadingKonsultan, setUploadingKonsultan] = useState<Konsultan | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { isOpen, openModal, closeModal } = useModal();
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  // Fetch konsultan data from API
  useEffect(() => {
    fetchKonsultan();
  }, []);

  const fetchKonsultan = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendor?jenis=KONSULTAN_PERENCANAAN`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setKonsultan(data);
      }
    } catch (error) {
      console.error('Error fetching konsultan:', error);
    } finally {
      setLoading(false);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.namaVendor.trim()) {
      newErrors.namaVendor = "Nama konsultan wajib diisi";
    }
    if (!formData.nomorIzin.trim()) {
      newErrors.nomorIzin = "Nomor izin wajib diisi";
    }
    if (!formData.alamat.trim()) {
      newErrors.alamat = "Alamat wajib diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showErrorToast("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const konsultanData = {
        namaVendor: formData.namaVendor,
        jenisVendor: "KONSULTAN_PERENCANAAN" as const,
        nomorIzin: formData.nomorIzin,
        spesialisasi: formData.spesialisasi || null,
        kontak: formData.kontak || null,
        alamat: formData.alamat || null,
      };

      let response;
      if (editingKonsultan) {
        response = await fetch(`${API_BASE_URL}/api/vendor/${editingKonsultan.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(konsultanData),
        });
      } else {
        response = await fetch(`${API_BASE_URL}/api/vendor`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(konsultanData),
        });
      }

      if (response.ok) {
        await fetchKonsultan();
        closeModal();
        resetForm();
        showSuccessToast(editingKonsultan ? 'Konsultan berhasil diperbarui!' : 'Konsultan berhasil ditambahkan!');
      } else {
        const errorData = await response.json();
        showErrorToast('Gagal menyimpan konsultan: ' + (errorData.error || 'Terjadi kesalahan'));
      }
    } catch (error) {
      console.error('Error saving konsultan:', error);
      showErrorToast('Terjadi kesalahan saat menyimpan konsultan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (konsultan: Konsultan) => {
    setEditingKonsultan(konsultan);
    setFormData({
      namaVendor: konsultan.namaVendor,
      nomorIzin: konsultan.nomorIzin,
      spesialisasi: konsultan.spesialisasi || "",
      kontak: konsultan.kontak || "",
      alamat: konsultan.alamat || "",
    });
    openModal();
  };

  const handleDelete = (konsultan: Konsultan) => {
    setDeletingKonsultan(konsultan);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingKonsultan) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendor/${deletingKonsultan.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await fetchKonsultan();
        showSuccessToast('Konsultan berhasil dihapus!');
      } else {
        const errorData = await response.json();
        showErrorToast('Gagal menghapus konsultan: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting konsultan:', error);
      showErrorToast('Terjadi kesalahan saat menghapus konsultan');
    } finally {
      setLoading(false);
      setIsConfirmModalOpen(false);
      setDeletingKonsultan(null);
    }
  };

  const handleUpload = (konsultan: Konsultan) => {
    setUploadingKonsultan(konsultan);
    setIsUploadModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      namaVendor: "",
      nomorIzin: "",
      spesialisasi: "",
      kontak: "",
      alamat: "",
    });
    setEditingKonsultan(null);
  };

  const getStatusColor = (status: Konsultan["status"]) => {
    switch (status) {
      case "AKTIF":
        return "success";
      case "NON_AKTIF":
        return "warning";
      case "SUSPENDED":
        return "error";
      default:
        return "light";
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
                ? "fill-warning-500 text-warning-500"
                : "fill-gray-300 text-gray-300 dark:fill-gray-600 dark:text-gray-600"
            }`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  // Stats Cards
  const stats = [
    {
      label: "Total Konsultan",
      value: konsultan.length,
      color: "text-brand-500",
    },
    {
      label: "Konsultan Aktif",
      value: konsultan.filter((k) => k.status === "AKTIF").length,
      color: "text-success-500",
    },
    {
      label: "Total Proyek",
      value: konsultan.reduce((acc, k) => acc + k.jumlahProyek, 0),
      color: "text-blue-light-500",
    },
    {
      label: "Rating Rata-rata",
      value: konsultan.length > 0 ? (konsultan.reduce((sum, k) => sum + (k.rating || 0), 0) / konsultan.length).toFixed(1) : "0.0",
      color: "text-warning-500",
    },
  ];

  return (
    <>
      <PageMeta
        title="Konsultan Perencanaan | SIP-KPBJ"
        description="Halaman Konsultan Perencanaan untuk Vendor Penyedia"
      />
      <PageBreadcrumb pageTitle="Konsultan Perencanaan" />

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stat.label}
              </p>
              <h3 className={`mt-2 text-3xl font-bold ${stat.color}`}>
                {stat.value}
              </h3>
            </div>
          ))}
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
          >
            Tambah Konsultan
          </Button>
        </div>

        {/* Filter */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <select
                className="h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
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
        </div>

        {/* DataTable */}
        <DataTable
          data={filterStatus === "all" ? konsultan : konsultan.filter(k => k.status === filterStatus)}
          columns={[
            {
              accessorKey: "namaVendor",
              header: "Nama Konsultan",
              cell: ({ row }) => (
                <div>
                  <p className="font-medium">{row.original.namaVendor}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {row.original.alamat}
                  </p>
                </div>
              ),
            },
            {
              accessorKey: "nomorIzin",
              header: "No. Izin",
            },
            {
              accessorKey: "spesialisasi",
              header: "Spesialisasi",
            },
            {
              accessorKey: "jumlahProyek",
              header: "Jumlah Proyek",
              cell: ({ row }) => `${row.original.jumlahProyek} proyek`,
            },
            {
              accessorKey: "rating",
              header: "Rating",
              cell: ({ row }) => renderStars(row.original.rating),
            },
            {
              accessorKey: "status",
              header: "Status",
              cell: ({ row }) => (
                <Badge size="sm" color={getStatusColor(row.original.status)}>
                  {row.original.status}
                </Badge>
              ),
            },
            {
              accessorKey: "actions",
              header: "Aksi",
              cell: ({ row }) => (
                <div className="flex gap-2">
                  <button
                    className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                    onClick={() => handleUpload(row.original)}
                  >
                    Upload
                  </button>
                  <button
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    onClick={() => handleEdit(row.original)}
                  >
                    <PencilIcon className="size-4" />
                  </button>
                  <button
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    onClick={() => handleDelete(row.original)}
                  >
                    <TrashBinIcon className="size-5" />
                  </button>
                </div>
              ),
            },
          ]}
          loading={loading}
          searchPlaceholder="Cari konsultan..."
        />
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        size="2xl"
        title={editingKonsultan ? "" : ""}
        showHeader={true}
      >
        <div className="p-6">
          <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            {editingKonsultan ? 'Edit Konsultan' : 'Tambah Konsultan Baru'}
          </h3>

          <div className="space-y-4">
            <div>
              <Label>Nama Konsultan *</Label>
              <Input
                type="text"
                value={formData.namaVendor}
                onChange={(e) =>
                  setFormData({ ...formData, namaVendor: e.target.value })
                }
                placeholder="PT/CV Nama Konsultan"
                error={!!errors.namaVendor}
                hint={errors.namaVendor}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nomor Izin *</Label>
                <Input
                  type="text"
                  value={formData.nomorIzin}
                  onChange={(e) =>
                    setFormData({ ...formData, nomorIzin: e.target.value })
                  }
                  placeholder="IUJK-XXX/2024"
                  error={!!errors.nomorIzin}
                  hint={errors.nomorIzin}
                />
              </div>
              <div>
                <Label>Spesialisasi</Label>
                <Input
                  type="text"
                  value={formData.spesialisasi}
                  onChange={(e) =>
                    setFormData({ ...formData, spesialisasi: e.target.value })
                  }
                  placeholder="Jalan, Bangunan, dll"
                />
              </div>
            </div>

            <div>
              <Label>Alamat *</Label>
              <Input
                type="text"
                value={formData.alamat}
                onChange={(e) =>
                  setFormData({ ...formData, alamat: e.target.value })
                }
                placeholder="Kota/Kabupaten"
                error={!!errors.alamat}
                hint={errors.alamat}
              />
            </div>

            <div>
              <Label>Kontak</Label>
              <Input
                type="email"
                value={formData.kontak}
                onChange={(e) =>
                  setFormData({ ...formData, kontak: e.target.value })
                }
                placeholder="email@konsultan.com"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={closeModal}>
              Batal
            </Button>
            <Button size="sm" variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : (editingKonsultan ? 'Update Konsultan' : 'Simpan Konsultan')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title="Konfirmasi Hapus"
        message={`Apakah Anda yakin ingin menghapus konsultan "${deletingKonsultan?.namaVendor}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        size="lg"
        title="Upload Dokumen"
        showHeader={true}
      >
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Upload Dokumen untuk {uploadingKonsultan?.namaVendor}
          </h3>

          <div className="space-y-4">
            <div>
              <Label>Jenis Dokumen</Label>
              <select className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                <option value="">Pilih jenis dokumen</option>
                <option value="izin_usaha">Izin Usaha</option>
                <option value="sertifikat_kompetensi">Sertifikat Kompetensi</option>
                <option value="surat_rekomendasi">Surat Rekomendasi</option>
                <option value="laporan_keuangan">Laporan Keuangan</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <Label>File Dokumen</Label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              />
              {selectedFile && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  File dipilih: {selectedFile.name}
                </p>
              )}
            </div>

            <div>
              <Label>Deskripsi (Opsional)</Label>
              <textarea
                className="w-full h-24 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                placeholder="Tambahkan deskripsi dokumen..."
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={() => setIsUploadModalOpen(false)}>
              Batal
            </Button>
            <Button size="sm" variant="primary" disabled={!selectedFile}>
              Upload Dokumen
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
