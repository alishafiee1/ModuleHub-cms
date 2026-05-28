## ADDED Requirements

### Requirement: Settings page
The system SHALL expose `/admin/settings` as a form page editable only by Super Admin session (from internet or LAN).

#### Scenario: Settings page loads
- **WHEN** Super Admin navigates to `/admin/settings`
- **THEN** form displays all fields from `system-settings.json` with current values

#### Scenario: Module Manager blocked
- **WHEN** Module Manager session attempts `/admin/settings`
- **THEN** system responds with HTTP 403

### Requirement: Settings persistence
Settings SHALL be saved to `storage/system-settings.json` validated against schema from `docs/system-settings.example.json`.

#### Scenario: Save settings
- **WHEN** admin submits the settings form with valid values
- **THEN** `storage/system-settings.json` is updated and CMS applies new limits immediately

### Requirement: ZIP size enforcement
Upload middleware SHALL read `maxZipUploadMb` from system settings for multer limit.

#### Scenario: Updated ZIP limit
- **WHEN** admin changes `maxZipUploadMb` to 100 and saves
- **THEN** subsequent uploads over 100 MB are rejected with 413

### Requirement: Network interface radio
When server has ≥2 active NICs, settings page SHALL show radio buttons listing interfaces from `ip -o link show up`.

#### Scenario: Interface selection saved
- **WHEN** admin selects `enp63s0` for package install interface
- **THEN** `packageInstallInterface` is saved and used for dependency installs

### Requirement: Default module resources
New modules SHALL inherit `defaultModuleResources` from system settings in the add wizard.

#### Scenario: Default resources applied
- **WHEN** admin opens add wizard step 2
- **THEN** resource sliders are pre-filled with values from `defaultModuleResources`

### Requirement: Port auto-allocation range
Port allocator SHALL use `portRangeStart` and `portRangeEnd` from system settings.

#### Scenario: Port from settings range
- **WHEN** admin leaves port empty during upload
- **THEN** assigned port falls within configured range

### Requirement: Concurrent running modules limit
System settings SHALL include `maxConcurrentRunningModules` (default 10) consumed by module-runtime before allowing start.

#### Scenario: Limit configured
- **WHEN** admin sets `maxConcurrentRunningModules` to 5 and saves
- **THEN** module start is blocked once 5 modules are running

### Requirement: Auto-restart settings
System settings SHALL include `autoRestartOnCrash` (default false) and `autoRestartMaxAttemptsPerHour` (default 3) consumed by module-runtime crash handler.

#### Scenario: Auto-restart toggled
- **WHEN** admin enables `autoRestartOnCrash` and saves settings
- **THEN** subsequent module crashes trigger automatic restart attempts within the hourly limit

### Requirement: Auth session settings
System settings SHALL include `sessionTtlHours` (8), `loginRateLimitPerMinute` (5), `moduleManagerSessionTtlHours` (4), `modulePasswordMaxAttempts` (5), and `modulePasswordLockoutMinutes` (15).

#### Scenario: Session TTL configured
- **WHEN** Super Admin sets `sessionTtlHours` to 4 and saves
- **THEN** Super Admin sessions expire after 4 hours

#### Scenario: Module lockout configured
- **WHEN** `modulePasswordMaxAttempts` is 5 and user fails 5 times
- **THEN** module auth is locked for `modulePasswordLockoutMinutes`
