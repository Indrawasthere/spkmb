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

interface PPK {
  id: string;
  nip: string;
  nama: string;
  jabatan: string;
  sertifikat: string;
  masaBerlaku: string;
  status: "Aktif" | "Kadaluarsa" | "Pending";
}

// Dummy data PPK
const initialPPKs: PPK[] = [
  {
    id: "1",
    nip: "198501012010011001",
    nama: "Ahmad Surya",
    jabatan: "PPK Bagian IT",
    sertifikat: "Sertifikat Pengadaan Tingkat II",
    masaBerlaku: "15 Des 2025",
    status: "Aktif",
  },
  {
    id: "2",
    nip: "198703152011012002",
    nama: "Siti Nurhaliza",
    jabatan: "PPK Bagian Umum",
    sertifikat: "Sertifikat Pengadaan Tingkat I",
    masaBerlaku: "20 Nov 2024",
    status: "Aktif",
  },
  {
    id: "3",
    nip: "199001202012013003",
    nama: "Budi Santoso",
    jabatan: "PPK Bagian Keuangan",
    sertifikat: "Sertifikat Pengadaan Tingkat III",
    masaBerlaku: "10 Jan 2024",
    status: "Kadaluarsa",
  },
];

export default function KompetensiPPK() {
  const [ppks, setPpks] = useState<PPK[]>(initialPPKs);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    nip: "",
    nama: "",
    jabatan: "",
    sertifikat: "",
    masaBerlaku: "",
    status: "" as PPK["status"] | "",
  });

  const { isOpen, openModal, closeModal } = useModal();

  const handleSubmit = () => {
    const newPPK: PPK = {
      id: Date.now().toString(),
      nip: formData.nip,
      nama: formData.nama,
      jabatan: formData.jabatan,
      sertifikat: formData.sertifikat,
      masaBerlaku: formData.masaBerlaku,
      status: formData.status || "Aktif",
    };

    setPpks([newPPK, ...ppks]);
    closeModal();
    setFormData({
      nip: "",
      nama: "",
      jabatan: "",
      sertifikat: "",
      masaBerlaku: "",
      status: "",
    });
  };

  const filteredPPKs = ppks.filter(
    (ppk) =>
      ppk.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ppk.nip.includes(searchQuery) ||
      ppk.jabatan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: PPK["status"]) => {
    switch (status) {
      case "Aktif":
        return "success";
      case "Kadaluarsa":
        return "error";
      case "Pending":
        return "warning";
      default:
        return "light";
    }
  };

  const sertifikatOptions = [
    { value: "Sertifikat Pengadaan Tingkat I", label: "Sertifikat Pengadaan Tingkat I" },
    { value: "Sertifikat Pengadaan Tingkat II", label: "Sertifikat Pengadaan Tingkat II" },
    { value: "Sertifikat Pengadaan Tingkat III", label: "Sertifikat Pengadaan Tingkat III" },
  ];

  const statusOptions = [
    { value: "Aktif", label: "Aktif" },
    { value: "Kadaluarsa", label: "Kadaluarsa" },
    { value: "Pending", label: "Pending" },
  ];

  return (
    <>
      <PageMeta
        title="Kompetensi PPK - Sistem Pengawasan"
        description="Kelola kompetensi dan sertifikasi Pejabat Pengadaan"
      />
      <PageBreadcrumb pageTitle="Kompetensi PPK" />

      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Daftar Kompetensi PPK
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola sertifikasi dan validitas pejabat pengadaan
            </p>
          </div>
          <Button
            size="md"
            variant="primary"
            startIcon={<PlusIcon />}
            onClick={openModal}
          >
            Tambah PPK
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Input
              type="text"
              placeholder="Cari PPK..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-96"
            />
            <div className="flex gap-2">
              <select className="h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                <option>Semua Status</option>
                <option>Aktif</option>
                <option>Kadaluarsa</option>
                <option>Pending</option>
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
                    NIP
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Nama
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Jabatan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Sertifikat
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Masa Berlaku
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredPPKs.map((ppk) => (
                  <tr
                    key={ppk.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                      {ppk.nip}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {ppk.nama}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {ppk.jabatan}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {ppk.sertifikat}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {ppk.masaBerlaku}
                    </td>
                    <td className="px-6 py-4">
                      <Badge size="sm" color={getStatusColor(ppk.status)}>
                        {ppk.status}
                      </Badge>
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
            Tambah PPK
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>NIP</Label>
                <Input
                  type="text"
                  value={formData.nip}
                  onChange={(e) =>
                    setFormData({ ...formData, nip: e.target.value })
                  }
                  placeholder="198501012010011001"
                />
              </div>
              <div>
                <Label>Masa Berlaku</Label>
                <Input
                  type="text"
                  value={formData.masaBerlaku}
                  onChange={(e) =>
                    setFormData({ ...formData, masaBerlaku: e.target.value })
                  }
                  placeholder="15 Des 2025"
                />
              </div>
            </div>

            <div>
              <Label>Nama</Label>
              <Input
                type="text"
                value={formData.nama}
                onChange={(e) =>
                  setFormData({ ...formData, nama: e.target.value })
                }
                placeholder="Masukkan nama"
              />
            </div>

            <div>
              <Label>Jabatan</Label>
              <Input
                type="text"
                value={formData.jabatan}
                onChange={(e) =>
                  setFormData({ ...formData, jabatan: e.target.value })
                }
                placeholder="Masukkan jabatan"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sertifikat</Label>
                <Select
                  options={sertifikatOptions}
                  placeholder="Pilih sertifikat"
                  onChange={(value) =>
                    setFormData({ ...formData, sertifikat: value })
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
                      status: value as PPK["status"],
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
              Simpan PPK
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
