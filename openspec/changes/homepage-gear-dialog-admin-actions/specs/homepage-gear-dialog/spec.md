## ADDED Requirements

### Requirement: Gear icon on module cards

When global admin session matches module role, homepage cards SHALL display a gear control separate from the card navigation link.

#### Scenario: Visitor view

- **WHEN** unauthenticated user loads homepage
- **THEN** gear icons SHALL NOT be present

#### Scenario: Admin view

- **WHEN** authenticated admin with role loads homepage
- **THEN** standalone module cards SHALL include gear control

### Requirement: Gear modal actions

Clicking gear SHALL open modal with Start, Stop, Logs, Settings, Delete, and live stats.

#### Scenario: Start from modal

- **WHEN** admin clicks Start in modal
- **THEN** system SHALL call existing start API and update status dot

#### Scenario: Settings from modal

- **WHEN** admin clicks Settings
- **THEN** settings form SHALL open (inline or navigate) using settings API
