import { lt, t } from '@/i18n'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toBanglaNumber } from '@/lib/banglaNumber'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { getHousingApi, HousingApiError, type HousingRecord } from '@/backend'
import { adminPath, useRecordProjectByKey } from '@/features/housing/utils/housingProjects'
import { Breadcrumbs, LoadingState, Page } from '@/ui'
import { AdminNotFound } from '../ui/AdminNotFound'
import { ErrorNotice } from '../ui/ErrorNotice'
import { RecordForm } from './RecordForm'

interface Props {
  mode: 'new' | 'edit'
}

type Loaded = { serial: number; status: 'ready'; record: HousingRecord } | { serial: number; status: 'error'; error: HousingApiError }

/**
 * /admin/records/:key/new  এবং  /admin/records/:key/:serial/edit
 * এডিটে রেকর্ড সিরিয়াল ধরে লোড হয়ে ফর্মে আগে থেকে ভরা থাকে। যেকোনো প্রকল্পের (খসড়াও; গ্রুপ নয়) — M-ধাপ ১০।
 */
export function RecordFormPage({ mode }: Props) {
  useDocumentTitle(mode === 'new' ? t('নতুন রেকর্ড') : t('রেকর্ড সম্পাদনা'))
  const { key, serial } = useParams()
  const navigate = useNavigate()
  const project = useRecordProjectByKey(key)
  const projectType = project?.key
  const serialNo = Number(serial)
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  const needLoad = mode === 'edit' && !!projectType && Number.isInteger(serialNo) && serialNo >= 1
  useEffect(() => {
    if (!needLoad || !projectType) return
    let alive = true
    getHousingApi()
      .getBySerial(projectType, serialNo)
      .then((record) => alive && setLoaded({ serial: serialNo, status: 'ready', record }))
      .catch((err: unknown) => alive && setLoaded({ serial: serialNo, status: 'error', error: HousingApiError.from(err) }))
    return () => {
      alive = false
    }
  }, [needLoad, projectType, serialNo])

  if (!project || !projectType || (mode === 'edit' && !needLoad)) return <AdminNotFound />
  const listPath = adminPath(projectType)
  const current = loaded && loaded.serial === serialNo ? loaded : null

  return (
    <Page
      title={mode === 'new' ? t('নতুন উপকারভোগী যোগ করুন') : t('রেকর্ড সম্পাদনা')}
      documentTitle={false}
      breadcrumbs={
        <Breadcrumbs
          label={t('{title} — রেকর্ড', { title: lt(project, 'name') })}
          items={[{ label: lt(project, 'name'), to: listPath }, { label: mode === 'new' ? t('নতুন রেকর্ড') : t('সিরিয়াল {n} সম্পাদনা', { n: toBanglaNumber(serialNo) }) }]}
        />
      }
    >
      {mode === 'new' && (
        <RecordForm project={project} onSaved={() => navigate(listPath)} onCancel={() => navigate(listPath)} />
      )}

      {mode === 'edit' && !current && <LoadingState label={t('লোড হচ্ছে…')} />}
      {mode === 'edit' && current?.status === 'error' && (
        <ErrorNotice title={current.error.code === 'NOT_FOUND' ? t('রেকর্ড পাওয়া যায়নি') : t('রেকর্ড লোড করা যায়নি')} error={current.error} />
      )}
      {mode === 'edit' && current?.status === 'ready' && (
        <RecordForm
          project={project}
          record={current.record}
          onSaved={(r) => {
            // সিরিয়াল বদলালে নতুন URL এ; নইলে তালিকায়
            if (r.serial_no !== serialNo) navigate(`${listPath}/${r.serial_no}/edit`, { replace: true })
            else navigate(listPath)
          }}
          onCancel={() => navigate(listPath)}
        />
      )}
    </Page>
  )
}
