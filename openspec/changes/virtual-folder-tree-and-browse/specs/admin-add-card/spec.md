## ADDED Requirements

### Requirement: Admin Add card tile

When admin session is active, the system SHALL render an Add card (`kind: admin-add`) as the last tile in the grid for the current folder.

#### Scenario: Anonymous visitor

- **WHEN** unauthenticated user views browse page
- **THEN** Add card SHALL NOT appear in HTML

#### Scenario: Admin at folder end

- **WHEN** authenticated admin views folder with modules
- **THEN** Add card SHALL appear after highest sortOrder module cards

### Requirement: Add modal entry points

Clicking Add card SHALL open modal with options: New folder, Upload ZIP, From catalog.

#### Scenario: New folder

- **WHEN** admin selects New folder and submits title
- **THEN** system SHALL append folder with `parentId` equal current folder id

#### Scenario: Upload ZIP stub

- **WHEN** admin selects Upload ZIP before P2 wiring
- **THEN** modal SHALL redirect to `/admin` upload or show existing upload flow

#### Scenario: From catalog stub

- **WHEN** admin selects From catalog before catalog change
- **THEN** modal SHALL show message that catalog is not yet enabled
