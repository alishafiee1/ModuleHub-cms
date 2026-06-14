# virtual-folder Specification

## Purpose
TBD - created by archiving change modulehub-cms-v1. Update Purpose after archive.
## Requirements
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

### Requirement: Update virtual folder
Super Admin SHALL be able to rename a folder, update its card description, and move it to another parent via `PATCH /admin/folder/:folderId`.

#### Scenario: Rename folder
- **WHEN** Super Admin PATCHes `{ "name": "Archive" }` for a valid folder id
- **THEN** server updates the folder node in `site-layout.json` and returns `{ node }`

#### Scenario: Move folder to new parent
- **WHEN** Super Admin PATCHes `{ "parentId": "target-folder-id" }` for a folder that is not `root` and target is not self or a descendant
- **THEN** folder is reparented, grid placement node is appended under the destination parent, and the folder disappears from the old parent view

#### Scenario: Move into self rejected
- **WHEN** Super Admin attempts to set `parentId` to the folder itself or any of its descendants
- **THEN** server responds with HTTP 400 and does not modify layout

#### Scenario: Root folder parent immutable
- **WHEN** Super Admin PATCHes `parentId` on folder id `root`
- **THEN** server responds with HTTP 400; rename and `cardDescription` on root remain allowed if provided

### Requirement: Delete virtual folder with content policy
Super Admin SHALL delete a virtual folder via `DELETE /admin/folder/:folderId` with an explicit `contentPolicy`.

#### Scenario: Delete empty folder
- **WHEN** Super Admin deletes a folder with no children and confirms
- **THEN** folder node is removed from `site-layout.json` and folder card disappears from the canvas

#### Scenario: Reject delete when not empty without policy
- **WHEN** Super Admin deletes a non-empty folder with `contentPolicy: "reject-if-not-empty"`
- **THEN** server responds with HTTP 409 `FOLDER_NOT_EMPTY`

#### Scenario: Move children to parent on delete
- **WHEN** Super Admin deletes a non-empty folder with `contentPolicy: "move-to-parent"`
- **THEN** direct children are reparented to the deleted folder's parent and the folder node is removed

#### Scenario: Move children to target folder on delete
- **WHEN** Super Admin deletes with `contentPolicy: "move-to-folder"` and valid `targetFolderId` not under the deleted folder
- **THEN** all direct children move to `targetFolderId` and the folder node is removed

#### Scenario: Cascade delete requires name confirmation
- **WHEN** Super Admin deletes with `contentPolicy: "cascade-delete"` and `confirmName` does not exactly match the folder name
- **THEN** server responds with HTTP 400 and layout is unchanged

#### Scenario: Cascade delete removes subtree
- **WHEN** Super Admin cascade-deletes with matching `confirmName`
- **THEN** folder subtree is removed, modules are stopped if running and deleted via existing module-delete flow, and no virtual folder directories are created on disk

### Requirement: No physical directory on folder lifecycle changes
Updating or deleting a virtual folder SHALL NOT create or remove filesystem directories under `standalone-modules/`.

#### Scenario: PATCH has no disk side effect
- **WHEN** a folder is renamed or moved via PATCH
- **THEN** only `site-layout.json` changes

#### Scenario: DELETE has no virtual folder disk path
- **WHEN** a virtual folder is deleted with any content policy
- **THEN** no filesystem directory is created or removed solely for that virtual folder id
