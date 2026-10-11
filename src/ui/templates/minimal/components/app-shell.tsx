import type { NavSectionProps } from './nav-section';
import type { NavItem, AppShellProps } from '@/ui/contract';

import { useEffect } from 'react';

import { Icon } from './icon';
import { usePathname } from '../routes/hooks';
import { DashboardLayout } from '../layouts/dashboard';

// ----------------------------------------------------------------------

type NavItemData = NavSectionProps['data'][number]['items'][number];

function toNavItem(item: NavItem): NavItemData {
  return {
    title: item.label,
    path: item.to,
    icon: item.icon ? <Icon name={item.icon} size={24} /> : undefined,
    children: item.children?.map(toNavItem),
  };
}

/** The starter's dashboard layout, with the app's navigation and header actions. */
export function AppShell({ children, navigation, headerActions }: AppShellProps) {
  const pathname = usePathname();

  // From the starter's app.tsx: every navigation starts at the top of the page.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const data = navigation.map((group) => ({
    subheader: group.title,
    items: group.items.map(toNavItem),
  }));

  return (
    <DashboardLayout slotProps={{ nav: { data }, headerActions }}>{children}</DashboardLayout>
  );
}
