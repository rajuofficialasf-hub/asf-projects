---
title: A MUI template next to Tailwind v4 leaks both ways unless its variables are prefixed and its globals unmount
date: 2026-10-11
type: frontend
module: web/ui (Minimal template, admin) and the Tailwind public site
severity: high
tags: [mui, minimal, tailwind-v4, css-variables, lazy-chunk, emotion, globalstyles]
applies_when: an app runs the kit's Minimal/MUI template on some routes and Tailwind v4 on others, in one Vite build
---

# A MUI template next to Tailwind v4 leaks both ways unless its variables are prefixed and its globals unmount

## What happened
The kit's Minimal template, loaded only for `/admin/*`, broke Tailwind inside the admin: every Tailwind size doubled (`h-11` became 88px). Its own global CSS could also have reached the public pages after an admin visit, because a lazy chunk's CSS stays on the page.

## What didn't work
- Looking for a changed root font size: `html` stayed 16px. Tailwind v4 sizes are `calc(var(--spacing) * n)`, not rems.
- Trusting unmount to clean up: Vite injects a lazy chunk's CSS `<link>`/`<style>` once and never removes it. Emotion's styles do go away on unmount, but MUI's theme also leaves `dir` and `data-color-scheme` on `<html>`.

## What to do
1. Give MUI a CSS-variable prefix. The kit ships `cssVarPrefix: ''`, which makes MUI write `--spacing: 8px` and `--font-*` on `:root`, the same names Tailwind v4 uses.
   ```ts
   // src/ui/templates/minimal/theme/theme-config.ts
   cssVariables: { cssVarPrefix: 'mui', colorSchemeSelector: 'data-color-scheme' },
   ```
   Then update any raw `var(--palette-…)` in plain CSS to `var(--mui-palette-…)`. `theme.vars.*` follows the prefix by itself.
2. Keep the template's `global.css` free of element rules (`body`, `#root`, `img`, `ul`, inputs). Put the ones the template needs in a `GlobalStyles` inside `UiProvider`, which Emotion removes on unmount.
3. Take MUI's `<html>` attributes off when the last provider unmounts. Read the page's own attributes once per page, not per mount: a language switch remounts the provider, the old cleanup runs before the new one's effects, and a per-mount snapshot then mistakes the old marks for the page's own (`useHtmlMarksCleanup` in `ui-provider.tsx`).
4. Load the template only in a lazy chunk (`AdminApp` behind `admin/*`). No module the public route table imports statically may import `@/ui`.

## Why
Both systems claim the same global namespace: `:root` custom properties and bare element selectors. In this app the public side never mounts MUI, but the admin renders Tailwind pieces it keeps on purpose (the public field preview, `SafeImage`, the colour swatches), and SPA navigation carries CSS from one side to the other.

## How to prevent it
- `contract.test.tsx` asserts that MUI's styles define only prefixed variables (no bare `--spacing:` or `--font-*:`), and that after unmount no rule targets `html`, `body`, `:root` or `#root` and `<html>` has no `dir` or `data-color-scheme`, including after a remount.
- `e2e/admin/admin-shell.spec.ts` leaves the admin (after a language switch) and checks the public body background and a clean `<html>`.
- `scripts/check-prod-bundle.mjs` fails if MUI or Emotion reaches a public chunk, and `.oxlintrc.json` blocks `@/ui` in public code.
- A pixel diff of the public pages before and after (`.ae/shots/` scratch scripts) caught nothing after these fixes. Worth repeating whenever the template changes.

## Files
- `src/ui/templates/minimal/theme/theme-config.ts`
- `src/ui/templates/minimal/global.css`
- `src/ui/templates/minimal/components/ui-provider.tsx`
- `src/ui/templates/minimal/components/scrollbar/styles.css`
- `src/features/admin/layout/AdminApp.tsx`, `src/features/admin/layout/lazyAdminApp.ts`
- `src/ui/templates/minimal/UPSTREAM.md` ("This app")
