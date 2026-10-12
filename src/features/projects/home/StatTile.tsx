import { t } from '@/i18n'
import { formatBanglaNumber } from '@/lib/banglaNumber'
import { formatTaka } from '@/lib/money'
import { useCountUp } from '@/features/housing/hooks/useCountUp'

/**
 * প্রকল্প-কার্ডের ছোট পরিসংখ্যান টাইল — হোমের কার্ড ও গ্রুপ-ল্যান্ডিংয়ের কার্ড একই টাইল ব্যবহার করে।
 * বড় সংখ্যা (count-up; টাকা ৳) + লেবেল; প্রথমটি গাঢ় (`strong`); লোডে স্কেলেটন; ডাটা না এলে "—"।
 * `solid`/`soft`: প্রকল্পের রঙের ক্লাস (accents.ts)।
 */
export function StatTile({
  label,
  value,
  loading = false,
  money = false,
  strong,
  solid,
  soft,
}: {
  label: string
  value: number | null
  loading?: boolean
  money?: boolean
  strong: boolean
  solid: string
  soft: string
}) {
  const shown = useCountUp(value ?? 0)
  const fmt = money ? formatTaka : formatBanglaNumber
  return (
    <div className={`flex min-w-0 flex-col items-center justify-center rounded-xl px-2 py-3 text-center ${strong ? solid : soft}`}>
      {loading ? (
        <dd className={`h-7 w-10 animate-pulse rounded ${strong ? 'bg-white/30' : 'bg-current/15'}`} aria-busy="true" />
      ) : (
        <dd className={`${money ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'} leading-none font-bold break-words tabular-nums`} aria-label={`${label}: ${value === null ? t('অজানা') : fmt(value)}`}>
          {value === null ? '—' : fmt(Math.round(shown))}
        </dd>
      )}
      <dt className="mt-1.5 text-xs leading-tight font-medium">{label}</dt>
    </div>
  )
}
