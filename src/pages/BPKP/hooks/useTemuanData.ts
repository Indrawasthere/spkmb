// src/pages/BPKP/hooks/useTemuanData.ts
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { TemuanBPKP } from '../components/columns';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Paket {
  id: string;
  kodePaket: string;
  namaPaket: string;
  status: string;
}

interface LaporanItwasda {
  id: string;
  paketId: string;
  status: string;
}

export const useTemuanData = () => {
  const [temuans, setTemuans] = useState<TemuanBPKP[]>([]);
  const [pakets, setPakets] = useState<Paket[]>([]);
  const [laporanItwasda, setLaporanItwasda] = useState<LaporanItwasda[]>([]);
  const [eligiblePakets, setEligiblePakets] = useState<Paket[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTemuans = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/temuan-bpkp`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setTemuans(data);
      } else {
        toast.error('Gagal memuat data temuan');
      }
    } catch (error) {
      console.error('Error fetching temuans:', error);
      toast.error('Terjadi kesalahan saat memuat temuan');
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

  const fetchLaporanItwasda = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/laporan-itwasda`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setLaporanItwasda(data);
      }
    } catch (error) {
      console.error('Error fetching laporan itwasda:', error);
    }
  };

  useEffect(() => {
    fetchTemuans();
    fetchPakets();
    fetchLaporanItwasda();
  }, []);

  useEffect(() => {
    // Filter paket yang eligible untuk temuan BPKP
    // Hanya paket yang sudah punya laporan Itwasda
    const eligible = pakets.filter((paket) => {
      const hasLaporanItwasda = laporanItwasda.some(
        (l) => l.paketId === paket.id
      );
      return hasLaporanItwasda;
    });
    setEligiblePakets(eligible);
  }, [pakets, laporanItwasda]);

  return {
    temuans,
    pakets,
    eligiblePakets,
    loading,
    fetchTemuans,
  };
};