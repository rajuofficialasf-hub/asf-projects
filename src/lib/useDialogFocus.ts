import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * মডালের ফোকাস: খুললে `initial` (না দিলে মডাল নিজে) ফোকাস পায়, Tab/Shift+Tab মডালের ভেতরেই ঘোরে,
 * বন্ধ হলে ফোকাস ফেরে `returnTo()` এর এলিমেন্টে, নইলে যে এলিমেন্ট থেকে খোলা হয়েছিল সেখানে।
 * `active` false হলে কিছুই করে না (যেমন লাইটবক্সে ছবি নেই)।
 */
export function useDialogFocus(
  dialogRef: RefObject<HTMLElement | null>,
  { active = true, initial, returnTo }: { active?: boolean; initial?: RefObject<HTMLElement | null>; returnTo?: () => HTMLElement | null } = {},
): void {
  const returnToRef = useRef(returnTo)
  useEffect(() => {
    returnToRef.current = returnTo
  })

  useEffect(() => {
    if (!active) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    ;(initial?.current ?? dialogRef.current)?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const root = dialogRef.current
      if (!root) return
      const items = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.getClientRects().length > 0)
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const current = document.activeElement
      if (!root.contains(current)) {
        e.preventDefault()
        first.focus()
      } else if (e.shiftKey && current === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && current === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      const target = returnToRef.current?.() ?? opener
      if (target && target.isConnected && target !== document.body) target.focus({ preventScroll: true })
    }
  }, [active, dialogRef, initial])
}
