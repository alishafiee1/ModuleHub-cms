## ADDED Requirements

### Requirement: ZIP module upload

The system SHALL allow administrators to upload a ZIP archive containing a module folder structure via the admin API or UI.

#### Scenario: Successful ZIP upload

- **WHEN** an administrator uploads a valid ZIP containing `manifest.json`
- **THEN** the system SHALL extract files to `static-modules/<id>/` or `standalone-modules/<id>/` based on manifest type

#### Scenario: Reject invalid archive

- **WHEN** an uploaded file is not a valid ZIP or contains path traversal (`../`)
- **THEN** the system SHALL reject the upload with an error and SHALL NOT write any files

### Requirement: Module type routing on install

The system SHALL route extracted modules to the correct directory based on `manifest.type`.

#### Scenario: Static module extraction path

- **WHEN** manifest type is `static`
- **THEN** files SHALL be extracted to `static-modules/<module-id>/`

#### Scenario: Standalone module extraction path

- **WHEN** manifest type is `standalone`
- **THEN** files SHALL be extracted to `standalone-modules/<module-id>/`

### Requirement: Permission prompt for standalone modules

The system SHALL display required ports, resource limits, and network access from the manifest and require administrator confirmation before starting a standalone module.

#### Scenario: Admin confirms standalone permissions

- **WHEN** a standalone module is installed and the administrator confirms permissions
- **THEN** the system SHALL proceed to container startup

#### Scenario: Admin rejects standalone permissions

- **WHEN** the administrator rejects permission requirements
- **THEN** the module SHALL remain installed but status SHALL be `stopped` and no container SHALL start
