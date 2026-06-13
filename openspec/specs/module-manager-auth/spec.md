# module-manager-auth Specification

## Purpose
TBD - created by archiving change modulehub-cms-v1. Update Purpose after archive.
## Requirements
### Requirement: Module management password storage
Each module SHALL support optional `managementPasswordHash` (bcrypt) and `managementPermissions` (default: `["start","stop","logs","edit"]`) in `site-layout.json`.

#### Scenario: Password set by Super Admin
- **WHEN** Super Admin sets a module management password in edit dialog
- **THEN** `managementPasswordHash` is stored in `site-layout.json` as bcrypt hash

#### Scenario: No password configured
- **WHEN** `managementPasswordHash` is empty
- **THEN** only Super Admin session can manage that module

### Requirement: Module Manager authentication
The system SHALL expose `POST /admin/module/:id/auth` accepting a module password and creating a scoped session with `scope: "module-manager"` and matching `moduleId`.

#### Scenario: Successful module auth
- **WHEN** user submits correct password for a module with `managementPasswordHash` set
- **THEN** scoped session is created and gear dialog actions for that module are enabled

#### Scenario: Wrong password
- **WHEN** user submits incorrect module password
- **THEN** system responds with HTTP 401 and increments failed attempt counter

### Requirement: Module Manager session TTL
Module Manager sessions SHALL expire after `moduleManagerSessionTtlHours` from system settings (default 4).

#### Scenario: Scoped session expires
- **WHEN** Module Manager session exceeds TTL
- **THEN** user must re-enter module password to manage the module

### Requirement: Module password lockout
After `modulePasswordMaxAttempts` failed attempts (default 5), the system SHALL lock module auth for `modulePasswordLockoutMinutes` (default 15).

#### Scenario: Lockout triggered
- **WHEN** user fails module password 5 times within the lockout window
- **THEN** further auth attempts for that module return HTTP 429 until lockout expires

### Requirement: Module Manager permission scope
Module Manager session SHALL allow only: start, stop, restart, view logs, edit resources (not password), and per-module backup for the authenticated `moduleId`.

#### Scenario: Delete blocked for Module Manager
- **WHEN** Module Manager session attempts `DELETE /admin/module/:id`
- **THEN** system responds with HTTP 403

#### Scenario: Start allowed for own module
- **WHEN** Module Manager with valid session for `gal-789` calls `POST /admin/module/gal-789/start`
- **THEN** module starts successfully

### Requirement: Super Admin overrides Module Manager
Super Admin session SHALL have full access to all modules without requiring per-module password.

#### Scenario: Super Admin opens gear without module password
- **WHEN** Super Admin clicks gear on any module
- **THEN** full management dialog opens without password prompt

