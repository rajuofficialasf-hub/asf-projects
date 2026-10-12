// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { lazy } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { Lazy } from './lazyPages'

afterEach(cleanup)

// কখনো শেষ না হওয়া lazy — fallback-ই দেখা যায়
const Never = lazy(() => new Promise<{ default: () => null }>(() => {}))

describe('Lazy', () => {
  it('shows a full-screen overlay while the record view loads, so the list below does not move', () => {
    render(
      <Lazy variant="dialog">
        <Never />
      </Lazy>,
    )
    const status = screen.getByRole('status')
    expect(status).toHaveClass('fixed', 'inset-0')
    expect(status).toHaveTextContent('লোড হচ্ছে…')
  })

  it('reserves the map banner height while the map panel loads', () => {
    render(
      <Lazy variant="banner">
        <Never />
      </Lazy>,
    )
    expect(screen.getByRole('status', { name: 'লোড হচ্ছে' })).toHaveClass('h-20')
  })

  it('keeps the plain page text by default (admin route)', () => {
    render(
      <Lazy>
        <Never />
      </Lazy>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('লোড হচ্ছে…')
    expect(screen.getByRole('status')).not.toHaveClass('fixed')
  })
})
