# admin-frontend Specification

## Purpose
TBD - created by archiving change modulehub-cms-v1. Update Purpose after archive.
## Requirements
### Requirement: RTL and theme support
The frontend SHALL support RTL layout and dark/light theme toggle matching `docs/archive/demo-design/Demo designe/index.html`.

#### Scenario: Theme toggle
- **WHEN** user clicks the theme toggle button
- **THEN** the page switches between light and dark CSS variables and persists preference in localStorage

### Requirement: Super Admin controls visibility
The add card (+) SHALL be visible only when a valid Super Admin session exists.

#### Scenario: No Super Admin session
- **WHEN** user visits home page without Super Admin session
- **THEN** add card (+) is not displayed

#### Scenario: Super Admin logged in
- **WHEN** Super Admin has active session
- **THEN** add card (+) appears at end of grid

### Requirement: Gear icon with auth flow
Gear (⚙) icons SHALL be visible on all module cards. Clicking without auth SHALL prompt for Super Admin login or module password if configured.

#### Scenario: Gear without session
- **WHEN** user clicks gear without any session
- **THEN** system prompts for login or module password (if `managementPasswordHash` is set)

#### Scenario: Super Admin gear click
- **WHEN** Super Admin with active session clicks gear
- **THEN** full management dialog opens immediately

### Requirement: Login page UI
The frontend SHALL provide a login page at `/admin/login` with username and password fields.

#### Scenario: Login form displayed
- **WHEN** unauthenticated user navigates to `/admin/login`
- **THEN** login form is displayed with submit to POST `/admin/login`

### Requirement: Backend API integration
The frontend SHALL NOT use in-memory local data stores for production layout or module state. All layout and admin actions MUST use fetch calls to backend APIs with session cookies and CSRF tokens.

#### Scenario: Layout loaded from API
- **WHEN** home page loads
- **THEN** frontend fetches layout from `GET /api/layout` and renders cards from the response

#### Scenario: Admin actions via API
- **WHEN** authenticated user performs start, stop, upload, folder create, or settings save
- **THEN** frontend calls the corresponding backend endpoint with CSRF token and refreshes UI from server state

### Requirement: Add card menu options
The add card (+) menu SHALL offer at least «پوشه جدید» and «آپلود ZIP» options for Super Admin users.

#### Scenario: Add menu displayed
- **WHEN** Super Admin clicks the add card (+)
- **THEN** a menu appears with «پوشه جدید» and «آپلود ZIP» options

### Requirement: SweetAlert2 dialogs
Module configuration dialogs SHALL use SweetAlert2 matching `docs/archive/demo-design/Demo designe/dialog.js` patterns, including module password prompt for Module Manager.

#### Scenario: Module password prompt
- **WHEN** user without Super Admin session clicks gear on a module with `managementPasswordHash` set
- **THEN** SweetAlert password prompt is shown before management actions

### Requirement: Landing header integration
The page SHALL include the unified header from Demo designe with site branding and feature chips.

#### Scenario: Header displayed
- **WHEN** home page loads
- **THEN** gradient header with site title and IoT/CMS branding is visible

