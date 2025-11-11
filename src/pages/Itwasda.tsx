import { useState, useEffect, useMemo } from "react";
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
import { StatsCard } from "../components/common/StatsCard";
import { ColumnDef } from "@tanstack/react-table";
import { ActionButtons } from "../components/common/ActionButtons";
import { DetailsModal } from "../components/common/DetailsModal";
import toast from "react-hot-toast";
import {
  DocumentChartBarIcon as DocumentIcon,
  FolderIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface LaporanItwasda {
  id: string;
  nomorLaporan: string;
  paketId: string;
  jenisLaporan: string;
  deskripsi: string;
  tingkatKualitasTemuan: "RENDAH" | "SEDANG" | "TINGGI" | "KRITIS";
  status: "BARU" | "PROSES" | "SELESAI" | "DITUNDA";
  tanggal: string;
  auditor: string;
  pic: string;
  filePath?: string;
  paket?: { kodePaket: string; namaPaket: string };
  createdAt?: string;
  updatedAt?: string;
}

interface Paket {
  id: string;
  kodePaket: string;
  namaPaket: string;
  status: string;
}

export default function Itwasda() {
  const [laporan, setLaporan] = useState<LaporanItwasda[]>([]);
  const [pakets, setPakets] = useState<Paket[]>([]);
  const [selectedData, setSelectedData] = useState<LaporanItwasda | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingLaporan, setEditingLaporan] = useState<LaporanItwasda | null>(null);

  const { isOpen, openModal, closeModal } = useModal();
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);

  // === FILTERING STATE - Centralized ===
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterKualitas, setFilterKualitas] = useState("all");

  const [formData, setFormData] = useState({
    nomorLaporan: "",
    paketId: "",
    jenisLaporan: "",
    deskripsi: "",
    tingkatKualitasTemuan: "" as LaporanItwasda["tingkatKualitasTemuan"] | "",
    auditor: "",
    pic: "",
    file: null as File | null,
  });

  // --- fetches ---
  useEffect(() => {
    fetchLaporan();
    fetchPakets();
  }, []);

  const fetchLaporan = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/laporan-itwasda`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setLaporan(data);
      } else {
        console.error("fetch laporan failed", await res.text());
      }
    } catch (err) {
      console.error("Fetch laporan error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPakets = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/paket`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setPakets(data);
      }
    } catch (err) {
      console.error("Fetch paket error:", err);
    }
  };

  // --- helpers for status / colors ---
  const getStatusColor = (status: LaporanItwasda["status"]) => {
    switch (status) {
      case "SELESAI": return "success";
      case "PROSES": return "warning";
      case "BARU": return "info";
      case "DITUNDA": return "error";
      default: return "light";
    }
  };

  const getKualitasTemuanColor = (k: LaporanItwasda["tingkatKualitasTemuan"]) => {
    switch (k) {
      case "KRITIS": return "error";
      case "TINGGI": return "warning";
      case "SEDANG": return "info";
      case "RENDAH": return "success";
      default: return "light";
    }
  };

  // --- open details ---
  const handleViewDetails = (data: LaporanItwasda) => {
    setSelectedData(data);
    setViewDetailsOpen(true);
  };

  // --- submit (create or update) ---
  const handleSubmit = async () => {
    // basic validation
    if (!formData.nomorLaporan || !formData.paketId || !formData.jenisLaporan) {
      toast.error("Lengkapi nomor, paket, dan jenis laporan dulu.");
      return;
    }

    setLoading(true);
    try {
      // 1) create or update base record (JSON) if creating
      let created: LaporanItwasda | null = null;
      if (!editingLaporan) {
        const payload = {
          nomorLaporan: formData.nomorLaporan.trim(),
          paketId: formData.paketId,
          jenisLaporan: formData.jenisLaporan,
          deskripsi: formData.deskripsi.trim(),
          tingkatKualitasTemuan: formData.tingkatKualitasTemuan,
          auditor: formData.auditor.trim(),
          pic: formData.pic.trim(),
          tanggal: new Date().toISOString(),
          status: "BARU",
        };
        const res = await fetch(`${API_BASE_URL}/api/laporan-itwasda`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Unknown" }));
          throw new Error(err.error || "Gagal membuat laporan");
        }
        created = await res.json();
      } else {
        // update base non-file fields via PUT with JSON first
        const payload = {
          nomorLaporan: formData.nomorLaporan.trim(),
          paketId: formData.paketId,
          jenisLaporan: formData.jenisLaporan,
          deskripsi: formData.deskripsi.trim(),
          tingkatKualitasTemuan: formData.tingkatKualitasTemuan,
          auditor: formData.auditor.trim(),
          pic: formData.pic.trim(),
          tanggal: editingLaporan.tanggal || new Date().toISOString(),
        };
        const res = await fetch(`${API_BASE_URL}/api/laporan-itwasda/${editingLaporan.id}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Unknown" }));
          throw new Error(err.error || "Gagal update laporan");
        }
        created = await res.json();
      }

      // 2) if file present, upload using FormData to PUT endpoint
      if (formData.file && created) {
        const fd = new FormData();
        fd.append("filePath", formData.file);
        fd.append("nomorLaporan", created.nomorLaporan);
        const upRes = await fetch(`${API_BASE_URL}/api/laporan-itwasda/${created.id}`, {
          method: "PUT",
          credentials: "include",
          body: fd,
        });
        if (!upRes.ok) {
          const txt = await upRes.text().catch(() => "unknown");
          throw new Error("Upload file gagal: " + txt);
        }
        created = await upRes.json();
      }

      toast.success(editingLaporan ? "Laporan diperbarui" : "Laporan dibuat");
      await fetchLaporan();
      await fetchPakets();
      closeModal();
      resetForm();

      // open details of created/updated item
      if (created) {
        setSelectedData(created);
        setViewDetailsOpen(true);
      }
    } catch (err: any) {
      console.error("Submit error:", err);
      toast.error(err.message || "Terjadi kesalahan saat menyimpan laporan");
    } finally {
      setLoading(false);
    }
  };

  // --- change status helper (used from details modal) ---
  const changeStatus = async (id: string, newStatus: LaporanItwasda["status"]) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/laporan-itwasda/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "unknown");
        throw new Error("Gagal ubah status: " + txt);
      }
      const updated = await res.json();
      toast.success("Status diperbarui: " + newStatus);
      await fetchLaporan();
      setSelectedData(updated);
    } catch (err) {
      console.error(err);
      toast.error("Gagal ubah status");
    } finally {
      setLoading(false);
    }
  };

  // --- edit / delete ---
  const handleEdit = (lap: LaporanItwasda) => {
    setEditingLaporan(lap);
    setFormData({
      nomorLaporan: lap.nomorLaporan,
      paketId: lap.paketId,
      jenisLaporan: lap.jenisLaporan,
      deskripsi: lap.deskripsi,
      tingkatKualitasTemuan: lap.tingkatKualitasTemuan,
      auditor: lap.auditor,
      pic: lap.pic,
      file: null,
    });
    openModal();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus laporan ini?")) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/laporan-itwasda/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "unknown");
        throw new Error("Gagal hapus: " + txt);
      }
      toast.success("Laporan dihapus");
      await fetchLaporan();
      setSelectedData(null);
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus laporan");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nomorLaporan: "",
      paketId: "",
      jenisLaporan: "",
      deskripsi: "",
      tingkatKualitasTemuan: "" as any,
      auditor: "",
      pic: "",
      file: null,
    });
    setEditingLaporan(null);
  };

  // --- UI: columns ---
  const columns: ColumnDef<LaporanItwasda>[] = [
    {
      accessorKey: "nomorLaporan",
      header: "No. Laporan",
      cell: ({ row }) => <span className="font-medium">{row.original.nomorLaporan}</span>,
    },
    {
      accessorKey: "paket",
      header: "Paket",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.paket?.kodePaket}</p>
          <p className="text-xs text-gray-500">{row.original.paket?.namaPaket}</p>
        </div>
      ),
    },
    { accessorKey: "jenisLaporan", header: "Jenis" },
    {
      accessorKey: "tingkatKualitasTemuan",
      header: "Kualitas",
      cell: ({ row }) => <Badge size="sm" color={getKualitasTemuanColor(row.original.tingkatKualitasTemuan)}>{row.original.tingkatKualitasTemuan}</Badge>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge size="sm" color={getStatusColor(row.original.status)}>{row.original.status}</Badge>,
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <ActionButtons
          onView={() => handleViewDetails(row.original)}
          onEdit={() => handleEdit(row.original)}
          onDelete={() => handleDelete(row.original.id)}
        />
      ),
    },
  ];

  // --- computed lists ---
  const eligiblePakets = pakets.filter(p => (p.status === "ON_PROGRESS" || p.status === "PUBLISHED"));
  const paketOptions = eligiblePakets.map(p => ({ value: p.id, label: `${p.kodePaket} - ${p.namaPaket}` }));

  // === COMPUTED FILTERED DATA - useMemo untuk performance ===
  const filteredLaporan = useMemo(() => {
    return laporan.filter((l) => {
      // Search filter
      const matchSearch =
        searchQuery === "" ||
        l.nomorLaporan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.jenisLaporan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.auditor.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchStatus = filterStatus === "all" || l.status === filterStatus;

      // Kualitas filter
      const matchKualitas = filterKualitas === "all" || l.tingkatKualitasTemuan === filterKualitas;

      return matchSearch && matchStatus && matchKualitas;
    });
  }, [laporan, searchQuery, filterStatus, filterKualitas]);

  // --- modal detail sections ---
  const detailsSections = selectedData ? [
    {
      title: "Informasi Dasar",
      fields: [
        { label: "Nomor Laporan", value: selectedData.nomorLaporan },
        { label: "Jenis Laporan", value: selectedData.jenisLaporan },
        { label: "Auditor", value: selectedData.auditor },
        { label: "PIC", value: selectedData.pic },
        { label: "Tanggal", value: selectedData.tanggal ? new Date(selectedData.tanggal).toLocaleDateString("id-ID") : "-" },
        { label: "Status", value: selectedData.status },
        { label: "Deskripsi", value: selectedData.deskripsi || "-", fullWidth: true },
      ],
    }
  ] : [];

  return (
    <>
      <PageMeta title="SIPAKAT-PBJ - Itwasda" description="Itwasda - laporan & temuan" />
      <PageBreadcrumb pageTitle="Itwasda" />

      <div className="space-y-6">
        {/* Info Alert */}
        {eligiblePakets.length === 0 && (
          <div className="rounded-lg border border-info-300 bg-info-50 p-4 dark:border-info-800 dark:bg-info-900/20">
            <p className="text-sm text-info-800 dark:text-info-200">
              ℹ️ Tidak ada paket eligible. Temuan Itwasda hanya bisa dibuat untuk paket dengan status "Pelaksanaan" atau "Dipublikasi".
            </p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Total Temuan"
            value={laporan.length}
            subtitle="Dokumen tersimpan di sistem"
            icon={DocumentIcon}
            fromColor="from-blue-500"
            toColor="to-blue-600"
          />
          <StatsCard
            title="Temuan Kualitas Tinggi"
            value={laporan.filter(l => l.tingkatKualitasTemuan === "TINGGI").length}
            subtitle="Total laporan dengan tingkat kualitas tinggi"
            icon={ChartBarIcon}
            fromColor="from-red-500"
            toColor="to-orange-600"
          />
          <StatsCard
            title="Paket Eligible"
            value={eligiblePakets.length}
            subtitle="Paket dengan temuan"
            icon={FolderIcon}
            fromColor="from-purple-500"
            toColor="to-purple-600"
          />
        </div>

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Daftar Laporan Itwasda</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Kelola laporan inspeksi dan temuan</p>
          </div>
          <Button 
            size="md" 
            variant="primary" 
            startIcon={<PlusIcon />} 
            onClick={() => { resetForm(); openModal(); }} 
            disabled={eligiblePakets.length === 0}
          >
            Tambah Temuan
          </Button>
        </div>

        {/* === CUSTOM FILTER BAR === */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Status Filter */}
            <select
              className="border border-gray-300 dark:border-gray-600 rounded-lg py-2 pl-3 pr-10 text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M4%206l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[right_0.5rem_center] bg-no-repeat"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="BARU">Baru</option>
              <option value="PROSES">Proses</option>
              <option value="SELESAI">Selesai</option>
              <option value="DITUNDA">Ditunda</option>
            </select>

            {/* Kualitas Filter */}
            <select
              className="border border-gray-300 dark:border-gray-600 rounded-lg py-2 pl-3 pr-10 text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M4%206l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[right_0.5rem_center] bg-no-repeat"
              value={filterKualitas}
              onChange={(e) => setFilterKualitas(e.target.value)}
            >
              <option value="all">Semua Kualitas</option>
              <option value="RENDAH">Rendah</option>
              <option value="SEDANG">Sedang</option>
              <option value="TINGGI">Tinggi</option>
              <option value="KRITIS">Kritis</option>
            </select>
          </div>

          <div className="text-sm text-gray-500">Eligible paket: {eligiblePakets.length}</div>
        </div>

        {/* DataTable - WITH FIXED DIMENSIONS */}
        <DataTable 
          columns={columns} 
          data={filteredLaporan} 
          searchPlaceholder="Cari laporan..." 
          loading={loading}
          enableExport={true}
          enableColumnVisibility={false}
          pageSize={10}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          fixedHeight="750px"
          fixedWidth="1300px"
          minVisibleRows={10}
        />
      </div>

      {/* Form Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} size="2xl" title={editingLaporan ? "Edit Laporan Itwasda" : "Tambah Temuan Itwasda"} showHeader>
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-4">
          <Label>Nomor Laporan</Label>
          <Input value={formData.nomorLaporan} onChange={(e) => setFormData({...formData, nomorLaporan: e.target.value})} placeholder="ITW-2025-001" />

          <Label>Paket</Label>
          <Select options={paketOptions} placeholder="Pilih paket (hanya paket eligible)" onChange={(v) => setFormData({...formData, paketId: v})} value={formData.paketId} />

          <Label>Jenis Laporan</Label>
          <Select options={[
            { value: "Inspeksi Teknis", label: "Inspeksi Teknis" },
            { value: "Audit", label: "Audit" },
            { value: "Supervisi", label: "Supervisi" },
            { value: "Monitoring", label: "Monitoring" },
          ]} onChange={(v) => setFormData({...formData, jenisLaporan: v})} value={formData.jenisLaporan} />

          <Label>Tingkat Kualitas Temuan</Label>
          <Select options={[
            { value: "RENDAH", label: "Rendah" },
            { value: "SEDANG", label: "Sedang" },
            { value: "TINGGI", label: "Tinggi" },
            { value: "KRITIS", label: "Kritis" },
          ]} onChange={(v) => setFormData({...formData, tingkatKualitasTemuan: v as any})} value={formData.tingkatKualitasTemuan} />

          <Label>Deskripsi</Label>
          <TextArea rows={4} value={formData.deskripsi} onChange={(v) => setFormData({...formData, deskripsi: v})} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Auditor</Label>
              <Input value={formData.auditor} onChange={(e) => setFormData({...formData, auditor: e.target.value})} />
            </div>
            <div>
              <Label>PIC</Label>
              <Input value={formData.pic} onChange={(e) => setFormData({...formData, pic: e.target.value})} />
            </div>
          </div>

          <div>
            <Label>Upload Dokumen (opsional — max 10MB)</Label>
            <input type="file" accept=".pdf,.doc,.docx,.xlsx,.jpg,.jpeg,.png" onChange={(e) => {
              const f = e.target.files?.[0] || null;
              if (f && f.size > 10 * 1024 * 1024) { toast.error("Ukuran file maksimal 10MB"); return; }
              setFormData({...formData, file: f});
            }} className="w-full h-11 rounded-lg border px-3" />
            {formData.file && <p className="text-xs mt-2 text-gray-500">✓ {formData.file.name} ({(formData.file.size/1024/1024).toFixed(2)} MB)</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => { closeModal(); resetForm(); }}>Batal</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={loading}>{loading ? "Menyimpan..." : "Simpan Laporan"}</Button>
          </div>
        </div>
      </Modal>

      {/* Details Modal with preview + quick status actions */}
      {selectedData && (
        <DetailsModal isOpen={viewDetailsOpen} onClose={() => setViewDetailsOpen(false)} title={`Detail Itwasda - ${selectedData.nomorLaporan}`} sections={detailsSections}>
          <div className="flex gap-2 justify-end mb-3">
            {/* Quick status buttons */}
            <Button size="sm" variant="outline" onClick={() => changeStatus(selectedData.id, "PROSES")}>Set PROSES</Button>
            <Button size="sm" variant="primary" onClick={() => changeStatus(selectedData.id, "SELESAI")}>Set SELESAI</Button>
          </div>

          {selectedData.filePath ? (
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-2">Dokumen Terlampir</h4>
              {selectedData.filePath.endsWith(".pdf") ? (
                <iframe src={selectedData.filePath} className="w-full h-[500px] border rounded-lg" title="Preview PDF"></iframe>
              ) : selectedData.filePath.match(/\.(jpg|jpeg|png)$/i) ? (
                <img src={selectedData.filePath} alt="Preview" className="w-full rounded-lg border" />
              ) : (
                <a href={selectedData.filePath} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Lihat / Unduh Dokumen</a>
              )}
            </div>
          ) : (
            <div className="border-t pt-4 mt-4 text-sm text-gray-500">
              Tidak ada dokumen terlampir.
            </div>
          )}
        </DetailsModal>
      )}
    </>
  );
}