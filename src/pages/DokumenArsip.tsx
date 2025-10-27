import { useState, useEffect } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import Badge from "../components/ui/badge/Badge";
import { PlusIcon, DownloadIcon, PencilIcon, TrashBinIcon } from "../icons";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import Select from "../components/form/Select";

interface Dokumen {
  id: string;
  namaDokumen: string;
  jenisDokumen: string;
  paketId: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}

export default function DokumenArsip() {
  const [dokumens, setDokumens] = useState<Dokumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterJenis, setFilterJenis] = useState("all");
  const [formData, setFormData] = useState({
    namaDokumen: "",
    jenisDokumen: "",
    paketId: "",
    file: null as File | null,
  });
  const [editingDokumen, setEditingDokumen] = useState<Dokumen | null>(null);

  const { isOpen, openModal, closeModal } = useModal();

  // Fetch dokumen data from API
  useEffect(() => {
    fetchDokumens();
  }, []);

  const fetchDokumens = async () => {
    try {
      const response = await fetch('/api/dokumen');
      if (response.ok) {
        const data = await response.json();
        setDokumens(data);
      }
    } catch (error) {
      console.error('Error fetching dokumens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.file && !editingDokumen) {
      alert('Pilih file untuk diupload');
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('namaDokumen', formData.namaDokumen);
      formDataToSend.append('jenisDokumen', formData.jenisDokumen);
      formDataToSend.append('paketId', formData.paketId);
      if (formData.file) {
        formDataToSend.append('file', formData.file);
      }

      let response;
      if (editingDokumen) {
        response = await fetch(`/api/dokumen/${editingDokumen.id}`, {
          method: 'PUT',
          body: formDataToSend,
        });
      } else {
        response = await fetch('/api/dokumen', {
          method: 'POST',
          body: formDataToSend,
        });
      }

      if (response.ok) {
        await fetchDokumens();
        closeModal();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving dokumen:', error);
    }
  };

  const handleEdit = (dokumen: Dokumen) => {
    setEditingDokumen(dokumen);
    setFormData({
      namaDokumen: dokumen.namaDokumen,
      jenisDokumen: dokumen.jenisDokumen,
      paketId: dokumen.paketId,
      file: null,
    });
    openModal();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus dokumen ini?')) {
      try {
        const response = await fetch(`/api/dokumen/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          await fetchDokumens();
        }
      } catch (error) {
        console.error('Error deleting dokumen:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      namaDokumen: "",
      jenisDokumen: "",
      paketId: "",
      file: null,
    });
    setEditingDokumen(null);
  };

  const openAddModal = () => {
    resetForm();
    openModal();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, file });
  };

  const filteredDokumens = dokumens.filter((doc) => {
    const matchSearch =
      doc.namaDokumen.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.paketId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter =
      filterJenis === "all" || doc.jenisDokumen === filterJenis;
    return matchSearch && matchFilter;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
      label: "Total Ukuran",
      value: dokumens.length > 0 ? formatFileSize(dokumens.reduce((sum, d) => sum + d.fileSize, 0)) : "0 Bytes",
      color: "text-blue-light-500",
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
                      {doc.paketId}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {doc.uploadedBy}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {new Date(doc.uploadedAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4">
                      <Badge size="sm" color="info">
                        Uploaded
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {formatFileSize(doc.fileSize)}
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
            {editingDokumen ? 'Edit Dokumen' : 'Upload Dokumen'}
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
                value={formData.paketId}
                onChange={(e) =>
                  setFormData({ ...formData, paketId: e.target.value })
                }
                placeholder="PKT-2024-XXX"
              />
            </div>

            <div>
              <Label>File Dokumen</Label>
              <input
                type="file"
                onChange={handleFileChange}
                className="focus:border-ring-brand-300 h-11 w-full overflow-hidden rounded-lg border border-gray-300 bg-transparent text-sm text-gray-500 shadow-theme-xs transition-colors file:mr-5 file:border-collapse file:cursor-pointer file:rounded-l-lg file:border-0 file:border-r file:border-solid file:border-gray-200 file:bg-gray-50 file:py-3 file:pl-3.5 file:pr-3 file:text-sm file:text-gray-700 placeholder:text-gray-400 hover:file:bg-gray-100 focus:outline-none focus:file:ring-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:text-white/90 dark:file:border-gray-800 dark:file:bg-white/[0.03] dark:file:text-gray-400 dark:placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={closeModal}>
              Batal
            </Button>
            <Button size="sm" variant="primary" onClick={handleSubmit}>
              {editingDokumen ? 'Update' : 'Upload'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}