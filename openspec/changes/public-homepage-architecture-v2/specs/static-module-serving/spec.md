## MODIFIED Requirements

### Requirement: Serve static module index

The system SHALL serve `index.html` for **built-in** modules at `/pages/<module-id>/`.

#### Scenario: Access built-in module page

- **WHEN** a user requests `/pages/<module-id>/` for a built-in module
- **THEN** the system SHALL return the module's `index.html` from `core/builtin-modules/<module-id>/`

### Requirement: Serve static module assets

The system SHALL serve CSS, JS, images, and other assets for built-in modules relative to their directory under `/pages/<module-id>/`.

#### Scenario: Load built-in module stylesheet

- **WHEN** a user requests `/pages/<module-id>/style.css`
- **THEN** the system SHALL return the file from `core/builtin-modules/<module-id>/` if it exists

#### Scenario: Missing asset returns 404

- **WHEN** a requested built-in asset does not exist
- **THEN** the system SHALL respond with HTTP 404

### Requirement: Static modules require no process

Built-in modules SHALL NOT require a background process or Docker container to be considered available.

#### Scenario: Built-in module always green

- **WHEN** a built-in module is registered
- **THEN** the admin dashboard and homepage SHALL display it as available without a start action

## REMOVED Requirements

### Requirement: Serve static module index (uploaded static-modules path)

**Reason**: Regular pages are now built into core (`core/builtin-modules/`), not uploaded as ZIP static modules.

**Migration**: Move content from `static-modules/<id>/` to `core/builtin-modules/<id>/` and update registry type to `builtin`.

### Requirement: Serve static module assets (uploaded static-modules path)

**Reason**: Same as above — `/modules/<id>/` static serving from `static-modules/` is removed.

**Migration**: Use `/pages/<id>/` routes for built-in modules.

## ADDED Requirements

### Requirement: Serve standalone landing index from host

The system SHALL serve `index.html` from `standalone-modules/<id>/` at `/modules/<id>/` regardless of container state.

#### Scenario: Stopped standalone still shows landing

- **WHEN** a user requests `/modules/<id>/` and the standalone module is stopped
- **THEN** the system SHALL return the module's host `index.html`

#### Scenario: Missing standalone index

- **WHEN** a standalone module has no `index.html` in its install folder
- **THEN** the system SHALL respond with HTTP 404 and an installation error message
