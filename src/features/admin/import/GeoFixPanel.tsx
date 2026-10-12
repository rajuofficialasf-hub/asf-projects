import { gn, t } from '@/i18n'
import { formatBanglaNumber } from '@/lib/banglaNumber'
import { candidatesFor, geoFixKey } from '@/features/geo/geoMatch'
import { gnUnion, unionsOf, type UnionData } from '@/features/geo/unions'
import type { ImportRow, UnresolvedGeo } from './importAnalyze'
import { Badge } from '../ui/Badge'
import { Card, Stack, Text, SelectField } from '@/ui'

const LEVEL = { division: 'বিভাগ', district: 'জেলা', upazila: 'উপজেলা', union: 'ইউনিয়ন' } as const

/**
 * না-মেলা ভৌগোলিক নামের প্যানেল (৪ স্তর): পরামর্শ + সম্পূর্ণ তালিকা থেকে বাছাই; একবার ঠিক করলে একই মানের সব সারিতে।
 * বিভাগ/জেলা/উপজেলা না মিললে সারি বাদ যায় (লাল); ইউনিয়ন তালিকায় না থাকলে ঐচ্ছিক (হলুদ) — লেখাটিই রাখা যায়।
 */
export function GeoFixPanel({ items, rows, fixes, unions, onFix }: { items: UnresolvedGeo[]; rows: ImportRow[]; fixes: Record<string, string>; unions: UnionData | null; onFix: (key: string, value: string) => void }) {
  const required = items.filter((x) => !x.optional)
  const optional = items.filter((x) => x.optional)
  const item = (it: UnresolvedGeo) => {
    // এই মানের প্রথম সারি থেকে parent প্রসঙ্গ
    const sample = rows.find((r) => (it.level === 'union' ? r.geo.upazila === it.parent && r.geo.union?.status === 'unlisted' : r.geo.unresolved.some((u) => u.level === it.level && u.raw === it.raw)))
    const division = sample?.geo.division ?? null
    const district = sample?.geo.district ?? null
    const options = it.level === 'union' ? unionsOf(unions, district, it.parent).map((x) => x[0]) : candidatesFor(it.level, division, district)
    const key = geoFixKey(it.level, it.raw, it.parent)
    const show = (s: string) => (it.level === 'union' ? gnUnion(district, it.parent, s) : gn(s))
    return (
      <Stack key={it.key} role="listitem" direction="row" wrap align="center" gap={1}>
        <Badge tone={it.optional ? 'slate' : 'amber'}>{t(LEVEL[it.level])}</Badge>
        <Text size="small" weight="medium" inline>
          "{it.raw}"
        </Text>
        <Text size="caption" tone="muted" inline>
          ({t('{n} সারি', { n: formatBanglaNumber(it.count) })}
          {it.parent ? `, ${gn(it.parent)}` : ''})
        </Text>
        <Text tone="muted" inline>
          →
        </Text>
        <SelectField
          hideLabel
          size="small"
          label={t('"{raw}" এর সঠিক {level}', { raw: it.raw, level: t(LEVEL[it.level]) })}
          value={fixes[key] ?? ''}
          onChange={(v) => onFix(key, v)}
          options={[
            { value: '', label: it.optional ? t('— যেমন লেখা তেমন রাখুন —') : t('— বেছে নিন —') },
            ...it.suggestions.map((s) => ({ value: s, label: show(s), group: t('পরামর্শ') })),
            ...options.map((o) => ({ value: o, label: show(o), group: t('সম্পূর্ণ তালিকা') })),
          ]}
        />
      </Stack>
    )
  }
  return (
    <>
      {required.length > 0 && (
        <Card tone="warning">
          <Stack gap={1.5}>
            <Text size="small" weight="bold" tone="warning">
              {t('ভৌগোলিক নাম মেলেনি — সঠিক নাম বেছে দিন ({n} টি স্বতন্ত্র মান)', { n: formatBanglaNumber(required.length) })}
            </Text>
            <Stack gap={1} role="list">
              {required.map(item)}
            </Stack>
          </Stack>
        </Card>
      )}
      {optional.length > 0 && (
        <Card tone="warning">
          <Stack gap={1.5}>
            <Text size="small" weight="bold" tone="warning">
              {t('ইউনিয়ন তালিকায় নেই ({n} টি) — ঐচ্ছিক: ঠিক থাকলে রেখে দিন, নইলে তালিকা থেকে বাছুন', { n: formatBanglaNumber(optional.length) })}
            </Text>
            <Stack gap={1} role="list">
              {optional.map(item)}
            </Stack>
          </Stack>
        </Card>
      )}
    </>
  )
}
