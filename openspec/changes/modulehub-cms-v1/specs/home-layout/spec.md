## ADDED Requirements

### Requirement: Site layout JSON schema
The system SHALL store folder tree and module metadata in `storage/site-layout.json` following the schema in `docs/site-layout.json`.

#### Scenario: Layout file loaded
- **WHEN** CMS starts
- **THEN** it reads `storage/site-layout.json` and parses `tree` and `modules` objects

### Requirement: Virtual folders
Folders SHALL exist only in JSON — no physical directory is created on the server for virtual folders.

#### Scenario: Folder navigation
- **WHEN** user clicks a folder card
- **THEN** the view shows only children of that folder and breadcrumb updates

### Requirement: Breadcrumb navigation
The home page SHALL display a breadcrumb trail from root to current folder, clickable for navigation.

#### Scenario: Breadcrumb click
- **WHEN** user clicks a breadcrumb item for a folder
- **THEN** the view navigates to that folder and re-renders cards

### Requirement: Module cards from JSON
Each module in the current folder SHALL render as a card with name, icon, thumbnail, and status badge.

#### Scenario: Cards rendered
- **WHEN** home page loads with valid layout JSON
- **THEN** cards for all children of current folder are displayed with correct status colors (running=green, stopped=gray, crashed=red)
