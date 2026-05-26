## Why

The initial MVP (`modulehub-cms-initial-core`) delivers admin tooling, Docker lifecycle, and module routing, but **does not match the revised product architecture**: visitors hitting `/` are redirected to `/admin`, there is no JSON-driven public homepage, regular pages (gallery, markdown viewer) are treated as uploaded static ZIPs instead of **built-in core modules**, and standalone modules are not required to ship an `index.html` landing page alongside Docker assets.

This change closes the gap between the deployed MVP and the user's refined vision: a simple public site for visitors, JSON-configured module tiles, built-in core pages, and a stricter standalone module contract (`index.html` + Docker).

## What Changes

- Add **public homepage** at `/` driven by `site-layout.json` (title, icon, page type, route, display order)
- Introduce **built-in core modules** (`core/builtin-modules/`) for regular pages: gallery, markdown viewer, etc. — implemented in core, registered in layout JSON
- **BREAKING**: Deprecate ZIP upload of `type: static` modules; static content pages are core-owned, not user-uploaded folders
- **BREAKING**: Standalone modules MUST include `index.html` at package root (validated on upload)
- Standalone modules remain in `standalone-modules/<id>/`; layout JSON references their public route (`/modules/<id>/`)
- After standalone upload: core parses `manifest.json` + `docker-compose.yml`, shows permission summary, admin approves, then Start/Stop via Docker Compose
- Keep **Docker stats** for monitoring (no separate resource JSON); show green status dot on homepage tiles for running modules
- Show **firewall port warning** after standalone start (existing behavior, surfaced on homepage admin overlay too)
- **Admin session on homepage**: authenticated admins with matching `admin_role` see Start/Stop/Logs on module tiles; module-specific admin UI MAY live inside the module itself
- Remove root redirect `/` → `/admin`; keep `/admin` as separate system management panel (module upload, global settings)
- Migrate `static-modules/sample-gallery/` to built-in gallery module

## Capabilities

### New Capabilities

- `public-homepage`: Public `/` page rendering module tiles from layout JSON; visitor navigation to built-in and standalone routes
- `site-layout-registry`: `site-layout.json` schema, load/save, validation, and API for layout items (title, icon, type, route, order)
- `builtin-modules`: Core-integrated page modules (gallery, markdown viewer) with manifests and Express routes under `/pages/<id>/`

### Modified Capabilities

- `static-module-serving`: Narrow to built-in module asset serving only; remove serving from `static-modules/` upload path
- `module-installation`: Require `index.html` + Docker files for standalone ZIP; reject `type: static` uploads
- `manifest-validation`: Add `index.html` presence check for standalone; add optional `homepage` presentation fields
- `admin-dashboard`: Split system admin (`/admin`) from public homepage admin controls (inline tile actions when session + role match)
- `module-registry`: Registry entries linked to `site-layout.json` items by module id; sync on install/uninstall
- `reverse-proxy-routing`: Host serves standalone `index.html` from module folder; proxy dynamic/API paths to Docker when running

## Impact

- **Routes**: `/` → public homepage; `/admin` → system admin; `/pages/<id>/` → built-in modules; `/modules/<id>/` → standalone (index from host, API via proxy)
- **Data**: New `core/data/site-layout.json`; `modules.json` schema extended with optional layout link fields
- **Folders**: New `core/builtin-modules/`; `static-modules/` deprecated (migration script removes sample-gallery from upload path)
- **Breaking**: Existing static module ZIP workflow removed; clients uploading static ZIPs must migrate to built-in pattern or standalone with Docker
- **Docs**: Update `docs/proposal.md`, `docs/module-spec.md`, root `README.md`
- **Server**: No nginx structural change; public `/` now serves content instead of redirecting to admin
- **Tests**: New Jest tests for layout registry, homepage rendering, standalone index.html validation
