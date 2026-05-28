## ADDED Requirements

### Requirement: RTL and theme support
The frontend SHALL support RTL layout and dark/light theme toggle matching `docs/Demo designe/index.html`.

#### Scenario: Theme toggle
- **WHEN** user clicks the theme toggle button
- **THEN** the page switches between light and dark CSS variables and persists preference in localStorage

### Requirement: Admin-only controls
The add card (+) and gear (⚙) icons SHALL be visible only when admin mode is active.

#### Scenario: Non-admin view
- **WHEN** a regular user visits the home page
- **THEN** no add card and no gear icons are displayed

#### Scenario: Admin view
- **WHEN** admin accesses from LAN with admin mode enabled
- **THEN** add card appears at end of grid and gear icon appears on each module card

### Requirement: SweetAlert2 dialogs
Module configuration dialogs SHALL use SweetAlert2 matching `docs/Demo designe/dialog.js` patterns.

#### Scenario: Resource dialog opens
- **WHEN** admin clicks gear on a module card
- **THEN** a modal opens with resource sliders, icon picker, and thumbnail upload

### Requirement: Landing header integration
The page SHALL include the unified header from Demo designe with site branding and feature chips.

#### Scenario: Header displayed
- **WHEN** home page loads
- **THEN** gradient header with site title and IoT/CMS branding is visible
