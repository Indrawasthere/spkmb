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

interface LaporanItwasda {
  id: string;
  nomorLaporan: string;
  paketId: string;
  jenisLaporan: string;
  deskripsi: string;
  tingkatKeparahan: "RENDAH" | "SEDANG" | "TINGGI" | "KRITIS";
  status: "BARU" | "PROSES" | "SELESAI" | "DITUNDA";
  tanggal: string;
  auditor: string;
  pic: string;
  createdAt: string;
  updatedAt: string;
}

export default function Itwasda() {
  const [laporan, setLaporan] = useState<LaporanItwasda[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formData, setFormData] = useState({
    nomorLaporan: "",
    paketId: "",
    jenisLaporan: "",
    deskripsi: "",
    tingkatKeparahan: "" as LaporanItwasda["tingkatKeparahan"] | "",
    auditor: "",
    pic: "",
  });
  const [editingLaporan, setEditingLaporan] = useState<LaporanItwasda | null>(null);

  const { isOpen, openModal, closeModal } = useModal();

  // Fetch laporan data from API
  useEffect(() => {
    fetchLaporan();
  }, []);

  const fetchLaporan = async () => {
    try {
      const response = await fetch('/api/laporan-itwasda');
      if (response.ok) {
        const data = await response.json();
        setLaporan(data);
      }
    } catch (error) {
      console.error('Error fetching laporan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const laporanData = {
        nomorLaporan: formData.nomorLaporan,
        paketId: formData.paketId,
        jenisLaporan: formData.jenisLaporan,
        deskripsi: formData.deskripsi,
        tingkatKeparahan: formData.tingkatKeparahan,
        auditor: formData.auditor,
        pic: formData.pic,
        tanggal: new Date(),
      };

      let response;
      if (editingLaporan) {
        response = await fetch(`/api/laporan-itwasda/${editingLaporan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(laporanData),
        });
      } else {
        response = await fetch('/api/laporan-itwasda', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(laporanData),
        });
      }

      if (response.ok) {
        await fetchLaporan();
        closeModal();
        resetForm();
        alert('Laporan berhasil disimpan!');
      } else {
        const errorText = await response.text();
        alert('Gagal menyimpan laporan: ' + errorText);
      }
    } catch (error) {
      console.error('Error saving laporan:', error);
      alert('Terjadi kesalahan saat menyimpan laporan');
    }
  };

  const handleEdit = (laporan: LaporanItwasda) => {
    setEditingLaporan(laporan);
    setFormData({
      nomorLaporan: laporan.nomorLaporan,
      paketId: laporan.paketId,
      jenisLaporan: laporan.jenisLaporan,
      deskripsi: laporan.deskripsi,
      tingkatKeparahan: laporan.tingkatKeparahan,
      auditor: laporan.auditor,
      pic: laporan.pic,
    });
    openModal();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus laporan ini?')) {
      try {
        const response = await fetch(`/api/laporan-itwasda/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          await fetchLaporan();
          alert('Laporan berhasil dihapus!');
        } else {
          const errorText = await response.text();
          alert('Gagal menghapus laporan: ' + errorText);
        }
      } catch (error) {
        console.error('Error deleting laporan:', error);
        alert('Terjadi kesalahan saat menghapus laporan');
      }
    }
  };

  const handleUpload = (id: string) => {
    // Placeholder untuk modal upload
    alert(`Upload dokumen untuk laporan ${id}`);
  };

  const resetForm = () => {
    setFormData({
      nomorLaporan: "",
      paketId: "",
      jenisLaporan: "",
      deskripsi: "",
      tingkatKeparahan: "",
      auditor: "",
      pic: "",
    });
    setEditingLaporan(null);
  };

  const openAddModal = () => {
    resetForm();
    openModal();
  };

  const filteredLaporan = laporan.filter((l) => {
    const matchSearch =
      l.nomorLaporan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.paketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = filterStatus === "all" || l.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const getStatusColor = (status: LaporanItwasda["status"]) => {
    switch (status) {
      case "SELESAI":
        return "success";
      case "PROSES":
        return "warning";
      case "BARU":
        return "info";
      case "DITUNDA":
        return "error";
      default:
        return "light";
    }
  };

  const getKeparahanColor = (keparahan: LaporanItwasda["tingkatKeparahan"]) => {
    switch (keparahan) {
      case "KRITIS":
        return "error";
      case "TINGGI":
        return "warning";
      case "SEDANG":
        return "info";
      case "RENDAH":
        return "success";
      default:
        return "light";
    }
  };

  const jenisLaporanOptions = [
    { value: "Inspeksi Teknis", label: "Inspeksi Teknis" },
    { value: "Wawasan Audit", label: "Wawasan Audit" },
    { value: "Supervisi", label: "Supervisi" },
    { value: "Evaluasi", label: "Evaluasi" },
    { value: "Monitoring", label: "Monitoring" },
  ];

  const keparahanOptions = [
    { value: "RENDAH", label: "Rendah" },
    { value: "SEDANG", label: "Sedang" },
    { value: "TINGGI", label: "Tinggi" },
    { value: "KRITIS", label: "Kritis" },
  ];

  // Stats Cards
  const stats = [
    {
      label: "Total Laporan",
      value: laporan.length,
      color: "text-brand-500",
    },
    {
      label: "Laporan Baru",
      value: laporan.filter((l) => l.status === "BARU").length,
      color: "text-blue-light-500",
    },
    {
      label: "Dalam Proses",
      value: laporan.filter((l) => l.status === "PROSES").length,
      color: "text-warning-500",
    },
    {
      label: "Selesai",
      value: laporan.filter((l) => l.status === "SELESAI").length,
      color: "text-success-500",
    },
  ];

  return (
    <>
      <PageMeta
        title="Itwasda | SIP-KPBJ"
        description="Halaman Itwasda untuk Pengawasan dan Audit"
      />
      <PageBreadcrumb pageTitle="Itwasda" />

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
              Daftar Laporan Itwasda
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola laporan inspeksi teknis, wawasan audit, dan supervisi
            </p>
          </div>
          <Button
            size="md"
            variant="primary"
            startIcon={<PlusIcon />}
            onClick={openModal}
          >
            Tambah Laporan
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Input
              type="text"
              placeholder="Cari laporan..."
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
                <option value="BARU">Baru</option>
                <option value="PROSES">Proses</option>
                <option value="SELESAI">Selesai</option>
                <option value="DITUNDA">Ditunda</option>
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
                    No. Laporan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Paket
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Jenis
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Deskripsi
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Keparahan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Status
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
                {filteredLaporan.map((l) => (
                  <tr
                    key={l.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                      {l.nomorLaporan}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {l.paketId}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {l.jenisLaporan}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400 max-w-xs truncate">
                      {l.deskripsi}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        size="sm"
                        color={getKeparahanColor(l.tingkatKeparahan)}
                      >
                        {l.tingkatKeparahan}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge size="sm" color={getStatusColor(l.status)}>
                        {l.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {l.pic}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {/* Placeholder untuk list dokumen */}
                      <div className="space-y-1">
                        <span className="text-xs">Dokumen terkait: 1 file</span>
                        <button className="text-blue-600 hover:text-blue-900 text-xs">
                          Lihat Dokumen
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <button
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3"
                        onClick={() => handleUpload(l.id)}
                      >
                        Upload
                      </button>
                      <button
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                        onClick={() => handleEdit(l)}
                      >
                        <PencilIcon className="size-5" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        onClick={() => handleDelete(l.id)}
                      >
                        <TrashBinIcon className="size-5" />
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
            {editingLaporan ? 'Edit Laporan Itwasda' : 'Tambah Laporan Itwasda'}
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nomor Laporan</Label>
                <Input
                  type="text"
                  value={formData.nomorLaporan}
                  onChange={(e) =>
                    setFormData({ ...formData, nomorLaporan: e.target.value })
                  }
                  placeholder="ITW-2024-XXX"
                />
              </div>
              <div>
                <Label>Kode Paket</Label>
                <Input
                  type="text"
                  value={formData.paketId}
                  onChange={(e) =>
                    setFormData({ ...formData, paketId: e.target.value })
                  }
                  placeholder="PKT-2024-XXX"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Jenis Laporan</Label>
                <Select
                  options={jenisLaporanOptions}
                  placeholder="Pilih jenis"
                  onChange={(value) =>
                    setFormData({ ...formData, jenisLaporan: value })
                  }
                />
              </div>
              <div>
                <Label>Tingkat Keparahan</Label>
                <Select
                  options={keparahanOptions}
                  placeholder="Pilih keparahan"
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      tingkatKeparahan: value as LaporanItwasda["tingkatKeparahan"],
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label>Deskripsi Laporan</Label>
              <TextArea
                rows={4}
                value={formData.deskripsi}
                onChange={(value) =>
                  setFormData({ ...formData, deskripsi: value })
                }
                placeholder="Jelaskan laporan inspeksi teknis secara detail..."
              />
            </div>

            <div>
              <Label>PIC (Person in Charge)</Label>
              <Input
                type="text"
                value={formData.pic}
                onChange={(e) =>
                  setFormData({ ...formData, pic: e.target.value })
                }
                placeholder="Nama penanggung jawab"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={closeModal}>
              Batal
            </Button>
            <Button size="sm" variant="primary" onClick={handleSubmit}>
              Simpan Laporan
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
