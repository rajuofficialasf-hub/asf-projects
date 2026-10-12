import { lt, pick, t } from '@/i18n'
import { useState, type FormEvent } from 'react'
import { FIELD_TYPES, getProjectsApi, type FieldType, type Project, type ProjectField, type ProjectFieldInput, type ProjectFieldPatch } from '@/backend'
import { FIELD_VALUE_SPECS } from '@/features/projects/fields'
import { formatBanglaNumber, toBanglaNumber } from '@/lib/banglaNumber'
import { parseBanglaNumber } from '@/lib/money'
import { Alert, Button, Checkbox, Drawer, FieldGroup, Grid, RadioGroup, SelectField, Stack, Text, TextField } from '@/ui'
import { MAX_TABLE_COLUMNS, SENSITIVE_LABEL, fieldKeyError, fieldKeyFrom, tableColumns } from './fieldRules'
import { friendlyProjectError } from './projectRules'

interface Form {
  type: FieldType
  label_bn: string
  label_en: string
  help_bn: string
  help_en: string
  key: string
  required: boolean
  visibility: 'public' | 'admin'
  show_in_table: boolean
  show_in_card: boolean
  show_in_detail: boolean
  filterable: boolean
  searchable: boolean
  fill_down: boolean
  max_length: string
  min_value: string
  max_value: string
  import_aliases: string
}

const fromField = (f: ProjectField | null): Form => ({
  type: f?.type ?? 'text',
  label_bn: f?.label_bn ?? '',
  label_en: f?.label_en ?? '',
  help_bn: f?.help_bn ?? '',
  help_en: f?.help_en ?? '',
  key: f?.key ?? '',
  required: f?.required ?? false,
  visibility: f?.visibility ?? 'public',
  show_in_table: f?.show_in_table ?? false,
  show_in_card: f?.show_in_card ?? false,
  show_in_detail: f?.show_in_detail ?? true,
  filterable: f?.filterable ?? false,
  searchable: f?.searchable ?? false,
  fill_down: f?.fill_down ?? false,
  max_length: f?.max_length == null ? '' : String(f.max_length),
  min_value: f?.min_value == null ? '' : String(f.min_value),
  max_value: f?.max_value == null ? '' : String(f.max_value),
  import_aliases: (f?.import_aliases ?? []).join(', '),
})

const TEXTY: FieldType[] = ['text', 'long_text', 'category']
const NUMERIC: FieldType[] = ['number', 'money']
const FILTERABLE: FieldType[] = ['text', 'category', 'number', 'money']
const SEARCHABLE: FieldType[] = ['text', 'long_text', 'category']

/** ফর্মের নিয়মে ঠিক করা মান: ফোন সবসময় গোপন; গোপন হলে টেবিল/কার্ড/ফিল্টার/সার্চ বন্ধ; ধরনে অচল অপশন বন্ধ */
function normalize(f: Form): Form {
  const visibility = f.type === 'phone' ? 'admin' : f.visibility
  const priv = visibility === 'admin'
  return {
    ...f,
    visibility,
    show_in_table: priv ? false : f.show_in_table,
    show_in_card: priv ? false : f.show_in_card,
    filterable: priv || !FILTERABLE.includes(f.type) ? false : f.filterable,
    searchable: priv || !SEARCHABLE.includes(f.type) ? false : f.searchable,
  }
}

/**
 * ফিল্ড যোগ/সম্পাদনার পাশের প্যানেল (পরিকল্পনা M-ধাপ ৮): ধরন, লেবেল (দুই ভাষা), সাহায্য-লেখা, key (লেবেল থেকে নিজে;
 * ডাটা আসার পর লক), পাবলিক/শুধু-এডমিন (ফোন সবসময় এডমিন; লেবেলে ফোন/মোবাইল/NID থাকলে লাল পরামর্শ), কোথায় দেখাবে,
 * ফিল্টার/সার্চ/ফিল-ডাউন, ইম্পোর্টের বিকল্প শিরোনাম, সীমা। টেবিলে সর্বোচ্চ ৯টি ডাটা-কলাম।
 */
export function FieldEditorDrawer({
  project,
  field,
  usage,
  onClose,
  onSaved,
}: {
  project: Project
  /** null = নতুন ফিল্ড */
  field: ProjectField | null
  /** কতগুলো রেকর্ডে মান আছে (null = জানা যাচ্ছে) */
  usage: number | null
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const [form, setForm] = useState<Form>(() => fromField(field))
  const [keyTouched, setKeyTouched] = useState(!!field)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const locked = !!field && (usage ?? 0) > 0
  const others = project.fields.filter((f) => f.id !== field?.id)
  const takenKeys = others.map((f) => f.key)
  const f = normalize(form)
  const key = keyTouched || locked ? form.key : fieldKeyFrom(form.label_en, form.label_bn, takenKeys)
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((x) => ({ ...x, [k]: v }))

  // টেবিলের কলাম-গণনা: এই ফিল্ড সহ (প্রস্তাবিত অবস্থায়)
  const asField = { ...(field ?? {}), id: field?.id ?? 'new', project_key: project.key, key, type: f.type, label_bn: f.label_bn, label_en: f.label_en, visibility: f.visibility, show_in_table: true, is_active: field?.is_active ?? true, sort_order: field?.sort_order ?? 9999 } as ProjectField
  const withThis = tableColumns(project, [...others, asField]).length
  const withoutThis = tableColumns(project, others).length
  const tableFull = !f.show_in_table && withoutThis >= MAX_TABLE_COLUMNS
  const columnsNow = f.show_in_table ? withThis : withoutThis

  const num = (s: string) => (s.trim() === '' ? null : parseBanglaNumber(s))
  const minV = num(f.min_value)
  const maxV = num(f.max_value)
  const maxLen = num(f.max_length)
  const errors = {
    label_bn: !f.label_bn.trim() ? t('বাংলা লেবেল দিন') : f.label_bn.length > 120 ? t('সর্বোচ্চ ১২০ অক্ষর') : null,
    label_en: f.label_en.length > 120 ? t('সর্বোচ্চ ১২০ অক্ষর') : null,
    help: f.help_bn.length > 300 || f.help_en.length > 300 ? t('সাহায্য-লেখা সর্বোচ্চ ৩০০ অক্ষর') : null,
    key: locked ? null : fieldKeyError(key, takenKeys),
    min: Number.isNaN(minV) ? t('শুধু সংখ্যা দিন (যেমন ১০০০০)') : null,
    max: Number.isNaN(maxV) ? t('শুধু সংখ্যা দিন (যেমন ১০০০০)') : minV !== null && maxV !== null && !Number.isNaN(minV) && !Number.isNaN(maxV) && maxV < minV ? t('সর্বোচ্চ মান সর্বনিম্নের চেয়ে ছোট') : null,
    max_length: maxLen === null ? null : Number.isNaN(maxLen) || !Number.isInteger(maxLen) || maxLen < 1 || maxLen > 2000 ? t('১ থেকে ২০০০ এর মধ্যে পূর্ণসংখ্যা') : null,
  }
  const hasErrors = Object.values(errors).some(Boolean)
  const sensitive = f.visibility === 'public' && (SENSITIVE_LABEL.test(f.label_bn) || SENSITIVE_LABEL.test(f.label_en))

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (hasErrors || busy) return
    setBusy(true)
    setError(null)
    const aliases = [...new Set(f.import_aliases.split(/[,\n]/).map((s) => s.trim().normalize('NFC')).filter(Boolean))]
    const body: ProjectFieldInput = {
      key,
      type: f.type,
      label_bn: f.label_bn.trim().normalize('NFC'),
      label_en: f.label_en.trim(),
      help_bn: f.help_bn.trim().normalize('NFC'),
      help_en: f.help_en.trim(),
      required: f.required,
      visibility: f.visibility,
      show_in_table: f.show_in_table,
      show_in_card: f.show_in_card,
      show_in_detail: f.show_in_detail,
      filterable: f.filterable,
      searchable: f.searchable,
      fill_down: f.fill_down,
      max_length: TEXTY.includes(f.type) ? maxLen : null,
      min_value: NUMERIC.includes(f.type) ? minV : null,
      max_value: NUMERIC.includes(f.type) ? maxV : null,
      import_aliases: aliases,
    }
    try {
      const api = getProjectsApi()
      if (!field) {
        await api.createField(project.key, { ...body, sort_order: Math.max(0, ...project.fields.map((x) => x.sort_order)) + 10 })
      } else {
        // শুধু বদলানো কলাম (ডাটা থাকা ফিল্ডে key/ধরন/গোপনীয়তা পাঠানোই হয় না)
        const patch: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(body)) {
          if (locked && (k === 'key' || k === 'type' || k === 'visibility')) continue
          if (JSON.stringify(v) !== JSON.stringify((field as unknown as Record<string, unknown>)[k])) patch[k] = v
        }
        if (Object.keys(patch).length) await api.updateField(field.id, patch as ProjectFieldPatch)
      }
      await onSaved()
      onClose()
    } catch (err) {
      setError(friendlyProjectError(err))
    } finally {
      setBusy(false)
    }
  }

  const check = (k: 'required' | 'show_in_table' | 'show_in_card' | 'show_in_detail' | 'filterable' | 'searchable' | 'fill_down', label: string, opts: { disabled?: boolean; hint?: string } = {}) => (
    <Checkbox label={label} hint={opts.hint} checked={f[k]} disabled={opts.disabled} onChange={(checked) => set(k, checked)} />
  )

  // Esc, ব্যাকড্রপ ও বন্ধ-বাটন: কাজ চলাকালে বন্ধ হয় না
  const close = () => !busy && onClose()

  return (
    <Drawer open onClose={close} title={field ? t('ফিল্ড সম্পাদনা: {name}', { name: lt(field, 'label') }) : t('নতুন ফিল্ড')} closeLabel={t('বন্ধ করুন')} width="large">
      <form onSubmit={(e) => void save(e)} noValidate>
        <Stack gap={3}>
          {locked && (
            <Text size="small" tone="warning">
              {t('{n}টি রেকর্ডে মান আছে — key, ধরন ও পাবলিক/গোপন বদলানো যায় না।', { n: formatBanglaNumber(usage ?? 0) })}
            </Text>
          )}

          <SelectField
            label={t('ধরন')}
            hint={f.type === 'category' ? t('শীটের কলামে যা লেখা থাকবে, সেটাই ক্যাটাগরি — আলাদা অপশন-তালিকা বানাতে হয় না। একই লেখা = একই ক্যাটাগরি।') : undefined}
            value={f.type}
            disabled={locked}
            onChange={(v) => set('type', v as FieldType)}
            options={FIELD_TYPES.map((ty) => ({ value: ty, label: pick(FIELD_VALUE_SPECS[ty].label_bn, FIELD_VALUE_SPECS[ty].label_en) }))}
          />

          <Grid columns={{ xs: 1, sm: 2 }} gap={2}>
            <TextField
              label={t('লেবেল (বাংলা)')}
              required
              error={(submitted ? errors.label_bn : null) ?? undefined}
              value={form.label_bn}
              onChange={(v) => set('label_bn', v)}
              maxLength={120}
              placeholder={t('যেমন উপকরণের নাম')}
            />
            <TextField
              label={t('লেবেল (ইংরেজি)')}
              error={errors.label_en ?? undefined}
              hint={!f.label_en.trim() ? t('খালি থাকলে ইংরেজি মোডে বাংলা দেখাবে') : undefined}
              value={form.label_en}
              onChange={(v) => set('label_en', v)}
              maxLength={120}
              placeholder="Item name"
            />
            <TextField label={t('সাহায্য-লেখা (বাংলা)')} error={errors.help ?? undefined} hint={t('ফর্মে ঘরের নিচে ছোট করে')} rows={2} value={form.help_bn} onChange={(v) => set('help_bn', v)} maxLength={300} />
            <TextField label={t('সাহায্য-লেখা (ইংরেজি)')} rows={2} value={form.help_en} onChange={(v) => set('help_en', v)} maxLength={300} />
          </Grid>

          <TextField
            label="key"
            error={(submitted || keyTouched ? errors.key : null) ?? undefined}
            hint={locked ? t('ডাটা আছে — বদলানো যায় না।') : t('লেবেল থেকে নিজে তৈরি হয় (ইংরেজি না থাকলে বাংলা থেকে)। ডাটা আসার পর আর বদলানো যায় না।')}
            value={key}
            disabled={locked}
            onChange={(v) => {
              setKeyTouched(true)
              set('key', v.toLowerCase())
            }}
            maxLength={40}
          />

          <Stack gap={1}>
            <RadioGroup
              label={t('কে দেখবে')}
              name="vis"
              look="cards"
              value={f.visibility}
              disabled={locked || f.type === 'phone'}
              onChange={(v) => set('visibility', v as Form['visibility'])}
              options={(['public', 'admin'] as const).map((v) => ({
                value: v,
                label: v === 'public' ? t('পাবলিক — সবাই দেখবে') : t('শুধু-এডমিন (গোপন) — পাবলিক সাইট, টেবিল, ফিল্টার, এক্সপোর্টের পাবলিক অংশে কখনো নয়'),
              }))}
            />
            {f.type === 'phone' && (
              <Text size="caption" tone="muted">
                {t('মোবাইল নম্বর সবসময় শুধু-এডমিন।')}
              </Text>
            )}
            {sensitive && <Alert tone="error">{t('এটি গোপন তথ্য মনে হচ্ছে (ফোন/মোবাইল/NID) — "শুধু-এডমিন" করুন। ডাটা আসার পর আর বদলানো যাবে না।')}</Alert>}
          </Stack>

          <FieldGroup legend={t('কোথায় দেখাবে ও কীভাবে কাজ করবে')}>
            <Grid columns={{ xs: 1, sm: 2 }} gap={0}>
              {check('required', t('আবশ্যক'))}
              {check('show_in_detail', t('বিস্তারিত পাতায়'))}
              {check('show_in_table', t('টেবিলে (ডেস্কটপ)'), {
                disabled: f.visibility === 'admin' || tableFull,
                hint: tableFull ? t('টেবিলে সর্বোচ্চ {max}টি কলাম — এখন {n}/{max}', { n: toBanglaNumber(withoutThis), max: toBanglaNumber(MAX_TABLE_COLUMNS) }) : t('কলাম: {n}/{max}', { n: toBanglaNumber(columnsNow), max: toBanglaNumber(MAX_TABLE_COLUMNS) }),
              })}
              {check('show_in_card', t('মোবাইল কার্ডে'), { disabled: f.visibility === 'admin' })}
              {check('filterable', t('ফিল্টারে'), { disabled: f.visibility === 'admin' || !FILTERABLE.includes(f.type), hint: f.type === 'category' ? t('ডাটায় থাকা মানগুলো ড্রপডাউনে') : undefined })}
              {check('searchable', t('নামের সাথে সার্চে'), { disabled: f.visibility === 'admin' || !SEARCHABLE.includes(f.type) })}
              {check('fill_down', t('ইম্পোর্টে ফিল-ডাউন'), { hint: t('শীটে খালি ঘরে উপরের সারির মান') })}
            </Grid>
          </FieldGroup>

          {TEXTY.includes(f.type) && (
            <TextField
              label={t('সর্বোচ্চ দৈর্ঘ্য (অক্ষর)')}
              error={errors.max_length ?? undefined}
              hint={t('খালি = ডিফল্ট ({n})', { n: toBanglaNumber(f.type === 'long_text' ? 2000 : f.type === 'category' ? 100 : 500) })}
              inputMode="numeric"
              value={form.max_length}
              onChange={(v) => set('max_length', v)}
            />
          )}
          {NUMERIC.includes(f.type) && (
            <Grid columns={{ xs: 1, sm: 2 }} gap={2}>
              <TextField label={t('সর্বনিম্ন মান')} error={errors.min ?? undefined} inputMode="decimal" value={form.min_value} onChange={(v) => set('min_value', v)} />
              <TextField label={t('সর্বোচ্চ মান')} error={errors.max ?? undefined} inputMode="decimal" value={form.max_value} onChange={(v) => set('max_value', v)} />
            </Grid>
          )}
          <TextField
            label={t('ইম্পোর্টে শীটের বিকল্প শিরোনাম')}
            hint={t('কমা দিয়ে আলাদা, যেমন: টাকার পরিমাণ, অনুদান, amount — শীটের কলামের নাম এর কোনোটি হলে নিজে মিলবে')}
            value={form.import_aliases}
            onChange={(v) => set('import_aliases', v)}
          />

          {error && <Alert tone="error">{error}</Alert>}
          <Stack direction="row" gap={1.5} wrap>
            <Button type="submit" disabled={busy || (submitted && hasErrors)}>
              {busy ? t('সংরক্ষণ হচ্ছে…') : field ? t('সংরক্ষণ করুন') : t('ফিল্ড যোগ করুন')}
            </Button>
            <Button variant="secondary" onClick={onClose} disabled={busy}>
              {t('বাতিল')}
            </Button>
          </Stack>
        </Stack>
      </form>
    </Drawer>
  )
}
