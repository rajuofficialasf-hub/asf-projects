import { LanguageToggle, t } from '@/i18n'
import { useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { SITE_NAME } from '@/config/site'
import logoUrl from '@/assets/asf-logo.svg'
import { MobileProjectLinks, ProjectsMenu } from './ProjectsMenu'

/** স্থির মেনু; প্রকল্পগুলো "প্রকল্পসমূহ ▾" এ (রেজিস্ট্রি থেকে, ProjectsMenu.tsx) */
const NAV_ITEMS: { to: string; label: string; end?: boolean }[] = [{ to: '/', label: 'হোম', end: true }]

function navClass({ isActive }: { isActive: boolean }) {
  return [
    'block rounded-md px-3 py-3 text-sm font-medium transition-colors md:py-2',
    isActive
      ? 'bg-brand-700 text-white'
      : 'text-brand-50/90 hover:bg-brand-700/60 hover:text-white',
  ].join(' ')
}

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const header = useRef<HTMLElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)
  const menuId = useId()
  const { pathname } = useLocation()

  // অন্য পেইজে গেলে (Back সহ) মোবাইল মেনু বন্ধ
  const [menuPath, setMenuPath] = useState(pathname)
  if (menuPath !== pathname) {
    setMenuPath(pathname)
    setOpen(false)
  }

  // মোবাইল মেনু: Esc-এ বন্ধ হয়ে ফোকাস মেনু বাটনে, হেডারের বাইরে চাপলে বন্ধ
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      toggle.current?.focus()
    }
    const onDown = (e: PointerEvent) => {
      if (!header.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  return (
    <header ref={header} className="sticky top-0 z-40 bg-brand-800 text-white shadow-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          {/* লোগো (বাঁয়ে) — গাঢ় হেডারে লোগোর কালো লেখা যাতে পড়া যায়, তাই সাদা পটভূমিতে; নাম ডানে পাশেই */}
          <span aria-hidden="true" className="flex h-11 items-center rounded-md bg-white px-1.5">
            <img src={logoUrl} alt="" width={55} height={36} className="h-9 w-auto" />
          </span>
          <span className="text-base leading-tight font-semibold tracking-tight max-[359px]:sr-only sm:text-lg">{t(SITE_NAME)}</span>
        </Link>

        <nav aria-label={t('প্রধান মেনু')} className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
              {t(item.label)}
            </NavLink>
          ))}
          <ProjectsMenu />
          <LanguageToggle className="ml-2" />
        </nav>

        <div className="flex items-center gap-2 md:hidden">
        <LanguageToggle />
        <button
          ref={toggle}
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          aria-label={open ? t('মেনু বন্ধ করুন') : t('মেনু খুলুন')}
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((v) => !v)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        </div>
      </div>

      {open && (
        <nav id={menuId} aria-label={t('মোবাইল মেনু')} className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-brand-700 md:hidden">
          <div className="container-page flex flex-col gap-1 py-2">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={navClass}
                onClick={() => setOpen(false)}
              >
                {t(item.label)}
              </NavLink>
            ))}
            <MobileProjectLinks onNavigate={() => setOpen(false)} />
          </div>
        </nav>
      )}
    </header>
  )
}
