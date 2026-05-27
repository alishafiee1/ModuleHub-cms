## Why

Managers need to **pull latest code/content from GitHub** and apply **partial ZIP updates** without re-uploading full modules (`docs/design.md` P3). Manifest already documents optional `github` (planned). Instance dirs (catalog copies) may hold user uploads that must not be blindly overwritten.

## What Changes

- Add `manifest.github: { repo, branch }` to schema and settings form
- `POST /api/modules/:id/git-pull` — clone/fetch + merge into instance dir (auth: admin role or module password when P4 done)
- `POST /api/modules/:id/partial-upload` — ZIP with path allowlist; reject traversal
- Document merge strategy: preserve `images/`, `markdown/` user dirs via `.gitignore` patterns in templates
- Gear dialog: enable Git pull and partial ZIP actions
- Audit log entry on pull/upload (logger)

## Capabilities

### New Capabilities

- `github-module-sync`: Git pull service, safe paths, error surfacing
- `partial-zip-update`: Selective file replace from ZIP

### Modified Capabilities

- `module-settings-form`: Persist github fields
- `manifest-validation`: Validate github repo URL format
- `homepage-gear-dialog`: Enable Git and partial ZIP buttons
- `module-installation`: Partial update path separate from full install

## Impact

- **Runtime**: Requires `git` on Ubuntu host for pull
- **Risk**: Overwrite user content — mitigated by ignore rules + confirmation prompt
- **Tests**: Mock git; partial ZIP path safety; pull skipped dirs; auth required
- **Depends on**: P2b settings, P2c gear dialog
