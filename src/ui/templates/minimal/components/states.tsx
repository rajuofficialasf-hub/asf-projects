import type { IconName, EmptyStateProps, LoadingStateProps } from '@/ui/contract';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { Icon } from './icon';

// ----------------------------------------------------------------------

export function LoadingState({ label = 'Loading' }: LoadingStateProps) {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{ py: 5, gap: 2, display: 'flex', alignItems: 'center', flexDirection: 'column' }}
    >
      <CircularProgress color="inherit" aria-hidden />
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
    </Box>
  );
}

const DEFAULT_EMPTY_ICON: IconName = 'folder';

export function EmptyState({ title, description, action, icon = DEFAULT_EMPTY_ICON }: EmptyStateProps) {
  return (
    <Box
      sx={{
        py: 5,
        px: 3,
        gap: 1,
        display: 'flex',
        textAlign: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        color: 'text.disabled',
      }}
    >
      <Icon name={icon} size={48} />
      <Typography variant="h6" component="p" sx={{ color: 'text.secondary' }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
  );
}
