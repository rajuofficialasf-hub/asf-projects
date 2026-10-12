import { t } from '@/i18n'

/**
 * লগে কে করেছে: এডমিনের ইমেইল, অথবা সার্ভারের কমান্ড (npm run admin, মাইগ্রেশন) চালালে ডাটাবেসের রোলের নাম
 * (housing_owner, postgres) আসে — সেটি মানুষের নাম নয়, তাই "সার্ভার কমান্ড" দেখায়।
 */
export function actorLabel(actor: string | null): string {
  if (!actor) return t('অজানা')
  return actor.includes('@') ? actor : t('সার্ভার কমান্ড')
}
