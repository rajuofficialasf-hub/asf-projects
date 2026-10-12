import type { Page } from '@playwright/test'
import { expect, test } from '../support/backend'
import { accountMenu, loginAs, MOCK_ADMIN } from '../support/auth'
import { PLAIN_ADMIN, PROJECT_EDITOR } from '../support/rest-data'

// The admin shell (docs/plans/2026-10-11-1413-refactor-admin-ui-minimal-plan.md, U3): the menu shows each
// role only its own items, the phone menu opens and closes, and logout and "view public site" lead home.

const menu = (page: Page) => page.getByRole('navigation', { name: 'এডমিন মেনু' })

/** The account actions (view public site, logout), in the account menu. */
async function accountAction(page: Page, name: string) {
  await accountMenu(page).click()
  return page.getByRole('menuitem', { name })
}

test('the main admin sees every menu item, with the current page marked', async ({ page }) => {
  await loginAs(page, MOCK_ADMIN, '/admin')
  const nav = menu(page)
  await expect(nav.getByRole('link', { name: 'ড্যাশবোর্ড' })).toHaveAttribute('aria-current', 'page')
  await expect(nav.getByRole('link', { name: 'প্রকল্পসমূহ' })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'ইউজার' })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'ডেমো প্রকল্প (খসড়া)' })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'বাল্ক ইম্পোর্ট' })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'ছবি বাল্ক আপডেট' })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'একটিভিটি লগ' })).toBeVisible()

  await nav.getByRole('link', { name: 'প্রকল্পসমূহ' }).click()
  await expect(page).toHaveURL(/\/admin\/projects$/)
  await expect(menu(page).getByRole('link', { name: 'প্রকল্পসমূহ' })).toHaveAttribute('aria-current', 'page')
})

test('a plain admin has no users item, and a project user has neither projects nor users', async ({ page, browser, baseURL }) => {
  await loginAs(page, PLAIN_ADMIN, '/admin')
  await expect(menu(page).getByRole('link', { name: 'প্রকল্পসমূহ' })).toBeVisible()
  await expect(menu(page).getByRole('link', { name: 'ইউজার' })).toHaveCount(0)

  const context = await browser.newContext({ baseURL })
  const other = await context.newPage()
  await loginAs(other, PROJECT_EDITOR, '/admin')
  await expect(menu(other).getByRole('link', { name: 'ড্যাশবোর্ড' })).toBeVisible()
  await expect(menu(other).getByRole('link', { name: 'প্রকল্পসমূহ' })).toHaveCount(0)
  await expect(menu(other).getByRole('link', { name: 'ইউজার' })).toHaveCount(0)
  await context.close()
})

test('on a phone the admin menu opens from its button, and Esc or a link closes it', async ({ page }) => {
  await loginAs(page, MOCK_ADMIN, '/admin')
  await page.setViewportSize({ width: 390, height: 800 })
  const open = page.getByRole('button', { name: 'এডমিন মেনু' })
  await open.click()
  await expect(menu(page).getByRole('link', { name: 'একটিভিটি লগ' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(menu(page).getByRole('link', { name: 'একটিভিটি লগ' })).toBeHidden()

  await open.click()
  await menu(page).getByRole('link', { name: 'একটিভিটি লগ' }).click()
  await expect(page).toHaveURL(/\/admin\/activity$/)
  await expect(menu(page).getByRole('link', { name: 'একটিভিটি লগ' })).toBeHidden()
})

test('"view public site" goes home with the public look, and logout ends the session', async ({ page }) => {
  await loginAs(page, MOCK_ADMIN, '/admin')
  await (await accountAction(page, 'পাবলিক সাইট দেখুন')).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('banner')).toBeVisible()
  await expect(page.locator('body')).toHaveCSS('background-color', 'oklch(0.984 0.003 247.858)')

  await page.goto('/admin')
  await (await accountAction(page, 'লগআউট')).click()
  await expect(page).toHaveURL(/\/$/)
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/admin\/login$/)
})

test('the admin has its own shell: no public main menu, and its own language switch', async ({ page }) => {
  await loginAs(page, MOCK_ADMIN, '/admin')
  await expect(menu(page).getByRole('link', { name: 'ড্যাশবোর্ড' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'প্রধান মেনু' })).toHaveCount(0)

  const language = page.getByRole('group', { name: 'ভাষা' })
  await expect(language.getByRole('button', { name: 'বাং', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await language.getByRole('button', { name: 'EN', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page).toHaveURL(/\/admin$/)
  await page.getByRole('group', { name: 'Language' }).getByRole('button', { name: 'বাং', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn')

  // After a language switch remounts the admin, leaving it still gives the public site a clean <html>.
  await (await accountAction(page, 'পাবলিক সাইট দেখুন')).click()
  await expect(page.getByRole('navigation', { name: 'প্রধান মেনু' })).toBeVisible()
  await expect(page.locator('html')).not.toHaveAttribute('data-color-scheme', /.*/)
  await expect(page.locator('html')).not.toHaveAttribute('dir', /.*/)
})

test('an unknown admin address shows "not found" with a way home, without asking for a login', async ({ page }) => {
  await page.goto('/admin/no-such-page')
  await expect(page.getByRole('heading', { name: 'পেইজটি পাওয়া যায়নি' })).toBeVisible()
  await expect(page).toHaveURL(/\/admin\/no-such-page$/)
  await page.getByRole('link', { name: 'হোম পেইজে যান' }).click()
  await expect(page).toHaveURL(/\/$/)
})

test('a failed logout says why and keeps the admin open', async ({ page }) => {
  await loginAs(page, MOCK_ADMIN, '/admin')
  await page.route('**/api/v1/auth/logout', (route) =>
    route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":{"code":"INTERNAL_ERROR","message":"লগআউট করা যায়নি"}}' }),
  )
  await (await accountAction(page, 'লগআউট')).click()
  await expect(page.getByRole('alert').filter({ hasText: 'লগআউট করা যায়নি' })).toBeVisible()
  await expect(page).toHaveURL(/\/admin$/)
  await expect(accountMenu(page)).toBeVisible()
})
