import { t } from '@/i18n'
import { Card, EmptyState } from '@/ui'

/** প্রকল্পের ইউজারকে এখনো কোনো প্রকল্প দেওয়া হয়নি — ড্যাশবোর্ড, ইম্পোর্ট ও ছবির পাতায় একই কথা */
export function NoProjectsNotice() {
  return (
    <Card>
      <EmptyState title={t('আপনাকে এখনো কোনো প্রকল্প দেওয়া হয়নি')} description={t('মূল এডমিন ইউজার পেইজ থেকে প্রকল্প দিলে এখানে সেগুলোর রেকর্ড দেখবেন।')} />
    </Card>
  )
}
