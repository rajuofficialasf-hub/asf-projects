// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { HousingApiError, type HousingRecord } from '@/backend'
import { UiProvider } from '@/ui'
import { ConfirmDialog } from './ConfirmDialog'
import { ErrorNotice } from './ErrorNotice'
import { Pagination } from './Pagination'
import { PhotoField } from './PhotoField'

// এডমিনের উইজেট পাবলিক উইজেটের একই আচরণ রাখে কিনা (docs/plans/2026-10-11-1413-refactor-admin-ui-minimal-plan.md, U4)

beforeAll(() => {
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false })) as never
})
afterEach(cleanup)

const inUi = (ui: React.ReactNode) => render(<UiProvider>{ui}</UiProvider>)

describe('ErrorNotice', () => {
  it.each([
    ['CONFIG_ERROR', 'ব্যাকএন্ড সংযোগ কনফিগার করা হয়নি (.env.local দেখুন)।'],
    ['NETWORK_ERROR', 'ইন্টারনেট সংযোগ বা সার্ভারে সমস্যা।'],
    ['NOT_IMPLEMENTED', 'এই ব্যাকএন্ড অ্যাডাপ্টার এখনো তৈরি হয়নি।'],
    ['INTERNAL_ERROR', 'সার্ভারের নিজের বার্তা'],
  ] as const)('shows the hint for %s as an alert with its title', (code, text) => {
    inUi(<ErrorNotice title="লোড করা যায়নি" error={new HousingApiError(code, 'সার্ভারের নিজের বার্তা')} />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('লোড করা যায়নি')
    expect(alert).toHaveTextContent(text)
  })
})

describe('ConfirmDialog', () => {
  it('focuses cancel, cancels on Esc, and ignores Esc while busy', async () => {
    const user = userEvent.setup()
    let cancelled = 0
    const view = inUi(<ConfirmDialog open title="মুছবেন?" tone="danger" onConfirm={() => {}} onCancel={() => (cancelled += 1)} />)
    expect(await screen.findByRole('dialog', { name: 'মুছবেন?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'বাতিল' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(cancelled).toBe(1)

    view.rerender(
      <UiProvider>
        <ConfirmDialog open busy title="মুছবেন?" onConfirm={() => {}} onCancel={() => (cancelled += 1)} />
      </UiProvider>,
    )
    await user.keyboard('{Escape}')
    expect(cancelled).toBe(1)
    expect(screen.getByRole('button', { name: 'অপেক্ষা করুন…' })).toBeDisabled()
  })

  it('keeps confirm disabled while confirmDisabled is set', () => {
    inUi(<ConfirmDialog open title="নিশ্চিত?" confirmLabel="হ্যাঁ" confirmDisabled onConfirm={() => {}} onCancel={() => {}} />)
    expect(screen.getByRole('button', { name: 'হ্যাঁ' })).toBeDisabled()
  })
})

describe('Pagination', () => {
  it('says 0–0 of 0 for an empty list, with both arrows disabled', () => {
    inUi(<Pagination meta={{ page: 1, page_size: 20, total: 0, total_pages: 1 }} onPageChange={() => {}} />)
    expect(screen.getByText('মোট ০ টির মধ্যে ০–০ দেখানো হচ্ছে')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'আগের পেইজ' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'পরের পেইজ' })).toBeDisabled()
  })
})

describe('PhotoField', () => {
  const record = { prev_photo_url: 'p/1.webp', prev_thumb_url: 'p/1-t.webp', photo_updated_at: null } as unknown as HousingRecord

  it('hides the uploader for a locked field that already has a photo, and says why', () => {
    inUi(<PhotoField kind="prev" record={record} item={null} onChange={() => {}} locked />)
    expect(screen.getByRole('group', { name: 'পূর্বের ঘরের ছবি' })).toBeInTheDocument()
    expect(screen.getByText('ছবি আগে থেকেই আছে — বদলাতে বা মুছতে পারেন শুধু মূল এডমিন।')).toBeInTheDocument()
    expect(document.querySelector('input[type=file]')).toBeNull()
  })

  it('offers the uploader inside the named group when there is no photo yet', () => {
    inUi(<PhotoField kind="prev" label="পূর্বের ঘর" item={null} onChange={() => {}} locked />)
    const group = screen.getByRole('group', { name: 'পূর্বের ঘর' })
    expect(group.querySelector('input[type=file]')).not.toBeNull()
  })
})
