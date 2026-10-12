import { t } from '@/i18n'
import { formatBanglaNumber, toBanglaNumber } from '@/lib/banglaNumber'
import type { PageMeta } from '@/backend'
import { Pagination as UiPagination } from '@/ui'

/** সার্ভার-সাইড পেজিনেশন: "মোট X টির মধ্যে Y–Z দেখানো হচ্ছে", আগের/পরের, পেইজ নম্বর (পাবলিক Pagination-এর একই লেখা) */
export function Pagination({ meta, onPageChange, disabled = false }: { meta: PageMeta; onPageChange: (page: number) => void; disabled?: boolean }) {
  const { page, page_size, total, total_pages } = meta
  const from = total === 0 ? 0 : (page - 1) * page_size + 1
  const to = Math.min(total, page * page_size)
  return (
    <UiPagination
      page={page}
      totalPages={total_pages}
      onChange={onPageChange}
      disabled={disabled}
      label={t('পেজিনেশন')}
      summary={t('মোট {total} টির মধ্যে {from}–{to} দেখানো হচ্ছে', { total: formatBanglaNumber(total), from: toBanglaNumber(from), to: toBanglaNumber(to) })}
      prevLabel={t('আগের পেইজ')}
      nextLabel={t('পরের পেইজ')}
      prevText={t('‹ আগের')}
      nextText={t('পরের ›')}
      pageLabel={(n) => t('পেইজ {n}', { n: toBanglaNumber(n) })}
      formatPage={toBanglaNumber}
    />
  )
}
