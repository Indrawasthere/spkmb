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

interface KonsultanPengawas {
  id: string;
  namaVendor: string;
  jenisVendor: "KONSULTAN_PENGAWAS";
  nomorIzin: string;
  spesialisasi: string | null;
  jumlahProyek: number;
  rating: number | null;
  status: "AKTIF" | "NON_AKTIF" | "SUSPENDED";
  kontak: string | null;
  alamat: string | null;
  createdAt: string;
}

export default function KonsultanPengawas() {
  const [konsultanPengawas, setKonsultanPengawas] = useState<KonsultanPengawas[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formData, setFormData] = useState({
    namaVendor: "",
    nomorIzin: "",
    spesialisasi: "",
    kontak: "",
    alamat: "",
  });
  const [editingKonsultan, setEditingKonsultan] = useState<KonsultanPengawas | null>(null);

  const { isOpen, openModal, closeModal } = useModal();

  // Fetch konsultan data from API
  useEffect(() => {
    fetchKonsultan();
  }, []);

  const fetchKonsultan = async () => {
    try {
      const response = await fetch('/api/vendor?jenis=KONSULTAN_PENGAWAS');
      if (response.ok) {
        const data = await response.json();
        setKonsultanPengawas(data);
      }
    } catch (error) {
      console.error('Error fetching konsultan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const konsultanData = {
        namaVendor: formData.namaVendor,
        jenisVendor: "KONSULTAN_PENGAWAS" as const,
        nomorIzin: formData.nomorIzin,
        spesialisasi: formData.spesialisasi || null,
        kontak: formData.kontak || null,
        alamat: formData.alamat || null,
      };

      let response;
      if (editingKonsultan) {
        response = await fetch(`/api/vendor/${editingKonsultan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(konsultanData),
        });
      } else {
        response = await fetch('/api/vendor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(konsultanData),
        });
      }

      if (response.ok) {
        await fetchKonsultan();
        closeModal();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving konsultan:', error);
    }
  };

  const handleEdit = (konsultan: KonsultanPengawas) => {
    setEditingKonsultan(konsultan);
    setFormData({
      namaVendor: konsultan.namaVendor,
      nomorIzin: konsultan.nomorIzin,
      spesialisasi: konsultan.spesialisasi || "",
      kontak: konsultan.kontak || "",
      alamat: konsultan.alamat || "",
    });
    openModal();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus konsultan ini?')) {
      try {
        const response = await fetch(`/api/vendor/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          await fetchKonsultan();
        }
      } catch (error) {
        console.error('Error deleting konsultan:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      namaVendor: "",
      nomorIzin: "",
      spesialisasi: "",
      kontak: "",
      alamat: "",
    });
    setEditingKonsultan(null);
  };

  const openAddModal = () => {
    resetForm();
    openModal();
  };

  const filteredKonsultan = konsultanPengawas.filter((k) => {
    const matchSearch =
      k.namaVendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.nomorIzin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (k.spesialisasi?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchFilter = filterStatus === "all" || k.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const getStatusColor = (status: KonsultanPengawas["status"]) => {
    switch (status) {
      case "AKTIF":
        return "success";
      case "NON_AKTIF":
        return "warning";
      case "SUSPENDED":
        return "error";
      default:
        return "light";
    }
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-gray-400">-</span>;
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, index) => (
          <svg
            key={index}
            className={`size-4 ${
              index < Math.floor(rating)
                ? "fill-warning-500 text-warning-500"
                : "fill-gray-300 text-gray-300 dark:fill-gray-600 dark:text-gray-600"
            }`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  // Stats Cards
  const stats = [
    {
      label: "Total Konsultan",
      value: konsultanPengawas.length,
      color: "text-brand-500",
    },
    {
      label: "Total Proyek",
      value: konsultanPengawas.reduce((acc, k) => acc + k.jumlahProyek, 0),
      color: "text-blue-light-500",
    },
    {
      label: "Konsultan Aktif",
      value: konsultanPengawas.filter((k) => k.status === "AKTIF").length,
      color: "text-success-500",
    },
    {
      label: "Rating Rata-rata",
      value: konsultanPengawas.length > 0 ? (konsultanPengawas.reduce((sum, k) => sum + (k.rating || 0), 0) / konsultanPengawas.length).toFixed(1) : "0.0",
      color: "text-warning-500",
    },
  ];

  return (
    <>
      <PageMeta
        title="Konsultan Pengawas | SIP-KPBJ"
        description="Halaman Konsultan Pengawas untuk Vendor Penyedia"
      />
      <PageBreadcrumb pageTitle="Konsultan Pengawas" />

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
              Daftar Konsultan Pengawas
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola data konsultan pengawas dan monitoring proyek
            </p>
          </div>
          <Button
            size="md"
            variant="primary"
            startIcon={<PlusIcon />}
            onClick={openModal}
          >
            Tambah Konsultan
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Input
              type="text"
              placeholder="Cari konsultan..."
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
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
                <option value="Ditangguhkan">Ditangguhkan</option>
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
                    Nama Konsultan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    No. Izin
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Spesialisasi
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Proyek Aktif
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Proyek Selesai
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Rating
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredKonsultan.map((k) => (
                  <tr
                    key={k.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                      <div>
                        <p>{k.namaVendor}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {k.alamat}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {k.nomorIzin}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {k.spesialisasi}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {k.jumlahProyek}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      -
                    </td>
                    <td className="px-6 py-4">{renderStars(k.rating)}</td>
                    <td className="px-6 py-4">
                      <Badge size="sm" color={getStatusColor(k.status)}>
                        {k.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <button
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                        onClick={() => handleEdit(k)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        onClick={() => handleDelete(k.id)}
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
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-2xl m-4">
        <div className="p-6">
          <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            {editingKonsultan ? 'Edit Konsultan Pengawas' : 'Tambah Konsultan Pengawas Baru'}
          </h3>

          <div className="space-y-4">
            <div>
              <Label>Nama Konsultan</Label>
              <Input
                type="text"
                value={formData.namaVendor}
                onChange={(e) =>
                  setFormData({ ...formData, namaVendor: e.target.value })
                }
                placeholder="PT/CV Nama Konsultan"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nomor Izin</Label>
                <Input
                  type="text"
                  value={formData.nomorIzin}
                  onChange={(e) =>
                    setFormData({ ...formData, nomorIzin: e.target.value })
                  }
                  placeholder="IUJK-SUP-XXX/2024"
                />
              </div>
              <div>
                <Label>Spesialisasi</Label>
                <Input
                  type="text"
                  value={formData.spesialisasi}
                  onChange={(e) =>
                    setFormData({ ...formData, spesialisasi: e.target.value })
                  }
                  placeholder="Konstruksi, Jalan, dll"
                />
              </div>
            </div>

            <div>
              <Label>Alamat</Label>
              <Input
                type="text"
                value={formData.alamat}
                onChange={(e) =>
                  setFormData({ ...formData, alamat: e.target.value })
                }
                placeholder="Kota/Kabupaten"
              />
            </div>

            <div>
              <Label>Kontak</Label>
              <Input
                type="email"
                value={formData.kontak}
                onChange={(e) =>
                  setFormData({ ...formData, kontak: e.target.value })
                }
                placeholder="email@konsultan.com"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={closeModal}>
              Batal
            </Button>
            <Button size="sm" variant="primary" onClick={handleSubmit}>
              {editingKonsultan ? 'Update Konsultan' : 'Simpan Konsultan'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
