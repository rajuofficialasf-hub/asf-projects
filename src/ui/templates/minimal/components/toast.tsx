import type { Tone, ToastApi } from '@/ui/contract';

import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Grow from '@mui/material/Grow';
import MuiAlert from '@mui/material/Alert';
import Portal from '@mui/material/Portal';

import { ToastContext } from './toast-context';

// ----------------------------------------------------------------------

type ToastMessage = { id: number; message: string; tone: Tone };

/** How many toasts show at once; older ones leave first. */
const MAX_SHOWN = 5;
const HIDE_MS = { info: 4000, success: 4000, warning: 6000, error: 6000 } as const;

/**
 * Holds the toasts. Part of UiProvider, so every page can call useToast(). Toasts stack (two messages
 * from one action, such as "3 rows added" and "1 row failed", both stay), each hides on its own timer
 * and on its close button, errors are announced (role alert) and the rest politely (role status).
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const show = useCallback<ToastApi['show']>(
    (message, options) => {
      const tone = options?.tone ?? 'info';
      const id = (nextId.current += 1);
      setToasts((list) => [...list.slice(-(MAX_SHOWN - 1)), { id, message, tone }]);
      timers.current.set(id, setTimeout(() => dismiss(id), HIDE_MS[tone]));
    },
    [dismiss]
  );

  useEffect(() => {
    const all = timers.current;
    return () => {
      all.forEach((timer) => clearTimeout(timer));
      all.clear();
    };
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (message) => show(message, { tone: 'success' }),
      error: (message) => show(message, { tone: 'error' }),
    }),
    [show]
  );

  return (
    <ToastContext value={api}>
      {children}
      <Portal>
        <Box
          sx={{
            top: 16,
            left: '50%',
            gap: 1,
            zIndex: 'snackbar',
            display: 'flex',
            position: 'fixed',
            flexDirection: 'column',
            transform: 'translateX(-50%)',
            width: 'min(560px, calc(100vw - 32px))',
          }}
        >
          {toasts.map((toast) => (
            <Grow key={toast.id} in>
              <MuiAlert
                variant="filled"
                severity={toast.tone}
                role={toast.tone === 'error' ? 'alert' : 'status'}
                onClose={() => dismiss(toast.id)}
              >
                {toast.message}
              </MuiAlert>
            </Grow>
          ))}
        </Box>
      </Portal>
    </ToastContext>
  );
}
