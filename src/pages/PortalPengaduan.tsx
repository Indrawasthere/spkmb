import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import TextArea from "../components/form/input/TextArea";
import Badge from "../components/ui/badge/Badge";
import { useToast } from "../hooks/useToast";
import { 
  DocumentTextIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon
} from "@heroicons/react/24/outline";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Validation schema
const pengaduanSchema = z.object({
  nama: z.string().min(2, "Nama harus minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  telepon: z.string().min(10, "Nomor telepon minimal 10 digit"),
  judul: z.string().min(5, "Judul pengaduan minimal 5 karakter"),
  isi: z.string().min(10, "Isi pengaduan minimal 10 karakter"),
  kategori: z.enum(["UMUM", "PELAYANAN", "PENGADAAN", "LAINNYA"])
});

type PengaduanFormData = z.infer<typeof pengaduanSchema>;

interface RecentPengaduan {
  id: string;
  judul: string;
  status: "BARU" | "DIPROSES" | "SELESAI" | "DITOLAK";
  tanggal: string;
  nomor_tiket: string;
}

export default function PortalPengaduan() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [tiketNumber, setTiketNumber] = useState("");
  const [recentPengaduan, setRecentPengaduan] = useState<RecentPengaduan[]>([]);
  const [activeTab, setActiveTab] = useState<"form" | "tracking">("form");

  const { success, error, loading } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<PengaduanFormData>({
    resolver: zodResolver(pengaduanSchema),
    defaultValues: {
      kategori: "UMUM"
    }
  });

  const checkStatus = async (nomorTiket: string) => {
    if (!nomorTiket.trim()) {
      error("Masukkan nomor tiket terlebih dahulu");
      return;
    }

    loading("Mencari status pengaduan...");
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/pengaduan/tracking/${nomorTiket}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecentPengaduan([data]);
        success("Status pengaduan ditemukan");
      } else if (response.status === 404) {
        error("Nomor tiket tidak ditemukan");
        setRecentPengaduan([]);
      } else {
        error("Gagal memeriksa status pengaduan");
      }
    } catch (err) {
      console.error("Tracking error:", err);
      error("Terjadi kesalahan saat memeriksa status");
    }
  };

  const onSubmit = async (data: PengaduanFormData) => {
    setIsSubmitting(true);
    loading("Mengirim pengaduan...");

    try {
      const payload = {
        ...data,
        pelapor: data.nama,
        status: "BARU" as const,
        tanggal: new Date().toISOString()
      };

      const response = await fetch(`${API_BASE_URL}/api/pengaduan/masyarakat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        setTiketNumber(result.nomor_tiket || `TKT-${Date.now()}`);
        setShowSuccess(true);
        reset();
        success("Pengaduan berhasil dikirim!");
        
        // Add to recent submissions
        setRecentPengaduan(prev => [{
          id: result.id,
          judul: data.judul,
          status: "BARU",
          tanggal: new Date().toISOString(),
          nomor_tiket: result.nomor_tiket
        }, ...prev.slice(0, 4)]);
      } else {
        const errorData = await response.json();
        error(`Gagal mengirim pengaduan: ${errorData.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Submit error:", err);
      error("Terjadi kesalahan saat mengirim pengaduan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: RecentPengaduan["status"]) => {
    switch (status) {
      case "SELESAI": return "success";
      case "DIPROSES": return "warning";
      case "BARU": return "info";
      case "DITOLAK": return "error";
      default: return "light";
    }
  };

  const getStatusDisplay = (status: RecentPengaduan["status"]) => {
    switch (status) {
      case "BARU": return "Baru";
      case "DIPROSES": return "Diproses";
      case "SELESAI": return "Selesai";
      case "DITOLAK": return "Ditolak";
      default: return status;
    }
  };

  const stats = [
    {
      icon: DocumentTextIcon,
      label: "Total Pengaduan",
      value: "1.234",
      description: "Tahun 2024"
    },
    {
      icon: CheckCircleIcon,
      label: "Terselesaikan",
      value: "89%",
      description: "Rate penyelesaian"
    },
    {
      icon: ExclamationTriangleIcon,
      label: "Rata-rata Waktu",
      value: "3 Hari",
      description: "Proses pengaduan"
    }
  ];

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900/20 py-12 px-4 sm:px-6 lg:px-8">
        <PageMeta 
          title="SIPAKAT-PBJ - Pengaduan Berhasil" 
          description="Pengaduan masyarakat berhasil dikirim"
        />
        
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircleIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
              Pengaduan Berhasil Dikirim!
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Terima kasih telah menyampaikan pengaduan Anda. Kami akan segera menindaklanjuti pengaduan ini.
            </p>
            
            <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-green-200 dark:border-green-800">
              <div className="text-center">
                <Badge color="success" size="lg" className="text-lg">
                  Nomor Tiket: {tiketNumber}
                </Badge>
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  Simpan nomor tiket ini untuk melacak status pengaduan Anda
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="primary"
                onClick={() => {
                  setShowSuccess(false);
                  setActiveTab("tracking");
                }}
              >
                Lacak Pengaduan Lain
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSuccess(false);
                  reset();
                }}
              >
                Ajukan Pengaduan Baru
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta 
        title="SIPAKAT-PBJ - Portal Pengaduan Masyarakat" 
        description="Sampaikan pengaduan dan keluhan Anda terkait pelayanan publik"
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900/20">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <DocumentTextIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Portal Pengaduan
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Layanan Pengaduan Masyarakat
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">SIPAKAT-PBJ</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Pemerintah Kota</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <stat.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{stat.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex -mb-px">
                    <button
                      onClick={() => setActiveTab("form")}
                      className={`flex-1 py-4 px-6 text-center font-medium text-sm ${
                        activeTab === "form"
                          ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                    >
                      <DocumentTextIcon className="w-5 h-5 inline-block mr-2" />
                      Ajukan Pengaduan
                    </button>
                    <button
                      onClick={() => setActiveTab("tracking")}
                      className={`flex-1 py-4 px-6 text-center font-medium text-sm ${
                        activeTab === "tracking"
                          ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                    >
                      <CheckCircleIcon className="w-5 h-5 inline-block mr-2" />
                      Lacak Status
                    </button>
                  </nav>
                </div>

                <div className="p-6">
                  {activeTab === "form" ? (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                      {/* Personal Information */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                          <UserIcon className="w-5 h-5 mr-2 text-blue-500" />
                          Informasi Pelapor
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="nama">Nama Lengkap *</Label>
                            <Input
                              id="nama"
                              type="text"
                              {...register("nama")}
                              error={!!errors.nama}
                              hint={errors.nama?.message}
                              placeholder="Masukkan nama lengkap"
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">Email *</Label>
                            <Input
                              id="email"
                              type="email"
                              {...register("email")}
                              error={!!errors.email}
                              hint={errors.email?.message}
                              placeholder="email@contoh.com"
                            />
                          </div>
                          <div>
                            <Label htmlFor="telepon">Nomor Telepon *</Label>
                            <Input
                              id="telepon"
                              type="tel"
                              {...register("telepon")}
                              error={!!errors.telepon}
                              hint={errors.telepon?.message}
                              placeholder="08xxxxxxxxxx"
                            />
                          </div>
                          <div>
                            <Label htmlFor="kategori">Kategori Pengaduan</Label>
                            <select
                              id="kategori"
                              {...register("kategori")}
                              className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="UMUM">Umum</option>
                              <option value="PELAYANAN">Pelayanan</option>
                              <option value="PENGADAAN">Pengadaan</option>
                              <option value="LAINNYA">Lainnya</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Complaint Details */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                          <DocumentTextIcon className="w-5 h-5 mr-2 text-blue-500" />
                          Detail Pengaduan
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="judul">Judul Pengaduan *</Label>
                            <Input
                              id="judul"
                              type="text"
                              {...register("judul")}
                              error={!!errors.judul}
                              hint={errors.judul?.message}
                              placeholder="Ringkasan pengaduan Anda"
                            />
                          </div>
                          <div>
                            <Label htmlFor="isi">Isi Pengaduan *</Label>
                            <TextArea
                              id="isi"
                              rows={6}
                              {...register("isi")}
                              error={!!errors.isi}
                              hint={errors.isi?.message}
                              placeholder="Jelaskan detail pengaduan Anda secara lengkap..."
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {watch('isi')?.length || 0}/500 karakter
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          * Wajib diisi
                        </p>
                        <Button
                          type="submit"
                          variant="primary"
                          size="lg"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Mengirim..." : "Kirim Pengaduan"}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    /* Tracking Section */
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                          Lacak Status Pengaduan
                        </h3>
                        <div className="flex gap-4">
                          <Input
                            type="text"
                            placeholder="Masukkan nomor tiket (contoh: TKT-20241234)"
                            value={tiketNumber}
                            onChange={(e) => setTiketNumber(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            variant="primary"
                            onClick={() => checkStatus(tiketNumber)}
                            disabled={!tiketNumber.trim()}
                          >
                            Cek Status
                          </Button>
                        </div>
                      </div>

                      {recentPengaduan.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                            Hasil Pencarian
                          </h4>
                          <div className="space-y-3">
                            {recentPengaduan.map((pengaduan) => (
                              <div
                                key={pengaduan.id}
                                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                      {pengaduan.judul}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                      Tiket: {pengaduan.nomor_tiket} • {new Date(pengaduan.tanggal).toLocaleDateString('id-ID')}
                                    </p>
                                  </div>
                                  <Badge color={getStatusColor(pengaduan.status)}>
                                    {getStatusDisplay(pengaduan.status)}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                  Informasi Penting
                </h3>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li>• Pengaduan akan diproses dalam 1-3 hari kerja</li>
                  <li>• Simpan nomor tiket untuk tracking</li>
                  <li>• Respons akan dikirim via email</li>
                  <li>• Data pelapor dijamin kerahasiaannya</li>
                </ul>
              </div>

              {/* Contact Info */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <EnvelopeIcon className="w-5 h-5 mr-2 text-gray-500" />
                  Kontak Layanan
                </h3>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center">
                    <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
                    <span>(021) 1234-5678</span>
                  </div>
                  <div className="flex items-center">
                    <EnvelopeIcon className="w-4 h-4 mr-2 text-gray-400" />
                    <span>pengaduan@sipakat.go.id</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                    Jam operasional: Senin-Jumat, 08:00-16:00 WIB
                  </p>
                </div>
              </div>

              {/* Recent Submissions */}
              {recentPengaduan.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Pengaduan Terbaru
                  </h3>
                  <div className="space-y-3">
                    {recentPengaduan.slice(0, 3).map((pengaduan) => (
                      <div
                        key={pengaduan.id}
                        className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {pengaduan.judul}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {pengaduan.nomor_tiket}
                          </p>
                        </div>
                        <Badge size="sm" color={getStatusColor(pengaduan.status)}>
                          {getStatusDisplay(pengaduan.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}