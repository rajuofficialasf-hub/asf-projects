import type { ErrorScreenProps } from '@/ui/contract';

import { m } from 'framer-motion';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { varBounce, MotionContainer } from './animate';
import {
  ForbiddenIllustration,
  ServerErrorIllustration,
  PageNotFoundIllustration,
} from '../assets/illustrations';

// ----------------------------------------------------------------------

const ILLUSTRATION = {
  'not-found': PageNotFoundIllustration,
  forbidden: ForbiddenIllustration,
  error: ServerErrorIllustration,
};

/** The starter's error views (sections/error), as one screen without its own header. */
export function ErrorScreen({ title, message, action, kind = 'error' }: ErrorScreenProps) {
  const Illustration = ILLUSTRATION[kind];
  return (
    <Box
      component={MotionContainer}
      sx={{
        py: 10,
        px: 2,
        mx: 'auto',
        width: 1,
        maxWidth: 448,
        display: 'flex',
        textAlign: 'center',
        alignItems: 'center',
        flexDirection: 'column',
      }}
    >
      <m.div variants={varBounce('in')}>
        <Typography variant="h3" component="h1" sx={{ mb: 2 }}>
          {title}
        </Typography>
      </m.div>

      <m.div variants={varBounce('in')}>
        <Typography sx={{ color: 'text.secondary' }}>{message}</Typography>
      </m.div>

      <m.div variants={varBounce('in')}>
        <Illustration sx={{ my: { xs: 5, sm: 10 } }} />
      </m.div>

      {action}
    </Box>
  );
}
