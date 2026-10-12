import { describe, expect, it } from 'vitest'
import type { ProjectOverview, ProjectOverviewItem } from '@/backend'
import { homeProjects } from './homeProjects'

const item = (key: string, over: Partial<ProjectOverviewItem>) => ({ key, parent_key: null, is_published: true, show_on_home: true, ...over }) as ProjectOverviewItem
const overview = (projects: ProjectOverviewItem[]) => ({ projects, global: { projects: 0, total: 0, districts: 0 } }) as ProjectOverview

describe('homeProjects', () => {
  it('counts only the cards home shows: published, top-level, shown on home', () => {
    const data = overview([
      item('housing', {}),
      item('semi_pucca', { parent_key: 'housing' }),
      item('tin', { parent_key: 'housing' }),
      item('draft', { is_published: false }),
      item('hidden', { show_on_home: false }),
    ])
    expect(homeProjects(data).map((p) => p.key)).toEqual(['housing'])
  })
})
