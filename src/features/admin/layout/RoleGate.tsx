import { t } from '@/i18n'
import type { ReactNode } from 'react'
import type { AdminRole } from '@/backend'
import { Alert, LinkButton, Page } from '@/ui'
import { useAdminUser } from '../adminUser'

/**
 * ভূমিকা অনুযায়ী পাতা: প্রকল্পের সেটিংস ও ইউজার-ব্যবস্থাপনা প্রকল্পের ইউজার (editor) দেখেন না — বদলে স্পষ্ট বার্তা।
 * শুধু দেখানো/লুকানো; নিষেধ সার্ভারে।
 */
export function RoleGate({ allow, children }: { allow: readonly AdminRole[]; children: ReactNode }) {
  const me = useAdminUser()
  if (me && allow.includes(me.role)) return children
  return (
    <Page title={t('এই অংশ শুধু মূল এডমিনের')} documentTitle={false}>
      <Alert tone="warning" action={<LinkButton to="/admin" variant="text">{t('ড্যাশবোর্ডে ফিরুন')}</LinkButton>}>
        {t('প্রকল্পের সেটিংস (ফিল্ড, কার্ড, প্রকাশ) আর ইউজার-ব্যবস্থাপনা মূল এডমিন করেন। আপনি নিজের প্রকল্পের রেকর্ড, ইম্পোর্ট ও ছবি নিয়ে কাজ করতে পারেন।')}
      </Alert>
    </Page>
  )
}
