import type { StackProps } from '@/ui/contract';

import MuiStack from '@mui/material/Stack';

// ----------------------------------------------------------------------

const ALIGN = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' } as const;
const JUSTIFY = { start: 'flex-start', center: 'center', end: 'flex-end', between: 'space-between' } as const;

export function Stack({ children, direction = 'column', gap = 2, align, justify, wrap, padding }: StackProps) {
  return (
    <MuiStack
      direction={direction}
      spacing={0}
      sx={{
        gap,
        ...(padding !== undefined && { p: padding }),
        ...(align && { alignItems: ALIGN[align] }),
        ...(justify && { justifyContent: JUSTIFY[justify] }),
        ...(wrap && { flexWrap: 'wrap' }),
      }}
    >
      {children}
    </MuiStack>
  );
}
