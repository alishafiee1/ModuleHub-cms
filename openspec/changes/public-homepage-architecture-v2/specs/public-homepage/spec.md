## ADDED Requirements

### Requirement: Public homepage at root

The system SHALL serve a public homepage at `/` without requiring authentication.

#### Scenario: Visitor opens site root

- **WHEN** an unauthenticated user requests `/`
- **THEN** the system SHALL return an HTML page with module tiles from `site-layout.json`
- **AND** the system SHALL NOT redirect to `/admin`

#### Scenario: Homepage shows tile metadata

- **WHEN** the homepage renders
- **THEN** each layout item SHALL display its title, subtitle, icon, and link to its configured route

### Requirement: Homepage visual design from reference

The public homepage SHALL use the card layout and styling defined in reference file `Ai_projects/main.html` (RODI Docs main page).

#### Scenario: Hero section rendered

- **WHEN** the homepage loads
- **THEN** the page SHALL show a hero section with `siteTitle` and `siteSubtitle` from `site-layout.json`
- **AND** the hero SHALL use the dark gradient styling from the reference design

#### Scenario: Card grid matches reference

- **WHEN** layout items are rendered
- **THEN** tiles SHALL appear in a responsive CSS grid with `minmax(260px, 1fr)` columns and 24px gap
- **AND** each tile SHALL use the reference card gradient, border, 16px radius, and hover lift effect

#### Scenario: Card content structure

- **WHEN** a module tile is rendered
- **THEN** the tile SHALL show a Font Awesome icon (from `iconClass`), title (`<h5>`), and muted subtitle
- **AND** the entire card body SHALL be a clickable link to the module route

#### Scenario: RTL typography

- **WHEN** the homepage is served
- **THEN** the HTML SHALL use `lang="fa"` and `dir="rtl"`
- **AND** the page SHALL load Vazirmatn as the primary font family

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

### Requirement: Homepage footer

The homepage SHALL include a footer consistent with the reference design.

#### Scenario: Footer with admin link

- **WHEN** the homepage renders
- **THEN** a footer SHALL display site copyright text
- **AND** a link to `/admin` SHALL be available for system management
