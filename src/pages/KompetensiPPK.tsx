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

interface PPK {
  id: string;
  namaLengkap: string;
  nip: string;
  jabatan: string;
  unitKerja: string;
  kompetensi: any; // JSON
  sertifikasi: any; // JSON
  pengalaman: number;
  status: "AKTIF" | "NON_AKTIF" | "CUTI";
  createdAt: string;
}

export default function KompetensiPPK() {
  const [ppks, setPpks] = useState<PPK[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    namaLengkap: "",
    nip: "",
    jabatan: "",
    unitKerja: "",
    kompetensi: "",
    sertifikasi: "",
    pengalaman: "",
  });
  const [editingPPK, setEditingPPK] = useState<PPK | null>(null);

  const { isOpen, openModal, closeModal } = useModal();

  // Fetch PPK data from API
  useEffect(() => {
    fetchPPKs();
  }, []);

  const fetchPPKs = async () => {
    try {
      const response = await fetch('/api/ppk');
      if (response.ok) {
        const data = await response.json();
        setPpks(data);
      }
    } catch (error) {
      console.error('Error fetching PPKs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const ppkData = {
        namaLengkap: formData.namaLengkap,
        nip: formData.nip,
        jabatan: formData.jabatan,
        unitKerja: formData.unitKerja,
        kompetensi: JSON.parse(formData.kompetensi || '{}'),
        sertifikasi: JSON.parse(formData.sertifikasi || '{}'),
        pengalaman: parseInt(formData.pengalaman) || 0,
      };

      let response;
      if (editingPPK) {
        response = await fetch(`/api/ppk/${editingPPK.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ppkData),
        });
      } else {
        response = await fetch('/api/ppk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ppkData),
        });
      }

      if (response.ok) {
        await fetchPPKs();
        closeModal();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving PPK:', error);
    }
  };

  const handleEdit = (ppk: PPK) => {
    setEditingPPK(ppk);
    setFormData({
      namaLengkap: ppk.namaLengkap,
      nip: ppk.nip,
      jabatan: ppk.jabatan,
      unitKerja: ppk.unitKerja,
      kompetensi: JSON.stringify(ppk.kompetensi, null, 2),
      sertifikasi: JSON.stringify(ppk.sertifikasi, null, 2),
      pengalaman: ppk.pengalaman.toString(),
    });
    openModal();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus PPK ini?')) {
      try {
        const response = await fetch(`/api/ppk/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          await fetchPPKs();
        }
      } catch (error) {
        console.error('Error deleting PPK:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      namaLengkap: "",
      nip: "",
      jabatan: "",
      unitKerja: "",
      kompetensi: "",
      sertifikasi: "",
      pengalaman: "",
    });
    setEditingPPK(null);
  };

  const openAddModal = () => {
    resetForm();
    openModal();
  };

  const filteredPPKs = ppks.filter(
    (ppk) =>
      ppk.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ppk.nip.includes(searchQuery) ||
      ppk.jabatan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: PPK["status"]) => {
    switch (status) {
      case "AKTIF":
        return "success";
      case "NON_AKTIF":
        return "warning";
      case "CUTI":
        return "info";
      default:
        return "light";
    }
  };

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
                    Unit Kerja
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Pengalaman
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
                {filteredPPKs.map((ppk) => (
                  <tr
                    key={ppk.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                      {ppk.nip}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {ppk.namaLengkap}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {ppk.jabatan}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {ppk.unitKerja}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {ppk.pengalaman} tahun
                    </td>
                    <td className="px-6 py-4">
                      <Badge size="sm" color={getStatusColor(ppk.status)}>
                        {ppk.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <button
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                        onClick={() => handleEdit(ppk)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        onClick={() => handleDelete(ppk.id)}
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
            {editingPPK ? 'Edit PPK' : 'Tambah PPK'}
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
                <Label>Pengalaman (tahun)</Label>
                <Input
                  type="number"
                  value={formData.pengalaman}
                  onChange={(e) =>
                    setFormData({ ...formData, pengalaman: e.target.value })
                  }
                  placeholder="5"
                />
              </div>
            </div>

            <div>
              <Label>Nama Lengkap</Label>
              <Input
                type="text"
                value={formData.namaLengkap}
                onChange={(e) =>
                  setFormData({ ...formData, namaLengkap: e.target.value })
                }
                placeholder="Masukkan nama lengkap"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <Label>Unit Kerja</Label>
                <Input
                  type="text"
                  value={formData.unitKerja}
                  onChange={(e) =>
                    setFormData({ ...formData, unitKerja: e.target.value })
                  }
                  placeholder="Masukkan unit kerja"
                />
              </div>
            </div>

            <div>
              <Label>Kompetensi (JSON)</Label>
              <textarea
                className="w-full h-24 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                value={formData.kompetensi}
                onChange={(e) =>
                  setFormData({ ...formData, kompetensi: e.target.value })
                }
                placeholder='{"pengadaan": "tingkat III", "manajemen": "tingkat II"}'
              />
            </div>

            <div>
              <Label>Sertifikasi (JSON)</Label>
              <textarea
                className="w-full h-24 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                value={formData.sertifikasi}
                onChange={(e) =>
                  setFormData({ ...formData, sertifikasi: e.target.value })
                }
                placeholder='{"sertifikat_pengadaan": "2025-12-15", "sertifikat_manajemen": "2024-08-20"}'
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={closeModal}>
              Batal
            </Button>
            <Button size="sm" variant="primary" onClick={handleSubmit}>
              {editingPPK ? 'Update PPK' : 'Simpan PPK'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
