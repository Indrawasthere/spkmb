import { useState, useEffect } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import Badge from "../components/ui/badge/Badge";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import Select from "../components/form/Select";
import { PlusIcon } from "../icons";
import { DetailsModal } from "../components/common/DetailsModal";
import { DataTable } from "../components/common/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { StatsCard } from "../components/common/StatsCard";
import { ActionButtons } from "../components/common/ActionButtons";
import { useToast } from "../hooks/useToast"; 
import {
  DocumentChartBarIcon as DocumentIcon,
  FolderIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Dokumen {
  id: string;
  namaDokumen: string;
  jenisDokumen: string;
  paketId: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
  paket?: {
    kodePaket: string;
    namaPaket: string;
    status: string;
  };
}

interface Paket {
  id: string;
  kodePaket: string;
  namaPaket: string;
  status: "DRAFT" | "PUBLISHED" | "ON_PROGRESS" | "COMPLETED" | "CANCELLED";
}

interface DokumenFormData {
  namaDokumen: string;
  jenisDokumen: string;
  paketId: string;
  file: File | null;
}

interface FormErrors {
  namaDokumen?: string;
  jenisDokumen?: string;
  paketId?: string;
  file?: string;
}

export default function DokumenArsip() {
  const [dokumens, setDokumens] = useState<Dokumen[]>([]);
  const [pakets, setPakets] = useState<Paket[]>([]);
  const [eligiblePakets, setEligiblePakets] = useState<Paket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedData, setSelectedData] = useState<Dokumen | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [filterJenis, setFilterJenis] = useState("all");
  const [editingDokumen, setEditingDokumen] = useState<Dokumen | null>(null);
  const [deletingDokumen, setDeletingDokumen] = useState<Dokumen | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState<DokumenFormData>({
    namaDokumen: "",
    jenisDokumen: "",
    paketId: "",
    file: null,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const { isOpen, openModal, closeModal } = useModal();
  const { success, error, info, loading } = useToast(); // ✅ toast system

  useEffect(() => {
    fetchDokumens();
    fetchPakets();
  }, []);

  useEffect(() => {
    const eligible = pakets.filter(
      (paket) => paket.status === "ON_PROGRESS" || paket.status === "PUBLISHED"
    );
    setEligiblePakets(eligible);
  }, [pakets]);

  const fetchDokumens = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/dokumen`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setDokumens(data);
      }
    } catch (err) {
      error("Gagal memuat data dokumen");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPakets = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/paket`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setPakets(data);
      }
    } catch (err) {
      error("Gagal memuat data paket");
    }
  };

  const onSubmit = async (data: DokumenFormData) => {
    setIsLoading(true);
    loading("Mengupload dokumen...");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("paketId", data.paketId);
      formDataToSend.append("jenisDokumen", data.jenisDokumen);
      formDataToSend.append("namaDokumen", data.namaDokumen);
      if (data.file) formDataToSend.append("file", data.file);

      let response;
      if (editingDokumen && !data.file) {
        response = await fetch(
          `${API_BASE_URL}/api/dokumen/${editingDokumen.id}`,
          {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              namaDokumen: data.namaDokumen,
              jenisDokumen: data.jenisDokumen,
              paketId: data.paketId,
            }),
          }
        );
      } else {
        response = await fetch(`${API_BASE_URL}/api/dokumen/upload`, {
          method: "POST",
          credentials: "include",
          body: formDataToSend,
        });
      }

      if (response.ok) {
        await fetchDokumens();
        closeModal();
        resetForm();
        setEditingDokumen(null);
        success("Dokumen berhasil disimpan!");
      } else {
        const errorData = await response.json();
        error("Gagal menyimpan dokumen: " + (errorData.error || "Unknown error"));
      }
    } catch (err) {
      error("Terjadi kesalahan saat menyimpan dokumen");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (dokumen: Dokumen) => {
    setEditingDokumen(dokumen);
    setFormData({
      namaDokumen: dokumen.namaDokumen,
      jenisDokumen: dokumen.jenisDokumen,
      paketId: dokumen.paketId,
      file: null,
    });
    openModal();
  };

  const handleViewDetails = (data: Dokumen) => {
    setSelectedData(data);
    setViewDetailsOpen(true);
  };

  const handleDelete = (dokumen: Dokumen) => {
    setDeletingDokumen(dokumen);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingDokumen) return;
    setIsLoading(true);
    loading("Menghapus dokumen...");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/dokumen/${deletingDokumen.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        await fetchDokumens();
        success("Dokumen berhasil dihapus!");
      } else {
        const errorData = await response.json();
        error("Gagal menghapus: " + (errorData.error || "Unknown error"));
      }
    } catch (err) {
      error("Terjadi kesalahan saat menghapus dokumen");
    } finally {
      setIsLoading(false);
      setIsConfirmModalOpen(false);
      setDeletingDokumen(null);
    }
  };

  const handleSubmit = () => onSubmit(formData);

  const handleDownload = (dokumen: Dokumen) => {
    window.open(`${API_BASE_URL}${dokumen.filePath}`, "_blank");
    info("📄 Dokumen sedang diunduh...");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setFormErrors({ ...formErrors, file: "Ukuran file maksimal 10MB" });
        return;
      }

      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv",
        "image/jpeg",
        "image/png",
      ];

      if (!allowedTypes.includes(file.type)) {
        setFormErrors({ ...formErrors, file: "Format file tidak didukung" });
        return;
      }

      setFormData({ ...formData, file });
      setFormErrors({ ...formErrors, file: undefined });
    }
  };

  const resetForm = () => {
    setFormData({
      namaDokumen: "",
      jenisDokumen: "",
      paketId: "",
      file: null,
    });
    setFormErrors({});
    setEditingDokumen(null);
  };

  const openAddModal = () => {
    if (eligiblePakets.length === 0) {
      error(
        "Tidak ada paket yang eligible untuk upload dokumen. Pastikan status paket Pelaksanaan atau Dipublikasi."
      );
      return;
    }
    resetForm();
    openModal();
  };

  const filteredDokumens = dokumens.filter((doc) => {
    const matchSearch =
      searchQuery === "" ||
      doc.namaDokumen.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.jenisDokumen.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter =
      filterJenis === "all" || doc.jenisDokumen === filterJenis;
    return matchSearch && matchFilter;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const columns: ColumnDef<Dokumen>[] = [
    {
      accessorKey: "namaDokumen",
      header: "Nama Dokumen",
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: "jenisDokumen",
      header: "Jenis Dokumen",
      cell: ({ getValue }) => (
        <Badge size="sm" color="info">
          {getValue() as string}
        </Badge>
      ),
    },
    {
      accessorKey: "paket",
      header: "Paket",
      cell: ({ getValue }) => {
        const paket = getValue() as Dokumen["paket"];
        return (
          <div>
            <p className="font-medium">{paket?.kodePaket}</p>
            <p className="text-xs text-gray-500">{paket?.namaPaket}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "fileSize",
      header: "Ukuran File",
      cell: ({ getValue }) => formatFileSize(getValue() as number),
    },
    { accessorKey: "uploadedBy", header: "Upload By" },
    {
      accessorKey: "uploadedAt",
      header: "Upload Date",
      cell: ({ getValue }) =>
        new Date(getValue() as string).toLocaleDateString("id-ID"),
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

  return (
    <>
      <PageMeta
        title="SIPAKAT-PBJ - Dokumen & Arsip"
        description="Kelola dokumen pengadaan"
      />
      <PageBreadcrumb pageTitle="Dokumen & Arsip" />

      <div className="space-y-6">
        {/* Info Alert */}
        {eligiblePakets.length === 0 && (
          <div className="rounded-lg border border-warning-300 bg-warning-50 p-4 dark:border-warning-800 dark:bg-warning-900/20">
            <p className="text-sm text-warning-800 dark:text-warning-200">
              ⚠️ Tidak ada paket yang eligible untuk upload dokumen. Paket harus
              berstatus "Pelaksanaan" atau "Dipublikasi".
            </p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Total Dokumen"
            value={dokumens.length}
            subtitle="Dokumen tersimpan di sistem"
            icon={DocumentIcon}
            fromColor="from-blue-500"
            toColor="to-blue-600"
          />
          <StatsCard
            title="Total Ukuran"
            value={
              dokumens.length > 0
                ? formatFileSize(
                    dokumens.reduce((sum, d) => sum + d.fileSize, 0)
                  )
                : "0 Bytes"
            }
            subtitle="Total ukuran file yang diunggah"
            icon={ChartBarIcon}
            fromColor="from-green-500"
            toColor="to-green-600"
          />
          <StatsCard
            title="Paket Eligible"
            value={eligiblePakets.length}
            subtitle="Paket dengan status aktif"
            icon={FolderIcon}
            fromColor="from-purple-500"
            toColor="to-purple-600"
          />
        </div>

        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Arsip Dokumen
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola dan verifikasi dokumen pengadaan
            </p>
          </div>
          <Button
            size="md"
            variant="primary"
            startIcon={<PlusIcon />}
            onClick={openAddModal}
            disabled={isLoading || eligiblePakets.length === 0}
          >
            Upload Dokumen
          </Button>
        </div>

        {/* Filter + Data Table */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              className="border border-gray-300 dark:border-gray-600 rounded-lg py-2 pl-3 pr-10 text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
            >
              <option value="all">Semua Jenis</option>
              <option value="TOR">TOR</option>
              <option value="HPS">HPS</option>
              <option value="Kontrak">Kontrak</option>
              <option value="BA Serah Terima">BA Serah Terima</option>
              <option value="Laporan Kemajuan">Laporan Kemajuan</option>
              <option value="KAK/RAB">KAK/RAB</option>
              <option value="Spesifikasi Teknis">Spesifikasi Teknis</option>
              <option value="JAMINAN_UANG_MUKA">Jaminan Uang Muka</option>
              <option value="JAMINAN_PELAKSANAAN">Jaminan Pelaksanaan</option>
              <option value="JAMINAN_PEMELIHARAAN">
                Jaminan Pemeliharaan
              </option>
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredDokumens}
          loading={isLoading}
          enableExport={true}
          enableColumnVisibility={false}
          pageSize={10}
          searchPlaceholder="Cari nama atau jenis dokumen..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          fixedHeight="750px"
          fixedWidth="1300px"
          minVisibleRows={10}
        />
      </div>

      {/* Modals */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        size="2xl"
        title={editingDokumen ? "Edit Dokumen" : "Upload Dokumen"}
        showHeader={true}
      >
        <div className="flex flex-col max-h-[80vh] overflow-y-auto px-6 py-4 space-y-4">
          <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            {editingDokumen ? "Edit Dokumen" : "Upload Dokumen"}
          </h3>

          <div className="space-y-4">
            <div>
              <Label>Nama Dokumen *</Label>
              <Input
                type="text"
                value={formData.namaDokumen}
                onChange={(e) =>
                  setFormData({ ...formData, namaDokumen: e.target.value })
                }
                placeholder="Masukkan nama dokumen"
                error={!!formErrors.namaDokumen}
                hint={formErrors.namaDokumen}
              />
            </div>

            <div>
              <Label>Jenis Dokumen *</Label>
              <Select
                options={[
                  { value: "TOR", label: "TOR (Terms of Reference)" },
                  { value: "HPS", label: "HPS (Harga Perkiraan Sendiri)" },
                  { value: "Kontrak", label: "Kontrak" },
                  { value: "BA Serah Terima", label: "BA Serah Terima" },
                  { value: "Laporan Kemajuan", label: "Laporan Kemajuan" },
                  { value: "KAK/RAB", label: "KAK/RAB" },
                  { value: "Spesifikasi Teknis", label: "Spesifikasi Teknis" },
                  { value: "JAMINAN_UANG_MUKA", label: "Jaminan Uang Muka" },
                  { value: "JAMINAN_PELAKSANAAN", label: "Jaminan Pelaksanaan" },
                  { value: "JAMINAN_PEMELIHARAAN", label: "Jaminan Pemeliharaan" },
                ]}
                placeholder="Pilih jenis dokumen"
                onChange={(value) =>
                  setFormData({ ...formData, jenisDokumen: value })
                }
                value={formData.jenisDokumen}
              />
              {formErrors.jenisDokumen && (
                <p className="mt-1 text-xs text-error-500">
                  {formErrors.jenisDokumen}
                </p>
              )}
            </div>

            <div>
              <Label>Paket *</Label>
              <Select
                options={eligiblePakets.map((paket) => ({
                  value: paket.id,
                  label: `${paket.kodePaket} - ${paket.namaPaket}`,
                }))}
                placeholder="Pilih paket"
                onChange={(value) =>
                  setFormData({ ...formData, paketId: value })
                }
                value={formData.paketId}
              />
              {formErrors.paketId && (
                <p className="mt-1 text-xs text-error-500">
                  {formErrors.paketId}
                </p>
              )}
            </div>

            <div>
              <Label>File Dokumen {!editingDokumen && "*"}</Label>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xlsx,.csv,.jpg,.jpeg,.png"
                className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              />
              {formErrors.file && (
                <p className="mt-1 text-xs text-error-500">
                  {formErrors.file}
                </p>
              )}
              {editingDokumen && (
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
                : editingDokumen
                ? "Update"
                : "Upload"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title="Hapus Dokumen"
        message={`Apakah Anda yakin ingin menghapus dokumen "${deletingDokumen?.namaDokumen}"?`}
        confirmText="Hapus"
        cancelText="Batal"
        loading={isLoading}
      />

      {selectedData && (
        <DetailsModal
          isOpen={viewDetailsOpen}
          onClose={() => setViewDetailsOpen(false)}
          title="Detail Dokumen"
          sections={[
            {
              title: "Informasi Dokumen",
              fields: [
                { label: "Nama Dokumen", value: selectedData.namaDokumen },
                {
                  label: "Jenis Dokumen",
                  value: (
                    <Badge size="sm" color="info">
                      {selectedData.jenisDokumen}
                    </Badge>
                  ),
                },
                {
                  label: "Ukuran File",
                  value: formatFileSize(selectedData.fileSize),
                },
                { label: "Tipe MIME", value: selectedData.mimeType },
                { label: "Upload Oleh", value: selectedData.uploadedBy },
                {
                  label: "Tanggal Upload",
                  value: new Date(
                    selectedData.uploadedAt
                  ).toLocaleDateString("id-ID"),
                },
              ],
            },
          ]}
          documents={[
            {
              id: selectedData.id,
              namaDokumen: selectedData.namaDokumen,
              filePath: selectedData.filePath,
              uploadedAt: selectedData.uploadedAt,
            },
          ]}
        />
      )}
    </>
  );
}
