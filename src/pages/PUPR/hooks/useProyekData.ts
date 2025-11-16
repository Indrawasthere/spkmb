// src/pages/PUPR/hooks/useProyekData.ts
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ProyekPUPR } from '../components/columns';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const useProyekData = () => {
  const [proyek, setProyek] = useState<ProyekPUPR[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProyek = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/proyek-pupr`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setProyek(data);
      } else {
        toast.error('Gagal memuat data proyek');
      }
    } catch (error) {
      console.error('Error fetching proyek:', error);
      toast.error('Terjadi kesalahan saat memuat proyek');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProyek();
  }, []);

  return {
    proyek,
    loading,
    fetchProyek,
  };
};