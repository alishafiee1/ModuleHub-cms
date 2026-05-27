## 1. Status machine

- [x] 1.1 Extend `ModuleEntry.status`: `settings_pending` | `running` | `stopped` | `installing`
- [x] 1.2 Update `ModuleInstaller.install()` → settings_pending + compose up
- [x] 1.3 Write Jest tests: post-install status, registry persistence

## 2. Settings API

- [x] 2.1 Add `GET /api/modules/:id/settings` (auth + role)
- [x] 2.2 Add `PUT /api/modules/:id/settings` with Zod validation
- [x] 2.3 Map fields: ports, resources, prefix, github, entryHtml, layout icon
- [x] 2.4 Write Jest tests: GET auto-fill, PUT validation errors, PUT success → running

## 3. Proxy gating

- [x] 3.1 Update `ReverseProxyManager` to allow proxy only when `running`
- [x] 3.2 Return 503 with settings message when `settings_pending`
- [x] 3.3 Write Jest/integration test: API 503 before settings, 200 after

## 4. Admin UI

- [x] 4.1 Add settings form panel in `dashboard.html`
- [x] 4.2 Open form on card click when settings_pending
- [x] 4.3 Remove redundant Approve flow when settings Save succeeds
- [x] 4.4 Manual test checklist in PR description

## 5. Manifest schema

- [x] 5.1 Add optional `github`, `entryHtml` to `ManifestSchema`
- [x] 5.2 Update `docs/module-spec.md` if field status changes from planned

## Dependencies

- Requires: standalone ZIP install (v2)
- Enables: gear Settings tab (P2c)
