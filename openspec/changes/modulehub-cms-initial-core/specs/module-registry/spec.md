## ADDED Requirements

### Requirement: Persistent module registry

The system SHALL maintain a JSON registry file (`modules.json`) containing metadata for every installed module including id, name, type, version, status, install path, and proxy configuration.

#### Scenario: Registry loads on startup

- **WHEN** the core server starts
- **THEN** it SHALL read `modules.json` and load all registered modules into memory

#### Scenario: Registry persists after module install

- **WHEN** a module is successfully installed
- **THEN** the system SHALL append or update the module entry in `modules.json` atomically

### Requirement: Module status tracking

The system SHALL track runtime status for each module as one of: `running`, `stopped`, `static`, or `error`.

#### Scenario: Static module status

- **WHEN** a module has `type: static` in its manifest
- **THEN** the registry SHALL record status as `static` (always available)

#### Scenario: Standalone module status after start

- **WHEN** a standalone module container starts successfully
- **THEN** the registry SHALL update status to `running` and record the mapped host port

### Requirement: Module removal from registry

The system SHALL remove a module entry from `modules.json` when the module is uninstalled.

#### Scenario: Uninstall updates registry

- **WHEN** an administrator uninstalls a module
- **THEN** the module entry SHALL be removed from `modules.json` and a backup of the previous file SHALL be retained
