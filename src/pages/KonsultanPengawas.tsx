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
import { ActionButtons } from "../components/common/ActionButtons";
import { DetailsModal } from "../components/common/DetailsModal";
import { ColumnDef } from "@tanstack/react-table";
import { StatsCard } from "../components/common/StatsCard";
import {
  DocumentChartBarIcon as DocumentIcon,
  UserGroupIcon,
  ChartBarIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
  deskripsi?: string;
  dokumenLaporan?: string;
  lamaKontrak?: number;
  namaProyek?: string;
  deskripsiLaporan?: string;
  deskripsiProgress?: string;
  uploadDokumen?: string;
  uploadFoto?: string;
  warningTemuan?: boolean;
  createdAt: string;
}

interface KonsultanFormData {
  namaVendor: string;
  nomorIzin: string;
  spesialisasi: string;
  kontak: string;
  alamat: string;
  namaProyek: string;
  deskripsiLaporan: string;
  lamaKontrak: string;
  dokumenLaporan: File | null;
}

interface FormErrors {
  namaVendor?: string;
  nomorIzin?: string;
  alamat?: string;
  dokumenLaporan?: string;
}

export default function KonsultanPengawas() {
  const [konsultanPengawas, setKonsultanPengawas] = useState<KonsultanPengawas[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedData, setSelectedData] = useState<KonsultanPengawas | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingKonsultan, setEditingKonsultan] = useState<KonsultanPengawas | null>(null);
  const [deletingKonsultan, setDeletingKonsultan] = useState<KonsultanPengawas | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState<KonsultanFormData>({
    namaVendor: "",
    nomorIzin: "",
    spesialisasi: "",
    kontak: "",
    alamat: "",
    namaProyek: "",
    deskripsiLaporan: "",
    lamaKontrak: "",
    dokumenLaporan: null,
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
      const response = await fetch(`${API_BASE_URL}/api/vendor?jenis=KONSULTAN_PENGAWAS`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setKonsultanPengawas(data);
      }
    } catch (err) {
      error("Gagal memuat data konsultan pengawas");
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.namaVendor.trim()) {
      newErrors.namaVendor = "Nama konsultan wajib diisi";
    }
    if (!formData.nomorIzin.trim()) {
      newErrors.nomorIzin = "Nomor izin wajib diisi";
    }
    if (!formData.alamat.trim()) {
      newErrors.alamat = "Alamat wajib diisi";
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (data: KonsultanFormData) => {
    if (!validateForm()) return;

    setIsLoading(true);
    loading(editingKonsultan ? "Memperbarui konsultan..." : "Menyimpan konsultan...");

    try {
      const fd = new FormData();
      fd.append('namaVendor', data.namaVendor);
      fd.append('jenisVendor', "KONSULTAN_PENGAWAS");
      fd.append('nomorIzin', data.nomorIzin);
      fd.append('spesialisasi', data.spesialisasi || "");
      fd.append('kontak', data.kontak || "");
      fd.append('alamat', data.alamat || "");
      fd.append('namaProyek', data.namaProyek || "");
      fd.append('deskripsiLaporan', data.deskripsiLaporan || "");
      fd.append('lamaKontrak', data.lamaKontrak || "0");

      if (data.dokumenLaporan) {
        fd.append('dokumenLaporan', data.dokumenLaporan);
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
        success(editingKonsultan ? "Konsultan berhasil diperbarui!" : "Konsultan berhasil disimpan!");
      } else {
        const errorText = await response.text();
        error("Gagal menyimpan konsultan: " + errorText);
      }
    } catch (err) {
      error("Terjadi kesalahan saat menyimpan konsultan");
    } finally {
      setIsLoading(false);
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
      namaProyek: konsultan.namaProyek || "",
      deskripsiLaporan: konsultan.deskripsiLaporan || "",
      lamaKontrak: konsultan.lamaKontrak ? konsultan.lamaKontrak.toString() : "",
      dokumenLaporan: null,
    });
    openModal();
  };

  const handleViewDetails = (data: KonsultanPengawas) => {
    setSelectedData(data);
    setViewDetailsOpen(true);
  };

  const handleDelete = (konsultan: KonsultanPengawas) => {
    setDeletingKonsultan(konsultan);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingKonsultan) return;
    setIsLoading(true);
    loading("Menghapus konsultan...");

    try {
      const response = await fetch(`${API_BASE_URL}/api/vendor/${deletingKonsultan.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await fetchKonsultan();
        success("Konsultan berhasil dihapus!");
      } else {
        const errorData = await response.json();
        error("Gagal menghapus: " + (errorData.error || 'Unknown error'));
      }
    } catch (err) {
      error("Terjadi kesalahan saat menghapus konsultan");
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
        setFormErrors({ ...formErrors, dokumenLaporan: "Ukuran file maksimal 10MB" });
        return;
      }

      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      if (!allowedTypes.includes(file.type)) {
        setFormErrors({ ...formErrors, dokumenLaporan: "Format file tidak didukung" });
        return;
      }

      setFormData({ ...formData, dokumenLaporan: file });
      setFormErrors({ ...formErrors, dokumenLaporan: undefined });
    }
  };

  const resetForm = () => {
    setFormData({
      namaVendor: "",
      nomorIzin: "",
      spesialisasi: "",
      kontak: "",
      alamat: "",
      namaProyek: "",
      deskripsiLaporan: "",
      lamaKontrak: "",
      dokumenLaporan: null,
    });
    setFormErrors({});
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

  const filteredKonsultan = konsultanPengawas.filter((kons) => {
    const matchSearch =
      searchQuery === "" ||
      kons.namaVendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kons.nomorIzin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kons.spesialisasi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kons.namaProyek?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter =
      filterStatus === "all" || kons.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const columns: ColumnDef<KonsultanPengawas>[] = [
    {
      accessorKey: "namaVendor",
      header: "Nama Konsultan",
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: "nomorIzin",
      header: "No. Izin",
    },
    {
      accessorKey: "spesialisasi",
      header: "Spesialisasi",
      cell: ({ getValue }) => getValue() as string || "-",
    },
    {
      accessorKey: "namaProyek",
      header: "Nama Proyek",
      cell: ({ getValue }) => getValue() as string || "-",
    },
    {
      accessorKey: "jumlahProyek",
      header: "Jumlah Proyek",
      cell: ({ getValue }) => `${getValue() as number} proyek`,
    },
    {
      accessorKey: "rating",
      header: "Rating",
      cell: ({ row }) => renderStars(row.original.rating),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => (
        <Badge size="sm" color={getStatusColor(getValue() as KonsultanPengawas["status"])}>
          {getValue() as string}
        </Badge>
      ),
    },
    {
      accessorKey: "warningTemuan",
      header: "Warning",
      cell: ({ row }) => (
        row.original.warningTemuan ? (
          <Badge size="sm" color="error">
            ⚠️ Ada Temuan
          </Badge>
        ) : (
          <Badge size="sm" color="success">
            ✓ Aman
          </Badge>
        )
      ),
    },
    {
      id: "actions",
      header: "Aksi",
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
      label: "Total Konsultan",
      value: konsultanPengawas.length,
      color: "text-brand-500",
    },
    {
      label: "Konsultan Aktif",
      value: konsultanPengawas.filter((k) => k.status === "AKTIF").length,
      color: "text-success-500",
    },
    {
      label: "Total Proyek",
      value: konsultanPengawas.reduce((acc, k) => acc + k.jumlahProyek, 0),
      color: "text-blue-light-500",
    },
    {
      label: "Rating Rata-rata",
      value: konsultanPengawas.length > 0 ? (konsultanPengawas.reduce((sum, k) => sum + (k.rating || 0), 0) / konsultanPengawas.length).toFixed(1) : "0.0",
      color: "text-warning-500",
    },
  ];

  const detailsSections = selectedData ? [
    {
      title: "Informasi Dasar",
      fields: [
        { label: "Nama Vendor", value: selectedData.namaVendor },
        { label: "No. Izin", value: selectedData.nomorIzin },
        { label: "Spesialisasi", value: selectedData.spesialisasi || "-" },
        { label: "Nama Proyek", value: selectedData.namaProyek || "-" },
        { label: "Jumlah Proyek", value: selectedData.jumlahProyek },
        { 
          label: "Rating", 
          value: renderStars(selectedData.rating)
        },
        { 
          label: "Status", 
          value: (
            <Badge color={getStatusColor(selectedData.status)}>
              {selectedData.status}
            </Badge>
          ),
        },
        { 
          label: "Warning Temuan", 
          value: selectedData.warningTemuan ? (
            <Badge color="error">⚠️ Ada Temuan Audit</Badge>
          ) : (
            <Badge color="success">✓ Tidak Ada Temuan</Badge>
          ),
        },
        { label: "Kontak", value: selectedData.kontak || "-" },
        { label: "Alamat", value: selectedData.alamat || "-", fullWidth: true },
        { label: "Deskripsi Laporan", value: selectedData.deskripsiLaporan || "-", fullWidth: true },
        { label: "Lama Kontrak", value: selectedData.lamaKontrak ? `${selectedData.lamaKontrak} hari` : "-" },
      ]
    }
  ] : [];

  const detailsDocuments = selectedData?.dokumenLaporan ? [
    { 
      id: selectedData.id + '-laporan', 
      namaDokumen: 'Dokumen Laporan', 
      filePath: selectedData.dokumenLaporan, 
      uploadedAt: selectedData.createdAt 
    }
  ] : [];

  return (
    <>
      <PageMeta
        title="SIPAKAT-PBJ - Konsultan Pengawas"
        description="Halaman Konsultan Pengawas untuk Vendor Penyedia"
      />
      <PageBreadcrumb pageTitle="Konsultan Pengawas" />

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title="Total Konsultan"
            value={konsultanPengawas.length}
            subtitle="Konsultan pengawas terdaftar"
            icon={UserGroupIcon}
            fromColor="from-blue-500"
            toColor="to-blue-600"
          />
          <StatsCard
            title="Konsultan Aktif"
            value={konsultanPengawas.filter((k) => k.status === "AKTIF").length}
            subtitle="Sedang aktif mengawasi"
            icon={EyeIcon}
            fromColor="from-green-500"
            toColor="to-green-600"
          />
          <StatsCard
            title="Total Proyek"
            value={konsultanPengawas.reduce((acc, k) => acc + k.jumlahProyek, 0)}
            subtitle="Proyek yang diawasi"
            icon={DocumentIcon}
            fromColor="from-purple-500"
            toColor="to-purple-600"
          />
          <StatsCard
            title="Rating Rata-rata"
            value={konsultanPengawas.length > 0 ? (konsultanPengawas.reduce((sum, k) => sum + (k.rating || 0), 0) / konsultanPengawas.length).toFixed(1) : "0.0"}
            subtitle="Rata-rata rating konsultan"
            icon={ChartBarIcon}
            fromColor="from-warning-500"
            toColor="to-warning-600"
          />
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
        title={editingKonsultan ? "Edit Konsultan Pengawas" : "Tambah Konsultan Pengawas Baru"}
        showHeader={true}
      >
        <div className="flex flex-col max-h-[80vh] overflow-y-auto px-6 py-4 space-y-4">
          <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            {editingKonsultan ? "Edit Konsultan Pengawas" : "Tambah Konsultan Pengawas Baru"}
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
                  onChange={(e) =>
                    setFormData({ ...formData, nomorIzin: e.target.value })
                  }
                  placeholder="IUJK-SUP-XXX/2024"
                  error={!!formErrors.nomorIzin}
                  hint={formErrors.nomorIzin}
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
              <Label>Alamat *</Label>
              <Input
                type="text"
                value={formData.alamat}
                onChange={(e) =>
                  setFormData({ ...formData, alamat: e.target.value })
                }
                placeholder="Kota/Kabupaten"
                error={!!formErrors.alamat}
                hint={formErrors.alamat}
              />
            </div>

            <div>
              <Label>Nama Proyek</Label>
              <Input
                type="text"
                value={formData.namaProyek}
                onChange={(e) =>
                  setFormData({ ...formData, namaProyek: e.target.value })
                }
                placeholder="Nama proyek yang diawasi"
              />
            </div>

            <div>
              <Label>Deskripsi Laporan Kemajuan Fisik</Label>
              <textarea
                className="w-full h-24 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                value={formData.deskripsiLaporan}
                onChange={(e) =>
                  setFormData({ ...formData, deskripsiLaporan: e.target.value })
                }
                placeholder="Laporan kemajuan fisik harian, mingguan, bulanan..."
              />
            </div>

            <div>
              <Label>Lama Kontrak (hari)</Label>
              <Input
                type="number"
                value={formData.lamaKontrak}
                onChange={(e) =>
                  setFormData({ ...formData, lamaKontrak: e.target.value })
                }
                placeholder="180"
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

            <div>
              <Label>Upload Dokumen Laporan {!editingKonsultan && "*"}</Label>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xlsx,.xls"
                className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              />
              {formErrors.dokumenLaporan && (
                <p className="mt-1 text-xs text-error-500">
                  {formErrors.dokumenLaporan}
                </p>
              )}
              {editingKonsultan && (
                <p className="mt-1 text-xs text-warning-600">
                  Kosongkan jika tidak ingin mengubah file
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={closeModal}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading
                ? "Menyimpan..."
                : editingKonsultan
                ? "Update"
                : "Simpan"}
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

      {selectedData && (
        <DetailsModal
          isOpen={viewDetailsOpen}
          onClose={() => setViewDetailsOpen(false)}
          title="Detail Konsultan Pengawas"
          sections={detailsSections}
          documents={detailsDocuments}
        />
      )}
    </>
  );
}