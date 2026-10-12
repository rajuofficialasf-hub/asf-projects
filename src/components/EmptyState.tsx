import type { ReactNode } from 'react'

/**
 * পাবলিক সাইটের খালি অবস্থা (কিছু নেই, পাওয়া যায়নি) — এক চেহারা: ড্যাশ বর্ডারের সাদা বাক্স, মাঝে লেখা, চাইলে একটি বাটন।
 * এটা ত্রুটি নয়, তাই লাল নয় (ত্রুটির জন্য ErrorNotice)। role=status: স্ক্রিন রিডার বদলটা শোনায়।
 */
export function EmptyState({ title, children, action, className = '' }: { title?: string; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div role="status" className={`rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center ${className}`}>
      {title && <p className="font-semibold text-slate-900">{title}</p>}
      {children && <p className={`${title ? 'mt-1 text-sm ' : ''}text-slate-600`}>{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
