import { t } from '@/i18n'
import { useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigationType } from 'react-router'
import { isKeepScroll } from '@/lib/keepScroll'
import { SiteHeader } from './SiteHeader'
import { SiteFooter } from './SiteFooter'

/**
 * নতুন পেইজে গেলে উপরে স্ক্রল ও ফোকাস <main>-এ (স্ক্রিন রিডার নতুন পেইজ থেকে পড়ে)।
 * ব্রাউজারের Back/Forward (POP) আর KEEP_SCROLL নেভিগেশনে কিছুই করে না; শুধু ফিল্টার/পেইজ (search) বদলালেও না।
 */
function useNewPageFocus(main: React.RefObject<HTMLElement | null>) {
  const { pathname, state } = useLocation()
  const navType = useNavigationType()
  const nav = useRef({ navType, state })
  useEffect(() => {
    nav.current = { navType, state }
  })
  const shown = useRef(pathname)
  useEffect(() => {
    if (shown.current === pathname) return
    shown.current = pathname
    const { navType: type, state: st } = nav.current
    if (type === 'POP' || isKeepScroll(st)) return
    window.scrollTo({ top: 0, behavior: 'instant' })
    main.current?.focus({ preventScroll: true })
  }, [pathname, main])
}

export function SiteLayout() {
  const main = useRef<HTMLElement>(null)
  useNewPageFocus(main)
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-white text-sm font-semibold text-brand-800 shadow-lg focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:px-4 focus:py-3"
      >
        {t('মূল অংশে যান')}
      </a>
      <SiteHeader />
      <main id="main" ref={main} tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
