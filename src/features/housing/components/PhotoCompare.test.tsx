// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PhotoCompare } from './PhotoCompare'

afterEach(cleanup)

const frame = () => screen.getByRole('slider', { name: 'আগে-পরে ভাগ' }).parentElement!

describe('PhotoCompare zoom gestures', () => {
  it('lets a plain wheel scroll the page at 1x and zooms only with Ctrl (or a trackpad pinch)', () => {
    render(<PhotoCompare before="/a.jpg" after="/b.jpg" alt="নাম" compact />)
    expect(frame()).toHaveStyle({ touchAction: 'pan-y' })

    const plain = fireEvent.wheel(frame(), { deltaY: -100 })
    expect(plain).toBe(true) // preventDefault হয়নি — পেইজ/মডাল স্ক্রল করে
    expect(screen.getByText('১০০%')).toBeInTheDocument()

    const ctrl = fireEvent.wheel(frame(), { deltaY: -100, ctrlKey: true })
    expect(ctrl).toBe(false)
    expect(screen.queryByText('১০০%')).not.toBeInTheDocument()
    expect(frame()).toHaveStyle({ touchAction: 'none' }) // জুম অবস্থায় টাচ প্যানের জন্য
  })

  it('speaks the slider value with the project photo label', () => {
    render(<PhotoCompare before="/a.jpg" after="/b.jpg" alt="নাম" compact labels={{ before: 'মেরামতের আগে', after: 'মেরামতের পরে' }} />)
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '৫০% পর্যন্ত মেরামতের আগে')
  })
})
