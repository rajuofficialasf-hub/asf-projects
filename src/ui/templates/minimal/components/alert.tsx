import type { AlertProps } from '@/ui/contract';

import MuiAlert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

// ----------------------------------------------------------------------

export function Alert({ tone, title, children, action }: AlertProps) {
  // Errors and warnings interrupt (role="alert"); info and success are polite (RE-A11Y-03).
  const urgent = tone === 'error' || tone === 'warning';
  return (
    <MuiAlert severity={tone} role={urgent ? 'alert' : 'status'} action={action}>
      {title && <AlertTitle>{title}</AlertTitle>}
      {children}
    </MuiAlert>
  );
}
