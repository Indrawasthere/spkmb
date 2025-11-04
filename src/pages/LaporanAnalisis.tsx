import { useState, useEffect } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import Badge from "../components/ui/badge/Badge";
import { DownloadIcon, FileIcon, PlusIcon } from "../icons";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import Select from "../components/form/Select";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import TextArea from "../components/form/input/TextArea";

const API_BASE_URL = 'https://4bnmj0s4-3001.asse.devtunnels.ms';

interface LaporanAnalisis {
  id: string;
  jenisLaporan: string;
  periode: string;
  data: any;
  kesimpulan: string;
  rekomendasi: string;
  generatedBy: string;
  generatedAt: string;
}

interface Paket {
  id: string;
  kodePaket: string;
  namaPaket: string;
  status: string;
}

interface Monitoring {
  id: string;
  paketId: string;
  jenisMonitoring: string;
  status: string;
  progress: number;
}

interface TemuanBPKP {
  id: string;
  paketId: string;
  jenisTemuan: string;
  tingkatKeparahan: string;
  status: string;
}

export default function LaporanAnalisis() {
  const [laporan, setLaporan] = useState<LaporanAnalisis[]>([]);
  const [pakets, setPakets] = useState<Paket[]>([]);
  const [monitorings, setMonitorings] = useState<Monitoring[]>([]);
  const [temuans, setTemuans] = useState<TemuanBPKP[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    periode: "",
    satker: "",
    kategori: "",
  });
  const [formData, setFormData] = useState({
    jenisLaporan: "",
    periode: "",
    paketIds: [] as string[],
    kesimpulan: "",
    rekomendasi: "",
  });
  const [selectedPakets, setSelectedPakets] = useState<Paket[]>([]);

  const { isOpen, openModal, closeModal } = useModal();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [laporanRes, paketRes, monitoringRes, temuanRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/laporan-analisis`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/paket`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/monitoring`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/temuan-bpkp`, { credentials: 'include' }),
      ]);

      if (laporanRes.ok) {
        const data = await laporanRes.json();
        setLaporan(data);
      }
      if (paketRes.ok) {
        const data = await paketRes.json();
        setPakets(data);
      }
      if (monitoringRes.ok) {
        const data = await monitoringRes.json();
        setMonitorings(data);
      }
      if (temuanRes.ok) {
        const data = await temuanRes.json();
        setTemuans(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (laporanId: string, format: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/laporan-analisis/${laporanId}/export?format=${format}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `laporan-${laporanId}.${format.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Gagal mengunduh laporan');
      }
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Terjadi kesalahan saat mengunduh');
    }
  };

  const handleGenerateReport = async () => {
    if (!formData.jenisLaporan || !formData.periode || selectedPakets.length === 0) {
      alert('Harap lengkapi semua field');
      return;
    }

    setLoading(true);
    try {
      // Aggregate data from monitoring and temuan for selected pakets
      const aggregatedData = {
        paketCount: selectedPakets.length,
        completedMonitorings: monitorings.filter(m => selectedPakets.some(p => p.id === m.paketId) && m.status === 'COMPLETED').length,
        totalTemuans: temuans.filter(t => selectedPakets.some(p => p.id === t.paketId)).length,
        criticalTemuans: temuans.filter(t => selectedPakets.some(p => p.id === t.paketId) && t.tingkatKeparahan === 'KRITIS').length,
        paketDetails: selectedPakets.map(p => ({
          kodePaket: p.kodePaket,
          namaPaket: p.namaPaket,
          status: p.status,
          monitorings: monitorings.filter(m => m.paketId === p.id),
          temuans: temuans.filter(t => t.paketId === p.id),
        })),
      };

      const reportData = {
        jenisLaporan: formData.jenisLaporan,
        periode: formData.periode,
        data: aggregatedData,
        kesimpulan: formData.kesimpulan,
        rekomendasi: formData.rekomendasi,
      };

      const response = await fetch(`${API_BASE_URL}/api/laporan-analisis`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });

      if (response.ok) {
        await fetchData();
        closeModal();
        resetForm();
        alert('Laporan berhasil dibuat!');
      } else {
        alert('Gagal membuat laporan');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Terjadi kesalahan saat membuat laporan');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      jenisLaporan: "",
      periode: "",
      paketIds: [],
      kesimpulan: "",
      rekomendasi: "",
    });
    setSelectedPakets([]);
  };

  const handlePaketSelection = (paketId: string) => {
    const paket = pakets.find(p => p.id === paketId);
    if (paket && !selectedPakets.some(p => p.id === paketId)) {
      setSelectedPakets([...selectedPakets, paket]);
      setFormData({ ...formData, paketIds: [...formData.paketIds, paketId] });
    }
  };

  const removePaket = (paketId: string) => {
    setSelectedPakets(selectedPakets.filter(p => p.id !== paketId));
    setFormData({ ...formData, paketIds: formData.paketIds.filter(id => id !== paketId) });
  };

  const filteredLaporan = laporan.filter((l) => {
    const matchPeriode = !filters.periode || l.periode === filters.periode;
    const matchJenis = !filters.kategori || l.jenisLaporan.toLowerCase().includes(filters.kategori.toLowerCase());
    return matchPeriode && matchJenis;
  });

  const reports = [
    {
      id: 1,
      name: "Laporan Daftar Paket Pengadaan",
      description: "Rekapitulasi semua paket pengadaan dengan status terkini",
      lastUpdated: "15 Jan 2024",
      canGenerate: true,
    },
    {
      id: 2,
      name: "Laporan Temuan Audit",
      description: "Statistik temuan audit dan tindak lanjut",
      lastUpdated: "12 Jan 2024",
      canGenerate: temuans.length > 0,
    },
    {
      id: 3,
      name: "Laporan KPI Pengadaan",
      description: "Evaluasi kinerja pengadaan per unit/satker",
      lastUpdated: "10 Jan 2024",
      canGenerate: monitorings.length > 0,
    },
    {
      id: 4,
      name: "Laporan Vendor/Penyedia",
      description: "Daftar vendor aktif dan evaluasi kinerja",
      lastUpdated: "08 Jan 2024",
      canGenerate: true,
    },
  ];

  const periodeOptions = [
    { value: "2024", label: "2024" },
    { value: "2023", label: "2023" },
    { value: "2022", label: "2022" },
  ];

  const satkerOptions = [
    { value: "IT Department", label: "IT Department" },
    { value: "Bagian Umum", label: "Bagian Umum" },
    { value: "Bagian Keuangan", label: "Bagian Keuangan" },
  ];

  const kategoriOptions = [
    { value: "Semua", label: "Semua" },
    { value: "Barang", label: "Barang" },
    { value: "Jasa", label: "Jasa" },
    { value: "Konstruksi", label: "Konstruksi" },
  ];

  return (
    <>
      <PageMeta
        title="Laporan & Analisis - Sistem Pengawasan"
        description="Hasilkan dan unduh laporan pengadaan"
      />
      <PageBreadcrumb pageTitle="Laporan & Analisis" />

      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Laporan & Analisis
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Hasilkan laporan formal dalam format PDF atau Excel
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Filter Laporan
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label>Periode</Label>
              <Select
                options={periodeOptions}
                placeholder="Pilih periode"
                onChange={(value) => setFilters({ ...filters, periode: value })}
              />
            </div>
            <div>
              <Label>Satker/Unit</Label>
              <Select
                options={satkerOptions}
                placeholder="Pilih satker"
                onChange={(value) => setFilters({ ...filters, satker: value })}
              />
            </div>
            <div>
              <Label>Kategori Pengadaan</Label>
              <Select
                options={kategoriOptions}
                placeholder="Pilih kategori"
                onChange={(value) => setFilters({ ...filters, kategori: value })}
              />
            </div>
          </div>
        </div>

        {/* Available Reports */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Laporan Tersedia
            </h3>
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      <FileIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-white/90">
                        {report.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {report.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Terakhir diperbarui: {report.lastUpdated}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleExport(report.id.toString(), "PDF")}
                    >
                      PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleExport(report.id.toString(), "Excel")}
                    >
                      Excel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Report */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Buat Laporan Kustom
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Jenis Laporan</Label>
                <Select
                  options={[
                    { value: "Laporan Daftar Paket", label: "Laporan Daftar Paket" },
                    { value: "Laporan Temuan Audit", label: "Laporan Temuan Audit" },
                    { value: "Laporan KPI Pengadaan", label: "Laporan KPI Pengadaan" },
                    { value: "Laporan Vendor", label: "Laporan Vendor" },
                  ]}
                  placeholder="Pilih jenis laporan"
                  onChange={(value) => setFormData({ ...formData, jenisLaporan: value })}
                />
              </div>
              <div>
                <Label>Periode</Label>
                <Select
                  options={periodeOptions}
                  placeholder="Pilih periode"
                  onChange={(value) => setFormData({ ...formData, periode: value })}
                />
              </div>
            </div>

            <div>
              <Label>Pilih Paket</Label>
              <Select
                options={pakets.map(p => ({ value: p.id, label: `${p.kodePaket} - ${p.namaPaket}` }))}
                placeholder="Pilih paket"
                onChange={handlePaketSelection}
              />
              {selectedPakets.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedPakets.map(paket => (
                    <span key={paket.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 cursor-pointer" onClick={() => removePaket(paket.id)}>
                      {paket.kodePaket} ✕
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label>Kesimpulan</Label>
              <TextArea
                rows={3}
                value={formData.kesimpulan}
                onChange={(value) => setFormData({ ...formData, kesimpulan: value })}
                placeholder="Masukkan kesimpulan laporan"
              />
            </div>

            <div>
              <Label>Rekomendasi</Label>
              <TextArea
                rows={3}
                value={formData.rekomendasi}
                onChange={(value) => setFormData({ ...formData, rekomendasi: value })}
                placeholder="Masukkan rekomendasi"
              />
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="primary" onClick={handleGenerateReport} disabled={loading}>
                {loading ? 'Membuat...' : 'Buat Laporan'}
              </Button>
              <Button size="sm" variant="outline" onClick={resetForm}>
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
