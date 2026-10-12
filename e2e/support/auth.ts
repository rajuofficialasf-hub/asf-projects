import { expect, type Page } from '@playwright/test'
import { MOCK_ADMIN, MOCK_NON_ADMIN } from '../../src/backend/mock/fixtures'

export { MOCK_ADMIN, MOCK_NON_ADMIN }

/** লগইন পেইজে ফর্ম পূরণ করে সাবমিট (লগইনে সরাসরি আসা বা রিডাইরেক্ট — দুই অবস্থায় কাজ করে) */
export async function fillLogin(page: Page, email: string, password: string) {
  await page.getByRole('textbox', { name: /^ইমেইল/ }).fill(email)
  await page.locator('input[type=password]').fill(password)
  await page.getByRole('button', { name: 'লগইন' }).click()
}

/** এডমিন শেলের অ্যাকাউন্ট মেনুর বোতাম (লগইন থাকলে দেখা যায়; ভেতরে "পাবলিক সাইট দেখুন" ও "লগআউট") */
export const accountMenu = (page: Page) => page.getByRole('button', { name: 'অ্যাকাউন্ট মেনু' })

/** অ্যাকাউন্ট মেনু খুলে লগআউট */
export async function logout(page: Page) {
  await accountMenu(page).click()
  await page.getByRole('menuitem', { name: 'লগআউট' }).click()
}

export async function loginAsAdmin(page: Page, to = '/housing/admin/semi-pucca') {
  await loginAs(page, MOCK_ADMIN, to)
}

/** যেকোনো অ্যাকাউন্টে লগইন (admin-rest এ সাধারণ এডমিনও: e2e/support/rest-data.ts PLAIN_ADMIN) */
export async function loginAs(page: Page, account: { email: string; password: string }, to = '/admin') {
  await page.goto('/admin/login')
  await fillLogin(page, account.email, account.password)
  await expect(accountMenu(page)).toBeVisible()
  if (to) await page.goto(to)
}
