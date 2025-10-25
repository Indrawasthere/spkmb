import { useState } from "react";
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

interface Paket {
  id: string;
  kodePaket: string;
  namaPaket: string;
  nilai: string;
  satker: string;
  metode: string;
  status: "Perencanaan" | "Proses" | "Selesai" | "Batal";
  tanggal: string;
}

// Dummy data paket pengadaan
const initialPakets: Paket[] = [
  {
    id: "1",
    kodePaket: "PKT-2024-001",
    namaPaket: "Pengadaan Komputer dan Printer",
    nilai: "Rp 250.000.000",
    satker: "IT Department",
    metode: "E-Lelang",
    status: "Proses",
    tanggal: "15 Jan 2024",
  },
  {
    id: "2",
    kodePaket: "PKT-2024-002",
    namaPaket: "Renovasi Gedung Kantor",
    nilai: "Rp 1.500.000.000",
    satker: "Bagian Umum",
    metode: "Tender",
    status: "Perencanaan",
    tanggal: "20 Jan 2024",
  },
  {
    id: "3",
    kodePaket: "PKT-2024-003",
    namaPaket: "Pengadaan Kendaraan Dinas",
    nilai: "Rp 850.000.000",
    satker: "Bagian Umum",
    metode: "E-Lelang",
    status: "Selesai",
    tanggal: "10 Jan 2024",
  },
  {
    id: "4",
    kodePaket: "PKT-2024-004",
    namaPaket: "Jasa Konsultansi IT",
    nilai: "Rp 450.000.000",
    satker: "IT Department",
    metode: "Penunjukan Langsung",
    status: "Proses",
    tanggal: "25 Jan 2024",
  },
];

export default function ManajemenPaket() {
  const [pakets, setPakets] = useState<Paket[]>(initialPakets);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    kodePaket: "",
    namaPaket: "",
    nilai: "",
    satker: "",
    metode: "",
    status: "" as Paket["status"] | "",
  });

  const { isOpen, openModal, closeModal } = useModal();

  const handleSubmit = () => {
    const newPaket: Paket = {
      id: Date.now().toString(),
      kodePaket: formData.kodePaket,
      namaPaket: formData.namaPaket,
      nilai: formData.nilai,
      satker: formData.satker,
      metode: formData.metode,
      status: formData.status || "Perencanaan",
      tanggal: new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };

    setPakets([newPaket, ...pakets]);
    closeModal();
    setFormData({
      kodePaket: "",
      namaPaket: "",
      nilai: "",
      satker: "",
      metode: "",
      status: "",
    });
  };

  const filteredPakets = pakets.filter(
    (paket) =>
      paket.namaPaket.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paket.kodePaket.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paket.satker.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: Paket["status"]) => {
    switch (status) {
      case "Selesai":
        return "success";
      case "Proses":
        return "warning";
      case "Perencanaan":
        return "info";
      case "Batal":
        return "error";
      default:
        return "light";
    }
  };

  const metodeOptions = [
    { value: "E-Lelang", label: "E-Lelang" },
    { value: "Tender", label: "Tender" },
    { value: "Penunjukan Langsung", label: "Penunjukan Langsung" },
    { value: "Seleksi", label: "Seleksi" },
  ];

  const statusOptions = [
    { value: "Perencanaan", label: "Perencanaan" },
    { value: "Proses", label: "Proses" },
    { value: "Selesai", label: "Selesai" },
    { value: "Batal", label: "Batal" },
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
            onClick={openModal}
          >
            Tambah Paket
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Input
              type="text"
              placeholder="Cari paket..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-96"
            />
            <div className="flex gap-2">
              <select className="h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                <option>Semua Status</option>
                <option>Perencanaan</option>
                <option>Proses</option>
                <option>Selesai</option>
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
                    Kode Paket
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Nama Paket
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Nilai
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Satker
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Metode
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Tanggal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredPakets.map((paket) => (
                  <tr
                    key={paket.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                      {paket.kodePaket}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {paket.namaPaket}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {paket.nilai}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {paket.satker}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {paket.metode}
                    </td>
                    <td className="px-6 py-4">
                      <Badge size="sm" color={getStatusColor(paket.status)}>
                        {paket.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {paket.tanggal}
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
            Tambah Paket Pengadaan
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kode Paket</Label>
                <Input
                  type="text"
                  value={formData.kodePaket}
                  onChange={(e) =>
                    setFormData({ ...formData, kodePaket: e.target.value })
                  }
                  placeholder="PKT-2024-XXX"
                />
              </div>
              <div>
                <Label>Nilai Paket</Label>
                <Input
                  type="text"
                  value={formData.nilai}
                  onChange={(e) =>
                    setFormData({ ...formData, nilai: e.target.value })
                  }
                  placeholder="Rp 0"
                />
              </div>
            </div>

            <div>
              <Label>Nama Paket</Label>
              <Input
                type="text"
                value={formData.namaPaket}
                onChange={(e) =>
                  setFormData({ ...formData, namaPaket: e.target.value })
                }
                placeholder="Masukkan nama paket"
              />
            </div>

            <div>
              <Label>Satuan Kerja</Label>
              <Input
                type="text"
                value={formData.satker}
                onChange={(e) =>
                  setFormData({ ...formData, satker: e.target.value })
                }
                placeholder="Masukkan satuan kerja"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Metode Pengadaan</Label>
                <Select
                  options={metodeOptions}
                  placeholder="Pilih metode"
                  onChange={(value) =>
                    setFormData({ ...formData, metode: value })
                  }
                />
              </div>
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
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={closeModal}>
              Batal
            </Button>
            <Button size="sm" variant="primary" onClick={handleSubmit}>
              Simpan Paket
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}