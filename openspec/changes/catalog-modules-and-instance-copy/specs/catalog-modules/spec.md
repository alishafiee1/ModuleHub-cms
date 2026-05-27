## ADDED Requirements

### Requirement: Catalog template directory

The system SHALL read module templates from `CATALOG_MODULES_DIR` (default `core/catalog-modules/`). Each template SHALL include `manifest.template.json` and `index.html`.

#### Scenario: List templates

- **WHEN** admin calls `GET /api/catalog`
- **THEN** response SHALL list template ids, titles, and descriptions

### Requirement: Template manifest contract

Template manifests SHALL define default routes, icons, and token placeholders for instance id and card title.

#### Scenario: Valid template

- **WHEN** template folder contains required files
- **THEN** catalog scanner SHALL include it in list
