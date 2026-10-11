import type { PageProps } from '@/ui/contract';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { CONFIG } from '../global-config';
import { DashboardContent } from '../layouts/dashboard';

// ----------------------------------------------------------------------

export function Page({ title, description, actions, children, breadcrumbs, badges, documentTitle }: PageProps) {
  const tabTitle = documentTitle ?? title;
  return (
    <DashboardContent>
      {tabTitle !== false && (
        <title>{tabTitle === CONFIG.appName ? tabTitle : `${tabTitle} | ${CONFIG.appName}`}</title>
      )}
      {breadcrumbs}
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
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ gap: 1.5, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="h4" component="h1">
              {title}
            </Typography>
            {badges}
          </Box>
          {description && (
            <Typography sx={{ mt: 1, color: 'text.secondary' }}>{description}</Typography>
          )}
        </Box>
        {actions && <Box sx={{ gap: 1, display: 'flex', flexWrap: 'wrap' }}>{actions}</Box>}
      </Box>
      {children}
    </DashboardContent>
  );
}
