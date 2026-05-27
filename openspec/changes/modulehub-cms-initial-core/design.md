> **⛔ SUPERSEDED** — Use `openspec/changes/public-homepage-architecture-v2/` and [docs/README.md](../../../docs/README.md). Static ZIP and full-path proxy are deprecated.

## Context

ModuleHub CMS is a greenfield project. Documentation in `doc/proposal.md`, `doc/module-spec.md`, and `doc/code-rolls.md` defines a modular CMS where each module is a self-contained folder with `manifest.json`. Static modules are served directly; standalone modules run in isolated Docker containers and are exposed via a reverse proxy at `/modules/<name>/`.

The core MUST be TypeScript/Node.js, use JSON file storage (`modules.json`) initially, integrate with Docker via `dockerode`, and follow strict security defaults for untrusted module code.

**Deployment target:** Ubuntu Server LTS (22.04 or 24.04). The system is designed to run on a standard Ubuntu VPS or bare-metal host alongside Docker Engine, systemd, and optionally Nginx/UFW — consistent with the user's existing Ubuntu server infrastructure (e.g. Dual-WAN setups). Windows development is secondary; all production scripts, paths, and service units assume Linux.

## Goals / Non-Goals

**Goals:**

- Deliver a working MVP core: registry, upload, validation, static serving, Docker lifecycle, proxy routing, admin UI
- Enforce the module contract defined in `doc/module-spec.md`
- Enable parallel module development (human or AI) via folder + manifest contract
- Provide sample static and standalone modules for end-to-end verification
- Meet code standards from `doc/code-rolls.md` (TypeScript, JSDoc, Jest tests, env-based secrets)
- Ship Ubuntu-ready deployment artifacts: systemd unit, install script, UFW notes, Linux path defaults

**Non-Goals:**

- Cross-platform production support (Windows/macOS native install)

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

### 9. Production host: Ubuntu Server LTS

**Choice:** Ubuntu Server 22.04 or 24.04 as the sole supported production OS.

**Rationale:** Matches existing server workflow (SSH, systemd, apt, UFW, Docker on Linux). Simplifies path assumptions (`/opt/modulehub-cms`, `/var/lib/modulehub`, `unix:///var/run/docker.sock`), shell scripts, and firewall documentation. Avoids Windows-specific edge cases for Docker socket, file permissions, and `docker compose` CLI.

**Alternatives considered:** Docker-only image (deferred — host still needs Ubuntu for socket access in MVP); Windows Server (rejected for production).

**Ubuntu host prerequisites:**

| Component | Ubuntu package / setup |
|-----------|------------------------|
| Node.js 20+ | NodeSource repo or `nvm` |
| Docker | `docker.io` or Docker CE + compose plugin |
| Process manager | systemd unit `modulehub-cms.service` |
| Firewall | UFW — only core port + optional module ports |
| Reverse proxy (optional) | Nginx on same host forwarding to core port |

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Malicious ZIP (path traversal) | Validate paths on extract; reject `..` and absolute paths |
| Docker socket access = root equivalent | Run core as dedicated user; document socket permission requirements |
| Port collision on host | Use ephemeral port mapping (`"3000"` without host bind); discover via inspect |
| JSON registry corruption on crash | Atomic writes; backup `modules.json.bak` before mutations |
| http-proxy performance at scale | Document Traefik migration path; acceptable for MVP module count |
| Module compose files ignore security | Pre-flight validation; warn/block if missing `cap_drop` |
| Ubuntu version drift | Document and test on 22.04 + 24.04 LTS only |
| Docker group membership on Ubuntu | Install script adds service user to `docker` group; document re-login requirement |

## Migration Plan

### Ubuntu server deployment (production)

1. Provision Ubuntu Server 22.04/24.04 with SSH access
2. Run install script: `apt update`, Node.js 20, Docker Engine + compose plugin, create `modulehub` user
3. Clone repo to `/opt/modulehub-cms`, `npm ci && npm run build`
4. Copy `.env`, set paths for Linux (`MODULES_JSON_PATH`, `DOCKER_SOCKET=/var/run/docker.sock`)
5. Install systemd unit, `systemctl enable --now modulehub-cms`
6. Configure UFW (allow core port; document dynamic module ports)
7. Optional: Nginx site block proxying public domain to core port

### Development rollout

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
- ~~Hosting target~~ **Resolved:** Ubuntu Server LTS; may coexist with external Nginx (e.g. 3x-ui decoy stack) on same host via port separation
