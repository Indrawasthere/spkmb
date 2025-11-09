import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface PaketData {
  month: string;
  totalPaket: number;
  paketDRAFT: number;
  paketON_PROGRESS: number;
  paketCOMPLETED: number;
}

export default function PaketTrendChart() {
  const [data, setData] = useState<PaketData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaketTrendData();
  }, []);

  const fetchPaketTrendData = async () => {
    try {
      // Fetch paket data and group by month
      const response = await fetch(`${API_BASE_URL}/api/paket`, {
        credentials: 'include',
      });

      if (response.ok) {
        const paketList = await response.json();

        // Group by month and status
        const monthlyData: { [key: string]: { total: number; DRAFT: number; ON_PROGRESS: number; COMPLETED: number } } = {};

        paketList.forEach((paket: any) => {
          const date = new Date(paket.tanggalBuat);
          if (date.getFullYear() >= 2025) {
            const monthKey = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });

            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = { total: 0, DRAFT: 0, ON_PROGRESS: 0, COMPLETED: 0 };
            }

            monthlyData[monthKey].total++;
            monthlyData[monthKey][paket.status as keyof typeof monthlyData[string]]++;
          }
        });

        // Convert to chart data format
        const chartData: PaketData[] = Object.entries(monthlyData).map(([month, counts]) => ({
          month,
          totalPaket: counts.total,
          paketDRAFT: counts.DRAFT,
          paketON_PROGRESS: counts.ON_PROGRESS,
          paketCOMPLETED: counts.COMPLETED,
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
      }
    } catch (error) {
      console.error('Error fetching paket trend data:', error);
      // Fallback data
      setData([
        { month: 'Jan 2025', totalPaket: 12, paketDRAFT: 8, paketON_PROGRESS: 3, paketCOMPLETED: 1 },
        { month: 'Feb 2025', totalPaket: 15, paketDRAFT: 10, paketON_PROGRESS: 4, paketCOMPLETED: 1 },
        { month: 'Mar 2025', totalPaket: 18, paketDRAFT: 12, paketON_PROGRESS: 5, paketCOMPLETED: 1 },
        { month: 'Apr 2025', totalPaket: 22, paketDRAFT: 15, paketON_PROGRESS: 6, paketCOMPLETED: 1 },
        { month: 'May 2025', totalPaket: 20, paketDRAFT: 13, paketON_PROGRESS: 6, paketCOMPLETED: 1 },
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
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
            dataKey="paketDRAFT"
            fill="#fef3c7"
            stroke="#f59e0b"
            strokeWidth={1}
            name="Draft"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="paketON_PROGRESS"
            fill="#dbeafe"
            stroke="#3b82f6"
            strokeWidth={1}
            name="On Progress"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="paketCOMPLETED"
            fill="#d1fae5"
            stroke="#10b981"
            strokeWidth={1}
            name="Completed"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
