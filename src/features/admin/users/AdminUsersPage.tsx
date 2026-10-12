import { lt, t } from '@/i18n'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { toBanglaNumber } from '@/lib/banglaNumber'
import { getAdminUsersApi, HousingApiError, type AdminRole, type AdminUserInput, type AdminUserRow, type Project, type ProjectKey } from '@/backend'
import { childrenOf, topLevelProjects, useProjects } from '@/features/projects/registry'
import { formatDateTime } from '@/features/housing/utils/activityLabels'
import { Alert, Button, Card, Checkbox, DataTable, FieldGroup, Grid, Page, RadioGroup, Stack, Text, TextField } from '@/ui'
import { Badge } from '../ui/Badge'
import { ErrorNotice } from '../ui/ErrorNotice'

interface Draft {
  email: string
  role: AdminUserInput['role']
  all_projects: boolean
  projects: ProjectKey[]
  is_active: boolean
  /** তালিকা থেকে এডিট (ইমেইল বদলানো যায় না) */
  existing: boolean
}

const EMPTY: Draft = { email: '', role: 'editor', all_projects: false, projects: [], is_active: true, existing: false }

const ROLE_LABELS: Record<AdminRole, string> = { main_admin: 'মূল এডমিন', admin: 'এডমিন', editor: 'প্রকল্পের ইউজার' }
const roleLabel = (role: AdminRole) => t(ROLE_LABELS[role])

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge tone="green">{t('চালু')}</Badge>
  ) : (
    <Badge tone="slate">{t('বন্ধ')}</Badge>
  )
}


/**
 * /admin/users — ইউজার-ব্যবস্থাপনা (শুধু মূল এডমিন — RoleGate আর সার্ভার দুজনেই আটকায়; docs/api/PROJECTS_API_CONTRACT.md §৪.৬)।
 * লগইন আগে সার্ভারের এডমিন CLI দিয়ে খোলা হয় (`npm --prefix server run admin -- create`); এখানে সেই লগইনের ভূমিকা
 * (এডমিন বা প্রকল্পের ইউজার), প্রকল্প বরাদ্দ, "সব প্রকল্প" আর চালু/বন্ধ। গ্রুপ বাছলে তার সব উপ-প্রকল্প (পরে যোগ হলেও) পান।
 */
export function AdminUsersPage() {
  useDocumentTitle(t('ইউজার'))
  const projects = useProjects()
  const top = useMemo(() => topLevelProjects(projects), [projects])
  const byKey = useMemo(() => new Map(projects.map((p) => [p.key, p])), [projects])

  const [rows, setRows] = useState<AdminUserRow[] | null>(null)
  const [listError, setListError] = useState<HousingApiError | null>(null)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<HousingApiError | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const load = useCallback(async () => {
    try {
      setRows(await getAdminUsersApi().list())
      setListError(null)
    } catch (err) {
      setListError(HousingApiError.from(err))
    }
  }, [])

  useEffect(() => {
    let alive = true
    getAdminUsersApi()
      .list()
      .then((r) => alive && setRows(r))
      .catch((err) => alive && setListError(HousingApiError.from(err)))
    return () => {
      alive = false
    }
  }, [])

  const edit = (r: AdminUserRow) => {
    const role = r.role === 'admin' ? 'admin' : 'editor'
    setDraft({ email: r.email, role, all_projects: role === 'editor' && r.all_projects, projects: r.projects, is_active: r.is_active, existing: true })
    setSaveError(null)
    setSaved(null)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const toggle = (key: ProjectKey, on: boolean) =>
    setDraft((d) => {
      const kids = childrenOf(key, projects).map((c) => c.key)
      // গ্রুপ বাছলে উপ-প্রকল্পগুলো আলাদা করে রাখার দরকার নেই (গ্রুপ-বরাদ্দেই সব আসে)
      const rest = d.projects.filter((k) => k !== key && !(on && kids.includes(k)))
      return { ...d, projects: on ? [...rest, key] : rest }
    })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    setSaved(null)
    try {
      const { email, role, all_projects, projects: keys, is_active } = draft
      const r = await getAdminUsersApi().save({ email, role, all_projects, projects: keys, is_active })
      setSaved(t('{email} এর তথ্য বদলানো হয়েছে', { email: r.email }))
      setDraft(EMPTY)
      await load()
    } catch (err) {
      setSaveError(HousingApiError.from(err))
    } finally {
      setSaving(false)
    }
  }

  const projectNames = (r: AdminUserRow) =>
    r.all_projects
      ? t('সব প্রকল্প')
      : r.projects.length
        ? r.projects.map((k) => lt(byKey.get(k), 'name') || k).join(', ')
        : '—'


  const box = (p: Project) => {
    const groupOn = !!p.parent_key && draft.projects.includes(p.parent_key)
    const checked = draft.all_projects || groupOn || draft.projects.includes(p.key)
    return (
      <Checkbox
        key={p.key}
        checked={checked}
        disabled={saving || draft.all_projects || groupOn}
        onChange={(on) => toggle(p.key, on)}
        label={
          <Text size="small" tone={draft.all_projects || groupOn ? 'muted' : 'default'} inline>
            {lt(p, 'name')}
            {p.is_group && (
              <Text size="caption" tone="muted" inline>
                {' '}
                {t('(গ্রুপ — সব উপ-প্রকল্প)')}
              </Text>
            )}
            {!p.is_published && (
              <Text size="caption" tone="muted" inline>
                {' '}
                {t('(খসড়া)')}
              </Text>
            )}
          </Text>
        }
      />
    )
  }

  return (
    <Page
      title={t('ইউজার')}
      description={t('প্রকল্পের ইউজার নিজের প্রকল্পে রেকর্ড যোগ ও এডিট, ইম্পোর্ট আর নতুন ছবি দিতে পারেন। থাকা ছবি বদল, মান ফাঁকা করা, সিরিয়াল বদল আর প্রকল্পের সেটিংস পারেন এডমিন ও মূল এডমিন। মোছা আর ইউজার সামলানো শুধু মূল এডমিনের কাজ।')}
      documentTitle={false}
    >
      <Stack gap={4}>
        {listError ? (
          <ErrorNotice title={t('ইউজার-তালিকা আনা যায়নি')} error={listError} />
        ) : (
          <Stack gap={1}>
            {/* ফোনে কার্ড (টেবিল পাশে স্ক্রল হলে "বদলান" চোখে পড়ে না) — M-ধাপ ২০ */}
            <DataTable
              label={t('ইউজার')}
              rows={rows ?? []}
              loading={rows === null}
              loadingLabel={t('লোড হচ্ছে…')}
              emptyTitle="—"
              getRowId={(r) => r.id}
              cardsOnPhones
              columns={[
                {
                  id: 'email',
                  header: t('ইমেইল'),
                  cell: (r) => (
                    <>
                      <Text size="small" weight="medium" tone={r.is_active ? 'default' : 'muted'}>
                        {r.email}
                      </Text>
                      {r.name && (
                        <Text size="caption" tone="muted">
                          {r.name}
                        </Text>
                      )}
                    </>
                  ),
                },
                { id: 'role', header: t('ভূমিকা'), cell: (r) => roleLabel(r.role) },
                { id: 'projects', header: t('প্রকল্প'), cell: (r) => projectNames(r) },
                { id: 'status', header: t('অবস্থা'), cell: (r) => <StatusBadge active={r.is_active} /> },
                { id: 'last_seen', header: t('শেষ সক্রিয়'), cell: (r) => (r.last_seen_at ? formatDateTime(r.last_seen_at) : '—') },
                {
                  id: 'actions',
                  header: t('কাজ'),
                  align: 'right',
                  cell: (r) =>
                    r.role !== 'main_admin' && (
                      <Button variant="text" size="small" disabled={saving} onClick={() => edit(r)}>
                        {t('বদলান')}
                      </Button>
                    ),
                },
              ]}
            />
            {rows && (
              <Text size="caption" tone="muted">
                {t('মোট {n} জন', { n: toBanglaNumber(rows.length) })}
              </Text>
            )}
          </Stack>
        )}

        <form ref={formRef} onSubmit={(e) => void submit(e)} aria-label={draft.existing ? t('ইউজার বদলান') : t('নতুন ইউজার যোগ')}>
          <Card title={draft.existing ? t('ইউজার বদলান') : t('নতুন ইউজার যোগ')}>
            <Stack gap={3}>
              {!draft.existing && (
                <Stack role="list" gap={1}>
                  <Stack role="listitem">
                    <Text size="small" tone="muted">
                      {t('আগে সার্ভারে এই কমান্ড চালিয়ে ইমেইল-পাসওয়ার্ডে অ্যাকাউন্ট খুলুন:')}{' '}
                      <Text size="small" mono inline>
                        npm --prefix server run admin -- create --email … --name …
                      </Text>
                    </Text>
                  </Stack>
                  <Stack role="listitem">
                    <Text size="small" tone="muted">
                      {t('তারপর সেই ইমেইল এখানে লিখে ভূমিকা ও প্রকল্প বাছুন, তারপর সংরক্ষণ করুন। পাসওয়ার্ড ইউজারকে নিজে জানাবেন।')}
                    </Text>
                  </Stack>
                </Stack>
              )}

              <TextField
                label={t('ইমেইল')}
                type="email"
                required
                autoComplete="off"
                value={draft.email}
                readOnly={draft.existing}
                disabled={saving}
                onChange={(v) => setDraft((d) => ({ ...d, email: v }))}
              />

              <RadioGroup
                label={t('ভূমিকা')}
                name="user-role"
                value={draft.role}
                disabled={saving}
                onChange={(v) => setDraft((d) => ({ ...d, role: v as Draft['role'] }))}
                options={(['editor', 'admin'] as const).map((role) => ({
                  value: role,
                  label: roleLabel(role),
                  hint: role === 'editor' ? t('— বাছাই করা প্রকল্পে যোগ ও এডিট') : t('— সব প্রকল্পে সব কাজ, শুধু মোছা নয়'),
                }))}
              />

              {draft.role === 'editor' && (
                <FieldGroup legend={t('প্রকল্প')}>
                  <Checkbox
                    checked={draft.all_projects}
                    disabled={saving}
                    onChange={(on) => setDraft((d) => ({ ...d, all_projects: on }))}
                    label={t('সব প্রকল্প (পরে নতুন প্রকল্প হলে সেটিও)')}
                  />
                  <Grid columns={{ xs: 1, sm: 2 }} gap={0}>
                    {top.map((p) => (
                      <Stack key={p.key} gap={0}>
                        {box(p)}
                        {p.is_group && childrenOf(p.key, projects).map((c) => box(c))}
                      </Stack>
                    ))}
                  </Grid>
                </FieldGroup>
              )}

              <Checkbox
                checked={draft.is_active}
                disabled={saving}
                onChange={(on) => setDraft((d) => ({ ...d, is_active: on }))}
                label={t('চালু (বন্ধ করলে সঙ্গে সঙ্গে লগআউট হয়ে যাবেন, আর লগইন করতে পারবেন না)')}
              />

              {saveError && <ErrorNotice title={t('সংরক্ষণ হয়নি')} error={saveError} />}
              {saved && <Alert tone="success">{saved}</Alert>}

              <Stack direction="row" gap={1.5} wrap>
                <Button type="submit" disabled={saving}>
                  {saving ? t('সংরক্ষণ হচ্ছে…') : t('সংরক্ষণ')}
                </Button>
                {draft.existing && (
                  <Button
                    variant="secondary"
                    disabled={saving}
                    onClick={() => {
                      setDraft(EMPTY)
                      setSaveError(null)
                    }}
                  >
                    {t('বাতিল — নতুন ইউজার')}
                  </Button>
                )}
              </Stack>
            </Stack>
          </Card>
        </form>
      </Stack>
    </Page>
  )
}
