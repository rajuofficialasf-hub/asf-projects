import type { ProgressBarProps, FieldGroupProps } from '@/ui/contract';

import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';

// ----------------------------------------------------------------------

export function FieldGroup({ legend, children, disabled }: FieldGroupProps) {
  return (
    <Box
      component="fieldset"
      disabled={disabled}
      sx={{ m: 0, p: 2, minWidth: 0, border: 1, borderColor: 'divider', borderRadius: 1.5 }}
    >
      <Box component="legend" sx={{ px: 0.75, typography: 'subtitle2' }}>
        {legend}
      </Box>
      {children}
    </Box>
  );
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  const pct = value === undefined ? undefined : Math.max(0, Math.min(100, Math.round(value)));
  return (
    <LinearProgress
      variant={pct === undefined ? 'indeterminate' : 'determinate'}
      value={pct}
      aria-label={label}
      sx={{ mt: 0.75, height: 6, borderRadius: 3 }}
    />
  );
}
