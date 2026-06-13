## ADDED Requirements

### Requirement: Gear dialog actions
The gear dialog SHALL provide: Start, Stop, Restart, View Logs, Edit Settings, Backup, GitHub Sync, Delete.

#### Scenario: Dialog opens
- **WHEN** admin clicks gear icon on a module card
- **THEN** modal displays all management actions with current module status

### Requirement: Start and stop API
The system SHALL expose `POST /admin/module/:id/start` and `POST /admin/module/:id/stop`.

#### Scenario: Start module
- **WHEN** Super Admin or Module Manager (scoped) clicks Start on a stopped module
- **THEN** module process/container starts and status becomes `running`

#### Scenario: Stop module
- **WHEN** admin clicks Stop on a running module
- **THEN** module process/container stops and status becomes `stopped`

### Requirement: Log viewer
The system SHALL display the last N lines from `/var/log/modulehub/modules/<id>.log` where N defaults to `logViewerMaxLines` (50).

#### Scenario: View logs
- **WHEN** admin clicks View Logs
- **THEN** modal shows last 50 lines of module log with option to download full file

### Requirement: Module deletion
Deleting a module SHALL require Super Admin session. It SHALL stop the process, remove `standalone-modules/<id>/`, remove from layout JSON, and delete log file.

#### Scenario: Delete module
- **WHEN** Super Admin confirms module deletion
- **THEN** module disappears from home page and all associated files are removed

#### Scenario: Module Manager cannot delete
- **WHEN** Module Manager session attempts module deletion
- **THEN** system responds with HTTP 403

### Requirement: Set module management password
Super Admin SHALL be able to set or reset `managementPasswordHash` via module edit dialog.

#### Scenario: Password set
- **WHEN** Super Admin sets a module management password in edit dialog
- **THEN** bcrypt hash is stored in `site-layout.json` and plaintext is never persisted

### Requirement: Per-module backup
The system SHALL allow downloading a ZIP of the module folder plus its layout entry.

#### Scenario: Backup download
- **WHEN** admin clicks Backup on a module
- **THEN** browser downloads a ZIP containing module files and metadata

### Requirement: GitHub sync
If `gitRepo` is set, the system SHALL run `git pull` and reinstall dependencies on sync.

#### Scenario: GitHub pull
- **WHEN** admin clicks GitHub Sync on a module with configured repo
- **THEN** latest code is pulled and dependencies updated via package cache
