import { useState, useEffect, useMemo } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import Badge from "../components/ui/badge/Badge";
import { PlusIcon } from "../icons";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import Select from "../components/form/Select";
import { useAuth } from "../context/AuthContext";
import { DataTable } from "../components/common/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { ActionButtons } from "../components/common/ActionButtons";
import { DetailsModal } from "../components/common/DetailsModal";
import { FolderOpen, CheckCircle2, AlertTriangle } from "lucide-react";
import { StatsCard } from "../components/common/StatsCard";
import toast from "react-hot-toast";

interface Paket {
  id: string;
  kodePaket: string;
  kodeRUP?: string;
  namaPaket: string;
  jenisPaket: string;
  nilaiPaket: number;
  metodePengadaan: string;
  status: "DRAFT" | "PUBLISHED" | "ON_PROGRESS" | "COMPLETED" | "CANCELLED";
  tanggalBuat: string;
  createdBy: string;
  tanggalMulai?: string;
  tanggalSelesai?: string;
  lamaProyek?: number;
  dokumen?: any[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function ManajemenPaket() {
  const { user } = useAuth();
  const [pakets, setPakets] = useState<Paket[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPaket, setSelectedPaket] = useState<Paket | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [editingPaket, setEditingPaket] = useState<Paket | null>(null);
  const [deletingPaket, setDeletingPaket] = useState<Paket | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // === Filters ===
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [jenisFilter, setJenisFilter] = useState("ALL");

  // === Form Data ===
  const [formData, setFormData] = useState({
    kodePaket: "",
    kodeRUP: "",
    namaPaket: "",
    jenisPaket: "",
    nilaiPaket: "",
    metodePengadaan: "",
    status: "DRAFT" as Paket["status"],
    tanggalMulai: "",
    tanggalSelesai: "",
    lamaProyek: "",
  });

  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File }>(
    {}
  );
  const { isOpen, openModal, closeModal } = useModal();

  // === Auto Hitung Lama Proyek ===
  useEffect(() => {
    if (formData.tanggalMulai && formData.tanggalSelesai) {
      const start = new Date(formData.tanggalMulai);
      const end = new Date(formData.tanggalSelesai);
      if (end > start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setFormData((prev) => ({ ...prev, lamaProyek: diffDays.toString() }));
      }
    }
  }, [formData.tanggalMulai, formData.tanggalSelesai]);

  useEffect(() => {
    fetchPakets();
  }, []);

  const fetchPakets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/paket`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setPakets(data);
      } else {
        toast.error("Gagal memuat data paket");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat memuat paket");
    } finally {
      setLoading(false);
    }
  };

  // === Format Currency ===
  const handleCurrencyInput = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    const formatted = new Intl.NumberFormat("id-ID").format(
      Number(numericValue || 0)
    );
    setFormData((prev) => ({
      ...prev,
      nilaiPaket: formatted ? `Rp ${formatted}` : "",
    }));
  };

  const filteredPakets = useMemo(() => {
    return pakets.filter((paket) => {
      const matchSearch =
        searchQuery === "" ||
        paket.namaPaket.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paket.kodePaket.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus =
        statusFilter === "ALL" || paket.status === statusFilter;
      const matchJenis =
        jenisFilter === "ALL" || paket.jenisPaket === jenisFilter;
      return matchSearch && matchStatus && matchJenis;
    });
  }, [pakets, searchQuery, statusFilter, jenisFilter]);

  // === Status Formatting ===
  const getStatusColor = (status: Paket["status"]) => {
    const colors = {
      DRAFT: "light",
      PUBLISHED: "info",
      ON_PROGRESS: "warning",
      COMPLETED: "success",
      CANCELLED: "error",
    };
    return colors[status] || "light";
  };

  const getStatusLabel = (status: Paket["status"]) => {
    const labels = {
      DRAFT: "Perencanaan",
      PUBLISHED: "Dipublikasi",
      ON_PROGRESS: "Proses",
      COMPLETED: "Selesai",
      CANCELLED: "Batal",
    };
    return labels[status] || status;
  };

  const handleViewDetails = (paket: Paket) => {
    setSelectedPaket(paket);
    setViewDetailsOpen(true);
  };

  const handleEdit = (paket: Paket) => {
    setEditingPaket(paket);
    setFormData({
      kodePaket: paket.kodePaket,
      kodeRUP: paket.kodeRUP || "",
      namaPaket: paket.namaPaket,
      jenisPaket: paket.jenisPaket,
      nilaiPaket: `Rp ${paket.nilaiPaket.toLocaleString("id-ID")}`,
      metodePengadaan: paket.metodePengadaan,
      status: paket.status,
      tanggalMulai: paket.tanggalMulai?.split("T")[0] || "",
      tanggalSelesai: paket.tanggalSelesai?.split("T")[0] || "",
      lamaProyek: paket.lamaProyek?.toString() || "",
    });
    openModal();
  };

  const handleDelete = (paket: Paket) => {
    setDeletingPaket(paket);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingPaket) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/dokumen/${deletingPaket.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        await fetchPakets();
        toast.success("Dokumen berhasil dihapus!");
      } else {
        const errorData = await response.json();
        toast.error(
          "Gagal menghapus dokumen: " + (errorData.error || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error deleting dokumen:", error);
      toast.error("Terjadi kesalahan saat menghapus dokumen");
    } finally {
      setLoading(false);
      setIsConfirmModalOpen(false);
      setDeletingPaket(null);
    }
  };

  // === Submit Paket + Upload Dokumen ===
  const handleSubmit = async () => {
    if (!formData.kodePaket || !formData.namaPaket || !formData.nilaiPaket) {
      toast.error("Lengkapi semua field yang wajib");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        kodePaket: formData.kodePaket,
        namaPaket: formData.namaPaket,
        jenisPaket: formData.jenisPaket,
        nilaiPaket: formData.nilaiPaket.replace(/[^\d]/g, ""),
        metodePengadaan: formData.metodePengadaan,
        status: formData.status,
        tanggalMulai: formData.tanggalMulai || undefined,
        tanggalSelesai: formData.tanggalSelesai || undefined,
      };

      const paketUrl = editingPaket
        ? `${API_BASE_URL}/api/paket/${editingPaket.id}`
        : `${API_BASE_URL}/api/paket`;
      const paketMethod = editingPaket ? "PUT" : "POST";

      const paketRes = await fetch(paketUrl, {
        method: paketMethod,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!paketRes.ok) {
        const err = await paketRes.json().catch(() => ({}));
        throw new Error(err.error || "Gagal menyimpan paket");
      }

      const paketData = await paketRes.json();
      const paketId = paketData.id;

      // Upload dokumen
      if (Object.keys(uploadedFiles).length > 0) {
        toast.loading("Mengupload dokumen...", { id: "uploadDocs" });

        for (const [jenisDokumen, file] of Object.entries(uploadedFiles)) {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("paketId", paketId);
          fd.append("jenisDokumen", jenisDokumen);

          const res = await fetch(`${API_BASE_URL}/api/dokumen/upload`, {
            method: "POST",
            credentials: "include",
            body: fd,
          });

          if (!res.ok) {
            toast.error(`Gagal upload dokumen: ${jenisDokumen}`);
            continue;
          }
        }

        toast.success("Semua dokumen berhasil diupload!", { id: "uploadDocs" });
      }

      await fetchPakets();
      closeModal();
      resetForm();

      toast.success(
        editingPaket
          ? "Paket berhasil diupdate!"
          : "Paket berhasil ditambahkan!"
      );
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menyimpan paket");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      kodePaket: "",
      kodeRUP: "",
      namaPaket: "",
      jenisPaket: "",
      nilaiPaket: "",
      metodePengadaan: "",
      status: "DRAFT",
      tanggalMulai: "",
      tanggalSelesai: "",
      lamaProyek: "",
    });
    setUploadedFiles({});
    setEditingPaket(null);
  };

  // === Table Columns ===
  const columns: ColumnDef<Paket>[] = [
    { accessorKey: "kodePaket", header: "Kode Paket" },
    { accessorKey: "namaPaket", header: "Nama Paket" },
    {
      accessorKey: "nilaiPaket",
      header: "Nilai Paket",
      cell: ({ row }) => (
        <span className="font-medium text-green-600 dark:text-green-400">
          Rp {row.original.nilaiPaket.toLocaleString("id-ID")}
        </span>
      ),
    },
    { accessorKey: "jenisPaket", header: "Jenis Paket" },
    { accessorKey: "metodePengadaan", header: "Metode" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge size="sm" color={getStatusColor(row.original.status)}>
          {getStatusLabel(row.original.status)}
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

  const detailsSections = selectedPaket
    ? [
        {
          title: "Informasi Dasar",
          fields: [
            { label: "Kode Paket", value: selectedPaket.kodePaket },
            { label: "Kode RUP", value: selectedPaket.kodeRUP || "-" },
            { label: "Nama Paket", value: selectedPaket.namaPaket },
            { label: "Jenis Paket", value: selectedPaket.jenisPaket },
            { label: "Metode Pengadaan", value: selectedPaket.metodePengadaan },
            {
              label: "Nilai Paket",
              value: `Rp ${selectedPaket.nilaiPaket.toLocaleString("id-ID")}`,
            },
            {
              label: "Status",
              value: (
                <Badge color={getStatusColor(selectedPaket.status)}>
                  {getStatusLabel(selectedPaket.status)}
                </Badge>
              ),
            },
          ],
        },
        {
          title: "Timeline",
          fields: [
            {
              label: "Tanggal Mulai",
              value:
                selectedPaket.tanggalMulai &&
                new Date(selectedPaket.tanggalMulai).toLocaleDateString(
                  "id-ID"
                ),
            },
            {
              label: "Tanggal Selesai",
              value:
                selectedPaket.tanggalSelesai &&
                new Date(selectedPaket.tanggalSelesai).toLocaleDateString(
                  "id-ID"
                ),
            },
            {
              label: "Lama Proyek",
              value: selectedPaket.lamaProyek
                ? `${selectedPaket.lamaProyek} hari`
                : "-",
            },
          ],
        },
      ]
    : [];

  // === Stats Data ===
  const totalNilai = pakets.reduce((sum, p) => sum + p.nilaiPaket, 0);
  const totalSelesai = pakets.filter((p) => p.status === "COMPLETED").length;
  const totalProgress = pakets.filter((p) => p.status === "ON_PROGRESS").length;

  const dokumenTypes = [
    "KAK/RAB",
    "Spesifikasi Teknis",
    "Kontrak",
    "Timeline",
    "Syarat Khusus",
    "Jaminan Uang Muka",
    "Jaminan Pelaksanaan",
    "Jaminan Pemeliharaan",
  ];

  return (
    <>
      <PageMeta 
        title="SIPAKAT-PBJ - Manajemen Paket"
        description="Kelola dan manajemen paket" />
      <PageBreadcrumb pageTitle="Manajemen Paket" />
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatsCard
            title="Total Paket"
            value={pakets.length}
            subtitle="Jumlah seluruh paket pengadaan"
            icon={FolderOpen}
            fromColor="from-indigo-500"
            toColor="to-indigo-700"
          />
          <StatsCard
            title="Nilai Total"
            value={`Rp ${pakets
              .reduce((a, b) => a + b.nilaiPaket, 0)
              .toLocaleString("id-ID")}`}
            subtitle="Total nilai proyek aktif"
            icon={CheckCircle2}
            fromColor="from-green-500"
            toColor="to-green-700"
          />
          <StatsCard
            title="Paket Selesai"
            value={pakets.filter((p) => p.status === "COMPLETED").length}
            subtitle={`Progres aktif: ${
              pakets.filter((p) => p.status === "ON_PROGRESS").length
            }`}
            icon={AlertTriangle}
            fromColor="from-yellow-400"
            toColor="to-yellow-600"
          />
        </div>
      
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Daftar Paket Pengadaan
              </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola semua paket pengadaan dan dokumennya
            </p>
          </div>
          <Button
            size="md"
            variant="primary"
            startIcon={<PlusIcon />}
            onClick={() => {
              resetForm();
              openModal();
            }}
          >
            Tambah Paket
          </Button>
        </div>


        {/* Filters + Data Table */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              className="border border-gray-300 dark:border-gray-600 rounded-lg py-2 pl-3 pr-10 text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Semua Status</option>
              <option value="DRAFT">Perencanaan</option>
              <option value="PUBLISHED">Dipublikasi</option>
              <option value="ON_PROGRESS">Proses</option>
              <option value="COMPLETED">Selesai</option>
              <option value="CANCELLED">Batal</option>
            </select>

            {/* Jenis Filter */}
            <select
              className="border border-gray-300 dark:border-gray-600 rounded-lg py-2 pl-3 pr-10 text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M4%206l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[right_0.5rem_center] bg-no-repeat"
              value={jenisFilter}
              onChange={(e) => setJenisFilter(e.target.value)}
            >
              <option value="ALL">Semua Jenis</option>
              <option value="Konstruksi">Konstruksi</option>
              <option value="Barang">Barang</option>
              <option value="Jasa Konsultansi">Jasa Konsultansi</option>
              <option value="Jasa Lainnya">Jasa Lainnya</option>
            </select>
          </div>
        </div>

        {/* DataTable - PASS CONTROLLED SEARCH & FILTERED DATA */}
        <DataTable
          columns={columns}
          data={filteredPakets}
          loading={loading}
          enableExport={true}
          enableColumnVisibility={false}
          pageSize={10}
          searchPlaceholder="Cari nama atau kode paket..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          fixedHeight="750px"
          fixedWidth="1300px"
          minVisibleRows={10}
        />
      </div>

      {/* FORM MODAL */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        size="2xl"
        title={editingPaket ? "Edit Paket" : "Tambah Paket"}
        showHeader={false}
      >
        <div className="flex flex-col max-h-[80vh] overflow-y-auto px-6 py-4 space-y-4">
          <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            {editingPaket ? "Edit Paket" : "Upload Paket"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Kode Paket *</Label>
              <Input
                value={formData.kodePaket}
                onChange={(e) =>
                  setFormData({ ...formData, kodePaket: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Kode RUP</Label>
              <Input
                value={formData.kodeRUP}
                onChange={(e) =>
                  setFormData({ ...formData, kodeRUP: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Nilai Paket *</Label>
              <Input
                value={formData.nilaiPaket}
                onChange={(e) => handleCurrencyInput(e.target.value)}
                placeholder="Rp 0"
              />
            </div>
          </div>

          <Label>Nama Paket *</Label>
          <Input
            value={formData.namaPaket}
            onChange={(e) =>
              setFormData({ ...formData, namaPaket: e.target.value })
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Jenis Paket *</Label>
              <Select
                options={[
                  { value: "Konstruksi", label: "Konstruksi" },
                  { value: "Barang", label: "Barang" },
                  { value: "Jasa Konsultansi", label: "Jasa Konsultansi" },
                  { value: "Jasa Lainnya", label: "Jasa Lainnya" },
                ]}
                value={formData.jenisPaket}
                onChange={(value) =>
                  setFormData({ ...formData, jenisPaket: value })
                }
              />
            </div>
            <div>
              <Label>Metode Pengadaan *</Label>
              <Select
                options={[
                  { value: "E_PURCHASING", label: "E-Purchasing" },
                  { value: "SWAKELOLA", label: "Swakelola" },
                  { value: "TENDER", label: "Tender" },
                  {
                    value: "PENUNJUKAN_LANGSUNG",
                    label: "Penunjukan Langsung",
                  },
                  { value: "SELEKSI", label: "Seleksi" },
                ]}
                value={formData.metodePengadaan}
                onChange={(value) =>
                  setFormData({ ...formData, metodePengadaan: value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Tanggal Mulai</Label>
              <Input
                type="date"
                value={formData.tanggalMulai}
                onChange={(e) =>
                  setFormData({ ...formData, tanggalMulai: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Tanggal Selesai</Label>
              <Input
                type="date"
                value={formData.tanggalSelesai}
                onChange={(e) =>
                  setFormData({ ...formData, tanggalSelesai: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Lama Proyek (hari)</Label>
              <Input value={formData.lamaProyek} disabled placeholder="Auto" />
            </div>
          </div>

          {/* Upload Dokumen */}
          <div className="border-t pt-4 space-y-4">
            <h4 className="font-medium">Upload Dokumen</h4>
            {dokumenTypes.map((type) => (
              <div
                key={type}
                className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800/40"
              >
                <Label>{type}</Label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          toast.error("Ukuran file maksimal 10MB");
                          return;
                        }
                        setUploadedFiles((prev) => ({ ...prev, [type]: file }));
                      }
                    }}
                    accept=".pdf,.doc,.docx,.xlsx,.jpg,.jpeg,.png"
                    className="flex-1 h-11 rounded-lg border px-3 py-2 text-sm"
                  />
                  {uploadedFiles[type] && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setUploadedFiles((prev) => {
                          const nf = { ...prev };
                          delete nf[type];
                          return nf;
                        });
                      }}
                    >
                      Hapus
                    </Button>
                  )}
                </div>
                {uploadedFiles[type] && (
                  <p className="text-xs mt-1 text-gray-600">
                    ✓ {uploadedFiles[type].name} (
                    {(uploadedFiles[type].size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={closeModal}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title="Hapus Dokumen"
        message={`Apakah Anda yakin ingin menghapus dokumen "${deletingPaket?.namaPaket}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        loading={loading}
      />

      {/* Detail Modal */}
      {selectedPaket && (
        <DetailsModal
          isOpen={viewDetailsOpen}
          onClose={() => setViewDetailsOpen(false)}
          title="Detail Paket"
          sections={detailsSections}
          documents={
            selectedPaket.dokumen?.map((doc) => ({
              id: doc.id,
              namaDokumen: doc.namaDokumen,
              filePath: doc.filePath,
              uploadedAt: doc.uploadedAt,
            })) || []
          }
        />
      )}
    </>
  );
}
