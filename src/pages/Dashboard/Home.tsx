import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/AuthContext";
import Badge from "../../components/ui/badge/Badge";

const API_BASE_URL = 'http://localhost:3001';

interface DashboardStats {
  paket: number;
  laporan: number;
  vendor: number;
  ppk: number;
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
      icon: "📦",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      label: "Total Laporan Itwasda",
      value: stats.laporan,
      icon: "📋",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      label: "Total Vendor",
      value: stats.vendor,
      icon: "🏢",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      label: "Total PPK",
      value: stats.ppk,
      icon: "👤",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
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

      {/* Quick Actions */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors">
            <span className="text-2xl">📦</span>
            <div>
              <p className="font-medium text-gray-800 dark:text-white/90">Tambah Paket</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Buat paket baru</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors">
            <span className="text-2xl">📋</span>
            <div>
              <p className="font-medium text-gray-800 dark:text-white/90">Laporan Itwasda</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Buat laporan audit</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors">
            <span className="text-2xl">📊</span>
            <div>
              <p className="font-medium text-gray-800 dark:text-white/90">Monitoring</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pantau progress</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors">
            <span className="text-2xl">📈</span>
            <div>
              <p className="font-medium text-gray-800 dark:text-white/90">Laporan Analisis</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Generate report</p>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
