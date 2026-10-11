// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import type { FieldDef } from '@/features/projects/fields'
import { UiProvider } from '@/ui'
import { FieldInput } from './FieldInput'

// এডমিনের ফিল্ড-ঘর পাবলিক ঘরের নিয়ম মানে কিনা (docs/plans/2026-10-11-1413-refactor-admin-ui-minimal-plan.md, U4)

beforeAll(() => {
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false })) as never
})
afterEach(cleanup)

const def = (over: Partial<FieldDef>): FieldDef => ({ key: 'k', label_bn: 'ঘর', label_en: 'Field', type: 'text', required: false, ...over }) as FieldDef

function show(d: FieldDef, value = '', extra: { suggestions?: string[] } = {}) {
  const changes: string[] = []
  render(
    <UiProvider>
      <FieldInput def={d} label="ঘর *" value={value} onChange={(v) => changes.push(v)} {...extra} />
    </UiProvider>,
  )
  return changes
}

describe('admin field input', () => {
  it('keeps the label as given (no second required star) and passes typed text through', async () => {
    const changes = show(def({ required: true }))
    await userEvent.type(screen.getByRole('textbox', { name: 'ঘর *' }), 'ক')
    expect(changes).toEqual(['ক'])
    expect(document.querySelector('label')?.textContent).toBe('ঘর *')
  })

  it('caps text at its max length, 500 by default', () => {
    show(def({}))
    expect(screen.getByRole('textbox', { name: 'ঘর *' })).toHaveAttribute('maxlength', '500')
  })

  it('shows the parsed taka next to a money value, and nothing for a bad one', () => {
    show(def({ type: 'money' }), '১,২০,০০০')
    expect(screen.getByRole('textbox', { name: 'ঘর *' })).toHaveAttribute('inputmode', 'numeric')
    expect(screen.getByText(/১,২০,০০০/, { selector: '[aria-live] *, [aria-live]' })).toBeInTheDocument()
  })

  it('offers earlier category values, and uses a phone keyboard and date picker where it should', () => {
    show(def({ type: 'category' }), '', { suggestions: ['টিন'] })
    expect(screen.getByRole('combobox', { name: 'ঘর *' })).toHaveAttribute('list')
    cleanup()
    show(def({ type: 'phone' }))
    expect(screen.getByRole('textbox', { name: 'ঘর *' })).toHaveAttribute('type', 'tel')
    cleanup()
    show(def({ type: 'date' }))
    expect(screen.getByLabelText('ঘর *')).toHaveAttribute('type', 'date')
  })
})
