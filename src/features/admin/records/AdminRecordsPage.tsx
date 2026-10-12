import { lt, t as tr } from '@/i18n'
import { useCallback, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { formatBanglaNumber, toBanglaNumber } from '@/lib/banglaNumber'
import { DEFAULT_LIST_ORDER, DEFAULT_PAGE_SIZE, getHousingApi, HousingApiError, type HousingRecord, type ListParams, type Project } from '@/backend'
import { useProjects } from '@/features/projects/registry'
import { downloadText } from '@/features/housing/utils/csvExport'
import { RecordFilters } from '../ui/RecordFilters'
import { useHousingList } from '@/features/housing/hooks/useHousingList'
import { applyFiltersToSearchParams, EMPTY_FILTERS, filtersEqual, filtersFromSearchParams, type HousingFilters as Filters } from '@/features/housing/utils/filters'
import { adminPath, useRecordProjectByKey } from '@/features/housing/utils/housingProjects'
import { Button, Card, EmptyState, Grid, LinkButton, LoadingState, Page, RadioGroup, SelectField, Stack, Text, useToast } from '@/ui'
import { NoRecordProject } from './NoRecordProject'
import { Badge } from '../ui/Badge'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { ErrorNotice } from '../ui/ErrorNotice'
import { Pagination } from '../ui/Pagination'
import { AdminRecordsTable } from './AdminRecordsTable'
import { canEditProject, isMainAdmin, useAdminUser } from '../adminUser'
import { CategoryValuesPanel } from './CategoryValuesPanel'
import { adminLayout } from './recordColumns'
import { csvFilename, exportRecordsCsv, hasPrivateFields } from './recordsCsv'
import { categoryFields, useCategoryUsage } from './useCategoryUsage'

const ascii = (s: string) => s.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d))).trim()

/**
 * /admin/records/:key — যেকোনো প্রকল্পের রেকর্ড (M-ধাপ ১০; খসড়াও): একই গ্রুপের প্রকল্পের ট্যাব, ফিল্টার (খোঁজার বক্সে
 * সংখ্যা দিলে সিরিয়াল ধরে; ক্যাটাগরি ফিল্টার `f.<key>`), কনফিগ-চালিত টেবিল/কার্ড, টাকার কলামে পাতার মোট,
 * এডিট/ডিলেট ও বাল্ক ডিলেট (ছবিসহ; শুধু মূল এডমিন — প্রশ্ন ১৬), ক্যাটাগরির বানান একীকরণ, CSV এক্সপোর্ট।
 */
export function AdminRecordsPage() {
  const { key } = useParams()
  const project = useRecordProjectByKey(key)
  if (!project) return <NoRecordProject projectKey={key} />
  return <RecordsManager key={project.key} project={project} />
}

function RecordsManager({ project }: { project: Project }) {
  useDocumentTitle(tr('{title} — রেকর্ড', { title: lt(project, 'name') }))
  const projectType = project.key
  const all = useProjects()
  const parent = project.parent_key ? all.find((p) => p.key === project.parent_key) : undefined
  // একই গ্রুপের প্রকল্প (ঘর নির্মাণ: সেমিপাকা, টিন) — একক প্রকল্পে ট্যাব নেই
  const me = useAdminUser()
  // প্রকল্পের ইউজার শুধু নিজের বরাদ্দ প্রকল্পের ট্যাব দেখেন (পর্ব চ)
  const tabs = project.parent_key ? all.filter((p) => p.parent_key === project.parent_key && !p.is_group && canEditProject(me, p.key)) : []
  const toast = useToast()
  const mainAdmin = isMainAdmin(me)
  const layout = useMemo(() => adminLayout(project), [project])
  const catFilters = useMemo(() => categoryFields(project).filter((f) => f.filterable), [project])
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const filters = useMemo(() => filtersFromSearchParams(searchParams), [searchParams])
  const fieldFilters = useMemo(() => {
    const out: Record<string, string> = {}
    for (const f of catFilters) {
      const v = searchParams.get(`f.${f.key}`)?.trim()
      if (v) out[f.key] = v
    }
    return out
  }, [catFilters, searchParams])
  const [reload, setReload] = useState(0)
  const usage = useCategoryUsage(project, reload)

  // খোঁজার বক্সে শুধু সংখ্যা → সিরিয়াল ধরে খোঁজা
  const serialQuery = useMemo(() => {
    const n = Number(ascii(filters.q))
    return filters.q && /^[0-9০-৯]+$/.test(filters.q.trim()) && Number.isInteger(n) && n >= 1 ? n : undefined
  }, [filters.q])

  const params = useMemo<ListParams>(
    () => ({
      project_type: projectType,
      page,
      page_size: DEFAULT_PAGE_SIZE,
      ...DEFAULT_LIST_ORDER, // নতুন সাল আগে, একই সালে সিরিয়াল ক্রমে (M-ধাপ ১৭)
      year: filters.year ?? undefined,
      division: filters.division || undefined,
      district: filters.district || undefined,
      upazila: filters.upazila || undefined,
      serial_no: serialQuery,
      q: serialQuery === undefined && filters.q ? filters.q : undefined,
      fields: Object.keys(fieldFilters).length ? fieldFilters : undefined,
    }),
    [projectType, page, filters, serialQuery, fieldFilters],
  )
  const list = useHousingList(params, reload)
  const refresh = () => setReload((n) => n + 1)

  const goToPage = useCallback(
    (next: number) =>
      setSearchParams((prev) => {
        const sp = new URLSearchParams(prev)
        if (next <= 1) sp.delete('page')
        else sp.set('page', String(next))
        return sp
      }),
    [setSearchParams],
  )
  const setFilters = useCallback(
    (next: Filters) =>
      setSearchParams(
        (prev) => {
          if (filtersEqual(filtersFromSearchParams(prev), next)) return prev
          const sp = applyFiltersToSearchParams(prev, next)
          sp.delete('page')
          return sp
        },
        { replace: true },
      ),
    [setSearchParams],
  )
  const setFieldFilter = (fieldKey: string, value: string) =>
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev)
        if (value) sp.set(`f.${fieldKey}`, value)
        else sp.delete(`f.${fieldKey}`)
        sp.delete('page')
        return sp
      },
      { replace: true },
    )

  // ---- নির্বাচন ----
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  const toggleAll = (ids: string[], checked: boolean) =>
    setSelected((s) => {
      const n = new Set(s)
      for (const id of ids) {
        if (checked) n.add(id)
        else n.delete(id)
      }
      return n
    })

  // ---- ডিলেট ----
  const [pending, setPending] = useState<HousingRecord[] | null>(null)
  const [deleting, setDeleting] = useState(false)
  const data = list.data
  const askDeleteSelected = () => {
    const recs = (data?.data ?? []).filter((r) => selected.has(r.id))
    if (recs.length) setPending(recs)
  }
  const confirmDelete = async () => {
    if (!pending) return
    setDeleting(true)
    const api = getHousingApi()
    let ok = 0
    const failed: string[] = []
    for (const r of pending) {
      try {
        await api.delete(r.id)
        ok++
      } catch (err) {
        failed.push(`${toBanglaNumber(r.serial_no)}: ${HousingApiError.from(err).message}`)
      }
    }
    setDeleting(false)
    setPending(null)
    setSelected(new Set())
    refresh()
    if (ok) toast.success(tr('{n} টি রেকর্ড (ছবিসহ) মুছে ফেলা হয়েছে', { n: formatBanglaNumber(ok) }))
    if (failed.length) toast.error(tr('{n} টি মোছা যায়নি — {first}', { n: formatBanglaNumber(failed.length), first: failed[0] }))
  }

  const activeCount = [filters.year !== null, filters.division, filters.district, filters.upazila, filters.q.trim()].filter(Boolean).length + Object.keys(fieldFilters).length
  const active = activeCount > 0
  const clearAllFilters = () =>
    setSearchParams(
      (prev) => {
        const sp = applyFiltersToSearchParams(prev, EMPTY_FILTERS)
        for (const k of [...sp.keys()]) if (k.startsWith('f.')) sp.delete(k)
        sp.delete('page')
        return sp
      },
      { replace: true },
    )
  const selectedCount = selected.size

  // ---- এক্সপোর্ট ----
  const [exporting, setExporting] = useState<string | null>(null)
  const [exportAsk, setExportAsk] = useState(false)
  const [withPrivate, setWithPrivate] = useState(false)
  const exportCsv = async (includePrivate: boolean) => {
    setExportAsk(false)
    setExporting(tr('প্রস্তুত হচ্ছে…'))
    try {
      const api = getHousingApi()
      const { csv, rows } = await exportRecordsCsv(api, project, includePrivate, (d, t) => setExporting(`${formatBanglaNumber(d)} / ${formatBanglaNumber(t)}`))
      downloadText(csvFilename(project, parent?.slug ?? null, includePrivate), csv)
      void api.logActivity('records_export', { rows, private: includePrivate }, projectType)
      toast.success(tr('CSV ডাউনলোড শুরু হয়েছে'))
    } catch (err) {
      toast.error(tr('এক্সপোর্ট ব্যর্থ: {message}', { message: HousingApiError.from(err).message }))
    } finally {
      setExporting(null)
    }
  }
  const startExport = () => {
    if (hasPrivateFields(project)) {
      setWithPrivate(false)
      setExportAsk(true)
    } else void exportCsv(false)
  }

  return (
    <Page
      title={tr('{title} — রেকর্ড', { title: lt(project, 'name') })}
      documentTitle={false}
      description={tr('খোঁজার বক্সে শুধু সংখ্যা লিখলে সিরিয়াল ধরে খুঁজবে; নাম লিখলে নামে।')}
      badges={!project.is_published && <Badge tone="amber">{tr('খসড়া')}</Badge>}
      breadcrumbs={
        // একই গ্রুপের প্রকল্পের ট্যাব — শিরোনামের উপরে, আগের মতো
        tabs.length > 1 && (
          <nav aria-label={tr('প্রকল্প')}>
            <Stack direction="row" wrap gap={1}>
              {tabs.map((p) => (
                <LinkButton key={p.key} to={adminPath(p.key)} variant={p.key === projectType ? 'primary' : 'secondary'} current={p.key === projectType}>
                  {lt(p, 'name')}
                </LinkButton>
              ))}
            </Stack>
          </nav>
        )
      }
      actions={
        <>
          <Button variant="secondary" startIcon="download" onClick={startExport} disabled={!!exporting} title={tr('সব রেকর্ড সিরিয়াল, নাম, ঠিকানা ও ছবির লিঙ্কসহ CSV')}>
            {exporting ? tr('এক্সপোর্ট {status}', { status: exporting }) : tr('সিরিয়াল সহ এক্সপোর্ট (CSV)')}
          </Button>
          <LinkButton to={`/admin/import?project=${encodeURIComponent(projectType)}`} variant="secondary" startIcon="import">
            {tr('বাল্ক ইম্পোর্ট')}
          </LinkButton>
          <LinkButton to={adminPath(projectType, 'new')} startIcon="add">
            {tr('নতুন যোগ করুন')}
          </LinkButton>
        </>
      }
    >
      <Stack gap={2}>
        <RecordFilters projectType={projectType} value={filters} onChange={setFilters} activeCount={activeCount} onClear={clearAllFilters}>
          {catFilters.length > 0 && (
            <Grid columns={{ xs: 1, sm: 2, md: 3 }}>
              {catFilters.map((f) => {
                const values = usage?.[f.key] ?? []
                const cur = fieldFilters[f.key] ?? ''
                return (
                  <SelectField
                    key={f.key}
                    label={lt(f, 'label')}
                    size="small"
                    value={cur}
                    onChange={(v) => setFieldFilter(f.key, v)}
                    options={[
                      { value: '', label: tr('সব') },
                      ...(cur && !values.some((v) => v.value === cur) ? [{ value: cur, label: cur }] : []),
                      ...values.map((v) => ({ value: v.value, label: `${v.value} (${formatBanglaNumber(v.n)})` })),
                    ]}
                  />
                )
              })}
            </Grid>
          )}
        </RecordFilters>

        {categoryFields(project).length > 0 && <CategoryValuesPanel project={project} usage={usage} onChanged={refresh} />}

        {/* ---------- বাল্ক টুলবার ---------- */}
        {selectedCount > 0 && (
          <Card>
            <Stack direction="row" wrap align="center" justify="between" gap={1.5}>
              <Text size="small" weight="medium">
                {tr('{n} টি নির্বাচিত', { n: formatBanglaNumber(selectedCount) })}
              </Text>
              <Stack direction="row" gap={1}>
                <Button variant="secondary" size="small" onClick={() => setSelected(new Set())}>
                  {tr('নির্বাচন বাতিল')}
                </Button>
                {mainAdmin && (
                  <Button variant="danger" size="small" onClick={askDeleteSelected}>
                    {tr('নির্বাচিতগুলো মুছুন')}
                  </Button>
                )}
              </Stack>
            </Stack>
          </Card>
        )}

        {list.status === 'error' && <ErrorNotice title={tr('তালিকা লোড করা যায়নি')} error={list.error} />}
        {list.status !== 'error' && !data && <LoadingState label={tr('লোড হচ্ছে…')} />}
        {data && (
          <>
            {data.meta.total === 0 ? (
              <Card>
                <EmptyState title={active ? tr('কোনো তথ্য পাওয়া যায়নি।') : tr('এখনো কোনো রেকর্ড নেই — "নতুন যোগ করুন" দিয়ে শুরু করুন।')} />
              </Card>
            ) : (
              <>
                <AdminRecordsTable
                  project={project}
                  layout={layout}
                  records={data.data}
                  page={data.meta.page}
                  pageSize={data.meta.page_size}
                  busy={list.status === 'loading'}
                  selected={selected}
                  onToggle={toggle}
                  onToggleAll={toggleAll}
                  onDelete={mainAdmin ? (r) => setPending([r]) : undefined}
                />
                <Pagination meta={data.meta} onPageChange={goToPage} disabled={list.status === 'loading'} />
              </>
            )}
          </>
        )}
      </Stack>

      <ConfirmDialog
        open={pending !== null}
        title={pending && pending.length > 1 ? tr('{n} টি রেকর্ড মুছবেন?', { n: formatBanglaNumber(pending.length) }) : tr('আপনি কি নিশ্চিত?')}
        tone="danger"
        confirmLabel={pending && pending.length > 1 ? tr('হ্যাঁ, সব মুছুন') : tr('হ্যাঁ, মুছুন')}
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPending(null)}
      >
        {pending && (
          <Stack gap={1.5}>
            <Stack role="list" gap={0.5}>
              {pending.slice(0, 10).map((r) => (
                <Stack key={r.id} role="listitem">
                  <Text size="small">{tr('সিরিয়াল {n} — {name}', { n: toBanglaNumber(r.serial_no), name: r.name })}</Text>
                </Stack>
              ))}
              {pending.length > 10 && (
                <Stack role="listitem">
                  <Text size="small">{tr('… আরও {n} টি', { n: formatBanglaNumber(pending.length - 10) })}</Text>
                </Stack>
              )}
            </Stack>
            <Text size="small" tone="error">
              {tr('রেকর্ড ও তার ছবি স্টোরেজ থেকে মুছে যাবে। সিরিয়াল পুনরায় ব্যবহার হবে না। এটি ফেরানো যাবে না।')}
            </Text>
          </Stack>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={exportAsk}
        title={tr('গোপন কলামসহ এক্সপোর্ট করবেন?')}
        tone={withPrivate ? 'danger' : 'primary'}
        confirmLabel={tr('এক্সপোর্ট করুন')}
        onConfirm={() => void exportCsv(withPrivate)}
        onCancel={() => setExportAsk(false)}
      >
        <RadioGroup
          label={tr('এই প্রকল্পে শুধু-এডমিন (গোপন) ফিল্ড আছে, যেমন মোবাইল নম্বর।')}
          name="export-private"
          look="cards"
          value={String(withPrivate)}
          onChange={(v) => setWithPrivate(v === 'true')}
          options={[false, true].map((v) => ({
            value: String(v),
            label: v ? tr('🔒 গোপন কলামসহ — ফাইলের নামে "-private"; ফাইলটি কাউকে পাঠাবেন না') : tr('গোপন কলাম ছাড়া (সাধারণ)'),
          }))}
        />
      </ConfirmDialog>
    </Page>
  )
}
