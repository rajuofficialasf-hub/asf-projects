import { gn, t } from '@/i18n'
import { getDistricts, getDivisions, getUpazilas } from '@/features/geo/geo'
import type { GeoErrors, GeoValue } from '@/features/geo/GeoSelect'
import { UnionCombobox } from '@/features/geo/UnionCombobox'
import { SelectField, Text } from '@/ui'

export type { GeoErrors, GeoValue }

/**
 * ইউনিয়নের ঘর MUI-র outlined ঘরের মতো দেখাতে (UnionCombobox নিজের ARIA কম্বোবক্স ও বানান-মেলানো রাখে, তাই
 * সেটি আবার লেখা হয়নি — শুধু চেহারা মেলানো)।
 */
const UNION_INPUT_CLASS =
  'h-14 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-base text-slate-800 hover:border-slate-800 focus:border-2 focus:border-brand-600 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 aria-[invalid=true]:border-red-500'

interface Props {
  value: GeoValue
  onChange: (next: GeoValue) => void
  errors?: GeoErrors
  disabled?: boolean
  /** ৪র্থ স্তর: ইউনিয়ন/পৌরসভা (প্রকল্পের geo_depth = 'union') */
  union?: boolean
  unionRequired?: boolean
  /** ইউনিয়নের লেবেল (প্রকল্পের core_fields থেকে; না দিলে "ইউনিয়ন/পৌরসভা") */
  unionLabel?: string
  /** ইউনিয়নের ঘরের id: `${idPrefix}-union` (RecordForm: "f") */
  idPrefix?: string
}

/**
 * এডমিনের বিভাগ → জেলা → উপজেলা (→ ইউনিয়ন), পাবলিক GeoSelect-এর একই আচরণ: উপরের স্তর বদলালে নিচেরগুলো খালি হয়;
 * মান সবসময় বাংলা (NFC), ইংরেজি মোডে ইংরেজি নাম দেখায়। গ্রিডের ভেতরে বসে — প্রতিটি স্তর আলাদা ঘর।
 */
export function GeoSelect({ value, onChange, errors = {}, disabled, union = false, unionRequired = false, unionLabel, idPrefix = 'f' }: Props) {
  const set = (k: keyof GeoValue, v: string) => {
    const next = { ...value, [k]: v }
    if (k === 'division') Object.assign(next, { district: '', upazila: '', union_name: '' })
    if (k === 'district') Object.assign(next, { upazila: '', union_name: '' })
    if (k === 'upazila') Object.assign(next, { union_name: '' })
    onChange(next)
  }
  const err = (k: keyof GeoValue) => errors[k] ?? undefined
  const unionId = `${idPrefix}-union`

  return (
    <>
      <SelectField
        label={t('বিভাগ *')}
        value={value.division}
        onChange={(v) => set('division', v)}
        disabled={disabled}
        error={err('division')}
        options={[{ value: '', label: t('বাছুন') }, ...getDivisions().map((d) => ({ value: d.name, label: gn(d.name) }))]}
      />
      <SelectField
        label={t('জেলা *')}
        value={value.district}
        onChange={(v) => set('district', v)}
        disabled={disabled || !value.division}
        error={err('district')}
        options={[{ value: '', label: value.division ? t('বাছুন') : t('আগে বিভাগ') }, ...getDistricts(value.division).map((d) => ({ value: d.name, label: gn(d.name) }))]}
      />
      <SelectField
        label={t('উপজেলা *')}
        value={value.upazila}
        onChange={(v) => set('upazila', v)}
        disabled={disabled || !value.district}
        error={err('upazila')}
        options={[{ value: '', label: value.district ? t('বাছুন') : t('আগে জেলা') }, ...getUpazilas(value.division, value.district).map((u) => ({ value: u.name, label: gn(u.name) }))]}
      />
      {union && (
        <div>
          <label htmlFor={unionId}>
            <Text size="small" tone="muted">
              {`${unionLabel ?? t('ইউনিয়ন/পৌরসভা')}${unionRequired ? ' *' : ''}`}
            </Text>
          </label>
          <UnionCombobox
            id={unionId}
            district={value.district}
            upazila={value.upazila}
            value={value.union_name}
            onChange={(v) => onChange({ ...value, union_name: v })}
            disabled={disabled}
            inputClass={UNION_INPUT_CLASS}
            invalid={!!errors.union_name}
          />
          {errors.union_name && (
            <span role="alert">
              <Text tone="error" size="small">
                {errors.union_name}
              </Text>
            </span>
          )}
        </div>
      )}
    </>
  )
}
