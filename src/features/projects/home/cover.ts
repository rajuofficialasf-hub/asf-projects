import { photoSrc } from '@/features/housing/utils/imagePath'

/**
 * প্রকল্পের কভার ছবির URL (docs/history/MULTI_PROJECT_PLAN.md, M-ধাপ ১৫): সার্ভার `cover_path` এ ফাইলের পূর্ণ URL রাখে; সাথে ক্যাশ-ভাঙা ?v=প্রকল্পের
 * updated_at। পাথ নেই বা পূর্ণ http(s) URL নয় → null।
 */
export function coverSrc(coverPath: string | null | undefined, updatedAt: string | null | undefined): string | null {
  if (!coverPath || !/^https?:\/\//i.test(coverPath)) return null
  return photoSrc(coverPath, updatedAt ?? null)
}

/**
 * কভার না থাকলে কার্ডে যে আইকন বসে (statIcons-এর key)। প্রকল্পের নিজের আইকন কিছু key আইকন-সেটে নেই (যেমন টিনের ঘরের
 * `tin-house`) — সেগুলো কাছের আইকনে, নইলে মানুষ-আইকন দেখাত।
 */
export function coverIcon(icon: string | null | undefined): string | null | undefined {
  return icon?.endsWith('-house') ? 'house' : icon
}
