/**
 * নেভিগেশনের `state` হিসেবে দিলে SiteLayout পেইজ উপরে স্ক্রল করে না, ফোকাসও সরায় না —
 * রেকর্ডের মডাল খোলা/বন্ধ ও আগের/পরের, যেখানে নিচের তালিকা যেখানে ছিল সেখানেই থাকবে।
 */
export const KEEP_SCROLL = { keepScroll: true } as const

export function isKeepScroll(state: unknown): boolean {
  return typeof state === 'object' && state !== null && (state as { keepScroll?: unknown }).keepScroll === true
}
