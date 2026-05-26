## Context

ModuleHub CMS is a greenfield project. Documentation in `doc/proposal.md`, `doc/module-spec.md`, and `doc/code-rolls.md` defines a modular CMS where each module is a self-contained folder with `manifest.json`. Static modules are served directly; standalone modules run in isolated Docker containers and are exposed via a reverse proxy at `/modules/<name>/`.

The core MUST be TypeScript/Node.js, use JSON file storage (`modules.json`) initially, integrate with Docker via `dockerode`, and follow strict security defaults for untrusted module code.

## Goals / Non-Goals

**Goals:**

- Deliver a working MVP core: registry, upload, validation, static serving, Docker lifecycle, proxy routing, admin UI
- Enforce the module contract defined in `doc/module-spec.md`
- Enable parallel module development (human or AI) via folder + manifest contract
- Provide sample static and standalone modules for end-to-end verification
- Meet code standards from `doc/code-rolls.md` (TypeScript, JSDoc, Jest tests, env-based secrets)

**Non-Goals:**

- Kubernetes or multi-host orchestration (future phase)
- Traefik integration (use `http-proxy` first; Traefik is a later upgrade)
- Full user authentication system (minimal session/role stub for MVP; OAuth later)
- WordPress-style page builder or WYSIWYG editor
- Persistent storage of Docker stats history (live `docker stats` only)
- Production-grade TLS termination (assumes reverse proxy or dev mode)

## Decisions

### 1. Runtime stack: Node.js 20 + TypeScript + Express

**Choice:** Express with TypeScript strict mode.

**Rationale:** Aligns with `CLAUDE.md` and `code-rolls.md`. Express is sufficient for static serving, API routes, and proxy middleware. Fastify is faster but adds learning curve for minimal gain in MVP.

**Alternatives considered:** PHP (rejected — docs specify Node/TS); Fastify (deferred).

### 2. Module registry: JSON file (`modules.json`)

**Choice:** Single `core/data/modules.json` file with atomic write (write temp + rename).

**Rationale:** Matches proposal; zero DB dependency for MVP. LowDB can be added if concurrent write issues appear.

**Alternatives considered:** SQLite (deferred); PostgreSQL (overkill for MVP).

### 3. Docker integration: `dockerode` + shell `docker compose`

**Choice:** `dockerode` for inspect/stats; `child_process.exec` for `docker compose up -d` / `down` in module directory.

**Rationale:** Compose files are module-authored; running compose CLI is simpler than reconstructing stacks in dockerode API.

**Alternatives considered:** Pure dockerode compose API (not stable enough).

### 4. Reverse proxy: embedded `http-proxy` middleware

**Choice:** Core Express app mounts dynamic proxy middleware per registered module prefix.

**Rationale:** No external Nginx reload needed for MVP; matches `CLAUDE.md` guidance. Module port discovered via `docker inspect` after compose up.

**Alternatives considered:** Nginx config generation + reload (Phase 3 in proposal — deferred); Traefik labels (deferred).

### 5. Project structure (feature-based)

```
ModuleHub-cms/
├── core/
│   └── src/
│       ├── server/           # Express app bootstrap
│       ├── modules/          # registry, upload, validation
│       ├── docker/           # DockerManager
│       ├── proxy/            # ReverseProxyManager
│       ├── admin/            # Admin routes + UI
│       └── auth/             # Role stub
├── static-modules/
├── standalone-modules/
├── config/
├── tests/
├── doc/
└── openspec/
```

### 6. Manifest validation: Zod schema

**Choice:** Zod schema mirroring `doc/module-spec.md` fields.

**Rationale:** Type-safe, testable, good error messages for admin UI.

### 7. Security defaults for Docker modules

**Choice:** Core injects or validates compose constraints: `cap_drop: [ALL]`, `read_only: true`, memory/CPU limits from manifest, isolated Docker network unless `network_access` allows outbound.

**Rationale:** Required by proposal and code-rolls.md for untrusted modules.

### 8. Admin UI: server-rendered HTML + minimal client JS

**Choice:** EJS or plain HTML templates served by Express; fetch API for stats/actions.

**Rationale:** Avoids frontend build pipeline for MVP; dashboard is admin-only.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Malicious ZIP (path traversal) | Validate paths on extract; reject `..` and absolute paths |
| Docker socket access = root equivalent | Run core as dedicated user; document socket permission requirements |
| Port collision on host | Use ephemeral port mapping (`"3000"` without host bind); discover via inspect |
| JSON registry corruption on crash | Atomic writes; backup `modules.json.bak` before mutations |
| http-proxy performance at scale | Document Traefik migration path; acceptable for MVP module count |
| Module compose files ignore security | Pre-flight validation; warn/block if missing `cap_drop` |

## Migration Plan

1. Scaffold repo with `package.json`, TypeScript, Jest, ESLint
2. Implement registry + manifest validation (no Docker yet)
3. Add static module serving + sample static module
4. Add Docker lifecycle + sample standalone module
5. Wire reverse proxy + admin dashboard
6. Add role filtering stub
7. Update root `README.md` with quick-start

**Rollback:** Stop Docker modules via `docker compose down`; restore previous `modules.json.bak`; remove uploaded module folders.

## Open Questions

- Authentication mechanism for admin panel: basic auth vs session cookie vs external SSO (MVP: env-based admin password + session)
- Whether core should auto-generate `docker-compose.yml` overrides for security or only validate module-provided files
- Hosting target: bare Ubuntu server vs existing 3x-ui/Nginx stack (proxy may coexist with external Nginx later)
