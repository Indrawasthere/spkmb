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
import Select from "../components/form/Select";
import { useAuth } from "../context/AuthContext";

interface Paket {
  id: string;
  kodePaket: string;
  namaPaket: string;
  jenisPaket: string;
  nilaiPaket: number;
  metodePengadaan: string;
  status: "DRAFT" | "PUBLISHED" | "ON_PROGRESS" | "COMPLETED" | "CANCELLED";
  tanggalBuat: string;
  createdBy: string;
}

export default function ManajemenPaket() {
  const { user } = useAuth();
  const [pakets, setPakets] = useState<Paket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    kodePaket: "",
    namaPaket: "",
    jenisPaket: "",
    nilaiPaket: "",
    metodePengadaan: "",
    status: "DRAFT" as Paket["status"],
  });
  const [editingPaket, setEditingPaket] = useState<Paket | null>(null);

  const { isOpen, openModal, closeModal } = useModal();

  // Fetch paket data from API
  useEffect(() => {
    fetchPakets();
  }, []);

  const fetchPakets = async () => {
    try {
      const response = await fetch('/api/paket');
      if (response.ok) {
        const data = await response.json();
        setPakets(data);
      }
    } catch (error) {
      console.error('Error fetching paket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const paketData = {
        kodePaket: formData.kodePaket,
        namaPaket: formData.namaPaket,
        jenisPaket: formData.jenisPaket,
        nilaiPaket: parseFloat(formData.nilaiPaket.replace(/[^\d]/g, '')),
        metodePengadaan: formData.metodePengadaan,
        createdBy: user?.id || '',
      };

      let response;
      if (editingPaket) {
        response = await fetch(`/api/paket/${editingPaket.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...paketData, updatedBy: user?.id }),
        });
      } else {
        response = await fetch('/api/paket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paketData),
        });
      }

      if (response.ok) {
        await fetchPakets();
        closeModal();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving paket:', error);
    }
  };

  const handleEdit = (paket: Paket) => {
    setEditingPaket(paket);
    setFormData({
      kodePaket: paket.kodePaket,
      namaPaket: paket.namaPaket,
      jenisPaket: paket.jenisPaket,
      nilaiPaket: paket.nilaiPaket.toString(),
      metodePengadaan: paket.metodePengadaan,
      status: paket.status,
    });
    openModal();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus paket ini?')) {
      try {
        const response = await fetch(`/api/paket/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          await fetchPakets();
        }
      } catch (error) {
        console.error('Error deleting paket:', error);
      }
    }
  };

  const handleUpload = (paketId: string) => {
    // Placeholder untuk modal upload
    alert(`Upload dokumen untuk paket ${paketId}`);
  };

  const resetForm = () => {
    setFormData({
      kodePaket: "",
      namaPaket: "",
      jenisPaket: "",
      nilaiPaket: "",
      metodePengadaan: "",
      status: "DRAFT",
    });
    setEditingPaket(null);
  };

  const openAddModal = () => {
    resetForm();
    openModal();
  };

  const filteredPakets = pakets.filter(
    (paket) =>
      paket.namaPaket.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paket.kodePaket.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paket.jenisPaket.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: Paket["status"]) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "ON_PROGRESS":
        return "warning";
      case "PUBLISHED":
        return "info";
      case "DRAFT":
        return "light";
      case "CANCELLED":
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
                    Jenis
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
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Dokumen
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Aksi
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
                      Rp {paket.nilaiPaket.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {paket.jenisPaket}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {paket.metodePengadaan}
                    </td>
                    <td className="px-6 py-4">
                      <Badge size="sm" color={getStatusColor(paket.status)}>
                        {paket.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {new Date(paket.tanggalBuat).toLocaleDateString('id-ID')}
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
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                        onClick={() => handleEdit(paket)}
                      >
                        <PencilIcon className="size-5" />
                      </button>
                      <button
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3"
                        onClick={() => handleUpload(paket.id)}
                      >
                        Upload
                      </button>
                      {user?.role === 'operator' && (
                        <button
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          onClick={() => handleDelete(paket.id)}
                        >
                          <TrashBinIcon className="size-5" />
                        </button>
                      )}
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
            {editingPaket ? 'Edit Paket Pengadaan' : 'Tambah Paket Pengadaan'}
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
                  value={formData.nilaiPaket}
                  onChange={(e) =>
                    setFormData({ ...formData, nilaiPaket: e.target.value })
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
              <Label>Jenis Paket</Label>
              <Select
                options={[
                  { value: "Konstruksi", label: "Konstruksi" },
                  { value: "Barang", label: "Barang" },
                  { value: "Jasa Konsultansi", label: "Jasa Konsultansi" },
                  { value: "Jasa Lainnya", label: "Jasa Lainnya" },
                ]}
                placeholder="Pilih jenis paket"
                onChange={(value) =>
                  setFormData({ ...formData, jenisPaket: value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Metode Pengadaan</Label>
                <Select
                  options={metodeOptions}
                  placeholder="Pilih metode"
                  onChange={(value) =>
                    setFormData({ ...formData, metodePengadaan: value })
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