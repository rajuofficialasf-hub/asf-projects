import { pick, t } from '@/i18n'
import { useState } from 'react'
import { getProjectsApi, type Project, type ProjectStats, type StatCardDef } from '@/backend'
import { STAT_ICONS, StatIcon, type StatIconKey } from '@/features/projects/registry'
import { cardSummary, cardValue, formatCardValue } from '@/features/projects/stats/statCards'
import { toBanglaNumber } from '@/lib/banglaNumber'
import { Badge } from '../../ui/Badge'
import { Alert, Button, Card, Checkbox, Grid, RadioGroup, Stack, Text, TextField, useToast, IconButton } from '@/ui'
import { friendlyProjectError, isStaleEdit } from '../projectRules'
import { StatCardPicker } from '../StatCardPicker'

const MAX_CARDS = 8
const MAX_HOME = 3

/**
 * "পরিসংখ্যান" ট্যাব (পরিকল্পনা M-ধাপ ৮): কার্ডের তালিকা — লেবেল (দুই ভাষা; হোমে আলাদা লেবেল ঐচ্ছিক), আইকন, ↑↓ ক্রম,
 * হোমে দেখানো (সর্বোচ্চ ৩টি), মোছা; নতুন কার্ড (StatCardPicker); মোট সর্বোচ্চ ৮টি। উপরে লাইভ প্রিভিউ — আসল সংখ্যা
 * (project_stats)। সংরক্ষণ প্রকল্পের updated_at মিলিয়ে।
 */
export function StatsTab({ project, stats, blocked, onChanged }: { project: Project; stats: ProjectStats | null; blocked: boolean; onChanged: () => Promise<void> }) {
  const toast = useToast()
  const [cards, setCards] = useState<StatCardDef[]>(() => structuredClone(project.stat_cards))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dirty = JSON.stringify(cards) !== JSON.stringify(project.stat_cards)
  const homes = cards.filter((c) => c.home).length
  const missingLabel = cards.some((c) => !c.label_bn.trim())

  const update = (i: number, patch: Partial<StatCardDef>) =>
    setCards((cs) =>
      cs.map((c, k) => {
        if (k !== i) return c
        const next: StatCardDef = { ...c, ...patch }
        for (const key of ['home_label_bn', 'home_label_en'] as const) if (next[key] === '') delete next[key]
        if (next.home === false) delete next.home
        return next
      }),
    )
  const move = (i: number, dir: -1 | 1) =>
    setCards((cs) => {
      const j = i + dir
      if (j < 0 || j >= cs.length) return cs
      const out = [...cs]
      ;[out[i], out[j]] = [out[j], out[i]]
      return out
    })

  const save = async () => {
    if (!dirty || busy || missingLabel) return
    setBusy(true)
    setError(null)
    try {
      await getProjectsApi().update(project.key, { stat_cards: cards }, { expectedUpdatedAt: project.updated_at })
      await onChanged()
      toast.success(t('সংরক্ষিত'))
    } catch (err) {
      setError(isStaleEdit(err) ? t('অন্য কেউ এর মধ্যে প্রকল্পটি বদলেছেন। আপনার পরিবর্তন সংরক্ষিত হয়নি — নতুন অবস্থা এনে আবার করুন।') : friendlyProjectError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Stack gap={3}>
      {blocked && <Alert tone="warning">{t('অন্য ট্যাবে সংরক্ষণ হয়নি এমন পরিবর্তন আছে — আগে সেগুলো সংরক্ষণ বা বাতিল করুন।')}</Alert>}

      {/* ---------- লাইভ প্রিভিউ ---------- */}
      <Card title={t('প্রিভিউ (আসল সংখ্যা)')}>
        <Stack gap={2}>
          {cards.length === 0 ? (
            <Text size="small" tone="muted">
              {t('কোনো কার্ড নেই — প্রকাশের আগে অন্তত একটি লাগবে।')}
            </Text>
          ) : (
            <Grid columns={{ xs: 2, lg: 4 }} gap={1.5}>
              {cards.map((c) => (
                <Card key={c.id}>
                  <Stack direction="row" gap={1.5} align="center">
                    <StatIcon icon={c.icon} width={20} height={20} aria-hidden="true" />
                    <Stack gap={0}>
                      <Text size="caption" tone="muted" truncate>
                        {pick(c.label_bn, c.label_en) || '—'}
                      </Text>
                      <Text weight="bold" tabular truncate>
                        {formatCardValue(c, cardValue(c, stats))}
                      </Text>
                    </Stack>
                  </Stack>
                </Card>
              ))}
            </Grid>
          )}
          <Text size="caption" tone="muted">
            {t('হোম পেইজের কার্ডে: {list}', { list: cards.filter((c) => c.home).map((c) => pick(c.home_label_bn || c.label_bn, c.home_label_en || c.label_en)).join(' · ') || '—' })}
          </Text>
        </Stack>
      </Card>

      {/* ---------- কার্ডের তালিকা ---------- */}
      <Card
        title={t('কার্ড')}
        actions={
          <Text size="caption" tone="muted">
            {t('মোট {n}/{max} · হোমে {h}/{hmax}', { n: toBanglaNumber(cards.length), max: toBanglaNumber(MAX_CARDS), h: toBanglaNumber(homes), hmax: toBanglaNumber(MAX_HOME) })}
          </Text>
        }
      >
        <Stack gap={2}>
          <Stack role="list" gap={2}>
            {cards.map((c, i) => (
              <Stack key={c.id} role="listitem">
                <Card accent>
                  <Stack gap={1.5}>
                    <Stack direction="row" gap={1} align="center" justify="between" wrap>
                      <Stack direction="row" gap={1} align="center">
                        <Badge tone="blue">{t({ count: 'গণনা', geo: 'এলাকা কভার', sum: 'যোগফল', distinct: 'ক্যাটাগরি সংখ্যা' }[c.kind])}</Badge>
                        <Text size="caption" tone="muted" mono inline>
                          {cardSummary(c, project)}
                        </Text>
                      </Stack>
                      <Stack direction="row" gap={1} wrap>
                        <IconButton icon="up" label={t('উপরে সরান')} disabled={i === 0} onClick={() => move(i, -1)} />
                      <IconButton icon="down" label={t('নিচে সরান')} disabled={i === cards.length - 1} onClick={() => move(i, 1)} />
                        <Button variant="danger-text" size="small" onClick={() => setCards((cs) => cs.filter((_, k) => k !== i))}>
                          {t('সরান')}
                        </Button>
                      </Stack>
                    </Stack>
                    <Grid columns={{ xs: 1, sm: 2 }} gap={1.5}>
                      <TextField label={t('লেবেল (বাংলা)')} invalid={!c.label_bn.trim()} value={c.label_bn} onChange={(v) => update(i, { label_bn: v })} maxLength={60} />
                      <TextField label={t('লেবেল (ইংরেজি)')} value={c.label_en} onChange={(v) => update(i, { label_en: v })} maxLength={60} />
                    </Grid>
                    <Checkbox
                      label={t('হোম পেইজের কার্ডে দেখান')}
                      hint={!c.home && homes >= MAX_HOME ? t('(হোমে সর্বোচ্চ ৩টি)') : undefined}
                      checked={!!c.home}
                      disabled={!c.home && homes >= MAX_HOME}
                      onChange={(checked) => update(i, { home: checked })}
                    />
                    {c.home && (
                      <Grid columns={{ xs: 1, sm: 2 }} gap={1.5}>
                        <TextField label={t('হোমের লেবেল (বাংলা, ঐচ্ছিক)')} value={c.home_label_bn ?? ''} placeholder={c.label_bn} onChange={(v) => update(i, { home_label_bn: v })} maxLength={60} />
                        <TextField label={t('হোমের লেবেল (ইংরেজি, ঐচ্ছিক)')} value={c.home_label_en ?? ''} placeholder={c.label_en} onChange={(v) => update(i, { home_label_en: v })} maxLength={60} />
                      </Grid>
                    )}
                    <RadioGroup
                      label={t('আইকন')}
                      hideLabel
                      direction="row"
                      value={c.icon ?? ''}
                      onChange={(v) => update(i, { icon: v as StatIconKey })}
                      options={(Object.keys(STAT_ICONS) as StatIconKey[]).map((k) => ({
                        value: k,
                        label: (
                          <Stack direction="row" gap={0.5} align="center">
                            <StatIcon icon={k} width={20} height={20} aria-hidden="true" />
                            {pick(STAT_ICONS[k].label_bn, STAT_ICONS[k].label_en)}
                          </Stack>
                        ),
                      }))}
                    />
                  </Stack>
                </Card>
              </Stack>
            ))}
          </Stack>
          {cards.length < MAX_CARDS ? (
            <StatCardPicker project={project} cards={cards} disabled={busy} onAdd={(c) => setCards((cs) => [...cs, c])} />
          ) : (
            <Text size="small" tone="warning">
              {t('সর্বোচ্চ ৮টি কার্ড — নতুন যোগ করতে একটি সরান।')}
            </Text>
          )}
        </Stack>
      </Card>

      {error && <Alert tone="error">{error}</Alert>}
      {missingLabel && (
        <Text size="small" tone="error">
          {t('প্রতিটি কার্ডে বাংলা লেবেল দিন।')}
        </Text>
      )}
      <Stack direction="row" gap={1.5} align="center" wrap>
        <Button disabled={busy || blocked || !dirty || missingLabel} onClick={() => void save()}>
          {busy ? t('সংরক্ষণ হচ্ছে…') : t('কার্ড সংরক্ষণ করুন')}
        </Button>
        <Button variant="secondary" disabled={busy || !dirty} onClick={() => setCards(structuredClone(project.stat_cards))}>
          {t('পরিবর্তন বাতিল')}
        </Button>
        {dirty && (
          <Text size="small" tone="warning" inline>
            {t('সংরক্ষণ হয়নি এমন পরিবর্তন আছে')}
          </Text>
        )}
      </Stack>
    </Stack>
  )
}
