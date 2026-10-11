import { t } from '@/i18n'
import { ACTION_LABEL } from '@/features/housing/utils/activityLabels'
import { Badge, type BadgeProps } from '@/ui'

/** লগের প্রতিটি কাজের ব্যাজ-রং (পাবলিক ACTION_CLASS-এর রঙের পরিবার অনুযায়ী); তালিকায় না থাকলে ধূসর */
const ACTION_TONE: Record<string, NonNullable<BadgeProps['tone']>> = {
  create: 'success',
  update: 'info',
  delete: 'error',
  photo_update: 'info',
  serial_change: 'warning',
  login: 'neutral',
  logout: 'neutral',
  import_run: 'info',
  photo_bulk_run: 'info',
  records_export: 'info',
  category_merge: 'info',
  private_update: 'neutral',
  project_create: 'success',
  project_update: 'info',
  project_publish: 'success',
  project_unpublish: 'warning',
  project_delete: 'error',
  field_create: 'success',
  field_update: 'info',
  field_archive: 'warning',
  field_restore: 'success',
  field_delete: 'error',
  admin_user_update: 'info',
}

/** একটিভিটি লগের কাজের নাম, রঙিন ব্যাজে (ড্যাশবোর্ড ও লগ পেইজ) */
export function ActionBadge({ action }: { action: string }) {
  return <Badge tone={ACTION_TONE[action] ?? 'neutral'}>{ACTION_LABEL[action] ? t(ACTION_LABEL[action]) : action}</Badge>
}
