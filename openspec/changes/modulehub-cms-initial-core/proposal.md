> **⛔ SUPERSEDED** — This change is historical only. Use `openspec/changes/public-homepage-architecture-v2/` and [docs/README.md](../../../docs/README.md) as current truth. Static ZIP upload and full-path proxy are deprecated.

## Why

ModuleHub CMS needs a modular content platform where site administrators can add, update, and remove independent page blocks (static galleries, live dashboards, robot control panels) without modifying the core. Existing monolithic CMS approaches make parallel development and AI-assisted module creation difficult; a folder-based contract (`manifest.json` + optional `docker-compose.yml`) with an isolated Docker runtime solves this.

This change establishes the initial project foundation: TypeScript/Node.js core, module registry, upload pipeline, static and standalone module support, Docker lifecycle management, dynamic reverse proxy, and an admin dashboard with resource monitoring — **targeted at Ubuntu Server LTS** as the primary deployment platform.

## What Changes

- Bootstrap **ModuleHub CMS** (Node.js + TypeScript) with feature-based project structure
- Implement **module registry** backed by `modules.json` for metadata and runtime state
- Add **ZIP upload and extraction** into `static-modules/` or `standalone-modules/`
- Enforce **manifest.json validation** per `doc/module-spec.md` (type, ports, resources, proxy prefix, roles)
- Serve **static modules** directly from the core HTTP server
- Integrate **Docker Compose lifecycle** for standalone modules (`up`, `down`, `stats`) via `dockerode`
- Implement **dynamic reverse proxy** routing at `/modules/<name>/` to mapped container ports (http-proxy initially)
- Build **admin dashboard** with module tiles, green status indicator, CPU/RAM tooltip, Start/Stop/Logs actions
- Add **role-based module visibility** using `admin_role` from manifest
- Provide **sample modules** (one static gallery, one standalone demo) for integration testing
- Add **Jest unit tests** for core services and `.env.example` for configuration
- Document Ubuntu Server quick-start in root `README.md` (systemd service, Docker, UFW)
- Target **Ubuntu Server LTS (22.04 / 24.04)** as the only supported production OS

## Capabilities

### New Capabilities

- `module-registry`: Persistent registry (`modules.json`), module listing, status tracking, and CRUD metadata
- `module-installation`: ZIP upload, extraction, manifest parsing, permission prompts for standalone modules
- `manifest-validation`: Schema validation, security constraint checks (ports, resources, capabilities)
- `static-module-serving`: HTTP serving of static module assets and `index.html`
- `docker-module-runtime`: Docker Compose orchestration, port discovery, resource stats, start/stop/logs
- `reverse-proxy-routing`: Dynamic routing from `/modules/<prefix>/` to internal module ports
- `admin-dashboard`: Web UI for module management, status display, and admin actions
- `role-access-control`: Filter modules and admin actions by user role from manifest

### Modified Capabilities

- _(none — greenfield project)_

## Impact

- **New codebase**: `core/` TypeScript application (Express or Fastify), `static-modules/`, `standalone-modules/`, `config/`
- **Dependencies**: `dockerode`, `http-proxy`, `adm-zip` (or equivalent), validation library (e.g. `zod`), Jest
- **Target OS**: Ubuntu Server LTS (22.04 or 24.04) — production deployment, systemd service, UFW, Linux paths
- **Runtime requirements**: Docker Engine + Docker Compose plugin on Ubuntu host; Node.js 20+ via NodeSource or nvm
- **Not supported for production**: Windows Server, macOS (dev-only via WSL2/SSH to Ubuntu)
- **Security**: Untrusted module code runs only in Docker with `cap_drop: ALL`, `read_only`, resource limits; secrets via `process.env`
- **Docs**: Aligns with `doc/proposal.md`, `doc/module-spec.md`, `doc/code-rolls.md`, `CLAUDE.md`
