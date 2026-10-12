import type { ToastApi } from '@/ui/contract';

import { useContext, createContext } from 'react';

// ----------------------------------------------------------------------

export const ToastContext = createContext<ToastApi | null>(null);

/** Shows a toast, for example `toast.error(errorMessage(error))` in a mutation's onError. */
export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToast must be used inside UiProvider');
  return api;
}
