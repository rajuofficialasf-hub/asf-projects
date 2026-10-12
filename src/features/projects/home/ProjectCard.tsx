import { lt, pick, t } from '@/i18n'
import { Link } from 'react-router'
import type { ProjectOverviewItem } from '@/backend'
import { accentOf, StatIcon, useProject } from '@/features/projects/registry'
import { cardValue, homeCards, homeLabel } from '@/features/projects/stats/statCards'
import { photoSrc } from '@/features/housing/utils/imagePath'
import { projectPath } from '@/features/housing/utils/housingProjects'
import { SafeImage } from '@/features/housing/components/SafeImage'
import { coverIcon, coverSrc } from './cover'
import { StatTile } from './StatTile'

interface Props {
  item: ProjectOverviewItem
  /** গ্রুপ হলে প্রকাশিত উপ-প্রকল্প (চিপ) */
  subProjects?: ProjectOverviewItem[]
}

/** স্ট্যাটের ঘরের কলাম (Tailwind পুরো ক্লাসের নাম দেখতে চায়) */
const STAT_COLS: Record<number, string> = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3' }

/**
 * হোম পেইজের প্রকল্প-কার্ড (M-ধাপ ১৫) — সব তথ্য projects_overview() এর একটি সারি থেকে (আলাদা কল নয়):
 *   ছবি: কভার → সর্বশেষ রেকর্ডের থাম্ব → প্রকল্পের রঙে গ্রেডিয়েন্ট + বড় আইকন (নাম নিচে শিরোনামেই — দুবার নয়)
 *   নাম ও ছোট বর্ণনা (pick), `home: true` কার্ডের ২–৩টি সংখ্যা (টাকা ৳), গ্রুপে উপ-প্রকল্পের চিপ, "প্রকল্প দেখুন"
 */
export function ProjectCard({ item, subProjects = [] }: Props) {
  const accent = accentOf(item.accent)
  // কভারের ক্যাশ-ভাঙার জন্য updated_at রেজিস্ট্রি থেকে (ওভারভিউতে নেই)
  const registered = useProject(item.key)
  const name = lt(item, 'name')
  const summary = lt(item, 'summary')
  const cover = coverSrc(item.cover_path, registered?.updated_at)
  const thumb = item.featured ? photoSrc(item.featured.thumb_url, item.featured.photo_updated_at) : null
  const cards = homeCards(item)
  const href = projectPath(item.key)

  return (
    <article data-project-card={item.key} className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-200/70 transition hover:shadow-lg">
      {/* ---------- ছবি ---------- */}
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
        {cover || thumb ? (
          <>
            <SafeImage
              src={cover ?? thumb}
              alt={cover ? name : t('{name} — {project}', { name: item.featured?.name ?? '', project: name })}
              className="h-full w-full object-cover"
              placeholderClassName="h-full w-full"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent" aria-hidden="true" />
          </>
        ) : (
          <div data-cover-fallback="" className={`flex h-full w-full items-center justify-center bg-gradient-to-br text-white ${accent.gradient}`} aria-hidden="true">
            <StatIcon icon={coverIcon(item.icon)} className="h-20 w-20 opacity-90 drop-shadow-sm" />
          </div>
        )}
      </div>

      {/* ---------- লেখা ---------- */}
      <div className="flex flex-1 flex-col px-5 pt-4 pb-5">
        <h3 className="text-xl leading-snug font-bold text-slate-900">{name}</h3>
        {summary && <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-slate-600">{summary}</p>}

        {subProjects.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={t('উপ-প্রকল্প')}>
            {subProjects.map((c) => (
              <li key={c.key}>
                <Link
                  to={projectPath(c.key)}
                  // চোখে ছোট চিপ, চাপার জায়গা ৪৪px (after:)
                  className={`relative inline-flex min-h-9 items-center rounded-full px-3 py-1 text-xs font-medium transition after:absolute after:inset-x-0 after:-inset-y-1 hover:brightness-95 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:outline-none ${accent.soft}`}
                >
                  {lt(c, 'name')}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {cards.length > 0 && (
          <dl className={`mt-4 grid gap-2 ${STAT_COLS[cards.length] ?? 'grid-cols-3'}`}>
            {cards.map((c, i) => (
              <StatTile key={c.id} label={homeLabel(c)} value={cardValue(c, item.stats)} money={c.format === 'money'} strong={i === 0} solid={accent.solid} soft={accent.soft} />
            ))}
          </dl>
        )}

        <div className="mt-auto pt-5">
          <Link
            to={href}
            aria-label={pick(item.name_bn, item.name_en) + ' — ' + t('প্রকল্প দেখুন')}
            className={`inline-flex min-h-11 items-center gap-2 rounded-md border-2 px-4 py-2 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:outline-none ${accent.outline}`}
          >
            {t('প্রকল্প দেখুন')}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  )
}

/** লোডের সময় কার্ডের কাঠামো */
export function ProjectCardSkeleton() {
  return (
    <div className="flex h-full animate-pulse flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-200/70" aria-hidden="true">
      <div className="aspect-[16/9] bg-slate-200" />
      <div className="flex flex-1 flex-col px-5 pb-5">
        <div className="mt-4 h-6 w-2/3 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-full rounded bg-slate-100" />
        <div className="mt-1 h-4 w-4/5 rounded bg-slate-100" />
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="h-14 rounded-xl bg-slate-200" />
          <div className="h-14 rounded-xl bg-slate-100" />
          <div className="h-14 rounded-xl bg-slate-100" />
        </div>
        <div className="mt-5 h-11 w-36 rounded-md bg-slate-200" />
      </div>
    </div>
  )
}
