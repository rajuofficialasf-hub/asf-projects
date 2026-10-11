import type { TextProps, HeadingProps } from '@/ui/contract';

import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

const TONE = {
  default: 'text.primary',
  muted: 'text.secondary',
  error: 'error.main',
  warning: 'warning.dark',
  success: 'success.dark',
} as const;
const VARIANT = { body: 'body1', small: 'body2', caption: 'caption' } as const;
const WEIGHT = { regular: undefined, medium: 500, bold: 700 } as const;
const ALIGN = { start: 'left', center: 'center', end: 'right' } as const;

export function Text({
  children,
  tone = 'default',
  size = 'body',
  weight = 'regular',
  mono,
  tabular,
  truncate,
  title,
  inline,
  align,
}: TextProps) {
  return (
    <Typography
      variant={VARIANT[size]}
      component={inline ? 'span' : 'p'}
      noWrap={truncate}
      title={title}
      sx={{
        color: TONE[tone],
        ...(size === 'caption' && !inline && { display: 'block' }),
        ...(WEIGHT[weight] && { fontWeight: WEIGHT[weight] }),
        ...(mono && { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }),
        ...(tabular && { fontVariantNumeric: 'tabular-nums' }),
        ...(align && { textAlign: ALIGN[align] }),
      }}
    >
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
