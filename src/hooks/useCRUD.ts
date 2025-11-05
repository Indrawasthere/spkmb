import { useState, useCallback } from 'react';

interface UseCRUDOptions<T> {
  initialData?: T[];
  onCreate?: (data: Partial<T>) => Promise<T>;
  onUpdate?: (id: string, data: Partial<T>) => Promise<T>;
  onDelete?: (id: string) => Promise<void>;
}

interface UseCRUDReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  create: (data: Partial<T>) => Promise<void>;
  update: (id: string, data: Partial<T>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T[]>>;
  clearError: () => void;
}

export function useCRUD<T extends { id: string }>({
  initialData = [],
  onCreate,
  onUpdate,
  onDelete,
}: UseCRUDOptions<T> = {}): UseCRUDReturn<T> {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const create = useCallback(async (newData: Partial<T>) => {
    setLoading(true);
    setError(null);
    try {
      if (onCreate) {
        const createdItem = await onCreate(newData);
        setData(prev => [createdItem, ...prev]);
      } else {
        // Fallback for local state management
        const tempId = Date.now().toString();
        const item = { ...newData, id: tempId } as T;
        setData(prev => [item, ...prev]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onCreate]);

  const update = useCallback(async (id: string, updateData: Partial<T>) => {
    setLoading(true);
    setError(null);
    try {
      if (onUpdate) {
        const updatedItem = await onUpdate(id, updateData);
        setData(prev => prev.map(item => item.id === id ? updatedItem : item));
      } else {
        // Fallback for local state management
        setData(prev => prev.map(item =>
          item.id === id ? { ...item, ...updateData } : item
        ));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onUpdate]);

  const remove = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      if (onDelete) {
        await onDelete(id);
      }
      setData(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onDelete]);

  return {
    data,
    loading,
    error,
    create,
    update,
    remove,
    setData,
    clearError,
  };
}

// Specific hooks for new models
interface PPKData {
  id: string;
  paketId: string;
  namaPPK: string;
  noSertifikasi: string;
  jumlahAnggaran: number;
  lamaProyek: number;
  realisasiTermin1?: number;
  realisasiTermin2?: number;
  realisasiTermin3?: number;
  realisasiTermin4?: number;
  PHO?: string;
  FHO?: string;
}

interface Pengaduan {
  id: string;
  judul: string;
  isi: string;
  status: string;
  tanggal: string;
  pelapor: string;
}

export const usePPKData = () => {
  const createPPKData = async (data: Partial<PPKData>) => {
    const response = await fetch('/api/ppk-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create PPK data');
    return response.json();
  };

  const updatePPKData = async (id: string, data: Partial<PPKData>) => {
    const response = await fetch(`/api/ppk-data/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update PPK data');
    return response.json();
  };

  const deletePPKData = async (id: string) => {
    const response = await fetch(`/api/ppk-data/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete PPK data');
  };

  return useCRUD<PPKData>({
    onCreate: createPPKData,
    onUpdate: updatePPKData,
    onDelete: deletePPKData,
  });
};

export const usePengaduan = () => {
  const createPengaduan = async (data: Partial<Pengaduan>) => {
    const response = await fetch('/api/pengaduan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create pengaduan');
    return response.json();
  };

  const updatePengaduan = async (id: string, data: Partial<Pengaduan>) => {
    const response = await fetch(`/api/pengaduan/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update pengaduan');
    return response.json();
  };

  const deletePengaduan = async (id: string) => {
    const response = await fetch(`/api/pengaduan/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete pengaduan');
  };

  return useCRUD<Pengaduan>({
    onCreate: createPengaduan,
    onUpdate: updatePengaduan,
    onDelete: deletePengaduan,
  });
};
