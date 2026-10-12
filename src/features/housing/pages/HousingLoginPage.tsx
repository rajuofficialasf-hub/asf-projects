import { t } from '@/i18n'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { getAuthProvider, getHousingApi } from '../../../backend/factory'
import { HousingApiError } from '../../../backend/interfaces/types'
import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { SITE_NAME } from '@/config/site'
import { useAuth } from '../hooks/useAuth'
import { LanguageSwitch } from '@/features/admin/ui/LanguageSwitch'
import { focusFirstInvalid } from '@/features/admin/ui/focusFirstInvalid'
import { Alert, Button, SignInLayout, Stack, Text, TextField } from '@/ui'

const DEFAULT_AFTER_LOGIN = '/admin'

/**
 * /admin/login — ইমেইল + পাসওয়ার্ড (AuthProvider.login)। সাইন-আপ/পাসওয়ার্ড-রিসেট লিঙ্ক নেই:
 * নতুন এডমিন শুধু ব্যাকএন্ড থেকে যোগ হয়। আগে থেকে লগইন থাকলে সরাসরি এডমিনে পাঠায়।
 */
export function HousingLoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from || DEFAULT_AFTER_LOGIN
  useDocumentTitle(t('এডমিন লগইন'))

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<HousingApiError | null>(null)
  // Empty fields are named under the field on submit, so the button never sits greyed out without a reason.
  const [tried, setTried] = useState(false)
  const emailError = tried && !email.trim() ? t('ইমেইল দিন') : undefined
  const passwordError = tried && !password ? t('পাসওয়ার্ড দিন') : undefined

  if (auth.status === 'ready' && auth.user && auth.isAdmin) {
    return <Navigate to={from} replace />
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setTried(true)
    if (!email.trim() || !password) {
      focusFirstInvalid(e.currentTarget as HTMLFormElement)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await getAuthProvider().login(email, password)
      void getHousingApi().logActivity('login')
      navigate(from, { replace: true })
    } catch (err) {
      setError(HousingApiError.from(err))
    } finally {
      setBusy(false)
    }
  }

  const message = error
    ? error.code === 'CONFIG_ERROR'
      ? t('ব্যাকএন্ড সংযোগ কনফিগার করা হয়নি (.env.local দেখুন)।')
      : error.code === 'NETWORK_ERROR'
        ? t('সার্ভারে সংযোগ করা যায়নি।')
        : error.message
    : null

  return (
    <SignInLayout
      title={t('এডমিন লগইন')}
      description={t('শুধু অনুমোদিত এডমিনদের জন্য। পাবলিক তালিকা দেখতে লগইন লাগে না।')}
      asideTitle={t(SITE_NAME)}
      headerActions={<LanguageSwitch />}
      documentTitle={false}
    >
      <form onSubmit={(e) => void submit(e)} noValidate>
        <Stack gap={3}>
          <TextField
            label={t('ইমেইল')}
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={setEmail}
            error={emailError}
          />
          <TextField
            label={t('পাসওয়ার্ড')}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={setPassword}
            error={passwordError}
          />

          {message && <Alert tone="error">{message}</Alert>}

          <Button type="submit" fullWidth disabled={busy}>
            {busy ? t('লগইন হচ্ছে…') : t('লগইন')}
          </Button>

          <Text tone="muted" size="small">
            {t('পাসওয়ার্ড ভুলে গেলে বা নতুন এডমিন প্রয়োজন হলে ব্যাকএন্ড অ্যাডমিনিস্ট্রেটরের সাথে যোগাযোগ করুন।')}
          </Text>
        </Stack>
      </form>
    </SignInLayout>
  )
}
