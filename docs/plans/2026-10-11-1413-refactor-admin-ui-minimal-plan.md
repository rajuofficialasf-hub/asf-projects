---
title: Revamp the admin panel UI with the Minimal template
type: refactor
status: in-progress
source: brainstorm
date: 2026-10-11
doc_review: 2026-10-11
---

# Revamp the admin panel UI with the Minimal template

## Goal
Every admin screen (`/admin/login` and `/admin/*`) looks and feels like the Minimal dashboard: its own full-screen shell, sidebar, top bar, cards, tables, forms and dialogs, in the site's brand green. Everything an admin, editor or main admin could do before, they can still do in the same way, with the same URLs, and the public site looks exactly as it does today.

## Problem
The admin panel was built screen by screen in plain Tailwind, sitting under the public site's header and footer. It works but reads as an add-on to the public site instead of a tool. The org now ships Minimal (MUI) in the `assunnah-engineering` plugin (`skills/ae-new-app/kit/templates/minimal/`, with ready-made pages in `parts/`), and the React rules (RE-UI-01..04) expect apps to build their UI on it through a `src/ui` component layer.

## What exists (don't re-decide)
- **Admin code:** `src/features/admin/` (about 30 `.tsx` files, ~6,400 lines): layout (`layout/AdminLayout.tsx`, `RoleGate.tsx`), pages (dashboard, projects, wizard, settings with fields/stats tabs, records list and form, import, photo bulk, activity, users), dialogs (unpublish, delete project), and shared Tailwind helpers (`ui/styles.ts`, `ui/Badge.tsx`, `ui/Field.tsx`, `ui/Step.tsx`).
- **Routing:** `src/app/routes/appRoutes.tsx` (`adminRoutes`) mounts `/admin/login` (`features/housing/pages/HousingLoginPage.tsx`) and `/admin/*` (behind `RequireAdmin`, pages lazy from `features/admin/pages/lazyAdminPages.tsx`). All of it sits inside `SiteLayout` today, under the public `SiteHeader`.
- **Widgets the admin borrows from the public side:** `features/housing/components/{ConfirmDialog,ErrorNotice,Pagination,HousingFilters,ImageUploader,PhotoField,SafeImage}`, `features/geo/GeoSelect`, the field inputs and `FIELD_INPUT_CLASS` in `features/projects/fields`, `components/Toast` + `useToast`, `pages/NotFoundPage`.
- **Template source:** Minimal `starter-vite-ts` 7.7.0 adjusted to the org rules (`kit/templates/minimal/src`, `UPSTREAM.md`), the contract-component recipe (`skills/ae-new-app/references/ui-components.md`), and reference pages in `kit/templates/minimal/parts/` (read and rebuild, never import).
- **Tests:** admin e2e specs in `e2e/admin/` (they mostly find things by role, label and text), public specs in `e2e/public/` and `e2e/mock/`, and `npm run check:prod-bundle`.

## Requirements

### Public site stays the same
- **R1** Every public page (home, project lists, group landings, record detail modal, 404) looks and behaves exactly as before. The public e2e specs pass with no change.
- **R2** The public bundle loads no MUI, Emotion or Minimal code; the template loads only with the admin (and login) chunks.
- **R3** No public component file changes its rendered markup or styles. Where the admin needs a Minimal version of a shared widget, it gets its own admin-side version, and the public copy stays as it is.

### Behaviour stays the same
- **R4** All admin URLs, redirects (including the legacy `/housing/admin/*` ones), guards (`RequireAdmin`, `RoleGate`) and role rules (main admin / admin / editor, per `CLAUDE.md`) stay as they are.
- **R5** Every admin action available today (create, edit, publish/unpublish, delete, import, photo bulk update, CSV export, user management, activity log filters and so on) is still available to the same roles, with the same validations, confirmations, error messages and success messages.
- **R6** All admin text (Bengali and English, through `t()`/`lt()`) stays word for word. Only the layout and styling change.
- **R7** The admin e2e specs pass. A spec may change only how it locates an element (a selector), never what it asserts.

### Admin shell
- **R8** `/admin/*` renders in Minimal's full-screen dashboard layout, with no public header or footer: a sidebar on desktop, a drawer opened from the top bar on phones.
- **R9** The sidebar keeps today's groups and items, filtered by role the same way: Panel (dashboard, projects, users), Records (one item per project, with drafts marked), Tools (import, photo bulk update, activity log). The current page is highlighted.
- **R10** The top bar has an account menu that shows the user's name or email and role, a "view public site" link and logout, with the same logout behaviour (activity log entry, redirect home, error shown on failure).

### Admin pages and parts
- **R11** `/admin/login` uses Minimal's sign-in layout, with the same fields, errors and redirect after login.
- **R12** Every admin page (dashboard, projects, wizard, settings with fields/stats tabs, records list and form, import with its review panels, photo bulk, activity, users) is rebuilt on Minimal-based components: page header with breadcrumbs or title, cards, tables, form fields, buttons, tabs, dialogs, drawers, badges and empty/loading/error states.
- **R13** Inside the admin, the borrowed widgets (confirm dialog, error notice, pagination, filters, geo select, image upload/photo field, field inputs, toast) appear in Minimal style, with the same props and behaviour.
- **R14** The field preview in project settings (`FieldPreview`) keeps the public look, since it shows how the public site will display a field.
- **R15** Admin screens keep working on phones: touch targets stay at least 44px, and tables and forms stay usable at 360px wide.
- **R16** Keyboard and screen-reader use is no worse than today: dialogs and drawers trap focus and close on Esc, and every control keeps an accessible name.

### Theme
- **R17** The admin uses one light theme: Minimal's design with its primary colour set to the brand green (`--color-brand-*` in `src/index.css`) and its fonts set to Ubuntu Sans with Noto Sans Bengali, so Bengali text renders well. There is no dark mode and no settings drawer.

## Scope
- In: the template and a `src/ui` component layer (RE-UI-01..04), the admin shell, the admin login page, every page and dialog under `src/features/admin/`, admin-side Minimal versions of the borrowed widgets, and spec selector updates.
- Out (not now): any public page or component; server, API, database or adapter changes; new admin features, new pages or extra dashboard widgets (charts, new stats); copy changes; dark mode or the settings drawer; moving the public site to Minimal; adopting TanStack Query (still a later proposal, see `CLAUDE.md`).

## Key decisions
- **Real Minimal on MUI, through a `src/ui` layer**: follows RE-UI-01..04, and the template can be swapped or updated later without touching pages. Chosen over a Tailwind look-alike and over an MUI shell around Tailwind pages. Governs R2, R12, R13.
- **Admin gets its own full-screen dashboard shell**: an admin tool shouldn't sit under the public header. URLs stay the same. Governs R8–R10.
- **Login page is restyled too**: so the whole admin journey is one look. Governs R11.
- **Minimal design + brand green + Ubuntu Sans/Noto Sans Bengali**: keeps the foundation's colour and good Bengali rendering. Governs R17.
- **Admin gets Minimal versions of shared widgets, public copies untouched**: the admin is fully consistent and the public site doesn't move. `FieldPreview` is the exception because it previews the public look. Governs R3, R13, R14.
- **Light mode only, no settings drawer**: the smallest surface and the least to test. Governs R17.
- **Pure UI change**: no functionality, copy, URL or role change. The user's explicit condition. Governs R4–R7.

## Success criteria
- `npm run test:e2e:mock`, `npm run test:e2e:rest`, `npm run test:e2e:rest-admin`, `npm test`, `npm run build`, `npm run lint` and `npm run check:prod-bundle` all pass.
- Before/after screenshots of each public page show no visual difference.

## Technical decisions
- **Stack profile gains one line for the UI template** (ST-40..44): React 19 + Vite + TS, Express, postgres.js, own auth and the storage adapter stay as in `CLAUDE.md`. The only addition is the UI template (MUI + Emotion), which R12 needs. U1 adds a line for it to `CLAUDE.md`'s Stack profile, with the reason (ST-43). No server, database or adapter change.
- **The `src/ui` layer from the kit** (RE-UI-01..03): copy `kit/base/apps/web/src/ui/{contract.ts,tokens.ts,index.ts}` to `src/ui/` and `kit/templates/minimal/src/` to `src/ui/templates/minimal/`, with `src/ui/index.ts` selecting it by one export line. Admin files import UI only from `@/ui`. Every `@mui/*`, `@emotion/*` or `minimal-shared` import lives under `src/ui/templates/minimal/`.
- **The `Form*` contract pieces are left out of this app's copy**: they need react-hook-form and zod, and the admin forms keep their current state code because R5 says behaviour doesn't change (RE-CMP-04 is a SHOULD). This is recorded in `src/ui/templates/minimal/UPSTREAM.md`, next to the kit's own deviations.
- **Tokens:** `primary` comes from the brand scale in `src/index.css`: `lighter` = `--color-brand-100`, `light` = `--color-brand-400`, `main` = `--color-brand-600` (`#227c4e`), `dark` = `--color-brand-800`, `darker` = `--color-brand-950`, `contrastText` white, and `fontFamily`/`headingFontFamily` = `"Ubuntu Sans", "Noto Sans Bengali", sans-serif` (R17). Both fonts are already loaded by `index.html`, so the template's `@fontsource*` imports and dependencies are dropped. There is one light mode and no `settings` drawer, so the settings context stays at its defaults with its UI unmounted.
- **Already in the kit contract:** `AppShell`, `Page`, `SignInLayout`, `ErrorScreen`, `Dialog`, `Alert`, `DataTable`, `EmptyState`/`LoadingState` and the rest of `UiTemplate`. Use them, and don't add them again.
- **Pieces the contract lacks are added first** (RE-UI-04), each with a type in `contract.ts`, a Minimal implementation and a test: `Card`, `Tabs`, `Drawer`, `Badge`, `Stepper`, `Checkbox`, `RadioGroup`, `Pagination`, `FileInput`, `Menu` (account menu) and `Breadcrumbs`. `TextField` with `rows` covers textareas.
- **Native controls stay native where the specs and touch users rely on them:** `SelectField` renders MUI's native select (`TextField select` + `slotProps.select.native`), so Playwright `selectOption` and the phone OS picker keep working. `FileInput` keeps a real, visually hidden `<input type="file">` with the same accessible label. `Checkbox`/`RadioGroup` render real inputs. `Dialog` and `Drawer` render `role="dialog"` named by their title (R7, R16).
- **Admin routes leave `SiteLayout`:** `App.tsx` gets a sibling `<Route>` for `adminRoutes` whose element is a lazy `AdminRoot` (`UiProvider` + `Outlet`). `/admin/login` becomes lazy too (today it's eager, `appRoutes.tsx:7`), so MUI only loads in admin chunks (R2). URLs, `RequireAdmin`, `RoleGate` and `LegacyAdminRedirect` are unchanged. The `*` not-found route stays under `SiteLayout`.
- **CSS coexistence:** Tailwind's preflight stays global. Emotion's styles are unlayered, so they win over Tailwind's `@layer base`. `CssBaseline` mounts only inside `AdminRoot`, and Emotion removes its global styles on unmount, so leaving the admin for the public site restores the public body styles. A U3 e2e check proves it.
- **Shared widgets:** the admin gets its own versions in `src/features/admin/ui/` (confirm dialog, error notice, pagination, geo select, image uploader/photo field, field inputs), reusing the existing logic modules (`housing/utils/uploadItems.ts`, `imageProcessing.ts`, `geo/*`, `projects/fields` value parsing) instead of copying logic. Public files are not edited (R3). `FieldPreview` keeps rendering the public field components (R14).
- **Toasts:** admin files move from `@/components/useToast` to the contract `useToast` from `@/ui`, with the same message strings. The public `ToastProvider` stays in `App.tsx` for the public site.
- **Import boundary lint** (RE-UI-05, adapted to oxlint): `.oxlintrc.json` gets `no-restricted-imports` blocking `@mui/*`, `@emotion/*`, `minimal-shared` and `@/ui/templates/*` everywhere, with an override for `src/ui/templates/**`. A second override blocks `@/ui` outside `src/ui`, `src/features/admin`, the admin login page, `RequireAdmin` and `AdminRoot`, so public code can't pull MUI in. If oxlint's overrides can't express this, `scripts/check-ui-imports.mjs` does the same and runs in `npm run lint`.
- **Bundle guard** (R2): `scripts/check-prod-bundle.mjs` also reads the Vite manifest, walks the chunks the entry loads statically, and fails if any contains MUI or Emotion markers (`MuiButtonBase`, `@emotion`).
- **New copy:** only the accessible names the new shell controls need (for example the account-menu button). Written with `ae-bangla-copy`, in Bengali script, and added to the English locale; `npm run i18n-check` passes. All existing strings stay word for word (R6).
- **Server stays the authority on roles and uploads** (NE-SEC-03, NS-03): this plan changes no route, so the existing server tests keep proving refusals, and they must stay green: `server/test/http/{editor-scope,records-private,admin-users,main-admin,projects-writes,records-photos,projects-cover,photos,security}.test.ts` (wrong role or other project gets 403, private values absent for editors, upload size limit in `server/src/photos/process.ts`, byte sniffing in `server/src/photos/sniff.ts`). The rebuilt upload widgets keep today's `accept` values (`PHOTO_SPEC.acceptMimes`, the import's spreadsheet list) and client-side size checks. No page requests more data than it does today.
- **CSP:** `helmet()` sets the CSP on API responses only. The UI is served by Vite or a static host, not by Express, so Emotion's runtime `<style>` tags meet no CSP today. Admin code uses no `dangerouslySetInnerHTML`. If a CSP is added to the UI host later, Emotion needs a nonce through its cache. That is out of scope here.
- **Tests** (TS-20): this is a pure restyle, so behaviour is proven by the existing e2e specs (`e2e/admin`, `e2e/mock`) passing with selector-only edits (R7). Contract pieces get Vitest + Testing Library tests in jsdom (`src/ui/templates/minimal/contract.test.tsx`), so vitest includes `src/**/*.test.tsx`. The admin shell had no spec, so it is characterized first (TS-24).

## Implementation units

### U1. Bring in the Minimal template and the `src/ui` layer
- **Goal:** the template builds and tests in this repo, and nothing renders it yet.
- **Requirements:** R2, R17
- **Files:** `package.json`, `package-lock.json`, `CLAUDE.md` (Stack profile: the UI template line), `src/ui/{contract.ts,tokens.ts,index.ts}`, `src/ui/templates/minimal/**` (copied from the kit), `src/ui/templates/minimal/UPSTREAM.md`, `src/ui/templates/minimal/contract.test.tsx`, `vitest.config.ts`, `.oxlintrc.json` (try its overrides first; `scripts/check-ui-imports.mjs` only as the fallback if they can't express the rule), `scripts/check-prod-bundle.mjs`, `tsconfig.app.json` (only if the template needs a type include)
- **Approach:** follow `kit/templates/minimal/template.json` (dependencies) and `UPSTREAM.md`. Drop `Form*` along with react-hook-form, zod, TanStack Query and the fontsource packages. Adapt `contract.test.tsx` the same way (no `@/api/client`). Set the tokens per Technical decisions. Before any UI change, capture baseline screenshots of the public pages (home, a project list, a group landing, the detail modal, the 404) at 1280px and 390px, with a scratch Playwright script under `.ae/` (not committed), for U10 to compare.
- **Tests:**
  - unit: the kit's contract tests, adapted, pass in jsdom (Button, TextField, SelectField native, Dialog, Alert, DataTable, EmptyState/LoadingState, toast).
  - existing: `npm test` passes; `npm run check:prod-bundle` passes, and fails when a public file temporarily imports `@/ui` (checked by hand once and noted in the commit body); `npm run lint` fails on a temporary `@mui/material` import in `src/pages/` (same).
- **Done when:** `npm run build`, `npm run lint`, `npm test` and `npm run check:prod-bundle` pass, and no page has changed.
- **Depends on:** none
- **Size:** L
- **Risk area:** none
- **Status:** done

### U2. Add the missing pieces to the component set
- **Goal:** the contract has every piece the admin screens need.
- **Requirements:** R12, R13, R15, R16
- **Files:** `src/ui/contract.ts`, `src/ui/templates/minimal/components/{card,tabs,drawer,badge,stepper,checkbox,radio-group,pagination,file-input,menu,breadcrumbs}.tsx`, `src/ui/templates/minimal/components/index.ts`, `src/ui/templates/minimal/index.ts`, `src/ui/templates/minimal/contract.test.tsx`
- **Approach:** the recipe in `skills/ae-new-app/references/ui-components.md` ("Add a missing piece"). Build each piece on Minimal's theme, following the flat files from U1 (`dialog.tsx`, `fields.tsx`). Props stay plain, with no `sx` and no MUI types. Touch targets are at least 44px.
- **Tests:**
  - unit (one block per piece): it renders its content; its main interaction works (tab switch changes the panel and `aria-selected`; Drawer and Menu open, close on Esc and return focus; Checkbox and RadioGroup report changes and have accessible names; Pagination calls `onChange` and disables at the ends; FileInput fires with the chosen files and is found by its label; Stepper marks the current step with `aria-current`); and it handles an empty or disabled state.
- **Done when:** `npm test` and `npm run build` pass, and `satisfies UiTemplate` holds.
- **Depends on:** U1
- **Size:** L
- **Risk area:** none
- **Status:** done

### U3. Admin shell, routing and sign-in on Minimal
- **Goal:** `/admin/*` runs in Minimal's dashboard shell and `/admin/login` in its sign-in layout, outside the public header and footer.
- **Requirements:** R1, R2, R4, R8, R9, R10, R11, R15, R16
- **Files:** `src/App.tsx`, `src/app/routes/appRoutes.tsx`, `src/features/admin/layout/AdminRoot.tsx` (new), `src/features/admin/layout/AdminLayout.tsx`, `src/features/housing/components/RequireAdmin.tsx` (admin-only; loading and error states move to `LoadingState`/`Alert`), `src/features/housing/pages/HousingLoginPage.tsx`, `src/features/admin/pages/lazyAdminPages.tsx`, `src/features/housing/pages/lazyPages.tsx` (only if the admin `Lazy` fallback needs an admin variant; public fallback unchanged), `src/i18n` locale files, `e2e/admin/admin-shell.spec.ts` (new), `e2e/mock/login.spec.ts`, `e2e/mock/route-protection.spec.ts`
- **Approach:** `AppShell` from the template with `navigation` built from today's role-filtered groups and `headerActions` = an account `Menu` (name or email, role, "পাবলিক সাইট দেখুন", "লগআউট") that keeps today's `logout()` code. The not-found screen inside admin uses `ErrorScreen` with today's text.
- **Tests:**
  - e2e (`e2e/admin/admin-shell.spec.ts` on admin-rest, written first against today's layout, then given selector-only edits): as main admin on `/admin`, the nav named "এডমিন মেনু" shows "ড্যাশবোর্ড", "প্রকল্পসমূহ", "ইউজার" and one link per project; as editor, "প্রকল্পসমূহ" and "ইউজার" are absent; the current page's link is marked current (`aria-current="page"`); at 390px wide, the "এডমিন মেনু" button opens the drawer, Esc closes it, and following a link closes it; "লগআউট" goes to `/`, and `/admin` then redirects to `/admin/login`; "পাবলিক সাইট দেখুন" goes to `/`, the public header is visible, and `body`'s background is the public one (Tailwind v4 reports `oklch(0.984 0.003 247.858)`).
  - e2e: on `/admin` the public site header (the banner landmark of `SiteHeader`) is absent.
  - existing: covered by `e2e/mock/login.spec.ts`, `e2e/mock/route-protection.spec.ts`, `e2e/admin/smoke.spec.ts`; `npm run check:prod-bundle` (MUI not in entry chunks).
- **Done when:** the specs above pass, a public page in the browser looks unchanged, and the bundle check passes.
- **Depends on:** U2
- **Size:** L
- **Risk area:** auth (route guards and logout are re-wired)
- **Status:** done

### U4. Admin versions of the shared widgets and helpers
- **Goal:** the admin has Minimal versions of every widget it borrows, with the same props and behaviour.
- **Requirements:** R3, R13, R14
- **Files:** `src/features/admin/ui/{ConfirmDialog,ErrorNotice,Pagination,GeoSelect,ImageUploader,PhotoField}.tsx` (new), `src/features/admin/ui/fields/*` (admin field inputs over `@/features/projects/fields` value logic), `src/features/admin/ui/{Badge,Field,Step}.tsx` (rebuilt on the contract), `src/features/admin/ui/styles.ts` (removed once unused, in U10)
- **Approach:** each admin widget copies the public one's props and accessible names, and calls the same logic modules (`uploadItems.ts`, `imageProcessing.ts`, `geo/*`, `projects/fields`). No public file is edited.
- **Tests:**
  - unit: none new; the widgets are compositions of tested contract pieces, and their logic modules keep their tests.
  - existing: exercised end to end by the page units' specs (U5–U9).
- **Done when:** `npm run build` and `npm run lint` pass, and `git diff` shows no change under the public component folders.
- **Depends on:** U2
- **Size:** L
- **Risk area:** none
- **Status:** done

### U5. Dashboard, projects list, wizard and project dialogs
- **Goal:** these screens are on Minimal with the same behaviour.
- **Requirements:** R5, R6, R7, R12, R15
- **Files:** `src/features/admin/pages/{AdminDashboardPage,AdminProjectsPage,ProjectWizardPage}.tsx`, `src/features/admin/projects/{DeleteProjectDialog,UnpublishDialog}.tsx`
- **Approach:** `Page` (title, actions), `Card`, `DataTable`, `Badge`, `Stepper`, `RadioGroup`, `Dialog`. Data loading and handlers stay line for line.
- **Tests:**
  - e2e: none new (pure restyle, TS-20).
  - existing: covered by `e2e/admin/smoke.spec.ts`, `project-wizard.spec.ts`, `project-delete.spec.ts`, `delete-roles.spec.ts`, `project-settings.spec.ts` (unpublish), with selector-only edits.
- **Done when:** those specs pass.
- **Depends on:** U3, U4
- **Size:** M
- **Risk area:** none
- **Status:** todo

### U6. Project settings, fields, stats and cover
- **Goal:** the settings page and its tabs, drawer and pickers are on Minimal; the field preview keeps the public look.
- **Requirements:** R5, R6, R7, R12, R14, R16
- **Files:** `src/features/admin/pages/ProjectSettingsPage.tsx`, `src/features/admin/projects/tabs/{FieldsTab,StatsTab}.tsx`, `src/features/admin/projects/{FieldEditorDrawer,StatCardPicker,CoverUpload}.tsx` (`FieldPreview.tsx` unchanged)
- **Approach:** `Breadcrumbs` ("প্রকল্পসমূহ › <name>", replacing today's back link, with the same text), `Tabs` (tablist "সেটিংসের অংশ" with tabs "সাধারণ", "ফিল্ড", "পরিসংখ্যান", "ছবি", "প্রদর্শন" as today, still driven by `?tab=` in the URL), `Drawer` for the field editor (still a dialog named by its title), `FileInput` labelled "কভার ছবি দিন", and `Checkbox`/`RadioGroup`.
- **Tests:**
  - existing: covered by `e2e/admin/project-settings.spec.ts`, `fields-builder.spec.ts`, `stat-cards.spec.ts`, `stat-cards-filtered.spec.ts`, `project-cover.spec.ts`, `category-rename.spec.ts`, and `e2e/support/projects.ts`, with selector-only edits.
- **Done when:** those specs pass, and the field preview looks like the public field.
- **Depends on:** U3, U4
- **Size:** L
- **Risk area:** none
- **Status:** todo

### U7. Records list, table and form
- **Goal:** the records screens are on Minimal with the same role limits on private values, serials and photos.
- **Requirements:** R5, R6, R7, R12, R13, R15
- **Files:** `src/features/admin/records/{AdminRecordsPage,AdminRecordsTable,RecordForm,RecordFormPage,CategoryValuesPanel}.tsx`
- **Approach:** `Breadcrumbs` on the record form (records list › record, replacing today's back link, with the same text), `Page`, `DataTable` at 600px and wider, `Card` rows below 600px (R15), admin `Pagination`, admin field inputs, `PhotoField`, `GeoSelect`, `ConfirmDialog`. The editor limits (no emptying a filled value, no serial change, no photo replace) keep their current conditions.
- **Tests:**
  - existing: covered by `e2e/mock/{record-create,record-edit,record-delete,record-validation,serial-change,csv-export,photo-upload}.spec.ts` and `e2e/admin/{csv-export-private,category-rename,delete-roles}.spec.ts`, with selector-only edits.
- **Done when:** those specs pass on both lanes.
- **Depends on:** U3, U4
- **Size:** L
- **Risk area:** personal data (beneficiary records and private values shown by role)
- **Status:** todo

### U8. Bulk import and bulk photo update
- **Goal:** import (with its review panels) and photo bulk update are on Minimal with the same steps and results.
- **Requirements:** R5, R6, R7, R12, R13
- **Files:** `src/features/admin/import/{ImportPage,GeoFixPanel,CategoryReviewPanel}.tsx`, `src/features/admin/photos/PhotoBulkPage.tsx`
- **Approach:** `Stepper` for the import steps, `FileInput` (real input kept for `setInputFiles`), `DataTable`, `Alert`, `SelectField` native.
- **Tests:**
  - existing: covered by `e2e/mock/{import-new,import-update,photo-bulk}.spec.ts` and `e2e/admin/import-custom-fields.spec.ts`, with selector-only edits.
- **Done when:** those specs pass.
- **Depends on:** U3, U4
- **Size:** L
- **Risk area:** none
- **Status:** todo

### U9. Activity log and users
- **Goal:** the activity log and user management are on Minimal with the same filters and main-admin-only actions.
- **Requirements:** R4, R5, R6, R7, R12
- **Files:** `src/features/admin/activity/ActivityPage.tsx`, `src/features/admin/users/AdminUsersPage.tsx`
- **Approach:** `Page`, `DataTable`, `SelectField` native filters, `Checkbox` (project scope, "all projects"), `Dialog`, `Badge` for roles.
- **Tests:**
  - existing: covered by `e2e/mock/activity.spec.ts` (its `nth()` list locators may need selector edits), `e2e/admin/admin-users.spec.ts` and `e2e/mock/admin-users.spec.ts`.
- **Done when:** those specs pass.
- **Depends on:** U3, U4
- **Size:** M
- **Risk area:** auth (the user and role management screen)
- **Status:** todo

### U10. Cleanup, public check and docs
- **Goal:** no Tailwind leftovers in the admin, proof the public site didn't change, and docs that say how the admin UI is built.
- **Requirements:** R1, R2, R3, R6
- **Files:** `src/features/admin/ui/styles.ts` (removed), any now-unused admin helpers, `docs/DEVELOPER_GUIDE.md` (an "Admin UI" section: `src/ui`, adding a piece, the lint and bundle guards), `docs/ADMIN_GUIDE.md` (only screenshots or wording that names old layout positions)
- **Approach:** grep `className=` under `src/features/admin` (only `FieldPreview`'s public render path may keep Tailwind). Compare public screenshots with the U1 baseline. Run `git diff main --stat -- src/app src/components src/pages src/features/housing src/features/projects src/features/geo src/index.css index.html`. The only files allowed to change are `src/App.tsx`, `src/app/routes/appRoutes.tsx` (public routes unchanged) and the admin-only files under `src/features/housing/`: `components/RequireAdmin.tsx`, `pages/HousingLoginPage.tsx`, and `pages/lazyPages.tsx` if U3 touched it. No public component file changes.
- **Tests:**
  - existing: the full Verification list below.
- **Done when:** Verification passes, the screenshot diff shows no public change, and the docs are updated.
- **Depends on:** U5, U6, U7, U8, U9
- **Size:** S
- **Risk area:** none
- **Status:** todo

## Checkpoints
- **Mode:** grouped (one by one 10 → added to grouped since N > 4; grouped 17, all at once 0)
- **Signals:** N 10, L 3,150, R 3, Fd 3, C 5, P 2
- **C1** after U1: a foundation for everything, a new pattern (the `src/ui` layer), and new dependencies. The vendored template copy is reviewed against `UPSTREAM.md`, and only the repo-specific changes are read line by line.
- **C2** after U2: a foundation for U3–U9, and a new pattern (contract extensions).
- **C3** after U3: risk (route guards and logout re-wired).
- **C4** after U4: a foundation for U5–U9.
- **C5** after U7: risk (personal data), covering U5–U7, under 1,000 estimated lines.
- **C6** after U9: risk (user management), covering U8–U9.
- **C7** after U10: end.

## Verification
- `npm run build` (tsc + vite build), `npm run lint`, `npm test`, `npm run i18n-check`
- `npm run check:prod-bundle` (now also: no MUI/Emotion in entry chunks)
- `npm run test:e2e:mock` (admin and public on the mock lane)
- `docker compose up -d db`, then `npm --prefix server test` (role refusal and upload checks unchanged)
- `docker compose up -d db s3`, then `npm run test:e2e:rest-admin` (admin specs on the server; not at the same time as the other `housing_test` suites)
- `npm run test:e2e:rest` with the compose API (public specs unchanged)
- A live Chrome check of `/admin`, `/admin/login`, a settings page, the record form at 390px, and two public pages.

## Risks and rollback
- **Public look drifts** (R1): guarded by the lint boundary, the bundle check, unchanged public specs and the U1/U10 screenshot diff. Rollback: revert the branch. There is no data or server change.
- **Guards re-wired (U3)**: the server still enforces every role (`server/src/auth/scope.ts`). The UI guards keep their code, only moved, and the shell spec and route-protection spec prove the redirects.
- **Spec edits hiding a behaviour change** (R7): reviewers check that every spec diff changes only locators, never `expect` targets or values.
- **Bundle size**: MUI adds weight to the admin chunks only. Note the admin chunk sizes from `vite build` in the U1 and U10 commit bodies.

## Definition of done
- All units done and their tests pass
- Verification commands pass
- `ae-review` has run, with no open P0 or P1
- Code from abandoned attempts is removed

## Progress
- **Branch:** `revamp/admin-ui`
- **Updated:** 2026-10-11 15:22
- **Next:** C4 review of U4, then U5 (dashboard, projects list, wizard, project dialogs).
- **Reviewed through:** C3 at 5397d26
- **Uncommitted:** none
- **Notes:** public baseline screenshots are in `.ae/shots/before/` (mock backend, `node .ae/shots/capture.mjs <base> <dir>`), for U10. The template's lazy CSS stays on the page after unmount, so `global.css` has no element rules (UPSTREAM.md, "This app"). U4: admin widgets are in `src/features/admin/ui/` (`ConfirmDialog`, `ErrorNotice`, `Pagination`, `GeoSelect`, `ImageUploader`/`UploadRow`/`StatusPill`, `PhotoField`, `FieldInput`, plus `Badge`/`Step` rebuilt on the set). Labels keep their exact text, including a trailing " *" where the old label had one; don't also pass `required`, or MUI adds a second star. The union field keeps the shared `UnionCombobox` (its ARIA combobox and spelling match are behaviour) with an input class that matches MUI's look; that and `SafeImage` are the only Tailwind left on purpose besides `FieldPreview`. `Field.tsx` and `styles.ts` stay until the pages stop using them (U10). U3: the admin's routes live in a lazy `AdminApp` (`admin/*` descendant routes) so `appRoutes.tsx` imports no `@/ui`; an unknown `/admin/...` path shows the admin's not-found screen without needing a login. The admin top bar carries its own `ভাষা` toggle (the public header's language switch would otherwise be lost) and an account menu (`অ্যাকাউন্ট মেনু`) holding "পাবলিক সাইট দেখুন" and "লগআউট"; e2e helpers `accountMenu()`/`logout()` in `e2e/support/auth.ts`. MUI's CSS variables now use the `mui` prefix: with the kit's empty prefix, MUI's `--spacing` overwrote Tailwind v4's and doubled every Tailwind size inside the admin. A Vite dev server's first cold start after the new dependencies logged one failed dynamic import of `AdminApp`; it did not recur. U2: the wizard's numbered sections use `Card` with `step` instead of a separate Stepper piece. `Drawer` takes a `closeLabel`, so the template stays language-neutral. C1: kit `medium` buttons were 36px (fixed to 44px); an icon outside the bundled sets would have called the Iconify API (now draws nothing). Pre-existing dev-only advisory: `adm-zip` through `mapshaper`. The user asked to go straight from planning into implementation without the start question.
