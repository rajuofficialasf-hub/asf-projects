// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef, useState } from 'react'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { useDialogFocus } from './useDialogFocus'

// jsdom লেআউট করে না — সব এলিমেন্টকে "দেখা যায়" ধরি
beforeAll(() => {
  Element.prototype.getClientRects = function () {
    return [{}] as unknown as DOMRectList
  }
})
afterEach(cleanup)

function Dialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  useDialogFocus(ref, { initial: closeRef })
  return (
    <div ref={ref} role="dialog">
      <button ref={closeRef} onClick={onClose}>
        close
      </button>
      <button>middle</button>
      <button>last</button>
    </div>
  )
}

function Page() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>open</button>
      <input aria-label="behind" />
      {open && <Dialog onClose={() => setOpen(false)} />}
    </>
  )
}

describe('useDialogFocus', () => {
  it('focuses the initial element, keeps Tab inside and returns focus on close', async () => {
    const user = userEvent.setup()
    render(<Page />)
    const opener = screen.getByRole('button', { name: 'open' })
    await user.click(opener)
    expect(screen.getByRole('button', { name: 'close' })).toHaveFocus()

    await user.tab()
    await user.tab()
    expect(screen.getByRole('button', { name: 'last' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'close' })).toHaveFocus()
    await user.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'last' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })
})
