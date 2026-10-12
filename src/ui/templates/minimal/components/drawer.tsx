import type { DrawerProps } from '@/ui/contract';

import { useId } from 'react';

import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { IconButton } from './icon-button';

// ----------------------------------------------------------------------

const WIDTH = { small: 360, medium: 480, large: 640 } as const;

/** MUI's temporary drawer, with role dialog on the panel so it is named by its title. */
export function Drawer({
  open,
  onClose,
  title,
  closeLabel,
  children,
  actions,
  side = 'right',
  width = 'medium',
}: DrawerProps) {
  const titleId = useId();
  return (
    <MuiDrawer
      anchor={side}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          role: 'dialog',
          'aria-modal': true,
          'aria-labelledby': titleId,
          sx: { width: { xs: '100%', sm: WIDTH[width] }, maxWidth: '100%' },
        },
      }}
    >
      <Box sx={{ px: 2.5, py: 1.5, gap: 1, display: 'flex', alignItems: 'center' }}>
        <Typography id={titleId} variant="h6" component="h2" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        <IconButton icon="close" label={closeLabel} onClick={onClose} />
      </Box>
      <Divider />
      <Box sx={{ p: 2.5, flexGrow: 1, overflowY: 'auto' }}>{children}</Box>
      {actions && (
        <>
          <Divider />
          <Box sx={{ p: 2, gap: 1, display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {actions}
          </Box>
        </>
      )}
    </MuiDrawer>
  );
}
