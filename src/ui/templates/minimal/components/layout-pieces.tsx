import type { GridProps, StatListProps, TextLinkProps, DisclosureProps } from '@/ui/contract';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import { RouterLink } from '../routes/components';

// ----------------------------------------------------------------------

export function Grid({ children, columns = { xs: 1 }, gap = 2 }: GridProps) {
  const template = (n?: number) => (n ? `repeat(${n}, minmax(0, 1fr))` : undefined);
  return (
    <Box
      sx={{
        gap,
        display: 'grid',
        gridTemplateColumns: {
          xs: template(columns.xs ?? 1),
          sm: template(columns.sm),
          md: template(columns.md),
          lg: template(columns.lg),
        },
      }}
    >
      {children}
    </Box>
  );
}

export function StatList({ items }: StatListProps) {
  return (
    <Box
      component="dl"
      sx={{
        m: 0,
        gap: 1,
        display: 'grid',
        gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
      }}
    >
      {items.map((item) => (
        <Box key={item.label} sx={{ px: 1, py: 1.25, borderRadius: 1, textAlign: 'center', bgcolor: 'background.neutral' }}>
          <Typography component="dt" variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
            {item.label}
          </Typography>
          <Typography
            component="dd"
            variant="subtitle1"
            noWrap
            sx={{
              m: 0,
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              color: item.tone === 'warning' ? 'warning.dark' : 'text.primary',
            }}
          >
            {item.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export function TextLink({ to, children }: TextLinkProps) {
  return (
    <Link component={RouterLink} href={to} underline="hover" sx={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', fontWeight: 600 }}>
      {children}
    </Link>
  );
}

export function Disclosure({ summary, children, defaultOpen }: DisclosureProps) {
  return (
    <Box
      component="details"
      open={defaultOpen}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1.5,
        '& > summary': { px: 2, minHeight: 44, display: 'flex', alignItems: 'center', cursor: 'pointer', typography: 'subtitle2' },
      }}
    >
      <summary>{summary}</summary>
      <Box sx={{ px: 2, pb: 2 }}>{children}</Box>
    </Box>
  );
}
