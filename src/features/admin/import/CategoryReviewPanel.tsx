import { pick, t } from '@/i18n'
import { formatBanglaNumber } from '@/lib/banglaNumber'
import { nearDuplicates } from '@/lib/fuzzyMatch'
import { nfc } from '@/features/geo/geo'
import type { ImportFieldDef } from './importFields'
import { Badge } from '../ui/Badge'
import { Button, Card, Heading, Stack, Text } from '@/ui'

interface Props {
  /** ম্যাপ করা ক্যাটাগরি ফিল্ড */
  fields: ImportFieldDef[]
  /** ফিল্ড-id → শীটের প্রতিটি সারির লেখা */
  sheetValues: Record<string, string[]>
  /** ফিল্ডের key → ডাটাবেসে আগে থেকে থাকা মান (project_field_usage) */
  existing: Record<string, { value: string; n: number }[]> | null
  /** ফিল্ডের key → { শীটের মান → যে বানানে } */
  fixes: Record<string, Record<string, string>>
  onChange: (fieldKey: string, from: string, to: string | null) => void
}

const norm = (s: string) => nfc(s).replace(/\s+/g, ' ')

/**
 * ক্যাটাগরির মান যাচাই (M-ধাপ ১১, **ঐচ্ছিক — ইম্পোর্ট আটকায় না**): শীটের প্রতিটি মান কত সারিতে, কোনগুলো ডাটাবেসে
 * আগে থেকেই আছে, আর কাছাকাছি বানান ("গাভী"/"গাভি") পাশাপাশি — একটি বেছে "এক বানানে আনুন" দিলে ইম্পোর্টে শীটের
 * সেই মান বদলে যায় (ডাটাবেসের মান নয়)। নিচে "মোট ক্যাটাগরি (ইম্পোর্টের পর)"।
 */
export function CategoryReviewPanel({ fields, sheetValues, existing, fixes, onChange }: Props) {
  if (!fields.length) return null
  return (
    <Card>
      <Stack gap={2}>
        <Text size="small" weight="bold">
          {t('ক্যাটাগরির মান (ঐচ্ছিক যাচাই — ইম্পোর্ট আটকায় না)')}
        </Text>
        {fields.map((f) => {
          const key = f.id.slice(2)
          const counts = new Map<string, number>()
          for (const v of sheetValues[f.id] ?? []) {
            const s = norm(v)
            if (s) counts.set(s, (counts.get(s) ?? 0) + 1)
          }
          const db = new Map((existing?.[key] ?? []).map((x) => [x.value, x.n]))
          const fx = fixes[key] ?? {}
          const sheet = [...counts.keys()].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || a.localeCompare(b, 'bn'))
          const pairs = nearDuplicates([...sheet, ...db.keys()]).filter((p) => (counts.has(p.a) || counts.has(p.b)) && !fx[p.a] && !fx[p.b])
          const after = new Set([...db.keys(), ...sheet.map((s) => fx[s] ?? s)])
          return (
            <Stack key={f.id} gap={1}>
              <Heading level={3}>
                {pick(f.label_bn, f.label_en)}{' '}
                <Text size="small" tone="muted" inline>
                  · {t('মোট ক্যাটাগরি (ইম্পোর্টের পর): {n}', { n: formatBanglaNumber(after.size) })}
                </Text>
              </Heading>
              <Stack direction="row" wrap gap={1} role="list">
                {sheet.map((s) => (
                  <Stack key={s} role="listitem">
                    <Badge tone={fx[s] ? 'slate' : db.has(s) ? 'green' : 'blue'}>
                      {fx[s] ? <s>{s}</s> : s} <Text size="caption" tabular inline>· {formatBanglaNumber(counts.get(s) ?? 0)}</Text>
                      {db.has(s) && !fx[s] && <>{' '}✓ {t('ডাটাবেসে আছে')}</>}
                      {!db.has(s) && !fx[s] && <>{' '}{t('নতুন')}</>}
                    </Badge>
                  </Stack>
                ))}
              </Stack>
              {Object.entries(fx).length > 0 && (
                <Stack gap={0.5} role="list">
                  {Object.entries(fx).map(([from, to]) => (
                    <Stack key={from} role="listitem" direction="row" wrap align="center" gap={1}>
                      <Text size="small" tone="muted" inline>
                        «{from}» → «{to}»
                      </Text>
                      <Button variant="danger-text" size="small" onClick={() => onChange(key, from, null)}>
                        {t('বাতিল')}
                      </Button>
                    </Stack>
                  ))}
                </Stack>
              )}
              {pairs.length > 0 && (
                <Card tone="warning">
                  <Stack gap={1}>
                    <Text size="small" weight="bold" tone="warning">
                      {t('কাছাকাছি বানান — একই জিনিস হলে কোনটি থাকবে বেছে দিন:')}
                    </Text>
                    <Stack gap={1} role="list">
                      {pairs.map((p) => {
                        const label = (v: string) => {
                          const parts = [t('শীটে {n}', { n: formatBanglaNumber(counts.get(v) ?? 0) })]
                          if (db.has(v)) parts.push(t('ডাটাবেসে {n}', { n: formatBanglaNumber(db.get(v) ?? 0) }))
                          return '«' + v + '» (' + parts.join(', ') + ')'
                        }
                        return (
                          <Stack key={`${p.a}|${p.b}`} role="listitem" direction="row" wrap align="center" gap={1}>
                            <Text size="small" inline>
                              {label(p.a)} · {label(p.b)}
                            </Text>
                            {[p.a, p.b].map((keep) => {
                              const drop = keep === p.a ? p.b : p.a
                              // শুধু শীটের মান বদলানো যায় (ডাটাবেসের মান বদলাতে রেকর্ড-পাতার "এক বানানে আনুন")
                              if (!counts.has(drop)) return null
                              return (
                                <Button key={keep} variant="secondary" size="small" onClick={() => onChange(key, drop, keep)}>
                                  {t('এক বানানে আনুন: «{v}»', { v: keep })}
                                </Button>
                              )
                            })}
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
    </Card>
  )
}
