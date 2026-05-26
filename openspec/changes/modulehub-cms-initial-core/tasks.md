## 1. Project Scaffolding

- [x] 1.1 Initialize Node.js 20 + TypeScript project with `package.json`, `tsconfig.json`, ESLint, and Jest
- [x] 1.2 Create feature-based folder structure: `core/src/{server,modules,docker,proxy,admin,auth}`
- [x] 1.3 Add `.env.example` with Linux defaults: `PORT`, `ADMIN_PASSWORD`, `ADMIN_ROLE`, `MODULES_JSON_PATH=/var/lib/modulehub/modules.json`, `DOCKER_SOCKET=unix:///var/run/docker.sock`
- [x] 1.4 Create `static-modules/` and `standalone-modules/` directories with `.gitkeep`
- [x] 1.5 Add npm scripts: `dev`, `build`, `start`, `test`, `lint`

## 2. Ubuntu Deployment Artifacts

- [x] 2.1 Add `scripts/ubuntu-install.sh`: apt deps, Node.js 20, Docker + compose plugin, `modulehub` user in `docker` group
- [x] 2.2 Add `config/systemd/modulehub-cms.service` for systemd on Ubuntu (WorkingDirectory=/opt/modulehub-cms)
- [x] 2.3 Add `docs/ubuntu-deployment.md`: UFW rules, Nginx optional front-proxy, file permissions under `/var/lib/modulehub`
- [x] 2.4 Document that production target is Ubuntu Server 22.04/24.04 only; WSL2/SSH acceptable for dev on Windows

## 3. Module Registry

- [x] 3.1 Define TypeScript interfaces for `ModuleEntry`, `ModuleStatus`, and registry schema
- [x] 3.2 Implement `ModuleRegistry` class with load/save using atomic write (temp + rename)
- [x] 3.3 Implement backup on mutation (`modules.json.bak`)
- [x] 3.4 Write Jest unit tests for registry CRUD and atomic persistence

## 4. Manifest Validation

- [x] 4.1 Define Zod schema matching `doc/module-spec.md` (static and standalone variants)
- [x] 4.2 Implement `ManifestValidator` with sanitization of module id (kebab-case)
- [x] 4.3 Add security checks: port range, cap_drop warning, resource limit presence
- [x] 4.4 Write Jest unit tests for valid/invalid manifest cases

## 5. Module Installation

- [x] 5.1 Implement ZIP upload handler with path traversal protection
- [x] 5.2 Extract to `static-modules/<id>/` or `standalone-modules/<id>/` based on type
- [x] 5.3 Wire install flow: upload → validate manifest → extract → register in `modules.json`
- [x] 5.4 Implement uninstall: stop container (if standalone), remove folder, remove registry entry, remove proxy route
- [x] 5.5 Write Jest integration test for static module install pipeline

## 6. Static Module Serving

- [x] 6.1 Add Express static middleware for `/modules/<id>/` serving from module directory
- [x] 6.2 Handle `index.html` as default document for directory requests
- [x] 6.3 Return 404 for missing assets
- [x] 6.4 Create sample static module `static-modules/sample-gallery/` with manifest, index.html, style.css

## 7. Docker Module Runtime

- [x] 7.1 Implement `DockerManager` using `dockerode` with Ubuntu socket path `/var/run/docker.sock`
- [x] 7.2 Implement `startModule()` via `docker compose up -d` in module directory
- [x] 7.3 Implement `stopModule()` via `docker compose down`
- [x] 7.4 Implement port discovery via container inspect after start
- [x] 7.5 Implement `getStats()` and `getLogs()` for running containers
- [x] 7.6 Update registry status on start/stop/error
- [x] 7.7 Create sample standalone module `standalone-modules/demo-api/` with Dockerfile, compose, manifest, simple Express app
- [x] 7.8 Write Jest tests for DockerManager with mocked dockerode

## 8. Reverse Proxy Routing

- [x] 8.1 Implement `ReverseProxyManager` using `http-proxy` middleware
- [x] 8.2 Register dynamic route on module start using manifest `proxy.prefix` and discovered port
- [x] 8.3 Remove route on module stop/uninstall
- [x] 8.4 Return HTTP 503 when standalone module is stopped
- [x] 8.5 Forward `X-Forwarded-For` and `X-Real-IP` headers
- [x] 8.6 Write integration test: start sample module → request via proxy prefix → expect 200

## 9. Admin Dashboard

- [x] 9.1 Create admin HTML template with module tile grid (name, icon, type, status circle)
- [x] 9.2 Implement REST API: `GET /api/modules`, `POST /api/modules/upload`, `POST /api/modules/:id/start`, `POST /api/modules/:id/stop`, `GET /api/modules/:id/logs`, `GET /api/modules/:id/stats`
- [x] 9.3 Add client-side JS for Start/Stop/Logs actions and stats tooltip on hover
- [x] 9.4 Add ZIP upload form on dashboard
- [x] 9.5 Display firewall port warning after standalone module start (UFW on Ubuntu)

## 10. Role Access Control

- [x] 10.1 Implement minimal session auth with env-based admin password
- [x] 10.2 Assign role from `ADMIN_ROLE` env on login
- [x] 10.3 Filter module list and actions by `manifest.admin_role`
- [x] 10.4 Return HTTP 403 for unauthorized start/stop/uninstall attempts
- [x] 10.5 Write Jest tests for role filtering logic

## 11. Server Bootstrap & Documentation

- [x] 11.1 Wire Express app: auth middleware, admin routes, static serving, proxy, API
- [x] 11.2 Add structured error logging (no secrets in logs)
- [x] 11.3 Create root `README.md` with Ubuntu quick-start (install script + systemd)
- [x] 11.4 Verify end-to-end on Ubuntu: install static module, install standalone module, start/stop, proxy access, dashboard stats
- [x] 11.5 Run `npm run lint` and `npm run test` — all pass
