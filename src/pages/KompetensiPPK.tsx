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
  AcademicCapIcon,
} from "@heroicons/react/24/outline";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface PPK {
  id: string;
  namaLengkap: string;
  nip: string;
  jabatan: string;
  unitKerja: string;
  kompetensi: any; // JSON
  sertifikasi: any; // JSON
  pengalaman: number;
  status: "AKTIF" | "NON_AKTIF" | "CUTI";
  createdAt: string;
}

interface PPKFormData {
  namaLengkap: string;
  nip: string;
  jabatan: string;
  unitKerja: string;
  kompetensi: string;
  sertifikasi: string;
  pengalaman: string;
  kakRab: File | null;
  spesifikasiTeknis: File | null;
  kontrak: File | null;
  timeline: File | null;
  syaratKhusus: File | null;
}

interface FormErrors {
  namaLengkap?: string;
  nip?: string;
  jabatan?: string;
  unitKerja?: string;
  pengalaman?: string;
  kakRab?: string;
  spesifikasiTeknis?: string;
  kontrak?: string;
  timeline?: string;
  syaratKhusus?: string;
}

export default function KompetensiPPK() {
  const [ppks, setPpks] = useState<PPK[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedData, setSelectedData] = useState<PPK | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingPPK, setEditingPPK] = useState<PPK | null>(null);
  const [deletingPPK, setDeletingPPK] = useState<PPK | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState<PPKFormData>({
    namaLengkap: "",
    nip: "",
    jabatan: "",
    unitKerja: "",
    kompetensi: "",
    sertifikasi: "",
    pengalaman: "",
    kakRab: null,
    spesifikasiTeknis: null,
    kontrak: null,
    timeline: null,
    syaratKhusus: null,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const { isOpen, openModal, closeModal } = useModal();
  const { success, error, info, loading } = useToast();

  // Fetch PPK data from API
  useEffect(() => {
    fetchPPKs();
  }, []);

  const fetchPPKs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/ppk`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setPpks(data);
      }
    } catch (err) {
      error("Gagal memuat data PPK");
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.namaLengkap.trim()) {
      newErrors.namaLengkap = "Nama lengkap wajib diisi";
    }
    if (!formData.nip.trim()) {
      newErrors.nip = "NIP wajib diisi";
    }
    if (!formData.jabatan.trim()) {
      newErrors.jabatan = "Jabatan wajib diisi";
    }
    if (!formData.unitKerja.trim()) {
      newErrors.unitKerja = "Unit kerja wajib diisi";
    }
    if (!formData.pengalaman.trim()) {
      newErrors.pengalaman = "Pengalaman wajib diisi";
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (data: PPKFormData) => {
    if (!validateForm()) return;

    setIsLoading(true);
    loading(editingPPK ? "Memperbarui PPK..." : "Menyimpan PPK...");

    try {
      const fd = new FormData();
      fd.append('namaLengkap', data.namaLengkap);
      fd.append('nip', data.nip);
      fd.append('jabatan', data.jabatan);
      fd.append('unitKerja', data.unitKerja);
      fd.append('kompetensi', data.kompetensi || '{}');
      fd.append('sertifikasi', data.sertifikasi || '{}');
      fd.append('pengalaman', data.pengalaman);

      // Append files if they exist
      if (data.kakRab) fd.append('kakRab', data.kakRab);
      if (data.spesifikasiTeknis) fd.append('spesifikasiTeknis', data.spesifikasiTeknis);
      if (data.kontrak) fd.append('kontrak', data.kontrak);
      if (data.timeline) fd.append('timeline', data.timeline);
      if (data.syaratKhusus) fd.append('syaratKhusus', data.syaratKhusus);

      let response;
      if (editingPPK) {
        response = await fetch(`${API_BASE_URL}/api/ppk/${editingPPK.id}`, {
          method: 'PUT',
          credentials: 'include',
          body: fd,
        });
      } else {
        response = await fetch(`${API_BASE_URL}/api/ppk`, {
          method: 'POST',
          credentials: 'include',
          body: fd,
        });
      }

      if (response.ok) {
        await fetchPPKs();
        closeModal();
        resetForm();
        setEditingPPK(null);
        success(editingPPK ? "PPK berhasil diperbarui!" : "PPK berhasil disimpan!");
      } else {
        const errorText = await response.text();
        error("Gagal menyimpan PPK: " + errorText);
      }
    } catch (err) {
      error("Terjadi kesalahan saat menyimpan PPK");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (ppk: PPK) => {
    setEditingPPK(ppk);
    setFormData({
      namaLengkap: ppk.namaLengkap,
      nip: ppk.nip,
      jabatan: ppk.jabatan,
      unitKerja: ppk.unitKerja,
      kompetensi: JSON.stringify(ppk.kompetensi, null, 2),
      sertifikasi: JSON.stringify(ppk.sertifikasi, null, 2),
      pengalaman: ppk.pengalaman.toString(),
      kakRab: null,
      spesifikasiTeknis: null,
      kontrak: null,
      timeline: null,
      syaratKhusus: null,
    });
    openModal();
  };

  const handleViewDetails = (data: PPK) => {
    setSelectedData(data);
    setViewDetailsOpen(true);
  };

  const handleDelete = (ppk: PPK) => {
    setDeletingPPK(ppk);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingPPK) return;
    setIsLoading(true);
    loading("Menghapus PPK...");

    try {
      const response = await fetch(`${API_BASE_URL}/api/ppk/${deletingPPK.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await fetchPPKs();
        success("PPK berhasil dihapus!");
      } else {
        const errorData = await response.json();
        error("Gagal menghapus: " + (errorData.error || 'Unknown error'));
      }
    } catch (err) {
      error("Terjadi kesalahan saat menghapus PPK");
    } finally {
      setIsLoading(false);
      setIsConfirmModalOpen(false);
      setDeletingPPK(null);
    }
  };

  const handleSubmit = () => onSubmit(formData);

  const handleFileChange = (fieldName: keyof PPKFormData, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setFormErrors({ ...formErrors, [fieldName]: "Ukuran file maksimal 10MB" });
        return;
      }

      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/jpeg",
        "image/png",
      ];

      if (!allowedTypes.includes(file.type)) {
        setFormErrors({ ...formErrors, [fieldName]: "Format file tidak didukung" });
        return;
      }

      setFormData({ ...formData, [fieldName]: file });
      setFormErrors({ ...formErrors, [fieldName]: undefined });
    }
  };

  const resetForm = () => {
    setFormData({
      namaLengkap: "",
      nip: "",
      jabatan: "",
      unitKerja: "",
      kompetensi: "",
      sertifikasi: "",
      pengalaman: "",
      kakRab: null,
      spesifikasiTeknis: null,
      kontrak: null,
      timeline: null,
      syaratKhusus: null,
    });
    setFormErrors({});
    setEditingPPK(null);
  };

  const getStatusColor = (status: PPK["status"]) => {
    switch (status) {
      case "AKTIF":
        return "success";
      case "NON_AKTIF":
        return "warning";
      case "CUTI":
        return "info";
      default:
        return "light";
    }
  };

  const filteredPPKs = ppks.filter((ppk) => {
    const matchSearch =
      searchQuery === "" ||
      ppk.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ppk.nip.includes(searchQuery) ||
      ppk.jabatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ppk.unitKerja.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter =
      filterStatus === "all" || ppk.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const columns: ColumnDef<PPK>[] = [
    {
      accessorKey: "nip",
      header: "NIP",
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: "namaLengkap",
      header: "Nama",
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: "jabatan",
      header: "Jabatan",
    },
    {
      accessorKey: "unitKerja",
      header: "Unit Kerja",
    },
    {
      accessorKey: "pengalaman",
      header: "Pengalaman",
      cell: ({ getValue }) => `${getValue() as number} tahun`,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => (
        <Badge size="sm" color={getStatusColor(getValue() as PPK["status"])}>
          {getValue() as string}
        </Badge>
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
      label: "Total PPK",
      value: ppks.length,
      color: "text-brand-500",
    },
    {
      label: "PPK Aktif",
      value: ppks.filter((p) => p.status === "AKTIF").length,
      color: "text-success-500",
    },
    {
      label: "Pengalaman Rata-rata",
      value: ppks.length > 0 ? (ppks.reduce((sum, p) => sum + p.pengalaman, 0) / ppks.length).toFixed(1) + " tahun" : "0 tahun",
      color: "text-blue-light-500",
    },
    {
      label: "Sertifikasi",
      value: ppks.filter(p => p.sertifikasi && Object.keys(p.sertifikasi).length > 0).length,
      color: "text-warning-500",
    },
  ];

  const detailsSections = selectedData ? [
    {
      title: "Informasi Personal",
      fields: [
        { label: "NIP", value: selectedData.nip },
        { label: "Nama Lengkap", value: selectedData.namaLengkap },
        { label: "Jabatan", value: selectedData.jabatan },
        { label: "Unit Kerja", value: selectedData.unitKerja },
        { label: "Pengalaman", value: `${selectedData.pengalaman} tahun` },
        { 
          label: "Status", 
          value: (
            <Badge color={getStatusColor(selectedData.status)}>
              {selectedData.status}
            </Badge>
          ),
        },
      ]
    },
    {
      title: "Kompetensi",
      fields: selectedData.kompetensi && typeof selectedData.kompetensi === 'object' ? 
        Object.entries(selectedData.kompetensi).map(([key, value]) => ({
          label: key.charAt(0).toUpperCase() + key.slice(1),
          value: String(value),
        })) : [
        { label: "Kompetensi", value: "Tidak ada data kompetensi" }
      ]
    },
    {
      title: "Sertifikasi",
      fields: selectedData.sertifikasi && typeof selectedData.sertifikasi === 'object' ? 
        Object.entries(selectedData.sertifikasi).map(([key, value]) => ({
          label: key.charAt(0).toUpperCase() + key.slice(1),
          value: String(value),
        })) : [
        { label: "Sertifikasi", value: "Tidak ada data sertifikasi" }
      ]
    }
  ] : [];

  const detailsDocuments = [
    { 
      id: 'kompetensi-doc', 
      namaDokumen: 'Dokumen Kompetensi', 
      filePath: '/documents/kompetensi.pdf', 
      uploadedAt: selectedData?.createdAt || new Date().toISOString() 
    },
    { 
      id: 'sertifikasi-doc', 
      namaDokumen: 'Dokumen Sertifikasi', 
      filePath: '/documents/sertifikasi.pdf', 
      uploadedAt: selectedData?.createdAt || new Date().toISOString() 
    }
  ];

  return (
    <>
      <PageMeta
        title="SIPAKAT-PBJ - Kompetensi PPK"
        description="Kelola kompetensi dan sertifikasi Pejabat Pengadaan"
      />
      <PageBreadcrumb pageTitle="Kompetensi PPK" />

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title="Total PPK"
            value={ppks.length}
            subtitle="Pejabat Pengadaan terdaftar"
            icon={UserGroupIcon}
            fromColor="from-blue-500"
            toColor="to-blue-600"
          />
          <StatsCard
            title="PPK Aktif"
            value={ppks.filter((p) => p.status === "AKTIF").length}
            subtitle="Sedang aktif bertugas"
            icon={AcademicCapIcon}
            fromColor="from-green-500"
            toColor="to-green-600"
          />
          <StatsCard
            title="Pengalaman Rata-rata"
            value={ppks.length > 0 ? (ppks.reduce((sum, p) => sum + p.pengalaman, 0) / ppks.length).toFixed(1) + " tahun" : "0 tahun"}
            subtitle="Rata-rata pengalaman PPK"
            icon={ChartBarIcon}
            fromColor="from-purple-500"
            toColor="to-purple-600"
          />
          <StatsCard
            title="Bersertifikasi"
            value={ppks.filter(p => p.sertifikasi && Object.keys(p.sertifikasi).length > 0).length}
            subtitle="PPK dengan sertifikasi"
            icon={DocumentIcon}
            fromColor="from-warning-500"
            toColor="to-warning-600"
          />
        </div>

        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Daftar Kompetensi PPK
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola sertifikasi dan validitas pejabat pengadaan
            </p>
          </div>
          <Button
            size="md"
            variant="primary"
            startIcon={<PlusIcon />}
            onClick={openModal}
            disabled={isLoading}
          >
            Tambah PPK
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
              <option value="CUTI">Cuti</option>
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredPPKs}
          loading={isLoading}
          enableExport={true}
          enableColumnVisibility={false}
          pageSize={10}
          searchPlaceholder="Cari NIP, nama, jabatan, atau unit kerja..."
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
        title={editingPPK ? "Edit PPK" : "Tambah PPK"}
        showHeader={true}
      >
        <div className="flex flex-col max-h-[80vh] overflow-y-auto px-6 py-4 space-y-4">
          <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            {editingPPK ? "Edit PPK" : "Tambah PPK"}
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>NIP *</Label>
                <Input
                  type="text"
                  value={formData.nip}
                  onChange={(e) =>
                    setFormData({ ...formData, nip: e.target.value })
                  }
                  placeholder="198501012010011001"
                  error={!!formErrors.nip}
                  hint={formErrors.nip}
                />
              </div>
              <div>
                <Label>Pengalaman (tahun) *</Label>
                <Input
                  type="number"
                  value={formData.pengalaman}
                  onChange={(e) =>
                    setFormData({ ...formData, pengalaman: e.target.value })
                  }
                  placeholder="5"
                  error={!!formErrors.pengalaman}
                  hint={formErrors.pengalaman}
                />
              </div>
            </div>

            <div>
              <Label>Nama Lengkap *</Label>
              <Input
                type="text"
                value={formData.namaLengkap}
                onChange={(e) =>
                  setFormData({ ...formData, namaLengkap: e.target.value })
                }
                placeholder="Masukkan nama lengkap"
                error={!!formErrors.namaLengkap}
                hint={formErrors.namaLengkap}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Jabatan *</Label>
                <Input
                  type="text"
                  value={formData.jabatan}
                  onChange={(e) =>
                    setFormData({ ...formData, jabatan: e.target.value })
                  }
                  placeholder="Masukkan jabatan"
                  error={!!formErrors.jabatan}
                  hint={formErrors.jabatan}
                />
              </div>
              <div>
                <Label>Unit Kerja *</Label>
                <Input
                  type="text"
                  value={formData.unitKerja}
                  onChange={(e) =>
                    setFormData({ ...formData, unitKerja: e.target.value })
                  }
                  placeholder="Masukkan unit kerja"
                  error={!!formErrors.unitKerja}
                  hint={formErrors.unitKerja}
                />
              </div>
            </div>

            {/* File Upload Sections */}
            <div>
              <Label>KAK atau RAB</Label>
              <input
                type="file"
                onChange={(e) => handleFileChange('kakRab', e)}
                accept=".pdf,.doc,.docx,.xlsx,.xls"
                className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              />
              {formErrors.kakRab && (
                <p className="mt-1 text-xs text-error-500">{formErrors.kakRab}</p>
              )}
              {editingPPK && (
                <p className="mt-1 text-xs text-warning-600">
                  Kosongkan jika tidak ingin mengubah file
                </p>
              )}
            </div>

            <div>
              <Label>Spesifikasi Teknis</Label>
              <input
                type="file"
                onChange={(e) => handleFileChange('spesifikasiTeknis', e)}
                accept=".pdf,.doc,.docx"
                className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              />
              {formErrors.spesifikasiTeknis && (
                <p className="mt-1 text-xs text-error-500">{formErrors.spesifikasiTeknis}</p>
              )}
              {editingPPK && (
                <p className="mt-1 text-xs text-warning-600">
                  Kosongkan jika tidak ingin mengubah file
                </p>
              )}
            </div>

            <div>
              <Label>Kontrak atau Perjanjian Kontrak</Label>
              <input
                type="file"
                onChange={(e) => handleFileChange('kontrak', e)}
                accept=".pdf,.doc,.docx"
                className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              />
              {formErrors.kontrak && (
                <p className="mt-1 text-xs text-error-500">{formErrors.kontrak}</p>
              )}
              {editingPPK && (
                <p className="mt-1 text-xs text-warning-600">
                  Kosongkan jika tidak ingin mengubah file
                </p>
              )}
            </div>

            <div>
              <Label>Timeline Pekerjaan</Label>
              <input
                type="file"
                onChange={(e) => handleFileChange('timeline', e)}
                accept=".pdf,.xlsx,.xls"
                className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              />
              {formErrors.timeline && (
                <p className="mt-1 text-xs text-error-500">{formErrors.timeline}</p>
              )}
              {editingPPK && (
                <p className="mt-1 text-xs text-warning-600">
                  Kosongkan jika tidak ingin mengubah file
                </p>
              )}
            </div>

            <div>
              <Label>Syarat-syarat Khusus dalam Kontrak</Label>
              <input
                type="file"
                onChange={(e) => handleFileChange('syaratKhusus', e)}
                accept=".pdf,.doc,.docx"
                className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              />
              {formErrors.syaratKhusus && (
                <p className="mt-1 text-xs text-error-500">{formErrors.syaratKhusus}</p>
              )}
              {editingPPK && (
                <p className="mt-1 text-xs text-warning-600">
                  Kosongkan jika tidak ingin mengubah file
                </p>
              )}
            </div>

            <div>
              <Label>Kompetensi (JSON)</Label>
              <textarea
                className="w-full h-24 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                value={formData.kompetensi}
                onChange={(e) =>
                  setFormData({ ...formData, kompetensi: e.target.value })
                }
                placeholder='{"pengadaan": "tingkat III", "manajemen": "tingkat II"}'
              />
            </div>

            <div>
              <Label>Sertifikasi (JSON)</Label>
              <textarea
                className="w-full h-24 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                value={formData.sertifikasi}
                onChange={(e) =>
                  setFormData({ ...formData, sertifikasi: e.target.value })
                }
                placeholder='{"sertifikat_pengadaan": "2025-12-15", "sertifikat_manajemen": "2024-08-20"}'
              />
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
                : editingPPK
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
        title="Hapus PPK"
        message={`Apakah Anda yakin ingin menghapus PPK "${deletingPPK?.namaLengkap}"?`}
        confirmText="Hapus"
        cancelText="Batal"
        loading={isLoading}
      />

      {selectedData && (
        <DetailsModal
          isOpen={viewDetailsOpen}
          onClose={() => setViewDetailsOpen(false)}
          title="Detail Kompetensi PPK"
          sections={detailsSections}
          documents={detailsDocuments}
        />
      )}
    </>
  );
}