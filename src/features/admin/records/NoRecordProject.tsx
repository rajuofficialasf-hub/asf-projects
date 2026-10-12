import { t } from '@/i18n'
import { useProjects } from '@/features/projects/registry'
import { AdminForbidden } from '../ui/AdminForbidden'
import { AdminNotFound } from '../ui/AdminNotFound'

/**
 * /admin/records/:key-এর প্রকল্প এই ইউজারের তালিকায় নেই: প্রকল্পটি থাকলে সেটি বরাদ্দ হয়নি (প্রকল্পের ইউজার) —
 * "অনুমতি নেই" বলে; একেবারেই না থাকলে "পাওয়া যায়নি"।
 */
export function NoRecordProject({ projectKey }: { projectKey: string | undefined }) {
  const exists = useProjects().some((p) => p.key === projectKey && !p.is_group)
  if (!exists) return <AdminNotFound />
  return (
    <AdminForbidden
      title={t('এই প্রকল্পে আপনার কাজের অনুমতি নেই')}
      message={t('মূল এডমিন ইউজার পেইজ থেকে প্রকল্পটি আপনাকে দিলে এর রেকর্ড দেখতে ও যোগ করতে পারবেন।')}
    />
  )
}
