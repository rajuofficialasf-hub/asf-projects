import { t } from '@/i18n'
import { Suspense, type ReactNode } from 'react'
import { Route, Routes } from 'react-router'
import { LoadingState, UiProvider } from '@/ui'
import { RequireAdmin } from '@/features/housing/components/RequireAdmin'
import { HousingLoginPage } from '@/features/housing/pages/HousingLoginPage'
import {
  LazyActivityPage,
  LazyAdminDashboardPage,
  LazyAdminProjectsPage,
  LazyAdminRecordsPage,
  LazyAdminUsersPage,
  LazyImportPage,
  LazyPhotoBulkPage,
  LazyProjectSettingsPage,
  LazyProjectWizardPage,
  LazyRecordFormPage,
} from '../pages/lazyAdminPages'
import { AdminNotFound } from '../ui/AdminNotFound'
import { RoleGate } from './RoleGate'

const SETTINGS_ROLES = ['main_admin', 'admin'] as const

/** প্রকল্পের সেটিংসের দরজা: এডমিন ও মূল এডমিন; প্রকল্পের ইউজার (editor) নয় */
function SettingsGate({ children }: { children: ReactNode }) {
  return (
    <RoleGate
      allow={SETTINGS_ROLES}
      title={t('এই অংশ এডমিনদের জন্য')}
      message={t('প্রকল্পের সেটিংস (ফিল্ড, কার্ড, প্রকাশ) এডমিন ও মূল এডমিন সামলান। আপনি নিজের প্রকল্পের রেকর্ড, ইম্পোর্ট ও ছবি নিয়ে কাজ করতে পারেন।')}
    >
      {children}
    </RoleGate>
  )
}

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<LoadingState label={t('লোড হচ্ছে…')} />}>{children}</Suspense>
}

/**
 * /admin-এর সব পাতা (লগইনসহ) একটি lazy চাংকে, যাতে এডমিনের UI টেমপ্লেট (MUI) পাবলিক বান্ডলে না আসে।
 * URL আগের মতোই: পাথে প্রকল্পের স্থায়ী key (`/admin/records/semi_pucca`), আর প্রতিটি পাতা lazy।
 */
export default function AdminApp() {
  return (
    <UiProvider>
      <Routes>
        <Route path="login" element={<HousingLoginPage />} />
        <Route element={<RequireAdmin />}>
          <Route index element={<Lazy><LazyAdminDashboardPage /></Lazy>} />
          {/* প্রকল্পের সেটিংস: মূল এডমিন ও সাধারণ এডমিন; প্রকল্পের ইউজার (editor) নয় */}
          <Route path="projects" element={<SettingsGate><Lazy><LazyAdminProjectsPage /></Lazy></SettingsGate>} />
          <Route path="projects/new" element={<SettingsGate><Lazy><LazyProjectWizardPage /></Lazy></SettingsGate>} />
          <Route path="projects/:key" element={<SettingsGate><Lazy><LazyProjectSettingsPage /></Lazy></SettingsGate>} />
          <Route
            path="users"
            element={
              <RoleGate allow={['main_admin']} title={t('এই অংশ শুধু মূল এডমিনের')} message={t('ইউজার যোগ, ভূমিকা বদল আর প্রকল্প দেওয়া শুধু মূল এডমিন করেন।')}>
                <Lazy><LazyAdminUsersPage /></Lazy>
              </RoleGate>
            }
          />
          <Route path="records/:key" element={<Lazy><LazyAdminRecordsPage /></Lazy>} />
          <Route path="records/:key/new" element={<Lazy><LazyRecordFormPage mode="new" /></Lazy>} />
          <Route path="records/:key/:serial/edit" element={<Lazy><LazyRecordFormPage mode="edit" /></Lazy>} />
          <Route path="import" element={<Lazy><LazyImportPage /></Lazy>} />
          <Route path="photos" element={<Lazy><LazyPhotoBulkPage /></Lazy>} />
          <Route path="activity" element={<Lazy><LazyActivityPage /></Lazy>} />
        </Route>
        <Route path="*" element={<AdminNotFound />} />
      </Routes>
    </UiProvider>
  )
}
