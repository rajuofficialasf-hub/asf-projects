import type { LinkProps } from '@mui/material/Link';

import { mergeClasses } from 'minimal-shared/utils';

import Link from '@mui/material/Link';
import { styled } from '@mui/material/styles';

import { CONFIG } from '@/ui/templates/minimal/global-config';
import { RouterLink } from '@/ui/templates/minimal/routes/components';

import { logoClasses } from './classes';

// ----------------------------------------------------------------------

export type LogoProps = LinkProps & {
  isSingle?: boolean;
  disabled?: boolean;
};

/** The app's own logo (CONFIG.logoUrl) in place of the starter's drawn mark, linking to CONFIG.homePath. */
export function Logo({
  sx,
  disabled,
  className,
  href = CONFIG.homePath,
  isSingle = true,
  ...other
}: LogoProps) {
  return (
    <LogoRoot
      component={RouterLink}
      href={href}
      aria-label={CONFIG.appName}
      underline="none"
      className={mergeClasses([logoClasses.root, className])}
      sx={[
        {
          height: 40,
          width: isSingle ? 61 : 102,
          ...(disabled && { pointerEvents: 'none' }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <img alt="" src={CONFIG.logoUrl} width="100%" height="100%" style={{ objectFit: 'contain' }} />
    </LogoRoot>
  );
}

// ----------------------------------------------------------------------

const LogoRoot = styled(Link)(() => ({
  flexShrink: 0,
  color: 'transparent',
  display: 'inline-flex',
  verticalAlign: 'middle',
}));
