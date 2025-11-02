import { useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import { DownloadIcon, FileIcon } from "../icons";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import Select from "../components/form/Select";

export default function LaporanAnalisis() {
  const [filters, setFilters] = useState({
    periode: "",
    satker: "",
    kategori: "",
  });

  const handleExport = (format: string) => {
    // Dummy export function
    alert(`Mengekspor laporan dalam format ${format}`);
  };

  const handleUpload = (id: number) => {
    // Placeholder untuk modal upload
    alert(`Upload dokumen untuk laporan ${id}`);
  };

  const reports = [
    {
      id: 1,
      name: "Laporan Daftar Paket Pengadaan",
      description: "Rekapitulasi semua paket pengadaan dengan status terkini",
      lastUpdated: "15 Jan 2024",
    },
    {
      id: 2,
      name: "Laporan Temuan Audit",
      description: "Statistik temuan audit dan tindak lanjut",
      lastUpdated: "12 Jan 2024",
    },
    {
      id: 3,
      name: "Laporan KPI Pengadaan",
      description: "Evaluasi kinerja pengadaan per unit/satker",
      lastUpdated: "10 Jan 2024",
    },
    {
      id: 4,
      name: "Laporan Vendor/Penyedia",
      description: "Daftar vendor aktif dan evaluasi kinerja",
      lastUpdated: "08 Jan 2024",
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
                      onClick={() => handleUpload(report.id)}
                    >
                      Upload
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleExport("PDF")}
                    >
                      PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleExport("Excel")}
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
            <div>
              <Label>Nama Laporan</Label>
              <Input
                type="text"
                placeholder="Masukkan nama laporan kustom"
              />
            </div>
            <div>
              <Label>Deskripsi</Label>
              <Input
                type="text"
                placeholder="Deskripsi laporan"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="primary">
                Buat Laporan
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
