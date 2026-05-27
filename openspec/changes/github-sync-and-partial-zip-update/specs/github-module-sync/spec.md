## ADDED Requirements

### Requirement: Git pull from GitHub

The system SHALL expose `POST /api/modules/:id/git-pull` when `manifest.github.repo` is set.

#### Scenario: Successful pull

- **WHEN** admin triggers pull and git is available
- **THEN** instance directory SHALL update from remote branch

#### Scenario: Git not installed

- **WHEN** git binary missing on host
- **THEN** response SHALL be 503 with install instructions

### Requirement: Protected user content on pull

Git pull SHALL NOT delete directories listed in template protected paths (`images/`, `markdown/`, `uploads/`).

#### Scenario: Local uploads preserved

- **WHEN** pull runs and local images exist
- **THEN** those files SHALL remain unless explicitly overwritten by tracked files
