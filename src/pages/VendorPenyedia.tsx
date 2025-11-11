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

interface Vendor {
  id: string;
  namaVendor: string;
  jenisVendor: "KONSULTAN_PERENCANAAN" | "KONSULTAN_PENGAWAS" | "KONSTRUKSI";
  nomorIzin: string;
  spesialisasi: string | null;
  jumlahProyek: number;
  rating: number | null;
  status: "AKTIF" | "NON_AKTIF" | "SUSPENDED";
  kontak: string | null;
  alamat: string | null;
  paketId?: string;
  noKontrak?: string;
  deskripsi?: string;
  dokumenDED?: string;
  lamaKontrak?: number;
  warningTemuan?: boolean;
  namaProyek?: string;
  deskripsiLaporan?: string;
  dokumenLaporan?: string;
  deskripsiProgress?: string;
  uploadDokumen?: string;
  uploadFoto?: string;
  createdAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function VendorPenyedia() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formData, setFormData] = useState({
    namaVendor: "",
    jenisVendor: "KONSTRUKSI" as Vendor["jenisVendor"],
    nomorIzin: "",
    spesialisasi: "",
    kontak: "",
    alamat: "",
    paketId: "",
    noKontrak: "",
    deskripsi: "",
    dokumenDED: null as File | null,
    lamaKontrak: "",
    namaProyek: "",
    deskripsiLaporan: "",
    dokumenLaporan: null as File | null,
    deskripsiProgress: "",
    uploadDokumen: null as File | null,
    uploadFoto: null as File | null,
  });
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  const { isOpen, openModal, closeModal } = useModal();

  // Fetch vendor data from API
  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendor`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setVendors(data);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('namaVendor', formData.namaVendor);
      formDataToSend.append('jenisVendor', formData.jenisVendor);
      formDataToSend.append('nomorIzin', formData.nomorIzin);
      formDataToSend.append('spesialisasi', formData.spesialisasi || '');
      formDataToSend.append('kontak', formData.kontak || '');
      formDataToSend.append('alamat', formData.alamat || '');
      formDataToSend.append('paketId', formData.paketId || '');
      formDataToSend.append('noKontrak', formData.noKontrak || '');
      formDataToSend.append('deskripsi', formData.deskripsi || '');
      formDataToSend.append('lamaKontrak', formData.lamaKontrak || '');
      formDataToSend.append('namaProyek', formData.namaProyek || '');
      formDataToSend.append('deskripsiLaporan', formData.deskripsiLaporan || '');
      formDataToSend.append('deskripsiProgress', formData.deskripsiProgress || '');

      if (formData.dokumenDED) formDataToSend.append('dokumenDED', formData.dokumenDED);
      if (formData.dokumenLaporan) formDataToSend.append('dokumenLaporan', formData.dokumenLaporan);
      if (formData.uploadDokumen) formDataToSend.append('uploadDokumen', formData.uploadDokumen);
      if (formData.uploadFoto) formDataToSend.append('uploadFoto', formData.uploadFoto);

      let response;
      if (editingVendor) {
        response = await fetch(`${API_BASE_URL}/api/vendor/${editingVendor.id}`, {
          method: 'PUT',
          credentials: 'include',
          body: formDataToSend,
        });
      } else {
        response = await fetch(`${API_BASE_URL}/api/vendor`, {
          method: 'POST',
          credentials: 'include',
          body: formDataToSend,
        });
      }

      if (response.ok) {
        await fetchVendors();
        closeModal();
        resetForm();
        alert('Vendor berhasil disimpan!');
      } else {
        const errorText = await response.text();
        alert('Gagal menyimpan vendor: ' + errorText);
      }
    } catch (error) {
      console.error('Error saving vendor:', error);
      alert('Terjadi kesalahan saat menyimpan vendor');
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      namaVendor: vendor.namaVendor,
      jenisVendor: vendor.jenisVendor,
      nomorIzin: vendor.nomorIzin,
      spesialisasi: vendor.spesialisasi || "",
      kontak: vendor.kontak || "",
      alamat: vendor.alamat || "",
      paketId: vendor.paketId || "",
      noKontrak: vendor.noKontrak || "",
      deskripsi: vendor.deskripsi || "",
      dokumenDED: null,
      lamaKontrak: vendor.lamaKontrak?.toString() || "",
      namaProyek: vendor.namaProyek || "",
      deskripsiLaporan: vendor.deskripsiLaporan || "",
      dokumenLaporan: null,
      deskripsiProgress: vendor.deskripsiProgress || "",
      uploadDokumen: null,
      uploadFoto: null,
    });
    openModal();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus vendor ini?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/vendor/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (response.ok) {
          await fetchVendors();
          alert('Vendor berhasil dihapus!');
        } else {
          const errorText = await response.text();
          alert('Gagal menghapus vendor: ' + errorText);
        }
      } catch (error) {
        console.error('Error deleting vendor:', error);
        alert('Terjadi kesalahan saat menghapus vendor');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      namaVendor: "",
      jenisVendor: "KONSTRUKSI",
      nomorIzin: "",
      spesialisasi: "",
      kontak: "",
      alamat: "",
      paketId: "",
      noKontrak: "",
      deskripsi: "",
      dokumenDED: null,
      lamaKontrak: "",
      namaProyek: "",
      deskripsiLaporan: "",
      dokumenLaporan: null,
      deskripsiProgress: "",
      uploadDokumen: null,
      uploadFoto: null,
    });
    setEditingVendor(null);
  };

  const openAddModal = () => {
    resetForm();
    openModal();
  };

  const filteredVendors = vendors.filter((vendor) => {
    const matchSearch =
      vendor.namaVendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.nomorIzin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.jenisVendor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter =
      filterStatus === "all" || vendor.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const getStatusColor = (status: Vendor["status"]) => {
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

  const renderStars = (rating: number) => {
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
      label: "Total Vendor",
      value: vendors.length,
      color: "text-brand-500",
    },
    {
      label: "Vendor Aktif",
      value: vendors.filter((v) => v.status === "AKTIF").length,
      color: "text-success-500",
    },
    {
      label: "Suspended",
      value: vendors.filter((v) => v.status === "SUSPENDED").length,
      color: "text-error-500",
    },
    {
      label: "Total Proyek",
      value: vendors.reduce((acc, v) => acc + v.jumlahProyek, 0),
      color: "text-blue-light-500",
    },
  ];

  return (
    <>
      <PageMeta
        title="SIPAKAT-PBJ - Vendor / Penyedia"
        description="Kelola database vendor dan penyedia jasa"
      />
      <PageBreadcrumb pageTitle="Vendor / Penyedia" />

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
              Database Vendor
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola data vendor dan evaluasi kinerja
            </p>
          </div>
          <Button
            size="md"
            variant="primary"
            startIcon={<PlusIcon />}
            onClick={openModal}
          >
            Tambah Vendor
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Input
              type="text"
              placeholder="Cari vendor..."
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
                <option value="AKTIF">Aktif</option>
                <option value="NON_AKTIF">Nonaktif</option>
                <option value="SUSPENDED">Suspended</option>
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
                    Nama Perusahaan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    No. Izin
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Jenis Vendor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Rating
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Proyek
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Kontak
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredVendors.map((vendor) => (
                  <tr
                    key={vendor.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                      <div>
                        <p>{vendor.namaVendor}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {vendor.alamat}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {vendor.nomorIzin}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {vendor.jenisVendor.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4">{vendor.rating ? renderStars(vendor.rating) : '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {vendor.jumlahProyek} proyek
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Badge size="sm" color={getStatusColor(vendor.status)}>
                          {vendor.status}
                        </Badge>
                        {vendor.warningTemuan && (
                          <Badge size="sm" color="error">
                            Warning
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {vendor.kontak}
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
        title={editingVendor ? "" : ""}
        showHeader={true}
      >
        <div className="p-6">
          <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            {editingVendor ? 'Edit Vendor' : 'Tambah Vendor Baru'}
          </h3>

          <div className="space-y-4">
            <div>
              <Label>Nama Vendor</Label>
              <Input
                type="text"
                value={formData.namaVendor}
                onChange={(e) =>
                  setFormData({ ...formData, namaVendor: e.target.value })
                }
                placeholder="PT/CV Nama Vendor"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Jenis Vendor</Label>
                <Select
                  options={[
                    { value: "KONSTRUKSI", label: "Konstruksi" },
                    { value: "KONSULTAN_PERENCANAAN", label: "Konsultan Perencanaan" },
                    { value: "KONSULTAN_PENGAWAS", label: "Konsultan Pengawas" },
                  ]}
                  placeholder="Pilih jenis vendor"
                  onChange={(value) =>
                    setFormData({ ...formData, jenisVendor: value as Vendor["jenisVendor"] })
                  }
                />
              </div>
              <div>
                <Label>Nomor Izin</Label>
                <Input
                  type="text"
                  value={formData.nomorIzin}
                  onChange={(e) =>
                    setFormData({ ...formData, nomorIzin: e.target.value })
                  }
                  placeholder="Nomor izin vendor"
                />
              </div>
            </div>

            <div>
              <Label>Spesialisasi</Label>
              <Input
                type="text"
                value={formData.spesialisasi}
                onChange={(e) =>
                  setFormData({ ...formData, spesialisasi: e.target.value })
                }
                placeholder="Spesialisasi vendor"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                  placeholder="email@vendor.com"
                />
              </div>
            </div>

            <div>
              <Label>Paket ID</Label>
              <Input
                type="text"
                value={formData.paketId}
                onChange={(e) =>
                  setFormData({ ...formData, paketId: e.target.value })
                }
                placeholder="ID Paket terkait"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>No Kontrak</Label>
                <Input
                  type="text"
                  value={formData.noKontrak}
                  onChange={(e) =>
                    setFormData({ ...formData, noKontrak: e.target.value })
                  }
                  placeholder="Nomor kontrak"
                />
              </div>
              <div>
                <Label>Lama Kontrak (bulan)</Label>
                <Input
                  type="number"
                  value={formData.lamaKontrak}
                  onChange={(e) =>
                    setFormData({ ...formData, lamaKontrak: e.target.value })
                  }
                  placeholder="Durasi kontrak"
                />
              </div>
            </div>

            <div>
              <Label>Deskripsi</Label>
              <textarea
                className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.deskripsi}
                onChange={(e) =>
                  setFormData({ ...formData, deskripsi: e.target.value })
                }
                placeholder="Deskripsi vendor"
              />
            </div>

            <div>
              <Label>Nama Proyek</Label>
              <Input
                type="text"
                value={formData.namaProyek}
                onChange={(e) =>
                  setFormData({ ...formData, namaProyek: e.target.value })
                }
                placeholder="Nama proyek terkait"
              />
            </div>

            <div>
              <Label>Deskripsi Laporan</Label>
              <textarea
                className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.deskripsiLaporan}
                onChange={(e) =>
                  setFormData({ ...formData, deskripsiLaporan: e.target.value })
                }
                placeholder="Deskripsi laporan"
              />
            </div>

            <div>
              <Label>Deskripsi Progress</Label>
              <textarea
                className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.deskripsiProgress}
                onChange={(e) =>
                  setFormData({ ...formData, deskripsiProgress: e.target.value })
                }
                placeholder="Deskripsi progress"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Dokumen DED</Label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) =>
                    setFormData({ ...formData, dokumenDED: e.target.files?.[0] || null })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <Label>Dokumen Laporan</Label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) =>
                    setFormData({ ...formData, dokumenLaporan: e.target.files?.[0] || null })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Upload Dokumen</Label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  onChange={(e) =>
                    setFormData({ ...formData, uploadDokumen: e.target.files?.[0] || null })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <Label>Upload Foto</Label>
                <input
                  type="file"
                  accept=".jpg,.png,.jpeg"
                  onChange={(e) =>
                    setFormData({ ...formData, uploadFoto: e.target.files?.[0] || null })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={closeModal}>
              Batal
            </Button>
            <Button size="sm" variant="primary" onClick={handleSubmit}>
              {editingVendor ? 'Update Vendor' : 'Simpan Vendor'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}