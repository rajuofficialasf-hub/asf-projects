import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { LANG_STORAGE_KEY, setCurrentLang, t, type Lang } from './core'
import { LangContext, useLang } from './langContext'

// ---------------------------------------------------------------- Provider
function readStored(): Lang {
  try {
    const v = localStorage.getItem(LANG_STORAGE_KEY)
    return v === 'en' ? 'en' : 'bn'
  } catch {
    return 'bn'
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const l = typeof window === 'undefined' ? 'bn' : readStored()
    setCurrentLang(l) // রেন্ডারের আগেই গ্লোবাল সেট (children এর t()/সংখ্যা সঠিক ভাষা পায়)
    return l
  })

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang)
    } catch {
      /* private mode */
    }
  }, [lang])

  const setLang = useCallback((l: Lang) => {
    setCurrentLang(l)
    setLangState(l)
  }, [])
  const value = useMemo(() => ({ lang, setLang }), [lang, setLang])
  // key={lang}: ভাষা বদলালে পুরো অ্যাপ নতুন করে রেন্ডার — সব t() ও সংখ্যা এক ধাপে বদলায়
  return (
    <LangContext.Provider value={value}>
      <div key={lang} className="contents">
        {children}
      </div>
    </LangContext.Provider>
  )
}

/** ভাষা বদলালে অ্যাপ remount হয় (key={lang}); যে টগল চাপা হয়েছিল, নতুন রেন্ডারে ফোকাস সেটিতেই ফেরে */
let refocusLang: Lang | null = null

/** হেডারের ভাষা টগল (বাং | EN) */
export function LanguageToggle({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLang()
  const group = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = group.current
    if (!refocusLang || !el || el.getClientRects().length === 0) return
    el.querySelector<HTMLButtonElement>(`button[lang="${refocusLang}"]`)?.focus()
    refocusLang = null
  }, [])
  const btn = (l: Lang, label: string) => (
    <button
      type="button"
      onClick={() => {
        refocusLang = l
        setLang(l)
      }}
      aria-pressed={lang === l}
      lang={l}
      // চোখে ছোট পিল, কিন্তু চাপার জায়গা ৪৪px উঁচু (after:)
      className={`relative rounded-full px-3 py-1 text-xs font-semibold transition after:absolute after:inset-x-0 after:-inset-y-2.5 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ${lang === l ? 'bg-white text-brand-800' : 'text-white hover:bg-white/15'}`}
    >
      {label}
    </button>
  )
  return (
    <div ref={group} role="group" aria-label={t('ভাষা')} className={`inline-flex items-center gap-0.5 rounded-full bg-white/15 p-0.5 ring-1 ring-white/30 ${className}`}>
      {btn('bn', 'বাং')}
      {btn('en', 'EN')}
    </div>
  )
}
