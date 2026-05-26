## MODIFIED Requirements

### Requirement: ZIP module upload

The system SHALL allow administrators to upload a ZIP archive containing a **standalone** module folder structure via the admin API or UI.

#### Scenario: Successful standalone ZIP upload

- **WHEN** an administrator uploads a valid ZIP containing `manifest.json` with `type: standalone`
- **THEN** the system SHALL extract files to `standalone-modules/<id>/`

#### Scenario: Reject invalid archive

- **WHEN** an uploaded file is not a valid ZIP or contains path traversal (`../`)
- **THEN** the system SHALL reject the upload with an error and SHALL NOT write any files

#### Scenario: Reject static type upload

- **WHEN** an uploaded manifest has `type: static`
- **THEN** the system SHALL reject the upload with an error directing the developer to implement built-in modules in core

### Requirement: Module type routing on install

The system SHALL route extracted upload modules only to `standalone-modules/<module-id>/`.

#### Scenario: Standalone module extraction path

- **WHEN** manifest type is `standalone`
- **THEN** files SHALL be extracted to `standalone-modules/<module-id>/`

### Requirement: Standalone package file requirements

The system SHALL require `index.html`, `manifest.json`, and the Docker compose file declared in the manifest for standalone uploads.

#### Scenario: Valid standalone package

- **WHEN** a standalone ZIP contains `manifest.json`, `index.html`, and `docker-compose.yml`
- **THEN** the installation pipeline SHALL proceed to registry registration

#### Scenario: Missing index.html rejected

- **WHEN** a standalone ZIP lacks `index.html` at the archive root
- **THEN** the system SHALL reject the upload before extraction completes

#### Scenario: Missing Docker compose rejected

- **WHEN** a standalone ZIP lacks the compose file referenced in manifest
- **THEN** the system SHALL reject the upload with a descriptive error

### Requirement: Permission prompt for standalone modules

The system SHALL display required ports, resource limits, and network access from the manifest and require administrator confirmation before starting a standalone module.

#### Scenario: Admin confirms standalone permissions

- **WHEN** a standalone module is installed and the administrator confirms permissions
- **THEN** the system SHALL mark `permissionsApproved: true` and allow container startup

#### Scenario: Admin rejects standalone permissions

- **WHEN** the administrator rejects permission requirements
- **THEN** the module SHALL remain installed but status SHALL be `stopped` and no container SHALL start

## REMOVED Requirements

### Requirement: Module type routing on install (static path)

**Reason**: Static ZIP uploads are removed; built-in modules are part of core codebase.

**Migration**: Implement pages in `core/builtin-modules/` and register via bootstrap.
