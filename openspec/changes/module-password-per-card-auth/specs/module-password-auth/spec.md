## ADDED Requirements

### Requirement: Module password hash storage

Manifest MAY include `modulePasswordHash` (bcrypt). API SHALL never return the hash value.

#### Scenario: Set password via settings

- **WHEN** admin sets module password in settings form
- **THEN** manifest SHALL store bcrypt hash only

### Requirement: Module unlock API

The system SHALL expose `POST /api/modules/:id/unlock` with password body.

#### Scenario: Correct password

- **WHEN** password matches hash
- **THEN** system SHALL issue module-scoped session cookie

#### Scenario: Wrong password rate limit

- **WHEN** five failed attempts within window
- **THEN** response SHALL be 429

### Requirement: Module-scoped authorization

Module session SHALL authorize gear actions for that module only, not global admin APIs.

#### Scenario: Cross-module access denied

- **WHEN** module A session calls start on module B
- **THEN** response SHALL be 403
