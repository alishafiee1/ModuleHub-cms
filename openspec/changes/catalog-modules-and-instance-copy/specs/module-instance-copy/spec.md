## ADDED Requirements

### Requirement: Create instance from template

The system SHALL expose `POST /api/instances` accepting `templateId`, `instanceId`, `cardTitle`, optional `cardImage`, optional `folderId`.

#### Scenario: Successful copy

- **WHEN** admin posts valid unique instanceId
- **THEN** system SHALL copy template to `standalone-modules/<instanceId>/`, register module, add layout item

#### Scenario: Duplicate instance id

- **WHEN** instanceId already exists
- **THEN** response SHALL be 409 Conflict

### Requirement: Independent instance content

Each instance SHALL have isolated filesystem directory; content changes SHALL NOT affect other instances or template source.

#### Scenario: Two gallery instances

- **WHEN** two instances created from same template
- **THEN** each SHALL have separate directories and layout entries
