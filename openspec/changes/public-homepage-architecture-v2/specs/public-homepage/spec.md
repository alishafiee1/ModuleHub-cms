## ADDED Requirements

### Requirement: Public homepage at root

The system SHALL serve a public homepage at `/` without requiring authentication.

#### Scenario: Visitor opens site root

- **WHEN** an unauthenticated user requests `/`
- **THEN** the system SHALL return an HTML page with module tiles from `site-layout.json`
- **AND** the system SHALL NOT redirect to `/admin`

#### Scenario: Homepage shows tile metadata

- **WHEN** the homepage renders
- **THEN** each layout item SHALL display its title, icon, and link to its configured route

### Requirement: Module status on homepage tiles

The homepage SHALL display runtime status for each module tile using registry data.

#### Scenario: Running standalone shows green dot

- **WHEN** a standalone module status is `running`
- **THEN** its homepage tile SHALL show a green status indicator

#### Scenario: Stopped standalone shows non-green dot

- **WHEN** a standalone module status is `stopped`
- **THEN** its homepage tile SHALL show a gray status indicator

#### Scenario: Built-in module shows always available

- **WHEN** a built-in module tile is rendered
- **THEN** the tile SHALL show a green status indicator without requiring Docker

### Requirement: Admin controls on homepage for authorized users

When an authenticated administrator with matching role views the homepage, the system SHALL show module control actions on standalone tiles.

#### Scenario: Admin sees Start on stopped module

- **WHEN** an authenticated admin with matching `admin_role` views the homepage
- **AND** a standalone module is stopped
- **THEN** the tile SHALL include a Start action calling the existing modules API

#### Scenario: Anonymous user does not see admin actions

- **WHEN** an unauthenticated user views the homepage
- **THEN** Start, Stop, and Logs controls SHALL NOT be visible

### Requirement: Homepage navigation to modules

The homepage SHALL link each tile to its configured route for visitor access.

#### Scenario: Click built-in tile

- **WHEN** a user clicks a built-in module tile with route `/pages/sample-gallery/`
- **THEN** the browser SHALL navigate to the built-in module page

#### Scenario: Click standalone tile

- **WHEN** a user clicks a standalone module tile with route `/modules/demo-api/`
- **THEN** the browser SHALL navigate to the standalone module landing page
