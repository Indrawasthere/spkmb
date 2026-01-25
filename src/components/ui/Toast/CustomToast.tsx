import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const toastConfig = {
  success: {
    icon: CheckCircle2,
    gradient: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    iconColor: 'text-green-600 dark:text-green-400',
    progressColor: 'bg-green-500',
  },
  error: {
    icon: XCircle,
    gradient: 'from-red-500 to-rose-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-600 dark:text-red-400',
    progressColor: 'bg-red-500',
  },
  warning: {
    icon: AlertTriangle,
    gradient: 'from-yellow-500 to-orange-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    progressColor: 'bg-yellow-500',
  },
  info: {
    icon: Info,
    gradient: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
    progressColor: 'bg-blue-500',
  },
  loading: {
    icon: Loader2,
    gradient: 'from-gray-500 to-slate-600',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    borderColor: 'border-gray-200 dark:border-gray-800',
    iconColor: 'text-gray-600 dark:text-gray-400',
    progressColor: 'bg-gray-500',
  },
};

export const CustomToast = ({
  id,
  type,
  title,
  message,
  duration = 4000,
  onClose,
  action,
}: ToastProps) => {
  const [progress, setProgress] = useState(100);
  const config = toastConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (type === 'loading') return; // Loading toast doesn't auto-close

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        onClose(id);
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [id, duration, onClose, type]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95, x: 50 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9, x: 50 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`
        relative overflow-hidden rounded-xl border shadow-lg backdrop-blur-sm
        ${config.bgColor} ${config.borderColor}
        min-w-[320px] max-w-md
      `}
    >
      {/* Gradient Accent Bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.gradient}`} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon with Animation */}
          <div className={`flex-shrink-0 ${config.iconColor}`}>
            {type === 'loading' ? (
              <Icon className="w-6 h-6 animate-spin" />
            ) : (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              >
                <Icon className="w-6 h-6" />
              </motion.div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{title}</p>
            {message && <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{message}</p>}

            {/* Action Button */}
            {action && (
              <button
                onClick={() => {
                  action.onClick();
                  onClose(id);
                }}
                className={`
                  mt-2 text-sm font-medium underline-offset-2 hover:underline
                  ${config.iconColor}
                `}
              >
                {action.label} →
              </button>
            )}
          </div>

          {/* Close Button */}
          {type !== 'loading' && (
            <button
              onClick={() => onClose(id)}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {type !== 'loading' && (
        <div className="h-1 bg-gray-200 dark:bg-gray-700">
          <motion.div
            className={`h-full ${config.progressColor}`}
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: 'linear' }}
          />
        </div>
      )}
    </motion.div>
  );
};
