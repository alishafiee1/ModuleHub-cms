## 1. Password storage

- [ ] 1.1 Add `modulePasswordHash` to manifest schema (optional)
- [ ] 1.2 Settings form: set/clear password (hash with bcrypt on PUT)
- [ ] 1.3 GET settings returns `hasModulePassword` boolean only
- [ ] 1.4 Write Jest tests: hash stored, plaintext never persisted

## 2. Unlock API

- [ ] 2.1 Add `POST /api/modules/:id/unlock` with password body
- [ ] 2.2 Issue signed module-scoped cookie
- [ ] 2.3 Implement rate limiter (5 failures / 15 min)
- [ ] 2.4 Write Jest tests: success cookie, wrong password, 429 rate limit

## 3. Authorization

- [ ] 3.1 Extend `canManageModule()` for module-scoped session
- [ ] 3.2 Apply to gear APIs: start/stop/settings/git/partial allowed; delete denied
- [ ] 3.3 Global admin bypass unchanged
- [ ] 3.4 Write Jest tests: cross-module 403, admin bypass, scoped start OK

## 4. Gear UI

- [ ] 4.1 Prompt password on gear click when hash set and no module session
- [ ] 4.2 Skip global admin login when module unlock valid

## 5. Security review

- [ ] 5.1 Ensure no password in logs
- [ ] 5.2 Document threat model in change design.md

## Dependencies

- Requires: P2b settings, P2c gear, P3 for full scoped git/partial
