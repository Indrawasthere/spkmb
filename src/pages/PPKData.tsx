// src/pages/PPKData.tsx - REFACTORED VERSION
import { useState, useMemo } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import { PlusIcon } from "../icons";
import { useModal } from "../hooks/useModal";
import { DataTable } from "../components/common/DataTable";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { StatsCard } from "../components/common/StatsCard";
import { CalenderIcon, DollarLineIcon, TrendingUp } from "../icons";
import { createColumns, PPKData } from "./PPKData/components/columns";
import { PreviewPPKModal } from "./PPKData/components/PreviewPPKModal";
import { PPKFormModal } from "./PPKData/components/PPKFormModal";
import { usePPKData } from "./PPKData/hooks/usePPKData";
import { usePPKActions } from "./PPKData/hooks/usePPKActions";

const formatCurrency = (value: number): string =>
  value.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  });

export default function PPKDataPage() {
  const { ppkData, pakets, loading, fetchPPKData } = usePPKData();
  const [selectedPPK, setSelectedPPK] = useState<PPKData | null>(null);
  const [editingPPK, setEditingPPK] = useState<PPKData | null>(null);
  const [deletingPPK, setDeletingPPK] = useState<PPKData | null>(null);

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

  // Actions
  const {
    isSubmitting,
    validateForm,
    createPPKData,
    updatePPKData,
    deletePPKData,
  } = usePPKActions(() => {
    fetchPPKData();
    closeFormModal();
    setEditingPPK(null);
  });

  // Filtered data
  const filteredPPKData = useMemo(() => {
    return ppkData.filter((item) => {
      const matchSearch =
        searchQuery === "" ||
        item.namaPPK.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.noSertifikasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.paket?.kodePaket.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.paket?.namaPaket.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [ppkData, searchQuery]);

  // Handlers
  const handleView = (ppk: PPKData) => {
    setSelectedPPK(ppk);
    setIsViewOpen(true);
  };

  const handleEdit = (ppk: PPKData) => {
    setEditingPPK(ppk);
    openFormModal();
  };

  const handleDeleteClick = (ppk: PPKData) => {
    setDeletingPPK(ppk);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingPPK) {
      await deletePPKData(deletingPPK.id);
      setIsDeleteOpen(false);
      setDeletingPPK(null);
    }
  };

  const handleFormSubmit = async (formData: any) => {
    if (editingPPK) {
      await updatePPKData(editingPPK.id, formData);
    } else {
      await createPPKData(formData);
    }
  };

  const handleAddNew = () => {
    setEditingPPK(null);
    openFormModal();
  };

  // Stats
  const totalPPK = ppkData.length;
  const totalBudget = ppkData.reduce((sum, item) => sum + item.jumlahAnggaran, 0);
  const averageCompletion =
    ppkData.length > 0
      ? Math.round(
          ppkData.reduce((sum, item) => {
            const terminCount = [
              item.realisasiTermin1,
              item.realisasiTermin2,
              item.realisasiTermin3,
              item.realisasiTermin4,
            ].filter(Boolean).length;
            return sum + (terminCount / 4) * 100;
          }, 0) / ppkData.length
        )
      : 0;

  // Table columns
  const columns = createColumns(
    handleView,
    handleEdit,
    (id) => {
      const ppk = ppkData.find((p) => p.id === id);
      if (ppk) handleDeleteClick(ppk);
    },
    true // canDelete - adjust based on user role if needed
  );

  return (
    <>
      <PageMeta
        title="SIPAKAT-PBJ - Data PPK"
        description="Kelola data PPK dan realisasi anggaran proyek"
      />
      <PageBreadcrumb pageTitle="Data PPK" />

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Total PPK"
            value={totalPPK}
            subtitle="Data PPK terdaftar"
            icon={CalenderIcon}
            fromColor="from-blue-500"
            toColor="to-blue-600"
          />
          <StatsCard
            title="Total Anggaran"
            value={formatCurrency(totalBudget)}
            subtitle="Nilai total proyek"
            icon={DollarLineIcon}
            fromColor="from-green-500"
            toColor="to-green-600"
          />
          <StatsCard
            title="Rata-rata Progress"
            value={`${averageCompletion}%`}
            subtitle="Realisasi termin"
            icon={TrendingUp}
            fromColor="from-purple-500"
            toColor="to-purple-600"
          />
        </div>

        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Data PPK
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola data PPK dan monitoring realisasi anggaran
            </p>
          </div>
          <Button
            size="md"
            variant="primary"
            startIcon={<PlusIcon />}
            onClick={handleAddNew}
            disabled={loading}
          >
            Tambah Data PPK
          </Button>
        </div>

        {/* DataTable */}
        <DataTable
          columns={columns}
          data={filteredPPKData}
          searchPlaceholder="Cari data PPK..."
          loading={loading}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          fixedHeight="750px"
          fixedWidth="1300px"
          minVisibleRows={10}
        />
      </div>

      {/* Form Modal (Add/Edit) */}
      <PPKFormModal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        onSubmit={handleFormSubmit}
        editingPPK={editingPPK}
        pakets={pakets}
        isSubmitting={isSubmitting}
        validateForm={validateForm}
      />

      {/* Preview Modal */}
      <PreviewPPKModal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        ppkData={selectedPPK}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Data PPK"
        message={`Apakah Anda yakin ingin menghapus data PPK "${deletingPPK?.namaPPK}"?`}
        confirmText="Hapus"
        cancelText="Batal"
        loading={isSubmitting}
      />
    </>
  );
}