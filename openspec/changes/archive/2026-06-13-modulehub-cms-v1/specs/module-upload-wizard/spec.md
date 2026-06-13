## ADDED Requirements

### Requirement: ZIP upload endpoint
The system SHALL accept ZIP uploads at `POST /admin/upload` with max size from `system-settings.json` (`maxZipUploadMb`, default 200).

#### Scenario: Valid ZIP upload
- **WHEN** admin uploads a ZIP file under the size limit
- **THEN** file is saved to `/tmp/modulehub-upload/` and extraction begins

#### Scenario: Oversized ZIP rejected
- **WHEN** admin uploads a ZIP exceeding `maxZipUploadMb`
- **THEN** server responds with HTTP 413 and an error message

### Requirement: ZIP extraction
Uploaded ZIPs SHALL be extracted to `standalone-modules/<generated-id>/`.

#### Scenario: Extraction success
- **WHEN** a valid ZIP is uploaded
- **THEN** all files are extracted to a new module directory with a unique ID

### Requirement: Three-step wizard
The add wizard SHALL collect: (1) Docker yes/no, internal port, permissions; (2) icon, thumbnail, resources; (3) confirmation and save.

#### Scenario: Auto port assignment
- **WHEN** admin leaves internal port empty for a backend module
- **THEN** system assigns an available port in range `portRangeStart`–`portRangeEnd` (default 4100–4999)

#### Scenario: Static module no port
- **WHEN** admin leaves port empty for Static/SPA content
- **THEN** no port is assigned and module is served directly by CMS without a separate process

### Requirement: Layout JSON update on install
After wizard completion, the new module SHALL be registered in `site-layout.json` with version `1.0.0` and status `stopped`.

#### Scenario: New card appears
- **WHEN** wizard completes successfully
- **THEN** a new module card appears in the current folder on the home page
