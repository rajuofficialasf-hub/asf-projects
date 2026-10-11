import { lt, t } from '@/i18n'
import { useState } from 'react'
import type { Project } from '@/backend'
import { childrenOf, isPublicProject, projectPath } from '@/features/projects/registry'
import { formatBanglaNumber } from '@/lib/banglaNumber'
import { Stack, Text, TextField } from '@/ui'
import { ConfirmDialog } from '../ui/ConfirmDialog'

/**
 * অপ্রকাশ করার আগে নিশ্চিতকরণ (পরিকল্পনা M-ধাপ ৭): কতটি রেকর্ড আর কোন URL গুলো সবার কাছ থেকে লুকিয়ে যাবে,
 * আর প্রকল্পের বাংলা নাম হুবহু টাইপ করলে তবেই "অপ্রকাশ করুন" চালু হয়।
 */
export function UnpublishDialog({
  project,
  projects,
  records,
  busy,
  onConfirm,
  onCancel,
}: {
  project: Project
  projects: readonly Project[]
  /** প্রকল্পের (গ্রুপ হলে সব উপ-প্রকল্পের) মোট রেকর্ড */
  records: number
  busy: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const [typed, setTyped] = useState('')
  const list = [...projects]
  const hidden = [project, ...childrenOf(project.key, list).filter((c) => isPublicProject(c, list))].map((p) => projectPath(p, list))
  const name = project.name_bn.trim()
  return (
    <ConfirmDialog
      open
      tone="danger"
      title={t('«{name}» অপ্রকাশ করবেন?', { name: lt(project, 'name') })}
      confirmLabel={t('অপ্রকাশ করুন')}
      busy={busy}
      confirmDisabled={typed.trim().normalize('NFC') !== name.normalize('NFC')}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <Stack gap={2}>
        <Text size="small">
          {t('{n}টি রেকর্ড আর নিচের পেইজগুলো দর্শকদের কাছ থেকে লুকিয়ে যাবে (ডাটা মুছবে না; আবার প্রকাশ করলে ফিরে আসবে):', {
            n: formatBanglaNumber(records),
          })}
        </Text>
        <Stack role="list" gap={0.5}>
          {hidden.map((h) => (
            <Stack key={h} role="listitem" gap={0}>
              <Text size="caption" tone="muted" mono>
                {h}
              </Text>
            </Stack>
          ))}
        </Stack>
        <Text size="small">{t('শেয়ার করা লিংকগুলো তখন "পেইজটি পাওয়া যায়নি" দেখাবে।')}</Text>
        <TextField label={t('নিশ্চিত করতে প্রকল্পের নাম লিখুন: {name}', { name })} value={typed} onChange={setTyped} autoComplete="off" />
      </Stack>
    </ConfirmDialog>
  )
}
