## 1. Project Scaffolding

- [ ] 1.1 Initialize Node.js 20 + TypeScript project with `package.json`, `tsconfig.json`, ESLint, and Jest
- [ ] 1.2 Create feature-based folder structure: `core/src/{server,modules,docker,proxy,admin,auth}`
- [ ] 1.3 Add `.env.example` with `PORT`, `ADMIN_PASSWORD`, `ADMIN_ROLE`, `MODULES_JSON_PATH`, `DOCKER_SOCKET`
- [ ] 1.4 Create `static-modules/` and `standalone-modules/` directories with `.gitkeep`
- [ ] 1.5 Add npm scripts: `dev`, `build`, `start`, `test`, `lint`

## 2. Module Registry

- [ ] 2.1 Define TypeScript interfaces for `ModuleEntry`, `ModuleStatus`, and registry schema
- [ ] 2.2 Implement `ModuleRegistry` class with load/save using atomic write (temp + rename)
- [ ] 2.3 Implement backup on mutation (`modules.json.bak`)
- [ ] 2.4 Write Jest unit tests for registry CRUD and atomic persistence

## 3. Manifest Validation

- [ ] 3.1 Define Zod schema matching `doc/module-spec.md` (static and standalone variants)
- [ ] 3.2 Implement `ManifestValidator` with sanitization of module id (kebab-case)
- [ ] 3.3 Add security checks: port range, cap_drop warning, resource limit presence
- [ ] 3.4 Write Jest unit tests for valid/invalid manifest cases

## 4. Module Installation

- [ ] 4.1 Implement ZIP upload handler with path traversal protection
- [ ] 4.2 Extract to `static-modules/<id>/` or `standalone-modules/<id>/` based on type
- [ ] 4.3 Wire install flow: upload → validate manifest → extract → register in `modules.json`
- [ ] 4.4 Implement uninstall: stop container (if standalone), remove folder, remove registry entry, remove proxy route
- [ ] 4.5 Write Jest integration test for static module install pipeline

## 5. Static Module Serving

- [ ] 5.1 Add Express static middleware for `/modules/<id>/` serving from module directory
- [ ] 5.2 Handle `index.html` as default document for directory requests
- [ ] 5.3 Return 404 for missing assets
- [ ] 5.4 Create sample static module `static-modules/sample-gallery/` with manifest, index.html, style.css

## 6. Docker Module Runtime

- [ ] 6.1 Implement `DockerManager` using `dockerode` for inspect and stats
- [ ] 6.2 Implement `startModule()` via `docker compose up -d` in module directory
- [ ] 6.3 Implement `stopModule()` via `docker compose down`
- [ ] 6.4 Implement port discovery via container inspect after start
- [ ] 6.5 Implement `getStats()` and `getLogs()` for running containers
- [ ] 6.6 Update registry status on start/stop/error
- [ ] 6.7 Create sample standalone module `standalone-modules/demo-api/` with Dockerfile, compose, manifest, simple Express app
- [ ] 6.8 Write Jest tests for DockerManager with mocked dockerode

## 7. Reverse Proxy Routing

- [ ] 7.1 Implement `ReverseProxyManager` using `http-proxy` middleware
- [ ] 7.2 Register dynamic route on module start using manifest `proxy.prefix` and discovered port
- [ ] 7.3 Remove route on module stop/uninstall
- [ ] 7.4 Return HTTP 503 when standalone module is stopped
- [ ] 7.5 Forward `X-Forwarded-For` and `X-Real-IP` headers
- [ ] 7.6 Write integration test: start sample module → request via proxy prefix → expect 200

## 8. Admin Dashboard

- [ ] 8.1 Create admin HTML template with module tile grid (name, icon, type, status circle)
- [ ] 8.2 Implement REST API: `GET /api/modules`, `POST /api/modules/upload`, `POST /api/modules/:id/start`, `POST /api/modules/:id/stop`, `GET /api/modules/:id/logs`, `GET /api/modules/:id/stats`
- [ ] 8.3 Add client-side JS for Start/Stop/Logs actions and stats tooltip on hover
- [ ] 8.4 Add ZIP upload form on dashboard
- [ ] 8.5 Display firewall port warning after standalone module start

## 9. Role Access Control

- [ ] 9.1 Implement minimal session auth with env-based admin password
- [ ] 9.2 Assign role from `ADMIN_ROLE` env on login
- [ ] 9.3 Filter module list and actions by `manifest.admin_role`
- [ ] 9.4 Return HTTP 403 for unauthorized start/stop/uninstall attempts
- [ ] 9.5 Write Jest tests for role filtering logic

## 10. Server Bootstrap & Documentation

- [ ] 10.1 Wire Express app: auth middleware, admin routes, static serving, proxy, API
- [ ] 10.2 Add structured error logging (no secrets in logs)
- [ ] 10.3 Create root `README.md` with quick-start from `doc/readme_short.md`
- [ ] 10.4 Verify end-to-end: install static module, install standalone module, start/stop, proxy access, dashboard stats
- [ ] 10.5 Run `npm run lint` and `npm run test` — all pass
