import { useState, useEffect } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import Badge from "../components/ui/badge/Badge";
import { PlusIcon } from "../icons";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import { DataTable } from "../components/common/DataTable";
import { ActionButtons } from "../components/common/ActionButtons";
import { DetailsModal } from "../components/common/DetailsModal";
import toast from "react-hot-toast";

const API_BASE_URL = 'http://localhost:3001';

interface Kontraktor {
  id: string;
  namaVendor: string;
  jenisVendor: "KONSTRUKSI";
  nomorIzin: string;
  spesialisasi: string | null;
  jumlahProyek: number;
  rating: number | null;
  status: "AKTIF" | "NON_AKTIF" | "SUSPENDED";
  kontak: string | null;
  alamat: string | null;
  createdAt: string;
}

export default function Konstruksi() {
  const [kontraktor, setKontraktor] = useState<Kontraktor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [formData, setFormData] = useState({
    namaVendor: "",
    nomorIzin: "",
    spesialisasi: "",
    kontak: "",
    alamat: "",
  });
  const [editingKontraktor, setEditingKontraktor] = useState<Kontraktor | null>(null);

  const { isOpen, openModal, closeModal } = useModal();
  // details modal state injected
  const [selectedData, setSelectedData] = useState<any | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);

  const handleViewDetails = (data: any) => {
    setSelectedData(data);
    setViewDetailsOpen(true);
  };



  // Fetch kontraktor data from API
  useEffect(() => {
    fetchKontraktor();
  }, []);

  const fetchKontraktor = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendor?jenis=KONSTRUKSI`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setKontraktor(data);
      }
    } catch (error) {
      console.error('Error fetching kontraktor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const kontraktorData = {
        namaVendor: formData.namaVendor,
        jenisVendor: "KONSTRUKSI" as const,
        nomorIzin: formData.nomorIzin,
        spesialisasi: formData.spesialisasi || null,
        kontak: formData.kontak || null,
        alamat: formData.alamat || null,
      };

      let response;
      if (editingKontraktor) {
        response = await fetch(`${API_BASE_URL}/api/vendor/${editingKontraktor.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(kontraktorData),
        });
      } else {
        response = await fetch(`${API_BASE_URL}/api/vendor`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(kontraktorData),
        });
      }

      if (response.ok) {
        await fetchKontraktor();
        closeModal();
        resetForm();
        toast.error('Kontraktor berhasil disimpan!');
      } else {
        const errorText = await response.text();
        toast.error('Gagal menyimpan kontraktor: ' + errorText);
      }
    } catch (error) {
      console.error('Error saving kontraktor:', error);
      toast.error('Terjadi kesalahan saat menyimpan kontraktor');
    }
  };

  const handleEdit = (kontraktor: Kontraktor) => {
    setEditingKontraktor(kontraktor);
    setFormData({
      namaVendor: kontraktor.namaVendor,
      nomorIzin: kontraktor.nomorIzin,
      spesialisasi: kontraktor.spesialisasi || "",
      kontak: kontraktor.kontak || "",
      alamat: kontraktor.alamat || "",
    });
    openModal();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus kontraktor ini?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/vendor/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (response.ok) {
          await fetchKontraktor();
          toast.error('Kontraktor berhasil dihapus!');
        } else {
          const errorText = await response.text();
          toast.error('Gagal menghapus kontraktor: ' + errorText);
        }
      } catch (error) {
        console.error('Error deleting kontraktor:', error);
        toast.error('Terjadi kesalahan saat menghapus kontraktor');
      }
    }
  };

  const handleUpload = (id: string) => {
    // Placeholder untuk modal upload
    toast.error(`Upload dokumen untuk kontraktor ${id}`);
  };

  const resetForm = () => {
    setFormData({
      namaVendor: "",
      nomorIzin: "",
      spesialisasi: "",
      kontak: "",
      alamat: "",
    });
    setEditingKontraktor(null);
  };



  const getStatusColor = (status: Kontraktor["status"]) => {
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
  };
    
  // details sections injected
  const detailsSections = selectedData
  ? [
      {
        title: "Informasi Kontraktor",
        fields: [
          { label: "Nama Vendor", value: selectedData.namaVendor ?? "-" },
          { label: "Nomor Izin", value: selectedData.nomorIzin ?? "-" },
          { label: "Spesialisasi", value: selectedData.spesialisasi ?? "-" },
          { label: "Jumlah Proyek", value: selectedData.jumlahProyek ?? 0 },
          {
            label: "Rating",
            value: selectedData.rating
              ? `${selectedData.rating.toFixed(1)} / 5`
              : "-",
          },
          { 
            label: "Status", 
            value: (
              <Badge color={getStatusColor(selectedData.status)}>
                {selectedData.status}
              </Badge>
            ),
          },
          { label: "Lokasi", value: selectedData.lokasi ?? "-" },
          { label: "Alamat", value: selectedData.alamat ?? "-", fullWidth: true },
        ],
      },
    ]
  : [];

  const detailsDocuments =
    selectedData?.dokumen ||
    (selectedData?.filePath
      ? [
          {
            id: selectedData.id,
            namaDokumen: selectedData.namaDokumen || "Dokumen Terkait",
            filePath: selectedData.filePath,
            uploadedAt:
              selectedData.updatedAt ||
              selectedData.tanggalUpload ||
              new Date().toISOString(),
          },
        ]
  : []);


  // Stats Cards
  const stats = [
    {
      label: "Total Kontraktor",
      value: kontraktor.length,
      color: "text-brand-500",
    },
    {
      label: "Kontraktor Aktif",
      value: kontraktor.filter((k) => k.status === "AKTIF").length,
      color: "text-success-500",
    },
    {
      label: "Total Proyek",
      value: kontraktor.reduce((acc, k) => acc + k.jumlahProyek, 0),
      color: "text-blue-light-500",
    },
    {
      label: "Rating Rata-rata",
      value: kontraktor.length > 0 ? (kontraktor.reduce((sum, k) => sum + (k.rating || 0), 0) / kontraktor.length).toFixed(1) : "0.0",
      color: "text-warning-500",
    },
  ];

  return (
    <>
      <PageMeta
        title="Konstruksi | SIP-KPBJ"
        description="Halaman Konstruksi untuk Vendor Penyedia"
      />
      <PageBreadcrumb pageTitle="Konstruksi" />

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
              Daftar Kontraktor Konstruksi
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola data kontraktor konstruksi dan evaluasi kinerja
            </p>
          </div>
          <Button
            size="md"
            variant="primary"
            startIcon={<PlusIcon />}
            onClick={openModal}
          >
            Tambah Kontraktor
          </Button>
        </div>

        {/* Filter */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex gap-2">
            <select
              className="h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="AKTIF">Aktif</option>
              <option value="NON_AKTIF">Nonaktif</option>
              <option value="SUSPENDED">Ditangguhkan</option>
            </select>
          </div>
        </div>

        <DataTable
          data={kontraktor.filter((k) => filterStatus === "all" || k.status === filterStatus)}
          columns={[
            {
              header: "Nama Kontraktor",
              accessorKey: "namaVendor",
              cell: ({ row }) => (
                <div>
                  <p className="font-medium">{row.original.namaVendor}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {row.original.alamat}
                  </p>
                </div>
              ),
            },
            {
              header: "No. Izin",
              accessorKey: "nomorIzin",
            },
            {
              header: "Spesialisasi",
              accessorKey: "spesialisasi",
            },
            {
              header: "Jumlah Proyek",
              accessorKey: "jumlahProyek",
              cell: ({ getValue }) => `${getValue()} proyek`,
            },
            {
              header: "Pendapatan",
              accessorKey: "pendapatan",
              cell: () => "-",
            },
            {
              header: "Rating",
              accessorKey: "rating",
              cell: ({ getValue }) => renderStars(getValue() as number | null),
            },
            {
              header: "Status",
              accessorKey: "status",
              cell: ({ getValue }) => {
                const status = getValue() as Kontraktor["status"];
                return (
                  <Badge size="sm" color={getStatusColor(status)}>
                    {status}
                  </Badge>
                );
              },
            },
            {
              header: "Dokumen",
              accessorKey: "dokumen",
              cell: () => (
                <div className="space-y-1">
                  <span className="text-xs">Dokumen terkait: 5 file</span>
                  <button className="text-blue-600 hover:text-blue-900 text-xs">
                    Lihat Dokumen
                  </button>
                </div>
              ),
            },
            {
              header: "Aksi",
              accessorKey: "actions",
              cell: ({ row }) => (
                <ActionButtons
                  onView={() => handleViewDetails(row.original)}
                  onEdit={() => handleEdit(row.original)}
                  onDelete={() => handleDelete(row.original.id)}
                />
              ),
            },
          ]}
          loading={loading}
        />
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        size="2xl"
        title={editingKontraktor ? "" : ""}
        showHeader={true}
      >
        <div className="p-6">
          <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            {editingKontraktor ? 'Edit Kontraktor' : 'Tambah Kontraktor Baru'}
          </h3>

          <div className="space-y-4">
            <div>
              <Label>Nama Kontraktor</Label>
              <Input
                type="text"
                value={formData.namaVendor}
                onChange={(e) =>
                  setFormData({ ...formData, namaVendor: e.target.value })
                }
                placeholder="PT/CV Nama Kontraktor"
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
                  placeholder="IUJK-KON-XXX/2024"
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
                  placeholder="Bangunan, Jalan, dll"
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
                placeholder="email@kontraktor.com"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={closeModal}>
              Batal
            </Button>
            <Button size="sm" variant="primary" onClick={handleSubmit}>
              {editingKontraktor ? 'Update Kontraktor' : 'Simpan Kontraktor'}
            </Button>
          </div>
        </div>
      </Modal>

      {selectedData && (
        <DetailsModal
          isOpen={viewDetailsOpen}
          onClose={() => setViewDetailsOpen(false)}
          title={`Detail Konstruksi`}
          sections={detailsSections}
          documents={detailsDocuments}
        />
      )}
    </>
  );
}