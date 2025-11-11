import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import { MailIcon, ChatIcon } from "../icons";

export default function BantuanPanduan() {
  const faqs = [
    {
      question: "Bagaimana cara menambah paket pengadaan baru?",
      answer: "Klik menu 'Manajemen Paket', kemudian klik tombol 'Tambah Paket' dan isi form yang tersedia.",
    },
    {
      question: "Siapa yang bisa mengakses modul Pengawasan & Audit?",
      answer: "Modul ini dapat diakses oleh Admin Sistem dan Auditor. PPK hanya dapat melihat temuan yang terkait dengan paketnya.",
    },
    {
      question: "Bagaimana cara mengunduh laporan?",
      answer: "Masuk ke menu 'Laporan & Analisis', pilih laporan yang diinginkan, lalu klik tombol 'PDF' atau 'Excel'.",
    },
    {
      question: "Apa yang harus dilakukan jika sertifikat PPK sudah kadaluarsa?",
      answer: "Update data sertifikat di menu 'Kompetensi PPK' dan pastikan PPK mengikuti pelatihan yang diperlukan.",
    },
  ];

  return (
    <>
      <PageMeta
        title="SIPAKAT-PBJ - Bantuan & Panduan"
        description="Panduan penggunaan sistem dan kanal komunikasi"
      />
      <PageBreadcrumb pageTitle="Bantuan & Panduan" />

      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Bantuan & Panduan
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Panduan penggunaan sistem dan kanal komunikasi internal
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Pertanyaan yang Sering Diajukan (FAQ)
            </h3>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                >
                  <h4 className="font-medium text-gray-800 dark:text-white/90 mb-2">
                    {faq.question}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Hubungi Admin
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <MailIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    Email Support
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    support@sistem.go.id
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <ChatIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    Telepon
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    (021) 123-4567
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Button size="md" variant="primary">
                Kirim Pesan
              </Button>
            </div>
          </div>
        </div>

        {/* User Guide */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Panduan Pengguna
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white/90">
                    Panduan Lengkap Sistem Pengawasan
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Dokumentasi lengkap cara menggunakan sistem
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  Unduh PDF
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white/90">
                    Video Tutorial
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tutorial video untuk setiap modul
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  Tonton
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
