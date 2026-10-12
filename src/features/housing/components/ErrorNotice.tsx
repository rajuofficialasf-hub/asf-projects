import { getLang, t } from '@/i18n'
import type { HousingApiError } from '../../../backend/interfaces/types'

interface Props {
  title: string
  error: HousingApiError
}

/**
 * পাবলিক সাইটের এরর বার্তা (কারণভেদে ইঙ্গিত)। দর্শকের জন্য লেখা — ডেভেলপারের ইঙ্গিত (যেমন .env.local) এখানে নয়, সেটা এডমিনের ErrorNotice-এ।
 * সার্ভারের নিজের বার্তা বাংলায় আসে, তাই ইংরেজি মোডে সাধারণ বার্তা দেখায়।
 */
export function ErrorNotice({ title, error }: Props) {
  const hint =
    error.code === 'NETWORK_ERROR'
      ? t('ইন্টারনেট সংযোগ বা সার্ভারে সমস্যা।')
      : error.code === 'CONFIG_ERROR' || error.code === 'NOT_IMPLEMENTED' || getLang() === 'en'
        ? t('এই মুহূর্তে তথ্য দেখানো যাচ্ছে না। কিছুক্ষণ পরে আবার চেষ্টা করুন।')
        : null
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <p className="font-semibold">{title}</p>
      <p className="mt-1">{hint ?? error.message}</p>
    </div>
  )
}
