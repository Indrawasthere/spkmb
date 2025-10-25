import { useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import Badge from "../components/ui/badge/Badge";
import { PlusIcon } from "../icons";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";

interface Vendor {
  id: string;
  namaPerusahaan: string;
  npwp: string;
  alamat: string;
  kategori: string;
  rating: number;
  jumlahProyek: number;
  status: "Aktif" | "Nonaktif" | "Blacklist";
  kontak: string;
}

const initialVendors: Vendor[] = [
  {
    id: "1",
    namaPerusahaan: "PT Teknologi Maju Indonesia",
    npwp: "01.234.567.8-901.000",
    alamat: "Jakarta Selatan",
    kategori: "IT & Software",
    rating: 4.5,
    jumlahProyek: 15,
    status: "Aktif",
    kontak: "contact@tekno.co.id",
  },
  {
    id: "2",
    namaPerusahaan: "CV Mitra Konstruksi",
    npwp: "02.345.678.9-012.000",
    alamat: "Bandung",
    kategori: "Konstruksi",
    rating: 4.2,
    jumlahProyek: 8,
    status: "Aktif",
    kontak: "info@mitrakonstruksi.com",
  },
  {
    id: "3",
    namaPerusahaan: "PT Sukses Jaya Abadi",
    npwp: "03.456.789.0-123.000",
    alamat: "Surabaya",
    kategori: "Kendaraan",
    rating: 3.8,
    jumlahProyek: 5,
    status: "Aktif",
    kontak: "sales@suksesjaya.co.id",
  },
  {
    id: "4",
    namaPerusahaan: "CV Konsultan Prima",
    npwp: "04.567.890.1-234.000",
    alamat: "Yogyakarta",
    kategori: "Konsultansi",
    rating: 4.8,
    jumlahProyek: 12,
    status: "Aktif",
    kontak: "konsultan@prima.com",
  },
  {
    id: "5",
    namaPerusahaan: "PT XYZ Corporation",
    npwp: "05.678.901.2-345.000",
    alamat: "Jakarta Pusat",
    kategori: "IT & Software",
    rating: 2.5,
    jumlahProyek: 3,
    status: "Blacklist",
    kontak: "info@xyz.co.id",
  },
];

export default function VendorPenyedia() {
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formData, setFormData] = useState({
    namaPerusahaan: "",
    npwp: "",
    alamat: "",
    kategori: "",
    kontak: "",
  });

  const { isOpen, openModal, closeModal } = useModal();

  const handleSubmit = () => {
    const newVendor: Vendor = {
      id: Date.now().toString(),
      namaPerusahaan: formData.namaPerusahaan,
      npwp: formData.npwp,
      alamat: formData.alamat,
      kategori: formData.kategori,
      kontak: formData.kontak,
      rating: 0,
      jumlahProyek: 0,
      status: "Aktif",
    };

    setVendors([newVendor, ...vendors]);
    closeModal();
    setFormData({
      namaPerusahaan: "",
      npwp: "",
      alamat: "",
      kategori: "",
      kontak: "",
    });
  };

  const filteredVendors = vendors.filter((vendor) => {
    const matchSearch =
      vendor.namaPerusahaan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.npwp.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.kategori.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter =
      filterStatus === "all" || vendor.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const getStatusColor = (status: Vendor["status"]) => {
    switch (status) {
      case "Aktif":
        return "success";
      case "Nonaktif":
        return "warning";
      case "Blacklist":
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
      value: vendors.filter((v) => v.status === "Aktif").length,
      color: "text-success-500",
    },
    {
      label: "Blacklist",
      value: vendors.filter((v) => v.status === "Blacklist").length,
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
        title="Vendor/Penyedia - Sistem Pengawasan"
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
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
                <option value="Blacklist">Blacklist</option>
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
                    NPWP
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Kategori
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
                        <p>{vendor.namaPerusahaan}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {vendor.alamat}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {vendor.npwp}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {vendor.kategori}
                    </td>
                    <td className="px-6 py-4">{renderStars(vendor.rating)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {vendor.jumlahProyek} proyek
                    </td>
                    <td className="px-6 py-4">
                      <Badge size="sm" color={getStatusColor(vendor.status)}>
                        {vendor.status}
                      </Badge>
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
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-2xl m-4">
        <div className="p-6">
          <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            Tambah Vendor Baru
          </h3>

          <div className="space-y-4">
            <div>
              <Label>Nama Perusahaan</Label>
              <Input
                type="text"
                value={formData.namaPerusahaan}
                onChange={(e) =>
                  setFormData({ ...formData, namaPerusahaan: e.target.value })
                }
                placeholder="PT/CV Nama Perusahaan"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>NPWP</Label>
                <Input
                  type="text"
                  value={formData.npwp}
                  onChange={(e) =>
                    setFormData({ ...formData, npwp: e.target.value })
                  }
                  placeholder="00.000.000.0-000.000"
                />
              </div>
              <div>
                <Label>Kategori</Label>
                <Input
                  type="text"
                  value={formData.kategori}
                  onChange={(e) =>
                    setFormData({ ...formData, kategori: e.target.value })
                  }
                  placeholder="IT, Konstruksi, dll"
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
                placeholder="email@perusahaan.com"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={closeModal}>
              Batal
            </Button>
            <Button size="sm" variant="primary" onClick={handleSubmit}>
              Simpan Vendor
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}