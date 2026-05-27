## ADDED Requirements

### Requirement: Module settings read API

The system SHALL expose `GET /api/modules/:id/settings` (auth required) returning docker, proxy, github, entryHtml fields and layout card image fields.

#### Scenario: Auto-fill from manifest

- **WHEN** module has existing manifest.json
- **THEN** GET settings SHALL return parsed values for form fields

### Requirement: Module settings write API

The system SHALL expose `PUT /api/modules/:id/settings` validating ports, prefix, resources; updating manifest and site-layout icon; transitioning status to `running` when complete.

#### Scenario: Save incomplete settings

- **WHEN** required docker fields missing
- **THEN** response SHALL be 400 with field errors

#### Scenario: Save complete settings

- **WHEN** valid settings submitted
- **THEN** status SHALL become `running` and proxy SHALL forward API paths
