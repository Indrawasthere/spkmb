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
