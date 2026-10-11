import { lt, t } from '@/i18n'
import { useState } from 'react'
import { getProjectsApi, type CoreFieldKey, type CoreFieldsConfig, type Project, type ProjectField } from '@/backend'
import { ALWAYS_REQUIRED, FIELD_VALUE_SPECS, SYSTEM_FIELDS } from '@/features/projects/fields'
import { useAuth } from '@/features/housing/hooks/useAuth'
import { pick } from '@/i18n'
import { formatBanglaNumber, toBanglaNumber } from '@/lib/banglaNumber'
import { Badge } from '../../ui/Badge'
import { Alert, Button, Card, Grid, SelectField, Stack, Text, TextField, useToast, IconButton } from '@/ui'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import { FieldEditorDrawer } from '../FieldEditorDrawer'
import { FieldPreview } from '../FieldPreview'
import { MAX_FIELDS } from '../fieldRules'
import { friendlyProjectError, isStaleEdit } from '../projectRules'

type Status = 'required' | 'optional' | 'off'

/** সিস্টেম ফিল্ডের অবস্থা core_fields থেকে */
function statusOf(core: CoreFieldsConfig, key: CoreFieldKey, defRequired: boolean): Status {
  const c = core[key]
  if (c?.enabled === false) return 'off'
  return (c?.required ?? defRequired) ? 'required' : 'optional'
}

/**
 * "ফিল্ড" ট্যাব (পরিকল্পনা M-ধাপ ৮): উপরে সিস্টেম ফিল্ড 🔒 (শুধু লেবেল; সাল/নাম/বিভাগ/জেলা/উপজেলা বাদে আবশ্যক/ঐচ্ছিক/বন্ধ —
 * core_fields এ, প্রকল্পের updated_at মিলিয়ে); তারপর কাস্টম ফিল্ড (↑↓ ক্রম, ব্যাজ, সম্পাদনা, আর্কাইভ/ফেরত, মোছা —
 * মূল এডমিন, ডাটা থাকলে আর্কাইভের প্রস্তাব); পাশে প্রিভিউ।
 */
export function FieldsTab({ project, blocked, onChanged }: { project: Project; blocked: boolean; onChanged: () => Promise<void> }) {
  const toast = useToast()
  const auth = useAuth()
  const mainAdmin = auth.user?.role === 'main_admin'
  const [core, setCore] = useState<CoreFieldsConfig>(() => structuredClone(project.core_fields ?? {}))
  const [busy, setBusy] = useState(false)
  const [editor, setEditor] = useState<{ field: ProjectField | null; usage: number | null } | null>(null)
  const [deleting, setDeleting] = useState<{ field: ProjectField; usage: number } | null>(null)

  const coreDirty = JSON.stringify(core) !== JSON.stringify(project.core_fields ?? {})
  const fields = [...project.fields].sort((a, b) => a.sort_order - b.sort_order || a.key.localeCompare(b.key))
  const systemShown = SYSTEM_FIELDS.filter((f) => f.key !== 'union_name' || project.geo_depth === 'union')

  const setCoreField = (key: CoreFieldKey, patch: Partial<NonNullable<CoreFieldsConfig[CoreFieldKey]>>) =>
    setCore((c) => {
      const next = { ...(c[key] ?? {}), ...patch }
      for (const k of Object.keys(next) as (keyof typeof next)[]) if (next[k] === undefined || next[k] === '') delete next[k]
      const out = { ...c }
      if (Object.keys(next).length) out[key] = next
      else delete out[key]
      return out
    })

  const run = async (fn: () => Promise<unknown>, okMsg: string) => {
    setBusy(true)
    try {
      await fn()
      await onChanged()
      toast.success(okMsg)
    } catch (err) {
      const stale = isStaleEdit(err)
      toast.error(stale ? t('অন্য কেউ এর মধ্যে প্রকল্পটি বদলেছেন — পাতা আবার আনা হলো, আবার চেষ্টা করুন') : friendlyProjectError(err))
      if (stale) await onChanged()
    } finally {
      setBusy(false)
    }
  }

  const saveCore = () => run(() => getProjectsApi().update(project.key, { core_fields: core }, { expectedUpdatedAt: project.updated_at }), t('সংরক্ষিত'))

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= fields.length) return
    const ids = fields.map((f) => f.id)
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    void run(() => getProjectsApi().reorderFields(project.key, ids), t('ক্রম বদলানো হয়েছে'))
  }

  const usageOf = async (f: ProjectField) => (await getProjectsApi().fieldUsage(project.key, f.key)).count

  const openEditor = async (f: ProjectField | null) => {
    if (!f) return setEditor({ field: null, usage: 0 })
    setEditor({ field: f, usage: null })
    try {
      const n = await usageOf(f)
      setEditor((cur) => (cur && cur.field?.id === f.id ? { field: f, usage: n } : cur))
    } catch {
      setEditor((cur) => (cur && cur.field?.id === f.id ? { field: f, usage: 0 } : cur))
    }
  }

  const askDelete = async (f: ProjectField) => {
    setBusy(true)
    try {
      setDeleting({ field: f, usage: await usageOf(f) })
    } catch (err) {
      toast.error(friendlyProjectError(err))
    } finally {
      setBusy(false)
    }
  }

  if (project.is_group) {
    return (
      <Card>
        <Text size="small" tone="muted">
          {t('প্রকল্প-গ্রুপে ফিল্ড থাকে না — ফিল্ড যোগ করুন উপ-প্রকল্পে।')}
        </Text>
      </Card>
    )
  }

  return (
    <Grid columns={{ xs: 1, lg: 2 }} gap={3}>
      <Stack gap={3}>
        {blocked && <Alert tone="warning">{t('অন্য ট্যাবে সংরক্ষণ হয়নি এমন পরিবর্তন আছে — আগে সেগুলো সংরক্ষণ বা বাতিল করুন।')}</Alert>}

        {/* ---------- সিস্টেম ফিল্ড ---------- */}
        <Card title={`${t('সিস্টেম ফিল্ড')} 🔒`} description={t('সব প্রকল্পে থাকে; শুধু লেবেল বদলানো যায়। সাল, নাম ও বিভাগ-জেলা-উপজেলা সবসময় আবশ্যক।')}>
          <Stack gap={2}>
            <Stack role="list" gap={2}>
              {systemShown.map((f) => {
                const c = core[f.key] ?? {}
                const fixed = ALWAYS_REQUIRED.includes(f.key)
                const status = statusOf(core, f.key, f.required)
                return (
                  <Stack key={f.key} role="listitem">
                    <Grid columns={{ xs: 1, sm: 3 }} gap={1}>
                      <TextField
                        label={t('{name} — বাংলা লেবেল', { name: f.label_bn })}
                        hideLabel
                        size="small"
                        value={c.label_bn ?? ''}
                        placeholder={f.label_bn}
                        onChange={(v) => setCoreField(f.key, { label_bn: v })}
                        maxLength={120}
                      />
                      <TextField
                        label={t('{name} — ইংরেজি লেবেল', { name: f.label_bn })}
                        hideLabel
                        size="small"
                        value={c.label_en ?? ''}
                        placeholder={f.label_en}
                        onChange={(v) => setCoreField(f.key, { label_en: v })}
                        maxLength={120}
                      />
                      {fixed ? (
                        <Text size="small" tone="muted">
                          🔒 {t('আবশ্যক')}
                        </Text>
                      ) : (
                        <SelectField
                          label={t('{name} — অবস্থা', { name: f.label_bn })}
                          hideLabel
                          size="small"
                          value={status}
                          onChange={(value) => {
                            const v = value as Status
                            setCoreField(f.key, { required: v === 'required' ? true : v === 'optional' ? false : undefined, enabled: v === 'off' ? false : undefined })
                          }}
                          options={[
                            { value: 'required', label: t('আবশ্যক') },
                            { value: 'optional', label: t('ঐচ্ছিক') },
                            ...(f.key !== 'union_name' ? [{ value: 'off', label: t('বন্ধ') }] : []),
                          ]}
                        />
                      )}
                    </Grid>
                  </Stack>
                )
              })}
            </Stack>
            {project.geo_depth !== 'union' && (
              <Text size="caption" tone="muted">
                {t('ইউনিয়ন চালু করতে "সাধারণ" ট্যাবে ঠিকানার স্তর "ইউনিয়ন পর্যন্ত" করুন।')}
              </Text>
            )}
            <Stack direction="row" gap={1} wrap>
              <Button disabled={busy || blocked || !coreDirty} onClick={() => void saveCore()}>
                {t('সিস্টেম ফিল্ড সংরক্ষণ')}
              </Button>
              <Button variant="secondary" disabled={busy || !coreDirty} onClick={() => setCore(structuredClone(project.core_fields ?? {}))}>
                {t('পরিবর্তন বাতিল')}
              </Button>
            </Stack>
          </Stack>
        </Card>

        {/* ---------- কাস্টম ফিল্ড ---------- */}
        <Card
          title={t('কাস্টম ফিল্ড')}
          actions={
            <Button startIcon="add" disabled={busy || blocked || fields.length >= MAX_FIELDS} onClick={() => void openEditor(null)}>
              {t('ফিল্ড যোগ করুন')}
            </Button>
          }
        >
          <Stack gap={2}>
            {fields.length >= MAX_FIELDS && (
              <Text size="caption" tone="warning">
                {t('একটি প্রকল্পে সর্বোচ্চ {n}টি ফিল্ড', { n: toBanglaNumber(MAX_FIELDS) })}
              </Text>
            )}
            {fields.length === 0 ? (
              <Text size="small" tone="muted">
                {t('এখনো কোনো কাস্টম ফিল্ড নেই।')}
              </Text>
            ) : (
              <Stack role="list" gap={2}>
                {fields.map((f, i) => (
                  <Stack key={f.id} role="listitem" gap={1}>
                    <Text weight="bold">
                      {lt(f, 'label')}{' '}
                      <Text size="caption" tone="muted" mono inline>
                        {f.key}
                      </Text>
                    </Text>
                    <Stack direction="row" gap={0.5} wrap>
                      <Badge>{pick(FIELD_VALUE_SPECS[f.type].label_bn, FIELD_VALUE_SPECS[f.type].label_en)}</Badge>
                      {f.required && <Badge tone="red">{t('আবশ্যক')}</Badge>}
                      {f.show_in_table && <Badge tone="blue">{t('টেবিলে')}</Badge>}
                      {f.show_in_card && <Badge tone="blue">{t('কার্ডে')}</Badge>}
                      {f.filterable && <Badge tone="green">{t('ফিল্টারে')}</Badge>}
                      {f.visibility === 'admin' && <Badge tone="slate">🔒 {t('শুধু-এডমিন')}</Badge>}
                      {!f.label_en.trim() && <Badge tone="amber">{t('ইংরেজি নেই')}</Badge>}
                      {!f.is_active && <Badge tone="amber">{t('আর্কাইভ')}</Badge>}
                    </Stack>
                    <Stack direction="row" gap={1} wrap>
                      <IconButton icon="up" label={t('উপরে সরান')} disabled={busy || blocked || i === 0} onClick={() => move(i, -1)} />
                      <IconButton icon="down" label={t('নিচে সরান')} disabled={busy || blocked || i === fields.length - 1} onClick={() => move(i, 1)} />
                      <Button variant="secondary" size="small" disabled={busy || blocked} onClick={() => void openEditor(f)}>
                        {t('সম্পাদনা')}
                      </Button>
                      <Button
                        variant="secondary"
                        size="small"
                        disabled={busy || blocked}
                        onClick={() => void run(() => getProjectsApi().updateField(f.id, { is_active: !f.is_active }), f.is_active ? t('আর্কাইভ করা হয়েছে') : t('ফেরত আনা হয়েছে'))}
                      >
                        {f.is_active ? t('আর্কাইভ') : t('ফেরত আনুন')}
                      </Button>
                      {mainAdmin && (
                        <Button variant="danger-text" size="small" disabled={busy || blocked} onClick={() => void askDelete(f)}>
                          {t('মুছুন')}
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            )}
          </Stack>
        </Card>
      </Stack>

      <FieldPreview project={project} />

      {editor && (
        <FieldEditorDrawer
          key={editor.field?.id ?? 'new'}
          project={project}
          field={editor.field}
          usage={editor.usage}
          onClose={() => setEditor(null)}
          onSaved={async () => {
            await onChanged()
            toast.success(t('সংরক্ষিত'))
          }}
        />
      )}

      {deleting &&
        (deleting.usage > 0 ? (
          <ConfirmDialog
            open
            title={t('«{name}» মোছা যাবে না', { name: lt(deleting.field, 'label') })}
            confirmLabel={deleting.field.is_active ? t('আর্কাইভ করুন') : t('ঠিক আছে')}
            busy={busy}
            onCancel={() => setDeleting(null)}
            onConfirm={() => {
              const f = deleting.field
              if (!f.is_active) return setDeleting(null)
              void run(() => getProjectsApi().updateField(f.id, { is_active: false }), t('আর্কাইভ করা হয়েছে')).then(() => setDeleting(null))
            }}
          >
            <Text size="small">
              {t('{n}টি রেকর্ডে মান আছে — মোছা যাবে না, আর্কাইভ করুন। আর্কাইভ করা ফিল্ডে নতুন মান দেওয়া যায় না, পুরনো মান থেকে যায়, পরে ফেরত আনা যায়।', { n: formatBanglaNumber(deleting.usage) })}
            </Text>
          </ConfirmDialog>
        ) : (
          <ConfirmDialog
            open
            tone="danger"
            title={t('«{name}» মুছে ফেলবেন?', { name: lt(deleting.field, 'label') })}
            confirmLabel={t('মুছুন')}
            busy={busy}
            onCancel={() => setDeleting(null)}
            onConfirm={() => {
              const f = deleting.field
              void run(() => getProjectsApi().deleteField(f.id), t('মুছে ফেলা হয়েছে')).then(() => setDeleting(null))
            }}
          >
            <Text size="small">{t('কোনো রেকর্ডে এই ফিল্ডের মান নেই, তাই পুরোপুরি মুছে ফেলা যায়। এটি ফেরানো যায় না।')}</Text>
          </ConfirmDialog>
        ))}
    </Grid>
  )
}
