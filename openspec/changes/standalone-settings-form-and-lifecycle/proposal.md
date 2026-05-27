## Why

Current standalone flow is upload → **stopped** → manual **Approve** → **Start** (`core/src/modules/installer.ts`, `admin/routes.ts`). Documented target (`docs/design.md` F1, D10): Docker starts **after upload for settings**; incomplete params reopen form on admin card click; **Running** only after Save. This aligns UX with user expectation and reduces confusion between Approve/Start.

## What Changes

- After ZIP extract + registry: `docker compose up` in **settings pending** state
- Add `GET/PUT /api/modules/:id/settings` — read/write manifest docker/proxy/github/entryHtml fields + layout card image
- Add settings UI in `/admin` (and hook for gear dialog later): ports, resources, prefix, capabilities warnings, GitHub repo, entry HTML, card image
- Module status vocabulary: `installing` | `settings_pending` | `running` | `stopped`
- Gate reverse proxy API paths until `running` (landing `index.html` always served)
- **BREAKING (behavior)**: Default post-upload is settings_pending with container up, not stopped-only
- Deprecate separate Approve step when settings form completes (migrate admin UI)

## Capabilities

### New Capabilities

- `module-settings-form`: API + admin UI for post-install configuration
- `standalone-settings-lifecycle`: Status machine, compose up on upload, proxy gating until saved

### Modified Capabilities

- `module-installation`: Post-upload lifecycle and status defaults
- `docker-module-runtime`: Start for settings vs production running
- `reverse-proxy-routing`: 503 for API when `settings_pending`
- `admin-dashboard`: Replace Approve-centric flow with Settings + Save/Start
- `manifest-validation`: Optional `github`, `entryHtml` fields in schema

## Impact

- **Data**: `modules.json` status enum extended
- **Security**: Settings mode container up with limited proxy until admin confirms
- **Tests**: Lifecycle transitions, settings API auth, proxy blocked until running, form auto-fill from manifest
- **Depends on**: Standalone ZIP install (v2). Complements gear dialog (P2c) for reopening settings
