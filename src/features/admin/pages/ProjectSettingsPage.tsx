import { lt, t } from '@/i18n'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { getHousingApi, getProjectsApi, HousingApiError, type Project, type ProjectPatch, type ProjectStats } from '@/backend'
import { ACCENTS, projectPath, refreshProjects } from '@/features/projects/registry'
import { formatBanglaNumber } from '@/lib/banglaNumber'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { isMainAdmin, useAdminUser } from '../adminUser'
import { deleteBlocker, friendlyProjectError, isStaleEdit, photoNameExample, prefixError, slugError } from '../projects/projectRules'
import { publishChecklist } from '../projects/publishChecklist'
import { DeleteProjectDialog } from '../projects/DeleteProjectDialog'
import { UnpublishDialog } from '../projects/UnpublishDialog'
import { CoverUpload } from '../projects/CoverUpload'
import { FieldsTab } from '../projects/tabs/FieldsTab'
import { StatsTab } from '../projects/tabs/StatsTab'
import { AdminNotFound } from '../ui/AdminNotFound'
import { Badge } from '../ui/Badge'
import { ActionBar, Alert, Breadcrumbs, Button, Card, Checkbox, Grid, LinkButton, LoadingState, Page, RadioGroup, SelectField, Stack, Tabs, Text, TextField, useToast } from '@/ui'
import { AccentSwatch } from '../ui/AccentSwatch'

type Tab = 'general' | 'fields' | 'stats' | 'photos' | 'display'

/** এই পাতায় বদলানো যায় এমন কলাম (ফিল্ড ও স্ট্যাট কার্ড M-ধাপ ৮-এ) */
const EDITABLE = [
  'name_bn', 'name_en', 'summary_bn', 'summary_en', 'description_bn', 'description_en', 'unit_bn', 'unit_en',
  'slug', 'parent_key', 'file_prefix', 'geo_depth', 'icon', 'accent', 'show_on_home',
  'photo_mode', 'prev_label_bn', 'prev_label_en', 'current_label_bn', 'current_label_en', 'display',
] as const satisfies readonly (keyof Project)[]
type Editable = Pick<Project, (typeof EDITABLE)[number]>

const pickEditable = (p: Project): Editable => Object.fromEntries(EDITABLE.map((k) => [k, p[k]])) as Editable

/** শুধু বদলানো কলাম পাঠানো (অন্য কেউ অন্য কলাম বদলালেও ঝামেলা কম; CONFLICT তো updated_at দিয়েই ধরা হয়) */
function diff(before: Editable, after: Editable): ProjectPatch {
  const out: Record<string, unknown> = {}
  for (const k of EDITABLE) if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) out[k] = after[k]
  return out as ProjectPatch
}

const len = (s: string, max: number) => (s.length > max ? t('সর্বোচ্চ {n} অক্ষর', { n: formatBanglaNumber(max) }) : null)

/**
 * /admin/projects/:key?tab=general|photos|display — প্রকল্পের সেটিংস (পরিকল্পনা M-ধাপ ৭)।
 * সংরক্ষণে updated_at মেলানো হয় (দুই এডমিন একসাথে বদলালে পরেরজন CONFLICT পান); ডাটাবেসের গার্ড (প্রকাশিত প্রকল্পের URL,
 * ছবি থাকা অবস্থায় ছবি-মোড বদল ইত্যাদি) এর বার্তা বাংলায় দেখায়। উপরে প্রকাশ/অপ্রকাশ ও প্রকাশের চেকলিস্ট।
 */
export function ProjectSettingsPage() {
  const { key = '' } = useParams()
  const [sp, setSp] = useSearchParams()
  const toast = useToast()
  const [all, setAll] = useState<Project[] | null>(null)
  const [stats, setStats] = useState<ProjectStats | null>(null)
  const [loadError, setLoadError] = useState<HousingApiError | null>(null)
  const [form, setForm] = useState<Editable | null>(null)
  const [busy, setBusy] = useState(false)
  const [conflict, setConflict] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [confirmUnpublish, setConfirmUnpublish] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const navigate = useNavigate()
  const mainAdmin = isMainAdmin(useAdminUser())

  const fetchAll = useCallback(async () => {
    const list = await getProjectsApi().list({ includeDrafts: true })
    const p = list.find((x) => x.key === key)
    const s = p ? await getHousingApi().stats(p.key).catch(() => null) : null
    return { list, p, s }
  }, [key])

  const apply = useCallback((r: { list: Project[]; p: Project | undefined; s: ProjectStats | null }) => {
    setAll(r.list)
    setStats(r.s)
    setForm(r.p ? pickEditable(r.p) : null)
    setConflict(false)
    setServerError(null)
  }, [])

  useEffect(() => {
    let alive = true
    fetchAll()
      .then((r) => alive && apply(r))
      .catch((err: unknown) => alive && setLoadError(HousingApiError.from(err)))
    return () => {
      alive = false
    }
  }, [fetchAll, apply])

  const reload = async () => apply(await fetchAll())

  const project = useMemo(() => all?.find((p) => p.key === key), [all, key])
  useDocumentTitle(project ? t('{name} — সেটিংস', { name: lt(project, 'name') }) : t('প্রকল্পের সেটিংস'))

  if (loadError) {
    return (
      <Page title={t('প্রকল্পের সেটিংস')} documentTitle={false}>
        <Alert tone="error">{loadError.message}</Alert>
      </Page>
    )
  }
  if (!all) {
    return <LoadingState label={t('লোড হচ্ছে…')} />
  }
  if (!project || !form) return <AdminNotFound />

  const allowed: readonly Tab[] = project.is_group ? ['general', 'stats'] : ['general', 'fields', 'stats', 'photos', 'display']
  const tab: Tab = allowed.find((x) => x === sp.get('tab')) ?? 'general'
  const set = <K extends keyof Editable>(k: K, v: Editable[K]) => setForm((f) => (f ? { ...f, [k]: v } : f))
  const patch = diff(pickEditable(project), form)
  const dirty = Object.keys(patch).length > 0
  const groups = all.filter((p) => p.is_group && p.key !== project.key)
  const records = stats?.total ?? 0
  const check = publishChecklist({ ...project, ...form }, all, stats)
  const blocker = deleteBlocker(project, all, records)

  const errors = {
    name_bn: !form.name_bn.trim() ? t('বাংলা নাম দিন') : len(form.name_bn, 120),
    name_en: !form.name_en.trim() ? t('ইংরেজি নাম দিন') : len(form.name_en, 120),
    summary_bn: len(form.summary_bn, 300),
    summary_en: len(form.summary_en, 300),
    description_bn: len(form.description_bn, 2000),
    description_en: len(form.description_en, 2000),
    unit_bn: len(form.unit_bn, 40),
    unit_en: len(form.unit_en, 40),
    slug: slugError(form.slug, all, project.key),
    file_prefix: project.is_group || form.file_prefix === null ? null : prefixError(form.file_prefix, all, project.key),
    prev_label_bn: len(form.prev_label_bn, 60),
    prev_label_en: len(form.prev_label_en, 60),
    current_label_bn: len(form.current_label_bn, 60),
    current_label_en: len(form.current_label_en, 60),
  }
  const hasErrors = Object.values(errors).some(Boolean)

  const save = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!dirty || hasErrors || busy) return
    setBusy(true)
    setServerError(null)
    try {
      await getProjectsApi().update(project.key, patch, { expectedUpdatedAt: project.updated_at })
      await refreshProjects({ includeDrafts: true })
      await reload()
      toast.success(t('সংরক্ষিত'))
    } catch (err) {
      if (isStaleEdit(err)) setConflict(true)
      else setServerError(friendlyProjectError(err))
    } finally {
      setBusy(false)
    }
  }

  const setPublished = async (value: boolean) => {
    setBusy(true)
    setServerError(null)
    try {
      await getProjectsApi().update(project.key, { is_published: value }, { expectedUpdatedAt: project.updated_at })
      await refreshProjects({ includeDrafts: true })
      await reload()
      setConfirmUnpublish(false)
      toast.success(value ? t('প্রকাশ করা হয়েছে') : t('অপ্রকাশ করা হয়েছে'))
    } catch (err) {
      if (isStaleEdit(err)) setConflict(true)
      else setServerError(friendlyProjectError(err))
      setConfirmUnpublish(false)
    } finally {
      setBusy(false)
    }
  }
  const askUnpublish = () => {
    const publishedChildren = all.some((c) => c.parent_key === project.key && c.is_published)
    if (records > 0 || publishedChildren) setConfirmUnpublish(true)
    else void setPublished(false)
  }

  const openDelete = () => {
    setDeleteError(null)
    setConfirmDelete(true)
  }
  /** মোছার পর তালিকায় ফেরা, এই পাতা নতুন করে আনার আগে — প্রকল্পটি তখন আর নেই, পাতাটি "পাওয়া যায়নি" দেখাত */
  const removeProject = async () => {
    setBusy(true)
    setDeleteError(null)
    try {
      await getProjectsApi().delete(project.key)
      await refreshProjects({ includeDrafts: true })
      toast.success(t('«{name}» মুছে ফেলা হয়েছে', { name: lt(project, 'name') }))
      navigate('/admin/projects')
    } catch (err) {
      setDeleteError(friendlyProjectError(err))
    } finally {
      setBusy(false)
    }
  }

  const TAB_LABELS: Record<Tab, string> = { general: t('সাধারণ'), fields: t('ফিল্ড'), stats: t('পরিসংখ্যান'), photos: t('ছবি'), display: t('প্রদর্শন') }
  const tabs = allowed.map((id) => ({ value: id, label: TAB_LABELS[id] }))
  /** ফিল্ড/পরিসংখ্যান ট্যাব নিজে সংরক্ষণ করে — তার পরে সাইটের রেজিস্ট্রি ও এই পাতা নতুন করে */
  const changed = async () => {
    await refreshProjects({ includeDrafts: true })
    await reload()
  }

  return (
    <Page
      title={lt(project, 'name')}
      documentTitle={false}
      breadcrumbs={<Breadcrumbs label={t('প্রকল্পসমূহ')} items={[{ label: t('প্রকল্পসমূহ'), to: '/admin/projects' }, { label: lt(project, 'name') }]} />}
      badges={
        <>
          {project.is_published ? <Badge tone="green">{t('প্রকাশিত')}</Badge> : <Badge tone="amber">{t('খসড়া')}</Badge>}
          {project.is_group && <Badge tone="blue">{t('গ্রুপ')}</Badge>}
        </>
      }
      description={`${projectPath(project, all)} · key ${project.key} · ${t('{n}টি রেকর্ড', { n: formatBanglaNumber(records) })}`}
      actions={
        <>
          {/* ---------- প্রকাশ ---------- */}
          <LinkButton to={projectPath(project, all)} variant="secondary">
            {project.is_published ? t('পাবলিক পেইজ') : t('প্রিভিউ')}
          </LinkButton>
          {project.is_published ? (
            <Button variant="secondary" disabled={busy || dirty} title={dirty ? t('আগে পরিবর্তন সংরক্ষণ করুন') : undefined} onClick={askUnpublish}>
              {t('অপ্রকাশ করুন')}
            </Button>
          ) : (
            <Button disabled={busy || dirty || check.blocking.length > 0} title={dirty ? t('আগে পরিবর্তন সংরক্ষণ করুন') : check.blocking.join(' · ') || undefined} onClick={() => void setPublished(true)}>
              {t('প্রকাশ করুন')}
            </Button>
          )}
        </>
      }
    >
      <Stack gap={3}>
        {!project.is_published && check.blocking.length > 0 && (
          <Alert tone="warning" title={t('প্রকাশের আগে যা লাগবে')}>
            <Stack role="list" gap={0.5}>
              {check.blocking.map((b) => (
                <Stack key={b} role="listitem">
                  <Text size="small">{b}</Text>
                </Stack>
              ))}
            </Stack>
          </Alert>
        )}
        {check.warnings.length > 0 && (
          <Alert tone="info" title={t('মনে রাখুন')}>
            <Stack role="list" gap={0.5}>
              {check.warnings.map((w) => (
                <Stack key={w} role="listitem">
                  <Text size="small">{w}</Text>
                </Stack>
              ))}
            </Stack>
          </Alert>
        )}

        {conflict && (
          <Alert
            tone="warning"
            action={
              <Button variant="secondary" onClick={() => void reload()}>
                {t('নতুন অবস্থা আনুন')}
              </Button>
            }
          >
            {t('অন্য কেউ এর মধ্যে প্রকল্পটি বদলেছেন। আপনার পরিবর্তন সংরক্ষিত হয়নি — নতুন অবস্থা এনে আবার করুন।')}
          </Alert>
        )}

        {/* ---------- ট্যাব ---------- */}
        <Tabs
          label={t('সেটিংসের অংশ')}
          value={tab}
          tabs={tabs}
          onChange={(id) => setSp((prev) => {
            const n = new URLSearchParams(prev)
            n.set('tab', id)
            return n
          }, { replace: true })}
        />

        {tab === 'fields' && <FieldsTab key={project.updated_at + project.fields.length} project={project} blocked={dirty} onChanged={changed} />}
        {tab === 'stats' && <StatsTab key={project.updated_at} project={project} stats={stats} blocked={dirty} onChanged={changed} />}
        {tab !== 'fields' && tab !== 'stats' && (
        <form onSubmit={(e) => void save(e)} noValidate>
          <Stack gap={3}>
            {tab === 'general' && (
              <>
                <Card>
                  <Grid columns={{ xs: 1, sm: 2 }} gap={2}>
                    <TextField label={t('বাংলা নাম')} required error={errors.name_bn ?? undefined} value={form.name_bn} onChange={(v) => set('name_bn', v)} maxLength={120} />
                    <TextField label={t('ইংরেজি নাম')} required error={errors.name_en ?? undefined} value={form.name_en} onChange={(v) => set('name_en', v)} maxLength={120} />
                    <TextField label={t('ছোট বর্ণনা (বাংলা)')} hint={t('হোমের কার্ডে')} error={errors.summary_bn ?? undefined} rows={2} value={form.summary_bn} onChange={(v) => set('summary_bn', v)} maxLength={300} />
                    <TextField label={t('ছোট বর্ণনা (ইংরেজি)')} hint={t('হোমের কার্ডে')} error={errors.summary_en ?? undefined} rows={2} value={form.summary_en} onChange={(v) => set('summary_en', v)} maxLength={300} />
                    <TextField label={t('পরিচিতি (বাংলা)')} hint={t('প্রকল্পের পেইজে, নামের নিচে')} error={errors.description_bn ?? undefined} rows={4} value={form.description_bn} onChange={(v) => set('description_bn', v)} maxLength={2000} />
                    <TextField label={t('পরিচিতি (ইংরেজি)')} hint={t('প্রকল্পের পেইজে, নামের নিচে')} error={errors.description_en ?? undefined} rows={4} value={form.description_en} onChange={(v) => set('description_en', v)} maxLength={2000} />
                    <TextField label={t('একক শব্দ (বাংলা)')} hint={t('যেমন "ঘর", "উপকারভোগী" — মানচিত্র ও পরিসংখ্যানে')} error={errors.unit_bn ?? undefined} value={form.unit_bn} onChange={(v) => set('unit_bn', v)} maxLength={40} />
                    <TextField label={t('একক শব্দ (ইংরেজি)')} hint={t('যেমন "ঘর", "উপকারভোগী" — মানচিত্র ও পরিসংখ্যানে')} error={errors.unit_en ?? undefined} value={form.unit_en} onChange={(v) => set('unit_en', v)} maxLength={40} />
                  </Grid>
                </Card>

                <Card>
                  <Stack gap={2}>
                    <TextField
                      label={t('URL অংশ (slug)')}
                      required
                      error={errors.slug ?? undefined}
                      hint={project.is_published ? t('প্রকাশিত প্রকল্পের URL বদলানো যায় না (শেয়ার করা লিংক ভাঙবে) — আগে অপ্রকাশ করতে হবে।') : t('পেইজের ঠিকানা: {url}', { url: projectPath({ ...project, slug: form.slug, parent_key: form.parent_key }, all) })}
                      mono
                      value={form.slug}
                      disabled={project.is_published}
                      onChange={(v) => set('slug', v.toLowerCase())}
                      maxLength={60}
                    />
                    {!project.is_group && (
                      <SelectField
                        label={t('অবস্থান')}
                        hint={project.is_published ? t('প্রকাশিত প্রকল্পের অবস্থান বদলানো যায় না।') : undefined}
                        value={form.parent_key ?? ''}
                        disabled={project.is_published}
                        onChange={(v) => set('parent_key', v || null)}
                        options={[
                          { value: '', label: t('একক প্রকল্প (কোনো গ্রুপে নয়)') },
                          ...groups.map((g) => ({ value: g.key, label: t('উপ-প্রকল্প: {name}', { name: lt(g, 'name') }) })),
                        ]}
                      />
                    )}
                    {!project.is_group && form.file_prefix !== null && (
                      <TextField
                        label={t('ছবির ফাইল-প্রিফিক্স')}
                        error={errors.file_prefix ?? undefined}
                        hint={t('উদাহরণ (সিরিয়াল ১২): {example}', { example: photoNameExample(form.file_prefix, form.photo_mode) })}
                        mono
                        value={form.file_prefix ?? ''}
                        onChange={(v) => set('file_prefix', v.toLowerCase())}
                        maxLength={16}
                      />
                    )}
                    {!project.is_group && (
                      <SelectField
                        label={t('ঠিকানা কোন স্তর পর্যন্ত')}
                        value={form.geo_depth}
                        onChange={(v) => set('geo_depth', v as Project['geo_depth'])}
                        options={[
                          { value: 'upazila', label: t('উপজেলা পর্যন্ত') },
                          { value: 'union', label: t('ইউনিয়ন পর্যন্ত (ইউনিয়ন আবশ্যক নয়)') },
                        ]}
                      />
                    )}
                    <Checkbox label={t('হোম পেইজে কার্ড দেখান')} checked={form.show_on_home} onChange={(checked) => set('show_on_home', checked)} />
                  </Stack>
                </Card>

                <Card>
                  <RadioGroup
                    label={t('রং')}
                    direction="row"
                    look="cards"
                    value={form.accent}
                    onChange={(k) => set('accent', k)}
                    options={(Object.keys(ACCENTS) as (keyof typeof ACCENTS)[]).map((k) => ({
                      value: k,
                      label: <AccentSwatch accent={k} />,
                    }))}
                  />
                </Card>

                <CoverUpload project={project} blocked={dirty} onChanged={changed} />

                {mainAdmin && (
                  <Card tone="danger" title={t('বিপজ্জনক অংশ')} description={t('শুধু খালি, অপ্রকাশিত প্রকল্প মোছা যায়। মুছলে আর ফেরানো যায় না।')}>
                    <Stack direction="row" gap={1.5} align="center" wrap>
                      <Button variant="danger" disabled={busy || dirty || blocker !== null} title={dirty ? t('আগে পরিবর্তন সংরক্ষণ করুন') : (blocker ?? undefined)} onClick={openDelete}>
                        {t('প্রকল্প মুছুন')}
                      </Button>
                      {/* A disabled button takes no focus and its title is never read out, so the reason is visible text next to it. */}
                      {dirty ? (
                        <Text size="small" tone="warning">
                          {t('আগে পরিবর্তন সংরক্ষণ করুন')}
                        </Text>
                      ) : (
                        blocker && (
                          <Text size="small" tone="error">
                            {blocker}
                          </Text>
                        )
                      )}
                    </Stack>
                  </Card>
                )}
              </>
            )}

            {tab === 'photos' && (
              <Card>
                <Stack gap={2}>
                  <SelectField
                    label={t('ছবি মোড')}
                    hint={t('ছবিসহ রেকর্ড থাকলে "শুধু পরের ছবি" বা "ছবি নেই" করা যায় না — ডাটাবেস সংখ্যাসহ জানাবে।')}
                    value={form.photo_mode}
                    onChange={(v) => set('photo_mode', v as Project['photo_mode'])}
                    options={[
                      { value: 'before_after', label: t('আগে-পরে (দুটি ছবি, তুলনাসহ)') },
                      { value: 'after_only', label: t('শুধু পরের ছবি (একটি)') },
                      { value: 'none', label: t('ছবি নেই') },
                    ]}
                  />
                  {form.photo_mode === 'before_after' && (
                    <Grid columns={{ xs: 1, sm: 2 }} gap={2}>
                      <TextField label={t('পূর্বের ছবির লেবেল (বাংলা)')} error={errors.prev_label_bn ?? undefined} value={form.prev_label_bn} onChange={(v) => set('prev_label_bn', v)} maxLength={60} placeholder={t('যেমন পূর্বের ঘর')} />
                      <TextField label={t('পূর্বের ছবির লেবেল (ইংরেজি)')} error={errors.prev_label_en ?? undefined} value={form.prev_label_en} onChange={(v) => set('prev_label_en', v)} maxLength={60} placeholder="Before" />
                    </Grid>
                  )}
                  {form.photo_mode !== 'none' && (
                    <Grid columns={{ xs: 1, sm: 2 }} gap={2}>
                      <TextField label={t('বর্তমান ছবির লেবেল (বাংলা)')} error={errors.current_label_bn ?? undefined} value={form.current_label_bn} onChange={(v) => set('current_label_bn', v)} maxLength={60} placeholder={t('যেমন উপকরণসহ ছবি')} />
                      <TextField label={t('বর্তমান ছবির লেবেল (ইংরেজি)')} error={errors.current_label_en ?? undefined} value={form.current_label_en} onChange={(v) => set('current_label_en', v)} maxLength={60} placeholder="Photo with the item" />
                    </Grid>
                  )}
                </Stack>
              </Card>
            )}

            {tab === 'display' && (
              <Card>
                <Stack gap={2}>
                  <Checkbox label={t('তালিকা পেইজে মানচিত্র দেখান')} checked={form.display.show_map !== false} onChange={(checked) => set('display', { ...form.display, show_map: checked })} />
                  <SelectField
                    label={t('টেবিলে ঠিকানার কলাম')}
                    value={form.display.geo_columns ?? 'split'}
                    onChange={(v) => set('display', { ...form.display, geo_columns: v as 'split' | 'merged' })}
                    options={[
                      { value: 'split', label: t('আলাদা (বিভাগ, জেলা, উপজেলা আলাদা কলামে)') },
                      { value: 'merged', label: t('একসাথে (এক কলামে)') },
                    ]}
                  />
                </Stack>
              </Card>
            )}

            {serverError && <Alert tone="error">{serverError}</Alert>}
            <ActionBar label={t('সংরক্ষণ')}>
              <Button type="submit" disabled={busy || !dirty || hasErrors}>
                {busy ? t('সংরক্ষণ হচ্ছে…') : t('সংরক্ষণ করুন')}
              </Button>
              <Button variant="secondary" disabled={busy || !dirty} onClick={() => setForm(pickEditable(project))}>
                {t('পরিবর্তন বাতিল')}
              </Button>
              {dirty && (
                <Text size="small" tone="warning" inline>
                  {t('সংরক্ষণ হয়নি এমন পরিবর্তন আছে')}
                </Text>
              )}
            </ActionBar>
          </Stack>
        </form>
        )}
      </Stack>

      {confirmUnpublish && (
        <UnpublishDialog project={project} projects={all} records={records} busy={busy} onCancel={() => setConfirmUnpublish(false)} onConfirm={() => void setPublished(false)} />
      )}
      {confirmDelete && (
        <DeleteProjectDialog project={project} busy={busy} error={deleteError} onCancel={() => setConfirmDelete(false)} onConfirm={() => void removeProject()} />
      )}
    </Page>
  )
}
