## ADDED Requirements

### Requirement: Role field in manifest

Modules MAY declare an optional `admin_role` field in `manifest.json` specifying the role required to manage that module.

#### Scenario: Module with role requirement

- **WHEN** a manifest includes `"admin_role": "robot_engineer"`
- **THEN** only users with that role SHALL see management actions for the module

### Requirement: Filter visible modules by role

The system SHALL filter the admin dashboard module list based on the authenticated user's role.

#### Scenario: User sees allowed modules only

- **WHEN** a user with role `robot_engineer` opens the dashboard
- **THEN** the system SHALL display modules with no `admin_role`, plus modules matching `robot_engineer`

#### Scenario: Super admin sees all modules

- **WHEN** a user with role `admin` opens the dashboard
- **THEN** the system SHALL display all modules regardless of `admin_role`

### Requirement: Restrict control actions by role

Start, Stop, Logs, and Uninstall actions SHALL be restricted to users whose role matches the module's `admin_role` or who have the `admin` role.

#### Scenario: Unauthorized start attempt

- **WHEN** a user without the required role attempts to start a module
- **THEN** the system SHALL respond with HTTP 403 Forbidden

### Requirement: MVP authentication stub

The system SHALL support role assignment via environment configuration or session for MVP purposes.

#### Scenario: Env-based admin role

- **WHEN** `ADMIN_ROLE=admin` is set and the user authenticates with the configured admin password
- **THEN** the user SHALL receive the `admin` role for authorization checks
