## MODIFIED Requirements

### Requirement: Layout item schema

Each layout item SHALL include `id`, `folderId`, `kind`, `title`, `subtitle`, `pageType`, `route`, and `sortOrder` when `kind` is `module`. Folder and admin-add items MAY omit `pageType` and `route`.

#### Scenario: Valid module item with folderId

- **WHEN** item has `kind: module`, valid `folderId`, and `pageType` builtin or standalone
- **THEN** validation SHALL pass

### Requirement: Site layout JSON persistence

The system SHALL validate `folders[]` and `rootFolderId` on load and save atomically.

#### Scenario: Save layout with folders

- **WHEN** admin PUT layout including folders and items
- **THEN** file SHALL be written atomically and reload without error
