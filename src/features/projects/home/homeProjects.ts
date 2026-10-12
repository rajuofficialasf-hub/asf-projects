import type { ProjectOverview } from '@/backend'

/** হোমে যে প্রকল্পের কার্ড আসে: প্রকাশিত, শীর্ষ-স্তরের, show_on_home চালু — হিরোর "মোট প্রকল্প"-ও এটাই গোনে, তাই দুটো মেলে */
export function homeProjects(data: ProjectOverview) {
  return data.projects.filter((p) => p.is_published && !p.parent_key && p.show_on_home)
}
