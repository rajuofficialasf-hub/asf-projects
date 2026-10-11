import { lt, t } from '@/i18n'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { getAuthProvider, getHousingApi, HousingApiError, type AuthUser } from '@/backend'
import { adminPath, useRecordProjects } from '@/features/housing/utils/housingProjects'
import { LanguageSwitch } from '../ui/LanguageSwitch'
import { AppShell, Icon, Menu, Stack, Text, useToast, type NavGroup, type NavItem } from '@/ui'

/**
 * এডমিন প্যানেলের লেআউট: Minimal-এর ড্যাশবোর্ড — ডেস্কটপে (lg+) বাম সাইডবার, ফোনে উপরের বারের "এডমিন মেনু" থেকে ড্রয়ার।
 * উপরের বারে ভাষা বদল আর অ্যাকাউন্ট মেনু (পাবলিক সাইট দেখুন, লগআউট)। মেনুতে কে কী দেখবেন তা ভূমিকা অনুযায়ী;
 * আসল অনুমতি সার্ভার যাচাই করে।
 */
export function AdminLayout({
  user,
  onLeaving,
  children,
}: {
  user: AuthUser
  /** লগআউট শুরু/ব্যর্থ — RequireAdmin তখন লগইন পেইজে পাঠায় না, যাতে লগআউটের পর হোমে যাওয়া যায় */
  onLeaving?: (leaving: boolean) => void
  children: ReactNode
}) {
  const navigate = useNavigate()
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  // সব প্রকল্পের রেকর্ড — খসড়ায় চিহ্ন
  const records = useRecordProjects().map((p) => ({ to: adminPath(p.key), label: p.is_published ? lt(p, 'name') : t('{name} (খসড়া)', { name: lt(p, 'name') }) }))
  const panel: NavItem[] = [{ to: '/admin', label: t('ড্যাশবোর্ড'), exact: true, icon: 'dashboard' }]
  // প্রকল্পের সেটিংস প্রকল্পের ইউজার (editor) দেখেন না; ইউজার-ব্যবস্থাপনা শুধু মূল এডমিন
  if (user.role !== 'editor') panel.push({ to: '/admin/projects', label: t('প্রকল্পসমূহ'), icon: 'folder' })
  if (user.role === 'main_admin') panel.push({ to: '/admin/users', label: t('ইউজার'), icon: 'users' })
  const navigation: NavGroup[] = [
    { title: t('প্যানেল'), items: panel },
    { title: t('রেকর্ড'), items: records.map((r): NavItem => ({ ...r, icon: 'list' })) },
    {
      title: t('সরঞ্জাম'),
      items: [
        { to: '/admin/import', label: t('বাল্ক ইম্পোর্ট'), icon: 'import' },
        { to: '/admin/photos', label: t('ছবি বাল্ক আপডেট'), icon: 'image' },
        { to: '/admin/activity', label: t('একটিভিটি লগ'), icon: 'history' },
      ],
    },
  ]
  const shown = navigation.filter((g) => g.items.length)

  const logout = async () => {
    setBusy(true)
    onLeaving?.(true)
    try {
      await getHousingApi().logActivity('logout')
      await getAuthProvider().logout()
      navigate('/', { replace: true })
    } catch (err) {
      onLeaving?.(false)
      toast.error(HousingApiError.from(err).message)
    } finally {
      setBusy(false)
    }
  }

  const roleLabel = user.role === 'main_admin' ? t('মূল এডমিন') : user.role === 'editor' ? t('প্রকল্পের ইউজার') : t('এডমিন')

  const headerActions = (
    <Stack direction="row" gap={1} align="center">
      <LanguageSwitch />
      <Menu
        label={t('অ্যাকাউন্ট মেনু')}
        trigger={<Icon name="user" size={24} />}
        header={
          <Stack gap={0}>
            <Text>{user.name ?? user.email}</Text>
            <Text tone="muted" size="small">
              {roleLabel}
            </Text>
          </Stack>
        }
        items={[
          { kind: 'link', label: t('পাবলিক সাইট দেখুন'), to: '/', icon: 'external' },
          { kind: 'divider' },
          { label: busy ? t('লগআউট হচ্ছে…') : t('লগআউট'), onClick: () => void logout(), icon: 'sign-out', tone: 'danger', disabled: busy },
        ]}
      />
    </Stack>
  )

  return (
    <AppShell navigation={shown} navLabel={t('এডমিন মেনু')} headerActions={headerActions}>
      {children}
    </AppShell>
  )
}
