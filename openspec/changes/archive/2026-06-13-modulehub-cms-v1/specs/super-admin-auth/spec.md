## ADDED Requirements

### Requirement: Super Admin login page
The system SHALL expose `GET /admin/login` (form) and `POST /admin/login` (credentials) accessible from the internet over HTTPS.

#### Scenario: Successful login
- **WHEN** user submits valid Super Admin username and password
- **THEN** system creates a session and redirects to the home page with admin controls enabled

#### Scenario: Failed login
- **WHEN** user submits invalid credentials
- **THEN** system responds with an error and does not create a session

### Requirement: Password hashing
Super Admin passwords SHALL be stored as bcrypt hashes (cost ≥ 12) in `storage/admin-users.json` or `ADMIN_PASSWORD_HASH` environment variable — never plaintext.

#### Scenario: Password verification
- **WHEN** login POST receives a password
- **THEN** system compares against bcrypt hash only

### Requirement: Session cookie security
Super Admin sessions SHALL use `express-session` with cookie flags: `HttpOnly`, `Secure`, `SameSite=Strict`.

#### Scenario: Secure cookie set
- **WHEN** login succeeds over HTTPS
- **THEN** response sets a session cookie with HttpOnly and Secure flags

### Requirement: Session TTL
Super Admin session duration SHALL be controlled by `sessionTtlHours` from `system-settings.json` (default 8).

#### Scenario: Session expires
- **WHEN** session age exceeds `sessionTtlHours`
- **THEN** user must log in again to access Super Admin endpoints

### Requirement: Login rate limiting
The system SHALL limit login attempts to `loginRateLimitPerMinute` from system settings (default 5) per IP.

#### Scenario: Rate limit exceeded
- **WHEN** more than 5 failed login attempts occur within one minute from the same IP
- **THEN** system responds with HTTP 429

### Requirement: CSRF protection
All Super Admin POST/PUT/DELETE requests SHALL require a valid CSRF token.

#### Scenario: Missing CSRF token
- **WHEN** authenticated user sends POST without CSRF token
- **THEN** system responds with HTTP 403

### Requirement: Logout
The system SHALL expose `POST /admin/logout` to invalidate the Super Admin session.

#### Scenario: Logout success
- **WHEN** Super Admin submits logout
- **THEN** session is destroyed and admin-only controls are no longer accessible

### Requirement: Super Admin-only endpoints
The following SHALL require Super Admin session: `POST /admin/upload`, `POST /admin/folder`, `GET/POST /admin/settings`, `POST /admin/backup`, `POST /admin/restore`, `DELETE /admin/module/:id`, and setting `managementPasswordHash`.

#### Scenario: Module Manager blocked from settings
- **WHEN** Module Manager session attempts `GET /admin/settings`
- **THEN** system responds with HTTP 403
