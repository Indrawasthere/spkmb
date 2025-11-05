import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API_BASE_URL = 'http://localhost:3001';

interface VendorData {
  month: string;
  totalVendor: number;
  vendorAktif: number;
  vendorNonAktif: number;
}

export default function VendorPerformanceChart() {
  const [data, setData] = useState<VendorData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendorData();
  }, []);

  const fetchVendorData = async () => {
    try {
      // Fetch vendor data
      const response = await fetch(`${API_BASE_URL}/api/vendor`, {
        credentials: 'include',
      });

      if (response.ok) {
        const vendorList = await response.json();

        // Group by month and status
        const monthlyData: { [key: string]: { total: number; AKTIF: number; NON_AKTIF: number } } = {};

        vendorList.forEach((vendor: any) => {
          const date = new Date(vendor.createdAt || new Date());
          const monthKey = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });

          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { total: 0, AKTIF: 0, NON_AKTIF: 0 };
          }

          monthlyData[monthKey].total++;
          const status = vendor.status === 'AKTIF' ? 'AKTIF' : 'NON_AKTIF';
          monthlyData[monthKey][status as keyof typeof monthlyData[string]]++;
        });

        // Convert to chart data format
        const chartData: VendorData[] = Object.entries(monthlyData).map(([month, counts]) => ({
          month,
          totalVendor: counts.total,
          vendorAktif: counts.AKTIF,
          vendorNonAktif: counts.NON_AKTIF,
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
      console.error('Error fetching vendor data:', error);
      // Fallback data
      setData([
        { month: 'Jan 2024', totalVendor: 25, vendorAktif: 22, vendorNonAktif: 3 },
        { month: 'Feb 2024', totalVendor: 28, vendorAktif: 25, vendorNonAktif: 3 },
        { month: 'Mar 2024', totalVendor: 32, vendorAktif: 28, vendorNonAktif: 4 },
        { month: 'Apr 2024', totalVendor: 35, vendorAktif: 31, vendorNonAktif: 4 },
        { month: 'May 2024', totalVendor: 38, vendorAktif: 34, vendorNonAktif: 4 },
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
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
          <Line
            type="monotone"
            dataKey="totalVendor"
            stroke="#6366f1"
            strokeWidth={3}
            name="Total Vendor"
            dot={{ fill: '#6366f1', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7, stroke: '#6366f1', strokeWidth: 2, fill: '#ffffff' }}
          />
          <Line
            type="monotone"
            dataKey="vendorAktif"
            stroke="#10b981"
            strokeWidth={2}
            name="Vendor Aktif"
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#ffffff' }}
          />
          <Line
            type="monotone"
            dataKey="vendorNonAktif"
            stroke="#f59e0b"
            strokeWidth={2}
            name="Vendor Non-Aktif"
            dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2, fill: '#ffffff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
