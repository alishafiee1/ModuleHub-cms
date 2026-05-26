## ADDED Requirements

### Requirement: Module tile display

The admin dashboard SHALL display each registered module as a tile with name, icon, type, and status indicator.

#### Scenario: Display module tiles

- **WHEN** an administrator opens the admin dashboard
- **THEN** the system SHALL render a tile for every module in the registry

### Requirement: Status indicator

The dashboard SHALL show a green indicator for running/static modules and a red/gray indicator for stopped or error modules.

#### Scenario: Running module green indicator

- **WHEN** a standalone module status is `running`
- **THEN** the tile SHALL display a green status circle

#### Scenario: Stopped module indicator

- **WHEN** a standalone module status is `stopped`
- **THEN** the tile SHALL display a non-green status indicator

### Requirement: Module control actions

The dashboard SHALL provide Start, Stop, and Logs actions for standalone modules.

#### Scenario: Start from dashboard

- **WHEN** an administrator clicks Start on a stopped standalone module
- **THEN** the system SHALL invoke docker compose up and refresh the tile status

#### Scenario: Stop from dashboard

- **WHEN** an administrator clicks Stop on a running standalone module
- **THEN** the system SHALL invoke docker compose down and refresh the tile status

### Requirement: ZIP upload from admin UI

The dashboard SHALL provide an upload form for installing new modules via ZIP.

#### Scenario: Upload via dashboard

- **WHEN** an administrator submits a module ZIP through the dashboard
- **THEN** the system SHALL run the installation pipeline and refresh the module list

### Requirement: Resource tooltip

The dashboard SHALL show CPU and RAM usage in a tooltip when hovering over a running module's status indicator.

#### Scenario: Hover shows stats

- **WHEN** an administrator hovers over a running module status circle
- **THEN** the UI SHALL display current CPU and memory usage fetched from the stats API
