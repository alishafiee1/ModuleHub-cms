## ADDED Requirements

### Requirement: Built-in module directory structure

Built-in page modules SHALL live under `core/builtin-modules/<id>/` with `manifest.json`, `index.html`, and assets.

#### Scenario: Built-in module registered at bootstrap

- **WHEN** the core starts
- **THEN** each built-in module SHALL be registered in the module registry with `type: builtin` and status `static`

### Requirement: Built-in module HTTP routes

The system SHALL serve built-in modules at `/pages/<id>/` with `index.html` as the default document.

#### Scenario: Access built-in gallery

- **WHEN** a user requests `/pages/sample-gallery/`
- **THEN** the system SHALL return `core/builtin-modules/sample-gallery/index.html`

#### Scenario: Serve built-in assets

- **WHEN** a user requests `/pages/sample-gallery/style.css`
- **THEN** the system SHALL return the asset from the built-in module directory

### Requirement: Initial built-in modules

The MVP SHALL ship with at least `sample-gallery` and `markdown-viewer` as built-in modules.

#### Scenario: Gallery built-in available

- **WHEN** the system is deployed with default configuration
- **THEN** the sample gallery SHALL be accessible at `/pages/sample-gallery/` without Docker or upload

#### Scenario: Markdown viewer built-in available

- **WHEN** the system is deployed with default configuration
- **THEN** the markdown viewer SHALL be accessible at `/pages/markdown-viewer/`

### Requirement: Built-in modules appear on homepage

Built-in modules SHALL be listed in `site-layout.json` with `pageType: builtin`.

#### Scenario: Layout includes gallery

- **WHEN** default layout is generated
- **THEN** a layout item for `sample-gallery` SHALL reference route `/pages/sample-gallery/`
