## ADDED Requirements

### Requirement: Temporary metric toggle
The `network-metric-toggler.py` script SHALL temporarily lower metric of the selected interface for outbound traffic during package install operations.

#### Scenario: Metric toggled for npm install
- **WHEN** CMS installs npm dependencies for a module
- **THEN** toggler switches default route to `packageInstallInterface`, runs install, then restores original metric

### Requirement: Metric restore guarantee
After install completes or fails, the system MUST restore the original network metric regardless of install outcome.

#### Scenario: Restore after failure
- **WHEN** npm install fails with network error
- **THEN** metric is restored to pre-install state and failure is logged

### Requirement: Interface from settings
Package install operations SHALL use `packageInstallInterface` from `system-settings.json` (default `enp63s0`).

#### Scenario: Settings interface used
- **WHEN** admin sets `packageInstallInterface` to `enp63s0`
- **THEN** all dependency installs route through that interface

### Requirement: CLI toggler tool
The script SHALL be invocable standalone: `python scripts/network-metric-toggler.py --interface enp63s0 --command "npm install"`.

#### Scenario: Standalone toggler
- **WHEN** operator runs toggler with a command
- **THEN** command executes with temporary free internet route and metric is restored after

### Requirement: No permanent route change
The CMS and toggler SHALL NOT permanently modify Ubuntu default route or netplan configuration.

#### Scenario: Route unchanged after install
- **WHEN** package install completes
- **THEN** `ip route show default` matches pre-install state
