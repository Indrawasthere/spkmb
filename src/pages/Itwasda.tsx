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
import TextArea from "../components/form/input/TextArea";
import Select from "../components/form/Select";

const API_BASE_URL = 'http://localhost:3001';

interface LaporanItwasda {
  id: string;
  nomorLaporan: string;
  paketId: string;
  jenisLaporan: string;
  deskripsi: string;
  tingkatKeparahan: "RENDAH" | "SEDANG" | "TINGGI" | "KRITIS";
  status: "BARU" | "PROSES" | "SELESAI" | "DITUNDA";
  tanggal: string;
  auditor: string;
  pic: string;
  filePath?: string;
  createdAt: string;
  updatedAt: string;
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
  laporan?: LaporanItwasda[];
}

interface FormErrors {
  nomorLaporan?: string;
  paketId?: string;
  jenisLaporan?: string;
  deskripsi?: string;
  tingkatKeparahan?: string;
  auditor?: string;
  pic?: string;
}

export default function Itwasda() {
  const [laporan, setLaporan] = useState<LaporanItwasda[]>([]);
  const [pakets, setPakets] = useState<Paket[]>([]);
  const [eligiblePakets, setEligiblePakets] = useState<Paket[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formData, setFormData] = useState({
    nomorLaporan: "",
    paketId: "",
    jenisLaporan: "",
    deskripsi: "",
    tingkatKeparahan: "" as LaporanItwasda["tingkatKeparahan"] | "",
    auditor: "",
    pic: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [editingLaporan, setEditingLaporan] = useState<LaporanItwasda | null>(null);

  const { isOpen, openModal, closeModal } = useModal();

  useEffect(() => {
    fetchLaporan();
    fetchPakets();
  }, []);

  useEffect(() => {
    // Filter paket yang eligible untuk laporan Itwasda
    // Hanya paket dengan status ON_PROGRESS atau PUBLISHED dan belum ada laporan
    const eligible = pakets.filter((paket) => {
      const hasStatus = paket.status === 'ON_PROGRESS' || paket.status === 'PUBLISHED';
      const hasNoReport = !laporan.some(l => l.paketId === paket.id);
      return hasStatus && hasNoReport;
    });
    setEligiblePakets(eligible);
  }, [pakets, laporan]);

  const fetchLaporan = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/laporan-itwasda`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setLaporan(data);
      }
    } catch (error) {
      console.error('Error fetching laporan:', error);
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
    
    if (!formData.nomorLaporan.trim()) {
      errors.nomorLaporan = "Nomor laporan wajib diisi";
    }
    
    if (!formData.paketId) {
      errors.paketId = "Paket wajib dipilih";
    }
    
    if (!formData.jenisLaporan) {
      errors.jenisLaporan = "Jenis laporan wajib dipilih";
    }
    
    if (!formData.deskripsi.trim()) {
      errors.deskripsi = "Deskripsi wajib diisi";
    }
    
    if (!formData.tingkatKeparahan) {
      errors.tingkatKeparahan = "Tingkat keparahan wajib dipilih";
    }
    
    if (!formData.auditor.trim()) {
      errors.auditor = "Nama auditor wajib diisi";
    }
    
    if (!formData.pic.trim()) {
      errors.pic = "PIC wajib diisi";
    }

    // Validate paket eligibility for new reports
    if (!editingLaporan && formData.paketId) {
      const selectedPaket = pakets.find(p => p.id === formData.paketId);
      if (selectedPaket) {
        if (selectedPaket.status !== 'ON_PROGRESS' && selectedPaket.status !== 'PUBLISHED') {
          errors.paketId = "Laporan hanya bisa dibuat untuk paket dengan status 'Pelaksanaan' atau 'Dipublikasi'";
        }
        
        const hasExistingReport = laporan.some(l => l.paketId === formData.paketId && l.id !== editingLaporan?.id);
        if (hasExistingReport) {
          errors.paketId = "Paket ini sudah memiliki laporan Itwasda";
        }
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
      const laporanData = {
        nomorLaporan: formData.nomorLaporan.trim(),
        paketId: formData.paketId,
        jenisLaporan: formData.jenisLaporan,
        deskripsi: formData.deskripsi.trim(),
        tingkatKeparahan: formData.tingkatKeparahan,
        auditor: formData.auditor.trim(),
        pic: formData.pic.trim(),
        tanggal: new Date(),
      };

      let response;
      if (editingLaporan) {
        response = await fetch(`${API_BASE_URL}/api/laporan-itwasda/${editingLaporan.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(laporanData),
        });
      } else {
        response = await fetch(`${API_BASE_URL}/api/laporan-itwasda`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(laporanData),
        });
      }

      if (response.ok) {
        // Update paket status to "Dalam Audit" after creating laporan
        if (!editingLaporan) {
          await updatePaketStatus(formData.paketId, 'ON_PROGRESS');
        }
        
        await fetchLaporan();
        await fetchPakets();
        closeModal();
        resetForm();
        alert('Laporan berhasil disimpan!');
      } else {
        const errorData = await response.json();
        alert('Gagal menyimpan laporan: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving laporan:', error);
      alert('Terjadi kesalahan saat menyimpan laporan');
    } finally {
      setLoading(false);
    }
  };

  const updatePaketStatus = async (paketId: string, status: string) => {
    try {
      const paket = pakets.find(p => p.id === paketId);
      if (!paket) return;

      await fetch(`${API_BASE_URL}/api/paket/${paketId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paket,
          status,
        }),
      });
    } catch (error) {
      console.error('Error updating paket status:', error);
    }
  };

  const handleEdit = (laporan: LaporanItwasda) => {
    setEditingLaporan(laporan);
    setFormData({
      nomorLaporan: laporan.nomorLaporan,
      paketId: laporan.paketId,
      jenisLaporan: laporan.jenisLaporan,
      deskripsi: laporan.deskripsi,
      tingkatKeparahan: laporan.tingkatKeparahan,
      auditor: laporan.auditor,
      pic: laporan.pic,
    });
    setFormErrors({});
    openModal();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus laporan ini?')) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/laporan-itwasda/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        await fetchLaporan();
        await fetchPakets();
        alert('Laporan berhasil dihapus!');
      } else {
        const errorData = await response.json();
        alert('Gagal menghapus laporan: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting laporan:', error);
      alert('Terjadi kesalahan saat menghapus laporan');
    } finally {
      setLoading(false);
    }
  };

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedLaporanId, setSelectedLaporanId] = useState<string>("");
  const [uploadFormData, setUploadFormData] = useState({
    file: null as File | null,
  });

  const handleUpload = (id: string) => {
    setSelectedLaporanId(id);
    setUploadModalOpen(true);
  };

  const handleFileUpload = async () => {
    if (!uploadFormData.file) {
      alert("Pilih file dokumen");
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("file", uploadFormData.file);

      const response = await fetch(`${API_BASE_URL}/api/laporan-itwasda/${selectedLaporanId}/upload`, {
        method: "PUT",
        credentials: "include",
        body: formDataToSend,
      });

      if (response.ok) {
        alert("Dokumen berhasil diupload");
        setUploadModalOpen(false);
        setUploadFormData({ file: null });
        fetchLaporan();
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

  const resetForm = () => {
    setFormData({
      nomorLaporan: "",
      paketId: "",
      jenisLaporan: "",
      deskripsi: "",
      tingkatKeparahan: "",
      auditor: "",
      pic: "",
    });
    setFormErrors({});
    setEditingLaporan(null);
  };

  const openAddModal = () => {
    if (eligiblePakets.length === 0) {
      alert('Tidak ada paket yang eligible untuk laporan Itwasda. Paket harus berstatus "Pelaksanaan" atau "Dipublikasi" dan belum memiliki laporan.');
      return;
    }
    resetForm();
    openModal();
  };

  const filteredLaporan = laporan.filter((l) => {
    const matchSearch =
      l.nomorLaporan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.paket?.kodePaket.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.paket?.namaPaket.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = filterStatus === "all" || l.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const getStatusColor = (status: LaporanItwasda["status"]) => {
    switch (status) {
      case "SELESAI":
        return "success";
      case "PROSES":
        return "warning";
      case "BARU":
        return "info";
      case "DITUNDA":
        return "error";
      default:
        return "light";
    }
  };

  const getKeparahanColor = (keparahan: LaporanItwasda["tingkatKeparahan"]) => {
    switch (keparahan) {
      case "KRITIS":
        return "error";
      case "TINGGI":
        return "warning";
      case "SEDANG":
        return "info";
      case "RENDAH":
        return "success";
      default:
        return "light";
    }
  };

  const jenisLaporanOptions = [
    { value: "Inspeksi Teknis", label: "Inspeksi Teknis" },
    { value: "Wawasan Audit", label: "Wawasan Audit" },
    { value: "Supervisi", label: "Supervisi" },
    { value: "Evaluasi", label: "Evaluasi" },
    { value: "Monitoring", label: "Monitoring" },
  ];

  const keparahanOptions = [
    { value: "RENDAH", label: "Rendah" },
    { value: "SEDANG", label: "Sedang" },
    { value: "TINGGI", label: "Tinggi" },
    { value: "KRITIS", label: "Kritis" },
  ];

  const paketOptions = eligiblePakets.map(paket => ({
    value: paket.id,
    label: `${paket.kodePaket} - ${paket.namaPaket}`
  }));

  // Stats Cards
  const stats = [
    {
      label: "Total Laporan",
      value: laporan.length,
      color: "text-brand-500",
    },
    {
      label: "Laporan Baru",
      value: laporan.filter((l) => l.status === "BARU").length,
      color: "text-blue-light-500",
    },
    {
      label: "Dalam Proses",
      value: laporan.filter((l) => l.status === "PROSES").length,
      color: "text-warning-500",
    },
    {
      label: "Selesai",
      value: laporan.filter((l) => l.status === "SELESAI").length,
      color: "text-success-500",
    },
  ];

  return (
    <>
      <PageMeta
        title="Itwasda | SIP-KPBJ"
        description="Halaman Itwasda untuk Pengawasan dan Audit"
      />
      <PageBreadcrumb pageTitle="Itwasda" />

      <div className="space-y-6">
        {/* Info Alert */}
        {eligiblePakets.length === 0 && (
          <div className="rounded-lg border border-warning-300 bg-warning-50 p-4 dark:border-warning-800 dark:bg-warning-900/20">
            <p className="text-sm text-warning-800 dark:text-warning-200">
              ⚠️ Tidak ada paket yang eligible untuk laporan Itwasda. Paket harus berstatus "Pelaksanaan" atau "Dipublikasi" dan belum memiliki laporan.
            </p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              Daftar Laporan Itwasda
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola laporan inspeksi teknis, wawasan audit, dan supervisi
            </p>
          </div>
          <Button
            size="md"
            variant="primary"
            startIcon={<PlusIcon />}
            onClick={openAddModal}
            disabled={loading || eligiblePakets.length === 0}
          >
            Tambah Laporan
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Input
              type="text"
              placeholder="Cari laporan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-96"
            />
            <div className="flex gap-2">
              <select
                className="h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
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
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : filteredLaporan.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Tidak ada laporan ditemukan
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      No. Laporan
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Paket
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Jenis
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Deskripsi
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Keparahan
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Auditor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      PIC
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredLaporan.map((l) => (
                    <tr
                      key={l.id}
                      className="hover:bg-gray-50 dark:hover:bg-white/5"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                        {l.nomorLaporan}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                        <div>
                          <p className="font-medium">{l.paket?.kodePaket}</p>
                          <p className="text-xs text-gray-500">{l.paket?.namaPaket}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                        {l.jenisLaporan}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400 max-w-xs truncate">
                        {l.deskripsi}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          size="sm"
                          color={getKeparahanColor(l.tingkatKeparahan)}
                        >
                          {l.tingkatKeparahan}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge size="sm" color={getStatusColor(l.status)}>
                          {l.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                        {l.auditor}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                        {l.pic}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            className="text-green-600 hover:text-green-900 dark:text-green-400"
                            onClick={() => handleUpload(l.id)}
                            disabled={loading}
                            title="Upload"
                          >
                            Upload
                          </button>
                          <button
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                            onClick={() => handleEdit(l)}
                            disabled={loading}
                            title="Edit"
                          >
                            <PencilIcon className="size-5" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900 dark:text-red-400"
                            onClick={() => handleDelete(l.id)}
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
        title={editingLaporan ? "" : ""}
        showHeader={true}
      >
        <div className="flex flex-col max-h-[80vh] overflow-y-auto px-6 py-4 space-y-4">
          <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            {editingLaporan ? 'Edit Laporan Itwasda' : 'Tambah Laporan Itwasda'}
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nomor Laporan *</Label>
                <Input
                  type="text"
                  value={formData.nomorLaporan}
                  onChange={(e) =>
                    setFormData({ ...formData, nomorLaporan: e.target.value })
                  }
                  placeholder="ITW-2024-XXX"
                  error={!!formErrors.nomorLaporan}
                  hint={formErrors.nomorLaporan}
                />
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
                  Hanya paket eligible yang ditampilkan
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Jenis Laporan *</Label>
                <Select
                  options={jenisLaporanOptions}
                  placeholder="Pilih jenis"
                  onChange={(value) =>
                    setFormData({ ...formData, jenisLaporan: value })
                  }
                  defaultValue={formData.jenisLaporan}
                />
                {formErrors.jenisLaporan && (
                  <p className="mt-1 text-xs text-error-500">{formErrors.jenisLaporan}</p>
                )}
              </div>
              <div>
                <Label>Tingkat Keparahan *</Label>
                <Select
                  options={keparahanOptions}
                  placeholder="Pilih keparahan"
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      tingkatKeparahan: value as LaporanItwasda["tingkatKeparahan"],
                    })
                  }
                  defaultValue={formData.tingkatKeparahan}
                />
                {formErrors.tingkatKeparahan && (
                  <p className="mt-1 text-xs text-error-500">{formErrors.tingkatKeparahan}</p>
                )}
              </div>
            </div>

            <div>
              <Label>Deskripsi Laporan *</Label>
              <TextArea
                rows={4}
                value={formData.deskripsi}
                onChange={(value) =>
                  setFormData({ ...formData, deskripsi: value })
                }
                placeholder="Jelaskan laporan inspeksi teknis secara detail..."
                error={!!formErrors.deskripsi}
                hint={formErrors.deskripsi}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Auditor *</Label>
                <Input
                  type="text"
                  value={formData.auditor}
                  onChange={(e) =>
                    setFormData({ ...formData, auditor: e.target.value })
                  }
                  placeholder="Nama auditor"
                  error={!!formErrors.auditor}
                  hint={formErrors.auditor}
                />
              </div>
              <div>
                <Label>PIC (Person in Charge) *</Label>
                <Input
                  type="text"
                  value={formData.pic}
                  onChange={(e) =>
                    setFormData({ ...formData, pic: e.target.value })
                  }
                  placeholder="Nama penanggung jawab"
                  error={!!formErrors.pic}
                  hint={formErrors.pic}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={closeModal} disabled={loading}>
              Batal
            </Button>
            <Button size="sm" variant="primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Laporan'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Upload Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        size="md"
        title="Upload Dokumen Laporan"
        showHeader={true}
      >
        <div className="px-6 py-4 space-y-4">
          <div>
            <Label>File Dokumen *</Label>
            <input
              type="file"
              onChange={(e) => setUploadFormData({ file: e.target.files?.[0] || null })}
              accept=".pdf,.doc,.docx,.xlsx,.csv,.jpg,.jpeg,.png"
              className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
            />
            <p className="mt-1 text-xs text-gray-500">
              Format: PDF, DOC, DOCX, XLSX, CSV, JPG, PNG (Max 10MB)
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={() => setUploadModalOpen(false)} disabled={loading}>
              Batal
            </Button>
            <Button size="sm" variant="primary" onClick={handleFileUpload} disabled={loading}>
              {loading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
