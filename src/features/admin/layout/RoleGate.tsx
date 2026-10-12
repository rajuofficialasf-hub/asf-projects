import type { ReactNode } from 'react'
import type { AdminRole } from '@/backend'
import { useAdminUser } from '../adminUser'
import { AdminForbidden } from '../ui/AdminForbidden'

/**
 * ভূমিকা অনুযায়ী পাতা: প্রকল্পের সেটিংস প্রকল্পের ইউজার (editor) দেখেন না, ইউজার-ব্যবস্থাপনা শুধু মূল এডমিন —
 * বদলে কোন ভূমিকার কাজ সেটি বলা বার্তা। শুধু দেখানো/লুকানো; নিষেধ সার্ভারে।
 */
export function RoleGate({ allow, title, message, children }: { allow: readonly AdminRole[]; title: string; message: string; children: ReactNode }) {
  const me = useAdminUser()
  if (me && allow.includes(me.role)) return children
  return <AdminForbidden title={title} message={message} />
}
