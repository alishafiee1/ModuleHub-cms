## Context

Instances must live in `standalone-modules/<instance-id>/` per `docs/design.md` D3. Templates read-only in `core/catalog-modules/`.

## Goals / Non-Goals

**Goals:**
- Template gallery + markdown in catalog
- Copy on `POST /api/instances`
- Unique instance ids

**Non-Goals:**
- Docker for catalog templates (lightweight static/server-dynamic only in P2)
- Removing legacy built-in demos in same change (optional follow-up migration)

## Decisions

### 1. Template layout

```
core/catalog-modules/
├── image-gallery/
│   ├── manifest.template.json
│   ├── index.html
│   └── ...
└── markdown-viewer/
```

`manifest.template.json` uses placeholders: `{{instanceId}}`, `{{cardTitle}}`

### 2. Copy service

`CatalogInstanceService.create(templateId, instanceId, options)`:
1. Validate template exists
2. `fs.cp` template → `standalone-modules/<instanceId>/`
3. Replace tokens in manifest → `manifest.json`
4. `ModuleRegistry.upsert` + `SiteLayoutRegistry.addItem`

### 3. Route prefix

Gallery/md instances served at `/modules/<instance-id>/` (consistent with instance-on-disk rule).

## Risks

- Template drift vs instances → version field on template manifest
- Collision → 409 if id exists in registry or filesystem

## Testing Strategy

- Unit: copy, token replace, collision
- Integration: POST /api/instances auth, GET catalog list
