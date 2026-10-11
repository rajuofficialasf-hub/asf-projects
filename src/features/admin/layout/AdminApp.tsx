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
          <Route path="projects" element={<RoleGate allow={SETTINGS_ROLES}><Lazy><LazyAdminProjectsPage /></Lazy></RoleGate>} />
          <Route path="projects/new" element={<RoleGate allow={SETTINGS_ROLES}><Lazy><LazyProjectWizardPage /></Lazy></RoleGate>} />
          <Route path="projects/:key" element={<RoleGate allow={SETTINGS_ROLES}><Lazy><LazyProjectSettingsPage /></Lazy></RoleGate>} />
          <Route path="users" element={<RoleGate allow={['main_admin']}><Lazy><LazyAdminUsersPage /></Lazy></RoleGate>} />
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
