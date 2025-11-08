import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const API_BASE_URL = 'http://localhost:3001';

interface AnggaranData {
  name: string;
  value: number;
  color: string;
}

export default function AnggaranChart() {
  const [data, setData] = useState<AnggaranData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAnggaran, setTotalAnggaran] = useState(0);

  useEffect(() => {
    fetchAnggaranData();
  }, []);

  const fetchAnggaranData = async () => {
    try {
      // Fetch proyek PUPR data for anggaran
      const response = await fetch(`${API_BASE_URL}/api/proyek-pupr`, {
        credentials: 'include',
      });

      if (response.ok) {
        const proyekList = await response.json();

        // Calculate total anggaran
        const total = proyekList.reduce((sum: number, proyek: any) => sum + (proyek.anggaran || 0), 0);
        setTotalAnggaran(total);

        // Group by status
        const statusGroups: { [key: string]: number } = {};
        proyekList.forEach((proyek: any) => {
          const status = proyek.status || 'UNKNOWN';
          statusGroups[status] = (statusGroups[status] || 0) + (proyek.anggaran || 0);
        });

        // Convert to chart data
        const colors = {
          'PERENCANAAN': '#fef3c7',
          'PELAKSANAAN': '#dbeafe',
          'SELESAI': '#d1fae5',
          'DITUNDA': '#fee2e2',
          'UNKNOWN': '#f3f4f6'
        };

        const chartData: AnggaranData[] = Object.entries(statusGroups).map(([status, amount]) => ({
          name: status,
          value: amount,
          color: colors[status as keyof typeof colors] || '#f3f4f6'
        }));

        setData(chartData);
      }
    } catch (error) {
      console.error('Error fetching anggaran data:', error);
      // Fallback data
      const fallbackData = [
        { name: 'PERENCANAAN', value: 2500000000, color: '#fef3c7' },
        { name: 'PELAKSANAAN', value: 1800000000, color: '#dbeafe' },
        { name: 'SELESAI', value: 1200000000, color: '#d1fae5' },
        { name: 'DITUNDA', value: 500000000, color: '#fee2e2' },
      ];
      setData(fallbackData);
      setTotalAnggaran(6000000000);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000000000) {
      return `Rp ${(amount / 1000000000000).toFixed(2)}T`;
    } else if (amount >= 1000000000) {
      return `Rp ${(amount / 1000000000).toFixed(2)}M`;
    } else if (amount >= 1000000) {
      return `Rp ${(amount / 1000000).toFixed(2)}Jt`;
    } else if (amount >= 1000) {
      return `Rp ${(amount / 1000).toFixed(0)}Rb`;
    } else {
      return `Rp ${amount.toLocaleString("id-ID")}`;
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
      <div className="mb-4 text-center">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Anggaran Proyek Berdasarkan Status
        </h3>
        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
          {formatCurrency(totalAnggaran)}
        </p>
        <p className="text-sm text-gray-500">Total Anggaran</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
          <XAxis
            dataKey="name"
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
            tickFormatter={(value) => formatCurrency(value).replace('Rp ', '')}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), 'Anggaran']}
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
            dataKey="value"
            fill="#10b981"
            stroke="#059669"
            strokeWidth={1}
            name="Anggaran"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
