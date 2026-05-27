## 1. Site layout schema v3

- [x] 1.1 Extend `SiteLayoutSchema` in `core/src/site-layout/types.ts`: `folders[]`, `rootFolderId`, item `folderId`, `kind`
- [x] 1.2 Implement migration loader: flat v2 → v3 with root folder
- [x] 1.3 Add `scripts/migrate-layout-v3.sh` for production layouts
- [x] 1.4 Write Jest tests: schema validation, orphan folder reject, v2 migration

## 2. Site layout registry

- [x] 2.1 Update `SiteLayoutRegistry` CRUD for folders and folder-scoped items
- [x] 2.2 Extend `PUT /api/site-layout` validation for v3 shape
- [x] 2.3 Add helper `resolveFolderPath(ids[])` and `buildBreadcrumb(folderId)`
- [x] 2.4 Write Jest tests: add folder, add item to folder, breadcrumb chain

## 3. Browse routes

- [x] 3.1 Add `GET /browse/*` in `core/src/public/routes.ts`
- [x] 3.2 Update `homepage-renderer.ts` to accept `currentFolderId` and filter items
- [x] 3.3 Render folder cards (`kind: folder`) linking to child browse URLs
- [x] 3.4 Write integration test: `/browse/portfolio/` 200 with expected titles

## 4. Admin Add card

- [x] 4.1 Render Add card when session authenticated; omit for anonymous
- [x] 4.2 Add modal HTML/JS: New folder | Upload ZIP | From catalog (stubs)
- [x] 4.3 Wire New folder → `POST /api/site-layout/folders` or PUT layout
- [x] 4.4 Write Jest test: anonymous HTML has no `.card-add`; admin has `.card-add`

## 5. Documentation

- [x] 5.1 Update `docs/design.md` Implementation Matrix P1 row when complete
- [x] 5.2 Update `docs/public-homepage.md` with browse routes

## Dependencies

- Requires: `public-homepage-architecture-v2` (complete)
- Blocks: full catalog Add wiring (P2)
