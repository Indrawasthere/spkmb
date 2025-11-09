import { useState, useEffect } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import { PlusIcon, PencilIcon, TrashBinIcon, CalenderIcon, DollarLineIcon, TrendingUp } from "../icons";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import Select from "../components/form/Select";
import { DataTable } from "../components/common/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { ActionButtons } from "../components/common/ActionButtons";
import { DetailsModal } from "../components/common/DetailsModal";
import toast, { Toaster } from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface PPKData {
  id: string;
  paketId: string;
  namaPPK: string;
  noSertifikasi: string;
  jumlahAnggaran: number;
  lamaProyek: number;
  realisasiTermin1?: number;
  realisasiTermin2?: number;
  realisasiTermin3?: number;
  realisasiTermin4?: number;
  PHO?: string;
  FHO?: string;
  createdAt: string;
  updatedAt: string;
  paket: {
    kodePaket: string;
    namaPaket: string;
  };
}

interface Paket {
  id: string;
  kodePaket: string;
  namaPaket: string;
}

const formatCurrency = (value: number): string =>
  value.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  });

export default function PPKData() {
  const [ppkData, setPpkData] = useState<PPKData[]>([]);
  const [pakets, setPakets] = useState<Paket[]>([]);
  const [formData, setFormData] = useState({
    paketId: "",
    namaPPK: "",
    noSertifikasi: "",
    jumlahAnggaran: "",
    jumlahAnggaranValue: 0,
    lamaProyek: "",
    realisasiTermin1: "",
    realisasiTermin1Value: 0,
    realisasiTermin2: "",
    realisasiTermin2Value: 0,
    realisasiTermin3: "",
    realisasiTermin3Value: 0,
    realisasiTermin4: "",
    realisasiTermin4Value: 0,
    PHO: "",
    FHO: "",
  });
  const [editingPPKData, setEditingPPKData] = useState<PPKData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isOpen, openModal, closeModal } = useModal();

  const [selectedData, setSelectedData] = useState<any | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);

  const handleViewDetails = (data: any) => {
    setSelectedData(data);
    setViewDetailsOpen(true);
  };



  // Fetch PPK Data and Pakets from API
  useEffect(() => {
    fetchPPKData();
    fetchPakets();
  }, []);

  const fetchPPKData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ppk-data`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setPpkData(data);
      }
    } catch (error) {
      console.error('Error fetching PPK data:', error);
      toast.error('Gagal memuat data PPK');
    }
  };

  const fetchPakets = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/paket`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setPakets(data);
      }
    } catch (error) {
      console.error('Error fetching pakets:', error);
    }
  };

  const handleSubmit = async () => {
    if (
      !formData.paketId ||
      !formData.namaPPK ||
      !formData.noSertifikasi ||
      !formData.jumlahAnggaranValue
    ) {
      toast.error("Mohon lengkapi semua field yang wajib");
      return;
    }

    setIsSubmitting(true);
    try {
      const ppkDataPayload = {
        paketId: formData.paketId,
        namaPPK: formData.namaPPK,
        noSertifikasi: formData.noSertifikasi,
        jumlahAnggaran: formData.jumlahAnggaranValue,
        lamaProyek: parseInt(formData.lamaProyek) || 0,
        realisasiTermin1: formData.realisasiTermin1Value || null,
        realisasiTermin2: formData.realisasiTermin2Value || null,
        realisasiTermin3: formData.realisasiTermin3Value || null,
        realisasiTermin4: formData.realisasiTermin4Value || null,
        PHO: formData.PHO ? new Date(formData.PHO) : null,
        FHO: formData.FHO ? new Date(formData.FHO) : null,
      };

      let response;
      if (editingPPKData) {
        response = await fetch(`${API_BASE_URL}/api/ppk-data/${editingPPKData.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ppkDataPayload),
        });
      } else {
        response = await fetch(`${API_BASE_URL}/api/ppk-data`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ppkDataPayload),
        });
      }

      if (response.ok) {
        await fetchPPKData();
        closeModal();
        resetForm();
        toast.success(editingPPKData ? 'Data PPK berhasil diperbarui' : 'Data PPK berhasil ditambahkan');
      } else {
        const errorText = await response.text();
        toast.error('Gagal menyimpan data PPK: ' + errorText);
      }
    } catch (error) {
      console.error('Error saving PPK data:', error);
      toast.error('Terjadi kesalahan saat menyimpan data PPK');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (ppkData: PPKData) => {
    setEditingPPKData(ppkData);
    setFormData({
      paketId: ppkData.paketId,
      namaPPK: ppkData.namaPPK,
      noSertifikasi: ppkData.noSertifikasi,
      jumlahAnggaran: formatCurrency(ppkData.jumlahAnggaran),
      jumlahAnggaranValue: ppkData.jumlahAnggaran,
      lamaProyek: ppkData.lamaProyek.toString(),
      realisasiTermin1: ppkData.realisasiTermin1?.toString() || "",
      realisasiTermin1Value: ppkData.realisasiTermin1 || 0,
      realisasiTermin2: ppkData.realisasiTermin2?.toString() || "",
      realisasiTermin2Value: ppkData.realisasiTermin2 || 0,
      realisasiTermin3: ppkData.realisasiTermin3?.toString() || "",
      realisasiTermin3Value: ppkData.realisasiTermin3 || 0,
      realisasiTermin4: ppkData.realisasiTermin4?.toString() || "",
      realisasiTermin4Value: ppkData.realisasiTermin4 || 0,
      PHO: ppkData.PHO ? new Date(ppkData.PHO).toISOString().split("T")[0] : "",
      FHO: ppkData.FHO ? new Date(ppkData.FHO).toISOString().split("T")[0] : "",
    });
    openModal();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data PPK ini?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/ppk-data/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (response.ok) {
          await fetchPPKData();
          toast.success('Data PPK berhasil dihapus');
        } else {
          const errorText = await response.text();
          toast.error('Gagal menghapus data PPK: ' + errorText);
        }
      } catch (error) {
        console.error('Error deleting PPK data:', error);
        toast.error('Terjadi kesalahan saat menghapus data PPK');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      paketId: "",
      namaPPK: "",
      noSertifikasi: "",
      jumlahAnggaran: "",
      jumlahAnggaranValue: 0,
      lamaProyek: "",
      realisasiTermin1: "",
      realisasiTermin1Value: 0,
      realisasiTermin2: "",
      realisasiTermin2Value: 0,
      realisasiTermin3: "",
      realisasiTermin3Value: 0,
      realisasiTermin4: "",
      realisasiTermin4Value: 0,
      PHO: "",
      FHO: "",
    });
    setEditingPPKData(null);
  };

  const openAddModal = () => {
    resetForm();
    openModal();
  };

  // Calculate stats
  const totalPPK = ppkData.length;
  const totalBudget = ppkData.reduce((sum, item) => sum + item.jumlahAnggaran, 0);
  const averageCompletion =
    ppkData.length > 0
      ? Math.round(
          ppkData.reduce((sum, item) => {
            const terminCount = [
              item.realisasiTermin1,
              item.realisasiTermin2,
              item.realisasiTermin3,
              item.realisasiTermin4,
            ].filter(Boolean).length;
            return sum + (terminCount / 4) * 100;
          }, 0) / ppkData.length
        )
      : 0;

  // Table columns
  const columns: ColumnDef<PPKData>[] = [
    {
      accessorKey: 'namaPPK',
      header: 'Nama PPK',
    },
    {
      accessorKey: 'paket.kodePaket',
      header: 'Kode Paket',
      cell: ({ row }) => row.original.paket?.kodePaket || '-',
    },
    {
      accessorKey: 'paket.namaPaket',
      header: 'Nama Paket',
      cell: ({ row }) => row.original.paket?.namaPaket || '-',
    },
    {
      accessorKey: 'noSertifikasi',
      header: 'No Sertifikasi',
    },
    {
      accessorKey: "jumlahAnggaran",
      header: "Jumlah Anggaran",
      cell: ({ row }) => formatCurrency(row.original.jumlahAnggaran),
    },
    {
      accessorKey: 'lamaProyek',
      header: 'Lama Proyek',
      cell: ({ row }) => `${row.original.lamaProyek} hari`,
    },
    {
      id: "realisasi",
      header: "Realisasi Termin",
      cell: ({ row }) => {
        const termin = [
          row.original.realisasiTermin1,
          row.original.realisasiTermin2,
          row.original.realisasiTermin3,
          row.original.realisasiTermin4,
        ];
        const completed = termin.filter(Boolean).length;
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${(completed / 4) * 100}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-600">{completed}/4</span>
          </div>
        );
      },
    },
    {
      id: 'actions', header: 'Aksi', cell: ({ row }) => (
        <ActionButtons
          onView={() => handleViewDetails(row.original)}
          onEdit={() => handleEdit(row.original)}
          onDelete={() => handleDelete(row.original.id)}
        />
      ),
    },
  ];

  // details sections injected
  const detailsSections = selectedData ? [
      {
        title: "Informasi Dasar",
        fields: [
          { label: "Nama PPK", value: selectedData?.namaPPK ?? "-" },
          { label: "No Sertifikasi", value: selectedData?.noSertifikasi ?? "-" },
          {
            label: "Jumlah Anggaran",
            value: selectedData?.jumlahAnggaran
              ? formatCurrency(selectedData.jumlahAnggaran)
              : "-",
          },
          { label: "Lama Proyek", value: selectedData?.lamaProyek ?? "-" },
          { label: "PHO", value: selectedData?.PHO ?? "-" },
          { label: "FHO", value: selectedData?.FHO ?? "-" },
          {
            label: "Paket",
            value: selectedData?.paket
              ? `${selectedData.paket.kodePaket} - ${selectedData.paket.namaPaket}`
              : "-",
            fullWidth: true,
          },
        ],
      },
    ]
  : [];
  const detailsDocuments =
  selectedData?.dokumen ||
  (selectedData?.filePath
    ? [
        {
          id: selectedData?.id,
          namaDokumen: selectedData?.namaDokumen || "Dokumen Terkait",
          filePath: selectedData?.filePath,
          uploadedAt:
            selectedData?.updatedAt ||
            selectedData?.tanggalUpload ||
            new Date().toISOString(),
        },
      ]
    : []);



  return (
    <>
      <Toaster position="top-right" />
      <PageMeta
        title="Data PPK - Sistem Pengawasan"
        description="Kelola data PPK dan realisasi anggaran proyek"
      />
      <PageBreadcrumb pageTitle="Data PPK" />

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total PPK</p>
                <p className="text-3xl font-bold mt-1">{totalPPK}</p>
                <p className="text-blue-100 text-xs mt-2">Data PPK terdaftar</p>
              </div>
              <div className="bg-white/20 rounded-full p-4">
                <CalenderIcon className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Anggaran</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(totalBudget)}</p>
                <p className="text-green-100 text-xs mt-2">Nilai total proyek</p>
              </div>
              <div className="bg-white/20 rounded-full p-4">
                <DollarLineIcon className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Rata-rata Progress</p>
                <p className="text-3xl font-bold mt-1">{averageCompletion}%</p>
                <p className="text-purple-100 text-xs mt-2">Realisasi termin</p>
              </div>
              <div className="bg-white/20 rounded-full p-4">
                <TrendingUp className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Data PPK
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola data PPK dan monitoring realisasi anggaran
            </p>
          </div>
          <Button
            size="md"
            variant="primary"
            startIcon={<PlusIcon />}
            onClick={openAddModal}
          >
            Tambah Data PPK
          </Button>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={ppkData}
          searchPlaceholder="Cari data PPK..."
        />
      </div>

      {/* Modal Form */}
      <Modal isOpen={isOpen}
        onClose={closeModal}
        size="2xl"
        title={editingPPKData ? "Edit Data PPK" : "Tambah Data PPK"}
        showHeader={true}>
        <div className="flex flex-col max-h-[80vh] overflow-y-auto px-6 py-4 space-y-4">
          <div className="space-y-4">
            <div>
              <Label>Paket <span className="text-red-500">*</span></Label>
              <Select
                options={[
                  { value: "", label: "Pilih Paket" },
                  ...pakets.map((paket) => ({
                    value: paket.id,
                    label: `${paket.kodePaket} - ${paket.namaPaket}`,
                  })),
                ]}
                value={formData.paketId}
                onChange={(value) => setFormData({ ...formData, paketId: value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nama PPK <span className="text-red-500">*</span></Label>
                <Input
                  type="text"
                  value={formData.namaPPK}
                  onChange={(e) =>
                    setFormData({ ...formData, namaPPK: e.target.value })
                  }
                  placeholder="Masukkan nama PPK"
                />
              </div>
              <div>
                <Label>No Sertifikasi <span className="text-red-500">*</span></Label>
                <Input
                  type="text"
                  value={formData.noSertifikasi}
                  onChange={(e) =>
                    setFormData({ ...formData, noSertifikasi: e.target.value })
                  }
                  placeholder="Masukkan nomor sertifikasi"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Jumlah Anggaran (Rp)</Label>
                <Input
                  type="text"
                  value={formData.jumlahAnggaran}
                  readOnly
                  placeholder="Dihitung otomatis"
                />
              </div>
              <div>
                <Label>Lama Proyek (hari)</Label>
                <Input
                  type="number"
                  value={formData.lamaProyek}
                  onChange={(e) =>
                    setFormData({ ...formData, lamaProyek: e.target.value })
                  }
                  placeholder="365"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-lg font-medium mb-4">Realisasi Termin</h4>
              <div className="grid grid-cols-2 gap-4">
                {["1", "2", "3", "4"].map((num) => (
                <div key={num}>
                  <Label>{`Termin ${num} (Rp)`}</Label>
                  <Input
                    type="text"
                    value={formData[`realisasiTermin${num}` as keyof typeof formData] as string}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d]/g, "");
                      const parsed = raw ? parseInt(raw, 10) : 0;
                       const updated = {
                        ...formData,
                        [`realisasiTermin${num}`]: parsed ? formatCurrency(parsed) : "",
                        [`realisasiTermin${num}Value`]: parsed,
                      };
                      const total =
                        (updated.realisasiTermin1Value || 0) +
                        (updated.realisasiTermin2Value || 0) +
                        (updated.realisasiTermin3Value || 0) +
                        (updated.realisasiTermin4Value || 0);

                      updated.jumlahAnggaran = total ? formatCurrency(total) : "";
                      updated.jumlahAnggaranValue = total;

                      setFormData(updated);
                    }}
                    placeholder="25000000"
                  />
                </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div>
                <Label>PHO (Provisional Hand Over)</Label>
                <Input
                  type="date"
                  value={formData.PHO}
                  onChange={(e) =>
                    setFormData({ ...formData, PHO: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>FHO (Final Hand Over)</Label>
                <Input
                  type="date"
                  value={formData.FHO}
                  onChange={(e) =>
                    setFormData({ ...formData, FHO: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={closeModal} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan...' : (editingPPKData ? 'Update' : 'Simpan')}
            </Button>
          </div>
        </div>
      </Modal>
    
      {selectedData && (
        <DetailsModal
          isOpen={viewDetailsOpen}
          onClose={() => setViewDetailsOpen(false)}
          title={`Detail PPKData`}
          sections={detailsSections}
          documents={detailsDocuments}
        />
      )}
    </>
  );
}
