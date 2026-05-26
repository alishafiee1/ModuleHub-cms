## ADDED Requirements

### Requirement: Route requests to standalone modules

The system SHALL proxy HTTP requests from `/modules/<prefix>/` to the mapped host port of the corresponding standalone module.

#### Scenario: Proxy to running module

- **WHEN** a user requests `/modules/robot-dashboard/` and the module is running on port 32775
- **THEN** the system SHALL forward the request to `http://127.0.0.1:32775/`

#### Scenario: Module not running

- **WHEN** a user requests a standalone module prefix and the module is stopped
- **THEN** the system SHALL respond with HTTP 503 and a user-friendly unavailable message

### Requirement: Dynamic proxy registration

The system SHALL register or update proxy routes when a module starts and remove routes when a module stops or is uninstalled.

#### Scenario: Register route on start

- **WHEN** a standalone module starts and port is discovered
- **THEN** the reverse proxy middleware SHALL route the manifest `proxy.prefix` to the mapped port

#### Scenario: Remove route on uninstall

- **WHEN** a module is uninstalled
- **THEN** the proxy route for its prefix SHALL be removed

### Requirement: Preserve request headers

The proxy SHALL forward standard headers including `Host`, `X-Real-IP`, and `X-Forwarded-For`.

#### Scenario: Forward client IP

- **WHEN** a proxied request arrives from a client
- **THEN** the upstream module SHALL receive `X-Forwarded-For` with the client IP
