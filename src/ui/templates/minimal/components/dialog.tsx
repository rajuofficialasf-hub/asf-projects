import type { DialogProps } from '@/ui/contract';

import { useId } from 'react';

import MuiDialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

// ----------------------------------------------------------------------

const WIDTH = { small: 'xs', medium: 'sm', large: 'md' } as const;

export function Dialog({ open, onClose, title, children, actions, size = 'medium' }: DialogProps) {
  const titleId = useId();
  return (
    <MuiDialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={WIDTH[size]}
      aria-labelledby={titleId}
    >
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      {actions && <DialogActions>{actions}</DialogActions>}
    </MuiDialog>
  );
}
