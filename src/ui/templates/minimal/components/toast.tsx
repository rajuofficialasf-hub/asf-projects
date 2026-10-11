import type { Tone, ToastApi } from '@/ui/contract';

import { useRef, useMemo, useState, useCallback } from 'react';

import MuiAlert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

import { ToastContext } from './toast-context';

// ----------------------------------------------------------------------

type ToastMessage = { id: number; message: string; tone: Tone };

const AUTO_HIDE_MS = 6000;

/** Holds the current toast. Part of UiProvider, so every page can call useToast(). */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<ToastMessage | null>(null);
  const [open, setOpen] = useState(false);
  const nextId = useRef(0);

  const show = useCallback<ToastApi['show']>((message, options) => {
    setCurrent({ id: (nextId.current += 1), message, tone: options?.tone ?? 'info' });
    setOpen(true);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (message) => show(message, { tone: 'success' }),
      error: (message) => show(message, { tone: 'error' }),
    }),
    [show]
  );

  const handleClose = (_event: unknown, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  return (
    <ToastContext value={api}>
      {children}
      <Snackbar
        key={current?.id}
        open={open}
        autoHideDuration={AUTO_HIDE_MS}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MuiAlert
          variant="filled"
          severity={current?.tone ?? 'info'}
          role={current?.tone === 'error' ? 'alert' : 'status'}
          onClose={() => setOpen(false)}
          sx={{ width: 1 }}
        >
          {current?.message}
        </MuiAlert>
      </Snackbar>
    </ToastContext>
  );
}
