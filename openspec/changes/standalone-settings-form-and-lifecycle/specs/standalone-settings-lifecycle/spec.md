## ADDED Requirements

### Requirement: Settings pending status after upload

After standalone ZIP install, module status SHALL be `settings_pending` and Docker compose SHALL start for configuration.

#### Scenario: Post-upload state

- **WHEN** ZIP install succeeds
- **THEN** registry status SHALL be `settings_pending` and container SHALL be starting or up

### Requirement: Proxy blocked until running

Reverse proxy SHALL NOT forward API paths when status is `settings_pending`.

#### Scenario: API before settings saved

- **WHEN** client requests `/modules/<id>/api/health` while settings_pending
- **THEN** response SHALL be 503 with settings message

### Requirement: Reopen settings from admin

Clicking module card in admin when settings incomplete SHALL open settings form.

#### Scenario: Admin card click

- **WHEN** admin opens module with settings_pending
- **THEN** UI SHALL display settings form pre-filled from manifest
