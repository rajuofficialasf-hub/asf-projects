import type { IconButtonProps } from '@/ui/contract';

import Tooltip from '@mui/material/Tooltip';
import MuiIconButton from '@mui/material/IconButton';

import { Icon } from './icon';

// ----------------------------------------------------------------------

const COLOR = { default: 'default', danger: 'error', primary: 'primary' } as const;

export function IconButton({ icon, label, onClick, disabled, tone = 'default' }: IconButtonProps) {
  const button = (
    <MuiIconButton
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      color={COLOR[tone]}
      sx={{ width: 44, height: 44 }}
    >
      <Icon name={icon} />
    </MuiIconButton>
  );
  // A disabled button fires no hover events, so it gets no tooltip.
  return disabled ? button : <Tooltip title={label}>{button}</Tooltip>;
}
