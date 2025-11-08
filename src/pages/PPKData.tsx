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
import toast, { Toaster } from "react-hot-toast";

const API_BASE_URL = 'http://localhost:3001';

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

export default function PPKData() {
  const [ppkData, setPpkData] = useState<PPKData[]>([]);
  const [pakets, setPakets] = useState<Paket[]>([]);
  const [formData, setFormData] = useState({
    paketId: "",
    namaPPK: "",
    noSertifikasi: "",
    jumlahAnggaran: "",
    lamaProyek: "",
    realisasiTermin1: "",
    realisasiTermin2: "",
    realisasiTermin3: "",
    realisasiTermin4: "",
    PHO: "",
    FHO: "",
  });
  const [editingPPKData, setEditingPPKData] = useState<PPKData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isOpen, openModal, closeModal } = useModal();

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
    if (!formData.paketId || !formData.namaPPK || !formData.noSertifikasi || !formData.jumlahAnggaran) {
      toast.error('Mohon lengkapi semua field yang wajib');
      return;
    }

    setIsSubmitting(true);
    try {
      const ppkDataPayload = {
        paketId: formData.paketId,
        namaPPK: formData.namaPPK,
        noSertifikasi: formData.noSertifikasi,
        jumlahAnggaran: parseFloat(formData.jumlahAnggaran),
        lamaProyek: parseInt(formData.lamaProyek) || 0,
        realisasiTermin1: formData.realisasiTermin1 ? parseFloat(formData.realisasiTermin1) : null,
        realisasiTermin2: formData.realisasiTermin2 ? parseFloat(formData.realisasiTermin2) : null,
        realisasiTermin3: formData.realisasiTermin3 ? parseFloat(formData.realisasiTermin3) : null,
        realisasiTermin4: formData.realisasiTermin4 ? parseFloat(formData.realisasiTermin4) : null,
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
      jumlahAnggaran: ppkData.jumlahAnggaran.toString(),
      lamaProyek: ppkData.lamaProyek.toString(),
      realisasiTermin1: ppkData.realisasiTermin1?.toString() || "",
      realisasiTermin2: ppkData.realisasiTermin2?.toString() || "",
      realisasiTermin3: ppkData.realisasiTermin3?.toString() || "",
      realisasiTermin4: ppkData.realisasiTermin4?.toString() || "",
      PHO: ppkData.PHO ? new Date(ppkData.PHO).toISOString().split('T')[0] : "",
      FHO: ppkData.FHO ? new Date(ppkData.FHO).toISOString().split('T')[0] : "",
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
      lamaProyek: "",
      realisasiTermin1: "",
      realisasiTermin2: "",
      realisasiTermin3: "",
      realisasiTermin4: "",
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
  const averageCompletion = ppkData.length > 0
    ? Math.round(ppkData.reduce((sum, item) => {
        const terminCount = [item.realisasiTermin1, item.realisasiTermin2, item.realisasiTermin3, item.realisasiTermin4]
          .filter(Boolean).length;
        return sum + (terminCount / 4) * 100;
      }, 0) / ppkData.length)
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
      accessorKey: 'jumlahAnggaran',
      header: 'Jumlah Anggaran',
      cell: ({ row }) => `Rp ${row.original.jumlahAnggaran.toLocaleString('id-ID')}`,
    },
    {
      accessorKey: 'lamaProyek',
      header: 'Lama Proyek',
      cell: ({ row }) => `${row.original.lamaProyek} hari`,
    },
    {
      id: 'realisasi',
      header: 'Realisasi Termin',
      cell: ({ row }) => {
        const termin = [row.original.realisasiTermin1, row.original.realisasiTermin2, row.original.realisasiTermin3, row.original.realisasiTermin4];
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
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
            onClick={() => handleEdit(row.original)}
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
            onClick={() => handleDelete(row.original.id)}
          >
            <TrashBinIcon className="w-5 h-5" />
          </button>
        </div>
      ),
    },
  ];



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
                <p className="text-3xl font-bold mt-1">Rp {totalBudget.toLocaleString('id-ID')}</p>
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
                <Label>Jumlah Anggaran (Rp) <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  value={formData.jumlahAnggaran}
                  onChange={(e) =>
                    setFormData({ ...formData, jumlahAnggaran: e.target.value })
                  }
                  placeholder="100000000"
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
                <div>
                  <Label>Termin 1 (Rp)</Label>
                  <Input
                    type="number"
                    value={formData.realisasiTermin1}
                    onChange={(e) =>
                      setFormData({ ...formData, realisasiTermin1: e.target.value })
                    }
                    placeholder="25000000"
                  />
                </div>
                <div>
                  <Label>Termin 2 (Rp)</Label>
                  <Input
                    type="number"
                    value={formData.realisasiTermin2}
                    onChange={(e) =>
                      setFormData({ ...formData, realisasiTermin2: e.target.value })
                    }
                    placeholder="25000000"
                  />
                </div>
                <div>
                  <Label>Termin 3 (Rp)</Label>
                  <Input
                    type="number"
                    value={formData.realisasiTermin3}
                    onChange={(e) =>
                      setFormData({ ...formData, realisasiTermin3: e.target.value })
                    }
                    placeholder="25000000"
                  />
                </div>
                <div>
                  <Label>Termin 4 (Rp)</Label>
                  <Input
                    type="number"
                    value={formData.realisasiTermin4}
                    onChange={(e) =>
                      setFormData({ ...formData, realisasiTermin4: e.target.value })
                    }
                    placeholder="25000000"
                  />
                </div>
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
    </>
  );
}
