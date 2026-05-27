## ADDED Requirements

### Requirement: Browse route for virtual folders

The system SHALL expose `GET /browse/<folder-id-path>/` where path segments are folder ids from root to target.

#### Scenario: Browse child folder

- **WHEN** visitor requests `/browse/portfolio/`
- **THEN** response SHALL be 200 HTML listing folder cards, module cards, and breadcrumb

#### Scenario: Unknown folder

- **WHEN** path contains invalid folder id
- **THEN** response SHALL be 404

### Requirement: Breadcrumb navigation

The homepage renderer SHALL display breadcrumb from root to current folder using folder titles.

#### Scenario: Deep folder breadcrumb

- **WHEN** current folder is nested three levels
- **THEN** breadcrumb SHALL show three links plus home

### Requirement: Folder navigation cards

Items with `kind: folder` SHALL render as cards linking to child folder browse URL.

#### Scenario: Click folder card

- **WHEN** user clicks folder card
- **THEN** browser navigates to `/browse/<folder-id>/`
