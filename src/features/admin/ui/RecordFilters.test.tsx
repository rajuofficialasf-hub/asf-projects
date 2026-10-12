// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { getDivisions, getDistricts } from '@/features/geo/geo'
import { EMPTY_FILTERS, type HousingFilters } from '@/features/housing/utils/filters'
import { UiProvider } from '@/ui'
import { RecordFilters } from './RecordFilters'

// এডমিনের রেকর্ড-ফিল্টার পাবলিক ফিল্টার-বারের একই নিয়ম মানে কিনা (docs/plans/2026-10-11-1413-refactor-admin-ui-minimal-plan.md, U7)

vi.mock('@/features/housing/hooks/useHousingYears', () => ({ useHousingYears: () => ({ status: 'ready', years: [2025, 2024] }) }))

beforeAll(() => {
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false })) as never
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function show(value: HousingFilters = EMPTY_FILTERS, activeCount = 0, onClear = () => {}) {
  const changes: HousingFilters[] = []
  render(
    <UiProvider>
      <RecordFilters projectType="tin" value={value} onChange={(next) => changes.push(next)} activeCount={activeCount} onClear={onClear} />
    </UiProvider>,
  )
  return changes
}

describe('admin record filters', () => {
  it('sets the year, and clears the lower levels when the division changes', () => {
    const division = getDivisions()[0]!.name
    const district = getDistricts(division)[0]!.name
    const changes = show({ ...EMPTY_FILTERS, division, district, upazila: 'x' })
    fireEvent.change(screen.getByRole('combobox', { name: 'সাল' }), { target: { value: '2024' } })
    expect(changes.at(-1)).toEqual({ ...EMPTY_FILTERS, division, district, upazila: 'x', year: 2024 })
    fireEvent.change(screen.getByRole('combobox', { name: 'বিভাগ' }), { target: { value: getDivisions()[1]!.name } })
    expect(changes.at(-1)).toEqual({ ...EMPTY_FILTERS, division: getDivisions()[1]!.name })
  })

  it('keeps district and upazila disabled until the level above is chosen', () => {
    show()
    expect(screen.getByRole('combobox', { name: 'জেলা' })).toBeDisabled()
    expect(screen.getByRole('combobox', { name: 'উপজেলা' })).toBeDisabled()
  })

  it('sends the trimmed name search only after the 500ms pause', () => {
    vi.useFakeTimers()
    const changes = show()
    fireEvent.change(screen.getByRole('searchbox', { name: 'উপকারভোগীর নাম' }), { target: { value: '  রহিমা ' } })
    act(() => vi.advanceTimersByTime(499))
    expect(changes).toEqual([])
    act(() => vi.advanceTimersByTime(1))
    expect(changes).toEqual([{ ...EMPTY_FILTERS, q: 'রহিমা' }])
  })

  // মোছা এখন পেইজের কাজ (ক্যাটাগরি-ফিল্টারও একসাথে মোছে), তাই বোতাম onClear ডাকে
  it('asks the page to clear every filter, and the button is off when nothing is set', () => {
    const onClear = vi.fn()
    show({ ...EMPTY_FILTERS, year: 2025 }, 1, onClear)
    fireEvent.click(screen.getByRole('button', { name: 'ফিল্টার মুছুন' }))
    expect(onClear).toHaveBeenCalledOnce()
    cleanup()
    show()
    expect(screen.getByRole('button', { name: 'ফিল্টার মুছুন' })).toBeDisabled()
  })
})
