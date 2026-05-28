## ADDED Requirements

### Requirement: Create virtual folder
Admin SHALL be able to create a new virtual folder via the add card (+) menu option «پوشه جدید».

#### Scenario: Folder created
- **WHEN** admin selects «پوشه جدید» from the add menu and enters a name
- **THEN** a new folder entry is added to `site-layout.json` under the current folder with `type: "folder"` and no physical directory on disk

#### Scenario: Folder appears in grid
- **WHEN** virtual folder creation succeeds
- **THEN** a new folder card appears in the current view and is navigable via breadcrumb

### Requirement: Virtual folder API
The system SHALL expose `POST /admin/folder` accepting `{ "name": string, "parentId": string }` and persisting to `site-layout.json`.

#### Scenario: API creates folder
- **WHEN** admin submits a valid folder name and parentId via the API
- **THEN** server returns the new folder node and updates `site-layout.json`

#### Scenario: Empty name rejected
- **WHEN** admin submits an empty folder name
- **THEN** server responds with HTTP 400 and an error message

### Requirement: No physical directory
Creating a virtual folder SHALL NOT create any directory under `standalone-modules/` or elsewhere on the filesystem.

#### Scenario: No disk side effect
- **WHEN** a virtual folder is created
- **THEN** no new filesystem directory is created for that folder ID
