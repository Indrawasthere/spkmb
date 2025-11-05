import { useState, useEffect } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import Badge from "../components/ui/badge/Badge";
import { PlusIcon, DownloadIcon, PencilIcon, TrashBinIcon } from "../icons";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import Select from "../components/form/Select";

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
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterJenis, setFilterJenis] = useState("all");
  const [formData, setFormData] = useState({
    namaDokumen: "",
    jenisDokumen: "",
    paketId: "",
    file: null as File | null,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [editingDokumen, setEditingDokumen] = useState<Dokumen | null>(null);

  const { isOpen, openModal, closeModal } = useModal();

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

  // Form validation
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!formData.namaDokumen.trim()) {
      errors.namaDokumen = "Nama dokumen wajib diisi";
    }
    
    if (!formData.jenisDokumen) {
      errors.jenisDokumen = "Jenis dokumen wajib dipilih";
    }
    
    if (!formData.paketId) {
      errors.paketId = "Paket wajib dipilih";
    }
    
    if (!editingDokumen && !formData.file) {
      errors.file = "File dokumen wajib diupload";
    }

    // Validate paket status
    if (formData.paketId) {
      const selectedPaket = pakets.find(p => p.id === formData.paketId);
      if (selectedPaket && selectedPaket.status !== 'ON_PROGRESS' && selectedPaket.status !== 'PUBLISHED') {
        errors.paketId = "Dokumen hanya bisa diupload untuk paket dengan status 'Pelaksanaan' atau 'Dipublikasi'";
      }
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
      const formDataToSend = new FormData();
      formDataToSend.append('paketId', formData.paketId);
      formDataToSend.append('jenisDokumen', formData.jenisDokumen);
      formDataToSend.append('namaDokumen', formData.namaDokumen);
      
      if (formData.file) {
        formDataToSend.append('file', formData.file);
      }

      let response;
      if (editingDokumen && !formData.file) {
        // Update without file
        response = await fetch(`${API_BASE_URL}/api/dokumen/${editingDokumen.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            namaDokumen: formData.namaDokumen,
            jenisDokumen: formData.jenisDokumen,
            paketId: formData.paketId,
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
        alert('Dokumen berhasil disimpan!');
      } else {
        const errorData = await response.json();
        alert('Gagal menyimpan dokumen: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving dokumen:', error);
      alert('Terjadi kesalahan saat menyimpan dokumen');
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
    setFormErrors({});
    openModal();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus dokumen ini?')) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/dokumen/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        await fetchDokumens();
        alert('Dokumen berhasil dihapus!');
      } else {
        const errorData = await response.json();
        alert('Gagal menghapus dokumen: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting dokumen:', error);
      alert('Terjadi kesalahan saat menghapus dokumen');
    } finally {
      setLoading(false);
    }
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
    const matchSearch =
      doc.namaDokumen.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.paket?.kodePaket.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.paket?.namaPaket.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter =
      filterJenis === "all" || doc.jenisDokumen === filterJenis;
    return matchSearch && matchFilter;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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

        {/* Search and Filter */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Input
              type="text"
              placeholder="Cari dokumen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-96"
            />
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

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : filteredDokumens.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Tidak ada dokumen ditemukan
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Nama Dokumen
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Jenis Dokumen
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Paket
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Ukuran File
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Upload By
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Upload Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredDokumens.map((doc) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-gray-50 dark:hover:bg-white/5"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                        {doc.namaDokumen}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                        <Badge size="sm" color="info">
                          {doc.jenisDokumen}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                        <div>
                          <p className="font-medium">{doc.paket?.kodePaket}</p>
                          <p className="text-xs text-gray-500">{doc.paket?.namaPaket}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                        {formatFileSize(doc.fileSize)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                        {doc.uploadedBy}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                        {new Date(doc.uploadedAt).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                            onClick={() => handleDownload(doc)}
                            disabled={loading}
                            title="Download"
                          >
                            <DownloadIcon className="size-5" />
                          </button>
                          <button
                            className="text-green-600 hover:text-green-900 dark:text-green-400"
                            onClick={() => handleEdit(doc)}
                            disabled={loading}
                            title="Edit"
                          >
                            <PencilIcon className="size-5" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900 dark:text-red-400"
                            onClick={() => handleDelete(doc.id)}
                            disabled={loading}
                            title="Hapus"
                          >
                            <TrashBinIcon className="size-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
                defaultValue={formData.jenisDokumen}
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
                defaultValue={formData.paketId}
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
    </>
  );
}