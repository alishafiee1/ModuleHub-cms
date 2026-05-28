## ADDED Requirements

### Requirement: Static and SPA serving
Modules without a running process SHALL be served at `/modules/<module-id>/` from `standalone-modules/<module-id>/`.

#### Scenario: Static file served
- **WHEN** user requests `/modules/<id>/index.html`
- **THEN** CMS serves the file from the module directory

#### Scenario: SPA fallback
- **WHEN** user requests a deep route under `/modules/<id>/` that has no matching file
- **THEN** CMS returns `index.html` for SPA routing

### Requirement: Backend process execution
Backend modules SHALL run via `systemd-run --scope` with resource limits from `site-layout.json`.

#### Scenario: Backend started
- **WHEN** admin starts a non-Docker backend module
- **THEN** a scoped process runs listening on the assigned port with CPU/RAM limits applied

### Requirement: Docker module execution
Docker modules SHALL run via `docker run` with `--cpus`, `--memory`, `--memory-swap`, and `--blkio-weight` from module resources.

#### Scenario: Docker container running
- **WHEN** admin starts a Docker module
- **THEN** a container named `module-<id>` runs with specified resource limits

### Requirement: Reverse proxy
CMS SHALL proxy requests from `/modules/<id>/` to `127.0.0.1:<port>` for running backend/Docker modules.

#### Scenario: Proxy to backend
- **WHEN** user requests `/modules/<id>/api/data` and module is running
- **THEN** request is forwarded to the module's local port

### Requirement: Module status tracking
Module status SHALL be one of: `running`, `stopped`, `crashed`.

#### Scenario: OOM crash detection
- **WHEN** a module process is killed due to memory limit (OOM)
- **THEN** status changes to `crashed` and event is logged

### Requirement: Module stop
Stopping a module SHALL terminate its process or container.

#### Scenario: Stop backend module
- **WHEN** admin clicks Stop on a running backend module
- **THEN** the scoped process is terminated and status becomes `stopped`
