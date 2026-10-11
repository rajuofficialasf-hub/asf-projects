import type { ButtonProps as MuiButtonProps } from '@mui/material/Button';
import type { ButtonProps, LinkButtonProps } from '@/ui/contract';

import MuiButton from '@mui/material/Button';

import { RouterLink } from '../routes/components';
import { Icon } from './icon';

// ----------------------------------------------------------------------

type Look = Pick<ButtonProps, 'variant' | 'startIcon' | 'fullWidth'>;

type MuiLook = Pick<MuiButtonProps, 'variant' | 'color' | 'size' | 'fullWidth' | 'startIcon'>;

function lookProps({ variant = 'primary', startIcon, fullWidth }: Look): MuiLook {
  const base: MuiLook = {
    fullWidth,
    size: 'medium',
    startIcon: startIcon ? <Icon name={startIcon} /> : undefined,
  };
  switch (variant) {
    case 'primary':
      return { ...base, variant: 'contained', color: 'primary' };
    case 'secondary':
      return { ...base, variant: 'outlined', color: 'inherit' };
    case 'danger':
      return { ...base, variant: 'contained', color: 'error' };
    case 'text':
      return { ...base, variant: 'text', color: 'inherit' };
  }
}

export function Button({ children, onClick, type = 'button', disabled, loading, ...look }: ButtonProps) {
  return (
    <MuiButton
      {...lookProps(look)}
      type={type}
      onClick={onClick}
      disabled={disabled}
      loading={loading ?? null}
    >
      {children}
    </MuiButton>
  );
}

export function LinkButton({ to, children, ...look }: LinkButtonProps) {
  return (
    <MuiButton {...lookProps(look)} component={RouterLink} href={to}>
      {children}
    </MuiButton>
  );
}
