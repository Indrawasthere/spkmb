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
import Select from "../components/form/Select";
import { useAuth } from "../context/AuthContext";
import { DataTable } from "../components/common/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { ActionButtons } from "../components/common/ActionButtons";
import { DetailsModal } from "../components/common/DetailsModal";
import toast from "react-hot-toast";

interface Paket {
  id: string;
  kodePaket: string;
  kodeRUP?: string;
  namaPaket: string;
  jenisPaket: string;
  nilaiPaket: number;
  metodePengadaan: string;
  status: "DRAFT" | "PUBLISHED" | "ON_PROGRESS" | "COMPLETED" | "CANCELLED";
  tanggalBuat: string;
  createdBy: string;
  tanggalMulai?: string;
  tanggalSelesai?: string;
  lamaProyek?: number;
  dokumen?: any[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function ManajemenPaket() {
  const { user } = useAuth();
  const [pakets, setPakets] = useState<Paket[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPaket, setSelectedPaket] = useState<Paket | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);

  const [formData, setFormData] = useState({
    kodePaket: "",
    kodeRUP: "",
    namaPaket: "",
    jenisPaket: "",
    nilaiPaket: "",
    metodePengadaan: "",
    status: "DRAFT" as Paket["status"],
    tanggalMulai: "",
    tanggalSelesai: "",
    lamaProyek: "",
  });

  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File }>(
    {}
  );
  const [editingPaket, setEditingPaket] = useState<Paket | null>(null);

  const { isOpen, openModal, closeModal } = useModal();

  // Auto-calculate lamaProyek
  useEffect(() => {
    if (formData.tanggalMulai && formData.tanggalSelesai) {
      const start = new Date(formData.tanggalMulai);
      const end = new Date(formData.tanggalSelesai);
      if (end > start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setFormData((prev) => ({ ...prev, lamaProyek: diffDays.toString() }));
      }
    }
  }, [formData.tanggalMulai, formData.tanggalSelesai]);

  useEffect(() => {
    fetchPakets();
  }, []);

  const fetchPakets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/paket`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setPakets(data);
      }
    } catch (error) {
      toast.error("Gagal memuat data paket");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (paket: Paket) => {
    setSelectedPaket(paket);
    setViewDetailsOpen(true);
  };

  const handleEdit = (paket: Paket) => {
    setEditingPaket(paket);
    setFormData({
      kodePaket: paket.kodePaket,
      kodeRUP: paket.kodeRUP || "",
      namaPaket: paket.namaPaket,
      jenisPaket: paket.jenisPaket,
      nilaiPaket: paket.nilaiPaket.toString(),
      metodePengadaan: paket.metodePengadaan,
      status: paket.status,
      tanggalMulai: paket.tanggalMulai?.split("T")[0] || "",
      tanggalSelesai: paket.tanggalSelesai?.split("T")[0] || "",
      lamaProyek: paket.lamaProyek?.toString() || "",
    });
    setUploadedFiles({});
    openModal();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus paket ini?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/paket/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        toast.success("Paket berhasil dihapus!");
        fetchPakets();
      } else {
        toast.error("Gagal menghapus paket");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    }
  };

  // === Submit Paket + Upload Dokumen (Revisi Aman) ===
  const handleSubmit = async () => {
    if (!formData.kodePaket || !formData.namaPaket || !formData.nilaiPaket) {
      toast.error("Lengkapi semua field yang wajib");
      return;
    }
  
    setLoading(true);
    try {
      // 1️⃣ Buat / update paket dulu
      const payload = {
        kodePaket: formData.kodePaket,
        namaPaket: formData.namaPaket,
        jenisPaket: formData.jenisPaket,
        nilaiPaket: formData.nilaiPaket.replace(/[^\d]/g, ""),
        metodePengadaan: formData.metodePengadaan,
        status: formData.status,
        tanggalMulai: formData.tanggalMulai || undefined,
        tanggalSelesai: formData.tanggalSelesai || undefined,
      };
    
      const paketUrl = editingPaket
        ? `${API_BASE_URL}/api/paket/${editingPaket.id}`
        : `${API_BASE_URL}/api/paket`;
      const paketMethod = editingPaket ? "PUT" : "POST";
    
      const paketRes = await fetch(paketUrl, {
        method: paketMethod,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    
      if (!paketRes.ok) {
        const err = await paketRes.json().catch(() => ({}));
        throw new Error(err.error || "Gagal menyimpan paket");
      }
    
      const paketData = await paketRes.json();
      const paketId = paketData.id;
    
      // 2️⃣ Upload file dokumen (kalau ada)
      if (Object.keys(uploadedFiles).length > 0) {
        toast.loading("Mengupload dokumen...", { id: "uploadDocs" });
      
        for (const [jenisDokumen, file] of Object.entries(uploadedFiles)) {
          console.log(`📤 Upload dokumen: ${jenisDokumen}`, file.name);
        
          const fd = new FormData();
          fd.append("file", file);
          fd.append("paketId", paketId);
          fd.append("jenisDokumen", jenisDokumen);
        
          const res = await fetch(`${API_BASE_URL}/api/dokumen/upload`, {
            method: "POST",
            credentials: "include",
            body: fd,
          });
        
          if (!res.ok) {
            const errMsg = await res.text();
            console.error("Upload gagal:", errMsg);
            toast.error(`Gagal upload dokumen: ${jenisDokumen}`);
            continue; // lanjut ke file berikutnya biar gak gagal total
          }
        }
      
        toast.success("Semua dokumen berhasil diupload!", { id: "uploadDocs" });
      } else {
        console.log("ℹ️ Tidak ada file yang diupload untuk paket ini.");
      }
    
      // 3️⃣ Refresh data dan UI
      await fetchPakets();
      closeModal();
      resetForm();
    
      toast.success(editingPaket ? "Paket berhasil diupdate!" : "Paket berhasil ditambahkan!");
    } catch (err: any) {
      console.error("❌ Error saat submit paket:", err);
      toast.error(err.message || "Terjadi kesalahan saat menyimpan paket");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      kodePaket: "",
      kodeRUP: "",
      namaPaket: "",
      jenisPaket: "",
      nilaiPaket: "",
      metodePengadaan: "",
      status: "DRAFT",
      tanggalMulai: "",
      tanggalSelesai: "",
      lamaProyek: "",
    });
    setUploadedFiles({});
    setEditingPaket(null);
  };

  const getStatusColor = (status: Paket["status"]) => {
    const colors = {
      DRAFT: "light",
      PUBLISHED: "info",
      ON_PROGRESS: "warning",
      COMPLETED: "success",
      CANCELLED: "error",
    };
    return colors[status] || "light";
  };

  const getStatusLabel = (status: Paket["status"]) => {
    const labels = {
      DRAFT: "Perencanaan",
      PUBLISHED: "Dipublikasi",
      ON_PROGRESS: "Proses",
      COMPLETED: "Selesai",
      CANCELLED: "Batal",
    };
    return labels[status] || status;
  };

  const columns: ColumnDef<Paket>[] = [
    { accessorKey: "kodePaket", header: "Kode Paket" },
    { accessorKey: "namaPaket", header: "Nama Paket" },
    {
      accessorKey: "nilaiPaket",
      header: "Nilai",
      cell: ({ row }) =>
        `Rp ${row.original.nilaiPaket.toLocaleString("id-ID")}`,
    },
    { accessorKey: "jenisPaket", header: "Jenis" },
    { accessorKey: "metodePengadaan", header: "Metode" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge size="sm" color={getStatusColor(row.original.status)}>
          {getStatusLabel(row.original.status)}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <ActionButtons
          onView={() => handleViewDetails(row.original)}
          onEdit={() => handleEdit(row.original)}
          onDelete={() => handleDelete(row.original.id)}
          canDelete={user?.role === "ADMIN"}
        />
      ),
    },
  ];

  const detailsSections = selectedPaket
    ? [
        {
          title: "Informasi Dasar",
          fields: [
            { label: "Kode Paket", value: selectedPaket.kodePaket },
            { label: "Kode RUP", value: selectedPaket.kodeRUP || "-" },
            { label: "Nama Paket", value: selectedPaket.namaPaket },
            { label: "Jenis Paket", value: selectedPaket.jenisPaket },
            { label: "Metode Pengadaan", value: selectedPaket.metodePengadaan },
            {
              label: "Nilai Paket",
              value: `Rp ${selectedPaket.nilaiPaket.toLocaleString("id-ID")}`,
            },
            {
              label: "Status",
              value: (
                <Badge color={getStatusColor(selectedPaket.status)}>
                  {getStatusLabel(selectedPaket.status)}
                </Badge>
              ),
            },
          ],
        },
        {
          title: "Timeline",
          fields: [
            {
              label: "Tanggal Mulai",
              value: selectedPaket.tanggalMulai
                ? new Date(selectedPaket.tanggalMulai).toLocaleDateString(
                    "id-ID"
                  )
                : "-",
            },
            {
              label: "Tanggal Selesai",
              value: selectedPaket.tanggalSelesai
                ? new Date(selectedPaket.tanggalSelesai).toLocaleDateString(
                    "id-ID"
                  )
                : "-",
            },
            {
              label: "Lama Proyek",
              value: selectedPaket.lamaProyek
                ? `${selectedPaket.lamaProyek} hari`
                : "-",
            },
          ],
        },
      ]
    : [];

  const dokumenTypes = [
    "KAK/RAB",
    "Spesifikasi Teknis",
    "Kontrak",
    "Timeline",
    "Syarat Khusus",
    "Jaminan Uang Muka",
    "Jaminan Pelaksanaan",
    "Jaminan Pemeliharaan",
  ];

  return (
    <>
      <PageMeta title="Manajemen Paket - Sistem Pengawasan" />
      <PageBreadcrumb pageTitle="Manajemen Paket" />

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Daftar Paket Pengadaan</h2>
            <p className="text-sm text-gray-500">
              Kelola semua paket pengadaan
            </p>
          </div>
          <Button
            size="md"
            variant="primary"
            startIcon={<PlusIcon />}
            onClick={() => {
              resetForm();
              openModal();
            }}
          >
            Tambah Paket
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={pakets}
          searchPlaceholder="Cari paket..."
          loading={loading}
        />
      </div>

      {/* FORM MODAL */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        size="2xl"
        title={editingPaket ? "Edit Paket" : "Tambah Paket"}
      >
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Kode Paket *</Label>
              <Input
                value={formData.kodePaket}
                onChange={(e) =>
                  setFormData({ ...formData, kodePaket: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Kode RUP</Label>
              <Input
                value={formData.kodeRUP}
                onChange={(e) =>
                  setFormData({ ...formData, kodeRUP: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Nilai Paket *</Label>
              <Input
                value={formData.nilaiPaket}
                onChange={(e) =>
                  setFormData({ ...formData, nilaiPaket: e.target.value })
                }
              />
            </div>
          </div>

          <Label>Nama Paket *</Label>
          <Input
            value={formData.namaPaket}
            onChange={(e) =>
              setFormData({ ...formData, namaPaket: e.target.value })
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Jenis Paket *</Label>
              <Select
                options={[
                  { value: "Konstruksi", label: "Konstruksi" },
                  { value: "Barang", label: "Barang" },
                  { value: "Jasa Konsultansi", label: "Jasa Konsultansi" },
                  { value: "Jasa Lainnya", label: "Jasa Lainnya" },
                ]}
                value={formData.jenisPaket}
                onChange={(value) =>
                  setFormData({ ...formData, jenisPaket: value })
                }
              />
            </div>
            <div>
              <Label>Metode Pengadaan *</Label>
              <Select
                options={[
                  { value: "E_PURCHASING", label: "E-Purchasing" },
                  { value: "SWAKELOLA", label: "Swakelola" },
                  { value: "TENDER", label: "Tender" },
                  {
                    value: "PENUNJUKAN_LANGSUNG",
                    label: "Penunjukan Langsung",
                  },
                  { value: "SELEKSI", label: "Seleksi" },
                ]}
                value={formData.metodePengadaan}
                onChange={(value) =>
                  setFormData({ ...formData, metodePengadaan: value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Tanggal Mulai</Label>
              <Input
                type="date"
                value={formData.tanggalMulai}
                onChange={(e) =>
                  setFormData({ ...formData, tanggalMulai: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Tanggal Selesai</Label>
              <Input
                type="date"
                value={formData.tanggalSelesai}
                onChange={(e) =>
                  setFormData({ ...formData, tanggalSelesai: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Lama Proyek (hari)</Label>
              <Input value={formData.lamaProyek} disabled placeholder="Auto" />
            </div>
          </div>

          {/* Upload Dokumen */}
          <div className="border-t pt-4 space-y-4">
            <h4 className="font-medium">Upload Dokumen</h4>
            {dokumenTypes.map((type) => (
              <div
                key={type}
                className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800/40"
              >
                <Label>{type}</Label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          toast.error("Ukuran file maksimal 10MB");
                          return;
                        }
                        setUploadedFiles((prev) => ({ ...prev, [type]: file }));
                      }
                    }}
                    accept=".pdf,.doc,.docx,.xlsx,.jpg,.jpeg,.png"
                    className="flex-1 h-11 rounded-lg border px-3 py-2 text-sm"
                  />
                  {uploadedFiles[type] && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setUploadedFiles((prev) => {
                          const nf = { ...prev };
                          delete nf[type];
                          return nf;
                        });
                      }}
                    >
                      Hapus
                    </Button>
                  )}
                </div>
                {uploadedFiles[type] && (
                  <p className="text-xs mt-1 text-gray-600">
                    ✓ {uploadedFiles[type].name} (
                    {(uploadedFiles[type].size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={closeModal}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      {selectedPaket && (
        <DetailsModal
          isOpen={viewDetailsOpen}
          onClose={() => setViewDetailsOpen(false)}
          title="Detail Paket"
          sections={detailsSections}
        >
          {selectedPaket.dokumen && selectedPaket.dokumen.length > 0 && (
            <div className="border-t mt-4 pt-4">
              <h4 className="font-medium mb-2">Dokumen Terlampir</h4>
              <ul className="space-y-2">
                {selectedPaket.dokumen.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex justify-between items-center p-2 rounded-md border hover:bg-gray-50 dark:hover:bg-gray-800/30"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {doc.jenisDokumen || "Dokumen"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {doc.namaDokumen || doc.filePath}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={doc.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Preview
                      </a>
                      <a
                        href={doc.filePath}
                        download
                        className="text-green-600 hover:underline text-sm"
                      >
                        Download
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </DetailsModal>
      )}
    </>
  );
}
