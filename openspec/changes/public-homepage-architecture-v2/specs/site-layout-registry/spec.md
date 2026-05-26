## ADDED Requirements

### Requirement: Site layout JSON persistence

The system SHALL store homepage presentation configuration in `site-layout.json` using atomic write (temp + rename).

#### Scenario: Load layout on startup

- **WHEN** the core application starts
- **THEN** the system SHALL load `site-layout.json` and validate against the layout schema

#### Scenario: Missing layout file bootstrap

- **WHEN** `site-layout.json` does not exist on first run
- **THEN** the system SHALL create a default layout from registered built-in and standalone modules

### Requirement: Layout item schema

Each layout item SHALL include `id`, `title`, `icon`, `pageType`, `route`, and `sortOrder`.

#### Scenario: Valid layout item

- **WHEN** a layout item has `pageType` of `builtin` or `standalone`
- **THEN** validation SHALL pass and the item SHALL be eligible for homepage rendering

#### Scenario: Invalid pageType rejected

- **WHEN** a layout item has an unknown `pageType`
- **THEN** validation SHALL fail with a descriptive error

### Requirement: Layout API for administrators

The system SHALL expose authenticated API endpoints to read and update site layout.

#### Scenario: Get layout

- **WHEN** an authenticated administrator requests `GET /api/site-layout`
- **THEN** the system SHALL return the current layout items sorted by `sortOrder`

#### Scenario: Update layout

- **WHEN** an authenticated administrator submits `PUT /api/site-layout` with valid items
- **THEN** the system SHALL persist the layout and return the updated configuration

### Requirement: Layout sync on module lifecycle

The system SHALL update layout entries when standalone modules are installed or uninstalled.

#### Scenario: Auto-add on standalone install

- **WHEN** a standalone module is installed and no layout item exists for its id
- **THEN** the system SHALL append a layout item using manifest name, icon, and default route `/modules/<id>/`

#### Scenario: Remove on uninstall

- **WHEN** a standalone module is uninstalled
- **THEN** the system SHALL remove the corresponding layout item
