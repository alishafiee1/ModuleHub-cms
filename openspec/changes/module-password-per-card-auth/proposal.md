## Why

Site owners want **per-module managers** (e.g. gallery editor) who can update content via gear/Git without global `/admin` login (`docs/design.md` P4). Requires `modulePasswordHash` on manifest, rate-limited verification, and session scoped to one module.

## What Changes

- Add `modulePasswordHash` to manifest (bcrypt); set via settings form
- `POST /api/modules/:id/unlock` — verify password; issue module-scoped session cookie/token
- Gear dialog: if hash set, prompt password before actions; else require global admin session
- Rate limit unlock attempts (e.g. 5/min per module IP)
- Module-scoped auth allows: settings (limited fields), git-pull, partial-upload, instance content admin — NOT global module list or other modules
- Global admin session bypasses module password

## Capabilities

### New Capabilities

- `module-password-auth`: Hash storage, unlock API, scoped session, rate limit

### Modified Capabilities

- `homepage-gear-dialog`: Password gate
- `module-settings-form`: Set/clear module password
- `github-module-sync`: Accept module-scoped auth
- `partial-zip-update`: Accept module-scoped auth
- `role-access-control`: Extend with module-scoped permission checks

## Impact

- **Security**: Critical — hash only, rate limit, no password in logs
- **Tests**: Unlock success/fail, rate limit, scoped API 403 for other modules, admin bypass
- **Depends on**: P2b settings, P2c gear, P3 git/partial for full value
