# network-install Specification (superseded)

> **Removed (2026):** Server default route is on free internet. Package installs run directly via `runInstallCommand` in `core/src/modules/package-cache/network-install.ts`. `network-metric-toggler.py`, `run-with-free-wan.sh`, and `packageInstallInterface` setting were removed.

## ADDED Requirements

### Requirement: Direct dependency install

The system SHALL run `npm`/`pip`/`composer` install commands in the module working directory without changing OS routing or interface metrics.

#### Scenario: Cache miss on module upload

- **WHEN** a module ZIP contains `package.json` and no cache entry exists for the manifest hash
- **THEN** install runs in `/var/cache/modulehub/pkg/<hash>/` using the server default network route
- **AND** a symlink is created in the module directory

#### Scenario: Install timeout

- **WHEN** install exceeds `dependencyInstallTimeoutSec` from system settings
- **THEN** the process is terminated and upload API reports failure in `dependencies.message`

### Requirement: npm path under systemd

When CMS runs under systemd without nvm in PATH, `resolveNpmExecutablePath()` SHALL locate npm under `~/.nvm/versions/node/` or `MODULEHUB_NPM_PATH`.

#### Scenario: npm resolved from nvm when PATH is empty

- **WHEN** CMS runs under systemd and `npm` is not on PATH
- **THEN** `resolveNpmExecutablePath()` returns a valid npm binary from nvm or `MODULEHUB_NPM_PATH`
