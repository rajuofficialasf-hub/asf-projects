import { t, useLang, type Lang } from '@/i18n'
import { ToggleGroup } from '@/ui'

/** এডমিনের ভাষা বদল (বাং/EN) — পাবলিক হেডারের LanguageToggle-এর মতোই কাজ, এডমিনের চেহারায় */
export function LanguageSwitch() {
  const { lang, setLang } = useLang()
  return (
    <ToggleGroup
      label={t('ভাষা')}
      value={lang}
      onChange={(l) => setLang(l as Lang)}
      options={[
        { value: 'bn', label: 'বাং', lang: 'bn' },
        { value: 'en', label: 'EN', lang: 'en' },
      ]}
    />
  )
}
