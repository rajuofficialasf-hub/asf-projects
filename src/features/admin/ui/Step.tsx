import { toBanglaNumber } from '@/lib/banglaNumber'
import type { ReactNode } from 'react'
import { Card, Stack } from '@/ui'

/** উইজার্ডের একটি অংশ: নম্বর-বৃত্ত, শিরোনাম, ছোট বর্ণনা, তারপর ভেতরের ঘরগুলো */
export function Step({ n, title, hint, children }: { n: number; title: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <Card step={toBanglaNumber(n)} title={title} description={hint}>
      <Stack gap={2}>{children}</Stack>
    </Card>
  )
}
