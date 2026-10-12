import { gn, lt, t } from '@/i18n'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { formatBanglaNumber, toBanglaNumber } from '@/lib/banglaNumber'
import { getHousingApi, HousingApiError, type HousingRecord, type PhotoKind, type Project, type ProjectKey } from '@/backend'
import { SafeImage } from '@/features/housing/components/SafeImage'
import { createUploadItems, revokeUploadItems, type UploadItem } from '@/features/housing/utils/uploadItems'
import { formatBytes, processImage } from '@/features/housing/utils/imageProcessing'
import { photoSrc } from '@/features/housing/utils/imagePath'
import { buildProjectAliases, parsePhotoFilename, photoNameExamples, photoTarget, type PhotoTarget } from '@/features/housing/utils/photoFilename'
import { useRecordProjects } from '@/features/housing/utils/housingProjects'
import { NoProjectsNotice } from '../ui/NoProjectsNotice'
import { photoSlotLabel } from '../records/recordColumns'
import { isMainAdmin, useAdminUser } from '../adminUser'
import { Badge } from '../ui/Badge'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { ErrorNotice } from '../ui/ErrorNotice'
import { ImageUploader, StatusPill } from '../ui/ImageUploader'
import { Button, Card, DataTable, EmptyState, IconButton, Page, ProgressBar, SelectField, Stack, Text, type DataTableColumn } from '@/ui'

const UPLOAD_CONCURRENCY = 2

type BadReason = Extract<PhotoTarget, { ok: false }>['reason']
type Match =
  | { kind: 'ok'; project_type: ProjectKey; serial_no: number; photoKind: PhotoKind; record: HousingRecord }
  | { kind: 'unparsed' }
  | { kind: 'bad_kind'; project_type: ProjectKey; serial_no: number; reason: BadReason }
  | { kind: 'no_record'; project_type: ProjectKey; serial_no: number; photoKind: PhotoKind }
  | { kind: 'duplicate'; project_type: ProjectKey; serial_no: number; photoKind: PhotoKind }
  /** ছবি আগে থেকেই আছে, আর ইউজার মূল এডমিন নন — ওভাররাইট "মোছার সমান" (পর্ব চ, প্রশ্ন ২৪), তাই বাদ */
  | { kind: 'locked'; project_type: ProjectKey; serial_no: number; photoKind: PhotoKind; record: HousingRecord }

interface Row {
  item: UploadItem
  match: Match
}

type Parsed =
  | { item: UploadItem; ok: true; project_type: ProjectKey; serial_no: number; photoKind: PhotoKind }
  | { item: UploadItem; ok: false; bad?: { project_type: ProjectKey; serial_no: number; reason: BadReason } }

interface Lookup {
  key: string
  records: Map<string, HousingRecord>
  error: HousingApiError | null
}

const BAD_MESSAGE: Record<BadReason, string> = {
  prev_not_allowed: 'এই প্রকল্পে শুধু পরের ছবি — "_prev" ফাইল চলবে না',
  kind_missing: 'আগে না পরে লেখা নেই — নামের শেষে _prev বা _current দিন',
  no_photos: 'এই প্রকল্পে ছবি নেই',
}

/**
 * /admin/photos?project=<key> — ছবি বাল্ক আপডেট (M-ধাপ ১২: যেকোনো প্রকল্পের)।
 * ফাইলনাম (প্রিফিক্স রেজিস্ট্রি থেকে: file_prefix/key/slug) → প্রকল্প/সিরিয়াল/ধরন (ছবি মোড অনুযায়ী) → রেকর্ড মিলিয়ে প্রিভিউ →
 * ওভাররাইট থাকলে নিশ্চিতকরণ → ব্যাচে (২টি একসাথে) কম্প্রেস + আপলোড → রিপোর্ট; লগ প্রতিটি প্রকল্পের জন্য আলাদা।
 * RequireAdmin এর ভেতরে (লগইন ছাড়া পৌঁছানো যায় না); লেখার অনুমতি তবু ব্যাকএন্ডে যাচাই হয়।
 */
export function PhotoBulkPage() {
  useDocumentTitle(t('ছবি বাল্ক আপডেট'))
  const all = useRecordProjects()
  const withPhotos = useMemo(() => all.filter((p) => p.photo_mode !== 'none'), [all])
  const byKey = useMemo(() => new Map(all.map((p) => [p.key, p])), [all])
  const [searchParams] = useSearchParams()
  const asked = searchParams.get('project')
  const [chosen, setChosen] = useState<ProjectKey | null>(null)
  // URL এর প্রকল্প (খসড়া হলে এডমিনের রেজিস্ট্রিতে একটু পরে আসে) — এলে সেটিই; ব্যবহারকারী বাছলে সেটি
  const defaultProject = chosen ?? (withPhotos.some((p) => p.key === asked) ? asked : null) ?? withPhotos[0]?.key ?? 'semi_pucca'
  const current = byKey.get(defaultProject)
  const [items, setItems] = useState<UploadItem[]>([])
  const [lookup, setLookup] = useState<Lookup | null>(null)
  const [phase, setPhase] = useState<'select' | 'uploading' | 'done'>('select')
  const [confirmOverwrite, setConfirmOverwrite] = useState(false)
  const mainAdmin = isMainAdmin(useAdminUser())

  // object URL মুক্ত করা শুধু আনমাউন্টে (items বদলালে নয় — তাহলে প্রিভিউ ভেঙে যেত)
  const itemsRef = useRef<UploadItem[]>([])
  useEffect(() => {
    itemsRef.current = items
  }, [items])
  useEffect(() => () => revokeUploadItems(itemsRef.current), [])

  const addFiles = useCallback((files: File[]) => {
    setItems((prev) => {
      const existing = new Set(prev.map((p) => `${p.file.name}|${p.file.size}`))
      const fresh = createUploadItems(files.filter((f) => !existing.has(`${f.name}|${f.size}`)))
      return [...prev, ...fresh]
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const gone = prev.find((p) => p.id === id)
      if (gone) revokeUploadItems([gone])
      return prev.filter((p) => p.id !== id)
    })
  }, [])

  const clearAll = () => {
    revokeUploadItems(items)
    setItems([])
    setLookup(null)
    setPhase('select')
  }

  // ---- ফাইলনাম পার্স + রেকর্ড খোঁজা ----
  // প্রিফিক্স প্রকল্প-রেজিস্ট্রির সব প্রকল্প থেকে (file_prefix, key, slug)
  const aliases = useMemo(() => buildProjectAliases(all), [all])
  const parsed = useMemo<Parsed[]>(
    () =>
      items.map((item) => {
        const p = parsePhotoFilename(item.file.name, aliases)
        if (!p) return { item, ok: false }
        const project_type = p.project_type ?? defaultProject
        const target = photoTarget(p.kind, byKey.get(project_type)?.photo_mode ?? 'before_after')
        return target.ok
          ? { item, ok: true, project_type, serial_no: p.serial_no, photoKind: target.kind }
          : { item, ok: false, bad: { project_type, serial_no: p.serial_no, reason: target.reason } }
      }),
    [items, defaultProject, aliases, byKey],
  )

  const lookupKey = useMemo(() => {
    const keys = parsed.filter((p) => p.ok).map((p) => `${p.project_type}:${p.serial_no}`)
    return [...new Set(keys)].sort().join(',')
  }, [parsed])

  useEffect(() => {
    if (!lookupKey) return
    let alive = true
    const byProject = new Map<ProjectKey, number[]>()
    for (const k of lookupKey.split(',')) {
      const [pt, s] = k.split(':')
      const list = byProject.get(pt) ?? []
      list.push(Number(s))
      byProject.set(pt, list)
    }
    ;(async () => {
      const records = new Map<string, HousingRecord>()
      try {
        const api = getHousingApi()
        for (const [pt, serials] of byProject) {
          const recs = await api.getBySerials(pt, serials)
          for (const r of recs) records.set(`${r.project_type}:${r.serial_no}`, r)
        }
        if (alive) setLookup({ key: lookupKey, records, error: null })
      } catch (err) {
        if (alive) setLookup({ key: lookupKey, records, error: HousingApiError.from(err) })
      }
    })()
    return () => {
      alive = false
    }
  }, [lookupKey])

  // উত্তর কোন key এর তা রাখা হয়; key মিললে তবেই ব্যবহার (নইলে "মিলানো হচ্ছে")
  const lookupBusy = !!lookupKey && lookup?.key !== lookupKey
  const records = lookup?.key === lookupKey ? lookup.records : null
  const lookupError = lookup?.key === lookupKey ? lookup.error : null

  const rows: Row[] = useMemo(() => {
    const seen = new Set<string>()
    return parsed.map((p) => {
      if (!p.ok) return { item: p.item, match: p.bad ? { kind: 'bad_kind', ...p.bad } : { kind: 'unparsed' } }
      const target = `${p.project_type}:${p.serial_no}:${p.photoKind}`
      const base = { project_type: p.project_type, serial_no: p.serial_no, photoKind: p.photoKind }
      if (seen.has(target)) return { item: p.item, match: { kind: 'duplicate', ...base } }
      seen.add(target)
      const record = records?.get(`${p.project_type}:${p.serial_no}`)
      if (!record) return { item: p.item, match: { kind: 'no_record', ...base } }
      if (!mainAdmin && record[`${p.photoKind}_photo_url`]) return { item: p.item, match: { kind: 'locked', ...base, record } }
      return { item: p.item, match: { kind: 'ok', ...base, record } }
    })
  }, [parsed, records, mainAdmin])

  const counts = useMemo(() => {
    const c = { ok: 0, overwrite: 0, unparsed: 0, bad_kind: 0, no_record: 0, duplicate: 0, locked: 0 }
    for (const r of rows) {
      if (r.match.kind === 'ok') {
        c.ok++
        if (r.match.record[`${r.match.photoKind}_photo_url`]) c.overwrite++
      } else c[r.match.kind]++
    }
    return c
  }, [rows])

  const patch = (id: string, changes: Partial<UploadItem>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...changes } : it)))

  // ---- আপলোড ----
  const startUpload = async () => {
    setConfirmOverwrite(false)
    setPhase('uploading')
    const api = getHousingApi()
    const queue = rows.filter((r) => r.match.kind === 'ok')
    for (const r of rows) {
      if (r.match.kind !== 'ok') {
        patch(r.item.id, {
          status: 'skipped',
          message:
            r.match.kind === 'unparsed'
              ? t('ফাইলনাম বোঝা যায়নি')
              : r.match.kind === 'bad_kind'
                ? t(BAD_MESSAGE[r.match.reason])
                : r.match.kind === 'no_record'
                  ? t('এই সিরিয়ালের রেকর্ড নেই')
                  : r.match.kind === 'locked'
                    ? t('ছবি আগে থেকেই আছে — বদলাতে পারেন শুধু মূল এডমিন')
                    : t('একই সিরিয়াল/ধরনের আরেকটি ফাইল আগে আছে'),
        })
      }
    }
    let next = 0
    const failedIds = new Set<string>()
    const worker = async () => {
      while (next < queue.length) {
        const r = queue[next++]
        if (r.match.kind !== 'ok') continue
        try {
          patch(r.item.id, { status: 'processing', message: undefined })
          const processed = await processImage(r.item.file)
          patch(r.item.id, { status: 'uploading', progress: 30, message: `${formatBytes(processed.photo.size)} WebP` })
          await api.uploadPhoto(r.match.record.id, r.match.photoKind, { photo: processed.photo, thumb: processed.thumb })
          patch(r.item.id, { status: 'done', progress: 100, message: `${formatBytes(processed.photo.size)} · ${toBanglaNumber(processed.width)}×${toBanglaNumber(processed.height)}` })
        } catch (err) {
          const e = HousingApiError.from(err)
          failedIds.add(r.item.id)
          patch(r.item.id, { status: 'error', message: e.message })
        }
      }
    }
    await Promise.all(Array.from({ length: UPLOAD_CONCURRENCY }, worker))
    setPhase('done')
    // লগ: প্রতিটি প্রকল্পের জন্য আলাদা (একই ব্যাচে কয়েকটি প্রকল্পের ফাইল থাকতে পারে)
    const perProject = new Map<ProjectKey, { rows: number; done: number; failed: number; overwrite: number }>()
    for (const r of queue) {
      if (r.match.kind !== 'ok') continue
      const s = perProject.get(r.match.project_type) ?? { rows: 0, done: 0, failed: 0, overwrite: 0 }
      s.rows++
      if (failedIds.has(r.item.id)) s.failed++
      else s.done++
      if (r.match.record[`${r.match.photoKind}_photo_url`]) s.overwrite++
      perProject.set(r.match.project_type, s)
    }
    const skipped = rows.length - queue.length
    let first = true
    for (const [pt, s] of perProject) {
      void api.logActivity('photo_bulk_run', { ...s, ...(first && skipped ? { skipped } : {}) }, pt)
      first = false
    }
    if (perProject.size === 0) void api.logActivity('photo_bulk_run', { rows: 0, done: 0, failed: 0, skipped }, defaultProject)
  }
  const askUpload = () => (counts.overwrite > 0 ? setConfirmOverwrite(true) : void startUpload())

  const doneCount = items.filter((i) => i.status === 'done').length
  const errorCount = items.filter((i) => i.status === 'error').length
  const skippedCount = items.filter((i) => i.status === 'skipped').length
  const finished = doneCount + errorCount + skippedCount
  const canUpload = phase === 'select' && counts.ok > 0 && !lookupBusy && !lookupError
  const slot = (p: Project | undefined, k: PhotoKind) => (p ? photoSlotLabel(p, k) : k)
  const examples = current ? photoNameExamples(current) : []

  const columns: DataTableColumn<Row>[] = [
    {
      id: 'preview',
      header: t('নতুন ছবি'),
      cell: ({ item }) => <img src={item.previewUrl} alt="" width={56} height={56} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }} />,
    },
    {
      id: 'file',
      header: t('ফাইল'),
      cell: ({ item }) => (
        <>
          <Text size="small" weight="medium" truncate title={item.file.name}>
            {item.file.name}
          </Text>
          <Text size="caption" tone="muted">
            {formatBytes(item.file.size)}
          </Text>
        </>
      ),
    },
    {
      id: 'target',
      header: t('প্রকল্প / সিরিয়াল / ধরন'),
      cell: ({ match }) =>
        match.kind === 'unparsed' ? (
          <Text size="small" tone="error" inline>
            {t('ফাইলনাম বোঝা যায়নি')}
          </Text>
        ) : (
          <>
            <Text size="small">{lt(byKey.get(match.project_type), 'name') || match.project_type}</Text>
            <Text size="small" tone="muted">
              {t('সিরিয়াল')} {toBanglaNumber(match.serial_no)}
              {match.kind !== 'bad_kind' && <> · {slot(byKey.get(match.project_type), match.photoKind)}</>}
            </Text>
          </>
        ),
    },
    {
      id: 'record',
      header: t('উপকারভোগী'),
      cell: ({ match }) =>
        match.kind === 'ok' || match.kind === 'locked' ? (
          <>
            <Text size="small" weight="medium">
              {match.record.name}
            </Text>
            <Text size="caption" tone="muted">
              {gn(match.record.upazila)}, {gn(match.record.district)}
            </Text>
            {match.kind === 'locked' && (
              <div role="alert">
                <Text size="caption" weight="medium" tone="error">
                  {t('ছবি আগে থেকেই আছে — বদলাতে পারেন শুধু মূল এডমিন')}
                </Text>
              </div>
            )}
          </>
        ) : match.kind === 'bad_kind' ? (
          <span role="alert">
            <Text size="small" weight="medium" tone="error" inline>
              {t(BAD_MESSAGE[match.reason])}
            </Text>
          </span>
        ) : match.kind === 'no_record' ? (
          <Text size="small" tone="error" inline>
            {t('এই সিরিয়ালের রেকর্ড নেই')}
          </Text>
        ) : match.kind === 'duplicate' ? (
          <Text size="small" tone="muted" inline>
            {t('একই লক্ষ্যের আরেকটি ফাইল আগে আছে — বাদ')}
          </Text>
        ) : (
          '—'
        ),
    },
    {
      id: 'old',
      header: t('আগের ছবি'),
      cell: ({ match }) =>
        (match.kind === 'ok' || match.kind === 'locked') && match.record[`${match.photoKind}_photo_url`] ? (
          <Stack direction="row" align="center" gap={1}>
            <SafeImage
              src={photoSrc(match.record[`${match.photoKind}_thumb_url`], match.record.photo_updated_at)}
              alt={t('আগের ছবি')}
              className="h-14 w-14 rounded-md object-cover"
              placeholderClassName="h-14 w-14 rounded-md"
            />
            {match.kind === 'locked' ? <Badge tone="red">{t('বদলানো যাবে না')}</Badge> : <Badge tone="amber">{t('ওভাররাইট হবে')}</Badge>}
          </Stack>
        ) : match.kind === 'ok' ? (
          <Text size="caption" tone="muted" inline>
            {t('নেই (নতুন)')}
          </Text>
        ) : (
          '—'
        ),
    },
    {
      id: 'status',
      header: t('অবস্থা'),
      cell: ({ item, match }) => (
        <>
          <Stack direction="row" align="center" gap={1}>
            <StatusPill status={match.kind === 'ok' || item.status !== 'pending' ? item.status : 'skipped'} />
            {phase === 'select' && <IconButton icon="close" label={t('তালিকা থেকে বাদ দিন')} onClick={() => removeItem(item.id)} />}
          </Stack>
          {(item.status === 'processing' || item.status === 'uploading') && <ProgressBar value={item.status === 'processing' ? undefined : item.progress} />}
          {item.message && (
            <Text size="caption" tone="muted">
              {item.message}
            </Text>
          )}
        </>
      ),
    },
  ]

  if (withPhotos.length === 0)
    return (
      <Page title={t('ছবি বাল্ক আপডেট')} documentTitle={false}>
        {all.length === 0 ? (
          <NoProjectsNotice />
        ) : (
          <Card>
            <EmptyState title={t('আপনার প্রকল্পগুলোতে ছবি রাখা হয় না')} description={t('প্রকল্পের সেটিংসে ছবির মোড চালু থাকলে এখানে ছবি আপলোড করা যাবে।')} />
          </Card>
        )}
      </Page>
    )

  return (
    <Page
      title={t('ছবি বাল্ক আপডেট')}
      documentTitle={false}
    >
      <Stack gap={3}>
        <Text size="small" tone="muted">
          {t('ফাইলনাম:')}{' '}
          {examples.map((x) => (
            <span key={x}>
              <Text mono inline>
                {x}
              </Text>
              ,{' '}
            </span>
          ))}
          {t('বা')}{' '}
          <Text mono inline>
            {current?.photo_mode === 'after_only' ? '0001.jpg' : '0001_current.jpg'}
          </Text>{' '}
          ({t('প্রকল্প নিচে বাছুন')})
        </Text>

        <SelectField
          label={t('প্রকল্প (ফাইলনামে প্রিফিক্স না থাকলে)')}
          value={defaultProject}
          disabled={phase !== 'select'}
          onChange={(v) => setChosen(v)}
          hint={current?.photo_mode === 'after_only' ? t('এই প্রকল্পে শুধু পরের ছবি ("{label}") — নামে আগে/পরে লাগে না।', { label: slot(current, 'current') }) : undefined}
          options={withPhotos.map((p) => ({ value: p.key, label: p.is_published ? lt(p, 'name') : t('{name} (খসড়া)', { name: lt(p, 'name') }) }))}
        />
        <ImageUploader items={items} onAdd={addFiles} showList={false} disabled={phase !== 'select'} />

        {lookupError && <ErrorNotice title={t('রেকর্ড মিলানো যায়নি')} error={lookupError} />}

        {items.length > 0 && (
          <>
            <Stack direction="row" wrap align="center" gap={1}>
              <Badge tone="green">{t('মিলেছে {n}', { n: toBanglaNumber(counts.ok) })}</Badge>
              {counts.overwrite > 0 && <Badge tone="amber">{t('ওভাররাইট হবে {n}', { n: toBanglaNumber(counts.overwrite) })}</Badge>}
              {counts.locked > 0 && <Badge tone="red">{t('ছবি আছে, বদলানো যাবে না {n}', { n: toBanglaNumber(counts.locked) })}</Badge>}
              {counts.bad_kind > 0 && <Badge tone="red">{t('ভুল ছবির ঘর {n}', { n: toBanglaNumber(counts.bad_kind) })}</Badge>}
              {counts.no_record > 0 && <Badge tone="red">{t('রেকর্ড নেই {n}', { n: toBanglaNumber(counts.no_record) })}</Badge>}
              {counts.unparsed > 0 && <Badge tone="slate">{t('ফাইলনাম বোঝা যায়নি {n}', { n: toBanglaNumber(counts.unparsed) })}</Badge>}
              {counts.duplicate > 0 && <Badge tone="slate">{t('ডুপ্লিকেট {n}', { n: toBanglaNumber(counts.duplicate) })}</Badge>}
              {lookupBusy && (
                <Text size="small" tone="muted" inline>
                  {t('রেকর্ড মিলানো হচ্ছে…')}
                </Text>
              )}
            </Stack>

            <DataTable label={t('ছবি বাল্ক আপডেট')} rows={rows} columns={columns} getRowId={(r) => r.item.id} />

            {phase !== 'select' && (
              <Card>
                <Stack gap={1}>
                  <Stack direction="row" align="center" justify="between" gap={2}>
                    <Text size="small" weight="medium" inline>
                      {phase === 'uploading' ? t('আপলোড চলছে…') : t('শেষ')}
                    </Text>
                    <Text size="small" tone="muted" inline>
                      {toBanglaNumber(finished)} / {toBanglaNumber(items.length)}
                    </Text>
                  </Stack>
                  <ProgressBar value={items.length ? (finished / items.length) * 100 : 0} label={t('মোট অগ্রগতি')} />
                  {phase === 'done' && (
                    <div role="status">
                      <Text size="small">
                        <Text size="small" weight="medium" tone="success" inline>
                          {t('সফল {n}', { n: formatBanglaNumber(doneCount) })}
                        </Text>{' '}
                        ·{' '}
                        <Text size="small" weight="medium" tone="error" inline>
                          {t('ব্যর্থ {n}', { n: formatBanglaNumber(errorCount) })}
                        </Text>{' '}
                        ·{' '}
                        <Text size="small" tone="muted" inline>
                          {t('বাদ {n}', { n: formatBanglaNumber(skippedCount) })}
                        </Text>
                      </Text>
                    </div>
                  )}
                </Stack>
              </Card>
            )}

            <Stack direction="row" wrap gap={1.5}>
              {phase === 'select' && (
                <Button disabled={!canUpload} onClick={askUpload}>
                  {counts.overwrite > 0
                    ? t('নিশ্চিত: {ok}টি আপলোড ({ow}টি ওভাররাইট)', { ok: toBanglaNumber(counts.ok), ow: toBanglaNumber(counts.overwrite) })
                    : t('{n}টি ছবি আপলোড করুন', { n: toBanglaNumber(counts.ok) })}
                </Button>
              )}
              <Button variant="secondary" disabled={phase === 'uploading'} onClick={clearAll}>
                {phase === 'done' ? t('নতুন ব্যাচ') : t('সব বাদ দিন')}
              </Button>
            </Stack>
          </>
        )}
      </Stack>

      <ConfirmDialog
        open={confirmOverwrite}
        title={t('{n}টি ছবি ওভাররাইট হবে', { n: toBanglaNumber(counts.overwrite) })}
        tone="danger"
        confirmLabel={t('হ্যাঁ, ওভাররাইট করে আপলোড করুন')}
        onConfirm={() => void startUpload()}
        onCancel={() => setConfirmOverwrite(false)}
      >
        <Stack gap={1}>
          <Text>{t('এই রেকর্ডগুলোতে আগে থেকেই ছবি আছে; নতুন ছবি একই সিরিয়াল-পাথে বসবে, আগেরটি আর ফেরানো যাবে না।')}</Text>
          <Stack gap={0.5} role="list">
            {rows
              .filter((r) => r.match.kind === 'ok' && r.match.record[`${r.match.photoKind}_photo_url`])
              .slice(0, 10)
              .map((r) =>
                r.match.kind === 'ok' ? (
                  <Stack key={r.item.id} role="listitem">
                    <Text size="small">
                      {lt(byKey.get(r.match.project_type), 'name')} · {t('সিরিয়াল')} {toBanglaNumber(r.match.serial_no)} · {slot(byKey.get(r.match.project_type), r.match.photoKind)} ({r.item.file.name})
                    </Text>
                  </Stack>
                ) : null,
              )}
          </Stack>
        </Stack>
      </ConfirmDialog>
    </Page>
  )
}
