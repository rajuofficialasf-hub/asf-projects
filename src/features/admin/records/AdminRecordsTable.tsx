import { gn, lt, t } from '@/i18n'
import { formatTaka } from '@/lib/money'
import { toBanglaNumber } from '@/lib/banglaNumber'
import type { HousingRecord, Project } from '@/backend'
import { gnUnion, useUnionData } from '@/features/geo/unions'
import { fieldSpec, fieldValue, type FieldDef } from '@/features/projects/fields'
import { photoSrc } from '@/features/housing/utils/imagePath'
import { adminPath } from '@/features/housing/utils/housingProjects'
import { SafeImage } from '@/features/housing/components/SafeImage'
import { Button, DataTable, LinkButton, Stack, Text, type DataTableColumn, Checkbox } from '@/ui'
import { photoSlotLabel, type AdminLayout } from './recordColumns'

interface Props {
  project: Project
  layout: AdminLayout
  records: HousingRecord[]
  page: number
  pageSize: number
  busy?: boolean
  selected: Set<string>
  onToggle: (id: string) => void
  onToggleAll: (ids: string[], checked: boolean) => void
  /** না দিলে মোছার বোতাম নেই (সাধারণ এডমিন — প্রশ্ন ১৬) */
  onDelete?: (record: HousingRecord) => void
}

function adminEditPath(r: HousingRecord): string {
  return adminPath(r.project_type, `${r.serial_no}/edit`)
}

/** উপজেলা, জেলা, বিভাগ (ইউনিয়ন থাকলে আগে) */
function place(r: HousingRecord, withDivision = true): string {
  const parts = [r.union_name ? gnUnion(r.district, r.upazila, r.union_name) : '', gn(r.upazila), gn(r.district), withDivision ? gn(r.division) : '']
  return parts.filter(Boolean).join(', ')
}

function Value({ def, r }: { def: FieldDef; r: HousingRecord }) {
  const { Cell } = fieldSpec(def.type)
  return <Cell def={def} value={fieldValue(def, r)} />
}

/**
 * এডমিন তালিকা (M-ধাপ ১০: প্রকল্পের ফিল্ড-সংজ্ঞা থেকে — recordColumns.ts): চেকবক্স (বাল্ক ডিলেট), ক্রম, সিরিয়াল,
 * পরিচয়ের ঘর, ঠিকানা, "টেবিলে" চালু কাস্টম ফিল্ড, ছবি (ছবি মোড অনুযায়ী), এডিট/ডিলেট। টাকার কলামে পাতার মোট।
 * ৬০০px+ টেবিল, ছোট পর্দায় কার্ড (DataTable cardsOnPhones)। ঘর নির্মাণে (কাস্টম ফিল্ড নেই) আগের কলামগুলোই।
 */
export function AdminRecordsTable({ project, layout, records, page, pageSize, busy = false, selected, onToggle, onToggleAll, onDelete }: Props) {
  // ইউনিয়ন থাকলে তার ইংরেজি নাম (তালিকা lazy)
  useUnionData(project.geo_depth === 'union' && records.some((r) => r.union_name))
  const ids = records.map((r) => r.id)
  const allChecked = ids.length > 0 && ids.every((id) => selected.has(id))
  const someChecked = !allChecked && ids.some((id) => selected.has(id))
  const ordinal = (i: number) => toBanglaNumber((page - 1) * pageSize + i + 1)
  const pageSum = (def: FieldDef) => records.reduce((s, r) => s + (Number(r.extra?.[def.key]) || 0), 0)
  const kinds = layout.photoKinds
  const index = new Map(records.map((r, i) => [r.id, i]))
  const thumbs = (r: HousingRecord) => (
    <Stack direction="row" gap={0.5}>
      {kinds.map((k) => (
        <SafeImage key={k} src={photoSrc(r[`${k}_thumb_url`], r.photo_updated_at)} alt={photoSlotLabel(project, k)} className="h-10 w-10 rounded object-cover" placeholderClassName="h-10 w-10 rounded" />
      ))}
    </Stack>
  )

  // চেকবক্সের নাম শুধু স্ক্রিন-রিডারের জন্য (লেবেল লুকানো), যাতে সারিতে "… নির্বাচন" লেখা না দেখায়
  const columns: DataTableColumn<HousingRecord>[] = [
    {
      id: 'select',
      header: <Checkbox hideLabel label={t('এই পেইজের সব নির্বাচন')} checked={allChecked} indeterminate={someChecked} onChange={(checked) => onToggleAll(ids, checked)} />,
      headerText: '',
      cell: (r) => <Checkbox hideLabel label={t('{name} নির্বাচন', { name: r.name })} checked={selected.has(r.id)} onChange={() => onToggle(r.id)} />,
    },
    {
      id: 'ordinal',
      header: t('ক্রম'),
      cell: (r) => (
        <Text inline size="small" tone="muted" tabular>
          {ordinal(index.get(r.id) ?? 0)}
        </Text>
      ),
    },
    {
      id: 'serial',
      header: t('সিরিয়াল'),
      cell: (r) => (
        <Text inline size="small" weight="bold" tabular>
          {toBanglaNumber(r.serial_no)}
        </Text>
      ),
    },
    ...layout.columns.map((c, i): DataTableColumn<HousingRecord> => {
      if (c.kind === 'photos') return { id: `${c.kind}-${i}`, header: t('ছবি'), cell: (r) => thumbs(r) }
      if (c.kind === 'address')
        return {
          id: `${c.kind}-${i}`,
          header: t('ঠিকানা'),
          cell: (r) => (
            <Stack gap={0}>
              <Text inline size="small" tone="muted">
                {place(r)}
              </Text>
              {r.address && (
                <Text size="caption" tone="muted">
                  {r.address}
                </Text>
              )}
            </Stack>
          ),
        }
      const d = c.def
      const align = fieldSpec(d.type).align === 'right' && d.source !== 'system' ? 'right' : undefined
      return {
        id: d.key,
        header: lt(d, 'label'),
        align,
        cell: (r) => {
          if (d.key === 'year') return toBanglaNumber(r.year)
          if (d.key === 'name') return r.name
          if (d.key === 'father_or_husband_name') return r.father_or_husband_name || '—'
          return <Value def={d} r={r} />
        },
      }
    }),
    { id: 'actions', header: t('কাজ'), cell: (r) => <Actions record={r} onDelete={onDelete} /> },
  ]

  return (
    <div aria-busy={busy}>
      <Stack gap={1.5}>
        <DataTable label={lt(project, 'name')} rows={records} columns={columns} getRowId={(r) => r.id} cardsOnPhones dense />
        {layout.moneyFields.length > 0 && records.length > 0 && (
          <Text size="small" weight="medium" tabular>
            {t('এই পাতার মোট')}: {layout.moneyFields.map((d) => `${lt(d, 'label')} ${formatTaka(pageSum(d))}`).join(' · ')}
          </Text>
        )}
      </Stack>
    </div>
  )
}

function Actions({ record: r, onDelete }: { record: HousingRecord; onDelete?: (r: HousingRecord) => void }) {
  return (
    <Stack direction="row" gap={1} align="center">
      <LinkButton to={adminEditPath(r)} variant="secondary">
        {t('এডিট')}
      </LinkButton>
      {onDelete && (
        <Button variant="danger-text" size="small" onClick={() => onDelete(r)}>
          {t('ডিলেট')}
        </Button>
      )}
    </Stack>
  )
}
