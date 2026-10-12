import { lt, pick, t } from '@/i18n'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { getProjectsApi, HousingApiError, type GeoDepth, type PhotoMode, type Project } from '@/backend'
import { ACCENTS, refreshProjects } from '@/features/projects/registry'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { keyError, keyFromSlug, photoNameExample, prefixError, slugError, slugify, suggestPrefix, friendlyProjectError } from '../projects/projectRules'
import { PROJECT_TEMPLATES, buildProjectInput, templateOf, type TemplateKey } from '../projects/projectTemplates'
import { Alert, Breadcrumbs, Button, Grid, LinkButton, Page, RadioGroup, SelectField, Stack, Text, TextField, useToast } from '@/ui'
import { Step } from '../ui/Step'
import { focusFirstInvalid } from '../ui/focusFirstInvalid'
import { AccentSwatch } from '../ui/AccentSwatch'

type Location = 'single' | 'child' | 'group'

const PHOTO_MODES: { value: PhotoMode; label: string }[] = [
  { value: 'before_after', label: 'আগে-পরে (দুটি ছবি, তুলনাসহ)' },
  { value: 'after_only', label: 'শুধু পরের ছবি (একটি)' },
  { value: 'none', label: 'ছবি নেই' },
]

/**
 * /admin/projects/new — নতুন প্রকল্প উইজার্ড (পরিকল্পনা M-ধাপ ৭): টেমপ্লেট → অবস্থান (একক / গ্রুপের উপ-প্রকল্প / নতুন গ্রুপ)
 * → নাম (দুই ভাষা) → URL (ইংরেজি নাম থেকে, সাথে সাথে যাচাই ও প্রিভিউ) → key (শুধু দেখার) → ফাইল-প্রিফিক্স (উদাহরণসহ)
 * → ছবি মোড, ঠিকানার স্তর, আইকন, রং → "খসড়া হিসেবে তৈরি করুন" (project_create — প্রকল্প + টেমপ্লেটের ফিল্ড একসাথে)।
 */
export function ProjectWizardPage() {
  useDocumentTitle(t('নতুন প্রকল্প'))
  const navigate = useNavigate()
  const toast = useToast()
  const [existing, setExisting] = useState<Project[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [template, setTemplate] = useState<TemplateKey>('grant')
  const [location, setLocation] = useState<Location>('single')
  const [parentKey, setParentKey] = useState('')
  const [nameBn, setNameBn] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [prefix, setPrefix] = useState('')
  const [prefixTouched, setPrefixTouched] = useState(false)
  const tpl = templateOf(template)
  const [photoMode, setPhotoMode] = useState<PhotoMode>(tpl.photo_mode)
  const [geoDepth, setGeoDepth] = useState<GeoDepth>(tpl.geo_depth)
  const [icon, setIcon] = useState(tpl.icon)
  const [accent, setAccent] = useState(tpl.accent)
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  // খসড়াসহ সব প্রকল্প (key/slug/প্রিফিক্সের অনন্যতা যাচাই, গ্রুপের তালিকা) — সবসময় তাজা
  useEffect(() => {
    let alive = true
    getProjectsApi()
      .list({ includeDrafts: true })
      .then((list) => alive && setExisting(list))
      .catch((err: unknown) => alive && setLoadError(HousingApiError.from(err).message))
    return () => {
      alive = false
    }
  }, [])

  const projects = useMemo(() => existing ?? [], [existing])
  const groups = projects.filter((p) => p.is_group)
  const isGroup = location === 'group'

  /** টেমপ্লেটের শুরুর মান বসানো (অবস্থান না ছুঁয়ে) */
  const applyTemplate = (k: TemplateKey) => {
    const next = templateOf(k)
    setTemplate(k)
    setPhotoMode(next.photo_mode)
    setGeoDepth(next.geo_depth)
    setIcon(next.icon)
    setAccent(next.accent)
  }
  // "গ্রুপ" টেমপ্লেট ⇔ "নতুন প্রকল্প-গ্রুপ" অবস্থান — দুটো সবসময় একসাথে
  const chooseTemplate = (k: TemplateKey) => {
    applyTemplate(k)
    if (templateOf(k).is_group) setLocation('group')
    else if (location === 'group') setLocation('single')
  }
  const chooseLocation = (l: Location) => {
    setLocation(l)
    if (l === 'group' && template !== 'group') applyTemplate('group')
    if (l !== 'group' && template === 'group') applyTemplate('grant')
  }

  // ইংরেজি নাম থেকে স্বয়ংক্রিয় slug ও প্রিফিক্স (নিজে বদলালে আর বদলায় না)
  const effectiveSlug = slugTouched ? slug : slugify(nameEn)
  const key = keyFromSlug(effectiveSlug)
  const effectivePrefix = prefixTouched ? prefix : suggestPrefix(effectiveSlug)
  const parent = groups.find((g) => g.key === parentKey)
  const urlPreview = location === 'child' && parent ? `/${parent.slug}/${effectiveSlug || '…'}` : `/${effectiveSlug || '…'}`

  const errors = {
    parent: location === 'child' && !parent ? t('গ্রুপ বাছাই করুন') : null,
    nameBn: !nameBn.trim() ? t('বাংলা নাম দিন') : nameBn.trim().length > 120 ? t('সর্বোচ্চ ১২০ অক্ষর') : null,
    nameEn: !nameEn.trim() ? t('ইংরেজি নাম দিন (URL এখান থেকে তৈরি হয়)') : nameEn.trim().length > 120 ? t('সর্বোচ্চ ১২০ অক্ষর') : null,
    slug: slugError(effectiveSlug, projects),
    key: effectiveSlug ? keyError(key, projects) : null,
    prefix: isGroup ? null : prefixError(effectivePrefix, projects),
  }
  const hasErrors = Object.values(errors).some(Boolean)
  const show = (e: string | null) => (submitted ? e : null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setServerError(null)
    if (hasErrors) focusFirstInvalid(e.currentTarget as HTMLFormElement)
    if (hasErrors || !existing || busy) return
    setBusy(true)
    const { project: input, fields } = buildProjectInput({
      template,
      location,
      parentKey: location === 'child' ? parentKey : null,
      key,
      slug: effectiveSlug,
      name_bn: nameBn,
      name_en: nameEn,
      file_prefix: effectivePrefix,
      photo_mode: photoMode,
      geo_depth: geoDepth,
      icon,
      accent,
    })
    try {
      const created = await getProjectsApi().create(input, fields)
      await refreshProjects({ includeDrafts: true })
      toast.success(t('«{name}» খসড়া হিসেবে তৈরি হয়েছে', { name: lt(created, 'name') }))
      navigate(`/admin/projects/${encodeURIComponent(created.key)}`)
    } catch (err) {
      setServerError(friendlyProjectError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Page
      title={t('নতুন প্রকল্প')}
      documentTitle={false}
      description={t('খসড়া হিসেবে তৈরি হবে — প্রকাশ না করা পর্যন্ত দর্শকেরা দেখতে পান না। পরে সব বদলানো যাবে (key ছাড়া)।')}
      breadcrumbs={<Breadcrumbs label={t('প্রকল্পসমূহ')} items={[{ label: t('প্রকল্পসমূহ'), to: '/admin/projects' }, { label: t('নতুন প্রকল্প') }]} />}
    >
      <Stack gap={3}>
        {loadError && <Alert tone="error">{loadError}</Alert>}

        <form onSubmit={(e) => void submit(e)} noValidate>
          <Stack gap={3}>
            <Step n={1} title={t('টেমপ্লেট')} hint={t('শুধু শুরুর সেটিং — তৈরির পর ফিল্ড, কার্ড সব বদলানো যায়')}>
              <RadioGroup
                label={t('টেমপ্লেট')}
                hideLabel
                look="cards"
                direction="row"
                name="tpl"
                value={template}
                onChange={(v) => chooseTemplate(v as TemplateKey)}
                options={PROJECT_TEMPLATES.map((x) => ({ value: x.key, label: pick(x.label_bn, x.label_en), hint: pick(x.hint_bn, x.hint_en) }))}
              />
            </Step>

            <Step n={2} title={t('অবস্থান')}>
              <RadioGroup
                label={t('অবস্থান')}
                hideLabel
                look="cards"
                name="loc"
                value={location}
                onChange={(v) => chooseLocation(v as Location)}
                options={(
                  [
                    ['single', t('একক প্রকল্প'), t('নিজের পেইজ, যেমন /self-reliance')],
                    ['child', t('কোনো গ্রুপের উপ-প্রকল্প'), t('যেমন ঘর নির্মাণের ভেতরে "ঘর মেরামত" — /housing/…')],
                    ['group', t('নতুন প্রকল্প-গ্রুপ'), t('কয়েকটি প্রকল্পের ছাতা; নিজের রেকর্ড থাকে না')],
                  ] as const
                ).map(([v, label, hint]) => ({ value: v, label, hint }))}
              />
              {location === 'child' && (
                <SelectField
                  label={t('গ্রুপ')}
                  required
                  error={show(errors.parent) ?? undefined}
                  value={parentKey}
                  onChange={setParentKey}
                  options={[
                    { value: '', label: t('— বাছাই করুন —') },
                    ...groups.map((g) => ({ value: g.key, label: `${lt(g, 'name')} (/${g.slug})` })),
                  ]}
                />
              )}
            </Step>

            <Step n={3} title={t('নাম')} hint={t('দুই ভাষাতেই আবশ্যক — ইংরেজি মোডে ইংরেজি নাম দেখায়')}>
              <Grid columns={{ xs: 1, sm: 2 }} gap={2}>
                <TextField label={t('বাংলা নাম')} required error={show(errors.nameBn) ?? undefined} value={nameBn} onChange={setNameBn} placeholder={t('যেমন স্বাবলম্বী প্রকল্প')} maxLength={120} />
                <TextField label={t('ইংরেজি নাম')} required error={show(errors.nameEn) ?? undefined} value={nameEn} onChange={setNameEn} placeholder="Self-Reliance Project" maxLength={120} />
              </Grid>
            </Step>

            <Step n={4} title={t('URL ও key')}>
              <TextField
                mono
                label={t('URL অংশ (slug)')}
                required
                error={(effectiveSlug || submitted ? errors.slug : null) ?? undefined}
                hint={t('ইংরেজি নাম থেকে নিজে তৈরি হয়; চাইলে ছোট করুন। প্রকাশের পর আর বদলানো যায় না (শেয়ার করা লিংক ভাঙবে)।')}
                value={effectiveSlug}
                onChange={(value) => {
                  setSlugTouched(true)
                  setSlug(value.toLowerCase())
                }}
                placeholder="self-reliance"
                maxLength={60}
              />
              <Text size="small" tone="muted">
                {t('পেইজের ঠিকানা:')}{' '}
                <Text size="small" weight="bold" mono inline>
                  {urlPreview}
                </Text>
              </Text>
              <Stack gap={1}>
                <Text size="small">
                  <Text size="small" tone="muted" inline>
                    {t('স্থায়ী key:')}
                  </Text>{' '}
                  <Text size="small" weight="bold" mono inline>
                    {key || '—'}
                  </Text>{' '}
                  <Text size="caption" tone="warning" inline>
                    {t('(পরে বদলানো যাবে না — সিরিয়াল, ছবির পাথ ও লগ এর ওপর নির্ভর করে)')}
                  </Text>
                </Text>
                {errors.key && (effectiveSlug || submitted) && <Alert tone="error">{errors.key}</Alert>}
              </Stack>
            </Step>

            {!isGroup && (
              <Step n={5} title={t('ছবি ও ঠিকানা')}>
                <SelectField
                  label={t('ছবি মোড')}
                  value={photoMode}
                  onChange={(value) => setPhotoMode(value as PhotoMode)}
                  options={PHOTO_MODES.map((m) => ({ value: m.value, label: t(m.label) }))}
                />
                <TextField
                  mono
                  label={t('ছবির ফাইল-প্রিফিক্স')}
                  required
                  error={(submitted || prefixTouched ? errors.prefix : null) ?? undefined}
                  hint={t('বাল্ক ছবি আপলোডে ফাইলনাম চেনার জন্য। উদাহরণ (সিরিয়াল ১২): {example}', { example: photoNameExample(effectivePrefix, photoMode) })}
                  value={effectivePrefix}
                  onChange={(value) => {
                    setPrefixTouched(true)
                    setPrefix(value.toLowerCase())
                  }}
                  maxLength={16}
                />
                <SelectField
                  label={t('ঠিকানা কোন স্তর পর্যন্ত')}
                  value={geoDepth}
                  onChange={(value) => setGeoDepth(value as GeoDepth)}
                  options={[
                    { value: 'upazila', label: t('উপজেলা পর্যন্ত') },
                    { value: 'union', label: t('ইউনিয়ন পর্যন্ত (ইউনিয়ন আবশ্যক নয়)') },
                  ]}
                />
              </Step>
            )}

            {/* আইকন বাছাই নেই (ব্যবহারকারীর সিদ্ধান্ত, ২০২৬-১০-০৭) — ডাটাবেসের icon কলামে টেমপ্লেটের মানই যায়, কোথাও দেখানো হয় না */}
            <Step n={isGroup ? 5 : 6} title={t('রং')}>
              <RadioGroup
                label={t('রং')}
                hideLabel
                look="cards"
                direction="row"
                value={accent}
                onChange={setAccent}
                options={(Object.keys(ACCENTS) as (keyof typeof ACCENTS)[]).map((k) => ({
                  value: k,
                  label: <AccentSwatch accent={k} />,
                }))}
              />
            </Step>

            {(serverError || (submitted && hasErrors)) && <Alert tone="error">{serverError ?? t('উপরের লাল চিহ্নিত ঘরগুলো ঠিক করুন।')}</Alert>}
            <Stack direction="row" gap={1.5} wrap>
              <Button type="submit" disabled={busy || !existing}>
                {busy ? t('তৈরি হচ্ছে…') : t('খসড়া হিসেবে তৈরি করুন')}
              </Button>
              <LinkButton to="/admin/projects" variant="secondary">
                {t('বাতিল')}
              </LinkButton>
            </Stack>
          </Stack>
        </form>
      </Stack>
    </Page>
  )
}
