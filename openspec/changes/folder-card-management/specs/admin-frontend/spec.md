## ADDED Requirements

### Requirement: Folder gear for Super Admin
Folder cards SHALL display a gear (⚙) icon for Super Admin when not in layout edit mode. Module Manager sessions SHALL NOT receive folder gear.

#### Scenario: Guest sees no folder gear
- **WHEN** visitor without Super Admin session views a folder card
- **THEN** no gear icon is shown

#### Scenario: Super Admin sees folder gear
- **WHEN** Super Admin with active session views a folder card outside layout edit mode
- **THEN** gear icon is visible on the folder card

#### Scenario: Gear hidden during layout edit
- **WHEN** Super Admin enables layout edit mode
- **THEN** folder gear icons are hidden like module gears

### Requirement: Folder gear opens management dialog
Clicking folder gear SHALL open a management dialog without navigating into the folder.

#### Scenario: Gear click does not navigate
- **WHEN** Super Admin clicks gear on a folder card
- **THEN** folder management dialog opens and URL folder context does not change to enter that folder

#### Scenario: Card body still navigates
- **WHEN** Super Admin clicks folder card body outside gear
- **THEN** view navigates into the folder as before

### Requirement: Folder management dialog actions
The folder gear dialog SHALL offer: edit name and card description, move to another folder (tree picker), and delete folder (content policy wizard).

#### Scenario: Edit metadata success
- **WHEN** Super Admin saves new name and description from folder dialog
- **THEN** card title and subtitle update and breadcrumb reflects new name if applicable

#### Scenario: Move via tree picker
- **WHEN** Super Admin selects a valid destination folder and confirms move
- **THEN** folder appears under new parent and is removed from previous parent view

#### Scenario: Delete wizard for non-empty folder
- **WHEN** Super Admin chooses delete on a non-empty folder
- **THEN** UI presents content policy options (move to parent, move to folder, cascade) before calling DELETE API

## MODIFIED Requirements

### Requirement: Gear icon with auth flow
Gear (⚙) icons SHALL be visible on module cards per existing auth rules and on folder cards for Super Admin only. Clicking module gear without auth SHALL prompt for Super Admin login or module password if configured. Clicking folder gear without Super Admin session SHALL not expose folder management.

#### Scenario: Gear without session
- **WHEN** user clicks module gear without any session
- **THEN** system prompts for login or module password (if `managementPasswordHash` is set)

#### Scenario: Super Admin gear click
- **WHEN** Super Admin with active session clicks module gear
- **THEN** full module management dialog opens immediately

#### Scenario: Folder gear requires Super Admin
- **WHEN** non-Super-Admin user views a folder card
- **THEN** folder gear is not displayed and no folder management dialog is available
