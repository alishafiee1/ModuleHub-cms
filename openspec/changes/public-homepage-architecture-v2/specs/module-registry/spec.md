## ADDED Requirements

### Requirement: Registry supports builtin type

Module registry entries SHALL support `type: builtin` with status `static` and install path under `core/builtin-modules/<id>/`.

#### Scenario: Register built-in module

- **WHEN** core bootstraps built-in modules
- **THEN** each SHALL appear in `modules.json` with `type: builtin`

### Requirement: Layout linkage by module id

Registry module `id` SHALL match `site-layout.json` item `id` for homepage correlation.

#### Scenario: Status lookup for homepage tile

- **WHEN** the homepage renders layout item `demo-api`
- **THEN** the system SHALL read runtime status from the registry entry with the same id

## MODIFIED Requirements

### Requirement: Module entry persistence

The registry SHALL persist module metadata including type (`builtin` | `standalone`), status, paths, and Docker fields for standalone modules.

#### Scenario: Built-in entry has no Docker fields

- **WHEN** a built-in module is registered
- **THEN** the entry SHALL NOT require `hostPort`, `containerId`, or `permissionsApproved`

#### Scenario: Standalone entry includes proxy fields

- **WHEN** a standalone module is registered
- **THEN** the entry SHALL include `proxyPrefix`, `internalPort`, and `permissionsApproved`
