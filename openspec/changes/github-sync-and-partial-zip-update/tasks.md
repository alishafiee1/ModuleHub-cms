## 1. GitHub manifest and settings

- [ ] 1.1 Validate `manifest.github.repo` URL in manifest validator
- [ ] 1.2 Persist github fields via settings PUT (P2b)

## 2. Git pull service

- [ ] 2.1 Implement `GitSyncService.pull(moduleId)` using child_process
- [ ] 2.2 Define protected dirs in template config
- [ ] 2.3 Add `POST /api/modules/:id/git-pull` (auth)
- [ ] 2.4 Write Jest tests with mocked exec: success, git missing, protected dirs

## 3. Partial ZIP

- [ ] 3.1 Implement `PartialUploadService.applyZip(moduleId, buffer)`
- [ ] 3.2 Reuse `path-safety.ts` checks
- [ ] 3.3 Add `POST /api/modules/:id/partial-upload` multipart handler
- [ ] 3.4 Write Jest tests: traversal reject, single file replace

## 4. Gear integration

- [ ] 4.1 Enable Git pull and partial ZIP buttons in gear modal
- [ ] 4.2 Add confirmation before pull

## 5. Documentation

- [ ] 5.1 Document git prerequisite in `docs/ubuntu-deployment.md`
- [ ] 5.2 Document merge/protected dirs in `docs/design.md` risks section

## Dependencies

- Requires: P2b settings, P2c gear dialog
