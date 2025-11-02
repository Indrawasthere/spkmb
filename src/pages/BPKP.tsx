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

interface Temuan {
  id: string;
  nomorTemuan: string;
  paketId: string;
  jenisTemuan: string;
  deskripsi: string;
  tingkatKeparahan: "RENDAH" | "SEDANG" | "TINGGI" | "KRITIS";
  status: "BARU" | "PROSES" | "SELESAI" | "DITUNDA";
  tanggal: string;
  auditor: string;
  pic: string;
  createdAt: string;
  updatedAt: string;
}

export default function BPKP() {
  const [temuans, setTemuans] = useState<Temuan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formData, setFormData] = useState({
    nomorTemuan: "",
    paketId: "",
    jenisTemuan: "",
    deskripsi: "",
    tingkatKeparahan: "" as Temuan["tingkatKeparahan"] | "",
    auditor: "",
    pic: "",
  });
  const [editingTemuan, setEditingTemuan] = useState<Temuan | null>(null);

  const { isOpen, openModal, closeModal } = useModal();

  // Fetch temuans data from API
  useEffect(() => {
    fetchTemuans();
  }, []);

  const fetchTemuans = async () => {
    try {
      const response = await fetch('/api/temuan-bpkp');
      if (response.ok) {
        const data = await response.json();
        setTemuans(data);
      }
    } catch (error) {
      console.error('Error fetching temuans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const temuanData = {
        nomorTemuan: formData.nomorTemuan,
        paketId: formData.paketId,
        jenisTemuan: formData.jenisTemuan,
        deskripsi: formData.deskripsi,
        tingkatKeparahan: formData.tingkatKeparahan,
        auditor: formData.auditor,
        pic: formData.pic,
        tanggal: new Date(),
      };

      let response;
      if (editingTemuan) {
        response = await fetch(`/api/temuan-bpkp/${editingTemuan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(temuanData),
        });
      } else {
        response = await fetch('/api/temuan-bpkp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(temuanData),
        });
      }

      if (response.ok) {
        await fetchTemuans();
        closeModal();
        resetForm();
        alert('Temuan berhasil disimpan!');
      } else {
        const errorText = await response.text();
        alert('Gagal menyimpan temuan: ' + errorText);
      }
    } catch (error) {
      console.error('Error saving temuan:', error);
      alert('Terjadi kesalahan saat menyimpan temuan');
    }
  };

  const handleEdit = (temuan: Temuan) => {
    setEditingTemuan(temuan);
    setFormData({
      nomorTemuan: temuan.nomorTemuan,
      paketId: temuan.paketId,
      jenisTemuan: temuan.jenisTemuan,
      deskripsi: temuan.deskripsi,
      tingkatKeparahan: temuan.tingkatKeparahan,
      auditor: temuan.auditor,
      pic: temuan.pic,
    });
    openModal();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus temuan ini?')) {
      try {
        const response = await fetch(`/api/temuan-bpkp/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          await fetchTemuans();
          alert('Temuan berhasil dihapus!');
        } else {
          const errorText = await response.text();
          alert('Gagal menghapus temuan: ' + errorText);
        }
      } catch (error) {
        console.error('Error deleting temuan:', error);
        alert('Terjadi kesalahan saat menghapus temuan');
      }
    }
  };

  const handleUpload = (id: string) => {
    // Placeholder untuk modal upload
    alert(`Upload dokumen untuk temuan ${id}`);
  };

  const resetForm = () => {
    setFormData({
      nomorTemuan: "",
      paketId: "",
      jenisTemuan: "",
      deskripsi: "",
      tingkatKeparahan: "",
      auditor: "",
      pic: "",
    });
    setEditingTemuan(null);
  };

  const openAddModal = () => {
    resetForm();
    openModal();
  };

  const filteredTemuans = temuans.filter((temuan) => {
    const matchSearch =
      temuan.nomorTemuan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      temuan.paketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      temuan.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter =
      filterStatus === "all" || temuan.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const getStatusColor = (status: Temuan["status"]) => {
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

  const getKeparahanColor = (keparahan: Temuan["tingkatKeparahan"]) => {
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

  const jenisTemuanOptions = [
    { value: "Administrasi", label: "Administrasi" },
    { value: "Teknis", label: "Teknis" },
    { value: "Keuangan", label: "Keuangan" },
    { value: "Waktu", label: "Waktu" },
    { value: "Kualitas", label: "Kualitas" },
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
      label: "Total Temuan",
      value: temuans.length,
      color: "text-brand-500",
    },
    {
      label: "Temuan Baru",
      value: temuans.filter((t) => t.status === "BARU").length,
      color: "text-blue-light-500",
    },
    {
      label: "Dalam Proses",
      value: temuans.filter((t) => t.status === "PROSES").length,
      color: "text-warning-500",
    },
    {
      label: "Selesai",
      value: temuans.filter((t) => t.status === "SELESAI").length,
      color: "text-success-500",
    },
  ];

  return (
    <>
      <PageMeta
        title="BPKP | SIP-KPBJ"
        description="Halaman BPKP untuk Pengawasan dan Audit"
      />
      <PageBreadcrumb pageTitle="BPKP" />

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
              Daftar Temuan Audit BPKP
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola temuan audit dan tindak lanjut rekomendasi
            </p>
          </div>
          <Button
            size="md"
            variant="primary"
            startIcon={<PlusIcon />}
            onClick={openModal}
          >
            Tambah Temuan
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Input
              type="text"
              placeholder="Cari temuan..."
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
                <option value="Baru">Baru</option>
                <option value="Proses">Proses</option>
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
                    No. Temuan
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
                {filteredTemuans.map((temuan) => (
                  <tr
                    key={temuan.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                      {temuan.nomorTemuan}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {temuan.paketId}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {temuan.jenisTemuan}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400 max-w-xs truncate">
                      {temuan.deskripsi}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        size="sm"
                        color={getKeparahanColor(temuan.tingkatKeparahan)}
                      >
                        {temuan.tingkatKeparahan}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge size="sm" color={getStatusColor(temuan.status)}>
                        {temuan.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {temuan.pic}
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
                        onClick={() => handleUpload(temuan.id)}
                      >
                        Upload
                      </button>
                      <button
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                        onClick={() => handleEdit(temuan)}
                      >
                        <PencilIcon className="size-5" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        onClick={() => handleDelete(temuan.id)}
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
            {editingTemuan ? 'Edit Temuan Audit' : 'Tambah Temuan Audit'}
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nomor Temuan</Label>
                <Input
                  type="text"
                  value={formData.nomorTemuan}
                  onChange={(e) =>
                    setFormData({ ...formData, nomorTemuan: e.target.value })
                  }
                  placeholder="TMN-2024-XXX"
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
                <Label>Jenis Temuan</Label>
                <Select
                  options={jenisTemuanOptions}
                  placeholder="Pilih jenis"
                  onChange={(value) =>
                    setFormData({ ...formData, jenisTemuan: value })
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
                      tingkatKeparahan: value as Temuan["tingkatKeparahan"],
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label>Deskripsi Temuan</Label>
              <TextArea
                rows={4}
                value={formData.deskripsi}
                onChange={(value) =>
                  setFormData({ ...formData, deskripsi: value })
                }
                placeholder="Jelaskan temuan audit secara detail..."
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
              Simpan Temuan
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
