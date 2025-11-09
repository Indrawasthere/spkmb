import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/AuthContext";
import Badge from "../../components/ui/badge/Badge";
import PaketTrendChart from "../../components/charts/PaketTrendChart";
import AnggaranChart from "../../components/charts/AnggaranChart";
import VendorPerformanceChart from "../../components/charts/VendorPerformanceChart";
import LaporanAnalyticsChart from "../../components/charts/LaporanAnalyticsChart";
import { Assessment, TrendingUp, Business, Analytics } from "@mui/icons-material";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface DashboardStats {
  paket: number;
  laporan: number;
  vendor: number;
  ppk: number;
  pengaduan: number;
}

interface RecentActivity {
  recentPaket: Array<{
    id: string;
    kodePaket: string;
    namaPaket: string;
    tanggalBuat: string;
  }>;
  recentLaporan: Array<{
    id: string;
    nomorLaporan: string;
    jenisLaporan: string;
    createdAt: string;
  }>;
}

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    paket: 0,
    laporan: 0,
    vendor: 0,
    ppk: 0,
    pengaduan: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity>({
    recentPaket: [],
    recentLaporan: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, activityResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/dashboard/stats`, {
          credentials: 'include',
        }),
        fetch(`${API_BASE_URL}/api/dashboard/recent-activity`, {
          credentials: 'include',
        }),
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setRecentActivity(activityData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      label: "Total Paket",
      value: stats.paket,
      icon: <Assessment sx={{ fontSize: 24, color: '#3b82f6' }} />,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/10",
    },
    {
      label: "Total Laporan Itwasda",
      value: stats.laporan,
      icon: <Analytics sx={{ fontSize: 24, color: '#10b981' }} />,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/10",
    },
    {
      label: "Total Vendor",
      value: stats.vendor,
      icon: <Business sx={{ fontSize: 24, color: '#8b5cf6' }} />,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/10",
    },
    {
      label: "Total PPK",
      value: stats.ppk,
      icon: <TrendingUp sx={{ fontSize: 24, color: '#f59e0b' }} />,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-900/10",
    },
  ];

  return (
    <>
      <PageMeta
        title="Dashboard - SIP-KPBJ"
        description="Dashboard overview and key metrics"
      />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Welcome back {user?.firstName} {user?.lastName} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Sistem Pengawasan dan Pengendalian Pengadaan Barang/Jasa
        </p>
        
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
        {statsCards.map((stat, index) => (
          <div
            key={index}
            className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                  {loading ? "..." : stat.value}
                </p>
              </div>
              <div className={`h-12 w-12 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                <span className={stat.color}>{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
        {/* Pengaduan Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Pengaduan
              </p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white/90">
                {loading ? "..." : stats.pengaduan}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-50 dark:bg-red-900/10 flex items-center justify-center">
              <span className="text-red-600 dark:text-red-400">
                <Assessment sx={{ fontSize: 24, color: '#ef4444' }} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Paket */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Paket Terbaru
          </h3>
          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : recentActivity.recentPaket.length > 0 ? (
              recentActivity.recentPaket.map((paket) => (
                <div
                  key={paket.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white/90">
                      {paket.kodePaket}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {paket.namaPaket}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(paket.tanggalBuat).toLocaleDateString('id-ID')}
                    </p>
                    <Badge size="sm" color="info">Baru</Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Belum ada paket</p>
            )}
          </div>
        </div>

        {/* Recent Laporan */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Laporan Terbaru
          </h3>
          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : recentActivity.recentLaporan.length > 0 ? (
              recentActivity.recentLaporan.map((laporan) => (
                <div
                  key={laporan.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white/90">
                      {laporan.nomorLaporan}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {laporan.jenisLaporan}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(laporan.createdAt).toLocaleDateString('id-ID')}
                    </p>
                    <Badge size="sm" color="success">Baru</Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Belum ada laporan</p>
            )}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Paket Trend Chart */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Trend Paket Bulanan
          </h3>
          <PaketTrendChart />
        </div>

        {/* Anggaran Chart */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <AnggaranChart />
        </div>
      </div>

      {/* Additional Charts */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Vendor Performance Chart */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Performa Vendor
          </h3>
          <VendorPerformanceChart />
        </div>

        {/* Laporan Analytics Chart */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Analisis Laporan
          </h3>
          <LaporanAnalyticsChart />
        </div>
      </div>

      {/* Quick Actions */}
      
    </>
  );
}
