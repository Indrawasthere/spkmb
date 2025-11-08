import React from 'react';
import { Modal } from './modal';
import Button from '../ui/button/Button';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi',
  message,
  confirmText = 'Hapus',
  cancelText = 'Batal',
  variant = 'danger',
  loading = false,
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <Trash2 className="h-6 w-6 text-error-500" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-warning-500" />;
      case 'info':
        return <AlertTriangle className="h-6 w-6 text-info-500" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-error-500" />;
    }
  };

  const getConfirmButtonClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-error-500 text-white hover:bg-error-600 disabled:bg-error-300';
      case 'warning':
        return 'bg-warning-500 text-white hover:bg-warning-600 disabled:bg-warning-300';
      case 'info':
        return 'bg-brand-500 text-white hover:bg-brand-600 disabled:bg-brand-300';
      default:
        return 'bg-error-500 text-white hover:bg-error-600 disabled:bg-error-300';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={title}
      loading={loading}
      preventClose={loading}
    >
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          {getIcon()}
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {message}
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={onConfirm}
            disabled={loading}
            className={getConfirmButtonClass()}
          >
            {loading ? 'Memproses...' : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
