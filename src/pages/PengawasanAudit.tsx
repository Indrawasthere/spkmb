import { useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import Badge from "../components/ui/badge/Badge";
import { PlusIcon } from "../icons";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import { useDebounce } from "../hooks/useDebounce";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import TextArea from "../components/form/input/TextArea";
import Select from "../components/form/Select";

const API_BASE_URL = 'http://localhost:3001';

interface Temuan {
  id: string;
  nomorTemuan: string;
  paket: string;
  jenisTemuan: string;
  deskripsi: string;
  tingkatKeparahan: "Rendah" | "Sedang" | "Tinggi" | "Kritis";
  status: "Baru" | "Proses" | "Selesai" | "Ditunda";
  tanggal: string;
  auditor: string;
  pic: string;
}

const initialTemuans: Temuan[] = [
  {
    id: "1",
    nomorTemuan: "TMN-2024-001",
    paket: "PKT-2024-001",
    jenisTemuan: "Administrasi",
    deskripsi: "Dokumen HPS tidak sesuai dengan ketentuan yang berlaku",
    tingkatKeparahan: "Sedang",
    status: "Proses",
    tanggal: "16 Jan 2024",
    auditor: "Ir. Bambang Sutrisno",
    pic: "Ahmad Subagja",
  },
  {
    id: "2",
    nomorTemuan: "TMN-2024-002",
    paket: "PKT-2024-002",
    jenisTemuan: "Teknis",
    deskripsi: "Spesifikasi teknis tidak sesuai dengan kebutuhan",
    tingkatKeparahan: "Tinggi",
    status: "Baru",
    tanggal: "21 Jan 2024",
    auditor: "Dr. Siti Rahayu",
    pic: "Siti Nurhaliza",
  },
  {
    id: "3",
    nomorTemuan: "TMN-2024-003",
    paket: "PKT-2024-003",
    jenisTemuan: "Keuangan",
    deskripsi: "Terdapat selisih antara nilai kontrak dengan realisasi",
    tingkatKeparahan: "Kritis",
    status: "Proses",
    tanggal: "11 Jan 2024",
    auditor: "Drs. Agus Santoso",
    pic: "Budi Santoso",
  },
  {
    id: "4",
    nomorTemuan: "TMN-2024-004",
    paket: "PKT-2024-001",
    jenisTemuan: "Waktu",
    deskripsi: "Keterlambatan penyelesaian pekerjaan 15 hari kalender",
    tingkatKeparahan: "Sedang",
    status: "Selesai",
    tanggal: "18 Jan 2024",
    auditor: "Ir. Bambang Sutrisno",
    pic: "Ahmad Subagja",
  },
];

export default function PengawasanAudit() {
  const [temuans, setTemuans] = useState<Temuan[]>(initialTemuans);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formData, setFormData] = useState({
    nomorTemuan: "",
    paket: "",
    jenisTemuan: "",
    deskripsi: "",
    tingkatKeparahan: "" as Temuan["tingkatKeparahan"] | "",
    pic: "",
  });
  const [editingTemuan, setEditingTemuan] = useState<Temuan | null>(null);

  const { isOpen, openModal, closeModal } = useModal();

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const resetForm = () => {
    setFormData({
      nomorTemuan: "",
      paket: "",
      jenisTemuan: "",
      deskripsi: "",
      tingkatKeparahan: "",
      pic: "",
    });
  };

  const fetchTemuan = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/temuan`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setTemuans(data);
      }
    } catch (error) {
      console.error('Error fetching temuans:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const temuanData = {
        nomorTemuan: formData.nomorTemuan,
        paket: formData.paket,
        jenisTemuan: formData.jenisTemuan,
        deskripsi: formData.deskripsi,
        tingkatKeparahan: formData.tingkatKeparahan || "Rendah",
        pic: formData.pic,
      };

      let response;
      if (editingTemuan) {
        response = await fetch(`${API_BASE_URL}/api/temuan/${editingTemuan.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(temuanData),
        });
      } else {
        response = await fetch(`${API_BASE_URL}/api/temuan`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(temuanData),
        });
      }

      if (response.ok) {
        await fetchTemuan();
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
    setFormData({
      nomorTemuan: temuan.nomorTemuan,
      paket: temuan.paket,
      jenisTemuan: temuan.jenisTemuan,
      deskripsi: temuan.deskripsi,
      tingkatKeparahan: temuan.tingkatKeparahan,
      pic: temuan.pic,
    });
    setEditingTemuan(temuan);
    openModal();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus temuan ini?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/temuan/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (response.ok) {
          await fetchTemuan();
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

  const filteredTemuans = temuans.filter((temuan) => {
    const matchSearch =
      temuan.nomorTemuan.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      temuan.paket.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      temuan.deskripsi.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    const matchFilter =
      filterStatus === "all" || temuan.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const getStatusColor = (status: Temuan["status"]) => {
    switch (status) {
      case "Selesai":
        return "success";
      case "Proses":
        return "warning";
      case "Baru":
        return "info";
      case "Ditunda":
        return "error";
      default:
        return "light";
    }
  };

  const getKeparahanColor = (keparahan: Temuan["tingkatKeparahan"]) => {
    switch (keparahan) {
      case "Kritis":
        return "error";
      case "Tinggi":
        return "warning";
      case "Sedang":
        return "info";
      case "Rendah":
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
    { value: "Rendah", label: "Rendah" },
    { value: "Sedang", label: "Sedang" },
    { value: "Tinggi", label: "Tinggi" },
    { value: "Kritis", label: "Kritis" },
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
      value: temuans.filter((t) => t.status === "Baru").length,
      color: "text-blue-light-500",
    },
    {
      label: "Dalam Proses",
      value: temuans.filter((t) => t.status === "Proses").length,
      color: "text-warning-500",
    },
    {
      label: "Selesai",
      value: temuans.filter((t) => t.status === "Selesai").length,
      color: "text-success-500",
    },
  ];

  return (
    <>
      <PageMeta
        title="Pengawasan & Audit - Sistem Pengawasan"
        description="Kelola temuan audit dan tindak lanjut"
      />
      <PageBreadcrumb pageTitle="Pengawasan & Audit" />

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
              Daftar Temuan Audit
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
                    PIC
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
                      {temuan.paket}
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
                        Edit
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        onClick={() => handleDelete(temuan.id)}
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
        title={editingTemuan ? "" : ""}
        showHeader={true}
      >
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
                  value={formData.paket}
                  onChange={(e) =>
                    setFormData({ ...formData, paket: e.target.value })
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