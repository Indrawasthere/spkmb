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
import TextArea from "../components/form/input/TextArea";
import Select from "../components/form/Select";
import { PlusIcon, DocumentDownloadIcon } from "../icons";
import { DetailsModal } from "../components/common/DetailsModal";
import { DataTable } from "../components/common/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { StatsCard } from "../components/common/StatsCard";
import { ActionButtons } from "../components/common/ActionButtons";
import { useToast } from "../hooks/useToast";
import {
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

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
  dokumen?: Dokumen[];
}

interface Dokumen {
  id: string;
  namaDokumen: string;
  filePath: string;
  uploadedAt: string;
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
  const [isLoading, setIsLoading] = useState(false);
  const [selectedData, setSelectedData] = useState<Monitoring | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [editingMonitoring, setEditingMonitoring] = useState<Monitoring | null>(null);
  const [deletingMonitoring, setDeletingMonitoring] = useState<Monitoring | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterJenis, setFilterJenis] = useState("all");

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

  const { isOpen, openModal, closeModal } = useModal();
  const { success, error, info, loading } = useToast();

  useEffect(() => {
    fetchMonitorings();
    fetchPakets();
    fetchLaporanItwasda();
  }, []);

  useEffect(() => {
    const eligible = pakets.filter((paket) => {
      const hasCompletedLaporan = laporanItwasda.some(
        l => l.paketId === paket.id && l.status === 'SELESAI'
      );
      return hasCompletedLaporan;
    });
    setEligiblePakets(eligible);
  }, [pakets, laporanItwasda]);

  const fetchMonitorings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/monitoring`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        // Pastikan data paket ada, jika tidak coba fetch ulang
        const monitoringsWithPaket = await Promise.all(
          data.map(async (monitoring: Monitoring) => {
            if (monitoring.paketId && !monitoring.paket) {
              try {
                const paketResponse = await fetch(
                  `${API_BASE_URL}/api/paket/${monitoring.paketId}`,
                  {
                    credentials: 'include',
                  }
                );
                if (paketResponse.ok) {
                  const paketData = await paketResponse.json();
                  return { ...monitoring, paket: paketData };
                }
              } catch (err) {
                console.warn(`Gagal fetch paket untuk monitoring ${monitoring.id}`);
              }
            }
            return monitoring;
          })
        );
        setMonitorings(monitoringsWithPaket);
      }
    } catch (err) {
      error('Gagal memuat data monitoring');
    } finally {
      setIsLoading(false);
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
    } catch (err) {
      error("Gagal memuat data paket");
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
    } catch (err) {
      error("Gagal memuat data laporan itwasda");
    }
  };

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

    setIsLoading(true);
    loading("Menyimpan monitoring...");

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
        setEditingMonitoring(null);
        success("Monitoring berhasil disimpan!");
      } else {
        const errorData = await response.json();
        error("Gagal menyimpan monitoring: " + (errorData.error || "Unknown error"));
      }
    } catch (err) {
      error("Terjadi kesalahan saat menyimpan monitoring");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (monitoring: Monitoring) => {
    // Cek apakah paket masih eligible
    const isPaketStillEligible = eligiblePakets.some((p) => p.id === monitoring.paketId);

    if (!isPaketStillEligible) {
      error(
        'Paket ini sudah tidak eligible untuk monitoring. Status laporan Itwasda mungkin berubah.'
      );
      return;
    }
    setEditingMonitoring(monitoring);
    setFormData({
      paketId: monitoring.paketId,
      jenisMonitoring: monitoring.jenisMonitoring,
      periode: monitoring.periode,
      status: monitoring.status,
      progress: monitoring.progress.toString(),
      issues: monitoring.issues || '',
      rekomendasi: monitoring.rekomendasi || '',
      tanggalMonitoring: new Date(monitoring.tanggalMonitoring).toISOString().split('T')[0],
    });
    setFormErrors({});
    openModal();
  };

  const handleViewDetails = (data: Monitoring) => {
    setSelectedData(data);
    setViewDetailsOpen(true);
  };

  const handleDelete = (monitoring: Monitoring) => {
    setDeletingMonitoring(monitoring);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingMonitoring) return;
    setIsLoading(true);
    loading("Menghapus monitoring...");

    try {
      const response = await fetch(`${API_BASE_URL}/api/monitoring/${deletingMonitoring.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await fetchMonitorings();
        success("Monitoring berhasil dihapus!");
      } else {
        const errorData = await response.json();
        error("Gagal menghapus: " + (errorData.error || "Unknown error"));
      }
    } catch (err) {
      error("Terjadi kesalahan saat menghapus monitoring");
    } finally {
      setIsLoading(false);
      setIsConfirmModalOpen(false);
      setDeletingMonitoring(null);
    }
  };

  const handleDownloadDocument = (filePath: string, fileName: string) => {
    window.open(`${API_BASE_URL}${filePath}`, "_blank");
    info("📄 Dokumen sedang diunduh...");
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
      error(
        'Tidak ada paket yang eligible untuk monitoring. Paket harus memiliki laporan Itwasda dengan status "Selesai".'
      );
      return;
    }
    resetForm();
    openModal();
  };

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

  const getStatusIcon = (status: Monitoring["status"]) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircleIcon className="w-4 h-4" />;
      case "ON_TRACK":
        return <ChartBarIcon className="w-4 h-4" />;
      case "DELAYED":
        return <ClockIcon className="w-4 h-4" />;
      case "CRITICAL":
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const ProgressBar = ({ progress }: { progress: number }) => (
    <div className="flex items-center gap-3">
      <div className="w-20 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
        <div
          className={`h-2 rounded-full ${
            progress >= 80 ? 'bg-success-500' :
            progress >= 60 ? 'bg-info-500' :
            progress >= 40 ? 'bg-warning-500' : 'bg-error-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[40px]">
        {progress}%
      </span>
    </div>
  );

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

  const paketOptions = (() => {
    const baseOptions = eligiblePakets.map((paket) => ({
      value: paket.id,
      label: `${paket.kodePaket} - ${paket.namaPaket}`,
    }));

    
    if (
      editingMonitoring &&
      editingMonitoring.paketId &&
      !eligiblePakets.some((p) => p.id === editingMonitoring.paketId)
    ) {
      // Coba cari paket dari semua pakets (bukan cuma eligible)
      const paketFromAll = pakets.find((p) => p.id === editingMonitoring.paketId);
      if (paketFromAll) {
        const currentPaketOption = {
          value: editingMonitoring.paketId,
          label: `${paketFromAll.kodePaket} - ${paketFromAll.namaPaket}`,
        };
        return [currentPaketOption, ...baseOptions];
      }
    }

    return baseOptions;
  })();

  const filteredMonitorings = monitorings.filter((m) => {
    const matchSearch =
      searchQuery === "" ||
      (m.paket?.kodePaket || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.paket?.namaPaket || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.jenisMonitoring.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.periode.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchStatus = filterStatus === "all" || m.status === filterStatus;
    const matchJenis = filterJenis === "all" || m.jenisMonitoring === filterJenis;
    
    return matchSearch && matchStatus && matchJenis;
  });

  // Stats Cards Data
  const stats = [
    {
      title: "Monitoring Terkait Paket",
      value: monitorings.filter(m => m.paketId).length,
      subtitle: "Monitoring dengan paket terkait",
      icon: ChartBarIcon,
      fromColor: "from-blue-500",
      toColor: "to-blue-600",
    },
    {
      title: "On Track",
      value: monitorings.filter((m) => m.status === "ON_TRACK").length,
      subtitle: "Monitoring berjalan sesuai rencana",
      icon: CheckCircleIcon,
      fromColor: "from-green-500",
      toColor: "to-green-600",
    },
    {
      title: "Perlu Perhatian",
      value: monitorings.filter((m) => m.status === "DELAYED" || m.status === "CRITICAL").length,
      subtitle: "Monitoring bermasalah",
      icon: ExclamationTriangleIcon,
      fromColor: "from-orange-500",
      toColor: "to-orange-600",
    },
    {
      title: "Selesai",
      value: monitorings.filter((m) => m.status === "COMPLETED").length,
      subtitle: "Monitoring telah selesai",
      icon: CheckCircleIcon,
      fromColor: "from-purple-500",
      toColor: "to-purple-600",
    },
  ];

  // Columns DataTable
  const columns: ColumnDef<Monitoring>[] = [
    {
      accessorKey: "paket",
      header: "Paket",
      cell: ({ getValue }) => {
        const paket = getValue() as Monitoring["paket"];
        return (
          <div>
            <p className="font-medium text-gray-800 dark:text-white/90">
              {paket?.kodePaket || "N/A"}
            </p>
            <p className="text-xs text-gray-500">{paket?.namaPaket || "Paket tidak tersedia"}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "jenisMonitoring",
      header: "Jenis Monitoring",
      cell: ({ getValue }) => (
        <Badge size="sm" color="info">
          {getValue() as string}
        </Badge>
      ),
    },
    {
      accessorKey: "periode",
      header: "Periode",
    },
    {
      accessorKey: "progress",
      header: "Progress",
      cell: ({ getValue }) => <ProgressBar progress={getValue() as number} />,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const status = getValue() as Monitoring["status"];
        return (
          <Badge 
            size="sm" 
            color={getStatusColor(status)}
            startIcon={getStatusIcon(status)}
          >
            {status.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      accessorKey: "tanggalMonitoring",
      header: "Tanggal Monitoring",
      cell: ({ getValue }) =>
        new Date(getValue() as string).toLocaleDateString("id-ID"),
    },
    {
      accessorKey: "monitoredBy",
      header: "Monitor By",
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatsCard
              key={index}
              title={stat.title}
              value={stat.value}
              subtitle={stat.subtitle}
              icon={stat.icon}
              fromColor={stat.fromColor}
              toColor={stat.toColor}
            />
          ))}
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
            disabled={isLoading || eligiblePakets.length === 0}
          >
            Tambah Monitoring
          </Button>
        </div>

        {/* Filter Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              className="border border-gray-300 dark:border-gray-600 rounded-lg py-2 pl-3 pr-10 text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="ON_TRACK">On Track</option>
              <option value="DELAYED">Delayed</option>
              <option value="CRITICAL">Critical</option>
              <option value="COMPLETED">Completed</option>
            </select>
            
            <select
              className="border border-gray-300 dark:border-gray-600 rounded-lg py-2 pl-3 pr-10 text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
            >
              <option value="all">Semua Jenis</option>
              {jenisMonitoringOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* DataTable */}
        <DataTable
          columns={columns}
          data={filteredMonitorings}
          loading={isLoading}
          enableExport={true}
          enableColumnVisibility={true}
          pageSize={10}
          searchPlaceholder="Cari paket, jenis monitoring, atau periode..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          fixedHeight="750px"
          fixedWidth="1300px"
          minVisibleRows={10}
        />
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        size="2xl"
        title={editingMonitoring ? "Edit Monitoring" : "Tambah Monitoring Baru"}
        showHeader={true}
      >
        <div className="flex flex-col max-h-[80vh] overflow-y-auto px-6 py-4 space-y-4">
          <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            {editingMonitoring ? "Edit Monitoring" : "Tambah Monitoring Baru"}
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
                value={formData.paketId}
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
                  value={formData.jenisMonitoring}
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
                  value={formData.status}
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
            <Button size="sm" variant="outline" onClick={closeModal} disabled={isLoading}>
              Batal
            </Button>
            <Button size="sm" variant="primary" onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Menyimpan...' : editingMonitoring ? 'Update' : 'Simpan'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title="Hapus Monitoring"
        message={`Apakah Anda yakin ingin menghapus monitoring ${
          deletingMonitoring?.paket 
            ? `untuk paket "${deletingMonitoring.paket.kodePaket}"`
            : "ini"
        }?`}
        confirmText="Hapus"
        cancelText="Batal"
        loading={isLoading}
      />

      {/* Details Modal */}
      {selectedData && (
        <DetailsModal
          isOpen={viewDetailsOpen}
          onClose={() => setViewDetailsOpen(false)}
          title="Detail Monitoring"
          sections={[
            {
              title: "Informasi Monitoring",
              fields: [
                {
                  label: "Paket", 
                  value: selectedData.paket 
                    ? `${selectedData.paket.kodePaket} - ${selectedData.paket.namaPaket}`
                    : "Tidak terkait paket"
                },
                { 
                  label: "Jenis Monitoring", 
                  value: (
                    <Badge size="sm" color="info">
                      {selectedData.jenisMonitoring}
                    </Badge>
                  ) 
                },
                { label: "Periode", value: selectedData.periode },
                { 
                  label: "Status", 
                  value: (
                    <Badge 
                      size="sm" 
                      color={getStatusColor(selectedData.status)}
                      startIcon={getStatusIcon(selectedData.status)}
                    >
                      {selectedData.status.replace('_', ' ')}
                    </Badge>
                  ) 
                },
                { 
                  label: "Progress", 
                  value: <ProgressBar progress={selectedData.progress} />
                },
                { 
                  label: "Tanggal Monitoring", 
                  value: new Date(selectedData.tanggalMonitoring).toLocaleDateString("id-ID") 
                },
                { label: "Dimonitor Oleh", value: selectedData.monitoredBy },
              ],
            },
            {
              title: "Issues & Rekomendasi",
              fields: [
                { 
                  label: "Issues", 
                  value: selectedData.issues || "Tidak ada issues" 
                },
                { 
                  label: "Rekomendasi", 
                  value: selectedData.rekomendasi || "Tidak ada rekomendasi" 
                },
              ],
            },
          ]}
          documents={selectedData.dokumen?.map(doc => ({
            id: doc.id,
            namaDokumen: doc.namaDokumen,
            filePath: doc.filePath,
            uploadedAt: doc.uploadedAt,
          })) || []}
          onDownloadDocument={handleDownloadDocument}
        />
      )}
    </>
  );
}