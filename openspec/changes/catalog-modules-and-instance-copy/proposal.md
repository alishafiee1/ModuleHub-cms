## Why

Gallery and markdown demos are **fixed** built-ins in `core/builtin-modules/`. Product intent (`docs/design.md` D3/D7): each **Add** from a ready template creates an **independent instance** copied to `standalone-modules/<instance-id>/` with separate content and JSON registry entries. Managers need multiple galleries/markdown sections without ZIP or manual file copy.

## What Changes

- Add `core/catalog-modules/` with read-only templates (`image-gallery`, `markdown-viewer`)
- Load `CATALOG_MODULES_DIR` from config (`.env.example` already defines it)
- `GET /api/catalog` — list templates (auth required)
- `POST /api/instances` — `{ templateId, instanceId, cardTitle, cardImage?, folderId? }` → copy template → register in `modules.json` + `site-layout.json`
- Validate unique `instanceId` (kebab-case)
- Instance routes: `/modules/<instance-id>/` or `/pages/<instance-id>/` per template manifest
- Deprecate relying on single demo built-in ids for new sites (keep demos for backward compatibility)

## Capabilities

### New Capabilities

- `catalog-modules`: Template storage, listing API, manifest.template.json contract
- `module-instance-copy`: Copy service, collision checks, registry + layout hooks

### Modified Capabilities

- `module-registry`: Support instance entries copied from catalog (type may be `builtin`-like or lightweight standalone without Docker)
- `site-layout-registry`: Add item on instance create with `folderId`
- `module-installation`: Distinguish ZIP install vs catalog instance (no ZIP)
- `admin-add-card`: Wire **From catalog** option to catalog API (requires P1 Add modal)

## Impact

- **Folders**: New `core/catalog-modules/`; instances under `standalone-modules/<instance-id>/`
- **Config**: Wire `CATALOG_MODULES_DIR` in `core/src/server/config.ts`
- **Tests**: Catalog list, instance copy idempotency, duplicate id rejection, layout item created
- **Depends on**: P1 Add modal recommended; can ship API before UI
