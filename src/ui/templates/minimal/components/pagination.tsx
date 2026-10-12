import type { PaginationProps } from '@/ui/contract';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

/** The page numbers to show: 1 … current±1 … last, with '…' for the gaps. */
export function pageItems(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set<number>([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((n) => set.add(n));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((n) => set.add(n));
  const pages = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  pages.forEach((n, i) => {
    const prev = pages[i - 1];
    if (prev !== undefined && n - prev > 1) out.push('…');
    out.push(n);
  });
  return out;
}

export function Pagination({
  page,
  totalPages,
  onChange,
  disabled,
  label,
  summary,
  prevLabel,
  nextLabel,
  prevText,
  nextText,
  pageLabel,
  formatPage = String,
}: PaginationProps) {
  const button = { minWidth: 44, minHeight: 44, px: 1.5 } as const;
  return (
    <Box
      component="nav"
      aria-label={label}
      sx={{
        gap: 2,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: { xs: 'center', sm: 'space-between' },
      }}
    >
      {summary !== undefined && (
        <Typography variant="body2" aria-live="polite" sx={{ color: 'text.secondary' }}>
          {summary}
        </Typography>
      )}
      <Box sx={{ gap: 0.75, display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button
          variant="outlined"
          color="inherit"
          sx={button}
          disabled={disabled || page <= 1}
          aria-label={prevLabel}
          onClick={() => onChange(page - 1)}
        >
          {prevText}
        </Button>
        {pageItems(page, totalPages).map((item, index) =>
          item === '…' ? (
            <Box key={`gap-${index}`} aria-hidden sx={{ px: 0.5, alignSelf: 'center', color: 'text.disabled' }}>
              …
            </Box>
          ) : (
            <Button
              key={item}
              variant={item === page ? 'contained' : 'outlined'}
              color={item === page ? 'primary' : 'inherit'}
              sx={button}
              disabled={disabled}
              aria-current={item === page ? 'page' : undefined}
              aria-label={pageLabel(item)}
              onClick={() => item !== page && onChange(item)}
            >
              {formatPage(item)}
            </Button>
          )
        )}
        <Button
          variant="outlined"
          color="inherit"
          sx={button}
          disabled={disabled || page >= totalPages}
          aria-label={nextLabel}
          onClick={() => onChange(page + 1)}
        >
          {nextText}
        </Button>
      </Box>
    </Box>
  );
}
