## ADDED Requirements

### Requirement: Serve static module index

The system SHALL serve `index.html` for static modules at their registered proxy prefix or dedicated static route.

#### Scenario: Access static module page

- **WHEN** a user requests `/modules/<module-id>/` for a static module
- **THEN** the system SHALL return the module's `index.html`

### Requirement: Serve static module assets

The system SHALL serve CSS, JS, images, and other assets relative to the module directory.

#### Scenario: Load module stylesheet

- **WHEN** a user requests `/modules/<module-id>/style.css`
- **THEN** the system SHALL return the file from the module folder if it exists

#### Scenario: Missing asset returns 404

- **WHEN** a requested asset does not exist in the module directory
- **THEN** the system SHALL respond with HTTP 404

### Requirement: Static modules require no process

Static modules SHALL NOT require a background process or Docker container to be considered available.

#### Scenario: Static module always green

- **WHEN** a static module is installed
- **THEN** the admin dashboard SHALL display it as available without a start action
