## ADDED Requirements

### Requirement: Ubuntu host compatibility

The system SHALL run on Ubuntu Server LTS (22.04 or 24.04) as the supported production platform, using Linux paths, systemd, and the Docker socket at `/var/run/docker.sock`.

#### Scenario: Docker socket on Ubuntu

- **WHEN** the core starts on Ubuntu with Docker installed
- **THEN** it SHALL connect to `unix:///var/run/docker.sock` by default

#### Scenario: Unsupported production OS

- **WHEN** deployment documentation is published
- **THEN** it SHALL state that Windows and macOS are not supported for production (development via WSL2/SSH only)

### Requirement: Start standalone module container

The system SHALL start standalone modules using `docker compose up -d` in the module directory with resource limits from the manifest.

#### Scenario: Successful container start

- **WHEN** an administrator starts a standalone module
- **THEN** the system SHALL run docker compose and record the container id and mapped port in the registry

#### Scenario: Start failure

- **WHEN** docker compose fails
- **THEN** the system SHALL set module status to `error` and log the failure

### Requirement: Stop standalone module container

The system SHALL stop standalone modules using `docker compose down` in the module directory.

#### Scenario: Successful container stop

- **WHEN** an administrator stops a running standalone module
- **THEN** the system SHALL run docker compose down and update status to `stopped`

### Requirement: Discover mapped host port

After container start, the system SHALL read the mapped host port via Docker inspect API.

#### Scenario: Port discovery after up

- **WHEN** a container exposes internal port 3000
- **THEN** the system SHALL store the assigned host port (e.g. 32775) in the registry for proxy routing

### Requirement: Live resource statistics

The system SHALL expose CPU and memory usage for running standalone modules via Docker stats API.

#### Scenario: Stats on dashboard hover

- **WHEN** an administrator hovers over a running module status indicator
- **THEN** the system SHALL return current CPU and RAM usage from `docker stats`

### Requirement: Container logs access

The system SHALL provide recent container logs for standalone modules to administrators.

#### Scenario: View module logs

- **WHEN** an administrator requests logs for a running module
- **THEN** the system SHALL return the last N lines from `docker logs`

### Requirement: Firewall port notification

After discovering a mapped host port, the system SHALL notify the administrator that external access may require firewall rules.

#### Scenario: Port exposure warning

- **WHEN** a module is mapped to host port 32775
- **THEN** the admin UI SHALL display a message indicating the port and firewall consideration
