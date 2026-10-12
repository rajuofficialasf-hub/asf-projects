import { lt, t } from '@/i18n'
import { useState } from 'react'
import { getProjectsApi, HousingApiError, type Project } from '@/backend'
import { SafeImage } from '@/features/housing/components/SafeImage'
import { useAuth } from '@/features/housing/hooks/useAuth'
import { processImage } from '@/features/housing/utils/imageProcessing'
import { PHOTO_SPEC } from '@/features/housing/utils/photoSpec'
import { coverSrc } from '@/features/projects/home/cover'
import { Alert, Badge, Button, Card, FileInput, Stack, Text, useToast } from '@/ui'
import { ConfirmDialog } from '../ui/ConfirmDialog'

/** চুক্তি §৪.১.৮: কভার ≤ ৫ MB (কম্প্রেসের পর) */
const COVER_MAX_BYTES = 5 * 1024 * 1024

interface Props {
  project: Project
  /** অন্য অংশে সংরক্ষণ হয়নি এমন পরিবর্তন — তখন আপলোড বন্ধ (আপলোডের পর পাতা নতুন করে আনে) */
  blocked: boolean
  onChanged: () => Promise<void>
}

/**
 * প্রকল্পের কভার ছবি (M-ধাপ ১৫) — হোম পেইজের কার্ডে। ব্রাউজারে WebP (সর্বোচ্চ ১৬০০px, PHOTO_SPEC) করে
 * `housing/_projects/{key}/cover.webp` এ আপলোড (একই পাথে ওভাররাইট); মোছা শুধু মূল এডমিন।
 * কভার না থাকলে হোমে সর্বশেষ রেকর্ডের ছবি, তাও না থাকলে প্রকল্পের রঙের পটভূমি ও আইকন — এখানেও সেটাই প্রিভিউ।
 */
export function CoverUpload({ project, blocked, onChanged }: Props) {
  const toast = useToast()
  const mainAdmin = useAuth().user?.role === 'main_admin'
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const src = coverSrc(project.cover_path, project.updated_at)

  const upload = async (file: File) => {
    setBusy(true)
    setError(null)
    try {
      const { photo } = await processImage(file)
      if (photo.size > COVER_MAX_BYTES) throw new HousingApiError('PAYLOAD_TOO_LARGE', t('কভার ছবি ৫ MB এর বেশি'))
      await getProjectsApi().uploadCover(project.key, photo)
      toast.success(t('কভার ছবি আপলোড হয়েছে'))
      await onChanged()
    } catch (err) {
      setError(HousingApiError.from(err).message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    setError(null)
    try {
      await getProjectsApi().deleteCover(project.key)
      setConfirmDelete(false)
      toast.success(t('কভার ছবি মুছে ফেলা হয়েছে'))
      await onChanged()
    } catch (err) {
      setConfirmDelete(false)
      setError(HousingApiError.from(err).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <Stack gap={1.5}>
        <Stack gap={0.5}>
          <Text size="small" weight="medium">
            {t('কভার ছবি (হোম পেইজের কার্ডে)')}
          </Text>
          <Text size="caption" tone="muted">
            {t('প্রকাশিত প্রকল্পে আসল ছবি দিন। না দিলে হোমে সর্বশেষ রেকর্ডের ছবি, তাও না থাকলে রঙের পটভূমিতে প্রকল্পের নাম দেখাবে।')}
          </Text>
        </Stack>

        {src ? (
          <SafeImage
            src={src}
            alt={t('{name} — কভার ছবি', { name: lt(project, 'name') })}
            width={448}
            height={252}
            style={{ width: '100%', maxWidth: 448, height: 'auto', aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: 12 }}
          />
        ) : (
          <Card>
            <Stack align="center" gap={1}>
              <Text weight="bold" align="center">
                {lt(project, 'name')}
              </Text>
              <Badge>{t('কভার নেই')}</Badge>
            </Stack>
          </Card>
        )}
        {busy && (
          <Text size="small" weight="medium" tone="muted">
            {t('প্রক্রিয়া চলছে…')}
          </Text>
        )}

        {blocked && (
          <Text size="caption" tone="warning">
            {t('আগে বাকি পরিবর্তন সংরক্ষণ বা বাতিল করুন, তারপর কভার বদলান।')}
          </Text>
        )}
        {error && <Alert tone="error">{error}</Alert>}

        <Stack direction="row" gap={1} align="start" wrap>
          <FileInput
            label={t('কভার ছবি দিন')}
            buttonLabel={src ? t('কভার বদলান') : t('কভার ছবি দিন')}
            accept={PHOTO_SPEC.acceptMimes.join(',')}
            disabled={busy || blocked}
            hint={t('jpg/png/webp — নিজে থেকে WebP (সর্বোচ্চ ১৬০০px) হবে')}
            onFiles={(files) => {
              const f = files[0]
              if (f) void upload(f)
            }}
          />
          {src && mainAdmin && (
            <Button variant="danger-text" size="small" disabled={busy || blocked} onClick={() => setConfirmDelete(true)}>
              {t('কভার মুছুন')}
            </Button>
          )}
        </Stack>
      </Stack>

      <ConfirmDialog
        open={confirmDelete}
        title={t('কভার ছবি মুছবেন?')}
        confirmLabel={t('মুছুন')}
        tone="danger"
        busy={busy}
        onConfirm={() => void remove()}
        onCancel={() => setConfirmDelete(false)}
      >
        <Text size="small">{t('হোমের কার্ডে তখন সর্বশেষ রেকর্ডের ছবি বা রঙের পটভূমি দেখাবে।')}</Text>
      </ConfirmDialog>
    </Card>
  )
}
