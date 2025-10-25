import { useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import Badge from "../components/ui/badge/Badge";
import { PlusIcon, DownloadIcon } from "../icons";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import Select from "../components/form/Select";

interface Dokumen {
  id: string;
  namaDokumen: string;
  jenisDokumen: string;
  paket: string;
  tanggalUpload: string;
  uploadedBy: string;
  status: "Terverifikasi" | "Pending" | "Ditolak";
  ukuran: string;
}

const initialDokumens: Dokumen[] = [
  {
    id: "1",
    namaDokumen: "TOR_Pengadaan_Komputer_2024.pdf",
    jenisDokumen: "TOR",
    paket: "PKT-2024-001",
    tanggalUpload: "15 Jan 2024",
    uploadedBy: "Ahmad Subagja",
    status: "Terverifikasi",
    ukuran: "2.5 MB",
  },
  {
    id: "2",
    namaDokumen: "HPS_Renovasi_Gedung.xlsx",
    jenisDokumen: "HPS",
    paket: "PKT-2024-002",
    tanggalUpload: "20 Jan 2024",
    uploadedBy: "Siti Nurhaliza",
    status: "Pending",
    ukuran: "1.8 MB",
  },
  {
    id: "3",
    namaDokumen: "Kontrak_Pengadaan_Kendaraan.pdf",
    jenisDokumen: "Kontrak",
    paket: "PKT-2024-003",
    tanggalUpload: "10 Jan 2024",
    uploadedBy: "Budi Santoso",
    status: "Terverifikasi",
    ukuran: "3.2 MB",
  },
  {
    id: "4",
    namaDokumen: "BA_Serah_Terima_Kendaraan.pdf",
    jenisDokumen: "BA Serah Terima",
    paket: "PKT-2024-003",
    tanggalUpload: "12 Jan 2024",
    uploadedBy: "Budi Santoso",
    status: "Terverifikasi",
    ukuran: "1.5 MB",
  },
  {
    id: "5",
    namaDokumen: "Laporan_Kemajuan_IT_Konsultan.pdf",
    jenisDokumen: "Laporan Kemajuan",
    paket: "PKT-2024-004",
    tanggalUpload: "25 Jan 2024",
    uploadedBy: "Dewi Lestari",
    status: "Pending",
    ukuran: "4.1 MB",
  },
];

export default function DokumenArsip() {
  const [dokumens, setDokumens] = useState<Dokumen[]>(initialDokumens);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterJenis, setFilterJenis] = useState("all");
  const [formData, setFormData] = useState({
    namaDokumen: "",
    jenisDokumen: "",
    paket: "",
  });

  const { isOpen, openModal, closeModal } = useModal();

  const handleSubmit = () => {
    const newDokumen: Dokumen = {
      id: Date.now().toString(),
      namaDokumen: formData.namaDokumen,
      jenisDokumen: formData.jenisDokumen,
      paket: formData.paket,
      tanggalUpload: new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      uploadedBy: "Current User",
      status: "Pending",
      ukuran: "0 KB",
    };

    setDokumens([newDokumen, ...dokumens]);
    closeModal();
    setFormData({
      namaDokumen: "",
      jenisDokumen: "",
      paket: "",
    });
  };

  const filteredDokumens = dokumens.filter((doc) => {
    const matchSearch =
      doc.namaDokumen.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.paket.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter =
      filterJenis === "all" || doc.jenisDokumen === filterJenis;
    return matchSearch && matchFilter;
  });

  const getStatusColor = (status: Dokumen["status"]) => {
    switch (status) {
      case "Terverifikasi":
        return "success";
      case "Pending":
        return "warning";
      case "Ditolak":
        return "error";
      default:
        return "light";
    }
  };

  const jenisDokumenOptions = [
    { value: "TOR", label: "TOR (Terms of Reference)" },
    { value: "HPS", label: "HPS (Harga Perkiraan Sendiri)" },
    { value: "Kontrak", label: "Kontrak" },
    { value: "BA Serah Terima", label: "BA Serah Terima" },
    { value: "Laporan Kemajuan", label: "Laporan Kemajuan" },
    { value: "Laporan Akhir", label: "Laporan Akhir" },
  ];

  // Stats Cards
  const stats = [
    {
      label: "Total Dokumen",
      value: dokumens.length,
      color: "text-brand-500",
    },
    {
      label: "Terverifikasi",
      value: dokumens.filter((d) => d.status === "Terverifikasi").length,
      color: "text-success-500",
    },
    {
      label: "Pending",
      value: dokumens.filter((d) => d.status === "Pending").length,
      color: "text-warning-500",
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
            onClick={openModal}
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
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Nama Dokumen
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Jenis
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Paket
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Upload By
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Tanggal
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Ukuran
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
                      {doc.jenisDokumen}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {doc.paket}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {doc.uploadedBy}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {doc.tanggalUpload}
                    </td>
                    <td className="px-6 py-4">
                      <Badge size="sm" color={getStatusColor(doc.status)}>
                        {doc.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {doc.ukuran}
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-brand-500 hover:text-brand-600">
                        <DownloadIcon className="size-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-2xl m-4">
        <div className="p-6">
          <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            Upload Dokumen
          </h3>

          <div className="space-y-4">
            <div>
              <Label>Nama Dokumen</Label>
              <Input
                type="text"
                value={formData.namaDokumen}
                onChange={(e) =>
                  setFormData({ ...formData, namaDokumen: e.target.value })
                }
                placeholder="Masukkan nama dokumen"
              />
            </div>

            <div>
              <Label>Jenis Dokumen</Label>
              <Select
                options={jenisDokumenOptions}
                placeholder="Pilih jenis dokumen"
                onChange={(value) =>
                  setFormData({ ...formData, jenisDokumen: value })
                }
              />
            </div>

            <div>
              <Label>Kode Paket</Label>
              <Input
                type="text"
                value={formData.paket}
                onChange={(e) =>
                  setFormData({ ...formData, paket: e.target.value })
                }
                placeholder="PKT-2024-XXX"
              />
            </div>

            <div>
              <Label>File Dokumen</Label>
              <input
                type="file"
                className="focus:border-ring-brand-300 h-11 w-full overflow-hidden rounded-lg border border-gray-300 bg-transparent text-sm text-gray-500 shadow-theme-xs transition-colors file:mr-5 file:border-collapse file:cursor-pointer file:rounded-l-lg file:border-0 file:border-r file:border-solid file:border-gray-200 file:bg-gray-50 file:py-3 file:pl-3.5 file:pr-3 file:text-sm file:text-gray-700 placeholder:text-gray-400 hover:file:bg-gray-100 focus:outline-none focus:file:ring-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:text-white/90 dark:file:border-gray-800 dark:file:bg-white/[0.03] dark:file:text-gray-400 dark:placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={closeModal}>
              Batal
            </Button>
            <Button size="sm" variant="primary" onClick={handleSubmit}>
              Upload
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}