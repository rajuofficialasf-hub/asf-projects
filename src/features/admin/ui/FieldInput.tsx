import { formatTaka } from '@/lib/money'
import { parseField, type FieldDef } from '@/features/projects/fields'
import { TextField, type TextFieldProps } from '@/ui'

interface Props {
  def: FieldDef
  /** ঘরের লেবেল (অ্যাক্সেসিবল নামও); আবশ্যক হলে ডাকার জায়গা নিজেই " *" জুড়ে দেয়, তাই এখানে আলাদা তারকা নেই */
  label: string
  /** ফর্মের লেখা (fieldSpec(type).toInput দিয়ে বানানো) */
  value: string
  onChange: (raw: string) => void
  error?: string
  hint?: string
  disabled?: boolean
  /** ক্যাটাগরি: ডাটায় থাকা মানগুলো (পরামর্শ; নিজে লেখাও চলে) */
  suggestions?: readonly string[]
}

/**
 * এডমিনের ফিল্ড-ধরনভিত্তিক ঘর — পাবলিক fieldComponents-এর একই নিয়ম: সংখ্যা/টাকা/ফোন type="text" (বাংলা অঙ্ক, কমা, ৳
 * লেখা যায়; জমার আগে parseField), মোবাইলে মানানসই কীবোর্ড, ধরনভেদে সর্বোচ্চ দৈর্ঘ্য, ক্যাটাগরিতে সাজেশন,
 * টাকায় পাশে সাথে সাথে "৳ ১,২০,০০০"।
 */
export function FieldInput({ def, label, value, onChange, error, hint, disabled, suggestions }: Props) {
  const base: TextFieldProps = { label, value, onChange, error, hint, disabled }
  switch (def.type) {
    case 'long_text':
      return <TextField {...base} rows={3} maxLength={def.max_length ?? 2000} />
    case 'number':
      return <TextField {...base} inputMode={def.integer ? 'numeric' : 'decimal'} autoComplete="off" />
    case 'money': {
      const r = value.trim() ? parseField({ ...def, required: false }, value) : null
      const preview = r && r.ok && typeof r.value === 'number' ? formatTaka(r.value) : null
      return <TextField {...base} inputMode="numeric" autoComplete="off" suffix={preview} />
    }
    case 'category':
      return <TextField {...base} maxLength={def.max_length ?? 100} suggestions={suggestions} />
    case 'date':
      return <TextField {...base} type="date" />
    case 'phone':
      return <TextField {...base} type="tel" inputMode="tel" autoComplete="off" maxLength={20} />
    default:
      return <TextField {...base} maxLength={def.max_length ?? 500} />
  }
}
