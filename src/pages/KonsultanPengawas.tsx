import { useState, useEffect } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import Badge from "../components/ui/badge/Badge";
import { PlusIcon } from "../icons";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import Select from "../components/form/Select";
import { DataTable } from "../components/common/DataTable";
import { useToast } from "../hooks/useToast";
import { FileUploadPreview } from "../components/ui/FileUploadPreview";
import { ActionButtons } from "../components/common/ActionButtons";
import { DetailsModal } from "../components/common/DetailsModal";
import toast from "react-hot-toast";

const API_BASE_URL = 'http://localhost:3001';

interface KonsultanPengawas {
  id: string;
  namaVendor: string;
  jenisVendor: "KONSULTAN_PENGAWAS";
  nomorIzin: string;
  spesialisasi: string | null;
  jumlahProyek: number;
  rating: number | null;
  status: "AKTIF" | "NON_AKTIF" | "SUSPENDED";
  kontak: string | null;
  alamat: string | null;
  createdAt: string;
}

export default function KonsultanPengawas() {
  const [konsultanPengawas, setKonsultanPengawas] = useState<KonsultanPengawas[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [formData, setFormData] = useState({
    namaVendor: "",
    nomorIzin: "",
    spesialisasi: "",
    kontak: "",
    alamat: "",
  });
  const [editingKonsultan, setEditingKonsultan] = useState<KonsultanPengawas | null>(null);
  const [deletingKonsultan, setDeletingKonsultan] = useState<KonsultanPengawas | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const { isOpen, openModal, closeModal } = useModal();
  // details modal state injected
  const [selectedData, setSelectedData] = useState<any | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);

  const handleViewDetails = (data: KonsultanPengawas) => {
    setSelectedData(data);
    setViewDetailsOpen(true);
  };


  const { success: showSuccessToast, error: showErrorToast } = useToast();

  // Fetch konsultan data from API
  useEffect(() => {
    fetchKonsultan();
  }, []);

  const fetchKonsultan = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendor?jenis=KONSULTAN_PENGAWAS`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setKonsultanPengawas(data);
      }
    } catch (error) {
      console.error('Error fetching konsultan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const konsultanData = {
        namaVendor: formData.namaVendor,
        jenisVendor: "KONSULTAN_PENGAWAS" as const,
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
        toast.error('Konsultan berhasil disimpan!');
      } else {
        const errorText = await response.text();
        toast.error('Gagal menyimpan konsultan: ' + errorText);
      }
    } catch (error) {
      console.error('Error saving konsultan:', error);
      toast.error('Terjadi kesalahan saat menyimpan konsultan');
    }
  };

  const handleEdit = (konsultan: KonsultanPengawas) => {
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

  const handleDelete = (konsultan: KonsultanPengawas) => {
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

  const [uploadingKonsultan, setUploadingKonsultan] = useState<KonsultanPengawas | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    jenisDokumen: "",
    file: null as File | null,
  });

  const handleUpload = (konsultan: KonsultanPengawas) => {
    setUploadingKonsultan(konsultan);
    setUploadFormData({
      jenisDokumen: "",
      file: null,
    });
    setIsUploadModalOpen(true);
  };

  const handleUploadSubmit = async () => {
    if (!uploadingKonsultan || !uploadFormData.file || !uploadFormData.jenisDokumen || uploadFormData.jenisDokumen.trim() === '') {
      showErrorToast('Paket ID dan jenis dokumen harus diisi');
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('paketId', uploadingKonsultan.id);
      formDataToSend.append('jenisDokumen', uploadFormData.jenisDokumen);
      formDataToSend.append('file', uploadFormData.file);

      const response = await fetch(`${API_BASE_URL}/api/dokumen/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formDataToSend,
      });

      if (response.ok) {
        setIsUploadModalOpen(false);
        setUploadingKonsultan(null);
        setUploadFormData({
          jenisDokumen: "",
          file: null,
        });
        showSuccessToast('Dokumen berhasil diupload!');
      } else {
        const errorData = await response.json();
        showErrorToast('Gagal mengupload dokumen: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error uploading dokumen:', error);
      showErrorToast('Terjadi kesalahan saat mengupload dokumen');
    } finally {
      setLoading(false);
    }
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



  const getStatusColor = (status: KonsultanPengawas["status"]) => {
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
    
  const detailsSections = [
    {
      title: "Informasi Dasar",
      fields: [
        { label: "Nama Vendor", value: selectedData?.namaVendor ?? "-" },
        { label: "No. Izin", value: selectedData?.nomorIzin ?? "-" },
        { label: "Spesialisasi", value: selectedData?.spesialisasi ?? "-" },
        { label: "Jumlah Proyek", value: selectedData?.jumlahProyek ?? "-" },
        { label: "Rating", value: selectedData?.rating ?? "-" },
        { label: "Status", value: selectedData?.status ?? "-" },
      ]
    }
  ];
  const detailsDocuments = selectedData?.dokumen || (selectedData?.filePath ? [{ id: selectedData.id, namaDokumen: selectedData?.namaDokumen || 'Dokumen Terkait', filePath: selectedData?.filePath, uploadedAt: selectedData?.updatedAt || selectedData.tanggalUpload || new Date().toISOString() }] : []);


  // Stats Cards
  const stats = [
    {
      label: "Total Konsultan",
      value: konsultanPengawas.length,
      color: "text-brand-500",
    },
    {
      label: "Total Proyek",
      value: konsultanPengawas.reduce((acc, k) => acc + k.jumlahProyek, 0),
      color: "text-blue-light-500",
    },
    {
      label: "Konsultan Aktif",
      value: konsultanPengawas.filter((k) => k.status === "AKTIF").length,
      color: "text-success-500",
    },
    {
      label: "Rating Rata-rata",
      value: konsultanPengawas.length > 0 ? (konsultanPengawas.reduce((sum, k) => sum + (k.rating || 0), 0) / konsultanPengawas.length).toFixed(1) : "0.0",
      color: "text-warning-500",
    },
  ];

  return (
    <>
      <PageMeta
        title="Konsultan Pengawas | SIP-KPBJ"
        description="Halaman Konsultan Pengawas untuk Vendor Penyedia"
      />
      <PageBreadcrumb pageTitle="Konsultan Pengawas" />

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
              Daftar Konsultan Pengawas
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola data konsultan pengawas dan monitoring proyek
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
          data={filterStatus === "all" ? konsultanPengawas : konsultanPengawas.filter(k => k.status === filterStatus)}
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
            { id: 'actions', header: 'Aksi', cell: ({ row }) => (
        <ActionButtons
          onView={() => handleViewDetails(row.original)}
          onEdit={() => handleEdit(row.original)}
          onDelete={() => handleDelete(row.original.id)}
        />
      ), },,
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
            {editingKonsultan ? 'Edit Konsultan Pengawas' : 'Tambah Konsultan Pengawas Baru'}
          </h3>

          <div className="space-y-4">
            <div>
              <Label>Nama Konsultan</Label>
              <Input
                type="text"
                value={formData.namaVendor}
                onChange={(e) =>
                  setFormData({ ...formData, namaVendor: e.target.value })
                }
                placeholder="PT/CV Nama Konsultan"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nomor Izin</Label>
                <Input
                  type="text"
                  value={formData.nomorIzin}
                  onChange={(e) =>
                    setFormData({ ...formData, nomorIzin: e.target.value })
                  }
                  placeholder="IUJK-SUP-XXX/2024"
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
                  placeholder="Konstruksi, Jalan, dll"
                />
              </div>
            </div>

            <div>
              <Label>Alamat</Label>
              <Input
                type="text"
                value={formData.alamat}
                onChange={(e) =>
                  setFormData({ ...formData, alamat: e.target.value })
                }
                placeholder="Kota/Kabupaten"
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
            <Button size="sm" variant="primary" onClick={handleSubmit}>
              {editingKonsultan ? 'Update Konsultan' : 'Simpan Konsultan'}
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
          <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            Upload Dokumen untuk {uploadingKonsultan?.namaVendor}
          </h3>

          <div className="space-y-4">
            <div>
              <Label>Jenis Dokumen</Label>
              <Select
                value={uploadFormData.jenisDokumen}
                onChange={(value) => setUploadFormData({ ...uploadFormData, jenisDokumen: value })}
                options={[
                  { value: "SIUP", label: "SIUP" },
                  { value: "SIUJK", label: "SIUJK" },
                  { value: "Sertifikat_Keahlian", label: "Sertifikat Keahlian" },
                  { value: "NPWP", label: "NPWP" },
                  { value: "Laporan_Keuangan", label: "Laporan Keuangan" },
                  { value: "Dokumen_Lainnya", label: "Dokumen Lainnya" },
                ]}
                placeholder="Pilih jenis dokumen"
              />
            </div>

            <div>
              <Label>File Dokumen</Label>
              <FileUploadPreview
                onFileSelect={(file) => setUploadFormData({ ...uploadFormData, file })}
                accept="application/pdf,image/jpeg,image/png"
                maxSize={5}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={() => setIsUploadModalOpen(false)}>
              Batal
            </Button>
            <Button size="sm" variant="primary" onClick={handleUploadSubmit}>
              Upload Dokumen
            </Button>
          </div>
        </div>
      </Modal>
    
      {selectedData && (
        <DetailsModal
          isOpen={viewDetailsOpen}
          onClose={() => setViewDetailsOpen(false)}
          title={`Detail Konsultan Pengawas`}
          sections={detailsSections}
          documents={detailsDocuments}
        />
      )}
    </>
  );
}
