## Context

v2 delivers flat `site-layout.json` and `GET /` homepage. `docs/design.md` defines virtual folder tree (P1) with `folders[]`, `folderId`, and admin Add card.

## Goals / Non-Goals

**Goals:**
- Nested virtual folders in JSON only (no disk folders per category)
- Browse routes with breadcrumb
- Add card at end of grid for admins
- Migration script for existing layouts

**Non-Goals:**
- Catalog instance copy (P2)
- Full settings form (P2b)
- Drag-and-drop reorder WYSIWYG

## Decisions

### 1. Layout schema v3

```json
{
  "siteTitle": "...",
  "siteSubtitle": "...",
  "rootFolderId": "root",
  "folders": [
    { "id": "root", "title": "خانه", "parentId": null },
    { "id": "portfolio", "title": "نمونه‌کارها", "parentId": "root" }
  ],
  "items": [
    {
      "id": "gallery-trip",
      "folderId": "portfolio",
      "kind": "module",
      "pageType": "standalone",
      "route": "/modules/gallery-trip/",
      "sortOrder": 1
    },
    {
      "id": "add-slot",
      "folderId": "portfolio",
      "kind": "admin-add",
      "sortOrder": 99
    }
  ]
}
```

`kind`: `module` | `folder` (folder items navigate to child folder) | `admin-add`

### 2. URL resolution

- `GET /` → `rootFolderId`
- `GET /browse/<segment>/<segment>/` → walk folder titles or ids (use **id slug** in URL: `/browse/portfolio/y1404/`)
- Breadcrumb built from `parentId` chain

### 3. Add card visibility

Server-side: omit `admin-add` items from HTML unless `req.session.authenticated`.

### 4. Migration

`scripts/migrate-layout-v3.sh`: add `folders`, set all items `folderId: "root"`, default `kind: "module"`.

## Risks

- URL slug collision → use folder `id` not display title in path
- Large folder trees → validate max depth (e.g. 10)

## Testing Strategy

- Unit: Zod schema, breadcrumb builder, migration
- Integration: `GET /browse/portfolio/` 200, anonymous no Add card, admin sees Add
