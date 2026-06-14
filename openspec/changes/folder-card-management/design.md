## Context

- Cards render via `public/js/card-canvas/modulehub-card-store.js` → `createCardElement`
- Folders: fixed folder icon, no `card-desc`, no ⚙; only `POST /admin/folder` exists
- Modules: ⚙ via `shouldShowGearForCard` (`nodeType === 'module'`); subtitle from `changelog`
- Human UI spec: `docs/change/1405-03-24-folder-card-management/behavior.md`

## Goals / Non-Goals

**Goals:**

- Parity: folder cards manageable from canvas like modules (metadata + lifecycle)
- Safe delete with explicit content policies and cascade confirmation
- Unified `cardDescription` on layout nodes; legacy changelog fallback for modules
- Static HTML card templates from module bundle (iframe, no scripts, layout locked)

**Non-Goals:**

- Live card polling / `/api/card-ui` (separate change `card-live-customization`)
- Pasting raw HTML into `site-layout.json`
- Module Manager auth on folders
- Dragging folders between parents on the grid (gear tree picker only)

## Decisions

### 1. `cardDescription` on `LayoutTreeNode`

Store subtitle on the placement node in `site-layout.json`, not only in `modules` map. Module `changelog` remains version notes; display uses `cardDescription ?? changelog`.

### 2. Folder APIs under `/admin/folder/:folderId`

| Method | Body | Notes |
|--------|------|-------|
| PATCH | `{ name?, cardDescription?, parentId? }` | `root`: rename only; validate parent not self/descendant |
| DELETE | `{ contentPolicy, targetFolderId?, confirmName? }` | Four policies per proposal |

After move: append folder's grid node to destination parent with empty slot (same as new-folder wizard). Use existing `writeSiteLayout` mutex.

### 3. Delete policies

- `reject-if-not-empty` → 409 `FOLDER_NOT_EMPTY`
- `move-to-parent` / `move-to-folder` → reparent children, remove folder node
- `cascade-delete` → require `confirmName === folder.name`; stop running modules then reuse module-delete service

### 4. Folder gear UI

Extend `dialog.js` with `showFolderGearDialog` — same `gear-actions-grid` as modules. `stopPropagation` on ⚙ click. Tree picker from cached `GET /api/layout`.

### 5. Static template (phase 2)

```json
"cardPresentation": {
  "mode": "static-template",
  "templatePath": "assets/card.html",
  "sandbox": "iframe",
  "layoutLocked": true
}
```

- Serve via module static path; iframe `sandbox=""` (no scripts)
- `card-canvas-app.js`: disable drag/resize when `layoutLocked`
- Server rejects PATCH changing grid position/size for locked nodes

**Alternative rejected:** `innerHTML` from JSON — XSS risk; iframe isolates failures.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Cycle on folder move | `isDescendant` validation before write |
| Accidental cascade delete | Type folder name + audit log |
| ⚙ click navigates into folder | `stopPropagation`; separate handler |
| Static template breaks grid | `layoutLocked` + no resize handles |
| Race on layout JSON | existing write queue |

## Migration Plan

- Add optional `cardDescription` — omit on old nodes; no migration required
- Deploy backend + frontend together for PATCH/DELETE
- Phase 2 static templates: opt-in per module manifest only

## Open Questions

- Auto-backup `site-layout.json` before cascade-delete? (design recommends optional backup hook)
- Toast copy for locked static card drag attempt — finalize in behavior.md during implement
