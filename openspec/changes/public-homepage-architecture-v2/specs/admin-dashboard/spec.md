## ADDED Requirements

### Requirement: System admin panel separation

The system admin panel at `/admin` SHALL remain the place for standalone ZIP upload and global module management, distinct from the public homepage.

#### Scenario: Admin panel still available

- **WHEN** an administrator navigates to `/admin`
- **THEN** the system SHALL render the system admin dashboard with upload and module management

### Requirement: Homepage admin overlay

When an authenticated administrator views `/`, standalone module tiles SHALL optionally show Start, Stop, Logs, and stats tooltip using existing module APIs.

#### Scenario: Stats tooltip on homepage

- **WHEN** an authenticated admin hovers a running standalone tile status on the homepage
- **THEN** the UI SHALL display CPU and memory from `GET /api/modules/:id/stats`

## MODIFIED Requirements

### Requirement: Module tile display

The admin dashboard SHALL display each registered module as a tile with name, icon, type, and status indicator. The public homepage SHALL display a subset of presentation fields from `site-layout.json`.

#### Scenario: Display module tiles in admin

- **WHEN** an administrator opens `/admin`
- **THEN** the system SHALL render a tile for every module in the registry

#### Scenario: Homepage uses layout order

- **WHEN** any user opens `/`
- **THEN** tiles SHALL be ordered by `sortOrder` from `site-layout.json`

### Requirement: ZIP upload from admin UI

The dashboard upload form SHALL accept **standalone-only** ZIP packages.

#### Scenario: Upload standalone via dashboard

- **WHEN** an administrator submits a standalone module ZIP through the dashboard
- **THEN** the system SHALL run the installation pipeline and refresh the module list

#### Scenario: Reject static ZIP in dashboard

- **WHEN** an administrator submits a static-type module ZIP
- **THEN** the dashboard SHALL show an error that static modules must be built into core
