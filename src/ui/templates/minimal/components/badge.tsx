import type { BadgeProps } from '@/ui/contract';

import { Label } from './label';

// ----------------------------------------------------------------------

const COLOR = { neutral: 'default', success: 'success', warning: 'warning', error: 'error', info: 'info' } as const;

/** Minimal's soft label: a small status chip such as "published" or "draft". */
export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return (
    <Label variant="soft" color={COLOR[tone]}>
      {children}
    </Label>
  );
}
