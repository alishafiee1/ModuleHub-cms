## Context

P3 deliverables in `docs/design.md`: GitHub sync + partial ZIP from gear dialog.

## Goals / Non-Goals

**Goals:**
- git pull into instance dir
- partial ZIP with path allowlist
- Preserve user content dirs

**Non-Goals:**
- Bi-directional git push
- Merge conflict UI (fail with log)

## Decisions

### 1. Git pull

Spawn `git clone` or `git pull` in instance dir when `.git` exists. Branch from `manifest.github.branch`.

Protected dirs (never delete on pull): `images/`, `markdown/`, `uploads/`

### 2. Partial ZIP

Same path-safety as full install; max 50 files per request; optional `paths` filter in manifest sidecar.

### 3. Auth

Global admin or module-scoped session (when P4 merged).

## Risks

- git not installed on host → clear error
- pull overwrites local → confirm dialog in UI

## Testing Strategy

- Mock `child_process.exec` for git
- partial ZIP traversal rejected
- protected dirs untouched (unit with temp dirs)
