import { gn, lt, t } from '@/i18n'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { formatBanglaNumber, toBanglaNumber } from '@/lib/banglaNumber'
import { DEFAULT_PAGE_SIZE, getHousingApi, HousingApiError, type ActivityEntry, type ActivityListParams, type Page, type Project } from '@/backend'
import { FIELD_VALUE_SPECS, formatField, resolveFields, type FieldDef } from '@/features/projects/fields'
import { useProject, useProjects } from '@/features/projects/registry'
import { canEditProject, useAdminUser } from '../adminUser'
import { ErrorNotice } from '../ui/ErrorNotice'
import { Pagination } from '../ui/Pagination'
import { ACTION_LABEL, formatDateTime } from '@/features/housing/utils/activityLabels'
import { ActionBadge } from '../ui/ActionBadge'
import { actorLabel } from '../ui/actorLabel'
import { adminPath } from '@/features/housing/utils/housingProjects'
import { photoSlotLabel } from '../records/recordColumns'
import { Button, Card, EmptyState, FilterPanel, Grid, Icon, LoadingState, Page as UiPage, SelectField, Stack, Text, TextField, TextLink } from '@/ui'

/** রেকর্ডের কলাম যা ফিল্ড-সংজ্ঞায় নেই (বা পুরনো লগে) — বাংলা লেবেল */
const RECORD_COL: Record<string, string> = {
  serial_no: 'সিরিয়াল',
  year: 'সাল',
  name: 'নাম',
  father_or_husband_name: 'পিতা/স্বামী',
  division: 'বিভাগ',
  district: 'জেলা',
  upazila: 'উপজেলা',
  union_name: 'ইউনিয়ন/পৌরসভা',
  address: 'ঠিকানা',
  prev_photo_source: 'পূর্বের ছবির লিঙ্ক',
  current_photo_source: 'বর্তমান ছবির লিঙ্ক',
  prev_photo: 'পূর্বের ছবি',
  current_photo: 'বর্তমান ছবি',
}

/** প্রকল্পের সেটিং-বদলের কলাম */
const PROJECT_COL: Record<string, string> = {
  name_bn: 'নাম (বাংলা)',
  name_en: 'নাম (ইংরেজি)',
  slug: 'URL অংশ',
  parent_key: 'গ্রুপ',
  summary_bn: 'ছোট বর্ণনা (বাংলা)',
  summary_en: 'ছোট বর্ণনা (ইংরেজি)',
  description_bn: 'পরিচিতি (বাংলা)',
  description_en: 'পরিচিতি (ইংরেজি)',
  unit_bn: 'একক (বাংলা)',
  unit_en: 'একক (ইংরেজি)',
  photo_mode: 'ছবি মোড',
  prev_label_bn: 'আগের ছবির লেবেল',
  prev_label_en: 'আগের ছবির লেবেল (ইংরেজি)',
  current_label_bn: 'পরের ছবির লেবেল',
  current_label_en: 'পরের ছবির লেবেল (ইংরেজি)',
  geo_depth: 'ঠিকানার স্তর',
  core_fields: 'সিস্টেম ফিল্ড',
  stat_cards: 'স্ট্যাট কার্ড',
  display: 'প্রদর্শন',
  file_prefix: 'ফাইল-প্রিফিক্স',
  icon: 'আইকন',
  accent: 'রং',
  cover_path: 'কভার ছবি',
  is_published: 'প্রকাশিত',
  show_on_home: 'হোমে দেখান',
}

/** ফিল্ডের সেটিং-বদলের কলাম */
const FIELD_COL: Record<string, string> = {
  key: 'key',
  label_bn: 'লেবেল (বাংলা)',
  label_en: 'লেবেল (ইংরেজি)',
  help_bn: 'সাহায্য-লেখা (বাংলা)',
  help_en: 'সাহায্য-লেখা (ইংরেজি)',
  type: 'ধরন',
  required: 'আবশ্যক',
  visibility: 'কে দেখবে',
  show_in_table: 'টেবিলে',
  show_in_card: 'কার্ডে',
  show_in_detail: 'বিস্তারিত পাতায়',
  filterable: 'ফিল্টারে',
  searchable: 'সার্চে',
  fill_down: 'ফিল-ডাউন',
  max_length: 'সর্বোচ্চ দৈর্ঘ্য',
  min_value: 'সর্বনিম্ন মান',
  max_value: 'সর্বোচ্চ মান',
  import_aliases: 'বিকল্প শিরোনাম',
  is_active: 'সক্রিয়',
}

/** কোড-মান → বাংলা */
const ENUM: Record<string, string> = {
  before_after: 'আগে-পরে',
  after_only: 'শুধু পরে',
  none: 'ছবি নেই',
  public: 'পাবলিক',
  admin: 'শুধু-এডমিন',
  upazila: 'উপজেলা',
  union: 'ইউনিয়ন',
}

const IMPORT_KEYS: Record<string, string> = { mode: 'মোড', inserted: 'যোগ', updated: 'আপডেট', failed: 'ব্যর্থ', missing: 'মিলেনি', rows: 'সারি', file: 'ফাইল', done: 'সফল', skipped: 'বাদ', overwrite: 'ওভাররাইট', private: 'গোপনসহ' }

type State = { status: 'loading'; data: Page<ActivityEntry> | null } | { status: 'ready'; data: Page<ActivityEntry> } | { status: 'error'; error: HousingApiError }

/**
 * /admin/activity — একটিভিটি লগ (M-ধাপ ১২: সব প্রকল্পের): কে, কখন, কী করেছে। ফিল্টার (ধরন, প্রকল্প — ডাটাবেসের তালিকা থেকে,
 * কে, তারিখ) URL এ; পেজিনেশন। বদলের লেবেল ফিল্ডের সংজ্ঞা থেকে (অচেনা হলে কাঁচা key), টাকা "৳ ৫০,০০০ → ৳ ৬০,০০০";
 * প্রকল্প/ফিল্ডের সেটিং-বদল, গোপন মান (শুধু ফিল্ডের নাম), এক্সপোর্ট, ক্যাটাগরির এক-বানান।
 * উৎস: ডাটাবেস ট্রিগার (রেকর্ড, ছবি, সিরিয়াল, গোপন মান, প্রকল্প, ফিল্ড) + ক্লায়েন্ট-ইভেন্ট (login/logout/import_run/
 * photo_bulk_run/records_export/category_merge)।
 */
export function ActivityPage() {
  useDocumentTitle(t('একটিভিটি লগ'))
  const [sp, setSp] = useSearchParams()
  const me = useAdminUser()
  const allProjects = useProjects()
  // প্রকল্পের ইউজার শুধু নিজের প্রকল্পের লগ দেখেন (ডাটাবেসও তাই দেয়) — ফিল্টারেও শুধু সেগুলো (পর্ব চ)
  const projects = useMemo(() => allProjects.filter((p) => canEditProject(me, p.key)), [allProjects, me])
  const page = Math.max(1, Number(sp.get('page')) || 1)
  const params = useMemo<ActivityListParams>(
    () => ({
      page,
      page_size: DEFAULT_PAGE_SIZE,
      action: sp.get('action') || undefined,
      project_type: sp.get('project') || undefined,
      actor_email: sp.get('actor') || undefined,
      record_id: sp.get('record') || undefined,
      from: sp.get('from') ? `${sp.get('from')}T00:00:00` : undefined,
      to: sp.get('to') ? `${sp.get('to')}T23:59:59.999` : undefined,
    }),
    [sp, page],
  )
  const [state, setState] = useState<State>({ status: 'loading', data: null })
  const key = JSON.stringify(params)
  useEffect(() => {
    let alive = true
    getHousingApi()
      .listActivity(JSON.parse(key) as ActivityListParams)
      .then((data) => alive && setState({ status: 'ready', data }))
      .catch((err: unknown) => alive && setState({ status: 'error', error: HousingApiError.from(err) }))
    return () => {
      alive = false
    }
  }, [key])

  const setParam = useCallback(
    (k: string, v: string) =>
      setSp(
        (prev) => {
          const n = new URLSearchParams(prev)
          if (v) n.set(k, v)
          else n.delete(k)
          if (k !== 'page') n.delete('page')
          return n
        },
        { replace: k !== 'page' },
      ),
    [setSp],
  )

  // প্রকল্প ফিল্টার: ডাটাবেসের রেজিস্ট্রি (এডমিনে খসড়াসহ) — গ্রুপ, তার নিচে উপ-প্রকল্প, তারপর একক
  const projectOptions = useMemo(() => {
    const out: { key: string; label: string }[] = []
    const label = (p: Project) => (p.is_published ? lt(p, 'name') : t('{name} (খসড়া)', { name: lt(p, 'name') }))
    for (const p of projects.filter((x) => !x.parent_key)) {
      out.push({ key: p.key, label: label(p) })
      for (const c of projects.filter((x) => x.parent_key === p.key)) out.push({ key: c.key, label: `↳ ${label(c)}` })
    }
    return out
  }, [projects])


  // ইমেইল-ঘরের লেখা নিজের state-এ থাকে; URL শুধু ঘর ছাড়লে বা Enter চাপলে বদলায়
  const [actor, setActor] = useState(sp.get('actor') ?? '')
  const data = state.status === 'error' ? null : state.data

  return (
    <UiPage
      title={t('একটিভিটি লগ')}
      description={t('প্রতিটি রেকর্ড যোগ/সম্পাদনা/মোছা, ছবি ও সিরিয়াল বদল, লগইন, ইম্পোর্ট — কে, কখন, কী বদলেছে।')}
      documentTitle={false}
      actions={
        sp.get('record') && (
          <Button variant="secondary" size="small" onClick={() => setParam('record', '')}>
            {t('একটি রেকর্ডের ইতিহাস দেখানো হচ্ছে — সব দেখুন')}
          </Button>
        )
      }
    >
      <Stack gap={2}>
        {/* ---------- ফিল্টার (রেকর্ড-তালিকার মতো একই প্যানেল) ---------- */}
        <FilterPanel
          label={t('ফিল্টার')}
          activeCount={FILTER_KEYS.filter((k) => sp.get(k)).length}
          onClear={() => {
            setActor('')
            setSp(new URLSearchParams(), { replace: true })
          }}
          clearLabel={t('ফিল্টার মুছুন')}
        >
          <Grid columns={{ xs: 1, sm: 2, lg: 5 }}>
            <SelectField
              label={t('কাজের ধরন')}
              size="small"
              value={sp.get('action') ?? ''}
              onChange={(v) => setParam('action', v)}
              options={[{ value: '', label: t('সব ধরন') }, ...Object.entries(ACTION_LABEL).map(([k, v]) => ({ value: k, label: t(v) }))]}
            />
            <SelectField
              label={t('প্রকল্প')}
              size="small"
              value={sp.get('project') ?? ''}
              onChange={(v) => setParam('project', v)}
              options={[{ value: '', label: t('সব প্রকল্প') }, ...projectOptions.map((p) => ({ value: p.key, label: p.label }))]}
            />
            <form
              noValidate
              onSubmit={(ev) => {
                ev.preventDefault()
                setParam('actor', actor.trim())
              }}
            >
              <TextField label={t('কে (ইমেইল)')} type="search" size="small" placeholder={t('ইমেইল লিখে খুঁজুন')} value={actor} onChange={setActor} onBlur={() => setParam('actor', actor.trim())} />
            </form>
            <TextField label={t('থেকে')} type="date" size="small" value={sp.get('from') ?? ''} onChange={(v) => setParam('from', v)} />
            <TextField label={t('পর্যন্ত')} type="date" size="small" value={sp.get('to') ?? ''} onChange={(v) => setParam('to', v)} />
          </Grid>
        </FilterPanel>

        {state.status === 'error' && <ErrorNotice title={t('লগ লোড করা যায়নি')} error={state.error} />}
        {state.status === 'loading' && !data && <LoadingState label={t('লোড হচ্ছে…')} />}
        {data && data.meta.total === 0 && (
          <Card>
            <EmptyState title={t('কোনো এন্ট্রি নেই।')} />
          </Card>
        )}
        {data && data.meta.total > 0 && (
          <>
            <Card padding="none">
              <Stack role="list" gap={0} divided>
                {data.data.map((e) => (
                  <Entry key={e.id} e={e} />
                ))}
              </Stack>
            </Card>
            <Pagination meta={data.meta} onPageChange={(p) => setParam('page', p <= 1 ? '' : String(p))} disabled={state.status === 'loading'} />
          </>
        )}
      </Stack>
    </UiPage>
  )
}

const FILTER_KEYS = ['action', 'project', 'actor', 'from', 'to', 'record'] as const

const isConfig = (a: string) => a.startsWith('project_') || a.startsWith('field_')

function Entry({ e }: { e: ActivityEntry }) {
  const project = useProject(e.project_type)
  const defs = useMemo(() => (project ? resolveFields(project, { includePrivate: true, includeArchived: true }) : []), [project])
  const config = isConfig(e.action)
  return (
    <Stack role="listitem" padding={2}>
        <Stack gap={1}>
          <Stack direction="row" gap={1.5} wrap align="center">
            <Text size="caption" tone="muted" tabular inline>
              <time dateTime={e.at}>{formatDateTime(e.at)}</time>
            </Text>
            <ActionBadge action={e.action} />
            <Text size="small" weight="medium" inline>
              {actorLabel(e.actor_email)}
            </Text>
            {e.record_id && e.serial_no !== null && (
              <Text size="small" inline>
                → {project ? lt(project, 'name') : e.project_type} ·{' '}
                {/* পুরো "সিরিয়াল ৯" লিংক, শুধু অঙ্কটি নয় — এক অঙ্কের লিংক আঙুলে ধরা কঠিন */}
                {e.action === 'delete' || !project ? (
                  <Text size="small" weight="bold" inline>
                    {t('সিরিয়াল {n}', { n: toBanglaNumber(e.serial_no) })}
                  </Text>
                ) : (
                  <TextLink to={adminPath(project.key, `${e.serial_no}/edit`)}>{t('সিরিয়াল {n}', { n: toBanglaNumber(e.serial_no) })}</TextLink>
                )}
                {e.record_name && (
                  <Text size="small" tone="muted" inline>
                    {' '}
                    ({e.record_name})
                  </Text>
                )}{' '}
                <TextLink to={`/admin/activity?record=${e.record_id}`}>{t('ইতিহাস')}</TextLink>
              </Text>
            )}
            {!e.record_id && config && e.project_type && (
              <Text size="small" inline>
                → {project ? lt(project, 'name') : e.project_type}
                {e.action.startsWith('field_') && e.record_name && (
                  <Text size="small" tone="muted" inline>
                    {' '}
                    · {t('ফিল্ড «{name}»', { name: e.record_name })}
                  </Text>
                )}
                {e.action !== 'project_delete' && (
                  <>
                    {' '}
                    <TextLink to={`/admin/projects/${encodeURIComponent(e.project_type)}${e.action.startsWith('field_') ? '?tab=fields' : ''}`}>{t('সেটিংস')}</TextLink>
                  </>
                )}
              </Text>
            )}
            {!e.record_id && !config && project && (
              <Text size="small" tone="muted" inline>
                · {lt(project, 'name')}
              </Text>
            )}
          </Stack>
          <Details e={e} project={project ?? null} defs={defs} />
        </Stack>
    </Stack>
  )
}

/** রেকর্ডের বদলের লেবেল ও মান: ফিল্ডের সংজ্ঞা থেকে (টাকা ৳), অচেনা হলে কাঁচা key */
function recordChange(field: string, project: Project | null, defs: FieldDef[]): { label: string; def: FieldDef | null } {
  if (field === 'prev_photo' || field === 'current_photo') return { label: project ? photoSlotLabel(project, field === 'prev_photo' ? 'prev' : 'current') : t(RECORD_COL[field]), def: null }
  const key = field.startsWith('extra.') ? field.slice(6) : field
  const def = defs.find((d) => d.key === key && (field.startsWith('extra.') ? d.source !== 'system' : d.source === 'system')) ?? null
  if (def) return { label: lt(def, 'label'), def }
  return { label: RECORD_COL[field] ? t(RECORD_COL[field]) : field, def: null }
}

function fmt(v: unknown, def: FieldDef | null = null): string {
  if (v === null || v === undefined || v === '') return '—'
  if (def && (typeof v === 'string' || typeof v === 'number')) {
    const s = formatField(def, v)
    if (s) return s
  }
  if (typeof v === 'boolean') return v ? t('হ্যাঁ') : t('না')
  if (typeof v === 'number') return toBanglaNumber(v)
  if (typeof v === 'string') {
    if (ENUM[v]) return t(ENUM[v])
    if (v in FIELD_VALUE_SPECS) return t(FIELD_VALUE_SPECS[v as keyof typeof FIELD_VALUE_SPECS].label_bn)
    return v.length > 60 ? `${v.slice(0, 60)}…` : v
  }
  return t('(বদলেছে)')
}

function Details({ e, project, defs }: { e: ActivityEntry; project: Project | null; defs: FieldDef[] }) {
  const d = (e.details ?? {}) as Record<string, unknown>
  const changes = (d.changes ?? null) as Record<string, { old: unknown; new: unknown }> | null
  if (changes && Object.keys(changes).length) {
    const config = isConfig(e.action)
    const cols = e.action.startsWith('project_') ? PROJECT_COL : FIELD_COL
    return (
      <Stack role="list" direction="row" gap={2} wrap>
        {Object.entries(changes).map(([field, v]) => {
          const { label, def } = config ? { label: cols[field] ? t(cols[field]) : field, def: null } : recordChange(field, project, defs)
          return (
            <Stack role="listitem" key={field}>
              <Text size="caption" tone="muted">
                <Text size="caption" weight="medium" inline>
                  {label}:
                </Text>{' '}
                {field.endsWith('_photo') && !config ? (
                  <>
                    {v.old ? t('ছিল') : t('ছিল না')} →{' '}
                    <Text size="caption" inline>
                      {v.new ? t('আছে') : t('নেই')}
                    </Text>
                  </>
                ) : (
                  <>
                    <s>{fmt(v.old, def)}</s> →{' '}
                    <Text size="caption" inline>
                      {fmt(v.new, def)}
                    </Text>
                  </>
                )}
              </Text>
            </Stack>
          )
        })}
      </Stack>
    )
  }
  if (e.action === 'create' || e.action === 'delete') {
    return (
      <Text size="caption" tone="muted">
        {[d.year && t('সাল {n}', { n: toBanglaNumber(String(d.year)) }), d.upazila && `${gn(String(d.upazila))}, ${gn(String(d.district))}, ${gn(String(d.division))}`, d.address && String(d.address)].filter(Boolean).join(' · ')}
      </Text>
    )
  }
  if (e.action === 'private_update') {
    const keys = Array.isArray(d.fields) ? (d.fields as string[]) : []
    return (
      <Text size="caption" tone="muted">
        <Icon name="lock" size={14} /> {keys.map((k) => recordChange(`extra.${k}`, project, defs).label).join(', ')} ({t('মান লগে রাখা হয় না')})
      </Text>
    )
  }
  if (e.action === 'category_merge') {
    const fieldLabel = recordChange(`extra.${String(d.field ?? '')}`, project, defs).label
    return (
      <Text size="caption" tone="muted">
        <Text size="caption" weight="medium" inline>
          {fieldLabel}:
        </Text>{' '}
        «{String(d.from ?? '')}» →{' '}
        <Text size="caption" inline>
          «{String(d.to ?? '')}»
        </Text>{' '}
        · {t('{n}টি রেকর্ড', { n: formatBanglaNumber(Number(d.records ?? 0)) })}
      </Text>
    )
  }
  if ((e.action === 'project_create' || e.action === 'field_create' || e.action === 'project_delete' || e.action === 'field_delete') && d.snapshot) {
    const s = d.snapshot as Record<string, unknown>
    const parts = e.action.startsWith('field_')
      ? [s.type && fmt(s.type), s.visibility && fmt(s.visibility), s.key && `key: ${String(s.key)}`]
      : [s.slug && `/${String(s.slug)}`, s.photo_mode && fmt(s.photo_mode), s.is_published === false && t('খসড়া')]
    return (
      <Text size="caption" tone="muted">
        {parts.filter(Boolean).join(' · ')}
      </Text>
    )
  }
  if (['import_run', 'photo_bulk_run', 'records_export'].includes(e.action)) {
    return (
      <Text size="caption" tone="muted">
        {Object.entries(d)
          .map(([k, v]) => `${IMPORT_KEYS[k] ? t(IMPORT_KEYS[k]) : k}: ${typeof v === 'number' ? formatBanglaNumber(v) : typeof v === 'boolean' ? (v ? t('হ্যাঁ') : t('না')) : String(v)}`)
          .join(' · ')}
      </Text>
    )
  }
  return null
}
