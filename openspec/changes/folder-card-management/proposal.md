## Why

Virtual folders on the home canvas can only be opened — Super Admin cannot rename, move, delete, or add a subtitle from the UI. Module cards already have gear (⚙) management and optional descriptions; folder cards feel incomplete and force manual `site-layout.json` edits. This change closes that gap and adds optional **static** HTML card templates (layout-locked on the grid). Live/dynamic card UI is out of scope — see `card-live-customization`.

**Human docs:** `docs/change/1405-03-24-folder-card-management/` (proposal, design, behavior, tasks) — closed 2026-06-14

## What Changes

- Add `cardDescription` on layout tree nodes (folders and module placement nodes)
- Show ⚙ on folder cards for Super Admin (hidden in layout edit mode)
- Folder gear dialog: edit name/description, move to another folder, delete with content policy wizard
- `PATCH /admin/folder/:folderId` and `DELETE /admin/folder/:folderId` with four delete policies
- Module card subtitle: `cardDescription` with fallback to `changelog` for legacy modules
- Module gear settings: separate «توضیح کارت» field from version changelog
- Phase 2: `cardPresentation.mode: static-template` — sandboxed iframe, no drag/resize when `layoutLocked`
- Redirect when `?folder=` points to deleted folder

**Non-goals:** dynamic/live card data, custom folder icons, Module Manager on folders, drag-move folders on canvas (move via gear only)

## Capabilities

### New Capabilities

- `static-card-presentation`: Module manifest `cardPresentation` for static HTML iframe on cards with layout lock on the grid

### Modified Capabilities

- `virtual-folder`: PATCH/DELETE folder APIs, delete content policies, move validation (no cycles)
- `home-layout`: `cardDescription` field, folder card rendering with subtitle, static template rendering
- `admin-frontend`: folder gear visibility, folder gear dialog, tree picker, delete wizard, static card edit restrictions
- `module-management`: card description field in module settings (distinct from changelog)

## Impact

- **Types:** `core/src/modules/home-layout/types.ts` — `cardDescription`, delete policy types
- **Logic:** new `folder-management.ts`; extend layout routes
- **Frontend:** `modulehub-card-store.js`, `card-canvas-app.js`, `dialog.js`, `script.js`, `style.css`
- **Storage:** `storage/site-layout.json` schema + `docs/site-layout.json` sample
- **Manifest:** `module.json` validation for `cardPresentation` (phase 2)
- **Tests:** unit (tree ops), API, E2E-FCM-01..03, static template E2E
- **Docs:** `docs/ui-behavior.md` §2.5, `openspec/specs/*` deltas archived after apply
