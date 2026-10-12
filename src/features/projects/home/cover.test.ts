import { describe, expect, it } from 'vitest'
import { coverIcon, coverSrc } from './cover'

// The server stores a cover's full file URL in cover_path; anything else has no URL to show.
describe('coverSrc', () => {
  it('passes the server\'s absolute cover URL through, busting the cache with updated_at', () => {
    const src = coverSrc('http://api.test/api/v1/photos/abc', '2026-10-07T00:00:00.000Z')
    expect(src).toMatch(/^http:\/\/api\.test\/api\/v1\/photos\/abc\?v=/)
  })

  it('gives null for no path and for a bare storage path', () => {
    expect(coverSrc(null, null)).toBeNull()
    expect(coverSrc('', null)).toBeNull()
    expect(coverSrc('housing/_projects/demo/cover.webp', null)).toBeNull()
  })
})

describe('coverIcon', () => {
  it('maps project icons the icon set lacks to the nearest one and keeps the rest', () => {
    expect(coverIcon('tin-house')).toBe('house')
    expect(coverIcon('house')).toBe('house')
    expect(coverIcon('heart')).toBe('heart')
    expect(coverIcon(null)).toBe(null)
  })
})
