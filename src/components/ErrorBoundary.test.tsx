// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

afterEach(cleanup)

function Boom({ fail }: { fail: boolean }) {
  if (fail) throw new Error('boom')
  return <p>page content</p>
}

describe('ErrorBoundary', () => {
  it('shows the error box, then clears it when resetKey changes (another page)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { rerender } = render(
      <ErrorBoundary resetKey="/a">
        <Boom fail />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('কিছু একটা ভুল হয়েছে')
    expect(screen.getByText(/Error: boom/)).not.toBeVisible() // ভাঁজ করা বিস্তারিতে

    rerender(
      <ErrorBoundary resetKey="/a">
        <Boom fail={false} />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toBeInTheDocument() // একই পেইজে নিজে মুছে যায় না

    rerender(
      <ErrorBoundary resetKey="/b">
        <Boom fail={false} />
      </ErrorBoundary>,
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('page content')).toBeInTheDocument()
  })
})
