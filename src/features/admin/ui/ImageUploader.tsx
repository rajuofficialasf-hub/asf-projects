import { t } from '@/i18n'
import type { ReactNode } from 'react'
import { toBanglaNumber } from '@/lib/banglaNumber'
import { formatBytes } from '@/features/housing/utils/imageProcessing'
import { PHOTO_SPEC } from '@/features/housing/utils/photoSpec'
import { STATUS_LABEL, type UploadItem, type UploadStatus } from '@/features/housing/utils/uploadItems'
import { Badge, FileInput, IconButton, ProgressBar, Stack, Text, type BadgeProps } from '@/ui'

interface Props {
  items: UploadItem[]
  onAdd: (files: File[]) => void
  onRemove?: (id: string) => void
  multiple?: boolean
  disabled?: boolean
  /** ড্রপ-জোনের নিচের ইঙ্গিত */
  hint?: ReactNode
  /** false হলে শুধু ড্রপ-জোন; তালিকা parent নিজে দেখাবে (বাল্ক পেইজ) */
  showList?: boolean
}

const STATUS_TONE: Record<UploadStatus, NonNullable<BadgeProps['tone']>> = {
  pending: 'neutral',
  processing: 'warning',
  uploading: 'info',
  done: 'success',
  error: 'error',
  skipped: 'neutral',
}

/**
 * এডমিনের ছবি আপলোডার (পাবলিক ImageUploader-এর একই props ও আচরণ): টেনে ছাড়া / ক্লিক করে বাছাই, প্রিভিউ, অবস্থা ও প্রগ্রেস।
 * আপলোড নিজে করে না — parent ফাইল নিয়ে processImage → uploadPhoto চালায় আর items-এর status বদলায় (utils/uploadItems.ts)।
 */
export function ImageUploader({ items, onAdd, onRemove, multiple = true, disabled = false, hint, showList = true }: Props) {
  return (
    <Stack gap={2}>
      <FileInput
        look="dropzone"
        label={multiple ? t('ছবিগুলো এখানে টেনে ছাড়ুন বা ক্লিক করে বাছুন') : t('ছবি এখানে টেনে ছাড়ুন বা ক্লিক করে বাছুন')}
        buttonLabel={multiple ? t('ছবিগুলো এখানে টেনে ছাড়ুন বা ক্লিক করে বাছুন') : t('ছবি এখানে টেনে ছাড়ুন বা ক্লিক করে বাছুন')}
        accept={PHOTO_SPEC.acceptMimes.join(',')}
        multiple={multiple}
        disabled={disabled}
        onFiles={onAdd}
        hint={
          <>
            {t('jpg / png / webp · আপলোডের আগে স্বয়ংক্রিয়ভাবে {px}px WebP এ কম্প্রেস হবে', { px: toBanglaNumber(PHOTO_SPEC.maxWidth) })}
            {hint && <span style={{ display: 'block', marginTop: 8 }}>{hint}</span>}
          </>
        }
      />

      {showList && items.length > 0 && (
        <Stack gap={1}>
          {items.map((it) => (
            <UploadRow key={it.id} item={it} onRemove={onRemove && it.status === 'pending' ? () => onRemove(it.id) : undefined} />
          ))}
        </Stack>
      )}
    </Stack>
  )
}

/** একটি ফাইলের সারি: প্রিভিউ, নাম, আকার, প্রগ্রেস, বার্তা, অবস্থা */
export function UploadRow({ item: it, onRemove }: { item: UploadItem; onRemove?: () => void }) {
  return (
    <Stack direction="row" gap={1.5} align="center">
      <img src={it.previewUrl} alt="" width={56} height={56} style={{ width: 56, height: 56, flexShrink: 0, objectFit: 'cover', borderRadius: 8 }} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <Text size="small">{it.file.name}</Text>
        <Text size="small" tone="muted">
          {formatBytes(it.file.size)}
        </Text>
        {(it.status === 'uploading' || it.status === 'processing') && <ProgressBar value={it.status === 'processing' ? undefined : (it.progress ?? 0)} />}
        {it.message && (
          <Text size="small" tone="muted">
            {it.message}
          </Text>
        )}
      </div>
      <StatusPill status={it.status} />
      {onRemove && <IconButton icon="close" label={t('বাদ দিন')} tone="danger" onClick={onRemove} />}
    </Stack>
  )
}

export function StatusPill({ status }: { status: UploadStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{t(STATUS_LABEL[status])}</Badge>
}
