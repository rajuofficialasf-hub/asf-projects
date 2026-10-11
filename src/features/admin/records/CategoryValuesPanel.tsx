import { lt, t } from '@/i18n'
import { useState } from 'react'
import { formatBanglaNumber } from '@/lib/banglaNumber'
import { nearDuplicates } from '@/lib/fuzzyMatch'
import { getHousingApi, getProjectsApi, HousingApiError, type Project, type ProjectField } from '@/backend'
import { Badge, Button, Card, Disclosure, Heading, RadioGroup, Stack, Text, useToast } from '@/ui'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { categoryFields, type CategoryUsage } from './useCategoryUsage'

interface Props {
  project: Project
  usage: CategoryUsage | null
  /** একীকরণের পর (তালিকা ও মান নতুন করে আনতে) */
  onChanged: () => void
}

interface Merge {
  field: ProjectField
  a: { value: string; n: number }
  b: { value: string; n: number }
  /** যে বানানে আনা হবে */
  to: string
}

/**
 * ক্যাটাগরির মান (M-ধাপ ১০): প্রতিটি ক্যাটাগরি ফিল্ডের মান ও কতটি রেকর্ডে; কাছাকাছি বানান ("গাভী" / "গাভি")
 * পাশাপাশি, আর "এক বানানে আনুন" — নিশ্চিতকরণের পর project_field_rename_value (সব রেকর্ডে একসাথে, লগসহ)।
 */
export function CategoryValuesPanel({ project, usage, onChanged }: Props) {
  const toast = useToast()
  const [merge, setMerge] = useState<Merge | null>(null)
  const [busy, setBusy] = useState(false)
  const fields = categoryFields(project)
  if (!fields.length) return null

  const run = async () => {
    if (!merge) return
    const from = merge.to === merge.a.value ? merge.b.value : merge.a.value
    setBusy(true)
    try {
      const n = await getProjectsApi().renameFieldValue(project.key, merge.field.key, from, merge.to)
      // ডাটাবেস প্রতিটি রেকর্ডের বদল আলাদা লগ করে; এক লাইনের সারসংক্ষেপ (কতটি রেকর্ড) ক্লায়েন্ট-ইভেন্টে
      void getHousingApi().logActivity('category_merge', { field: merge.field.key, from, to: merge.to, records: n }, project.key)
      toast.success(t('{n}টি রেকর্ডে «{from}» → «{to}»', { n: formatBanglaNumber(n), from, to: merge.to }))
      setMerge(null)
      onChanged()
    } catch (err) {
      toast.error(t('এক বানানে আনা যায়নি: {message}', { message: HousingApiError.from(err).message }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Disclosure summary={t('ক্যাটাগরির মান ও বানান')}>
        <Stack gap={2}>
          {!usage && (
            <Text size="small" tone="muted">
              {t('লোড হচ্ছে…')}
            </Text>
          )}
          {usage &&
            fields.map((f) => {
              const values = usage[f.key] ?? []
              const byValue = new Map(values.map((v) => [v.value, v]))
              const pairs = nearDuplicates(values.map((v) => v.value))
              return (
                <Stack key={f.key} gap={1}>
                  <Heading level={3}>
                    {lt(f, 'label')}{' '}
                    <Text inline size="small" tone="muted">
                      · {t('{n}টি মান', { n: formatBanglaNumber(values.length) })}
                    </Text>
                  </Heading>
                  {values.length === 0 ? (
                    <Text size="small" tone="muted">
                      {t('এখনো কোনো মান নেই।')}
                    </Text>
                  ) : (
                    <Stack role="list" direction="row" wrap gap={1}>
                      {values.map((v) => (
                        <Stack key={v.value} role="listitem">
                          <Badge>
                            {v.value} · {formatBanglaNumber(v.n)}
                          </Badge>
                        </Stack>
                      ))}
                    </Stack>
                  )}
                  {pairs.length > 0 && (
                    <Card tone="warning">
                      <Stack gap={1}>
                        <Text size="caption" weight="bold" tone="warning">
                          {t('কাছাকাছি বানান — একই জিনিস হলে এক বানানে আনুন:')}
                        </Text>
                        <Stack role="list" gap={1}>
                          {pairs.map((p) => {
                            const a = byValue.get(p.a)!
                            const b = byValue.get(p.b)!
                            return (
                              <Stack key={`${p.a}|${p.b}`} role="listitem" direction="row" wrap align="center" gap={1}>
                                <Text inline size="small">
                                  «{a.value}» ({formatBanglaNumber(a.n)}) · «{b.value}» ({formatBanglaNumber(b.n)})
                                </Text>
                                <Button variant="secondary" size="small" onClick={() => setMerge({ field: f, a, b, to: a.n >= b.n ? a.value : b.value })}>
                                  {t('এক বানানে আনুন')}
                                </Button>
                              </Stack>
                            )
                          })}
                        </Stack>
                      </Stack>
                    </Card>
                  )}
                </Stack>
              )
            })}
        </Stack>
      </Disclosure>

      <ConfirmDialog
        open={merge !== null}
        title={t('এক বানানে আনবেন?')}
        confirmLabel={t('হ্যাঁ, এক বানানে আনুন')}
        busy={busy}
        onConfirm={() => void run()}
        onCancel={() => setMerge(null)}
      >
        {merge && (
          <RadioGroup
            label={t('কোন বানান থাকবে? অন্যটির সব রেকর্ড এই বানানে বদলে যাবে (লগে থাকবে)।')}
            name="merge-to"
            look="cards"
            value={merge.to}
            onChange={(to) => setMerge({ ...merge, to })}
            options={[merge.a, merge.b].map((v) => ({
              value: v.value,
              label: (
                <>
                  «{v.value}»{' '}
                  <Text inline size="small" tone="muted">
                    ({t('{n}টি রেকর্ড', { n: formatBanglaNumber(v.n) })})
                  </Text>
                </>
              ),
            }))}
          />
        )}
      </ConfirmDialog>
    </>
  )
}
