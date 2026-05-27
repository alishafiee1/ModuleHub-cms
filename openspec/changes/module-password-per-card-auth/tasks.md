## 1. Password storage

- [x] 1.1 Add `modulePasswordHash` to manifest schema (optional)
- [x] 1.2 Settings form: set/clear password (hash with bcrypt on PUT)
- [x] 1.3 GET settings returns `hasModulePassword` boolean only
- [x] 1.4 Write Jest tests: hash stored, plaintext never persisted

## 2. Unlock API

- [x] 2.1 Add `POST /api/modules/:id/unlock` with password body
- [x] 2.2 Issue signed module-scoped cookie
- [x] 2.3 Implement rate limiter (5 failures / 15 min)
- [x] 2.4 Write Jest tests: success cookie, wrong password, 429 rate limit

## 3. Authorization

- [x] 3.1 Extend `canManageModule()` for module-scoped session
- [x] 3.2 Apply to gear APIs: start/stop/settings/git/partial allowed; delete denied
- [x] 3.3 Global admin bypass unchanged
- [x] 3.4 Write Jest tests: cross-module 403, admin bypass, scoped start OK

## 4. Gear UI

- [x] 4.1 Prompt password on gear click when hash set and no module session
- [x] 4.2 Skip global admin login when module unlock valid

## 5. Security review

- [x] 5.1 Ensure no password in logs
- [x] 5.2 Document threat model in change design.md

## Dependencies

- Requires: P2b settings, P2c gear, P3 for full scoped git/partial
