import { useState, useEffect } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import Badge from "../components/ui/badge/Badge";
import { PlusIcon, PencilIcon, TrashBinIcon } from "../icons";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import Select from "../components/form/Select";
import { useAuth } from "../context/AuthContext";
import { DataTable } from "../components/common/DataTable";
import { ColumnDef } from "@tanstack/react-table";

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
  dokumenKontrak?: string;
  dokumen?: Dokumen[];
  ppkData?: PPKData[];
  vendors?: Vendor[];
}

interface PPKData {
  id: string;
  paketId: string;
  namaPPK: string;
  noSertifikasi: string;
  jumlahAnggaran: number;
  lamaProyek: number;
  realisasiTermin1?: number;
  realisasiTermin2?: number;
  realisasiTermin3?: number;
  realisasiTermin4?: number;
  PHO?: string;
  FHO?: string;
}

interface Vendor {
  id: string;
  namaVendor: string;
  jenisVendor: string;
  paketId?: string;
  noKontrak?: string;
  deskripsi?: string;
  dokumenDED?: string;
  lamaKontrak?: number;
  warningTemuan?: boolean;
  namaProyek?: string;
  deskripsiLaporan?: string;
  dokumenLaporan?: string;
  deskripsiProgress?: string;
  uploadDokumen?: string;
  uploadFoto?: string;
}

interface Dokumen {
  id: string;
  namaDokumen: string;
  jenisDokumen: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface FormErrors {
  kodePaket?: string;
  namaPaket?: string;
  jenisPaket?: string;
  nilaiPaket?: string;
  metodePengadaan?: string;
}

const API_BASE_URL = "http://localhost:3001";

export default function ManajemenPaket() {
  const { user } = useAuth();
  const [pakets, setPakets] = useState<Paket[]>([]);
  const [loading, setLoading] = useState(false);
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
    dokumenKontrak: null as File | null,
  });

  // Auto-calculate lamaProyek when tanggalMulai or tanggalSelesai changes
  useEffect(() => {
    if (formData.tanggalMulai && formData.tanggalSelesai) {
      const startDate = new Date(formData.tanggalMulai);
      const endDate = new Date(formData.tanggalSelesai);
      if (endDate > startDate) {
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setFormData(prev => ({ ...prev, lamaProyek: diffDays.toString() }));
      } else {
        setFormData(prev => ({ ...prev, lamaProyek: "" }));
      }
    } else {
      setFormData(prev => ({ ...prev, lamaProyek: "" }));
    }
  }, [formData.tanggalMulai, formData.tanggalSelesai]);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formDokumen, setFormDokumen] = useState<{
    [key: string]: File | null;
  }>({
    "KAK/RAB": null,
    "Spesifikasi Teknis": null,
    Kontrak: null,
    Timeline: null,
    "Syarat Khusus": null,
  });
  const [editingPaket, setEditingPaket] = useState<Paket | null>(null);

  const { isOpen, openModal, closeModal } = useModal();

  useEffect(() => {
    fetchPakets();
  }, []);

  const fetchPakets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/paket`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setPakets(data);
      }
    } catch (error) {
      console.error("Error fetching paket:", error);
    } finally {
      setLoading(false);
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.kodePaket.trim()) {
      errors.kodePaket = "Kode paket wajib diisi";
    }

    if (!formData.namaPaket.trim()) {
      errors.namaPaket = "Nama paket wajib diisi";
    }

    if (!formData.jenisPaket) {
      errors.jenisPaket = "Jenis paket wajib dipilih";
    }

    const nilai = parseFloat(formData.nilaiPaket.replace(/[^\d]/g, ""));
    if (isNaN(nilai) || nilai <= 0) {
      errors.nilaiPaket = "Nilai paket harus berupa angka positif";
    }

    if (!formData.metodePengadaan) {
      errors.metodePengadaan = "Metode pengadaan wajib dipilih";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const nilai = parseFloat(formData.nilaiPaket.replace(/[^\d]/g, ""));
      const status = editingPaket ? formData.status : "DRAFT";

      const paketData = {
        kodePaket: formData.kodePaket.trim(),
        namaPaket: formData.namaPaket.trim(),
        jenisPaket: formData.jenisPaket,
        nilaiPaket: nilai,
        metodePengadaan: formData.metodePengadaan,
        status: status,
        createdBy: user?.id || "",
        tanggalMulai: formData.tanggalMulai || undefined,
        tanggalSelesai: formData.tanggalSelesai || undefined,
        lamaProyek: formData.lamaProyek ? parseInt(formData.lamaProyek) : undefined,
      };

      let response;
      if (editingPaket) {
        // For edit, use FormData to handle file upload
        const formDataToSend = new FormData();
        Object.entries(paketData).forEach(([key, value]) => {
          if (value !== undefined) {
            formDataToSend.append(key, value.toString());
          }
        });
        if (formData.dokumenKontrak) {
          formDataToSend.append("dokumenKontrak", formData.dokumenKontrak);
        }

        response = await fetch(`${API_BASE_URL}/api/paket/${editingPaket.id}`, {
          method: "PUT",
          credentials: "include",
          body: formDataToSend,
        });
      } else {
        response = await fetch(`${API_BASE_URL}/api/paket`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paketData),
        });
      }

      if (response.ok) {
        const result = await response.json();
        const paketId = editingPaket ? editingPaket.id : result.id;

        // Upload documents if creating new paket
        if (!editingPaket) {
          await uploadDokumenPaket(paketId);
        }

        await fetchPakets();
        closeModal();
        resetForm();
        alert("Paket berhasil disimpan!");
      } else {
        const errorData = await response.json();
        alert("Gagal menyimpan paket: " + (errorData.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error saving paket:", error);
      alert("Terjadi kesalahan saat menyimpan paket");
    } finally {
      setLoading(false);
    }
  };

  const uploadDokumenPaket = async (paketId: string) => {
    const dokumenKeys = Object.keys(formDokumen);
    for (const key of dokumenKeys) {
      const file = formDokumen[key];
      if (file) {
        try {
          const formDataToSend = new FormData();
          formDataToSend.append("paketId", paketId);
          formDataToSend.append("jenisDokumen", key);
          formDataToSend.append("file", file);

          await fetch(`${API_BASE_URL}/api/dokumen/upload`, {
            method: "POST",
            credentials: "include",
            body: formDataToSend,
          });
        } catch (error) {
          console.error(`Error uploading ${key}:`, error);
        }
      }
    }
  };

  const handleEdit = (paket: Paket) => {
    setEditingPaket(paket);
    setFormData({
      kodePaket: paket.kodePaket,
      kodeRUP: paket.kodeRUP || "",
      namaPaket: paket.namaPaket,
      jenisPaket: paket.jenisPaket,
      nilaiPaket: paket.nilaiPaket.toString(),
      metodePengadaan: paket.metodePengadaan,
      status: paket.status,
      tanggalMulai: paket.tanggalMulai || "",
      tanggalSelesai: paket.tanggalSelesai || "",
      lamaProyek: paket.lamaProyek?.toString() || "",
      dokumenKontrak: null,
    });
    setFormErrors({});
    openModal();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus paket ini?")) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/paket/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        await fetchPakets();
        alert("Paket berhasil dihapus!");
      } else {
        const errorData = await response.json();
        alert("Gagal menghapus paket: " + (errorData.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error deleting paket:", error);
      alert("Terjadi kesalahan saat menghapus paket");
    } finally {
      setLoading(false);
    }
  };

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedPaketId, setSelectedPaketId] = useState<string>("");
  const [uploadFormData, setUploadFormData] = useState({
    jenisDokumen: "",
    file: null as File | null,
  });

  const handleUpload = (paketId: string) => {
    setSelectedPaketId(paketId);
    setUploadModalOpen(true);
  };

  const handleFileUpload = async () => {
    if (!uploadFormData.file || !uploadFormData.jenisDokumen) {
      alert("Pilih file dan jenis dokumen");
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("paketId", selectedPaketId);
      formDataToSend.append("jenisDokumen", uploadFormData.jenisDokumen);
      formDataToSend.append("file", uploadFormData.file);

      const response = await fetch(`${API_BASE_URL}/api/dokumen/upload`, {
        method: "POST",
        credentials: "include",
        body: formDataToSend,
      });

      if (response.ok) {
        alert("Dokumen berhasil diupload");
        setUploadModalOpen(false);
        setUploadFormData({ jenisDokumen: "", file: null });
        fetchPakets();
      } else {
        alert("Gagal upload dokumen");
      }
    } catch (error) {
      console.error("Error uploading dokumen:", error);
      alert("Terjadi kesalahan saat upload");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFormData({ ...uploadFormData, file });
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
      dokumenKontrak: null,
    });
    setFormDokumen({
      "KAK/RAB": null,
      "Spesifikasi Teknis": null,
      Kontrak: null,
      Timeline: null,
      "Syarat Khusus": null,
    });
    setFormErrors({});
    setEditingPaket(null);
  };

  const openAddModal = () => {
    resetForm();
    openModal();
  };



  const getStatusColor = (status: Paket["status"]) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "ON_PROGRESS":
        return "warning";
      case "PUBLISHED":
        return "info";
      case "DRAFT":
        return "light";
      case "CANCELLED":
        return "error";
      default:
        return "light";
    }
  };

  const getStatusLabel = (status: Paket["status"]) => {
    switch (status) {
      case "DRAFT":
        return "Perencanaan";
      case "PUBLISHED":
        return "Dipublikasi";
      case "ON_PROGRESS":
        return "Proses";
      case "COMPLETED":
        return "Selesai";
      case "CANCELLED":
        return "Batal";
      default:
        return status;
    }
  };

  const metodeOptions = [
    { value: "E_PURCHASING", label: "E-Purchasing" },
    { value: "SWAKELOLA", label: "Swakelola" },
    { value: "TENDER", label: "Tender" },
    { value: "PENUNJUKAN_LANGSUNG", label: "Penunjukan Langsung" },
    { value: "SELEKSI", label: "Seleksi" },
  ];

  const statusOptions = [
    { value: "DRAFT", label: "Perencanaan" },
    { value: "PUBLISHED", label: "Dipublikasi" },
    { value: "ON_PROGRESS", label: "Proses" },
    { value: "COMPLETED", label: "Selesai" },
    { value: "CANCELLED", label: "Batal" },
  ];

  const jenisPaketOptions = [
    { value: "Konstruksi", label: "Konstruksi" },
    { value: "Barang", label: "Barang" },
    { value: "Jasa Konsultansi", label: "Jasa Konsultansi" },
    { value: "Jasa Lainnya", label: "Jasa Lainnya" },
  ];

  // Define table columns
  const columns: ColumnDef<Paket>[] = [
    {
      accessorKey: "kodePaket",
      header: "Kode Paket",
      cell: ({ row }) => (
        <span className="font-medium text-gray-800 dark:text-white/90">
          {row.original.kodePaket}
        </span>
      ),
    },
    {
      accessorKey: "namaPaket",
      header: "Nama Paket",
    },
    {
      accessorKey: "nilaiPaket",
      header: "Nilai",
      cell: ({ row }) => `Rp ${row.original.nilaiPaket.toLocaleString("id-ID")}`,
    },
    {
      accessorKey: "jenisPaket",
      header: "Jenis",
    },
    {
      accessorKey: "metodePengadaan",
      header: "Metode",
    },
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
      accessorKey: "tanggalBuat",
      header: "Tanggal",
      cell: ({ row }) => new Date(row.original.tanggalBuat).toLocaleDateString("id-ID"),
    },
    {
      accessorKey: "dokumen",
      header: "Dokumen",
      cell: ({ row }) => (
        <div className="space-y-1">
          <span className="text-xs">
            Dokumen: {row.original.dokumen?.length || 0} file
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
            onClick={() => handleEdit(row.original)}
            disabled={loading}
          >
            <PencilIcon className="size-5" />
          </button>
          <button
            className="text-green-600 hover:text-green-900 dark:text-green-400"
            onClick={() => handleUpload(row.original.id)}
            disabled={loading}
          >
            Upload
          </button>
          {user?.role === "ADMIN" && (
            <button
              className="text-red-600 hover:text-red-900 dark:text-red-400"
              onClick={() => handleDelete(row.original.id)}
              disabled={loading}
            >
              <TrashBinIcon className="size-5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageMeta
        title="Manajemen Paket - Sistem Pengawasan"
        description="Kelola paket pengadaan barang dan jasa"
      />
      <PageBreadcrumb pageTitle="Manajemen Paket" />

      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Daftar Paket Pengadaan
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola dan pantau semua paket pengadaan
            </p>
          </div>
          <Button
            size="md"
            variant="primary"
            startIcon={<PlusIcon />}
            onClick={openAddModal}
            disabled={loading}
          >
            Tambah Paket
          </Button>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : (
          <DataTable
            columns={columns}
            data={pakets}
            searchPlaceholder="Cari paket..."
          />
        )}
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        size="2xl"
        title={editingPaket ? "" : ""}
        showHeader={true}
      >
        {/* === WRAPPER: GRID UNTUK LAYOUT HEADER-BODY-FOOTER === */}
        <div className="flex flex-col h-[80vh]">
          {/* === HEADER (tetap di atas) === */}
          <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 pb-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {editingPaket ? "Edit Paket Pengadaan" : "Tambah Paket Pengadaan"}
            </h3>
          </div>

          {/* === BODY (scrollable) === */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Kode Paket *</Label>
                <Input
                  type="text"
                  value={formData.kodePaket}
                  onChange={(e) =>
                    setFormData({ ...formData, kodePaket: e.target.value })
                  }
                  placeholder="PKT-2024-XXX"
                  error={!!formErrors.kodePaket}
                  hint={formErrors.kodePaket}
                />
              </div>
              <div>
                <Label>Kode RUP</Label>
                <Input
                  type="text"
                  value={formData.kodeRUP}
                  onChange={(e) =>
                    setFormData({ ...formData, kodeRUP: e.target.value })
                  }
                  placeholder="RUP-2024-XXX"
                />
              </div>
              <div>
                <Label>Nilai Paket *</Label>
                <Input
                  type="text"
                  value={formData.nilaiPaket}
                  onChange={(e) =>
                    setFormData({ ...formData, nilaiPaket: e.target.value })
                  }
                  placeholder="Rp 0"
                  error={!!formErrors.nilaiPaket}
                  hint={formErrors.nilaiPaket}
                />
              </div>
            </div>

            <div>
              <Label>Nama Paket *</Label>
              <Input
                type="text"
                value={formData.namaPaket}
                onChange={(e) =>
                  setFormData({ ...formData, namaPaket: e.target.value })
                }
                placeholder="Masukkan nama paket"
                error={!!formErrors.namaPaket}
                hint={formErrors.namaPaket}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Jenis Paket *</Label>
                <Select
                  options={jenisPaketOptions}
                  placeholder="Pilih jenis paket"
                  onChange={(value) =>
                    setFormData({ ...formData, jenisPaket: value })
                  }
                  defaultValue={formData.jenisPaket}
                />
                {formErrors.jenisPaket && (
                  <p className="mt-1 text-xs text-error-500">
                    {formErrors.jenisPaket}
                  </p>
                )}
              </div>

              <div>
                <Label>Metode Pengadaan *</Label>
                <Select
                  options={metodeOptions}
                  placeholder="Pilih metode"
                  onChange={(value) =>
                    setFormData({ ...formData, metodePengadaan: value })
                  }
                  defaultValue={formData.metodePengadaan}
                />
                {formErrors.metodePengadaan && (
                  <p className="mt-1 text-xs text-error-500">
                    {formErrors.metodePengadaan}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <Input
                  type="number"
                  value={formData.lamaProyek}
                  placeholder="Otomatis dihitung"
                  disabled
                />
              </div>
            </div>

            <div>
              <Label>Dokumen Kontrak</Label>
              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setFormData({ ...formData, dokumenKontrak: file });
                }}
                accept=".pdf,.doc,.docx"
                className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              />
              <p className="mt-1 text-xs text-gray-500">
                Format: PDF, DOC, DOCX (Max 10MB)
              </p>
            </div>

            {editingPaket && (
              <div>
                <Label>Upload Dokumen Kontrak</Label>
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setFormData({ ...formData, dokumenKontrak: file });
                  }}
                  accept=".pdf,.doc,.docx"
                  className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Upload dokumen kontrak baru jika perlu (Max 10MB)
                </p>
              </div>
            )}

            {editingPaket && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Status</Label>
                  <Select
                    options={statusOptions}
                    placeholder="Pilih status"
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        status: value as Paket["status"],
                      })
                    }
                    value={formData.status}
                  />
                </div>
              </div>
            )}

            {!editingPaket && (
              <div className="border-t pt-4">
                <h4 className="text-lg font-medium text-gray-800 dark:text-white/90 mb-4">
                  Upload Dokumen Paket (Optional)
                </h4>
                <div className="space-y-4">
                  {Object.keys(formDokumen).map((key) => (
                    <div key={key}>
                      <Label>{key}</Label>
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file)
                            setFormDokumen({ ...formDokumen, [key]: file });
                        }}
                        accept=".pdf,.doc,.docx,.xlsx,.csv"
                        className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Format: PDF, DOC, DOCX, XLSX, CSV (Max 10MB per file)
                </p>
              </div>
            )}
          </div>

          {/* === FOOTER (tetap di bawah) === */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 flex justify-end gap-3 bg-white dark:bg-gray-900">
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
              {loading ? "Menyimpan..." : "Simpan Paket"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Upload Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        size="md"
        title="Upload Dokumen Paket"
        showHeader={true}
      >
        <div className="space-y-4">
          <div>
            <Label>Jenis Dokumen</Label>
            <Select
              options={[
                { value: "KAK/RAB", label: "KAK/RAB" },
                { value: "Spesifikasi Teknis", label: "Spesifikasi Teknis" },
                { value: "Kontrak", label: "Kontrak" },
                { value: "Timeline", label: "Timeline" },
                { value: "Syarat Khusus", label: "Syarat Khusus" },
                { value: "Lainnya", label: "Lainnya" },
              ]}
              placeholder="Pilih jenis dokumen"
              onChange={(value) =>
                setUploadFormData({ ...uploadFormData, jenisDokumen: value })
              }
            />
          </div>

          <div>
            <Label>File Dokumen</Label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xlsx,.csv"
              className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
            />
            <p className="mt-1 text-xs text-gray-500">
              Format: PDF, DOC, DOCX, XLSX, CSV (Max 10MB)
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setUploadModalOpen(false)}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={handleFileUpload}
            disabled={loading}
          >
            {loading ? "Uploading..." : "Upload Dokumen"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
