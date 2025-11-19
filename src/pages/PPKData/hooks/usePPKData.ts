// src/pages/PPKData/hooks/usePPKData.ts
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { PPKDataRow } from "../components/columns";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const usePPKData = () => {
  const [ppkData, setPpkData] = useState<PPKDataRow[]>([]);
  const [pakets, setPakets] = useState<Array<{ id: string; kodePaket: string; namaPaket: string }>>([]);
  const [loading, setLoading] = useState(false);

  const fetchPPKData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ppk-data`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setPpkData(data);
      } else {
        const text = await res.text();
        console.error("fetchPPKData error:", text);
        toast.error("Gagal memuat data PPK");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPakets = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/paket`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setPakets(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchPPKData();
    fetchPakets();
  }, [fetchPPKData, fetchPakets]);

  return { ppkData, pakets, loading, fetchPPKData, fetchPakets, setPpkData };
};
