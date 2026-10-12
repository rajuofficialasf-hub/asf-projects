import { t } from '@/i18n'
import type { HousingApiError } from '@/backend'
import { Alert } from '@/ui'

/** অ্যাডাপ্টারের এরর → বাংলা বার্তা (কারণভেদে ইঙ্গিত); পাবলিক ErrorNotice-এর একই কথা, এডমিনের চেহারায় */
export function ErrorNotice({ title, error }: { title: string; error: HousingApiError }) {
  const hint =
    error.code === 'CONFIG_ERROR'
      ? t('ব্যাকএন্ড সংযোগ কনফিগার করা হয়নি (.env.local দেখুন)।')
      : error.code === 'NETWORK_ERROR'
        ? t('ইন্টারনেট সংযোগ বা সার্ভারে সমস্যা।')
        : error.code === 'NOT_IMPLEMENTED'
          ? t('এই ব্যাকএন্ড অ্যাডাপ্টার এখনো তৈরি হয়নি।')
          : null
  return (
    <Alert tone="error" title={title}>
      {hint ?? error.message}
    </Alert>
  )
}
