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
import TextArea from "../components/form/input/TextArea";
import Select from "../components/form/Select";
import { DataTable } from "../components/common/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { ActionButtons } from "../components/common/ActionButtons";
import { DetailsModal } from "../components/common/DetailsModal";
import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Pengaduan {
  id: string;
  judul: string;
  isi: string;
  status: "BARU" | "DIPROSES" | "SELESAI" | "DITOLAK";
  tanggal: string;
  pelapor: string;
  createdAt: string;
  updatedAt: string;
}

export default function Pengaduan() {
  const [pengaduans, setPengaduans] = useState<Pengaduan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedData, setSelectedData] = useState<Pengaduan | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingPengaduan, setEditingPengaduan] = useState<Pengaduan | null>(null);

  const [formData, setFormData] = useState({
    judul: "",
    isi: "",
    pelapor: "",
    status: "BARU" as Pengaduan["status"],
  });

  const { isOpen, openModal, closeModal } = useModal();

  useEffect(() => {
    fetchPengaduans();
  }, []);

  const fetchPengaduans = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/pengaduan`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setPengaduans(data);
      }
    } catch (err) {
      console.error("Fetch pengaduan error:", err);
      toast.error("Gagal memuat pengaduan");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.judul || !formData.isi || !formData.pelapor) {
      toast.error("Lengkapi semua field yang wajib");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        judul: formData.judul.trim(),
        isi: formData.isi.trim(),
        pelapor: formData.pelapor.trim(),
        status: formData.status,
      };

      const url = editingPengaduan
        ? `${API_BASE_URL}/api/pengaduan/${editingPengaduan.id}`
        : `${API_BASE_URL}/api/pengaduan`;
      const method = editingPengaduan ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingPengaduan ? "Pengaduan diperbarui" : "Pengaduan ditambahkan");
        await fetchPengaduans();
        closeModal();
        resetForm();
      } else {
        toast.error("Gagal menyimpan pengaduan");
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pengaduan: Pengaduan) => {
    setEditingPengaduan(pengaduan);
    setFormData({
      judul: pengaduan.judul,
      isi: pengaduan.isi,
      pelapor: pengaduan.pelapor,
      status: pengaduan.status,
    });
    openModal();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus pengaduan ini?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/pengaduan/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Pengaduan dihapus");
        await fetchPengaduans();
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus pengaduan");
    }
  };

  const resetForm = () => {
    setFormData({
      judul: "",
      isi: "",
      pelapor: "",
      status: "BARU",
    });
    setEditingPengaduan(null);
  };

  const getStatusColor = (status: Pengaduan["status"]) => {
    switch (status) {
      case "SELESAI": return "success";
      case "DIPROSES": return "warning";
      case "BARU": return "info";
      case "DITOLAK": return "error";
      default: return "light";
    }
  };

  const columns: ColumnDef<Pengaduan>[] = [
    {
      accessorKey: "judul",
      header: "Judul Pengaduan",
      cell: ({ row }) => <span className="font-medium">{row.original.judul}</span>,
    },
    {
      accessorKey: "pelapor",
      header: "Pelapor",
    },
    {
      accessorKey: "tanggal",
      header: "Tanggal",
      cell: ({ row }) => new Date(row.original.tanggal).toLocaleDateString("id-ID"),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge size="sm" color={getStatusColor(row.original.status)}>
          {row.original.status}
        </Badge>
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

  const filteredPengaduans = filterStatus === "all"
    ? pengaduans
    : pengaduans.filter((p) => p.status === filterStatus);

  const detailsSections = selectedData
    ? [
        {
          title: "Informasi Pengaduan",
          fields: [
            { label: "Judul", value: selectedData.judul },
            { label: "Pelapor", value: selectedData.pelapor },
            { label: "Tanggal", value: new Date(selectedData.tanggal).toLocaleDateString("id-ID") },
            { label: "Status", value: <Badge color={getStatusColor(selectedData.status)}>{selectedData.status}</Badge> },
            { label: "Isi Pengaduan", value: selectedData.isi, fullWidth: true },
          ],
        },
      ]
    : [];

  const stats = [
    { label: "Total Pengaduan", value: pengaduans.length, color: "text-brand-500" },
    { label: "Baru", value: pengaduans.filter((p) => p.status === "BARU").length, color: "text-info-500" },
    { label: "Diproses", value: pengaduans.filter((p) => p.status === "DIPROSES").length, color: "text-warning-500" },
    { label: "Selesai", value: pengaduans.filter((p) => p.status === "SELESAI").length, color: "text-success-500" },
  ];

  return (
    <>
      <PageMeta title="SIPAKAT-PBJ - Pengaduan Masyarakat" />
      <PageBreadcrumb pageTitle="Pengaduan Masyarakat" />

      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <h3 className={`mt-2 text-3xl font-bold ${stat.color}`}>{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Daftar Pengaduan Masyarakat</h2>
            <p className="text-sm text-gray-500 mt-1">Kelola pengaduan dari masyarakat</p>
          </div>
          <Button size="md" variant="primary" startIcon={<PlusIcon />} onClick={() => { resetForm(); openModal(); }}>
            Tambah Pengaduan
          </Button>
        </div>

        {/* Filter */}
        <div className="rounded-lg border p-4">
          <select className="h-10 rounded-md border px-3" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Semua Status</option>
            <option value="BARU">Baru</option>
            <option value="DIPROSES">Diproses</option>
            <option value="SELESAI">Selesai</option>
            <option value="DITOLAK">Ditolak</option>
          </select>
        </div>

        {/* Table */}
        <DataTable columns={columns} data={filteredPengaduans} searchPlaceholder="Cari pengaduan..." loading={loading} />
      </div>

      {/* Modal Form */}
      <Modal isOpen={isOpen} onClose={closeModal} size="2xl" title={editingPengaduan ? "Edit Pengaduan" : "Tambah Pengaduan"} showHeader>
        <div className="p-6 space-y-4">
          <div>
            <Label>Judul Pengaduan *</Label>
            <Input value={formData.judul} onChange={(e) => setFormData({ ...formData, judul: e.target.value })} placeholder="Judul pengaduan..." />
          </div>

          <div>
            <Label>Pelapor *</Label>
            <Input value={formData.pelapor} onChange={(e) => setFormData({ ...formData, pelapor: e.target.value })} placeholder="Nama pelapor..." />
          </div>

          {editingPengaduan && (
            <div>
              <Label>Status</Label>
              <Select
                options={[
                  { value: "BARU", label: "Baru" },
                  { value: "DIPROSES", label: "Diproses" },
                  { value: "SELESAI", label: "Selesai" },
                  { value: "DITOLAK", label: "Ditolak" },
                ]}
                value={formData.status}
                onChange={(v) => setFormData({ ...formData, status: v as Pengaduan["status"] })}
              />
            </div>
          )}

          <div>
            <Label>Isi Pengaduan *</Label>
            <TextArea rows={6} value={formData.isi} onChange={(v) => setFormData({ ...formData, isi: v })} placeholder="Detail pengaduan..." />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={closeModal}>Batal</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Details Modal */}
      {selectedData && (
        <DetailsModal isOpen={viewDetailsOpen} onClose={() => setViewDetailsOpen(false)} title="Detail Pengaduan" sections={detailsSections} />
      )}
    </>
  );
}