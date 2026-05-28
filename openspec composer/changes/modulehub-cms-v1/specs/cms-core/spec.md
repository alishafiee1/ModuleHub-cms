## ADDED Requirements

### Requirement: Express server health endpoint
The CMS core SHALL listen on `127.0.0.1:4000` and expose `GET /health` returning HTTP 200 with JSON `{ "status": "ok" }`.

#### Scenario: Health check succeeds
- **WHEN** client sends `GET /health`
- **THEN** server responds with status 200 and body `{ "status": "ok" }`

### Requirement: Request logging
The CMS core SHALL log every HTTP request to `storage/logs/cms.log` using Winston with daily rotation and 14-day retention.

#### Scenario: Request logged
- **WHEN** any HTTP request is received
- **THEN** a log entry with method, path, and status code is written to `storage/logs/cms.log`

### Requirement: Server directory structure
The CMS SHALL use the directory layout defined in `design plan.md` §3: `core/`, `public/`, `standalone-modules/`, `storage/`, `thumbnails/`, `scripts/`.

#### Scenario: Required directories exist on startup
- **WHEN** the CMS starts
- **THEN** it verifies or creates `storage/logs/`, `storage/backups/`, and `standalone-modules/` directories

### Requirement: Systemd service
The CMS SHALL run as a systemd service (`modulehub-cms.service`) binding only to localhost.

#### Scenario: Service starts on boot
- **WHEN** `systemctl enable modulehub-cms --now` is executed
- **THEN** the service reaches `active (running)` state and listens on `127.0.0.1:4000`
