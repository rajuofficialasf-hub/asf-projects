import { lt, t } from '@/i18n'
import { useEffect, useState } from 'react'
import {
  getHousingApi,
  getProjectsApi,
  HousingApiError,
  type ActivityEntry,
  type ProjectOverview,
  type ProjectOverviewItem,
} from '@/backend'
import { projectPath, useProjects } from '@/features/projects/registry'
import { formatDateTime } from '@/features/housing/utils/activityLabels'
import { ActionBadge } from '../ui/ActionBadge'
import { actorLabel } from '../ui/actorLabel'
import { adminPath, useRecordProjects } from '@/features/housing/utils/housingProjects'
import { canEditProject, useAdminUser } from '../adminUser'
import { formatBanglaNumber, toBanglaNumber } from '@/lib/banglaNumber'
import { formatTaka } from '@/lib/money'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { Button, Card, Grid, LinkButton, LoadingState, Page, Stack, StatList, Text, TextLink } from '@/ui'
import { Badge } from '../ui/Badge'
import { ErrorNotice } from '../ui/ErrorNotice'
import { NoProjectsNotice } from '../ui/NoProjectsNotice'

type State =
  | { status: 'loading' }
  | { status: 'ready'; overview: ProjectOverview; activity: ActivityEntry[] }
  | { status: 'error'; error: HousingApiError }

/** প্রকল্পের মোট টাকা = তার সব টাকা-ফিল্ডের যোগফল (হালকা স্ট্যাটেও আছে); টাকা-ফিল্ড না থাকলে null */
function moneyTotal(item: ProjectOverviewItem): number | null {
  const sums = Object.values(item.stats.fields ?? {}).filter((f) => f.type === 'money')
  return sums.length ? sums.reduce((s, f) => s + (f.type === 'money' ? f.sum : 0), 0) : null
}

/**
 * /admin — ড্যাশবোর্ড (পরিকল্পনা M-ধাপ ৭): খসড়াসহ প্রতিটি প্রকল্পের কার্ড (রেকর্ড, মোট টাকা, ছবি বাকি, প্রকাশের অবস্থা,
 * দ্রুত বোতাম) — এক কলে (projects_overview(true)); নিচে লগের শেষ ১০টি এন্ট্রি।
 */
export function AdminDashboardPage() {
  useDocumentTitle(t('ড্যাশবোর্ড'))
  const [state, setState] = useState<State>({ status: 'loading' })
  const [reload, setReload] = useState(0)
  const recordKeys = new Set(useRecordProjects().map((p) => p.key))
  const projects = useProjects()
  const me = useAdminUser()
  // প্রকল্পের ইউজার: শুধু নিজের প্রকল্প, সেটিংস/নতুন প্রকল্পের বোতাম নেই (পর্ব চ)
  const settings = me?.role !== 'editor'

  useEffect(() => {
    let alive = true
    Promise.all([
      getProjectsApi().overview({ includeDrafts: true }),
      getHousingApi()
        .listActivity({ page: 1, page_size: 10 })
        .then((p) => p.data)
        .catch(() => [] as ActivityEntry[]),
    ])
      .then(([overview, activity]) => alive && setState({ status: 'ready', overview, activity }))
      .catch((err: unknown) => alive && setState({ status: 'error', error: HousingApiError.from(err) }))
    return () => {
      alive = false
    }
  }, [reload])

  if (state.status === 'loading') {
    return (
      <Page title={t('ড্যাশবোর্ড')} documentTitle={false}>
        <LoadingState label={t('লোড হচ্ছে…')} />
      </Page>
    )
  }
  if (state.status === 'error') {
    return (
      <Page title={t('ড্যাশবোর্ড')} documentTitle={false}>
        <Stack gap={1.5} align="start">
          <ErrorNotice title={t('ড্যাশবোর্ড লোড করা যায়নি')} error={state.error} />
          <Button variant="secondary" onClick={() => setReload((n) => n + 1)}>
            {t('আবার চেষ্টা করুন')}
          </Button>
        </Stack>
      </Page>
    )
  }

  const { overview, activity } = state
  const items = overview.projects.filter((x) => canEditProject(me, x.key))
  // গ্রুপের পরে তার উপ-প্রকল্প, তারপর পরের শীর্ষ-স্তর
  const ordered = items
    .filter((x) => !x.parent_key)
    .flatMap((top) => [top, ...items.filter((c) => c.parent_key === top.key)])
  const orphans = items.filter((x) => x.parent_key && !items.some((p) => p.key === x.parent_key))

  return (
    <Page
      title={t('ড্যাশবোর্ড')}
      documentTitle={false}
      description={t('প্রকাশিত: {p}টি প্রকল্প · {n} জন উপকারভোগী · {d}টি জেলা', {
        p: toBanglaNumber(overview.global.projects),
        n: formatBanglaNumber(overview.global.total),
        d: toBanglaNumber(overview.global.districts),
      })}
      actions={
        settings && (
          <LinkButton to="/admin/projects/new" startIcon="add">
            {t('নতুন প্রকল্প')}
          </LinkButton>
        )
      }
    >
      <Stack gap={4}>
        {items.length === 0 && <NoProjectsNotice />}
        <Grid columns={{ xs: 1, md: 2, lg: 3 }} gap={2}>
          {[...ordered, ...orphans].map((item) => {
            const money = moneyTotal(item)
            const project = projects.find((p) => p.key === item.key)
            const draft = !item.is_published
            return (
              <Card
                key={item.key}
                eyebrow={item.is_group ? t('প্রকল্প-গ্রুপ') : item.parent_key ? t('উপ-প্রকল্প') : t('একক প্রকল্প')}
                title={lt(item, 'name')}
                description={
                  <Text size="caption" tone="muted" mono>
                    {item.key}
                  </Text>
                }
                actions={draft ? <Badge tone="amber">{t('খসড়া')}</Badge> : <Badge tone="green">{t('প্রকাশিত')}</Badge>}
              >
                <Stack gap={2}>
                  <StatList
                    items={[
                      { label: t('রেকর্ড'), value: formatBanglaNumber(item.stats.total) },
                      { label: t('মোট টাকা'), value: money === null ? '—' : formatTaka(money) },
                      item.is_group || item.photo_mode === 'none' || item.without_photo === null
                        ? { label: t('ছবি বাকি'), value: '—' }
                        : { label: t('ছবি বাকি'), value: formatBanglaNumber(item.without_photo), tone: item.without_photo > 0 ? 'warning' : 'default' },
                    ]}
                  />
                  <Stack direction="row" gap={1} wrap>
                    {recordKeys.has(item.key) && (
                      <LinkButton to={adminPath(item.key)} variant="secondary">
                        {t('রেকর্ড')}
                      </LinkButton>
                    )}
                    {settings && (
                      <LinkButton to={`/admin/projects/${encodeURIComponent(item.key)}`} variant="secondary">
                        {t('সেটিংস')}
                      </LinkButton>
                    )}
                    {project && (
                      <LinkButton to={projectPath(project, projects)} variant="secondary">
                        {draft ? t('প্রিভিউ') : t('পাবলিক পেইজ')}
                      </LinkButton>
                    )}
                  </Stack>
                </Stack>
              </Card>
            )
          })}
        </Grid>

        <Card title={t('সাম্প্রতিক কাজ')} actions={<TextLink to="/admin/activity">{t('সব দেখুন')}</TextLink>}>
          {activity.length === 0 ? (
            <Text size="small" tone="muted">
              {t('কোনো এন্ট্রি নেই।')}
            </Text>
          ) : (
            <Stack role="list" gap={1.5}>
              {activity.map((e) => {
                const p = projects.find((x) => x.key === e.project_type)
                return (
                  <Stack key={e.id} role="listitem" direction="row" gap={1} align="center" wrap>
                    <Text size="caption" tone="muted" tabular inline>
                      <time dateTime={e.at}>{formatDateTime(e.at)}</time>
                    </Text>
                    <ActionBadge action={e.action} />
                    <Text size="small" inline truncate>
                      {actorLabel(e.actor_email)}
                    </Text>
                    {p && (
                      <Text size="small" tone="muted" inline>
                        · {lt(p, 'name')}
                      </Text>
                    )}
                    {e.serial_no !== null && (
                      <Text size="small" tone="muted" inline>
                        · {t('সিরিয়াল')} {toBanglaNumber(e.serial_no)}
                      </Text>
                    )}
                    {/* প্রকল্পের সেটিং বদলে record_name = প্রকল্পের নাম, যা আগেই দেখানো — তাই শুধু রেকর্ড/ফিল্ডের নাম */}
                    {e.record_name && (e.serial_no !== null || e.action.startsWith('field_')) && (
                      <Text size="small" tone="muted" inline truncate>
                        ({e.record_name})
                      </Text>
                    )}
                  </Stack>
                )
              })}
            </Stack>
          )}
        </Card>
      </Stack>
    </Page>
  )
}
