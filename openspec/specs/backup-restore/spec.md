# backup-restore Specification

## Purpose
TBD - created by archiving change modulehub-cms-v1. Update Purpose after archive.
## Requirements
### Requirement: Full backup creation
The system SHALL create a timestamped ZIP containing: `site-layout.json`, `system-settings.json`, `standalone-modules/`, and `thumbnails/`.

#### Scenario: Backup created
- **WHEN** admin clicks Full Backup
- **THEN** ZIP file is saved to `storage/backups/` with timestamp in filename

### Requirement: Backup download
Admin SHALL be able to download any backup file from the admin panel or CLI.

#### Scenario: Download backup
- **WHEN** admin selects a backup file
- **THEN** browser downloads the ZIP file

### Requirement: Restore with confirmation
Restore SHALL require explicit admin confirmation and create an automatic pre-restore backup.

#### Scenario: Restore success from upload
- **WHEN** admin uploads a valid backup ZIP and confirms restore
- **THEN** current state is backed up, backup contents replace live data, and CMS restarts

#### Scenario: Restore from server backup list
- **WHEN** admin selects a `modulehub-full-*.zip` from the settings backup dialog and confirms restore
- **THEN** system reads the file from `storage/backups/`, creates pre-restore backup, and replaces live data

#### Scenario: Pre-restore safety backup
- **WHEN** restore is initiated
- **THEN** system creates automatic backup of current state before overwriting

### Requirement: CLI backup
The CLI script SHALL support `node scripts/cli.js backup --output <path>`.

#### Scenario: CLI backup
- **WHEN** operator runs backup CLI command
- **THEN** full backup ZIP is written to specified output path

