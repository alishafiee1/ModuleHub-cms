## Context

v2: upload → `stopped` → Approve → Start. Target: settings mode Docker after upload (`docs/design.md` D10, F1).

## Goals / Non-Goals

**Goals:**
- Status machine: `settings_pending` | `running` | `stopped`
- Settings REST API + admin form
- Proxy gated until `running`

**Non-Goals:**
- Module password (P4)
- Git pull (P3)

## Decisions

### 1. Post-upload flow

1. ZIP install completes → status `settings_pending`
2. `DockerManager.startModule()` called immediately (settings mode)
3. Admin opens settings (auto or card click) → `GET /api/modules/:id/settings`
4. `PUT` saves manifest + layout icon → status `running` if valid; restart compose if needed

### 2. Proxy gating

`ReverseProxyManager`: proxy only when `status === 'running'`. When `settings_pending`, API returns 503 with message "Complete module settings first".

### 3. Settings fields

ports, resources, proxy.prefix, docker capabilities warnings, github (store only), entryHtml, site-layout icon/iconClass

### 4. Approve deprecation

Remove Approve button when settings form Save succeeds; keep Stop/Start for ops.

## Risks

- Container up before admin confirms resources → show warnings prominently
- Breaking change for automation expecting `stopped` after upload

## Testing Strategy

- Unit: status transitions, settings validation
- Integration: upload → settings_pending; API 503 until PUT settings → running → proxy works
