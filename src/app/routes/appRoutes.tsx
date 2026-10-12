import { Route } from 'react-router'
import type { Project } from '@/backend'
import { childrenOf, topLevelProjects } from '@/features/projects/registry'
import { GroupLandingPage } from '@/features/projects/landing/GroupLandingPage'
import { ProjectListPage } from '@/features/projects/list/ProjectListPage'
import {
  Lazy,
  LazyProjectDetailPage,
} from '@/features/housing/pages/lazyPages'
import { LazyAdminApp } from '@/features/admin/layout/lazyAdminApp'
import { ProjectFrame } from './ProjectFrame'
import { LegacyAdminRedirect } from './routeGuards'

/**
 * রাউট-টেবিলের অংশ (App.tsx এ <Routes> এর ভেতরে বসে; Route এলিমেন্ট সরাসরি Routes এর child হতে হয় বলে
 * এগুলো কম্পোনেন্ট নয়, এলিমেন্ট/এলিমেন্টের তালিকা)।
 */

/**
 * রেজিস্ট্রি থেকে পাবলিক রাউট (পরিকল্পনা §৪.১): গ্রুপ `/{slug}` = ল্যান্ডিং, তার উপ-প্রকল্প `/{group}/{slug}`;
 * একক প্রকল্প `/{slug}`। প্রতিটি তালিকার child `:serial` = বিস্তারিত মডাল (Outlet-মডাল প্যাটার্ন অপরিবর্তিত)।
 * পেইজগুলো এখনো ঘর নির্মাণের — জেনেরিক তালিকা/ল্যান্ডিং আসবে M-ধাপ ১৩/১৫-এ।
 */
export function projectRoutes(projects: Project[]) {
  return topLevelProjects(projects).map((p) =>
    p.is_group ? (
      <Route key={p.key} path={p.slug}>
        <Route
          index
          element={
            <ProjectFrame project={p}>
              <GroupLandingPage group={p} />
            </ProjectFrame>
          }
        />
        {childrenOf(p.key, projects)
          .filter((c) => !c.is_group)
          .map(leafRoute)}
      </Route>
    ) : (
      leafRoute(p)
    ),
  )
}

function leafRoute(p: Project) {
  return (
    <Route
      key={p.key}
      path={p.slug}
      element={
        <ProjectFrame project={p}>
          <ProjectListPage project={p} />
        </ProjectFrame>
      }
    >
      <Route
        path=":serial"
        element={
          <Lazy variant="dialog">
            <LazyProjectDetailPage />
          </Lazy>
        }
      />
    </Route>
  )
}

/**
 * এডমিন (docs/plans/2026-10-06-1224-refactor-complete-move-to-own-stack-plan.md §৪.২): `/admin/*` (লগইনসহ) একটি lazy চাংক — নিজের লেআউট ও রাউট AdminApp-এ, পাবলিক হেডার-ফুটারের
 * বাইরে, যাতে এডমিনের UI টেমপ্লেট (MUI) পাবলিক বান্ডলে না আসে। URL আগের মতোই (`/admin/records/semi_pucca`)।
 */
export const adminRoute = <Route key="admin" path="admin/*" element={<Lazy><LazyAdminApp /></Lazy>} />

/** পুরনো `/housing/admin/*` লিংক নতুনে রিডাইরেক্ট (একই পরিকল্পনার §৪.৩) */
export const legacyAdminRoute = <Route key="legacy-admin" path="housing/admin/*" element={<LegacyAdminRedirect />} />
