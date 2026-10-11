import type { TabsProps } from '@/ui/contract';

import Tab from '@mui/material/Tab';
import MuiTabs from '@mui/material/Tabs';

// ----------------------------------------------------------------------

export function Tabs({ label, value, onChange, tabs }: TabsProps) {
  return (
    <MuiTabs
      value={value}
      onChange={(_event, next: string) => onChange(next)}
      aria-label={label}
      variant="scrollable"
      allowScrollButtonsMobile
      sx={{ boxShadow: (theme) => `inset 0 -2px 0 0 ${theme.vars.palette.divider}` }}
    >
      {tabs.map((tab) => (
        <Tab key={tab.value} value={tab.value} label={tab.label} sx={{ minHeight: 48 }} />
      ))}
    </MuiTabs>
  );
}
