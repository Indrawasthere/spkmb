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
import TextArea from "../components/form/input/TextArea";
import Select from "../components/form/Select";
import { DataTable } from "../components/common/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { ActionButtons } from "../components/common/ActionButtons";
import { DetailsModal } from "../components/common/DetailsModal";
import { useToast } from "../hooks/useToast";
import { StatsCard } from "../components/common/StatsCard";
import {
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Pengaduan {
  id: string;
  judul: string;
  isi: string;
  status: "BARU" | "DIPROSES" | "SELESAI" | "DITOLAK";
  tanggal: string;
  pelapor: string;
  createdAt: string;
  updatedAt: string;
}

interface PengaduanFormData {
  judul: string;
  isi: string;
  pelapor: string;
  status: Pengaduan["status"];
}

interface FormErrors {
  judul?: string;
  isi?: string;
  pelapor?: string;
}

export default function Pengaduan() {
  const [pengaduans, setPengaduans] = useState<Pengaduan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedData, setSelectedData] = useState<Pengaduan | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingPengaduan, setEditingPengaduan] = useState<Pengaduan | null>(null);
  const [deletingPengaduan, setDeletingPengaduan] = useState<Pengaduan | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState<PengaduanFormData>({
    judul: "",
    isi: "",
    pelapor: "",
    status: "BARU",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const { isOpen, openModal, closeModal } = useModal();
  const { success, error, info, loading: toastLoading } = useToast();

  useEffect(() => {
    fetchPengaduans();
  }, []);

  const fetchPengaduans = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/pengaduan`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setPengaduans(data);
      } else {
        error("Gagal memuat data pengaduan");
      }
    } catch (err) {
      console.error("Fetch pengaduan error:", err);
      error("Terjadi kesalahan saat memuat pengaduan");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.judul.trim()) {
      newErrors.judul = "Judul pengaduan wajib diisi";
    }
    if (!formData.isi.trim()) {
      newErrors.isi = "Isi pengaduan wajib diisi";
    }
    if (!formData.pelapor.trim()) {
      newErrors.pelapor = "Nama pelapor wajib diisi";
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    toastLoading(editingPengaduan ? "Memperbarui pengaduan..." : "Menyimpan pengaduan...");

    try {
      const payload = {
        judul: formData.judul.trim(),
        isi: formData.isi.trim(),
        pelapor: formData.pelapor.trim(),
        status: formData.status,
      };

      const url = editingPengaduan
        ? `${API_BASE_URL}/api/pengaduan/${editingPengaduan.id}`
        : `${API_BASE_URL}/api/pengaduan`;
      const method = editingPengaduan ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchPengaduans();
        closeModal();
        resetForm();
        setEditingPengaduan(null);
        success(editingPengaduan ? "Pengaduan berhasil diperbarui!" : "Pengaduan berhasil ditambahkan!");
      } else {
        const errorData = await res.json();
        error(`Gagal menyimpan: ${errorData.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Submit error:", err);
      error("Terjadi kesalahan saat menyimpan pengaduan");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pengaduan: Pengaduan) => {
    setEditingPengaduan(pengaduan);
    setFormData({
      judul: pengaduan.judul,
      isi: pengaduan.isi,
      pelapor: pengaduan.pelapor,
      status: pengaduan.status,
    });
    openModal();
  };

  const handleViewDetails = (pengaduan: Pengaduan) => {
    setSelectedData(pengaduan);
    setViewDetailsOpen(true);
  };

  const handleDelete = (pengaduan: Pengaduan) => {
    setDeletingPengaduan(pengaduan);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingPengaduan) return;

    setLoading(true);
    toastLoading("Menghapus pengaduan...");

    try {
      const res = await fetch(`${API_BASE_URL}/api/pengaduan/${deletingPengaduan.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (res.ok) {
        await fetchPengaduans();
        success("Pengaduan berhasil dihapus!");
      } else {
        const errorData = await res.json();
        error(`Gagal menghapus: ${errorData.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Delete error:", err);
      error("Terjadi kesalahan saat menghapus pengaduan");
    } finally {
      setLoading(false);
      setIsConfirmModalOpen(false);
      setDeletingPengaduan(null);
    }
  };

  const resetForm = () => {
    setFormData({
      judul: "",
      isi: "",
      pelapor: "",
      status: "BARU",
    });
    setFormErrors({});
    setEditingPengaduan(null);
  };

  const openAddModal = () => {
    resetForm();
    openModal();
  };

  const getStatusColor = (status: Pengaduan["status"]) => {
    switch (status) {
      case "SELESAI": return "success";
      case "DIPROSES": return "warning";
      case "BARU": return "info";
      case "DITOLAK": return "error";
      default: return "light";
    }
  };

  const getStatusDisplayName = (status: Pengaduan["status"]) => {
    switch (status) {
      case "BARU": return "Baru";
      case "DIPROSES": return "Diproses";
      case "SELESAI": return "Selesai";
      case "DITOLAK": return "Ditolak";
      default: return status;
    }
  };

  const filteredPengaduans = pengaduans.filter((pengaduan) => {
    const matchesSearch =
      searchQuery === "" ||
      pengaduan.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pengaduan.pelapor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pengaduan.isi.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === "all" || pengaduan.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const columns: ColumnDef<Pengaduan>[] = [
    {
      accessorKey: "judul",
      header: "Judul Pengaduan",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-800 dark:text-white/90">
            {row.original.judul}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
            {row.original.isi.substring(0, 100)}...
          </span>
        </div>
      ),
    },
    {
      accessorKey: "pelapor",
      header: "Pelapor",
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: "tanggal",
      header: "Tanggal",
      cell: ({ getValue }) => 
        new Date(getValue() as string).toLocaleDateString("id-ID"),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge size="sm" color={getStatusColor(row.original.status)}>
          {getStatusDisplayName(row.original.status)}
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
      label: "Total Pengaduan",
      value: pengaduans.length,
      subtitle: "Seluruh pengaduan masuk",
      icon: DocumentTextIcon,
      fromColor: "from-blue-500",
      toColor: "to-blue-600",
    },
    {
      label: "Pengaduan Baru",
      value: pengaduans.filter((p) => p.status === "BARU").length,
      subtitle: "Menunggu tindakan",
      icon: ExclamationTriangleIcon,
      fromColor: "from-orange-500",
      toColor: "to-orange-600",
    },
    {
      label: "Sedang Diproses",
      value: pengaduans.filter((p) => p.status === "DIPROSES").length,
      subtitle: "Dalam penanganan",
      icon: ClockIcon,
      fromColor: "from-yellow-500",
      toColor: "to-yellow-600",
    },
    {
      label: "Selesai",
      value: pengaduans.filter((p) => p.status === "SELESAI").length,
      subtitle: "Telah diselesaikan",
      icon: CheckCircleIcon,
      fromColor: "from-green-500",
      toColor: "to-green-600",
    },
  ];

  const detailsSections = selectedData ? [
    {
      title: "Informasi Pengaduan",
      fields: [
        { label: "Judul Pengaduan", value: selectedData.judul },
        { label: "Pelapor", value: selectedData.pelapor },
        { 
          label: "Status", 
          value: (
            <Badge color={getStatusColor(selectedData.status)}>
              {getStatusDisplayName(selectedData.status)}
            </Badge>
          ),
        },
        { 
          label: "Tanggal Pengaduan", 
          value: new Date(selectedData.tanggal).toLocaleDateString("id-ID") 
        },
        { 
          label: "Dibuat Pada", 
          value: new Date(selectedData.createdAt).toLocaleString("id-ID") 
        },
        { 
          label: "Diperbarui Pada", 
          value: new Date(selectedData.updatedAt).toLocaleString("id-ID") 
        },
        { 
          label: "Isi Pengaduan", 
          value: selectedData.isi,
          fullWidth: true 
        },
      ],
    },
  ] : [];

  return (
    <>
      <PageMeta 
        title="SIPAKAT-PBJ - Pengaduan Masyarakat" 
        description="Kelola pengaduan dan keluhan dari masyarakat"
      />
      <PageBreadcrumb pageTitle="Pengaduan Masyarakat" />

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <StatsCard
              key={idx}
              title={stat.label}
              value={stat.value}
              subtitle={stat.subtitle}
              icon={stat.icon}
              fromColor={stat.fromColor}
              toColor={stat.toColor}
            />
          ))}
        </div>

        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Daftar Pengaduan Masyarakat
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola pengaduan dan keluhan dari masyarakat
            </p>
          </div>
          <Button
            size="md"
            variant="primary"
            startIcon={<PlusIcon />}
            onClick={openAddModal}
            disabled={loading}
          >
            Tambah Pengaduan
          </Button>
        </div>

        {/* Filter Section */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Input
              type="text"
              placeholder="Cari pengaduan berdasarkan judul, pelapor, atau isi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-96"
            />
            <div className="flex gap-2 flex-1 justify-end">
              <select 
                className="h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Semua Status</option>
                <option value="BARU">Baru</option>
                <option value="DIPROSES">Diproses</option>
                <option value="SELESAI">Selesai</option>
                <option value="DITOLAK">Ditolak</option>
              </select>
            </div>
          </div>
        </div>

        {/* DataTable */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <DataTable
            columns={columns}
            data={filteredPengaduans}
            loading={loading}
            searchPlaceholder="Cari pengaduan berdasarkan judul, pelapor, atau isi..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            enableExport={true}
            enableColumnVisibility={true}
            pageSize={10}
            fixedHeight="750px"
            fixedWidth="1300px"
            minVisibleRows={10}
          />
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        size="2xl"
        title={editingPengaduan ? "Edit Pengaduan" : "Tambah Pengaduan"}
        showHeader={true}
      >
        <div className="flex flex-col max-h-[80vh] overflow-y-auto px-6 py-4 space-y-4">
          <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            {editingPengaduan ? "Edit Pengaduan" : "Tambah Pengaduan"}
          </h3>

          <div className="space-y-4">
            <div>
              <Label>Judul Pengaduan *</Label>
              <Input
                type="text"
                value={formData.judul}
                onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                placeholder="Masukkan judul pengaduan"
                error={!!formErrors.judul}
                hint={formErrors.judul}
              />
            </div>

            <div>
              <Label>Pelapor *</Label>
              <Input
                type="text"
                value={formData.pelapor}
                onChange={(e) => setFormData({ ...formData, pelapor: e.target.value })}
                placeholder="Masukkan nama pelapor"
                error={!!formErrors.pelapor}
                hint={formErrors.pelapor}
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select
                options={[
                  { value: "BARU", label: "Baru" },
                  { value: "DIPROSES", label: "Diproses" },
                  { value: "SELESAI", label: "Selesai" },
                  { value: "DITOLAK", label: "Ditolak" },
                ]}
                placeholder="Pilih status"
                onChange={(value) =>
                  setFormData({ ...formData, status: value as Pengaduan["status"] })
                }
                value={formData.status}
              />
            </div>

            <div>
              <Label>Isi Pengaduan *</Label>
              <TextArea
                rows={6}
                value={formData.isi}
                onChange={(value) => setFormData({ ...formData, isi: value })}
                placeholder="Masukkan detail pengaduan..."
                error={!!formErrors.isi}
                hint={formErrors.isi}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={closeModal}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading
                ? "Menyimpan..."
                : editingPengaduan
                ? "Update"
                : "Simpan"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title="Hapus Pengaduan"
        message={`Apakah Anda yakin ingin menghapus pengaduan "${deletingPengaduan?.judul}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        loading={loading}
      />

      {/* Details Modal */}
      {selectedData && (
        <DetailsModal
          isOpen={viewDetailsOpen}
          onClose={() => setViewDetailsOpen(false)}
          title="Detail Pengaduan"
          sections={detailsSections}
        />
      )}
    </>
  );
}