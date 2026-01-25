import { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CustomToast, ToastType } from '../components/ui/Toast/CustomToast';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  success: (title: string, message?: string, action?: Toast['action']) => string;
  error: (title: string, message?: string, action?: Toast['action']) => string;
  warning: (title: string, message?: string, action?: Toast['action']) => string;
  info: (title: string, message?: string, action?: Toast['action']) => string;
  loading: (title: string, message?: string) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const success = useCallback(
    (title: string, message?: string, action?: Toast['action']) => {
      return addToast({ type: 'success', title, message, action, duration: 4000 });
    },
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string, action?: Toast['action']) => {
      return addToast({ type: 'error', title, message, action, duration: 6000 });
    },
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string, action?: Toast['action']) => {
      return addToast({ type: 'warning', title, message, action, duration: 5000 });
    },
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string, action?: Toast['action']) => {
      return addToast({ type: 'info', title, message, action, duration: 4000 });
    },
    [addToast]
  );

  const loading = useCallback(
    (title: string, message?: string) => {
      return addToast({ type: 'loading', title, message });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{ success, error, warning, info, loading, dismiss: removeToast, dismissAll }}
    >
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <CustomToast
                id={toast.id}
                type={toast.type}
                title={toast.title}
                message={toast.message}
                duration={toast.duration}
                action={toast.action}
                onClose={removeToast}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
