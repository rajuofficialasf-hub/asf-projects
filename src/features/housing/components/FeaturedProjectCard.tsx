import { t, gn, lt } from '@/i18n'
import { Link } from 'react-router'
import { toBanglaNumber } from '@/lib/banglaNumber'
import type { HousingRecord, Project } from '../../../backend/interfaces/types'
import { cardValue, homeCards, homeLabel } from '@/features/projects/stats/statCards'
import { useFeaturedRecord } from '../hooks/useFeaturedRecord'
import { useHousingStats } from '../hooks/useHousingStats'
import { photoSrc } from '../utils/imagePath'
import { accentOf, StatIcon } from '@/features/projects/registry'
import { StatTile } from '@/features/projects/home/StatTile'
import { coverIcon } from '@/features/projects/home/cover'
import { projectPath } from '../utils/housingProjects'
import { SafeImage } from './SafeImage'

interface Props {
  project: Project
}

/**
 * হোম পেইজের "সফলতার গল্প"-স্টাইল কার্ড: বামে উপকারভোগীর ছবি (বর্তমান ঘর; না থাকলে পূর্বের; না থাকলে আইকন),
 * ডানে তিনটি পরিসংখ্যান টাইল (মোট ঘর, জেলা কভার, উপজেলা কভার — HousingApi.stats, count-up) + "আরো দেখুন" (→ তালিকা),
 * নিচে সোনালি বারে নাম, ঠিকানা, প্রকল্প/সাল ও সিরিয়াল।
 * ডাটা: প্রকল্পের প্রথম উপকারভোগী (সিরিয়াল ১)। ডাটা না থাকলে/এরর হলে শুধু প্রকল্পের বর্ণনা।
 */
export function FeaturedProjectCard({ project }: Props) {
  const state = useFeaturedRecord(project.key)
  const stats = useHousingStats(project.key)
  const title = lt(project, 'name')
  const record = state.status === 'ready' ? state.record : null
  const listPath = projectPath(project)
  const photo = record ? photoSrc(record.current_photo_url ?? record.prev_photo_url, record.photo_updated_at) : null
  // টাইল প্রকল্পের কনফিগ থেকে (M-ধাপ ১৫): `home: true` কার্ড, লেবেল home_label → label; ঘর নির্মাণে আগের তিনটি হুবহু
  const cards = homeCards(project)
  const accent = accentOf(project.accent)

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-200/70">
      <div className="flex flex-1 flex-col gap-5 p-5 sm:flex-row sm:p-6">
        {/* ছবি */}
        <div className="shrink-0">
          {state.status === 'loading' ? (
            <div className="aspect-square w-full animate-pulse rounded-xl bg-slate-200 sm:w-44" aria-busy="true" />
          ) : photo ? (
            <SafeImage
              src={photo}
              alt={`${record!.name} — ${title}`}
              className="aspect-square w-full rounded-xl object-cover sm:w-44"
              placeholderClassName="aspect-square w-full rounded-xl sm:w-44"
            />
          ) : (
            // ছবি নেই: প্রকল্পের রঙ ও আইকন (নাম পাশেই শিরোনামে — দুবার নয়); ফোনে চওড়া ফিতা, পুরো বর্গ নয়
            <div className={`flex aspect-[3/1] w-full items-center justify-center rounded-xl bg-gradient-to-br text-white sm:aspect-square sm:w-44 ${accent.gradient}`} aria-hidden="true">
              <StatIcon icon={coverIcon(project.icon)} className="h-14 w-14 opacity-90 drop-shadow-sm sm:h-16 sm:w-16" />
            </div>
          )}
        </div>

        {/* লেখা */}
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          {cards.length > 0 && (
            <dl className={`mt-3 grid flex-1 ${TILE_COLS[cards.length] ?? 'grid-cols-3'} gap-2`}>
              {cards.map((c, i) => (
                <StatTile key={c.id} label={homeLabel(c)} value={stats.status === 'ready' ? cardValue(c, stats.data) : null} loading={stats.status === 'loading'} money={c.format === 'money'} strong={i === 0} solid={accent.solid} soft={accent.soft} />
              ))}
            </dl>
          )}
          <div className="mt-4">
            <Link
              to={listPath}
              className={`inline-flex min-h-11 items-center gap-2 rounded-md border-2 px-4 py-2 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:outline-none ${accent.outline}`}
              aria-label={`${title} — ${t('আরো দেখুন')}`}
            >
              {t('আরো দেখুন')}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* নিচের সোনালি বার */}
      <FeaturedBar record={record} project={project} loading={state.status === 'loading'} />
    </article>
  )
}

/** টাইলের কলাম (Tailwind পুরো ক্লাসের নাম দেখতে চায়) */
const TILE_COLS: Record<number, string> = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3' }

function FeaturedBar({ record, project, loading }: { record: HousingRecord | null; project: Project; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid animate-pulse gap-3 bg-accent-500/90 px-5 py-4 sm:grid-cols-3 sm:px-6" aria-hidden="true">
        <div className="h-6 rounded bg-accent-600/40" />
        <div className="h-6 rounded bg-accent-600/40" />
        <div className="h-6 rounded bg-accent-600/40" />
      </div>
    )
  }
  if (!record) {
    return (
      <div className="bg-accent-500 px-5 py-4 text-sm font-medium text-brand-950 sm:px-6">
        {t('{title} — উপকারভোগীদের তালিকা দেখতে "আরো দেখুন" চাপুন।', { title: lt(project, 'name') })}
      </div>
    )
  }
  return (
    <dl className="grid gap-3 bg-accent-500 px-5 py-4 text-brand-950 sm:grid-cols-[1.2fr_1fr_1fr] sm:items-center sm:px-6">
      <div className="min-w-0">
        <dt className="sr-only">{t('উপকারভোগী')}</dt>
        <dd className="text-lg font-bold break-words">
          {record.name}
        </dd>
      </div>
      <div className="min-w-0 text-sm leading-snug">
        <dt className="sr-only">{t('ঠিকানা')}</dt>
        <dd className="font-medium break-words">{record.father_or_husband_name ? t('পিতা/স্বামী: {name}', { name: record.father_or_husband_name }) : record.address || '—'}</dd>
        <dd className="break-words">
          {gn(record.upazila)}, {gn(record.district)}
        </dd>
      </div>
      <div className="min-w-0 text-sm leading-snug">
        <dt className="sr-only">{t('প্রকল্প ও সিরিয়াল')}</dt>
        <dd className="font-medium break-words">
          {lt(project, 'name')} {toBanglaNumber(record.year)}
        </dd>
        <dd>
          {t('সিরিয়াল নম্বর:')} <span className="font-semibold">{toBanglaNumber(record.serial_no)}</span>
        </dd>
      </div>
    </dl>
  )
}
