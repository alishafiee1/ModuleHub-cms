## Context

P4: per-module password for gear management without global admin (`docs/design.md` P4).

## Goals / Non-Goals

**Goals:**
- bcrypt hash in manifest
- unlock API + rate limit
- scoped permissions

**Non-Goals:**
- Multi-user OAuth
- Password recovery email

## Decisions

### 1. Storage

`modulePasswordHash` in manifest; never return hash in GET settings (only `hasModulePassword: boolean`).

### 2. Session

Cookie `modulehub_module_<id>` signed with SESSION_SECRET; TTL 8h; contains `{ moduleId, unlockedAt }`.

### 3. Rate limit

In-memory map IP+moduleId; 5 failures / 15 min → 429.

### 4. Authorization matrix

| Action | Global admin | Module unlock |
|--------|--------------|---------------|
| Start/Stop | yes | yes |
| Settings | yes | yes (no global admin fields) |
| git-pull | yes | yes |
| Delete module | yes | no |
| List all modules | yes | no |

## Testing Strategy

- bcrypt verify mock
- rate limit triggers 429
- scoped token cannot delete or access other module
