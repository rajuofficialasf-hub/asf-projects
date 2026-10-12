import type { IconName, IconProps } from '@/ui/contract';
import type { IconifyName } from './iconify/register-icons';

import { Iconify } from './iconify';

// ----------------------------------------------------------------------

// Contract icon names mapped to icons registered offline in ./iconify/icon-sets.ts.
const ICONS: Record<IconName, IconifyName> = {
  home: 'solar:home-angle-bold-duotone',
  dashboard: 'solar:chart-square-outline',
  user: 'solar:user-rounded-bold',
  users: 'solar:users-group-rounded-bold',
  settings: 'solar:settings-bold',
  file: 'solar:file-text-bold',
  folder: 'solar:inbox-bold',
  upload: 'eva:cloud-upload-fill',
  download: 'eva:cloud-download-fill',
  add: 'mingcute:add-line',
  edit: 'solar:pen-bold',
  delete: 'solar:trash-bin-trash-bold',
  search: 'eva:search-fill',
  'sign-out': 'ic:round-power-settings-new',
  close: 'mingcute:close-line',
  info: 'solar:info-circle-bold',
  success: 'solar:check-circle-bold',
  warning: 'solar:danger-triangle-bold',
  error: 'solar:danger-bold',
  menu: 'ic:round-view-list',
  more: 'eva:more-vertical-fill',
  back: 'eva:arrow-ios-back-fill',
  forward: 'eva:arrow-ios-forward-fill',
  external: 'eva:external-link-fill',
  view: 'solar:eye-bold',
  image: 'solar:gallery-wide-bold',
  refresh: 'solar:restart-bold',
  check: 'eva:checkmark-fill',
  lock: 'solar:lock-password-outline',
  calendar: 'solar:calendar-date-bold',
  list: 'solar:list-bold',
  import: 'solar:import-bold',
  export: 'solar:export-bold',
  history: 'solar:clock-circle-bold',
  up: 'eva:arrow-upward-fill',
  down: 'eva:arrow-downward-fill',
  filter: 'ic:round-filter-list',
};

export function Icon({ name, label, size = 20 }: IconProps) {
  return label ? (
    <Iconify icon={ICONS[name]} width={size} role="img" aria-label={label} aria-hidden={false} />
  ) : (
    <Iconify icon={ICONS[name]} width={size} aria-hidden />
  );
}
