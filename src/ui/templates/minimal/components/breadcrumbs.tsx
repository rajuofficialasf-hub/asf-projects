import type { BreadcrumbsProps } from '@/ui/contract';

import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import MuiBreadcrumbs from '@mui/material/Breadcrumbs';

import { RouterLink } from '../routes/components';

// ----------------------------------------------------------------------

export function Breadcrumbs({ label, items }: BreadcrumbsProps) {
  return (
    <MuiBreadcrumbs aria-label={label}>
      {items.map((item, index) =>
        item.to ? (
          <Link key={`${index}-${item.label}`} component={RouterLink} href={item.to} color="inherit" variant="body2" underline="hover" sx={{ minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>
            {item.label}
          </Link>
        ) : (
          <Typography
            key={`${index}-${item.label}`}
            variant="body2"
            aria-current={index === items.length - 1 ? 'page' : undefined}
            sx={{ color: 'text.disabled' }}
          >
            {item.label}
          </Typography>
        )
      )}
    </MuiBreadcrumbs>
  );
}
