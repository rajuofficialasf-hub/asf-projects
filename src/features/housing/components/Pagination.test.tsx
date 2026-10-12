// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Pagination } from './Pagination'

afterEach(cleanup)

describe('Pagination', () => {
  it('shows only the count line when everything fits on one page', () => {
    render(<Pagination meta={{ page: 1, page_size: 50, total: 12, total_pages: 1 }} onPageChange={vi.fn()} />)
    expect(screen.getByRole('navigation', { name: 'পেজিনেশন' })).toHaveTextContent('মোট ১২ টির মধ্যে ১–১২ দেখানো হচ্ছে')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows previous, page and next buttons when there is more than one page', () => {
    render(<Pagination meta={{ page: 1, page_size: 50, total: 120, total_pages: 3 }} onPageChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'আগের পেইজ' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'পরের পেইজ' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'পেইজ ৩' })).toBeInTheDocument()
  })
})
