import { gn, lt, pick, t } from '@/i18n'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { formatBanglaNumber, toBanglaNumber } from '@/lib/banglaNumber'
import { getHousingApi, HousingApiError, type BulkUpdateInput, type HousingBulkRow, type Project, type ProjectKey } from '@/backend'
import { gnUnion, useUnionData } from '@/features/geo/unions'
import { formatField } from '@/features/projects/fields'
import { downloadText, toCsv } from '@/features/housing/utils/csvExport'
import { NoProjectsNotice } from '../ui/NoProjectsNotice'
import { useRecordProjects } from '@/features/housing/utils/housingProjects'
import { isMainAdmin, useAdminUser } from '../adminUser'
import { useCategoryUsage } from '../records/useCategoryUsage'
import { CategoryReviewPanel } from './CategoryReviewPanel'
import { GeoFixPanel } from './GeoFixPanel'
import { analyzeRows, CLEAR_TOKEN, fillDown, fillDownFields, type ImportAnalysis, type ImportMode, type ImportRow, type Mapping } from './importAnalyze'
import { buildImportFields, guessMapping, isIgnoredHeader, type ImportFieldDef, type ImportFieldId } from './importFields'
import { parseSpreadsheet, type ParsedSheet } from './importParse'
import { Badge } from '../ui/Badge'
import { Step } from '../ui/Step'
import { Alert, Button, Card, Checkbox, DataTable, FileInput, Grid, Page, ProgressBar, RadioGroup, SelectField, Stack, Text, useToast, type DataTableColumn } from '@/ui'

const BATCH = 200
const PREVIEW_LIMIT = 300

interface RunResult {
  ok: number
  failed: { rowNo: number; serial: number | null; name: string; reason: string }[]
  missing: number[]
}

/**
 * /admin/import?project=<key> — Google Sheet (xlsx/csv) থেকে যেকোনো প্রকল্পে বাল্ক ইম্পোর্ট (M-ধাপ ১১; প্রকল্প রেজিস্ট্রি থেকে), ৪ ধাপ:
 * ১) প্রকল্প, মোড, ফাইল → ২) কলাম ম্যাপিং (প্রকল্পের ফিল্ড থেকে স্বয়ংক্রিয় অনুমান) → ৩) প্রিভিউ: যাচাই, ভৌগোলিক নাম
 * (ইউনিয়নসহ), ক্যাটাগরির বানান (ঐচ্ছিক), ডুপ্লিকেট → ৪) ব্যাচে চালানো (গোপন মান আলাদা) + সারসংক্ষেপ + ব্যর্থ CSV।
 */
export function ImportPage() {
  useDocumentTitle(t('বাল্ক ইম্পোর্ট'))
  const projects = useRecordProjects()
  const [searchParams] = useSearchParams()
  const asked = searchParams.get('project')
  const [chosen, setProjectKey] = useState<ProjectKey | null>(null)
  // URL এর প্রকল্প (খসড়া হলে এডমিনের রেজিস্ট্রিতে একটু পরে আসে) — এলে সেটিই; ব্যবহারকারী বাছলে সেটি
  const projectKey = chosen ?? (projects.some((p) => p.key === asked) ? asked : null) ?? projects[0]?.key
  const project = projects.find((p) => p.key === projectKey) ?? projects[0]
  if (!project)
    return (
      <Page title={t('বাল্ক ইম্পোর্ট')} documentTitle={false}>
        <NoProjectsNotice />
      </Page>
    )
  return <Importer key={project.key} project={project} projects={projects} onProject={setProjectKey} />
}

function Importer({ project, projects, onProject }: { project: Project; projects: Project[]; onProject: (key: ProjectKey) => void }) {
  const toast = useToast()
  const api = getHousingApi()
  const projectType = project.key
  const fields = useMemo(() => buildImportFields(project), [project])
  const byId = useMemo(() => new Map(fields.map((f) => [f.id, f])), [fields])
  const [mode, setMode] = useState<ImportMode>('insert')
  const [file, setFile] = useState<File | null>(null)
  const [sheet, setSheet] = useState<ParsedSheet | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [mapping, setMapping] = useState<Mapping>([])
  const [geoFixes, setGeoFixes] = useState<Record<string, string>>({})
  const [categoryFixes, setCategoryFixes] = useState<Record<string, Record<string, string>>>({})
  const [nextSerial, setNextSerial] = useState<number | null>(null)
  const [onlyErrors, setOnlyErrors] = useState(false)
  const [useFillDown, setUseFillDown] = useState(true)
  const [insertMissing, setInsertMissing] = useState(false)
  const [running, setRunning] = useState<{ done: number; total: number } | null>(null)
  const [result, setResult] = useState<RunResult | null>(null)
  const existing = useCategoryUsage(project, result ? 1 : 0)
  const unionMapped = mapping.includes('union_name')
  const { data: unions } = useUnionData(project.geo_depth === 'union' && unionMapped)

  // ---- পরবর্তী সিরিয়াল ----
  useEffect(() => {
    let alive = true
    api
      .nextSerial(projectType)
      .then((n) => alive && setNextSerial(n))
      .catch(() => alive && setNextSerial(null))
    return () => {
      alive = false
    }
  }, [api, projectType])

  // ---- ফাইল ----
  const onFile = async (f: File | null) => {
    setFile(f)
    setSheet(null)
    setParseError(null)
    setResult(null)
    setGeoFixes({})
    setCategoryFixes({})
    if (!f) return
    try {
      const parsed = await parseSpreadsheet(f)
      setSheet(parsed)
      setMapping(guessMapping(parsed.headers, fields))
    } catch (err) {
      setParseError(HousingApiError.from(err).message)
    }
  }

  // ---- বিশ্লেষণ ----
  const update = mode === 'update'
  // "(মুছুন)" (মান ফাঁকা করা) শুধু মূল এডমিন — প্রকল্পের ইউজারের সারিতে ভুল (পর্ব চ; ডাটাবেসও আটকায়)
  const canClear = isMainAdmin(useAdminUser())
  const hasSerialCol = mapping.includes('serial_no')
  // খালি সাল/বিভাগ/জেলা/উপজেলা (আর ফিল-ডাউন চালু কাস্টম ফিল্ড) → উপরের সারির মান; আপডেটে নয় (সেখানে খালি = অপরিবর্তিত)
  const fdIds = useMemo(() => fillDownFields(fields), [fields])
  const filled = useMemo(() => (sheet && useFillDown && !update ? fillDown(sheet.rows, mapping, fdIds) : { rows: sheet?.rows ?? [], filled: 0 }), [sheet, mapping, useFillDown, update, fdIds])
  const analysis: ImportAnalysis | null = useMemo(() => {
    if (!sheet) return null
    return analyzeRows(filled.rows, mapping, fields, { mode, geoFixes, serialFromFile: hasSerialCol, startSerial: nextSerial ?? 1, unions, categoryFixes, canClear })
  }, [sheet, filled, mapping, fields, mode, geoFixes, hasSerialCol, nextSerial, unions, categoryFixes, canClear])

  const missingRequired = update ? [] : fields.filter((f) => f.required && !mapping.includes(f.id))
  const modeNeedsSerial = update && !hasSerialCol
  const canRun = !!analysis && analysis.validCount > 0 && missingRequired.length === 0 && !modeNeedsSerial && !running

  const setMap = (i: number, id: ImportFieldId | null) => setMapping((m) => m.map((f, j) => (j === i ? id : f === id && id !== null ? null : f)))
  const fieldLabel = (f: ImportFieldDef) => pick(f.label_bn, f.label_en)
  const mappedCustom = useMemo(() => fields.filter((f) => f.id.startsWith('x.') && mapping.includes(f.id)), [fields, mapping])
  const categoryMapped = useMemo(() => mappedCustom.filter((f) => f.def?.type === 'category' && !f.private), [mappedCustom])
  const photoIds = (['prev_photo_source', 'current_photo_source'] as const).filter((id) => byId.has(id))

  // ---- চালানো ----
  const run = useCallback(async () => {
    if (!analysis) return
    const valid = analysis.rows.filter((r) => !r.errors.length)
    const invalid = analysis.rows.filter((r) => r.errors.length)
    const res: RunResult = {
      ok: 0,
      failed: invalid.map((r) => ({ rowNo: r.rowNo, serial: r.values.serial_no, name: r.values.name, reason: t('বাদ (ভুল): {errors}', { errors: r.errors.join('; ') }) })),
      missing: [],
    }
    const hasCustom = project.fields.some((f) => f.is_active)
    const insertRow = (r: ImportRow): HousingBulkRow => ({
      serial_no: r.values.serial_no ?? undefined,
      year: r.values.year!,
      name: r.values.name,
      father_or_husband_name: r.values.father_or_husband_name,
      division: r.values.division!,
      district: r.values.district!,
      upazila: r.values.upazila!,
      address: r.values.address,
      prev_photo_source: r.values.prev_photo_source,
      current_photo_source: r.values.current_photo_source,
      ...(byId.has('union_name') ? { union_name: r.values.union_name } : {}),
      ...(hasCustom ? { extra: r.extra } : {}),
    })
    /** আপডেট: শুধু ম্যাপ করা আর খালি নয় এমন ঘর; "(মুছুন)" → _clear; গোপন মান extra দিয়ে (ডাটাবেস আলাদা জায়গায় রাখে) */
    const updateRow = (r: ImportRow): BulkUpdateInput['rows'][number] => {
      const p = (id: ImportFieldId) => r.present.has(id)
      const v = r.values
      const extra = { ...r.extra, ...r.priv }
      return {
        serial_no: v.serial_no!,
        ...(p('year') && v.year !== null ? { year: v.year } : {}),
        ...(p('name') ? { name: v.name } : {}),
        ...(p('father_or_husband_name') ? { father_or_husband_name: v.father_or_husband_name } : {}),
        ...(p('division') && v.division ? { division: v.division, district: v.district!, upazila: v.upazila! } : {}),
        ...(p('union_name') ? { union_name: v.union_name } : {}),
        ...(p('address') ? { address: v.address } : {}),
        ...(p('prev_photo_source') ? { prev_photo_source: v.prev_photo_source } : {}),
        ...(p('current_photo_source') ? { current_photo_source: v.current_photo_source } : {}),
        ...(Object.keys(extra).length ? { extra } : {}),
        ...(r.clear.length ? { _clear: r.clear } : {}),
      }
    }
    /** নতুন যোগের পর গোপন মান (সিরিয়াল ধরে; ডাটাবেস beneficiary_private এ রাখে) */
    const sendPrivate = async (inserted: ImportRow[]) => {
      const rows = inserted.filter((r) => Object.keys(r.priv).length && r.values.serial_no !== null).map((r) => ({ serial_no: r.values.serial_no!, extra: r.priv }))
      if (!rows.length) return
      try {
        await api.bulkUpdateBySerial({ project_type: projectType, rows })
      } catch (err) {
        const reason = t('রেকর্ড যোগ হয়েছে, কিন্তু গোপন মান সংরক্ষণ হয়নি: {message}', { message: HousingApiError.from(err).message })
        for (const r of inserted.filter((x) => Object.keys(x.priv).length)) res.failed.push({ rowNo: r.rowNo, serial: r.values.serial_no, name: r.values.name, reason })
      }
    }
    setResult(null)
    setRunning({ done: 0, total: valid.length })
    try {
      for (let start = 0; start < valid.length; start += BATCH) {
        const chunk = valid.slice(start, start + BATCH)
        try {
          if (!update) {
            const out = await api.bulkInsert({ project_type: projectType, mode: 'use_given_serial', rows: chunk.map(insertRow) })
            res.ok += out.inserted
            await sendPrivate(chunk.slice(0, out.inserted))
            if (out.failed.length) {
              // চাঙ্ক-স্তরে ব্যর্থ → চাঙ্কের সব সারি ব্যর্থ (ইনসার্ট হয়নি)
              const reason = out.failed.map((f) => f.error.message).join('; ')
              for (const r of chunk.slice(out.inserted)) res.failed.push({ rowNo: r.rowNo, serial: r.values.serial_no, name: r.values.name, reason })
            }
          } else {
            const out = await api.bulkUpdateBySerial({ project_type: projectType, rows: chunk.map(updateRow) })
            res.ok += out.updated
            res.missing.push(...out.missing)
            if (insertMissing && out.missing.length) {
              const miss = new Set(out.missing)
              const toInsert = chunk.filter((r) => r.values.serial_no !== null && miss.has(r.values.serial_no))
              const ins = await api.bulkInsert({ project_type: projectType, mode: 'use_given_serial', rows: toInsert.map(insertRow) })
              res.ok += ins.inserted
              res.missing = res.missing.filter((s) => !miss.has(s))
              await sendPrivate(toInsert.slice(0, ins.inserted))
              if (ins.failed.length) {
                const reason = ins.failed.map((f) => f.error.message).join('; ')
                for (const r of toInsert.slice(ins.inserted)) res.failed.push({ rowNo: r.rowNo, serial: r.values.serial_no, name: r.values.name, reason })
              }
            }
          }
        } catch (err) {
          const reason = HousingApiError.from(err).message
          for (const r of chunk) res.failed.push({ rowNo: r.rowNo, serial: r.values.serial_no, name: r.values.name, reason })
        }
        setRunning({ done: Math.min(valid.length, start + chunk.length), total: valid.length })
      }
    } finally {
      setRunning(null)
      setResult(res)
      if (res.ok) toast.success(!update ? t('{n} টি সারি যোগ হয়েছে', { n: formatBanglaNumber(res.ok) }) : t('{n} টি সারি আপডেট হয়েছে', { n: formatBanglaNumber(res.ok) }))
      if (res.failed.length) toast.error(t('{n} টি সারি ব্যর্থ/বাদ — নিচে তালিকা', { n: formatBanglaNumber(res.failed.length) }))
      void api.logActivity('import_run', { mode, file: file?.name ?? '', rows: valid.length, [!update ? 'inserted' : 'updated']: res.ok, failed: res.failed.length, missing: res.missing.length }, projectType)
      api.nextSerial(projectType).then(setNextSerial).catch(() => {})
    }
  }, [analysis, api, mode, update, projectType, insertMissing, toast, file, byId, project.fields])

  const downloadFailed = () => {
    if (!result) return
    const rows = result.failed.map((f) => [f.rowNo, f.serial ?? '', f.name, f.reason])
    const missingRows = result.missing.map((s) => ['', s, '', t('সিরিয়াল ধরে রেকর্ড পাওয়া যায়নি (আপডেট হয়নি)')])
    downloadText(`import-failed-${project.slug}.csv`, toCsv([t('ফাইলের সারি'), t('সিরিয়াল'), t('নাম'), t('কারণ')], [...rows, ...missingRows]))
  }

  const previewRows = useMemo(() => {
    if (!analysis) return []
    const src = onlyErrors ? analysis.rows.filter((r) => r.errors.length || r.warnings.length) : analysis.rows
    return src.slice(0, PREVIEW_LIMIT)
  }, [analysis, onlyErrors])
  const sheetValues = useMemo(() => {
    const out: Record<string, string[]> = {}
    for (const f of categoryMapped) out[f.id] = (analysis?.rows ?? []).map((r) => r.raw[f.id])
    return out
  }, [analysis, categoryMapped])
  const unionCol = byId.has('union_name') && unionMapped
  const ignoredHeaders = sheet ? sheet.headers.filter(isIgnoredHeader) : []

  const previewColumns: DataTableColumn<ImportRow>[] = [
    { id: 'row', header: t('সারি'), cell: (r) => <Text size="small" tone="muted" inline>{toBanglaNumber(r.rowNo)}</Text> },
    {
      id: 'serial',
      header: t('সিরিয়াল'),
      cell: (r) =>
        r.values.serial_no !== null ? (
          <Text size="small" weight="medium" tabular inline>
            {toBanglaNumber(r.values.serial_no)}
          </Text>
        ) : (
          <Bad>{r.raw.serial_no || '—'}</Bad>
        ),
    },
    { id: 'year', header: t('সাল'), cell: (r) => (r.values.year !== null ? toBanglaNumber(r.values.year) : update && !r.raw.year ? '—' : <Bad>{r.raw.year || '—'}</Bad>) },
    { id: 'name', header: t('নাম'), cell: (r) => r.values.name || (update ? '—' : <Bad>—</Bad>) },
    { id: 'father', header: t('পিতা/স্বামী'), cell: (r) => (r.clear.includes('father_or_husband_name') ? <Cleared /> : r.values.father_or_husband_name || '—') },
    { id: 'division', header: t('বিভাগ'), cell: (r) => <GeoCell value={r.values.division} raw={r.raw.division} corrected={r.geo.corrected.includes('division')} soft={update} /> },
    { id: 'district', header: t('জেলা'), cell: (r) => <GeoCell value={r.values.district} raw={r.raw.district} corrected={r.geo.corrected.includes('district')} soft={update} /> },
    { id: 'upazila', header: t('উপজেলা'), cell: (r) => <GeoCell value={r.values.upazila} raw={r.raw.upazila} corrected={r.geo.corrected.includes('upazila')} soft={update} /> },
    ...(unionCol
      ? [
          {
            id: 'union',
            header: t('ইউনিয়ন'),
            cell: (r: ImportRow) => (
              <>
                {r.clear.includes('union_name') ? <Cleared /> : r.values.union_name ? gnUnion(r.values.district, r.values.upazila, r.values.union_name) : '—'}
                {r.geo.union?.status === 'unlisted' && r.values.union_name === r.geo.union.value && (
                  <>
                    {' '}
                    <Text size="caption" tone="warning" inline>
                      {t('(তালিকায় নেই)')}
                    </Text>
                  </>
                )}
              </>
            ),
          },
        ]
      : []),
    {
      id: 'address',
      header: t('ঠিকানা'),
      cell: (r) =>
        r.clear.includes('address') ? (
          <Cleared />
        ) : (
          <Text size="small" tone="muted" truncate title={r.values.address}>
            {r.values.address || '—'}
          </Text>
        ),
    },
    ...mappedCustom.map((f): DataTableColumn<ImportRow> => {
      const numeric = f.def?.type === 'money' || f.def?.type === 'number'
      return {
        id: f.id,
        header: `${f.private ? '🔒 ' : ''}${fieldLabel(f)}`,
        align: numeric ? 'right' : undefined,
        cell: (r) => {
          const key = f.id.slice(2)
          const v = (f.private ? r.priv : r.extra)[key]
          return r.bad.has(f.id) ? (
            <Bad>{r.raw[f.id] || '—'}</Bad>
          ) : r.clear.includes(`extra.${key}`) ? (
            <Cleared />
          ) : v !== undefined ? (
            <Text size="small" tabular={numeric} inline>
              {formatField(f.def!, v)}
            </Text>
          ) : (
            '—'
          )
        },
      }
    }),
    ...(photoIds.length > 0
      ? [
          {
            id: 'photos',
            header: t('ছবি লিঙ্ক'),
            cell: (r: ImportRow) => (
              <Text size="small" tone="muted" inline>
                {photoIds.map((id) => (r.clear.includes(id) ? '✕' : r.values[id] ? '✓' : '–')).join(' / ')}
              </Text>
            ),
          },
        ]
      : []),
    {
      id: 'status',
      header: t('অবস্থা'),
      cell: (r) => (
        <>
          {r.errors.map((e, i) => (
            <Text key={`e${i}`} size="small" tone="error">
              {e}
            </Text>
          ))}
          {r.warnings.map((w, i) => (
            <Text key={`w${i}`} size="small" tone="warning">
              {w}
            </Text>
          ))}
          {!r.errors.length && !r.warnings.length && (
            <Text size="small" tone="success" inline>
              {t('ঠিক আছে')}
            </Text>
          )}
        </>
      ),
    },
  ]

  return (
    <Page
      title={t('Google Sheet থেকে বাল্ক ইম্পোর্ট')}
      description={t('Sheet → File → Download → Excel (.xlsx) বা CSV (UTF-8)। ছবির লিঙ্ক শুধু রেফারেন্স হিসেবে সংরক্ষিত হয়; ছবি নিজে আলাদা স্ক্রিপ্ট/বাল্ক পেইজে আপলোড হবে।')}
      documentTitle={false}
    >
      <Stack gap={3}>
        {/* ---------- ধাপ ১ ---------- */}
        <Step announced n={1} title={t('প্রকল্প, মোড ও ফাইল')}>
          <Grid columns={{ xs: 1, md: 3 }} gap={3}>
            <SelectField
              label={t('প্রকল্প')}
              value={projectType}
              onChange={(v) => onProject(v)}
              disabled={!!running}
              hint={nextSerial !== null ? t('পরবর্তী স্বয়ংক্রিয় সিরিয়াল: {n}', { n: toBanglaNumber(nextSerial) }) : undefined}
              options={projects.map((p) => ({ value: p.key, label: p.is_published ? lt(p, 'name') : t('{name} (খসড়া)', { name: lt(p, 'name') }) }))}
            />
            <Stack gap={0.5}>
              <RadioGroup
                label={t('মোড')}
                name="mode"
                value={mode}
                onChange={(v) => setMode(v as ImportMode)}
                disabled={!!running}
                options={[
                  { value: 'insert', label: t('নতুন যোগ করুন') },
                  { value: 'update', label: t('সিরিয়াল ধরে আপডেট করুন') },
                ]}
              />
              {update && <Checkbox label={t('মিলছে না এমন সিরিয়াল নতুন হিসেবে যোগ করুন')} checked={insertMissing} onChange={setInsertMissing} />}
            </Stack>
            <Stack gap={1}>
              <FileInput
                label={t('ফাইল (.xlsx / .csv)')}
                buttonLabel={t('ফাইল (.xlsx / .csv)')}
                accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                clearAfterPick={false}
                onFiles={(files) => void onFile(files[0] ?? null)}
                disabled={!!running}
              />
              {file && sheet && (
                <Text size="caption" tone="muted">
                  {file.name} · {t('শীট "{sheet}" · {rows} সারি, {cols} কলাম', { sheet: sheet.sheetName, rows: formatBanglaNumber(sheet.rows.length), cols: toBanglaNumber(sheet.headers.length) })}
                </Text>
              )}
              {parseError && <Alert tone="error">{parseError}</Alert>}
            </Stack>
          </Grid>
          {update && (
            <div role="note">
              <Card>
                <Stack gap={1}>
                  <Text size="small" weight="bold">
                    {t('"সিরিয়াল ধরে আপডেট" এর নিয়ম')}
                  </Text>
                  <Stack gap={0.5} role="list">
                    <Stack role="listitem">
                      <Text size="small">{t('শুধু সিরিয়াল কলাম আবশ্যক; যে কলাম ম্যাপ করবেন শুধু সেগুলোই বদলাবে।')}</Text>
                    </Stack>
                    <Stack role="listitem">
                      <Text size="small">{t('খালি ঘর = অপরিবর্তিত (আগের মান থাকে)।')}</Text>
                    </Stack>
                    <Stack role="listitem">
                      <Text size="small">
                        {canClear
                          ? t('কোনো মান মুছতে ঘরে লিখুন {token} — আবশ্যক ঘর (সাল, নাম, ঠিকানার স্তর, আবশ্যক ফিল্ড) মোছা যায় না।', { token: CLEAR_TOKEN })
                          : t('মান মুছে ফাঁকা করতে পারেন শুধু মূল এডমিন — {token} লিখলে সেই সারি বাদ যাবে।', { token: CLEAR_TOKEN })}
                      </Text>
                    </Stack>
                  </Stack>
                </Stack>
              </Card>
            </div>
          )}
        </Step>

        {/* ---------- ধাপ ২ ---------- */}
        {sheet && (
          <Step announced n={2} title={t('কলাম ম্যাপিং')} hint={t('হেডার দেখে অনুমান বসানো হয়েছে; ভুল হলে বদলান। একই ফিল্ড দুই কলামে বসবে না।')}>
            <Grid columns={{ xs: 1, sm: 2, lg: 3 }} gap={2}>
              {sheet.headers.map((h, i) => (
                <Stack key={i} gap={1}>
                  <div>
                    <Text size="small" weight="medium" truncate title={h}>
                      {h}
                    </Text>
                    <Text size="caption" tone="muted" truncate title={sheet.rows[0]?.[i]}>
                      {t('যেমন: {v}', { v: sheet.rows[0]?.[i] || '—' })}
                    </Text>
                  </div>
                  <SelectField
                    label={t('"{h}" কলামের ফিল্ড', { h })}
                    hideLabel
                    size="small"
                    value={mapping[i] ?? ''}
                    onChange={(v) => setMap(i, (v || null) as ImportFieldId | null)}
                    disabled={!!running}
                    options={[
                      { value: '', label: t('— উপেক্ষা —') },
                      ...fields.map((f) => ({
                        value: f.id,
                        label: `${f.private ? '🔒 ' : ''}${fieldLabel(f)}${!update && f.required ? ' *' : update && f.id === 'serial_no' ? ' *' : ''}`,
                      })),
                    ]}
                  />
                </Stack>
              ))}
            </Grid>
            {ignoredHeaders.length > 0 && (
              <Text size="caption" tone="muted">
                {t('এক্সপোর্টের তথ্য-কলাম উপেক্ষা করা হলো: {list}', { list: ignoredHeaders.join(', ') })}
              </Text>
            )}
            {missingRequired.length > 0 && <Alert tone="error">{t('আবশ্যক ফিল্ড ম্যাপ হয়নি: {fields}', { fields: missingRequired.map(fieldLabel).join(', ') })}</Alert>}
            {modeNeedsSerial && <Alert tone="error">{t('"সিরিয়াল ধরে আপডেট" মোডে সিরিয়াল কলাম ম্যাপ করা আবশ্যক।')}</Alert>}
            {!update && (
              <Text size="caption" tone="muted">
                {t('সিরিয়াল: {info}', { info: hasSerialCol ? t('ফাইলের সিরিয়াল কলাম ব্যবহার হবে (সংখ্যা, অনন্য, ফাঁকা নয়)') : t('ফাইলে সিরিয়াল কলাম নেই — সারির ক্রমে {n} থেকে দেওয়া হবে', { n: toBanglaNumber(nextSerial ?? 1) }) })}
              </Text>
            )}
            {!update && (
              <Checkbox
                checked={useFillDown}
                onChange={setUseFillDown}
                disabled={!!running}
                label={
                  <>
                    {t('খালি')} <strong>{t('সাল / বিভাগ / জেলা / উপজেলা')}</strong> {t('ঘরে উপরের সারির মান ধরুন (শীটে একবার লিখে নিচে খালি রাখলে)')}
                    {filled.filled > 0 && (
                      <>
                        {' '}
                        <Text size="caption" tone="muted" inline>
                          — {t('{n} টি ঘর ভরা হয়েছে', { n: formatBanglaNumber(filled.filled) })}
                        </Text>
                      </>
                    )}
                  </>
                }
              />
            )}
          </Step>
        )}

        {/* ---------- ধাপ ৩ ---------- */}
        {analysis && (
          <Step announced n={3} title={t('প্রিভিউ ও যাচাই')}>
            <Stack direction="row" wrap align="center" justify="between" gap={1}>
              <Stack direction="row" wrap align="center" gap={1}>
                <Badge tone="slate">{t('মোট {n}', { n: formatBanglaNumber(analysis.rows.length) })}</Badge>
                <Badge tone="green">{t('ঠিক আছে {n}', { n: formatBanglaNumber(analysis.validCount) })}</Badge>
                {analysis.errorCount > 0 && <Badge tone="red">{t('ভুল {n} (বাদ যাবে)', { n: formatBanglaNumber(analysis.errorCount) })}</Badge>}
                {analysis.warningCount > 0 && <Badge tone="amber">{t('সতর্কতা {n}', { n: formatBanglaNumber(analysis.warningCount) })}</Badge>}
              </Stack>
              <Checkbox label={t('শুধু ভুল/সতর্কতার সারি')} checked={onlyErrors} onChange={setOnlyErrors} />
            </Stack>

            {analysis.unresolvedGeo.length > 0 && <GeoFixPanel items={analysis.unresolvedGeo} rows={analysis.rows} fixes={geoFixes} unions={unions} onFix={(key, value) => setGeoFixes((f) => ({ ...f, [key]: value }))} />}
            {categoryMapped.length > 0 && (
              <CategoryReviewPanel
                fields={categoryMapped}
                sheetValues={sheetValues}
                existing={existing}
                fixes={categoryFixes}
                onChange={(key, from, to) =>
                  setCategoryFixes((all) => {
                    const cur = { ...(all[key] ?? {}) }
                    if (to) cur[from] = to
                    else delete cur[from]
                    return { ...all, [key]: cur }
                  })
                }
              />
            )}

            <DataTable label={t('প্রিভিউ ও যাচাই')} rows={previewRows} columns={previewColumns} getRowId={(r) => String(r.rowNo)} dense emptyTitle="—" />
            {previewRows.length >= PREVIEW_LIMIT && (
              <Text size="caption" tone="muted">
                {t('প্রথম {n} টি সারি দেখানো হচ্ছে।', { n: formatBanglaNumber(PREVIEW_LIMIT) })}
              </Text>
            )}
          </Step>
        )}

        {/* ---------- ধাপ ৪ ---------- */}
        {analysis && (
          <Step announced n={4} title={t('ইম্পোর্ট চালান')}>
            <Stack direction="row" wrap align="center" gap={1.5}>
              <Button disabled={!canRun} onClick={() => void run()}>
                {!update ? t('{n} টি সারি যোগ করুন', { n: formatBanglaNumber(analysis.validCount) }) : t('{n} টি সারি আপডেট করুন', { n: formatBanglaNumber(analysis.validCount) })}
              </Button>
              {analysis.errorCount > 0 && (
                <Text size="small" tone="error" inline>
                  {t('{n} টি ভুল সারি বাদ যাবে (ব্যর্থ তালিকায় থাকবে)', { n: formatBanglaNumber(analysis.errorCount) })}
                </Text>
              )}
            </Stack>
            {running && (
              <div>
                <Text size="small">
                  {t('চলছে… {done} / {total} (ব্যাচ {batch} করে)', { done: formatBanglaNumber(running.done), total: formatBanglaNumber(running.total), batch: toBanglaNumber(BATCH) })}
                </Text>
                <ProgressBar value={(running.done / Math.max(1, running.total)) * 100} label={t('ইম্পোর্ট অগ্রগতি')} />
              </div>
            )}
            {result && (
              <div role="status">
                <Card>
                  <Stack gap={1.5}>
                    <Text size="small" weight="bold">
                      {t('সারসংক্ষেপ')}
                    </Text>
                    <Stack gap={0.5} role="list">
                      <Stack role="listitem">
                        <Text size="small" tone="success">
                          {t('সফল: {n}', { n: formatBanglaNumber(result.ok) })}
                        </Text>
                      </Stack>
                      <Stack role="listitem">
                        <Text size="small" tone="error">
                          {t('ব্যর্থ/বাদ: {n}', { n: formatBanglaNumber(result.failed.length) })}
                        </Text>
                      </Stack>
                      {update && (
                        <Stack role="listitem">
                          <Text size="small" tone="warning">
                            {t('সিরিয়াল মিলেনি (আপডেট হয়নি): {n}', { n: formatBanglaNumber(result.missing.length) })}
                          </Text>
                        </Stack>
                      )}
                    </Stack>
                    {(result.failed.length > 0 || result.missing.length > 0) && (
                      <>
                        <div>
                          <Button variant="secondary" size="small" startIcon="download" onClick={downloadFailed}>
                            {t('ব্যর্থদের তালিকা CSV ডাউনলোড')}
                          </Button>
                        </div>
                        <Stack gap={0.5} role="list">
                          {result.failed.slice(0, 20).map((f, i) => (
                            <Stack key={i} role="listitem">
                              <Text size="caption" tone="muted">
                                {t('সারি {row}', { row: toBanglaNumber(f.rowNo) })} {f.serial ? t('(সিরিয়াল {s})', { s: toBanglaNumber(f.serial) }) : ''}: {f.reason}
                              </Text>
                            </Stack>
                          ))}
                          {result.missing.slice(0, 20).map((s) => (
                            <Stack key={`m${s}`} role="listitem">
                              <Text size="caption" tone="muted">
                                {t('সিরিয়াল {s}: রেকর্ড নেই', { s: toBanglaNumber(s) })}
                              </Text>
                            </Stack>
                          ))}
                        </Stack>
                      </>
                    )}
                    <Text size="caption" tone="muted">
                      {t('সিস্টেমে দেওয়া সিরিয়াল Google Sheet এ ফেরাতে রেকর্ড পেইজের "সিরিয়াল সহ এক্সপোর্ট" ব্যবহার করুন।')}
                    </Text>
                  </Stack>
                </Card>
              </div>
            )}
          </Step>
        )}
      </Stack>
    </Page>
  )
}

// ---------------------------------------------------------------- ছোট কম্পোনেন্ট
function Bad({ children }: { children: ReactNode }) {
  return <Badge tone="red">{children}</Badge>
}

function Cleared() {
  return <Badge tone="slate">{t('(মুছে যাবে)')}</Badge>
}

function GeoCell({ value, raw, corrected, soft = false }: { value: string | null; raw: string; corrected: boolean; soft?: boolean }) {
  if (!value) {
    return soft && !raw ? '—' : <Bad>{raw || '—'}</Bad>
  }
  return (
    <Text size="small" inline title={corrected ? t('ফাইলে: "{raw}"', { raw }) : undefined}>
      {gn(value)}
      {corrected && (
        <>
          {' '}
          <Text size="caption" tone="warning" inline>
            {t('(সংশোধিত)')}
          </Text>
        </>
      )}
    </Text>
  )
}
