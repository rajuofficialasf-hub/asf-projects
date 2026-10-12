# Minimal upstream and deviations

Upstream: Minimal UI `starter-vite-ts` 7.7.0 (paid licence, see `LICENSE.md`). The unmodified starter is committed once in this folder and tagged `minimal-upstream-7.7.0`; every later change is listed below, one line each.

To update Minimal: commit the new pristine starter on a branch from the `minimal-upstream-7.7.0` tag, tag it, then 3-way merge that branch into this folder (base: the old tag) and walk this list again. Rebuild with the kit matrix before release.

`template.json` copies `src/` to `apps/web/src/ui/templates/minimal/` and `public/` to `apps/web/public/`. Nothing else in this folder reaches an app.

## Removed

- Root files: `.env`, `.gitignore`, `yarn.lock`, `package-lock.json`, `vercel.json`, `.vscode/`, `.editorconfig`, `.prettierignore`, `prettier.config.mjs`, `eslint.config.mjs`, `tsconfig*.json`, `vite.config.ts`, `index.html`, `README.md`, `package.json`: the app's base kit supplies npm workspaces, the lockfile, TypeScript (ST-10 flags), ESLint, Vite and the HTML entry.
- `src/main.tsx`, `src/app.tsx`, `src/routes/sections/`, `src/routes/paths.ts`, `src/pages/`, `src/sections/`: the app's routes, pages and error boundary come from the base kit (`apps/web/src/routes`, `apps/web/src/pages`).
- `src/auth/` (JWT in sessionStorage, sign-up, guards, mocked user) and the firebase, amplify, auth0 and supabase settings in `src/global-config.ts`: sign-in is the login pack's job, with HttpOnly cookies (RE-SEC-03, ST-04, ST-06).
- `src/lib/axios.ts`: the base kit's `src/api/client.ts` is the one API client, used through TanStack Query (RE-FX-02).
- `src/_mock/`, `src/layouts/nav-config-*.tsx`, `src/layouts/components/` (account, contacts, language, notifications, searchbar, workspaces, sign-in/out buttons, nav upgrade): demo data and demo header widgets.
- `src/components/hook-form/`: replaced by the contract's `Form`, `FormTextField`, `FormSelectField` and `FormSubmitButton` in `src/components/form.tsx`.
- `src/components/{custom-popover,file-thumbnail,flag-icon,loading-screen,progress-bar,search-not-found,svg-color}/`, `src/layouts/simple/`, `src/utils/`, `src/assets/data/`, `src/assets/icons/`, unused `src/assets/illustrations/*`, `src/theme/theme-overrides.ts`, `src/vite-env.d.ts`: not used by the kept code (the parts library keeps the full kit).
- `src/routes/components/error-boundary.tsx`: it printed stack traces to users; the base kit's route error screen replaces it (RE-CMP-02).
- `src/routes/hooks/use-router.ts` and the `nprogress` progress bar: they patched `window.history`; dropped with the `nprogress` dependency.
- `src/theme/core/components/{mui-x-data-grid,mui-x-date-picker,mui-x-tree-view,timeline}.tsx` and their theme augmentations: `@mui/x-*` and `@mui/lab` are not dependencies. Add them back with the component that needs them.
- `public/`: everything except the favicon and the five images the kept code references.
- Dependencies dropped: `axios`, `@mui/lab`, `@mui/x-data-grid`, `@mui/x-date-pickers`, `@mui/x-tree-view`, `autosuggest-highlight`, `dayjs`, `nprogress`, `stylis` (direct), `@hookform/resolvers`, `react-hook-form`, `react-router` and `zod` (the base kit owns these), and the starter's lint and format tooling. Kept dependencies are bumped to current versions in `template.json` so `npm audit --omit=dev --audit-level=high` is clean.

## Changed

- Imports: every `src/...` alias import now reads `@/ui/templates/minimal/...`, the app's existing `@/` alias, so no `baseUrl` is needed (removed in TypeScript 7).
- `src/global-config.ts`: only `appName` (`__APP_NAME__`), `appVersion` (`__KIT_VERSION__`, resets stored settings on kit upgrades) and `assetsDir`.
- `src/theme/theme-config.ts`: palette colours and font families come from the app's theme tokens (`apps/web/src/ui/tokens.ts`).
- `src/theme/create-theme.ts`: `shape.borderRadius` and `spacing` come from the theme tokens.
- `src/theme/core/components/index.ts`: no MUI X or Lab theme overrides.
- `src/theme/extend-theme-types.d.ts`: no `@mui/lab` or `@mui/x-*` theme augmentation imports.
- `src/theme/core/components/text-field.tsx`: a local owner-state type replaces the `@mui/x-date-pickers` import.
- `src/theme/core/components/avatar.tsx`: `charAt(0)` instead of `[0]` (noUncheckedIndexedAccess).
- `src/components/iconify/register-icons.ts`: skips an icon name without a prefix (noUncheckedIndexedAccess).
- `src/components/nav-section/{vertical,mini,horizontal}/nav-section-*.tsx`: `group.items[0]?.title` (noUncheckedIndexedAccess).
- `src/components/nav-section/utils/create-nav-item.ts`: `Record<string, unknown>` instead of `any` (ST-11), typed icon and info locals, and a guarded info lookup.
- `src/components/nav-section/{vertical,mini,horizontal}/nav-item.tsx`, `src/components/settings/drawer/base-option.tsx`: unused `theme` parameters removed (lint).
- `src/layouts/dashboard/layout.tsx`: navigation from the app (`slotProps.nav.data`, empty by default), a `headerActions` slot instead of the demo widgets, no role filter, an accessible name on the mobile menu button (RE-A11Y-01), and a typed `merge` result.
- `src/layouts/dashboard/nav-vertical.tsx`, `nav-mobile.tsx`: no "upgrade" promo block.
- `src/layouts/auth-split/layout.tsx`: no auth-method icons, no help link, and a typed `merge` result.
- `src/routes/components/index.ts`, `src/routes/hooks/index.ts`, `src/assets/illustrations/index.ts`: export only what is kept.

## Added

- `src/index.ts`: the template's entry; checks `./components` against the UI contract with `satisfies UiTemplate`.
- `src/components/*.tsx` (flat files, next to Minimal's component folders): the contract components (`UiProvider`, `AppShell`, `Page`, `SignInLayout`, `ErrorScreen`, `Stack`, `Heading`, `Text`, `Icon`, `Button`, `LinkButton`, `TextField`, `SelectField`, `Form`, `FormTextField`, `FormSelectField`, `FormSubmitButton`, `Dialog`, `Alert`, `useToast`, `LoadingState`, `EmptyState`, `DataTable`), built on Minimal's theme, layouts and components. `UiProvider` is the starter's `app.tsx` providers plus the toast host; `AppShell` adds the starter's scroll-to-top.
- `src/contract.test.tsx`: Vitest and Testing Library tests of the contract.
- `LICENSE.md`: Minimal's licence pointer, kept next to the code (not copied into apps).

## This app (house-construction)

Copied from the assunnah-engineering kit 0.16.0 (`skills/ae-new-app/kit/templates/minimal/src` and `kit/base/apps/web/src/ui`). Only the admin panel uses it; the public site keeps its Tailwind components. Changes from the kit copy:

- `contract.ts`: no `Form`, `FormTextField`, `FormSelectField`, `FormSubmitButton` (and no react-hook-form import). The admin forms keep their own state code, and the app has no react-hook-form or zod. `components/form.tsx` is removed and `contract.test.tsx` drops the form, TanStack Query and `@/api/client` cases.
- `tokens.ts`: primary is the site's brand green (`src/index.css`), fonts are Ubuntu Sans with Noto Sans Bengali (loaded by `index.html`).
- `global.css`: no fontsource imports and no bare-element rules. Vite keeps a lazy chunk's CSS on the page after the admin unmounts, so element rules would leak into the public site. The full-height and number-input baselines moved to `UiProvider`'s `GlobalStyles`, which Emotion removes on unmount. `@fontsource*` dependencies are not installed.
- `theme/theme-config.ts`: `cssVarPrefix` is `'mui'` (was `''`). Unprefixed MUI variables such as `--spacing` and `--font-*` land on `:root` and overwrite Tailwind v4's, which doubled every Tailwind size inside the admin. `components/scrollbar/styles.css` reads `--mui-palette-text-disabled`.
- `layouts/dashboard/*`, `layouts/auth-split/layout.tsx`: no settings button and no mini-nav toggle; the nav takes an accessible name (`AppShell.navLabel`), the phone menu button carries it and `aria-expanded`, the current item has `aria-current="page"`, and items match their path and below it unless `exact`. The sign-in header takes `headerActions`, and its logo links to the public home.
- `components/ui-provider.tsx`: no `SettingsDrawer` (one light theme); `components/settings/drawer/` is removed.
- `components/fields.tsx`: `SelectField` renders a native select (`slotProps.select.native`), so phones show their own picker and tests see a real `<select>`.
- `components/logo/logo.tsx`: the foundation's logo (`CONFIG.logoUrl`) linking to `CONFIG.homePath` (`/admin`), in place of the starter's drawn mark.
- `theme/core/components/button.tsx`: the `medium` size is 44px high (was 36px), the admin's smallest touch target on phones.
- `components/iconify/iconify.tsx`: an icon outside the bundled sets draws nothing instead of loading from the Iconify API.
- `components/toast.tsx`: toasts stack (up to five) instead of one Snackbar replacing the last, each with its own timer (4s, errors 6s) and close button, so an action that reports a success and a failure shows both, as the app's own toasts always did.
- `global-config.ts`: `appName`, `logoUrl`, `homePath` for this app.
- Pieces added for the admin (RE-UI-04), each typed in `contract.ts` and tested in `contract.test.tsx`: `Card`, `Tabs`, `Drawer`, `Badge`, `Checkbox`, `RadioGroup`, `Pagination`, `FileInput`, `Menu`, `Breadcrumbs`, `IconButton` (`components/{card,tabs,drawer,badge,choice,pagination,file-input,menu,breadcrumbs,icon-button}.tsx`). `TextField` gained `date`, `maxLength`, `inputMode`, `readOnly`, `autoFocus`, `hideLabel`, `prefix` and `size`, and announces its error (`role="alert"`). `Page` gained `breadcrumbs`, `badges` and `documentTitle`. `DataTable` takes node headers, `loadingLabel`, `dense`, and `cardsOnPhones` (cards below 600px). More contract icon names.
- Lint: `.oxlintrc.json` (`no-restricted-imports`) replaces the kit's `eslint.config.js` rule (RE-UI-05), and also keeps `@/ui` out of public code. `scripts/check-prod-bundle.mjs` fails if MUI or Emotion reaches a public chunk.

### Admin polish pass (2026-10-12)

- `layouts/dashboard/layout.tsx`, `layouts/auth-split/layout.tsx`: the hidden demo `<Alert>` ("This is an info Alert.") in the header's `topArea` is removed. It had `role="alert"`, so screen readers could announce it.
- `layouts/core/layout-section.tsx`: `LayoutRoot` grows to the window (`display: flex`, `flex: 1 1 auto`, column). The kit's `global.css` did this; without it the sign-in split's side panel stopped short of the window bottom.
- `layouts/auth-split/section.tsx`: the side panel's title renders as `<p>` (variant `h3` kept), so the page's first heading is the form's `<h1>`.
- `components/ui-provider.tsx`: `html` gets `scrollbar-gutter: stable`, so short and long pages keep the same width.
- `components/toggle-group.tsx`: the 44px touch target is set from the group (`& .MuiToggleButtonGroup-grouped`), because the theme's two-class grouped rule beat the button's own `sx` and left the buttons 30px.
- `components/breadcrumbs.tsx`, `components/page.tsx`: breadcrumb links are 44px targets; `Page` spaces the breadcrumb slot (`mb: 1.5`) instead of `Breadcrumbs` carrying its own margin.
- `components/layout-pieces.tsx`: `StatList` columns are at least as wide as their value (`minmax(min-content, 1fr)`), so an amount such as "৳ ১,২৫,০০০" is not cut off.
- Contract additions, tested in `contract.test.tsx`: `DataTable` `phoneTitle` and `phoneActions` (a phone card's heading row); `Stack` `divided`; `FilterPanel` (filters that fold behind one counted button on phones) and `ActionBar` (a form's sticky Save/Cancel row) in `components/filter-panel.tsx`; icon `filter`.
