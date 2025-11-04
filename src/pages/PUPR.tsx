import { useState, useEffect } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import Badge from "../components/ui/badge/Badge";
import DatePicker from "react-datepicker";
import { PlusIcon, PencilIcon, TrashBinIcon } from "../icons";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";

interface Proyek {
  id: string;
  namaProyek: string;
  lokasi: string;
  anggaran: number;
  status: "PERENCANAAN" | "PELAKSANAAN" | "SELESAI" | "DITUNDA";
  progress: number;
  kontraktor: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = "https://4bnmj0s4-3001.asse.devtunnels.ms";

export default function PUPR() {
  const [proyek, setProyek] = useState<Proyek[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formData, setFormData] = useState({
    namaProyek: "",
    lokasi: "",
    anggaran: "",
    kontraktor: "",
    tanggalMulai: "",
    tanggalSelesai: "",
  });
  const [editingProyek, setEditingProyek] = useState<Proyek | null>(null);

  const { isOpen, openModal, closeModal } = useModal();

  // Fetch proyek data from API
  useEffect(() => {
    fetchProyek();
  }, []);

  const fetchProyek = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/proyek-pupr`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setProyek(data);
      }
    } catch (error) {
      console.error("Error fetching proyek:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const proyekData = {
        namaProyek: formData.namaProyek,
        lokasi: formData.lokasi,
        anggaran: parseFloat(formData.anggaran.replace(/[^\d]/g, "")) || 0,
        kontraktor: formData.kontraktor,
        tanggalMulai: new Date(formData.tanggalMulai),
        tanggalSelesai: new Date(formData.tanggalSelesai),
      };

      let response;
      if (editingProyek) {
        response = await fetch(
          `${API_BASE_URL}/api/proyek-pupr/${editingProyek.id}`,
          {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(proyekData),
          }
        );
      } else {
        response = await fetch(`${API_BASE_URL}/api/proyek-pupr`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(proyekData),
        });
      }

      if (response.ok) {
        await fetchProyek();
        closeModal();
        resetForm();
      }
    } catch (error) {
      console.error("Error saving proyek:", error);
    }
  };

  const handleEdit = (proyek: Proyek) => {
    setEditingProyek(proyek);
    setFormData({
      namaProyek: proyek.namaProyek,
      lokasi: proyek.lokasi,
      anggaran: proyek.anggaran.toString(),
      kontraktor: proyek.kontraktor,
      tanggalMulai: proyek.tanggalMulai.split("T")[0],
      tanggalSelesai: proyek.tanggalSelesai.split("T")[0],
    });
    openModal();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus proyek ini?")) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/proyek-pupr/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (response.ok) {
          await fetchProyek();
        }
      } catch (error) {
        console.error("Error deleting proyek:", error);
      }
    }
  };

  const handleUpload = (id: string) => {
    // Placeholder untuk modal upload
    alert(`Upload dokumen untuk proyek ${id}`);
  };

  const resetForm = () => {
    setFormData({
      namaProyek: "",
      lokasi: "",
      anggaran: "",
      kontraktor: "",
      tanggalMulai: "",
      tanggalSelesai: "",
    });
    setEditingProyek(null);
  };

  const openAddModal = () => {
    resetForm();
    openModal();
  };

  const filteredProyek = proyek.filter((p) => {
    const matchSearch =
      p.namaProyek.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.lokasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.kontraktor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const getStatusColor = (status: Proyek["status"]) => {
    switch (status) {
      case "SELESAI":
        return "success";
      case "PELAKSANAAN":
        return "warning";
      case "PERENCANAAN":
        return "info";
      case "DITUNDA":
        return "error";
      default:
        return "light";
    }
  };

  // Stats Cards
  const stats = [
    {
      label: "Total Proyek",
      value: proyek.length,
      color: "text-brand-500",
    },
    {
      label: "Dalam Pelaksanaan",
      value: proyek.filter((p) => p.status === "PELAKSANAAN").length,
      color: "text-warning-500",
    },
    {
      label: "Selesai",
      value: proyek.filter((p) => p.status === "SELESAI").length,
      color: "text-success-500",
    },
    {
      label: "Total Anggaran",
      value:
        proyek.length > 0
          ? `Rp ${(
              proyek.reduce((sum, p) => sum + p.anggaran, 0) / 1000000000000
            ).toFixed(2)}T`
          : "Rp 0T",
      color: "text-blue-light-500",
    },
  ];

  return (
    <>
      <PageMeta
        title="PUPR | SIP-KPBJ"
        description="Halaman PUPR untuk Pengawasan dan Audit"
      />
      <PageBreadcrumb pageTitle="PUPR" />

      <div className="space-y-6">
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
              Daftar Proyek PUPR
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola proyek infrastruktur dan perumahan
            </p>
          </div>
          <Button
            size="md"
            variant="primary"
            startIcon={<PlusIcon />}
            onClick={openModal}
          >
            Tambah Proyek
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Input
              type="text"
              placeholder="Cari proyek..."
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
                <option value="Perencanaan">Perencanaan</option>
                <option value="Pelaksanaan">Pelaksanaan</option>
                <option value="Selesai">Selesai</option>
                <option value="Ditunda">Ditunda</option>
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
                    Nama Proyek
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Lokasi
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Anggaran
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Progress
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Dokumen
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredProyek.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                      <div>
                        <p>{p.namaProyek}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {p.tanggalMulai} - {p.tanggalSelesai}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {p.lokasi}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      Rp {p.anggaran.toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4">
                      <Badge size="sm" color={getStatusColor(p.status)}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2 dark:bg-gray-700">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${p.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {p.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {p.kontraktor}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {/* Placeholder untuk list dokumen */}
                      <div className="space-y-1">
                        <span className="text-xs">Dokumen terkait: 2 file</span>
                        <button className="text-blue-600 hover:text-blue-900 text-xs">
                          Lihat Dokumen
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <button
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3"
                        onClick={() => handleUpload(p.id)}
                      >
                        Upload
                      </button>
                      <button
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                        onClick={() => handleEdit(p)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        onClick={() => handleDelete(p.id)}
                      >
                        Hapus
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
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        size="2xl"
        title={editingProyek ? "" : ""}
        showHeader={true}
      >
        <div className="flex flex-col max-h-[80vh] overflow-y-auto px-6 py-4 space-y-4">
          <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            {editingProyek ? "Edit Proyek" : "Tambah Proyek Baru"}
          </h3>

          <div className="space-y-4">
            <div>
              <Label>Nama Proyek</Label>
              <Input
                type="text"
                value={formData.namaProyek}
                onChange={(e) =>
                  setFormData({ ...formData, namaProyek: e.target.value })
                }
                placeholder="Nama proyek lengkap"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Lokasi</Label>
                <Input
                  type="text"
                  value={formData.lokasi}
                  onChange={(e) =>
                    setFormData({ ...formData, lokasi: e.target.value })
                  }
                  placeholder="Kota/Kabupaten"
                />
              </div>
              <div>
                <Label>Anggaran</Label>
                <Input
                  type="text"
                  value={formData.anggaran}
                  onChange={(e) =>
                    setFormData({ ...formData, anggaran: e.target.value })
                  }
                  placeholder="Rp XXX"
                />
              </div>
            </div>

            <div>
              <Label>Kontraktor</Label>
              <Input
                type="text"
                value={formData.kontraktor}
                onChange={(e) =>
                  setFormData({ ...formData, kontraktor: e.target.value })
                }
                placeholder="PT. Nama Kontraktor"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tanggal Mulai</Label>
                <DatePicker
                  selected={
                    formData.tanggalMulai
                      ? new Date(formData.tanggalMulai)
                      : null
                  }
                  onChange={(date: Date | null) =>
                    setFormData({
                      ...formData,
                      tanggalMulai: date
                        ? date.toISOString().split("T")[0]
                        : "",
                    })
                  }
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Pilih tanggal mulai"
                  className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm focus:border-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  calendarClassName="!bg-white dark:!bg-gray-800 dark:!text-gray-200 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
                />
              </div>

              <div>
                <Label>Tanggal Selesai</Label>
                <DatePicker
                  selected={
                    formData.tanggalSelesai
                      ? new Date(formData.tanggalSelesai)
                      : null
                  }
                  onChange={(date: Date | null) =>
                    setFormData({
                      ...formData,
                      tanggalSelesai: date
                        ? date.toISOString().split("T")[0]
                        : "",
                    })
                  }
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Pilih tanggal selesai"
                  className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm focus:border-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  calendarClassName="!bg-white dark:!bg-gray-800 dark:!text-gray-200 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={closeModal}>
              Batal
            </Button>
            <Button size="sm" variant="primary" onClick={handleSubmit}>
              Simpan Proyek
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
