import { t } from '@/i18n'
import { Link } from 'react-router'
import { toBanglaNumber } from '@/lib/banglaNumber'
import { useDocumentTitle } from '@/lib/useDocumentTitle'

export function NotFoundPage() {
  useDocumentTitle(t('পেইজটি পাওয়া যায়নি'))
  return (
    <section className="container-page flex flex-col items-center py-24 text-center">
      <p className="text-6xl font-bold text-brand-700">{toBanglaNumber(404)}</p>
      <h1 className="mt-4 text-xl font-semibold text-slate-900">{t('পেইজটি পাওয়া যায়নি')}</h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        {t('আপনি যে ঠিকানায় যেতে চেয়েছেন তা এই সাইটে নেই। ঠিকানাটি আবার দেখুন অথবা হোম পেইজে ফিরে যান।')}
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex min-h-11 items-center rounded-md bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        {t('হোম পেইজে যান')}
      </Link>
    </section>
  )
}
