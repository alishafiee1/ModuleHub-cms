## 1. Site Layout Registry

- [ ] 1.1 Define Zod schema and TypeScript types for `site-layout.json` items (`id`, `title`, `icon`, `pageType`, `route`, `sortOrder`)
- [ ] 1.2 Implement `SiteLayoutRegistry` with atomic load/save at `core/data/site-layout.json`
- [ ] 1.3 Add bootstrap: generate default layout from built-in + standalone modules when file missing
- [ ] 1.4 Add `GET /api/site-layout` and `PUT /api/site-layout` (auth required)
- [ ] 1.5 Wire install/uninstall hooks to auto-add/remove standalone layout items
- [ ] 1.6 Write Jest unit tests for layout validation and persistence

## 2. Built-in Modules

- [ ] 2.1 Add `ModuleType` value `builtin` to types and registry
- [ ] 2.2 Create `core/builtin-modules/sample-gallery/` — migrate from `static-modules/sample-gallery/`
- [ ] 2.3 Create `core/builtin-modules/markdown-viewer/` with sample markdown demo page
- [ ] 2.4 Implement `mountBuiltinModules()` serving `/pages/<id>/` with index.html default
- [ ] 2.5 Register built-in modules at bootstrap in `modules.json` with `type: builtin`
- [ ] 2.6 Write Jest tests for built-in route serving and 404 handling

## 3. Public Homepage

- [ ] 3.1 Create `core/src/public/homepage.html` — minimal RTL tile grid (title, icon, status dot, link)
- [ ] 3.2 Implement `GET /` route: load layout + registry status, render homepage (no redirect to admin)
- [ ] 3.3 Add inline admin overlay JS: Start/Stop/Logs/stats when session + role match
- [ ] 3.4 Add footer link to `/admin` for system management login
- [ ] 3.5 Write integration test: `/` returns 200 HTML with layout tile titles

## 4. Standalone Module Contract (Breaking)

- [ ] 4.1 Update `ManifestValidator`: require `index.html` on disk for standalone; add `type: builtin`; reject `type: static` uploads
- [ ] 4.2 Update `ModuleInstaller`: reject static ZIPs; validate docker compose file + index.html before register
- [ ] 4.3 Serve standalone `index.html` from host at `/modules/<id>/` via updated static serving layer
- [ ] 4.4 Add `index.html` landing page to `standalone-modules/demo-api/`
- [ ] 4.5 Update manifest schema docs in `docs/module-spec.md` with `proxy.paths` and index.html requirement
- [ ] 4.6 Write Jest tests for rejected static upload and missing index.html

## 5. Reverse Proxy Updates

- [ ] 5.1 Extend `ReverseProxyManager` to proxy only manifest `proxy.paths` (default `/api`) not landing HTML
- [ ] 5.2 Return 503 for proxied paths when standalone stopped; still serve index.html for `/`
- [ ] 5.3 Update integration test: stopped module serves index; running module proxies `/api`
- [ ] 5.4 Verify firewall warning still returned on start API response

## 6. Admin Dashboard Adjustments

- [ ] 6.1 Update upload UI copy: standalone-only ZIP
- [ ] 6.2 Show `builtin` type badge on built-in tiles in `/admin`
- [ ] 6.3 Remove static-modules references from dashboard install success messages
- [ ] 6.4 Keep `/admin` as system panel; document homepage admin overlay in dashboard help text

## 7. Migration & Deprecation

- [ ] 7.1 Migration script: convert registry entry `sample-gallery` from static to builtin
- [ ] 7.2 Remove or archive `static-modules/sample-gallery/` after migration (keep folder with README deprecation note)
- [ ] 7.3 Update default `site-layout.json` with gallery + markdown-viewer + demo-api items
- [ ] 7.4 Update root `README.md` with new routes (`/`, `/pages/`, `/modules/`)

## 8. Documentation

- [ ] 8.1 Update `docs/proposal.md` to reflect revised architecture (built-in vs standalone, site-layout.json)
- [ ] 8.2 Add `docs/public-homepage.md` — layout JSON format and admin overlay behavior
- [ ] 8.3 Update `docs/ubuntu-deployment.md` — verify nginx `/` now serves public content

## 9. Verification

- [ ] 9.1 Run `npm run lint` and `npm run test` — all pass
- [ ] 9.2 Manual E2E on Ubuntu: visitor sees `/`, gallery works at `/pages/sample-gallery/`, admin starts demo-api from homepage
- [ ] 9.3 Deploy to `192.168.88.50` and confirm no redirect loop on public `/`
