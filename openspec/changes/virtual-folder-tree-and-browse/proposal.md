## Why

ModuleHub v2 serves a **flat** homepage card list at `/` only. Product docs (`docs/design.md` P1) require Explorer-like **virtual folders** in `site-layout.json`, breadcrumb navigation, and an admin **Add card** at the end of each folder grid. Without this, managers cannot organize portfolio/education sections and cannot discover upload/catalog actions from the public UI.

## What Changes

- Extend `site-layout.json` with `folders[]`, `rootFolderId`, and per-item `folderId`
- Add layout item kind `admin-add` (visible only when admin session active)
- Add `GET /browse/<folder-path>/` to render folder + module cards for a virtual folder
- Render breadcrumb from `parentId` chain
- **Migration**: existing flat `items[]` → all items get `folderId: "root"`; inject default `folders: [{ id: "root", title: "خانه", parentId: null }]`
- Add card UI shell: modal with **New folder** | **Upload ZIP** | **From catalog** (catalog/instance wired in later change; stubs OK)
- Update homepage renderer to support folder context when at `/` (root folder)

## Capabilities

### New Capabilities

- `virtual-folder-layout`: JSON schema for folders tree + item `folderId` + `admin-add` kind
- `folder-browse-routes`: HTTP routes and breadcrumb resolution for virtual folder navigation
- `admin-add-card`: Add tile at end of grid + modal entry points (folder create; stub upload/catalog)

### Modified Capabilities

- `site-layout-registry`: Schema and API extended for folders; migration from flat v2 layout
- `public-homepage`: Render folder cards, module cards, Add card; breadcrumb; root vs browse URLs

## Impact

- **Data**: Breaking schema extension to `site-layout.json` (backward-compatible migration script)
- **Routes**: New `GET /browse/*`; `/` remains root folder view
- **Code**: `core/src/site-layout/*`, `core/src/public/homepage-renderer.ts`, `core/src/public/routes.ts`, admin layout API
- **Tests**: Jest for schema migration, breadcrumb resolution, browse route 200, Add card hidden for anonymous
- **Depends on**: `public-homepage-architecture-v2` (complete). Blocks catalog/settings phases for full Add flows.
