import { t } from '@/i18n'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { ErrorScreen, LinkButton } from '@/ui'
import { useAdminUser } from '../adminUser'

/**
 * এডমিনের "পেইজ পাওয়া যায়নি"। লগইন করা থাকলে ফেরার পথ ড্যাশবোর্ড; লগইন ছাড়া (অচেনা /admin/… ঠিকানা, যা লগইন
 * চায় না) পাবলিক হোম।
 */
export function AdminNotFound() {
  useDocumentTitle(t('পেইজটি পাওয়া যায়নি'))
  const me = useAdminUser()
  return (
    <ErrorScreen
      kind="not-found"
      title={t('পেইজটি পাওয়া যায়নি')}
      message={me ? t('আপনি যে ঠিকানায় যেতে চেয়েছেন তা এডমিন প্যানেলে নেই। ঠিকানাটি আবার দেখুন অথবা ড্যাশবোর্ডে ফিরে যান।') : t('আপনি যে ঠিকানায় যেতে চেয়েছেন তা এই সাইটে নেই। ঠিকানাটি আবার দেখুন অথবা হোম পেইজে ফিরে যান।')}
      action={me ? <LinkButton to="/admin">{t('ড্যাশবোর্ডে ফিরুন')}</LinkButton> : <LinkButton to="/">{t('হোম পেইজে যান')}</LinkButton>}
    />
  )
}
