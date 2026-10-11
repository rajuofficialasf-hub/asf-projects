import { lt, t } from '@/i18n'
import { useState } from 'react'
import type { GeoLevel, Project, StatCardDef, StatCardKind } from '@/backend'
import { newCardId, suggestCard } from '@/features/projects/stats/statCards'
import { Button, RadioGroup, SelectField, Stack, Text } from '@/ui'

const KINDS: { kind: StatCardKind; label: string; hint: string }[] = [
  { kind: 'count', label: 'গণনা', hint: 'মোট রেকর্ড (উপকারভোগী)' },
  { kind: 'geo', label: 'এলাকা কভার', hint: 'কতগুলো বিভাগ/জেলা/উপজেলা/ইউনিয়নে' },
  { kind: 'sum', label: 'যোগফল', hint: 'টাকা বা সংখ্যার ফিল্ডের মোট' },
  { kind: 'distinct', label: 'ক্যাটাগরি সংখ্যা', hint: 'ক্যাটাগরি ফিল্ডে কত ধরনের মান' },
]

/**
 * নতুন পরিসংখ্যান কার্ড বাছাই (পরিকল্পনা M-ধাপ ৮): চার ধরন — গণনা, এলাকা কভার (স্তর), যোগফল (টাকা/সংখ্যার ফিল্ড),
 * ক্যাটাগরি সংখ্যা (ক্যাটাগরি ফিল্ড); লেবেল ও আইকন নিজে প্রস্তাবিত (পরে বদলানো যায়)। গ্রুপে শুধু গণনা ও এলাকা।
 */
export function StatCardPicker({ project, cards, onAdd, disabled }: { project: Project; cards: StatCardDef[]; onAdd: (c: StatCardDef) => void; disabled: boolean }) {
  const [kind, setKind] = useState<StatCardKind>('count')
  const [level, setLevel] = useState<GeoLevel>('district')
  const fields = project.fields.filter((f) => f.is_active && f.visibility === 'public')
  const sumFields = fields.filter((f) => f.type === 'money' || f.type === 'number')
  const catFields = fields.filter((f) => f.type === 'category')
  const [fieldKey, setFieldKey] = useState('')
  const options = kind === 'sum' ? sumFields : kind === 'distinct' ? catFields : []
  const chosen = options.find((f) => f.key === fieldKey) ?? options[0]
  const levels: GeoLevel[] = project.geo_depth === 'union' ? ['division', 'district', 'upazila', 'union'] : ['division', 'district', 'upazila']
  const kinds = project.is_group ? KINDS.filter((k) => k.kind === 'count' || k.kind === 'geo') : KINDS
  const canAdd = !disabled && (kind === 'count' || kind === 'geo' || !!chosen)

  const add = () => {
    const s = suggestCard(project, kind, { level, field: chosen })
    const part = kind === 'geo' ? level : kind === 'count' ? '' : chosen?.key
    onAdd({ id: newCardId(cards, kind, part), kind, ...(kind === 'geo' ? { level } : {}), ...(kind === 'sum' || kind === 'distinct' ? { field: chosen!.key } : {}), ...s })
  }

  return (
    <Stack gap={2}>
      <RadioGroup
        label={t('নতুন কার্ড')}
        name="card-kind"
        look="cards"
        direction="row"
        value={kind}
        onChange={(v) => setKind(v as StatCardKind)}
        options={kinds.map((k) => ({ value: k.kind, label: t(k.label), hint: t(k.hint) }))}
      />
      <Stack direction="row" gap={2} align="end" wrap>
        {kind === 'geo' && (
          <SelectField
            label={t('স্তর')}
            value={level}
            onChange={(v) => setLevel(v as GeoLevel)}
            options={levels.map((l) => ({ value: l, label: t({ division: 'বিভাগ', district: 'জেলা', upazila: 'উপজেলা', union: 'ইউনিয়ন' }[l]) }))}
          />
        )}
        {(kind === 'sum' || kind === 'distinct') &&
          (options.length ? (
            <SelectField label={t('ফিল্ড')} value={chosen?.key ?? ''} onChange={(v) => setFieldKey(v)} options={options.map((f) => ({ value: f.key, label: lt(f, 'label') }))} />
          ) : (
            <Text size="small" tone="warning">
              {kind === 'sum' ? t('আগে একটি টাকা বা সংখ্যার পাবলিক ফিল্ড যোগ করুন ("ফিল্ড" ট্যাব)।') : t('আগে একটি ক্যাটাগরি পাবলিক ফিল্ড যোগ করুন ("ফিল্ড" ট্যাব)।')}
            </Text>
          ))}
        <Button variant="secondary" startIcon="add" disabled={!canAdd} onClick={add}>
          {t('কার্ড যোগ করুন')}
        </Button>
      </Stack>
    </Stack>
  )
}
