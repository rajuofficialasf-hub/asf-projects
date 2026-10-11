import type { MenuProps } from '@/ui/contract';

import { useId, useState } from 'react';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import MuiMenu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';

import { Icon } from './icon';
import { RouterLink } from '../routes/components';

// ----------------------------------------------------------------------

export function Menu({ label, trigger, header, items }: MenuProps) {
  const menuId = useId();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const close = () => setAnchor(null);

  return (
    <>
      <IconButton
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={anchor ? true : undefined}
        aria-controls={anchor ? menuId : undefined}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{ minWidth: 44, minHeight: 44, p: trigger ? 0.5 : 1 }}
      >
        {trigger ?? <Icon name="more" />}
      </IconButton>
      <MuiMenu
        id={menuId}
        anchorEl={anchor}
        open={!!anchor}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 220 } } }}
      >
        {header && (
          <Box component="li" role="none" sx={{ px: 2, py: 1.5 }}>
            {header}
          </Box>
        )}
        {header && <Divider component="li" role="none" />}
        {items.map((item, index) => {
          if (item.kind === 'divider') return <Divider key={`divider-${index}`} component="li" role="none" />;
          const icon = item.icon && (
            <ListItemIcon>
              <Icon name={item.icon} />
            </ListItemIcon>
          );
          if (item.kind === 'link') {
            return (
              <MenuItem key={item.label} component={RouterLink} href={item.to} onClick={close} sx={{ minHeight: 44 }}>
                {icon}
                {item.label}
              </MenuItem>
            );
          }
          return (
            <MenuItem
              key={item.label}
              disabled={item.disabled}
              onClick={() => {
                close();
                item.onClick();
              }}
              sx={{ minHeight: 44, ...(item.tone === 'danger' && { color: 'error.main' }) }}
            >
              {icon}
              {item.label}
            </MenuItem>
          );
        })}
      </MuiMenu>
    </>
  );
}
