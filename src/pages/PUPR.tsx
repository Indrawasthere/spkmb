import { useState, useEffect } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import Badge from "../components/ui/badge/Badge";
import DatePicker from "react-datepicker";
import { PlusIcon } from "../icons";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import { DataTable } from "../components/common/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { ActionButtons } from "../components/common/ActionButtons";
import { DetailsModal } from "../components/common/DetailsModal";
import toast from "react-hot-toast";

interface Proyek {
  id: string;
  namaProyek: string;
  lokasi: string;
  anggaran: number;
  status: "PERENCANAAN" | "PELAKSANAAN" | "SELESAI" | "DITUNDA";
  progress: number;
  kontraktor: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  deskripsiCatatan?: string;
  dokumenCatatan?: string;
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const formatCurrency = (value: number): string =>
  value.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  });

export default function PUPR() {
  const [proyek, setProyek] = useState<Proyek[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, openModal, closeModal } = useModal();
  const [editingProyek, setEditingProyek] = useState<Proyek | null>(null);
  const [selectedData, setSelectedData] = useState<any | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);

  const [formData, setFormData] = useState({
    namaProyek: "",
    lokasi: "",
    anggaran: "",
    anggaranValue: 0,
    kontraktor: "",
    tanggalMulai: "",
    tanggalSelesai: "",
    deskripsiCatatan: "",
    dokumenCatatan: null as File | null,
    progress: 0,
  });

  useEffect(() => {
    fetchProyek();
  }, []);

  const fetchProyek = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/proyek-pupr`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setProyek(data);
      }
    } catch (error) {
      console.error("Error fetching proyek:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.namaProyek || !formData.lokasi || !formData.anggaranValue) {
      toast.error("Lengkapi semua field yang wajib");
      return;
    }

    try {
      const fd = new FormData();
      fd.append("namaProyek", formData.namaProyek);
      fd.append("lokasi", formData.lokasi);
      fd.append("anggaran", String(formData.anggaranValue));
      fd.append("kontraktor", formData.kontraktor);
      fd.append("tanggalMulai", formData.tanggalMulai);
      fd.append("tanggalSelesai", formData.tanggalSelesai);
      fd.append("deskripsiCatatan", formData.deskripsiCatatan);
      fd.append("progress", String(formData.progress));
      if (formData.dokumenCatatan) {
        fd.append("dokumenCatatan", formData.dokumenCatatan);
      }

      const url = editingProyek
        ? `${API_BASE_URL}/api/proyek-pupr/${editingProyek.id}`
        : `${API_BASE_URL}/api/proyek-pupr`;
      const method = editingProyek ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        credentials: "include",
        body: fd,
      });

      if (response.ok) {
        toast.success(
          editingProyek
            ? "Catatan proyek berhasil diperbarui!"
            : "Catatan proyek berhasil ditambahkan!"
        );
        await fetchProyek();
        resetForm();
        closeModal();
      } else {
        toast.error("Gagal menyimpan catatan proyek");
      }
    } catch (error) {
      console.error("Error saving proyek:", error);
      toast.error("Terjadi kesalahan saat menyimpan proyek");
    }
  };

  const handleEdit = (proyek: Proyek) => {
    setEditingProyek(proyek);
    setFormData({
      namaProyek: proyek.namaProyek,
      lokasi: proyek.lokasi,
      anggaran: formatCurrency(proyek.anggaran),
      anggaranValue: proyek.anggaran,
      kontraktor: proyek.kontraktor,
      tanggalMulai: proyek.tanggalMulai.split("T")[0],
      tanggalSelesai: proyek.tanggalSelesai.split("T")[0],
      deskripsiCatatan: proyek.deskripsiCatatan || "",
      dokumenCatatan: null,
      progress: proyek.progress || 0,
    });
    openModal();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus catatan proyek ini?")) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/proyek-pupr/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (response.ok) {
          toast.success("Catatan proyek berhasil dihapus");
          await fetchProyek();
        }
      } catch (error) {
        console.error("Error deleting proyek:", error);
        toast.error("Gagal menghapus catatan proyek");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      namaProyek: "",
      lokasi: "",
      anggaran: "",
      anggaranValue: 0,
      kontraktor: "",
      tanggalMulai: "",
      tanggalSelesai: "",
      deskripsiCatatan: "",
      dokumenCatatan: null,
      progress: 0,
    });
    setEditingProyek(null);
  };

  const getStatusColor = (status: Proyek["status"]) => {
    switch (status) {
      case "SELESAI":
        return "success";
      case "PELAKSANAAN":
        return "warning";
      case "PERENCANAAN":
        return "info";
      case "DITUNDA":
        return "error";
      default:
        return "light";
    }
  };

  const columns: ColumnDef<Proyek>[] = [
    {
      accessorKey: "namaProyek",
      header: "Nama Proyek",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">
            {row.original.namaProyek}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {row.original.tanggalMulai.split("T")[0]} -{" "}
            {row.original.tanggalSelesai.split("T")[0]}
          </p>
        </div>
      ),
    },
    { accessorKey: "lokasi", header: "Lokasi" },
    {
      accessorKey: "anggaran",
      header: "Anggaran",
      cell: ({ row }) => <span>{formatCurrency(row.original.anggaran)}</span>,
    },
    {
      accessorKey: "progress",
      header: "Progress",
      cell: ({ row }) => (
        <div className="flex items-center">
          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2 dark:bg-gray-700">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${row.original.progress}%` }}
            ></div>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {row.original.progress}%
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <ActionButtons
          onView={() => {
            setSelectedData(row.original);
            setViewDetailsOpen(true);
          }}
          onEdit={() => handleEdit(row.original)}
          onDelete={() => handleDelete(row.original.id)}
        />
      ),
    },
  ];

  const detailsSections = selectedData
    ? [
      {
        title: "Informasi Dasar",
        fields: [
          { label: "Nama Proyek", value: selectedData.namaProyek },
          { label: "Lokasi", value: selectedData.lokasi },
          {
            label: "Anggaran",
            value: formatCurrency(selectedData.anggaran),
          },
          { label: "Kontraktor", value: selectedData.kontraktor },
          {
            label: "Tanggal Mulai",
            value: new Date(selectedData.tanggalMulai).toLocaleDateString(
              "id-ID"
            ),
          },
          {
            label: "Tanggal Selesai",
            value: new Date(selectedData.tanggalSelesai).toLocaleDateString(
              "id-ID"
            ),
          },
          { label: "Progress", value: `${selectedData.progress}%` },
          {
            label: "Deskripsi Catatan",
            value: selectedData.deskripsiCatatan || "-",
            fullWidth: true,
          },
        ],
      },
    ]
    : [];

  const detailsDocuments =
    selectedData?.dokumenCatatan
      ? [
        {
          id: selectedData.id,
          namaDokumen: "Dokumen Catatan Proyek",
          filePath: selectedData.dokumenCatatan,
          uploadedAt: selectedData.updatedAt,
        },
      ]
      : [];

  return (
    <>
      <PageMeta title="SIPAKAT-PBJ - PUPR" description="Catatan Proyek PUPR" />
      <PageBreadcrumb pageTitle="PUPR" />

      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Daftar Proyek
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola catatan proyek infrastruktur dan perumahan
            </p>
          </div>
          <Button
            size="md"
            variant="primary"
            startIcon={<PlusIcon />}
            onClick={openModal}
          >
            Tambah Catatan Proyek
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={proyek}
          searchPlaceholder="Cari proyek..."
          loading={loading}
        />
      </div>

      {/* Modal Input */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        size="2xl"
        title={editingProyek ? "Edit Catatan Proyek" : "Tambah Catatan Proyek"}
        showHeader
      >
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <Label>Nama Proyek</Label>
          <Input
            value={formData.namaProyek}
            onChange={(e) =>
              setFormData({ ...formData, namaProyek: e.target.value })
            }
            placeholder="Nama proyek lengkap"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Lokasi</Label>
              <Input
                value={formData.lokasi}
                onChange={(e) =>
                  setFormData({ ...formData, lokasi: e.target.value })
                }
                placeholder="Kota/Kabupaten"
              />
            </div>
            <div>
              <Label>Anggaran</Label>
              <Input
                value={formData.anggaran}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d]/g, "");
                  const parsed = raw ? parseInt(raw, 10) : 0;
                  setFormData({
                    ...formData,
                    anggaran: parsed ? formatCurrency(parsed) : "",
                    anggaranValue: parsed,
                  });
                }}
                placeholder="Rp 0"
              />
            </div>
          </div>

          <Label>Kontraktor</Label>
          <Input
            value={formData.kamaKontraktor}
            onChange={(e) =>
              setFormData({ ...formData, kontraktor: e.target.value })
            }
            placeholder="PT. Nama Kontraktor"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tanggal Mulai</Label>
              <DatePicker
                selected={
                  formData.tanggalMulai
                    ? new Date(formData.tanggalMulai)
                    : null
                }
                onChange={(date) =>
                  setFormData({
                    ...formData,
                    tanggalMulai: date
                      ? date.toISOString().split("T")[0]
                      : "",
                  })
                }
                dateFormat="dd/MM/yyyy"
                placeholderText="Pilih tanggal mulai"
              />
            </div>
            <div>
              <Label>Tanggal Selesai</Label>
              <DatePicker
                selected={
                  formData.tanggalSelesai
                    ? new Date(formData.tanggalSelesai)
                    : null
                }
                onChange={(date) =>
                  setFormData({
                    ...formData,
                    tanggalSelesai: date
                      ? date.toISOString().split("T")[0]
                      : "",
                  })
                }
                dateFormat="dd/MM/yyyy"
                placeholderText="Pilih tanggal selesai"
              />
            </div>
          </div>

          <Label>Progress (%)</Label>
          <Input
            type="number"
            value={formData.progress}
            onChange={(e) =>
              setFormData({
                ...formData,
                progress: Math.min(
                  100,
                  Math.max(0, parseInt(e.target.value) || 0)
                ),
              })
            }
            placeholder="0–100"
          />

          <Label>Deskripsi Catatan</Label>
          <textarea
            value={formData.deskripsiCatatan}
            onChange={(e) =>
              setFormData({ ...formData, deskripsiCatatan: e.target.value })
            }
            placeholder="Deskripsi catatan proyek..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:bg-gray-800 dark:text-gray-300"
          />

          <Label>Dokumen Catatan</Label>
          <input
            type="file"
            onChange={(e) =>
              setFormData({
                ...formData,
                dokumenCatatan: e.target.files?.[0] || null,
              })
            }
            accept=".pdf,.doc,.docx,.xlsx,.jpg,.jpeg,.png"
            className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
          />
          {formData.dokumenCatatan && (
            <p className="mt-1 text-xs text-green-600">
              ✓ {formData.dokumenCatatan.name} (
              {(formData.dokumenCatatan.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={closeModal}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              {editingProyek ? "Simpan Perubahan" : "Simpan Catatan"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal dengan preview dokumen */}
{selectedData && (
  <DetailsModal
    isOpen={viewDetailsOpen}
    onClose={() => setViewDetailsOpen(false)}
    title="Detail Catatan Proyek"
    sections={detailsSections}
  >
    {/* Inline Preview */}
    {selectedData?.dokumenCatatan && (
      <div className="border-t mt-4 pt-4">
        <h4 className="font-medium mb-2">Dokumen Catatan Proyek</h4>

        {selectedData.dokumenCatatan.endsWith(".pdf") ? (
          <iframe
            src={selectedData.dokumenCatatan}
            className="w-full h-[500px] border rounded-lg"
            title="Preview PDF"
          ></iframe>
        ) : selectedData.dokumenCatatan.match(/\.(jpg|jpeg|png)$/i) ? (
          <img
            src={selectedData.dokumenCatatan}
            alt="Preview Dokumen"
            className="w-full rounded-lg border"
          />
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {selectedData.dokumenCatatan.split("/").pop()}
            </p>
            <a
              href={selectedData.dokumenCatatan}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              Lihat / Unduh
            </a>
          </div>
        )}
      </div>
    )}
  </DetailsModal>
)}
    </>
  );
}

