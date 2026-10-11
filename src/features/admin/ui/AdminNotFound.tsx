import { t } from '@/i18n'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { ErrorScreen, LinkButton } from '@/ui'

/** এডমিনের "পেইজ পাওয়া যায়নি": পাবলিক ৪০৪-এর কথাগুলোই, এডমিনের চেহারায় */
export function AdminNotFound() {
  useDocumentTitle(t('পেইজটি পাওয়া যায়নি'))
  return (
    <ErrorScreen
      kind="not-found"
      title={t('পেইজটি পাওয়া যায়নি')}
      message={t('আপনি যে ঠিকানায় যেতে চেয়েছেন তা এই সাইটে নেই। ঠিকানাটি আবার দেখুন অথবা হোম পেইজে ফিরে যান।')}
      action={<LinkButton to="/">{t('হোম পেইজে যান')}</LinkButton>}
    />
  )
}
