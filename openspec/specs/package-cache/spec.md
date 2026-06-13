# package-cache Specification

## Purpose
TBD - created by archiving change modulehub-cms-v1. Update Purpose after archive.
## Requirements
### Requirement: Dependency file detection
On module install, the system SHALL scan for `package.json`, `requirements.txt`, and `composer.json` in the module directory.

#### Scenario: Node dependencies detected
- **WHEN** extracted module contains `package.json`
- **THEN** system identifies it as a Node.js dependency source

### Requirement: Hash-based cache lookup
The system SHALL compute SHA256 hash of dependency manifest content and check `/var/cache/modulehub/pkg/<hash>/`.

#### Scenario: Cache hit
- **WHEN** hash directory exists in package cache
- **THEN** system creates symlink from module's `node_modules` or `venv` to cached directory without re-installing

#### Scenario: Cache miss
- **WHEN** hash directory does not exist
- **THEN** system runs install command (`npm install` or `pip install -r requirements.txt`) and stores result in cache

### Requirement: Cache size limit
Package cache SHALL respect `maxPackageCacheGb` from system settings (default 5 GB) with LRU eviction.

#### Scenario: Cache eviction
- **WHEN** cache exceeds `maxPackageCacheGb`
- **THEN** oldest cache entries are removed until under limit

