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
    case 'danger-text':
      return { ...base, variant: 'text', color: 'error' };
  }
}

export function Button({ children, onClick, type = 'button', disabled, loading, autoFocus, size, title, ...look }: ButtonProps) {
  const button = (
    <MuiButton
      {...lookProps(look)}
      type={type}
      onClick={onClick}
      disabled={disabled}
      autoFocus={autoFocus}
      {...(size === 'small' && { size: 'small' as const, sx: { minHeight: 44 } })}
      loading={loading ?? null}
    >
      {children}
    </MuiButton>
  );
  // A disabled button gets no hover events, so the title sits on a wrapper.
  return title ? (
    <span title={title} style={{ display: 'inline-flex' }}>
      {button}
    </span>
  ) : (
    button
  );
}

export function LinkButton({ to, children, current, size, ...look }: LinkButtonProps) {
  return (
    <MuiButton
      {...lookProps(look)}
      {...(size === 'small' && { size: 'small' as const, sx: { minHeight: 44 } })}
      component={RouterLink}
      href={to}
      aria-current={current ? 'page' : undefined}
    >
      {children}
    </MuiButton>
  );
}
