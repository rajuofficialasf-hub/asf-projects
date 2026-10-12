import { pick } from '@/i18n'
import { ACCENTS } from '@/features/projects/registry'
import { Stack } from '@/ui'

/**
 * রং-বাছাইয়ের একটি বিকল্প: পাবলিক হোম-কার্ডের আসল গ্রেডিয়েন্টের নমুনা (রেজিস্ট্রির Tailwind ক্লাস, তাই পাবলিক
 * চেহারাতেই) আর রঙের নাম। উইজার্ড ও প্রকল্পের সেটিংস দুই জায়গাতেই।
 */
export function AccentSwatch({ accent }: { accent: keyof typeof ACCENTS }) {
  return (
    <Stack direction="row" gap={1} align="center">
      <span className={`h-7 w-7 rounded-md bg-gradient-to-br ${ACCENTS[accent].gradient}`} aria-hidden="true" />
      {pick(ACCENTS[accent].label_bn, ACCENTS[accent].label_en)}
    </Stack>
  )
}
