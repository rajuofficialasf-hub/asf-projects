import { toBanglaNumber } from '@/lib/banglaNumber'
import type { ReactNode } from 'react'
import { Card, Stack } from '@/ui'

/**
 * উইজার্ডের একটি অংশ: নম্বর-বৃত্ত, শিরোনাম, ছোট বর্ণনা, তারপর ভেতরের ঘরগুলো। `announced`: নম্বরটি শিরোনামের নামের অংশ
 * ("২ কলাম ম্যাপিং"), যেমন ইম্পোর্ট পেইজে আগে ছিল; না দিলে নম্বর শুধু দেখানোর জন্য।
 */
export function Step({ n, title, hint, announced, children }: { n: number; title: string; hint?: ReactNode; announced?: boolean; children: ReactNode }) {
  return (
    <Card step={toBanglaNumber(n)} stepAnnounced={announced} title={title} description={hint}>
      <Stack gap={2}>{children}</Stack>
    </Card>
  )
}
