// src/pages/BPKP.tsx - REFACTORED VERSION
import { useState, useMemo } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import { PlusIcon } from "../icons";
import { useModal } from "../hooks/useModal";
import { useAuth } from "../context/AuthContext";
import { DataTable } from "../components/common/DataTable";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { createColumns, TemuanBPKP } from "./BPKP/components/columns";
import { PreviewTemuanModal } from "./BPKP/components/PreviewTemuanModal";
import { TemuanFormModal } from "./BPKP/components/TemuanFormModal";
import { useTemuanData } from "./BPKP/hooks/useTemuanData";
import { useTemuanActions } from "./BPKP/hooks/useTemuanActions";
import { StatsCard } from "../components/common/StatsCard";
import { FolderOpen, CheckCircle2, AlertTriangle } from "lucide-react";

export default function BPKP() {
  const { user } = useAuth();
  const { temuans, eligiblePakets, loading, fetchTemuans } = useTemuanData();
  const [selectedTemuan, setSelectedTemuan] = useState<TemuanBPKP | null>(null);
  const [editingTemuan, setEditingTemuan] = useState<TemuanBPKP | null>(null);
  const [deletingTemuan, setDeletingTemuan] = useState<TemuanBPKP | null>(null);

  // Modals
  const {
    isOpen: isFormOpen,
    openModal: openFormModal,
    closeModal: closeFormModal,
  } = useModal();
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Actions
  const {
    isSubmitting,
    validateForm,
    createTemuan,
    updateTemuan,
    deleteTemuan,
  } = useTemuanActions(
    () => {
      fetchTemuans();
      closeFormModal();
      setEditingTemuan(null);
    },
    [] // laporanItwasda will be passed from hook if needed
  );

  // Filtered data
  const filteredTemuans = useMemo(() => {
    return temuans.filter((temuan) => {
      const matchSearch =
        searchQuery === "" ||
        temuan.nomorTemuan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        temuan.jenisTemuan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        temuan.auditor.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus =
        filterStatus === "all" || temuan.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [temuans, searchQuery, filterStatus]);

  // Handlers
  const handleView = (temuan: TemuanBPKP) => {
    setSelectedTemuan(temuan);
    setIsViewOpen(true);
  };

  const handleEdit = (temuan: TemuanBPKP) => {
    setEditingTemuan(temuan);
    openFormModal();
  };

  const handleDeleteClick = (temuan: TemuanBPKP) => {
    setDeletingTemuan(temuan);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingTemuan) {
      await deleteTemuan(deletingTemuan.id);
      setIsDeleteOpen(false);
      setDeletingTemuan(null);
    }
  };

  const handleFormSubmit = async (formData: any) => {
    if (editingTemuan) {
      await updateTemuan(editingTemuan.id, formData);
    } else {
      await createTemuan(formData);
    }
  };

  const handleAddNew = () => {
    if (eligiblePakets.length === 0) {
      alert(
        "Tidak ada paket yang eligible untuk temuan BPKP. Paket harus memiliki laporan Itwasda terlebih dahulu. Anda masih bisa membuat temuan tanpa paket."
      );
    }
    setEditingTemuan(null);
    openFormModal();
  };

  const totalTemuan = temuans.reduce((sum, p) => sum + p.TemuanData, 0);
  const totalTemuanSelesai = temuans.filter(
    (p) => p.status === "COMPLETED"
  ).length;
  const totalProgressTemuan = temuans.filter(
    (p) => p.status === "ON_PROGRESS"
  ).length;

  // Stats
  const stats = [
    {
      label: "Total Temuan",
      value: temuans.length,
      color: "text-brand-500",
    },
    {
      label: "Temuan Baru",
      value: temuans.filter((t) => t.status === "BARU").length,
      color: "text-blue-light-500",
    },
    {
      label: "Dalam Proses",
      value: temuans.filter((t) => t.status === "PROSES").length,
      color: "text-warning-500",
    },
    {
      label: "Selesai",
      value: temuans.filter((t) => t.status === "SELESAI").length,
      color: "text-success-500",
    },
  ];

  // Table columns
  const columns = createColumns(
    handleView,
    handleEdit,
    (id) => {
      const temuan = temuans.find((t) => t.id === id);
      if (temuan) handleDeleteClick(temuan);
    },
    user?.role === "ADMIN"
  );

  return (
    <>
      <PageMeta
        title="SIPAKAT-PBJ - BPKP"
        description="Halaman BPKP untuk Pengawasan dan Audit"
      />
      <PageBreadcrumb pageTitle="BPKP" />

      <div className="space-y-6">
        {/* Info Alert */}
        {eligiblePakets.length === 0 && (
          <div className="rounded-lg border border-info-300 bg-info-50 p-4 dark:border-info-800 dark:bg-info-900/20">
            <p className="text-sm text-info-800 dark:text-info-200">
              ℹ️ Tidak ada paket dengan laporan Itwasda. Temuan BPKP dapat
              dibuat tanpa paket, atau tunggu hingga ada laporan Itwasda yang
              dibuat untuk paket tertentu.
            </p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatsCard
            title="Total Temuan"
            value={temuans.length}
            subtitle="Jumlah seluruh temuan paket"
            icon={FolderOpen}
            fromColor="from-indigo-500"
            toColor="to-indigo-700"
          />
          <StatsCard
            title="Total Temuan Tinggi & Kritis"
            value={
              temuans.filter(
                (l) =>
                  l.tingkatKualitasTemuan === "TINGGI" ||
                  l.tingkatKualitasTemuan === "KRITIS"
              ).length
            }
            subtitle="Tingkat Kualitas Temuan"
            icon={CheckCircle2}
            fromColor="from-orange-500"
            toColor="to-red-700"
          />
          <StatsCard
            title="Temuan Selesai"
            value={temuans.filter((l) => l.status === "SELESAI").length}
            subtitle="Total Temuan Selesai Dianalisa"
            icon={AlertTriangle}
            fromColor="from-green-500"
            toColor="to-green-700"
          />
        </div>

        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Daftar Temuan Audit BPKP
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola temuan audit dan tindak lanjut rekomendasi
            </p>
          </div>
          <Button
            size="md"
            variant="primary"
            startIcon={<PlusIcon />}
            onClick={handleAddNew}
            disabled={loading}
          >
            Tambah Temuan
          </Button>
        </div>

        {/* Filter */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              className="border border-gray-300 dark:border-gray-600 rounded-lg py-2 pl-3 pr-10 text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="BARU">Baru</option>
              <option value="PROSES">Proses</option>
              <option value="SELESAI">Selesai</option>
              <option value="DITUNDA">Ditunda</option>
            </select>
          </div>
        </div>

        {/* DataTable */}
        <DataTable
          columns={columns}
          data={filteredTemuans}
          searchPlaceholder="Cari temuan..."
          loading={loading}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          fixedHeight="750px"
          fixedWidth="1300px"
          minVisibleRows={10}
        />
      </div>

      {/* Form Modal (Add/Edit) */}
      <TemuanFormModal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        onSubmit={handleFormSubmit}
        editingTemuan={editingTemuan}
        eligiblePakets={eligiblePakets}
        isSubmitting={isSubmitting}
        validateForm={validateForm}
      />

      {/* Preview Modal */}
      <PreviewTemuanModal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        temuan={selectedTemuan}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Temuan"
        message={`Apakah Anda yakin ingin menghapus temuan "${deletingTemuan?.nomorTemuan}"?`}
        confirmText="Hapus"
        cancelText="Batal"
        loading={isSubmitting}
      />
    </>
  );
}
