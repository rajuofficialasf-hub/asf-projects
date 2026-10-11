import type { CardProps } from '@/ui/contract';

import { useId } from 'react';

import Box from '@mui/material/Box';
import MuiCard from '@mui/material/Card';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

const TONE_BORDER = { default: undefined, danger: 'error.light', warning: 'warning.light' } as const;

export function Card({
  children,
  title,
  description,
  actions,
  level = 2,
  padding = 'normal',
  step,
  tone = 'default',
}: CardProps) {
  const titleId = useId();
  const hasHeader = !!(title || actions);
  return (
    <MuiCard
      component="section"
      aria-labelledby={title ? titleId : undefined}
      sx={{
        ...(TONE_BORDER[tone] && { border: 1, borderColor: TONE_BORDER[tone] }),
      }}
    >
      {hasHeader && (
        <Box
          sx={{
            px: 3,
            pt: 3,
            pb: padding === 'none' ? 2 : 0,
            gap: 2,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ gap: 1.5, display: 'flex', alignItems: 'flex-start', minWidth: 0 }}>
            {step && (
              <Box
                aria-hidden
                sx={{
                  width: 32,
                  height: 32,
                  flexShrink: 0,
                  display: 'flex',
                  borderRadius: '50%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  typography: 'subtitle2',
                  color: 'primary.contrastText',
                  bgcolor: 'primary.main',
                }}
              >
                {step}
              </Box>
            )}
            <Box sx={{ minWidth: 0 }}>
              {title && (
                <Typography id={titleId} variant={level === 2 ? 'h6' : 'subtitle1'} component={`h${level}`}>
                  {title}
                </Typography>
              )}
              {description && (
                <Typography variant="body2" component="div" sx={{ mt: 0.5, color: 'text.secondary' }}>
                  {description}
                </Typography>
              )}
            </Box>
          </Box>
          {actions && <Box sx={{ gap: 1, display: 'flex', flexWrap: 'wrap' }}>{actions}</Box>}
        </Box>
      )}
      <Box sx={padding === 'none' ? undefined : { p: 3, ...(hasHeader && { pt: 2.5 }) }}>{children}</Box>
    </MuiCard>
  );
}
