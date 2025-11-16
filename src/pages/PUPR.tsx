// src/pages/PUPR.tsx - REFACTORED VERSION
import { useState, useMemo } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import { PlusIcon } from "../icons";
import { useModal } from "../hooks/useModal";
import { DataTable } from "../components/common/DataTable";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { StatsCard } from "../components/common/StatsCard";
import { FolderOpen, TrendingUp, CheckCircle2 } from "lucide-react";
import { createColumns, ProyekPUPR } from "./PUPR/components/columns";
import { PreviewProyekModal } from "./PUPR/components/PreviewProyekModal";
import { ProyekFormModal } from "./PUPR/components/ProyekFormModal";
import { useProyekData } from "./PUPR/hooks/useProyekData";
import { useProyekActions } from "./PUPR/hooks/useProyekActions";

export default function PUPR() {
  const { proyek, loading, fetchProyek } = useProyekData();
  const [selectedProyek, setSelectedProyek] = useState<ProyekPUPR | null>(null);
  const [editingProyek, setEditingProyek] = useState<ProyekPUPR | null>(null);
  const [deletingProyek, setDeletingProyek] = useState<ProyekPUPR | null>(null);

  // Modals
  const { isOpen: isFormOpen, openModal: openFormModal, closeModal: closeFormModal } = useModal();
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Actions
  const { isSubmitting, validateForm, createProyek, updateProyek, deleteProyek } = useProyekActions(
    () => {
      fetchProyek();
      closeFormModal();
      setEditingProyek(null);
    }
  );

  // Filtered data
  const filteredProyek = useMemo(() => {
    return proyek.filter((p) => {
      const matchSearch =
        searchQuery === "" ||
        p.namaProyek.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.lokasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.kontraktor.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === "all" || p.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [proyek, searchQuery, filterStatus]);

  // Handlers
  const handleView = (proyekItem: ProyekPUPR) => {
    setSelectedProyek(proyekItem);
    setIsViewOpen(true);
  };

  const handleEdit = (proyekItem: ProyekPUPR) => {
    setEditingProyek(proyekItem);
    openFormModal();
  };

  const handleDeleteClick = (proyekItem: ProyekPUPR) => {
    setDeletingProyek(proyekItem);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingProyek) {
      await deleteProyek(deletingProyek.id);
      setIsDeleteOpen(false);
      setDeletingProyek(null);
    }
  };

  const handleFormSubmit = async (formData: any) => {
    if (editingProyek) {
      await updateProyek(editingProyek.id, formData);
    } else {
      await createProyek(formData);
    }
  };

  const handleAddNew = () => {
    setEditingProyek(null);
    openFormModal();
  };

  // Stats
  const totalProyek = proyek.length;
  const proyekSelesai = proyek.filter((p) => p.status === "SELESAI").length;
  const proyekBerjalan = proyek.filter((p) => p.status === "PELAKSANAAN").length;
  const totalAnggaran = proyek.reduce((sum, p) => sum + p.anggaran, 0);
  const avgProgress = proyek.length > 0 
    ? Math.round(proyek.reduce((sum, p) => sum + p.progress, 0) / proyek.length)
    : 0;

  const formatCurrency = (value: number): string =>
    value.toLocaleString("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    });

  // Table columns
  const columns = createColumns(
    handleView,
    handleEdit,
    (id) => {
      const proyekItem = proyek.find((p) => p.id === id);
      if (proyekItem) handleDeleteClick(proyekItem);
    },
    true // canDelete - adjust based on user role if needed
  );

  return (
    <>
      <PageMeta title="SIPAKAT-PBJ - PUPR" description="Catatan Proyek PUPR" />
      <PageBreadcrumb pageTitle="PUPR" />

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title="Total Proyek"
            value={totalProyek}
            subtitle={`${proyekBerjalan} sedang berjalan`}
            icon={FolderOpen}
            fromColor="from-blue-500"
            toColor="to-blue-600"
          />
          <StatsCard
            title="Proyek Selesai"
            value={proyekSelesai}
            subtitle="Proyek yang telah diselesaikan"
            icon={CheckCircle2}
            fromColor="from-green-500"
            toColor="to-green-600"
          />
          <StatsCard
            title="Total Anggaran"
            value={formatCurrency(totalAnggaran)}
            subtitle="Total nilai investasi"
            icon={TrendingUp}
            fromColor="from-purple-500"
            toColor="to-purple-600"
          />
          <StatsCard
            title="Rata-rata Progress"
            value={`${avgProgress}%`}
            subtitle="Progress keseluruhan proyek"
            icon={TrendingUp}
            fromColor="from-orange-500"
            toColor="to-orange-600"
          />
        </div>

        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Daftar Proyek
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola catatan proyek infrastruktur dan perumahan
            </p>
          </div>
          <Button
            size="md"
            variant="primary"
            startIcon={<PlusIcon />}
            onClick={handleAddNew}
            disabled={loading}
          >
            Tambah Catatan Proyek
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
              <option value="PERENCANAAN">Perencanaan</option>
              <option value="PELAKSANAAN">Pelaksanaan</option>
              <option value="SELESAI">Selesai</option>
              <option value="DITUNDA">Ditunda</option>
            </select>
          </div>
        </div>

        {/* DataTable */}
        <DataTable
          columns={columns}
          data={filteredProyek}
          searchPlaceholder="Cari proyek..."
          loading={loading}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          fixedHeight="750px"
          fixedWidth="1300px"
          minVisibleRows={10}
        />
      </div>

      {/* Form Modal (Add/Edit) */}
      <ProyekFormModal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        onSubmit={handleFormSubmit}
        editingProyek={editingProyek}
        isSubmitting={isSubmitting}
        validateForm={validateForm}
      />

      {/* Preview Modal */}
      <PreviewProyekModal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        proyek={selectedProyek}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Catatan Proyek"
        message={`Apakah Anda yakin ingin menghapus catatan proyek "${deletingProyek?.namaProyek}"?`}
        confirmText="Hapus"
        cancelText="Batal"
        loading={isSubmitting}
      />
    </>
  );
}