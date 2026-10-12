// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { LanguageProvider } from '@/i18n'
import { SiteHeader } from './SiteHeader'

afterEach(cleanup)

function renderHeader() {
  const router = createMemoryRouter(
    [
      { path: '/', element: <SiteHeader /> },
      { path: '/other', element: <SiteHeader /> },
    ],
    { initialEntries: ['/'] },
  )
  render(
    <LanguageProvider>
      <RouterProvider router={router} />
    </LanguageProvider>,
  )
  return router
}

describe('SiteHeader mobile menu', () => {
  it('closes on Escape and gives focus back to the menu button', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(screen.getByRole('button', { name: 'মেনু খুলুন' }))
    expect(screen.getByRole('navigation', { name: 'মোবাইল মেনু' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('navigation', { name: 'মোবাইল মেনু' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'মেনু খুলুন' })).toHaveFocus()
  })

  it('closes when the page changes (including browser Back)', async () => {
    const user = userEvent.setup()
    const router = renderHeader()
    await user.click(screen.getByRole('button', { name: 'মেনু খুলুন' }))
    await act(() => router.navigate('/other'))
    expect(screen.queryByRole('navigation', { name: 'মোবাইল মেনু' })).not.toBeInTheDocument()
  })

  it('closes when tapping outside the header', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(screen.getByRole('button', { name: 'মেনু খুলুন' }))
    await user.click(document.body)
    expect(screen.queryByRole('navigation', { name: 'মোবাইল মেনু' })).not.toBeInTheDocument()
  })
})
