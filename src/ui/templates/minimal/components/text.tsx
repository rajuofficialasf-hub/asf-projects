import type { TextProps, HeadingProps } from '@/ui/contract';

import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

const TONE = { default: 'text.primary', muted: 'text.secondary', error: 'error.main' } as const;

export function Text({ children, tone = 'default', size = 'body' }: TextProps) {
  return (
    <Typography variant={size === 'small' ? 'body2' : 'body1'} sx={{ color: TONE[tone] }}>
      {children}
    </Typography>
  );
}

const HEADING = { 2: 'h5', 3: 'h6', 4: 'subtitle1' } as const;

export function Heading({ children, level = 2 }: HeadingProps) {
  return (
    <Typography variant={HEADING[level]} component={`h${level}`}>
      {children}
    </Typography>
  );
}
