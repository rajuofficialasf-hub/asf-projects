import { t } from '@/i18n'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { Alert, LinkButton, Page } from '@/ui'

/** ভূমিকার বাইরের পাতা: কী নিষেধ আর কী করা যায় — স্পষ্ট বার্তা, ড্যাশবোর্ডে ফেরার পথসহ। নিষেধ আসলে সার্ভারে। */
export function AdminForbidden({ title, message }: { title: string; message: string }) {
  useDocumentTitle(title)
  return (
    <Page title={title} documentTitle={false}>
      <Alert tone="warning" action={<LinkButton to="/admin" variant="text">{t('ড্যাশবোর্ডে ফিরুন')}</LinkButton>}>
        {message}
      </Alert>
    </Page>
  )
}
