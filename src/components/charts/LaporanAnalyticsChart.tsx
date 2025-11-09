import { useState, useEffect } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface LaporanData {
  month: string;
  totalLaporan: number;
  laporanItwasda: number;
  temuanBPKP: number;
  laporanAnalisis: number;
}

export default function LaporanAnalyticsChart() {
  const [data, setData] = useState<LaporanData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLaporanData();
  }, []);

  const fetchLaporanData = async () => {
    try {
      // Fetch multiple laporan data
      const [itwasdaResponse, bpkpResponse, analisisResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/laporan-itwasda`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/temuan-bpkp`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/laporan-analisis`, { credentials: 'include' }),
      ]);

      const monthlyData: { [key: string]: { itwasda: number; bpkp: number; analisis: number } } = {};

      // Process Itwasda data
      if (itwasdaResponse.ok) {
        const itwasdaList = await itwasdaResponse.json();
        itwasdaList.forEach((laporan: any) => {
          const date = new Date(laporan.createdAt || laporan.tanggal || new Date());
          const monthKey = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });

          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { itwasda: 0, bpkp: 0, analisis: 0 };
          }
          monthlyData[monthKey].itwasda++;
        });
      }

      // Process BPKP data
      if (bpkpResponse.ok) {
        const bpkpList = await bpkpResponse.json();
        bpkpList.forEach((temuan: any) => {
          const date = new Date(temuan.createdAt || new Date());
          const monthKey = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });

          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { itwasda: 0, bpkp: 0, analisis: 0 };
          }
          monthlyData[monthKey].bpkp++;
        });
      }

      // Process Analisis data
      if (analisisResponse.ok) {
        const analisisList = await analisisResponse.json();
        analisisList.forEach((analisis: any) => {
          const date = new Date(analisis.generatedAt || new Date());
          const monthKey = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });

          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { itwasda: 0, bpkp: 0, analisis: 0 };
          }
          monthlyData[monthKey].analisis++;
        });
      }

      // Convert to chart data format
      const chartData: LaporanData[] = Object.entries(monthlyData).map(([month, counts]) => ({
        month,
        totalLaporan: counts.itwasda + counts.bpkp + counts.analisis,
        laporanItwasda: counts.itwasda,
        temuanBPKP: counts.bpkp,
        laporanAnalisis: counts.analisis,
      }));

      // Sort by month
      chartData.sort((a, b) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const [aMonth, aYear] = a.month.split(' ');
        const [bMonth, bYear] = b.month.split(' ');

        if (aYear !== bYear) return parseInt(aYear) - parseInt(bYear);
        return months.indexOf(aMonth) - months.indexOf(bMonth);
      });

      setData(chartData);
    } catch (error) {
      console.error('Error fetching laporan data:', error);
      // Fallback data
      setData([
        { month: 'Jan 2024', totalLaporan: 15, laporanItwasda: 8, temuanBPKP: 5, laporanAnalisis: 2 },
        { month: 'Feb 2024', totalLaporan: 18, laporanItwasda: 10, temuanBPKP: 6, laporanAnalisis: 2 },
        { month: 'Mar 2024', totalLaporan: 22, laporanItwasda: 12, temuanBPKP: 8, laporanAnalisis: 2 },
        { month: 'Apr 2024', totalLaporan: 25, laporanItwasda: 14, temuanBPKP: 9, laporanAnalisis: 2 },
        { month: 'May 2024', totalLaporan: 28, laporanItwasda: 16, temuanBPKP: 10, laporanAnalisis: 2 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading chart...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
          <XAxis
            dataKey="month"
            stroke="#6b7280"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              padding: '12px'
            }}
            labelStyle={{ color: '#374151', fontWeight: '600' }}
          />
          <Legend
            wrapperStyle={{
              fontSize: '12px',
              paddingTop: '10px'
            }}
            iconType="circle"
          />
          <Bar
            dataKey="laporanItwasda"
            fill="#dbeafe"
            stroke="#3b82f6"
            strokeWidth={1}
            name="Laporan Itwasda"
            radius={[2, 2, 0, 0]}
          />
          <Bar
            dataKey="temuanBPKP"
            fill="#fef3c7"
            stroke="#f59e0b"
            strokeWidth={1}
            name="Temuan BPKP"
            radius={[2, 2, 0, 0]}
          />
          <Line
            type="monotone"
            dataKey="laporanAnalisis"
            stroke="#10b981"
            strokeWidth={3}
            name="Laporan Analisis"
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#ffffff' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
