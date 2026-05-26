## MODIFIED Requirements

### Requirement: Route requests to standalone modules

The system SHALL proxy configured dynamic paths under `/modules/<id>/` to the mapped host port when the standalone module is running. Static landing content SHALL be served from host `index.html`.

#### Scenario: Proxy API path to running module

- **WHEN** a user requests `/modules/demo-api/api/health` and the module is running on port 32775
- **THEN** the system SHALL forward the request to `http://127.0.0.1:32775/api/health`

#### Scenario: Serve landing without proxy

- **WHEN** a user requests `/modules/demo-api/` or `/modules/demo-api/index.html`
- **THEN** the system SHALL serve the host `index.html` without requiring the container to be running

#### Scenario: Dynamic path when module stopped

- **WHEN** a user requests a proxied API path and the module is stopped
- **THEN** the system SHALL respond with HTTP 503 and a user-friendly unavailable message

### Requirement: Dynamic proxy registration

The system SHALL register or update proxy routes for manifest-defined dynamic path prefixes when a module starts and remove routes when a module stops or is uninstalled.

#### Scenario: Register route on start

- **WHEN** a standalone module starts and port is discovered
- **THEN** the reverse proxy middleware SHALL route configured paths (default `/api`) under the module prefix to the mapped port

#### Scenario: Remove route on uninstall

- **WHEN** a module is uninstalled
- **THEN** the proxy route for its dynamic paths SHALL be removed

## ADDED Requirements

### Requirement: Configurable proxy path prefixes

Standalone manifests MAY declare `proxy.paths` as a list of URL path prefixes to forward to the container.

#### Scenario: Default API proxy

- **WHEN** `proxy.paths` is omitted in manifest
- **THEN** the system SHALL proxy paths matching `/modules/<id>/api/*` to the container

#### Scenario: Custom proxy paths

- **WHEN** manifest declares `proxy.paths: ["/api", "/ws"]`
- **THEN** requests under those prefixes SHALL be proxied when the module is running
