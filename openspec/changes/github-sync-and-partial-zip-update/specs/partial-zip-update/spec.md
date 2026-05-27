## ADDED Requirements

### Requirement: Partial ZIP update

The system SHALL expose `POST /api/modules/:id/partial-upload` accepting ZIP with same path safety as full install.

#### Scenario: Replace subset of files

- **WHEN** admin uploads ZIP with updated server.js only
- **THEN** only allowed files SHALL be replaced in instance directory

#### Scenario: Path traversal in partial ZIP

- **WHEN** ZIP contains `../` paths
- **THEN** upload SHALL be rejected
