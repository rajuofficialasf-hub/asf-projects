import type { ActionBarProps, FilterPanelProps } from '@/ui/contract';

import { useId, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import { Icon } from './icon';

// ----------------------------------------------------------------------

export function FilterPanel({ children, label, activeCount, onClear, clearLabel, note }: FilterPanelProps) {
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const headingId = useId();
  const shown = !phone || open;

  const clear = (
    <Button variant="outlined" color="inherit" size="small" startIcon={<Icon name="close" size={18} />} disabled={activeCount === 0} onClick={onClear} sx={{ minHeight: 44 }}>
      {clearLabel}
    </Button>
  );

  return (
    <Box>
      {phone && (
        <Box sx={{ gap: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            color="inherit"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((o) => !o)}
            startIcon={<Icon name="filter" size={18} />}
            endIcon={<Icon name={open ? 'up' : 'down'} size={18} />}
            sx={{ minHeight: 44 }}
          >
            {label}
            {activeCount > 0 && (
              <Box component="span" sx={{ ml: 1, px: 0.75, minWidth: 22, borderRadius: 1, typography: 'caption', fontWeight: 700, color: 'primary.contrastText', bgcolor: 'primary.main' }}>
                {activeCount}
              </Box>
            )}
          </Button>
          {activeCount > 0 && clear}
        </Box>
      )}
      <Card id={panelId} component="section" aria-labelledby={phone ? undefined : headingId} aria-label={phone ? label : undefined} hidden={!shown} sx={{ p: { xs: 2, md: 3 }, mt: phone ? 1.5 : 0, ...(!shown && { display: 'none' }) }}>
        {!phone && (
          <Box sx={{ mb: 2, gap: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography id={headingId} variant="subtitle2" component="h2" sx={{ gap: 1, display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
              <Icon name="filter" size={18} />
              {label}
            </Typography>
            {clear}
          </Box>
        )}
        {children}
        {note && (
          <Typography variant="caption" component="p" sx={{ mt: 1.5, color: 'text.secondary' }}>
            {note}
          </Typography>
        )}
      </Card>
    </Box>
  );
}

// ----------------------------------------------------------------------

export function ActionBar({ children, label }: ActionBarProps) {
  return (
    <Box
      role="group"
      aria-label={label}
      sx={(theme) => ({
        position: 'sticky',
        bottom: 0,
        zIndex: theme.zIndex.appBar - 1,
        py: 1.5,
        gap: 1.5,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        bgcolor: 'background.default',
        borderTop: `1px solid ${theme.vars.palette.divider}`,
      })}
    >
      {children}
    </Box>
  );
}
