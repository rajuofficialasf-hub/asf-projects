/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { tokens } from './tokens'

// Vitest empties CSS imports (even ?raw), so the stylesheet is read from disk.
const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8')

// The admin theme must use the same brand green as the public site's Tailwind tokens.
const brand = (step: number) => css.match(new RegExp(`--color-brand-${step}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1]?.toLowerCase()

describe('theme tokens', () => {
  it('take the primary scale from the site brand green in src/index.css', () => {
    const { primary } = tokens.colors
    expect(primary.lighter.toLowerCase()).toBe(brand(100))
    expect(primary.light.toLowerCase()).toBe(brand(400))
    expect(primary.main.toLowerCase()).toBe(brand(600))
    expect(primary.dark.toLowerCase()).toBe(brand(800))
    expect(primary.darker.toLowerCase()).toBe(brand(950))
  })

  it('use the fonts index.html loads, with Noto Sans Bengali for Bengali letters', () => {
    expect(tokens.typography.fontFamily).toMatch(/^"Ubuntu Sans", "Noto Sans Bengali"/)
    expect(tokens.typography.headingFontFamily).toMatch(/^"Ubuntu Sans", "Noto Sans Bengali"/)
  })
})
