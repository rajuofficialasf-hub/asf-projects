import type { ToggleGroupProps } from '@/ui/contract';

import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

// ----------------------------------------------------------------------

export function ToggleGroup({ label, value, onChange, options }: ToggleGroupProps) {
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      role="group"
      aria-label={label}
      value={value}
      onChange={(_event, next: string | null) => {
        if (next !== null) onChange(next);
      }}
    >
      {options.map((option) => (
        <ToggleButton key={option.value} value={option.value} lang={option.lang} sx={{ minWidth: 44, minHeight: 44, px: 1.25 }}>
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
