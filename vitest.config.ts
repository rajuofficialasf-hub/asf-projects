import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

// Unit (src/**/*.test.ts), UI component (src/**/*.test.tsx, jsdom per file) and backend-contract
// (tests/**/*.test.ts) tests.
// Browser flow specs live in e2e/ and run under Playwright (playwright.config.ts).
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'tests/**/*.test.ts'],
  },
})
