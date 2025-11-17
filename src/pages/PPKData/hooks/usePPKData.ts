// src/pages/PPKData/hooks/usePPKData.ts
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { PPKData } from '../components/columns';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Paket {
  id: string;
  kodePaket: string;
  namaPaket: string;
}

export const usePPKData = () => {
  const [ppkData, setPpkData] = useState<PPKData[]>([]);
  const [pakets, setPakets] = useState<Paket[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPPKData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/ppk-data`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setPpkData(data);
      } else {
        toast.error('Gagal memuat data PPK');
      }
    } catch (error) {
      console.error('Error fetching PPK data:', error);
      toast.error('Terjadi kesalahan saat memuat data PPK');
    } finally {
      setLoading(false);
    }
  };

  const fetchPakets = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/paket`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setPakets(data);
      }
    } catch (error) {
      console.error('Error fetching pakets:', error);
    }
  };

  useEffect(() => {
    fetchPPKData();
    fetchPakets();
  }, []);

  return {
    ppkData,
    pakets,
    loading,
    fetchPPKData,
  };
};