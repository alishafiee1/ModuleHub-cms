# module-runtime Specification

## Purpose
TBD - created by archiving change modulehub-cms-v1. Update Purpose after archive.
## Requirements
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

### Requirement: Network bandwidth limiting for Docker modules
For Docker modules with `resources.net_mbps` set, the system SHALL apply a token bucket filter using `tc` on the container's virtual interface via `scripts/setup-net-limit.sh`.

#### Scenario: Network limit applied
- **WHEN** a Docker module with `net_mbps: 10` starts
- **THEN** the container's egress traffic is shaped to 10 Mbps via `scripts/setup-net-limit.sh`

#### Scenario: No network limit for non-Docker
- **WHEN** a non-Docker module starts with `net_mbps` set
- **THEN** no `tc` rule is applied and admin is informed that network shaping applies to Docker modules only

### Requirement: Enforce concurrent module limit
The system SHALL reject starting a new module if the number of running modules reaches `maxConcurrentRunningModules` from system settings (default 10).

#### Scenario: Limit reached
- **WHEN** admin attempts to start a new module and current running count is greater than or equal to `maxConcurrentRunningModules`
- **THEN** start is rejected with HTTP 409 and a clear error message

#### Scenario: Start allowed under limit
- **WHEN** admin starts a module and running count is below `maxConcurrentRunningModules`
- **THEN** the module starts normally

### Requirement: Auto-restart on crash
If `autoRestartOnCrash` is true in system settings, the system SHALL attempt to restart a crashed module up to `autoRestartMaxAttemptsPerHour` times within a rolling one-hour window.

#### Scenario: Auto-restart enabled
- **WHEN** a module crashes and `autoRestartOnCrash` is true and attempts remain under the hourly limit
- **THEN** system increments the attempt counter and restarts the module automatically

#### Scenario: Auto-restart limit reached
- **WHEN** a module crashes and hourly restart attempts have reached `autoRestartMaxAttemptsPerHour`
- **THEN** status remains `crashed` and no further automatic restart is attempted until the window resets

#### Scenario: Auto-restart disabled
- **WHEN** a module crashes and `autoRestartOnCrash` is false
- **THEN** status remains `crashed` with no automatic restart

