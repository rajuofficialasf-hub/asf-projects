import { lt, t } from '@/i18n'
import { useCallback, useEffect, useState } from 'react'
import { getProjectsApi, HousingApiError, type Project, type ProjectOverview } from '@/backend'
import { projectPath, refreshProjects } from '@/features/projects/registry'
import { formatBanglaNumber } from '@/lib/banglaNumber'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { friendlyProjectError, isStaleEdit } from '../projects/projectRules'
import { publishChecklist } from '../projects/publishChecklist'
import { UnpublishDialog } from '../projects/UnpublishDialog'
import { Button, Card, Checkbox, LinkButton, LoadingState, Page, Stack, Text, TextLink, useToast, IconButton } from '@/ui'
import { Badge } from '../ui/Badge'
import { ErrorNotice } from '../ui/ErrorNotice'

type Data = { projects: Project[]; totals: Record<string, number> }

/** খসড়াসহ সব প্রকল্প + প্রতিটির রেকর্ড-সংখ্যা (ওভারভিউ থেকে; না পেলে ০) */
async function fetchData(): Promise<Data> {
  const api = getProjectsApi()
  const [projects, overview] = await Promise.all([api.list({ includeDrafts: true }), api.overview({ includeDrafts: true }).catch(() => null as ProjectOverview | null)])
  return { projects, totals: Object.fromEntries((overview?.projects ?? []).map((x) => [x.key, x.stats.total])) }
}

/** শীর্ষ-স্তর, তারপর প্রতিটির উপ-প্রকল্প — তালিকা ও ক্রম বদলের একই ক্রম */
function displayOrder(projects: Project[]): Project[] {
  const byOrder = (a: Project, b: Project) => a.sort_order - b.sort_order || a.key.localeCompare(b.key)
  const top = projects.filter((p) => !p.parent_key || !projects.some((x) => x.key === p.parent_key)).sort(byOrder)
  return top.flatMap((p) => [p, ...projects.filter((c) => c.parent_key === p.key).sort(byOrder)])
}

/**
 * /admin/projects — প্রকল্পের তালিকা (পরিকল্পনা M-ধাপ ৭): গ্রুপ অনুযায়ী, ↑↓ দিয়ে ক্রম বদল (একই স্তরের মধ্যে),
 * প্রকাশ/অপ্রকাশ (প্রকাশের চেকলিস্ট মেনে; অপ্রকাশে রেকর্ড/উপ-প্রকল্প থাকলে নাম লিখে নিশ্চিতকরণ), "হোমে দেখান"।
 * প্রতিটি বদল updated_at মিলিয়ে (অন্য কেউ এর মধ্যে বদলালে CONFLICT)।
 */
export function AdminProjectsPage() {
  useDocumentTitle(t('প্রকল্পসমূহ'))
  const toast = useToast()
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<HousingApiError | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<Project | null>(null)

  const load = useCallback(async () => {
    try {
      setData(await fetchData())
      setError(null)
    } catch (err) {
      setError(HousingApiError.from(err))
    }
  }, [])

  useEffect(() => {
    let alive = true
    fetchData()
      .then((d) => alive && setData(d))
      .catch((err: unknown) => alive && setError(HousingApiError.from(err)))
    return () => {
      alive = false
    }
  }, [])

  /** যেকোনো বদলের পরে: তালিকা আবার আনা + সাইটের রেজিস্ট্রি (মেনু, রাউট) হালনাগাদ */
  const after = async () => {
    await load()
    await refreshProjects({ includeDrafts: true })
  }

  const run = async (key: string, fn: () => Promise<unknown>, okMsg: string) => {
    setBusyKey(key)
    try {
      await fn()
      toast.success(okMsg)
      await after()
    } catch (err) {
      const stale = isStaleEdit(err)
      toast.error(stale ? t('অন্য কেউ এর মধ্যে প্রকল্পটি বদলেছেন — তালিকা আবার আনা হলো, আবার চেষ্টা করুন') : friendlyProjectError(err))
      if (stale) await load()
    } finally {
      setBusyKey(null)
    }
  }

  if (error && !data) {
    return (
      <Page title={t('প্রকল্পসমূহ')} documentTitle={false}>
        <ErrorNotice title={t('প্রকল্পের তালিকা লোড করা যায়নি')} error={error} />
      </Page>
    )
  }
  if (!data) {
    return (
      <Page title={t('প্রকল্পসমূহ')} documentTitle={false}>
        <LoadingState label={t('লোড হচ্ছে…')} />
      </Page>
    )
  }

  const { projects, totals } = data
  const ordered = displayOrder(projects)

  const move = (p: Project, dir: -1 | 1) => {
    const siblings = ordered.filter((x) => (x.parent_key ?? null) === (p.parent_key ?? null))
    const i = siblings.findIndex((x) => x.key === p.key)
    const j = i + dir
    if (j < 0 || j >= siblings.length) return
    const swapped = [...siblings]
    ;[swapped[i], swapped[j]] = [swapped[j], swapped[i]]
    // নতুন ক্রমে পুরো তালিকা (একই স্তরের বদলানো ক্রম মেনে) → projects_reorder
    const pos = new Map(swapped.map((x, k) => [x.key, k]))
    const next = displayOrder(
      projects.map((x) => (pos.has(x.key) ? { ...x, sort_order: pos.get(x.key)! } : x)),
    )
    void run(p.key, () => getProjectsApi().reorder(next.map((x) => x.key)), t('ক্রম বদলানো হয়েছে'))
  }

  const setPublished = (p: Project, value: boolean) =>
    run(p.key, () => getProjectsApi().update(p.key, { is_published: value }, { expectedUpdatedAt: p.updated_at }), value ? t('প্রকাশ করা হয়েছে') : t('অপ্রকাশ করা হয়েছে'))

  const askUnpublish = (p: Project) => {
    const records = totals[p.key] ?? 0
    const publishedChildren = projects.some((c) => c.parent_key === p.key && c.is_published)
    if (records > 0 || publishedChildren) setConfirm(p)
    else void setPublished(p, false)
  }

  return (
    <Page
      title={t('প্রকল্পসমূহ')}
      documentTitle={false}
      description={t('নতুন প্রকল্প সবসময় খসড়া হিসেবে তৈরি হয়; প্রকাশ না করা পর্যন্ত দর্শকেরা দেখতে পান না।')}
      actions={
        <LinkButton to="/admin/projects/new" startIcon="add">
          {t('নতুন প্রকল্প')}
        </LinkButton>
      }
    >
      <Stack role="list" gap={1.5}>
        {ordered.map((p) => {
          const siblings = ordered.filter((x) => (x.parent_key ?? null) === (p.parent_key ?? null))
          const idx = siblings.findIndex((x) => x.key === p.key)
          const check = publishChecklist(p, projects)
          const busy = busyKey === p.key
          const parent = p.parent_key ? projects.find((x) => x.key === p.parent_key) : undefined
          return (
            <Stack key={p.key} role="listitem" gap={0}>
              <Card accent={!!p.parent_key}>
                <Stack direction="row" gap={2} align="center" justify="between" wrap>
                  <Stack gap={0.5}>
                    <Stack direction="row" gap={1} align="center" wrap>
                      <TextLink to={`/admin/projects/${encodeURIComponent(p.key)}`}>{lt(p, 'name')}</TextLink>
                      {p.is_published ? <Badge tone="green">{t('প্রকাশিত')}</Badge> : <Badge tone="amber">{t('খসড়া')}</Badge>}
                      {p.is_group && <Badge tone="blue">{t('গ্রুপ')}</Badge>}
                      {!p.show_on_home && <Badge>{t('হোমে নেই')}</Badge>}
                    </Stack>
                    {/* উপ-প্রকল্পের কার্ডের সবুজ রেখার মানে এখানে লেখা */}
                    {parent && (
                      <Text size="caption" tone="muted">
                        {t('গ্রুপ: {name}', { name: lt(parent, 'name') })}
                      </Text>
                    )}
                    <Text size="caption" tone="muted">
                      <Text size="caption" tone="muted" mono inline>
                        {projectPath(p, projects)}
                      </Text>{' '}
                      ·{' '}
                      <Text size="caption" tone="muted" mono inline>
                        {p.key}
                      </Text>{' '}
                      · {t('{n}টি রেকর্ড', { n: formatBanglaNumber(totals[p.key] ?? 0) })}
                    </Text>
                    {!p.is_published && check.blocking.length > 0 && (
                      <Text size="caption" tone="warning">
                        {t('প্রকাশের আগে: {list}', { list: check.blocking.join(' · ') })}
                      </Text>
                    )}
                  </Stack>
                  <Stack direction="row" gap={1} align="center" wrap>
                    <IconButton icon="up" label={t('উপরে সরান')} disabled={busy || idx <= 0} onClick={() => move(p, -1)} />
                    <IconButton icon="down" label={t('নিচে সরান')} disabled={busy || idx < 0 || idx >= siblings.length - 1} onClick={() => move(p, 1)} />
                    <Checkbox
                      label={t('হোমে দেখান')}
                      checked={p.show_on_home}
                      disabled={busy}
                      onChange={(checked) => void run(p.key, () => getProjectsApi().update(p.key, { show_on_home: checked }, { expectedUpdatedAt: p.updated_at }), t('সংরক্ষিত'))}
                    />
                    {p.is_published ? (
                      <Button variant="secondary" size="small" disabled={busy} onClick={() => askUnpublish(p)}>
                        {t('অপ্রকাশ করুন')}
                      </Button>
                    ) : (
                      <Button variant="primary" size="small" disabled={busy || check.blocking.length > 0} title={check.blocking.join(' · ') || undefined} onClick={() => void setPublished(p, true)}>
                        {t('প্রকাশ করুন')}
                      </Button>
                    )}
                    <LinkButton to={`/admin/projects/${encodeURIComponent(p.key)}`} variant="secondary">
                      {t('সেটিংস')}
                    </LinkButton>
                  </Stack>
                </Stack>
              </Card>
            </Stack>
          )
        })}
      </Stack>

      {confirm && (
        <UnpublishDialog
          project={confirm}
          projects={projects}
          records={totals[confirm.key] ?? 0}
          busy={busyKey === confirm.key}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const p = confirm
            void setPublished(p, false).then(() => setConfirm(null))
          }}
        />
      )}
    </Page>
  )
}
