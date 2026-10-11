import type { PageProps } from '@/ui/contract';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { CONFIG } from '../global-config';
import { DashboardContent } from '../layouts/dashboard';

// ----------------------------------------------------------------------

export function Page({ title, description, actions, children }: PageProps) {
  return (
    <DashboardContent>
      <title>{title === CONFIG.appName ? title : `${title} | ${CONFIG.appName}`}</title>
      <Box
        sx={{
          mb: { xs: 3, md: 5 },
          gap: 2,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <Typography variant="h4" component="h1">
            {title}
          </Typography>
          {description && (
            <Typography sx={{ mt: 1, color: 'text.secondary' }}>{description}</Typography>
          )}
        </div>
        {actions && <Box sx={{ gap: 1, display: 'flex', flexWrap: 'wrap' }}>{actions}</Box>}
      </Box>
      {children}
    </DashboardContent>
  );
}
