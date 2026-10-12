import type { ToggleGroupProps } from '@/ui/contract';

import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup, { toggleButtonGroupClasses } from '@mui/material/ToggleButtonGroup';

// ----------------------------------------------------------------------

export function ToggleGroup({ label, value, onChange, options }: ToggleGroupProps) {
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      role="group"
      aria-label={label}
      value={value}
      // The theme sizes grouped buttons with a two-class rule that a button's own sx can't beat, so the
      // 44px touch target is set from the group.
      sx={{ [`& .${toggleButtonGroupClasses.grouped}`]: { minWidth: 44, minHeight: 44 } }}
      onChange={(_event, next: string | null) => {
        if (next !== null) onChange(next);
      }}
    >
      {options.map((option) => (
        <ToggleButton key={option.value} value={option.value} lang={option.lang} sx={{ px: 1.25 }}>
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
