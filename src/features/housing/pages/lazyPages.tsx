import { t } from '@/i18n'
import { lazy, Suspense, type ReactNode } from 'react'

/**
 * ভিউ মোড ও এডমিন পেইজগুলো lazy — পাবলিক তালিকা পেইজের প্রথম লোড ছোট থাকে;
 * এডমিন কোড (ফর্ম, ইম্পোর্ট, ছবি বাল্ক, তুলনা) শুধু দরকার হলে নামে। routes.tsx এ <Lazy> দিয়ে মোড়ানো।
 */
export const LazyProjectDetailPage = lazy(() => import('@/features/projects/detail/ProjectDetailPage').then((m) => ({ default: m.ProjectDetailPage })))
/** মানচিত্র (d3-geo + topojson ~৪০ KB gzip) শুধু তালিকা পেইজে দরকার হলে নামে */
export const LazyUpazilaMapPanel = lazy(() => import('../components/UpazilaMapPanel').then((m) => ({ default: m.UpazilaMapPanel })))

/**
 * variant: page = পুরো পেইজের জায়গায় লেখা (ডিফল্ট; এডমিন) · dialog = মডালের মতো পর্দাজোড়া আবরণ (রেকর্ডের ভিউ — নিচের তালিকা
 * সরে না) · banner = মানচিত্রের ব্যানারের মাপের ফাঁকা বাক্স (ব্যানার এলে লেআউট লাফায় না)।
 */
export function Lazy({ children, variant = 'page' }: { children: ReactNode; variant?: 'page' | 'dialog' | 'banner' }) {
  return <Suspense fallback={<LazyFallback variant={variant} />}>{children}</Suspense>
}

function LazyFallback({ variant }: { variant: 'page' | 'dialog' | 'banner' }) {
  if (variant === 'dialog') {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm" role="status">
        <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-lg">{t('লোড হচ্ছে…')}</span>
      </div>
    )
  }
  if (variant === 'banner') return <div className="h-20 animate-pulse rounded-2xl bg-brand-100" role="status" aria-label={t('লোড হচ্ছে')} />
  return (
    <div className="container-page py-16 text-center text-sm text-slate-600" role="status">
      {t('লোড হচ্ছে…')}
    </div>
  )
}
