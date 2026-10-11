import { Route, Routes } from 'react-router'
import { SiteLayout } from '@/app/layout/SiteLayout'
import { adminRoute, legacyAdminRoute, projectRoutes } from '@/app/routes/appRoutes'
import { ConfigAwareNotFound, RegistryAuthSync } from '@/app/routes/routeGuards'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ToastProvider } from '@/components/Toast'
import { useProjects } from '@/features/projects/registry'
import { LanguageProvider } from '@/i18n'
import { HomePage } from '@/pages/HomePage'

/**
 * সাইটের রুট টেবিল (পরিকল্পনা §৪): `/admin/*` নিজের লেআউটে (SiteLayout-এর বাইরে); বাকি সব SiteLayout-এ — স্থির রাউট
 * (`/`, পুরনো `/housing/admin/*`), রেজিস্ট্রি থেকে তৈরি প্রকল্পের রাউট, আর `*` = ConfigAwareNotFound। LanguageProvider ভাষা বদলালে সব remount করে (রেজিস্ট্রি মডিউলে থাকে, হারায় না)।
 */
export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <ErrorBoundary>
          <RegistryAuthSync />
          <AppRoutes />
        </ErrorBoundary>
      </ToastProvider>
    </LanguageProvider>
  )
}

function AppRoutes() {
  const projects = useProjects()
  return (
    <Routes>
      {adminRoute}
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        {projectRoutes(projects)}
        {legacyAdminRoute}
        <Route path="*" element={<ConfigAwareNotFound />} />
      </Route>
    </Routes>
  )
}
