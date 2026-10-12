import type { ReactNode } from 'react'
import { Badge as UiBadge, type BadgeProps } from '@/ui'

const TONES: Record<'green' | 'amber' | 'slate' | 'red' | 'blue', NonNullable<BadgeProps['tone']>> = {
  green: 'success',
  amber: 'warning',
  slate: 'neutral',
  red: 'error',
  blue: 'info',
}

/** ছোট লেবেল-চিপ: প্রকাশিত/খসড়া, "ইংরেজি নেই" ইত্যাদি */
export function Badge({ tone = 'slate', children }: { tone?: keyof typeof TONES; children: ReactNode }) {
  return <UiBadge tone={TONES[tone]}>{children}</UiBadge>
}
