## ADDED Requirements

### Requirement: Card description on layout nodes
Layout tree nodes for folders and module placements SHALL support optional `cardDescription` (recommended max 200 characters) stored in `site-layout.json`.

#### Scenario: Folder shows description
- **WHEN** a folder node has non-empty `cardDescription`
- **THEN** home canvas renders up to two lines of subtitle text under the folder title

#### Scenario: Empty description hidden
- **WHEN** `cardDescription` is absent or empty
- **THEN** no subtitle line is rendered on the card

### Requirement: Module card subtitle fallback
Module placement nodes SHALL display `cardDescription` when set; otherwise SHALL fall back to `modules[id].changelog` for backward compatibility.

#### Scenario: Legacy changelog visible
- **WHEN** module node has no `cardDescription` but module entry has `changelog`
- **THEN** changelog text appears as the card subtitle

#### Scenario: Card description takes precedence
- **WHEN** module node has both `cardDescription` and `changelog`
- **THEN** only `cardDescription` is shown on the card

### Requirement: Deleted folder navigation recovery
When the current URL references a folder that no longer exists, the system SHALL redirect to the parent folder or home.

#### Scenario: Folder query after delete
- **WHEN** user navigates to `/?folder=<deleted-id>`
- **THEN** client redirects to parent folder id or `/` without a broken empty state

## MODIFIED Requirements

### Requirement: Module cards from JSON
Each module in the current folder SHALL render as a card with name, icon, thumbnail, status badge, and optional subtitle from `cardDescription` or changelog fallback. Each folder SHALL render as a card with folder icon, name, and optional `cardDescription` (no status badge).

#### Scenario: Cards rendered
- **WHEN** home page loads with valid layout JSON
- **THEN** module cards show correct status colors (running=green, stopped=gray, crashed=red) and optional subtitle; folder cards show folder icon and optional subtitle without status badge
