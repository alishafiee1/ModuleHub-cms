## 1. Config and templates

- [ ] 1.1 Wire `CATALOG_MODULES_DIR` in `core/src/server/config.ts`
- [ ] 1.2 Create `core/catalog-modules/image-gallery/` template from sample-gallery
- [ ] 1.3 Create `core/catalog-modules/markdown-viewer/` template
- [ ] 1.4 Define `manifest.template.json` token contract

## 2. Catalog API

- [ ] 2.1 Implement `CatalogService.listTemplates()`
- [ ] 2.2 Add `GET /api/catalog` (auth) in admin routes
- [ ] 2.3 Write Jest tests: list templates, empty catalog dir

## 3. Instance copy

- [ ] 3.1 Implement `CatalogInstanceService.create()` with fs copy + token replace
- [ ] 3.2 Add `POST /api/instances` with unique id validation (409 on collision)
- [ ] 3.3 Register in `ModuleRegistry` + `SiteLayoutRegistry` with `folderId`
- [ ] 3.4 Write Jest tests: copy creates files, duplicate id rejected, layout item added

## 4. Public serving

- [ ] 4.1 Ensure instance routes served at `/modules/<instance-id>/`
- [ ] 4.2 Write integration test: created instance index.html reachable

## 5. Admin Add integration

- [ ] 5.1 Wire P1 Add modal "From catalog" to catalog picker + instance form
- [ ] 5.2 Write integration test: POST /api/instances end-to-end (mock auth)

## Dependencies

- Recommended: `virtual-folder-tree-and-browse` for Add modal
- Aligns with `docs/design.md` D3, D7
