## ADDED Requirements

### Requirement: Virtual folder tree in site layout

The system SHALL store virtual folders in `site-layout.json` as `folders[]` with `id`, `title`, and `parentId`. A `rootFolderId` SHALL point to the homepage root folder.

#### Scenario: Valid folder hierarchy

- **WHEN** folders form a tree with single root (`parentId: null`)
- **THEN** validation SHALL pass

#### Scenario: Orphan folder rejected

- **WHEN** a folder references unknown `parentId`
- **THEN** validation SHALL fail

### Requirement: Layout items belong to a folder

Each layout item SHALL include `folderId` referencing an existing folder id and `kind` of `module`, `folder`, or `admin-add`.

#### Scenario: Item in portfolio folder

- **WHEN** item has `folderId: "portfolio"`
- **THEN** it SHALL appear only on portfolio browse page

### Requirement: Migrate flat v2 layouts

The system SHALL migrate layouts missing `folders[]` by creating root folder and assigning `folderId: "root"` to all items.

#### Scenario: Load legacy flat layout

- **WHEN** file has only flat `items[]`
- **THEN** loader SHALL inject default root folder and persist migrated shape on next save
