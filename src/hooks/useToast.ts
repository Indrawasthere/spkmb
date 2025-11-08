import { toast } from '../components/ui/Toast';

export const useToast = () => {
  const success = (message: string) => toast.success(message);
  const error = (message: string) => toast.error(message);
  const warning = (message: string) => toast(message, { icon: '⚠️' });
  const info = (message: string) => toast(message);

  return {
    success,
    error,
    warning,
    info,
  };
};
