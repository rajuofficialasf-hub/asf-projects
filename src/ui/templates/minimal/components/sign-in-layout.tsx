import type { SignInLayoutProps } from '@/ui/contract';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { CONFIG } from '../global-config';
import { AuthSplitLayout } from '../layouts/auth-split';

// ----------------------------------------------------------------------

/** The starter's split sign-in layout. The form inside comes from the login pack. */
export function SignInLayout({
  title,
  description,
  children,
  asideTitle = CONFIG.appName,
  asideSubtitle,
  headerActions,
  documentTitle,
}: SignInLayoutProps) {
  const tabTitle = documentTitle ?? title;
  return (
    <AuthSplitLayout
      slotProps={{
        section: { title: asideTitle, subtitle: asideSubtitle ?? '' },
        headerActions,
      }}
    >
      {tabTitle !== false && <title>{`${tabTitle} | ${CONFIG.appName}`}</title>}
      <Box sx={{ mb: 5, gap: 1.5, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h5" component="h1">
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {description}
          </Typography>
        )}
      </Box>
      {children}
    </AuthSplitLayout>
  );
}
