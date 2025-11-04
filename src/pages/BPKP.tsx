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

const API_BASE_URL = "https://4bnmj0s4-3001.asse.devtunnels.ms";

interface Temuan {
  id: string;
  nomorTemuan: string;
  paketId: string | null;
  jenisTemuan: string;
  deskripsi: string;
  tingkatKeparahan: "RENDAH" | "SEDANG" | "TINGGI" | "KRITIS";
  status: "BARU" | "PROSES" | "SELESAI" | "DITUNDA";
  tanggal: string;
  auditor: string;
  pic: string;
  createdAt: string;
  updatedAt: string;
  paket?: {
    kodePaket: string;
    namaPaket: string;
    status: string;
  };
}

interface Paket {
  id: string;
  kodePaket: string;
  namaPaket: string;
  status: string;
  laporan?: LaporanItwasda[];
}

interface LaporanItwasda {
  id: string;
  paketId: string;
  status: string;
}

interface FormErrors {
  nomorTemuan?: string;
  paketId?: string;
  jenisTemuan?: string;
  deskripsi?: string;
  tingkatKeparahan?: string;
  auditor?: string;
  pic?: string;
}

export default function BPKP() {
  const [temuans, setTemuans] = useState<Temuan[]>([]);
  const [pakets, setPakets] = useState<Paket[]>([]);
  const [laporanItwasda, setLaporanItwasda] = useState<LaporanItwasda[]>([]);
  const [eligiblePakets, setEligiblePakets] = useState<Paket[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formData, setFormData] = useState({
    nomorTemuan: "",
    paketId: "" as string | null,
    jenisTemuan: "",
    deskripsi: "",
    tingkatKeparahan: "" as Temuan["tingkatKeparahan"] | "",
    auditor: "",
    pic: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [editingTemuan, setEditingTemuan] = useState<Temuan | null>(null);

  const { isOpen, openModal, closeModal } = useModal();

  useEffect(() => {
    fetchTemuans();
    fetchPakets();
    fetchLaporanItwasda();
  }, []);

  useEffect(() => {
    // Filter paket yang eligible untuk temuan BPKP
    // Hanya paket yang sudah punya laporan Itwasda
    const eligible = pakets.filter((paket) => {
      const hasLaporanItwasda = laporanItwasda.some(
        (l) => l.paketId === paket.id
      );
      return hasLaporanItwasda;
    });
    setEligiblePakets(eligible);
  }, [pakets, laporanItwasda]);

  const fetchTemuans = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/temuan-bpkp`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setTemuans(data);
      }
    } catch (error) {
      console.error("Error fetching temuans:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPakets = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/paket`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setPakets(data);
      }
    } catch (error) {
      console.error("Error fetching pakets:", error);
    }
  };

  const fetchLaporanItwasda = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/laporan-itwasda`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setLaporanItwasda(data);
      }
    } catch (error) {
      console.error("Error fetching laporan itwasda:", error);
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.nomorTemuan.trim()) {
      errors.nomorTemuan = "Nomor temuan wajib diisi";
    }

    if (!formData.jenisTemuan) {
      errors.jenisTemuan = "Jenis temuan wajib dipilih";
    }

    if (!formData.deskripsi.trim()) {
      errors.deskripsi = "Deskripsi wajib diisi";
    }

    if (!formData.tingkatKeparahan) {
      errors.tingkatKeparahan = "Tingkat keparahan wajib dipilih";
    }

    if (!formData.auditor.trim()) {
      errors.auditor = "Nama auditor wajib diisi";
    }

    if (!formData.pic.trim()) {
      errors.pic = "PIC wajib diisi";
    }

    // Validate paket eligibility - optional but must have Itwasda report if provided
    if (formData.paketId) {
      const hasLaporanItwasda = laporanItwasda.some(
        (l) => l.paketId === formData.paketId
      );
      if (!hasLaporanItwasda) {
        errors.paketId =
          "Paket yang dipilih belum memiliki laporan Itwasda. Temuan BPKP hanya bisa dibuat untuk paket yang sudah memiliki laporan Itwasda.";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const temuanData = {
        nomorTemuan: formData.nomorTemuan.trim(),
        paketId: formData.paketId || null,
        jenisTemuan: formData.jenisTemuan,
        deskripsi: formData.deskripsi.trim(),
        tingkatKeparahan: formData.tingkatKeparahan,
        auditor: formData.auditor.trim(),
        pic: formData.pic.trim(),
      };

      let response;
      if (editingTemuan) {
        response = await fetch(
          `${API_BASE_URL}/api/temuan-bpkp/${editingTemuan.id}`,
          {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(temuanData),
          }
        );
      } else {
        response = await fetch(`${API_BASE_URL}/api/temuan-bpkp`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(temuanData),
        });
      }

      if (response.ok) {
        await fetchTemuans();
        closeModal();
        resetForm();
        alert("Temuan berhasil disimpan!");
      } else {
        const errorData = await response.json();
        alert(
          "Gagal menyimpan temuan: " + (errorData.error || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error saving temuan:", error);
      alert("Terjadi kesalahan saat menyimpan temuan");
    } finally {
      setLoading(false);
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
    setFormErrors({});
    openModal();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus temuan ini?")) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/temuan-bpkp/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        await fetchTemuans();
        alert("Temuan berhasil dihapus!");
      } else {
        const errorData = await response.json();
        alert(
          "Gagal menghapus temuan: " + (errorData.error || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error deleting temuan:", error);
      alert("Terjadi kesalahan saat menghapus temuan");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = (id: string) => {
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
    setFormErrors({});
    setEditingTemuan(null);
  };

  const openAddModal = () => {
    if (eligiblePakets.length === 0) {
      alert(
        "Tidak ada paket yang eligible untuk temuan BPKP. Paket harus memiliki laporan Itwasda terlebih dahulu. Anda masih bisa membuat temuan tanpa paket."
      );
    }
    resetForm();
    openModal();
  };

  const filteredTemuans = temuans.filter((temuan) => {
    const matchSearch =
      temuan.nomorTemuan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (temuan.paketId &&
        temuan.paketId.toLowerCase().includes(searchQuery.toLowerCase())) ||
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

  const paketOptions = [
    { value: "", label: "Tidak terkait paket (optional)" },
    ...eligiblePakets.map((paket) => ({
      value: paket.id,
      label: `${paket.kodePaket} - ${paket.namaPaket}`,
    })),
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
        {/* Info Alert */}
        {eligiblePakets.length === 0 && (
          <div className="rounded-lg border border-info-300 bg-info-50 p-4 dark:border-info-800 dark:bg-info-900/20">
            <p className="text-sm text-info-800 dark:text-info-200">
              ℹ️ Tidak ada paket dengan laporan Itwasda. Temuan BPKP dapat
              dibuat tanpa paket, atau tunggu hingga ada laporan Itwasda yang
              dibuat untuk paket tertentu.
            </p>
          </div>
        )}

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
            onClick={openAddModal}
            disabled={loading}
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
          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : filteredTemuans.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Tidak ada temuan ditemukan
            </div>
          ) : (
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
                      Auditor
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
                        {temuan.paket ? (
                          <div>
                            <p className="font-medium">
                              {temuan.paket.kodePaket}
                            </p>
                            <p className="text-xs text-gray-500">
                              {temuan.paket.namaPaket}
                            </p>
                          </div>
                        ) : (
                          <Badge size="sm" color="light">
                            Tidak terkait
                          </Badge>
                        )}
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
                        {temuan.auditor}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                        {temuan.pic}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            className="text-green-600 hover:text-green-900 dark:text-green-400"
                            onClick={() => handleUpload(temuan.id)}
                            disabled={loading}
                            title="Upload"
                          >
                            Upload
                          </button>
                          <button
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                            onClick={() => handleEdit(temuan)}
                            disabled={loading}
                            title="Edit"
                          >
                            <PencilIcon className="size-5" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900 dark:text-red-400"
                            onClick={() => handleDelete(temuan.id)}
                            disabled={loading}
                            title="Hapus"
                          >
                            <TrashBinIcon className="size-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
        <div className="flex flex-col max-h-[80vh] overflow-y-auto px-6 py-4 space-y-4">
          <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            {editingTemuan ? "Edit Temuan Audit" : "Tambah Temuan Audit"}
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nomor Temuan *</Label>
                <Input
                  type="text"
                  value={formData.nomorTemuan}
                  onChange={(e) =>
                    setFormData({ ...formData, nomorTemuan: e.target.value })
                  }
                  placeholder="TMN-2024-XXX"
                  error={!!formErrors.nomorTemuan}
                  hint={formErrors.nomorTemuan}
                />
              </div>
              <div>
                <Label>Paket (Optional)</Label>
                <Select
                  options={paketOptions}
                  placeholder="Pilih paket"
                  onChange={(value) =>
                    setFormData({ ...formData, paketId: value || null })
                  }
                  defaultValue={formData.paketId || ""}
                />
                {formErrors.paketId && (
                  <p className="mt-1 text-xs text-error-500">
                    {formErrors.paketId}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Hanya paket dengan laporan Itwasda yang ditampilkan
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Jenis Temuan *</Label>
                <Select
                  options={jenisTemuanOptions}
                  placeholder="Pilih jenis"
                  onChange={(value) =>
                    setFormData({ ...formData, jenisTemuan: value })
                  }
                  defaultValue={formData.jenisTemuan}
                />
                {formErrors.jenisTemuan && (
                  <p className="mt-1 text-xs text-error-500">
                    {formErrors.jenisTemuan}
                  </p>
                )}
              </div>
              <div>
                <Label>Tingkat Keparahan *</Label>
                <Select
                  options={keparahanOptions}
                  placeholder="Pilih keparahan"
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      tingkatKeparahan: value as Temuan["tingkatKeparahan"],
                    })
                  }
                  defaultValue={formData.tingkatKeparahan}
                />
                {formErrors.tingkatKeparahan && (
                  <p className="mt-1 text-xs text-error-500">
                    {formErrors.tingkatKeparahan}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label>Deskripsi Temuan *</Label>
              <TextArea
                rows={4}
                value={formData.deskripsi}
                onChange={(value) =>
                  setFormData({ ...formData, deskripsi: value })
                }
                placeholder="Jelaskan temuan audit secara detail..."
                error={!!formErrors.deskripsi}
                hint={formErrors.deskripsi}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Auditor *</Label>
                <Input
                  type="text"
                  value={formData.auditor}
                  onChange={(e) =>
                    setFormData({ ...formData, auditor: e.target.value })
                  }
                  placeholder="Nama auditor"
                  error={!!formErrors.auditor}
                  hint={formErrors.auditor}
                />
              </div>
              <div>
                <Label>PIC (Person in Charge) *</Label>
                <Input
                  type="text"
                  value={formData.pic}
                  onChange={(e) =>
                    setFormData({ ...formData, pic: e.target.value })
                  }
                  placeholder="Nama penanggung jawab"
                  error={!!formErrors.pic}
                  hint={formErrors.pic}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={closeModal}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Menyimpan..." : "Simpan Temuan"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
