import { useState, useEffect } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import Badge from "../components/ui/badge/Badge";
import { PlusIcon, DownloadIcon, PencilIcon, TrashBinIcon } from "../icons";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import Select from "../components/form/Select";
import { useToast } from "../hooks/useToast";


import { DataTable } from "../components/common/DataTable";
import { ColumnDef } from "@tanstack/react-table";

const API_BASE_URL = 'http://localhost:3001';

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

export default function DokumenArsip() {
  const [dokumens, setDokumens] = useState<Dokumen[]>([]);
  const [pakets, setPakets] = useState<Paket[]>([]);
  const [eligiblePakets, setEligiblePakets] = useState<Paket[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterJenis, setFilterJenis] = useState("all");
  const [editingDokumen, setEditingDokumen] = useState<Dokumen | null>(null);
  const [deletingDokumen, setDeletingDokumen] = useState<Dokumen | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const [formData, setFormData] = useState<DokumenFormData>({
    namaDokumen: "",
    jenisDokumen: "",
    paketId: "",
    file: null,
  });
  const [formErrors, setFormErrors] = useState<Partial<DokumenFormData>>({});

  const { isOpen, openModal, closeModal } = useModal();
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  useEffect(() => {
    fetchDokumens();
    fetchPakets();
  }, []);

  useEffect(() => {
    // Filter paket yang eligible untuk upload dokumen
    // Hanya paket dengan status ON_PROGRESS atau PUBLISHED
    const eligible = pakets.filter(
      (paket) => paket.status === 'ON_PROGRESS' || paket.status === 'PUBLISHED'
    );
    setEligiblePakets(eligible);
  }, [pakets]);

  const fetchDokumens = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/dokumen`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setDokumens(data);
      }
    } catch (error) {
      console.error('Error fetching dokumens:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPakets = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/paket`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setPakets(data);
      }
    } catch (error) {
      console.error('Error fetching pakets:', error);
    }
  };

  const onSubmit = async (data: DokumenFormData) => {
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('paketId', data.paketId);
      formDataToSend.append('jenisDokumen', data.jenisDokumen);
      formDataToSend.append('namaDokumen', data.namaDokumen);

      if (data.file) {
        formDataToSend.append('file', data.file);
      }

      let response;
      if (editingDokumen && !data.file) {
        // Update without file
        response = await fetch(`${API_BASE_URL}/api/dokumen/${editingDokumen.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            namaDokumen: data.namaDokumen,
            jenisDokumen: data.jenisDokumen,
            paketId: data.paketId,
          }),
        });
      } else {
        // Upload new or update with file
        response = await fetch(`${API_BASE_URL}/api/dokumen/upload`, {
          method: 'POST',
          credentials: 'include',
          body: formDataToSend,
        });
      }

      if (response.ok) {
        await fetchDokumens();
        closeModal();
        resetForm();
        setEditingDokumen(null);
        showSuccessToast('Dokumen berhasil disimpan!');
      } else {
        const errorData = await response.json();
        showErrorToast('Gagal menyimpan dokumen: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving dokumen:', error);
      showErrorToast('Terjadi kesalahan saat menyimpan dokumen');
    } finally {
      setLoading(false);
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

  const handleDelete = (dokumen: Dokumen) => {
    setDeletingDokumen(dokumen);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingDokumen) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/dokumen/${deletingDokumen.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await fetchDokumens();
        showSuccessToast('Dokumen berhasil dihapus!');
      } else {
        const errorData = await response.json();
        showErrorToast('Gagal menghapus dokumen: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting dokumen:', error);
      showErrorToast('Terjadi kesalahan saat menghapus dokumen');
    } finally {
      setLoading(false);
      setIsConfirmModalOpen(false);
      setDeletingDokumen(null);
    }
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const handleDownload = (dokumen: Dokumen) => {
    // Implement download logic
    window.open(`${API_BASE_URL}${dokumen.filePath}`, '_blank');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setFormErrors({ ...formErrors, file: 'Ukuran file maksimal 10MB' });
        return;
      }
      
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'image/jpeg',
        'image/png'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setFormErrors({ ...formErrors, file: 'Format file tidak didukung' });
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
      alert('Tidak ada paket yang eligible untuk upload dokumen. Paket harus berstatus "Pelaksanaan" atau "Dipublikasi".');
      return;
    }
    resetForm();
    openModal();
  };

  const filteredDokumens = dokumens.filter((doc) => {
    const matchFilter =
      filterJenis === "all" || doc.jenisDokumen === filterJenis;
    return matchFilter;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const columns: ColumnDef<Dokumen>[] = [
    {
      accessorKey: 'namaDokumen',
      header: 'Nama Dokumen',
      cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span>
    },
    {
      accessorKey: 'jenisDokumen',
      header: 'Jenis Dokumen',
      cell: ({ getValue }) => <Badge size="sm" color="info">{getValue() as string}</Badge>
    },
    {
      accessorKey: 'paket',
      header: 'Paket',
      cell: ({ getValue }) => {
        const paket = getValue() as Dokumen['paket'];
        return (
          <div>
            <p className="font-medium">{paket?.kodePaket}</p>
            <p className="text-xs text-gray-500">{paket?.namaPaket}</p>
          </div>
        );
      }
    },
    {
      accessorKey: 'fileSize',
      header: 'Ukuran File',
      cell: ({ getValue }) => formatFileSize(getValue() as number)
    },
    {
      accessorKey: 'uploadedBy',
      header: 'Upload By'
    },
    {
      accessorKey: 'uploadedAt',
      header: 'Upload Date',
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString('id-ID')
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
            onClick={() => handleDownload(row.original)}
            disabled={loading}
            title="Download"
          >
            <DownloadIcon className="size-5" />
          </button>
          <button
            className="text-green-600 hover:text-green-900 dark:text-green-400"
            onClick={() => handleEdit(row.original)}
            disabled={loading}
            title="Edit"
          >
            <PencilIcon className="size-5" />
          </button>
          <button
            className="text-red-600 hover:text-red-900 dark:text-red-400"
            onClick={() => handleDelete(row.original)}
            disabled={loading}
            title="Delete"
          >
            <TrashBinIcon className="size-5" />
          </button>
        </div>
      )
    }
  ];

  const jenisDokumenOptions = [
    { value: "TOR", label: "TOR (Terms of Reference)" },
    { value: "HPS", label: "HPS (Harga Perkiraan Sendiri)" },
    { value: "Kontrak", label: "Kontrak" },
    { value: "BA Serah Terima", label: "BA Serah Terima" },
    { value: "Laporan Kemajuan", label: "Laporan Kemajuan" },
    { value: "Laporan Akhir", label: "Laporan Akhir" },
    { value: "KAK/RAB", label: "KAK/RAB" },
    { value: "Spesifikasi Teknis", label: "Spesifikasi Teknis" },
    { value: "Timeline", label: "Timeline Pekerjaan" },
    { value: "Syarat Khusus", label: "Syarat Khusus" },
    { value: "JAMINAN_UANG_MUKA", label: "Jaminan Uang Muka" },
    { value: "JAMINAN_PELAKSANAAN", label: "Jaminan Pelaksanaan" },
    { value: "JAMINAN_PEMELIHARAAN", label: "Jaminan Pemeliharaan" },
  ];

  const paketOptions = eligiblePakets.map(paket => ({
    value: paket.id,
    label: `${paket.kodePaket} - ${paket.namaPaket} (${paket.status})`
  }));

  // Stats Cards
  const stats = [
    {
      label: "Total Dokumen",
      value: dokumens.length,
      color: "text-brand-500",
    },
    {
      label: "Total Ukuran",
      value: dokumens.length > 0 ? formatFileSize(dokumens.reduce((sum, d) => sum + d.fileSize, 0)) : "0 Bytes",
      color: "text-blue-light-500",
    },
    {
      label: "Paket Eligible",
      value: eligiblePakets.length,
      color: "text-success-500",
    },
  ];

  return (
    <>
      <PageMeta
        title="Dokumen & Arsip - Sistem Pengawasan"
        description="Kelola dokumen pengadaan"
      />
      <PageBreadcrumb pageTitle="Dokumen & Arsip" />

      <div className="space-y-6">
        {/* Info Alert */}
        {eligiblePakets.length === 0 && (
          <div className="rounded-lg border border-warning-300 bg-warning-50 p-4 dark:border-warning-800 dark:bg-warning-900/20">
            <p className="text-sm text-warning-800 dark:text-warning-200">
              ⚠️ Tidak ada paket yang eligible untuk upload dokumen. Paket harus berstatus "Pelaksanaan" atau "Dipublikasi".
            </p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            disabled={loading || eligiblePakets.length === 0}
          >
            Upload Dokumen
          </Button>
        </div>

        {/* Filter */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <select
                className="h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
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
                <option value="JAMINAN_PEMELIHARAAN">Jaminan Pemeliharaan</option>
              </select>
            </div>
          </div>
        </div>

        {/* DataTable */}
        <DataTable
          columns={columns}
          data={filteredDokumens}
          loading={loading}
        />
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        size="2xl"
        title={editingDokumen ? "" : ""}
        showHeader={true}
      >
        <div className="flex flex-col max-h-[80vh] overflow-y-auto px-6 py-4 space-y-4">
          <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            {editingDokumen ? 'Edit Dokumen' : 'Upload Dokumen'}
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
                options={jenisDokumenOptions}
                placeholder="Pilih jenis dokumen"
                onChange={(value) =>
                  setFormData({ ...formData, jenisDokumen: value })
                }
                value={formData.jenisDokumen}
              />
              {formErrors.jenisDokumen && (
                <p className="mt-1 text-xs text-error-500">{formErrors.jenisDokumen}</p>
              )}
            </div>

            <div>
              <Label>Paket *</Label>
              <Select
                options={paketOptions}
                placeholder="Pilih paket"
                onChange={(value) =>
                  setFormData({ ...formData, paketId: value })
                }
                value={formData.paketId}
              />
              {formErrors.paketId && (
                <p className="mt-1 text-xs text-error-500">{formErrors.paketId}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Hanya paket dengan status "Pelaksanaan" atau "Dipublikasi" yang ditampilkan
              </p>
            </div>

            <div>
              <Label>File Dokumen {!editingDokumen && '*'}</Label>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xlsx,.csv,.jpg,.jpeg,.png"
                className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              />
              {formErrors.file && (
                <p className="mt-1 text-xs text-error-500">{formErrors.file}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Format: PDF, DOC, DOCX, XLSX, CSV, JPG, PNG (Max 10MB)
              </p>
              {editingDokumen && (
                <p className="mt-1 text-xs text-warning-600">
                  Kosongkan jika tidak ingin mengubah file
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={closeModal} disabled={loading}>
              Batal
            </Button>
            <Button size="sm" variant="primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Menyimpan...' : editingDokumen ? 'Update' : 'Upload'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title="Hapus Dokumen"
        message={`Apakah Anda yakin ingin menghapus dokumen "${deletingDokumen?.namaDokumen}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        loading={loading}
      />
    </>
  );
}
