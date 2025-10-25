import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import BarChartOne from "../components/charts/bar/BarChartOne";
import LineChartOne from "../components/charts/line/LineChartOne";

export default function MonitoringEvaluasi() {
  return (
    <>
      <PageMeta
        title="Monitoring & Evaluasi - Sistem Pengawasan"
        description="Pantau KPI dan evaluasi kinerja pengadaan"
      />
      <PageBreadcrumb pageTitle="Monitoring & Evaluasi" />

      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Dashboard Monitoring & Evaluasi
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Pantau KPI pengadaan dan efisiensi anggaran
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Paket
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                  156
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400">📦</span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Efisiensi Anggaran
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                  92%
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400">💰</span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Temuan Audit
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                  23
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <span className="text-red-600 dark:text-red-400">⚠️</span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Kepatuhan
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                  88%
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                <span className="text-yellow-600 dark:text-yellow-400">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Realisasi Anggaran Bulanan
            </h3>
            <BarChartOne />
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Tren Efisiensi Pengadaan
            </h3>
            <LineChartOne />
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Kinerja per Unit/Satker
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Unit/Satker
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Jumlah Paket
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Efisiensi (%)
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Temuan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                <tr className="hover:bg-gray-50 dark:hover:bg-white/5">
                  <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                    IT Department
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                    45
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                    95%
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                    2
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                      Baik
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-white/5">
                  <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                    Bagian Umum
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                    38
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                    87%
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                    8
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                      Sedang
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-white/5">
                  <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                    Bagian Keuangan
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                    29
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                    92%
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                    3
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                      Baik
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
