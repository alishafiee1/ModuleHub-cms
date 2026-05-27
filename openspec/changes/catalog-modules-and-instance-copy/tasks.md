## 1. Config and templates

- [x] 1.1 Wire `CATALOG_MODULES_DIR` in `core/src/server/config.ts`
- [x] 1.2 Create `core/catalog-modules/image-gallery/` template from sample-gallery
- [x] 1.3 Create `core/catalog-modules/markdown-viewer/` template
- [x] 1.4 Define `manifest.template.json` token contract

## 2. Catalog API

- [x] 2.1 Implement `CatalogService.listTemplates()`
- [x] 2.2 Add `GET /api/catalog` (auth) in admin routes
- [x] 2.3 Write Jest tests: list templates, empty catalog dir

## 3. Instance copy

- [x] 3.1 Implement `CatalogInstanceService.create()` with fs copy + token replace
- [x] 3.2 Add `POST /api/instances` with unique id validation (409 on collision)
- [x] 3.3 Register in `ModuleRegistry` + `SiteLayoutRegistry` with `folderId`
- [x] 3.4 Write Jest tests: copy creates files, duplicate id rejected, layout item added

## 4. Public serving

- [x] 4.1 Ensure instance routes served at `/modules/<instance-id>/`
- [x] 4.2 Write integration test: created instance index.html reachable

## 5. Admin Add integration

- [x] 5.1 Wire P1 Add modal "From catalog" to catalog picker + instance form
- [x] 5.2 Write integration test: POST /api/instances end-to-end (mock auth)

## Dependencies

- Recommended: `virtual-folder-tree-and-browse` for Add modal
- Aligns with `docs/design.md` D3, D7
