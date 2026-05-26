## ADDED Requirements

### Requirement: Mandatory manifest file

Every module SHALL include a valid `manifest.json` at its root. The system MUST reject modules without it.

#### Scenario: Missing manifest

- **WHEN** an uploaded module lacks `manifest.json`
- **THEN** the system SHALL reject installation with a descriptive validation error

### Requirement: Required manifest fields

The system SHALL validate presence and format of: `name`, `type` (`static` | `standalone`), `version`, `icon`, and `description`.

#### Scenario: Valid static manifest

- **WHEN** a manifest has `type: static` and all required fields
- **THEN** validation SHALL pass

#### Scenario: Valid standalone manifest

- **WHEN** a manifest has `type: standalone` and includes `docker.composeFile`, `docker.ports`, and `proxy.prefix`
- **THEN** validation SHALL pass

### Requirement: Security constraint validation

For standalone modules, the system SHALL validate that declared Docker resources and capabilities meet minimum security requirements.

#### Scenario: Reject excessive port request

- **WHEN** manifest declares ports outside the allowed range or count limit
- **THEN** validation SHALL fail before container start

#### Scenario: Warn on missing cap_drop

- **WHEN** the module's docker-compose.yml does not include `cap_drop: ALL`
- **THEN** the system SHALL warn the administrator and MAY block startup based on policy

### Requirement: Module id sanitization

The system SHALL derive a filesystem-safe module id from the manifest and reject names containing invalid characters.

#### Scenario: Sanitize module id

- **WHEN** manifest name contains spaces or special characters
- **THEN** the system SHALL produce a kebab-case id safe for directory and URL use
