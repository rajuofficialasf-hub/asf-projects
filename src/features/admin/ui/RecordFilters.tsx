import { gn, t } from '@/i18n'
import { useEffect, useState } from 'react'
import { toBanglaNumber } from '@/lib/banglaNumber'
import type { ProjectType } from '@/backend'
import { getDistricts, getDivisions, getUpazilas } from '@/features/geo/geo'
import { useHousingYears } from '@/features/housing/hooks/useHousingYears'
import { EMPTY_FILTERS, hasActiveFilters, MAX_SEARCH_LENGTH, type HousingFilters as Filters } from '@/features/housing/utils/filters'
import { Button, Card, Grid, SelectField, Stack, Text, TextField } from '@/ui'

const SEARCH_DEBOUNCE_MS = 500

/**
 * এডমিনের রেকর্ড-ফিল্টার (পাবলিক HousingFilters-এর একই আচরণ): সাল (years থেকে), বিভাগ → জেলা → উপজেলা (cascading),
 * নাম খোঁজা (৫০০ms debounce), "ফিল্টার মুছুন"। অবস্থা parent (URL) এ থাকে; এখানে শুধু সার্চ বক্সের অস্থায়ী লেখা।
 */
export function RecordFilters({ projectType, value, onChange }: { projectType: ProjectType; value: Filters; onChange: (next: Filters) => void }) {
  const years = useHousingYears(projectType)

  // নামের সার্চ: লোকাল লেখা + debounce; বাইরে থেকে q বদলালে (ফিল্টার মুছুন, Back) রেন্ডারের সময়ই সিঙ্ক
  const [text, setText] = useState(value.q)
  const [syncedQ, setSyncedQ] = useState(value.q)
  if (value.q !== syncedQ) {
    setSyncedQ(value.q)
    setText(value.q)
  }
  useEffect(() => {
    const trimmed = text.trim()
    if (trimmed === value.q.trim()) return
    const timer = setTimeout(() => onChange({ ...value, q: trimmed }), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [text, value, onChange])

  const active = hasActiveFilters(value)

  return (
    <Card>
      <Stack gap={2}>
        <Grid columns={{ xs: 1, sm: 2, lg: 5 }}>
          <SelectField
            size="small"
            label={t('সাল')}
            value={value.year === null ? '' : String(value.year)}
            disabled={years.status === 'loading'}
            onChange={(v) => onChange({ ...value, year: v ? Number(v) : null })}
            options={[{ value: '', label: years.status === 'loading' ? t('লোড হচ্ছে…') : t('সব সাল') }, ...years.years.map((y) => ({ value: String(y), label: toBanglaNumber(y) }))]}
          />
          <SelectField
            size="small"
            label={t('বিভাগ')}
            value={value.division}
            onChange={(v) => onChange({ ...value, division: v, district: '', upazila: '' })}
            options={[{ value: '', label: t('সব বিভাগ') }, ...getDivisions().map((d) => ({ value: d.name, label: gn(d.name) }))]}
          />
          <SelectField
            size="small"
            label={t('জেলা')}
            value={value.district}
            disabled={!value.division}
            onChange={(v) => onChange({ ...value, district: v, upazila: '' })}
            options={[{ value: '', label: value.division ? t('সব জেলা') : t('আগে বিভাগ বাছুন') }, ...getDistricts(value.division).map((d) => ({ value: d.name, label: gn(d.name) }))]}
          />
          <SelectField
            size="small"
            label={t('উপজেলা')}
            value={value.upazila}
            disabled={!value.district}
            onChange={(v) => onChange({ ...value, upazila: v })}
            options={[{ value: '', label: value.district ? t('সব উপজেলা') : t('আগে জেলা বাছুন') }, ...getUpazilas(value.division, value.district).map((u) => ({ value: u.name, label: gn(u.name) }))]}
          />
          <TextField
            size="small"
            type="search"
            label={t('উপকারভোগীর নাম')}
            placeholder={t('নাম লিখে খুঁজুন')}
            value={text}
            maxLength={MAX_SEARCH_LENGTH}
            onChange={setText}
            autoComplete="off"
          />
        </Grid>
        <Stack direction="row" justify="between" align="center" gap={2} wrap>
          <Text size="caption" tone="muted">
            {years.status === 'error' ? t('সালের তালিকা লোড হয়নি।') : active ? t('ফিল্টার প্রয়োগ করা আছে।') : ' '}
          </Text>
          <Button variant="secondary" size="small" startIcon="close" disabled={!active} onClick={() => onChange(EMPTY_FILTERS)}>
            {t('ফিল্টার মুছুন')}
          </Button>
        </Stack>
      </Stack>
    </Card>
  )
}
