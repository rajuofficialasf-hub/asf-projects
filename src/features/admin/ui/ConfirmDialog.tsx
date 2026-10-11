import { t } from '@/i18n'
import type { ReactNode } from 'react'
import { Button, Dialog } from '@/ui'

interface Props {
  open: boolean
  title: string
  children?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** danger: লাল বাটন (ডিলেট) */
  tone?: 'danger' | 'primary'
  busy?: boolean
  /** confirm বাটন নিষ্ক্রিয় (যেমন ইনপুট অবৈধ) */
  confirmDisabled?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * এডমিনের নিশ্চিতকরণ ডায়ালগ (পাবলিক ConfirmDialog-এর একই props ও আচরণ): Esc/ব্যাকড্রপে বাতিল (কাজ চলাকালে নয়),
 * ফোকাস বাতিল-বাটনে (ভুল ক্লিক এড়াতে)।
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = t('নিশ্চিত'),
  cancelLabel = t('বাতিল'),
  tone = 'primary',
  busy = false,
  confirmDisabled = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Dialog
      open={open}
      onClose={() => !busy && onCancel()}
      title={title}
      size="small"
      actions={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={busy} autoFocus>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy || confirmDisabled}>
            {busy ? t('অপেক্ষা করুন…') : confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  )
}
