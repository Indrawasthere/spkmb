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
import BarChartOne from "../components/charts/bar/BarChartOne";
import LineChartOne from "../components/charts/line/LineChartOne";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Monitoring {
  id: string;
  paketId: string;
  jenisMonitoring: string;
  periode: string;
  status: "ON_TRACK" | "DELAYED" | "CRITICAL" | "COMPLETED";
  progress: number;
  issues: string | null;
  rekomendasi: string | null;
  tanggalMonitoring: string;
  monitoredBy: string;
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
  status: string;
  laporan?: LaporanItwasda[];
}

interface LaporanItwasda {
  id: string;
  paketId: string;
  status: "BARU" | "PROSES" | "SELESAI" | "DITUNDA";
}

interface FormErrors {
  paketId?: string;
  jenisMonitoring?: string;
  periode?: string;
  status?: string;
  progress?: string;
  tanggalMonitoring?: string;
}

export default function MonitoringEvaluasi() {
  const [monitorings, setMonitorings] = useState<Monitoring[]>([]);
  const [pakets, setPakets] = useState<Paket[]>([]);
  const [laporanItwasda, setLaporanItwasda] = useState<LaporanItwasda[]>([]);
  const [eligiblePakets, setEligiblePakets] = useState<Paket[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formData, setFormData] = useState({
    paketId: "",
    jenisMonitoring: "",
    periode: "",
    status: "ON_TRACK" as Monitoring["status"],
    progress: "0",
    issues: "",
    rekomendasi: "",
    tanggalMonitoring: new Date().toISOString().split('T')[0],
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [editingMonitoring, setEditingMonitoring] = useState<Monitoring | null>(null);

  const { isOpen, openModal, closeModal } = useModal();

  useEffect(() => {
    fetchMonitorings();
    fetchPakets();
    fetchLaporanItwasda();
  }, []);

  useEffect(() => {
    // Filter paket yang eligible untuk monitoring
    // Hanya paket yang sudah punya laporan Itwasda dengan status SELESAI
    const eligible = pakets.filter((paket) => {
      const hasCompletedLaporan = laporanItwasda.some(
        l => l.paketId === paket.id && l.status === 'SELESAI'
      );
      return hasCompletedLaporan;
    });
    setEligiblePakets(eligible);
  }, [pakets, laporanItwasda]);

  const fetchMonitorings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/monitoring`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setMonitorings(data);
      }
    } catch (error) {
      console.error('Error fetching monitorings:', error);
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

  const fetchLaporanItwasda = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/laporan-itwasda`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setLaporanItwasda(data);
      }
    } catch (error) {
      console.error('Error fetching laporan itwasda:', error);
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!formData.paketId) {
      errors.paketId = "Paket wajib dipilih";
    }
    
    if (!formData.jenisMonitoring) {
      errors.jenisMonitoring = "Jenis monitoring wajib dipilih";
    }
    
    if (!formData.periode.trim()) {
      errors.periode = "Periode wajib diisi";
    }
    
    if (!formData.status) {
      errors.status = "Status wajib dipilih";
    }
    
    const progressValue = parseInt(formData.progress);
    if (isNaN(progressValue) || progressValue < 0 || progressValue > 100) {
      errors.progress = "Progress harus antara 0-100";
    }
    
    if (!formData.tanggalMonitoring) {
      errors.tanggalMonitoring = "Tanggal monitoring wajib diisi";
    }

    // Validate paket eligibility
    if (formData.paketId) {
      const hasCompletedLaporan = laporanItwasda.some(
        l => l.paketId === formData.paketId && l.status === 'SELESAI'
      );
      if (!hasCompletedLaporan) {
        errors.paketId = "Monitoring hanya bisa dibuat untuk paket yang laporan Itwasda-nya sudah selesai";
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
      const monitoringData = {
        paketId: formData.paketId,
        jenisMonitoring: formData.jenisMonitoring,
        periode: formData.periode.trim(),
        status: formData.status,
        progress: parseInt(formData.progress),
        issues: formData.issues.trim() || null,
        rekomendasi: formData.rekomendasi.trim() || null,
        tanggalMonitoring: new Date(formData.tanggalMonitoring),
      };

      let response;
      if (editingMonitoring) {
        response = await fetch(`${API_BASE_URL}/api/monitoring/${editingMonitoring.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(monitoringData),
        });
      } else {
        response = await fetch(`${API_BASE_URL}/api/monitoring`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(monitoringData),
        });
      }

      if (response.ok) {
        await fetchMonitorings();
        closeModal();
        resetForm();
        alert('Monitoring berhasil disimpan!');
      } else {
        const errorData = await response.json();
        alert('Gagal menyimpan monitoring: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving monitoring:', error);
      alert('Terjadi kesalahan saat menyimpan monitoring');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (monitoring: Monitoring) => {
    setEditingMonitoring(monitoring);
    setFormData({
      paketId: monitoring.paketId,
      jenisMonitoring: monitoring.jenisMonitoring,
      periode: monitoring.periode,
      status: monitoring.status,
      progress: monitoring.progress.toString(),
      issues: monitoring.issues || "",
      rekomendasi: monitoring.rekomendasi || "",
      tanggalMonitoring: new Date(monitoring.tanggalMonitoring).toISOString().split('T')[0],
    });
    setFormErrors({});
    openModal();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus monitoring ini?')) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/monitoring/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        await fetchMonitorings();
        alert('Monitoring berhasil dihapus!');
      } else {
        const errorData = await response.json();
        alert('Gagal menghapus monitoring: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting monitoring:', error);
      alert('Terjadi kesalahan saat menghapus monitoring');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = (id: string) => {
    alert(`Upload dokumen untuk monitoring ${id}`);
  };

  const resetForm = () => {
    setFormData({
      paketId: "",
      jenisMonitoring: "",
      periode: "",
      status: "ON_TRACK",
      progress: "0",
      issues: "",
      rekomendasi: "",
      tanggalMonitoring: new Date().toISOString().split('T')[0],
    });
    setFormErrors({});
    setEditingMonitoring(null);
  };

  const openAddModal = () => {
    if (eligiblePakets.length === 0) {
      alert('Tidak ada paket yang eligible untuk monitoring. Paket harus memiliki laporan Itwasda dengan status "Selesai".');
      return;
    }
    resetForm();
    openModal();
  };

  const filteredMonitorings = monitorings.filter((m) => {
    const matchSearch =
      m.paket?.kodePaket.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.paket?.namaPaket.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.jenisMonitoring.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = filterStatus === "all" || m.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const getStatusColor = (status: Monitoring["status"]) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "ON_TRACK":
        return "info";
      case "DELAYED":
        return "warning";
      case "CRITICAL":
        return "error";
      default:
        return "light";
    }
  };

  const jenisMonitoringOptions = [
    { value: "Kinerja", label: "Monitoring Kinerja" },
    { value: "Keuangan", label: "Monitoring Keuangan" },
    { value: "Teknis", label: "Monitoring Teknis" },
    { value: "Waktu", label: "Monitoring Waktu" },
    { value: "Kualitas", label: "Monitoring Kualitas" },
  ];

  const statusOptions = [
    { value: "ON_TRACK", label: "On Track" },
    { value: "DELAYED", label: "Delayed" },
    { value: "CRITICAL", label: "Critical" },
    { value: "COMPLETED", label: "Completed" },
  ];

  const paketOptions = eligiblePakets.map(paket => ({
    value: paket.id,
    label: `${paket.kodePaket} - ${paket.namaPaket}`
  }));

  // Stats Cards
  const stats = [
    {
      label: "Total Monitoring",
      value: monitorings.length,
      color: "text-brand-500",
    },
    {
      label: "On Track",
      value: monitorings.filter((m) => m.status === "ON_TRACK").length,
      color: "text-info-500",
    },
    {
      label: "Delayed",
      value: monitorings.filter((m) => m.status === "DELAYED").length,
      color: "text-warning-500",
    },
    {
      label: "Critical",
      value: monitorings.filter((m) => m.status === "CRITICAL").length,
      color: "text-error-500",
    },
  ];

  return (
    <>
      <PageMeta
        title="SIPAKAT-PBJ - Monitoring & Evaluasi"
        description="Pantau KPI dan evaluasi kinerja pengadaan"
      />
      <PageBreadcrumb pageTitle="Monitoring & Evaluasi" />

      <div className="space-y-6">
        {/* Info Alert */}
        {eligiblePakets.length === 0 && (
          <div className="rounded-lg border border-warning-300 bg-warning-50 p-4 dark:border-warning-800 dark:bg-warning-900/20">
            <p className="text-sm text-warning-800 dark:text-warning-200">
              ⚠️ Tidak ada paket yang eligible untuk monitoring. Paket harus memiliki laporan Itwasda dengan status "Selesai".
            </p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </p>
                  <p className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Progress Monitoring per Paket
            </h3>
            <BarChartOne />
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Tren Monitoring Bulanan
            </h3>
            <LineChartOne />
          </div>
        </div>

        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Daftar Monitoring & Evaluasi
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Pantau progress dan evaluasi kinerja paket
            </p>
          </div>
          <Button
            size="md"
            variant="primary"
            startIcon={<PlusIcon />}
            onClick={openAddModal}
            disabled={loading || eligiblePakets.length === 0}
          >
            Tambah Monitoring
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Input
              type="text"
              placeholder="Cari monitoring..."
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
                <option value="ON_TRACK">On Track</option>
                <option value="DELAYED">Delayed</option>
                <option value="CRITICAL">Critical</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : filteredMonitorings.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Tidak ada monitoring ditemukan
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Paket
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Jenis
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Periode
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Progress
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Tanggal
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredMonitorings.map((m) => (
                    <tr
                      key={m.id}
                      className="hover:bg-gray-50 dark:hover:bg-white/5"
                    >
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white/90">
                            {m.paket?.kodePaket}
                          </p>
                          <p className="text-xs text-gray-500">{m.paket?.namaPaket}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                        {m.jenisMonitoring}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                        {m.periode}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                            <div
                              className="bg-brand-600 h-2 rounded-full"
                              style={{ width: `${m.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-400">
                            {m.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge size="sm" color={getStatusColor(m.status)}>
                          {m.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                        {new Date(m.tanggalMonitoring).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            className="text-green-600 hover:text-green-900 dark:text-green-400"
                            onClick={() => handleUpload(m.id)}
                            disabled={loading}
                            title="Upload"
                          >
                            Upload
                          </button>
                          <button
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                            onClick={() => handleEdit(m)}
                            disabled={loading}
                            title="Edit"
                          >
                            <PencilIcon className="size-5" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900 dark:text-red-400"
                            onClick={() => handleDelete(m.id)}
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
        title={editingMonitoring ? "" : ""}
        showHeader={true}
      >
        <div className="p-6">
          <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            {editingMonitoring ? '' : ''}
          </h3>

          <div className="space-y-4">
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
                Hanya paket dengan laporan Itwasda selesai yang ditampilkan
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Jenis Monitoring *</Label>
                <Select
                  options={jenisMonitoringOptions}
                  placeholder="Pilih jenis"
                  onChange={(value) =>
                    setFormData({ ...formData, jenisMonitoring: value })
                  }
                  defaultValue={formData.jenisMonitoring}
                />
                {formErrors.jenisMonitoring && (
                  <p className="mt-1 text-xs text-error-500">{formErrors.jenisMonitoring}</p>
                )}
              </div>
              <div>
                <Label>Periode *</Label>
                <Input
                  type="text"
                  value={formData.periode}
                  onChange={(e) =>
                    setFormData({ ...formData, periode: e.target.value })
                  }
                  placeholder="Contoh: Q1 2024"
                  error={!!formErrors.periode}
                  hint={formErrors.periode}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status *</Label>
                <Select
                  options={statusOptions}
                  placeholder="Pilih status"
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      status: value as Monitoring["status"],
                    })
                  }
                  defaultValue={formData.status}
                />
                {formErrors.status && (
                  <p className="mt-1 text-xs text-error-500">{formErrors.status}</p>
                )}
              </div>
              <div>
                <Label>Progress (%) *</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) =>
                    setFormData({ ...formData, progress: e.target.value })
                  }
                  placeholder="0-100"
                  error={!!formErrors.progress}
                  hint={formErrors.progress}
                />
              </div>
            </div>

            <div>
              <Label>Tanggal Monitoring *</Label>
              <Input
                type="date"
                value={formData.tanggalMonitoring}
                onChange={(e) =>
                  setFormData({ ...formData, tanggalMonitoring: e.target.value })
                }
                error={!!formErrors.tanggalMonitoring}
                hint={formErrors.tanggalMonitoring}
              />
            </div>

            <div>
              <Label>Issues (Optional)</Label>
              <TextArea
                rows={3}
                value={formData.issues}
                onChange={(value) =>
                  setFormData({ ...formData, issues: value })
                }
                placeholder="Jelaskan issues atau kendala yang ditemukan..."
              />
            </div>

            <div>
              <Label>Rekomendasi (Optional)</Label>
              <TextArea
                rows={3}
                value={formData.rekomendasi}
                onChange={(value) =>
                  setFormData({ ...formData, rekomendasi: value })
                }
                placeholder="Berikan rekomendasi untuk perbaikan..."
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={closeModal} disabled={loading}>
              Batal
            </Button>
            <Button size="sm" variant="primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Monitoring'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}