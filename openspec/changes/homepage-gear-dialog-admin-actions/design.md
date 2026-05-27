## Context

Partial admin UX exists on homepage inline buttons. Product requires ⚙ modal (`docs/proposal.md`).

## Goals / Non-Goals

**Goals:**
- Gear on cards (admin only in this phase)
- Modal with stats, Start/Stop, Settings, Delete, Logs
- Stubs for Git/partial ZIP until P3

**Non-Goals:**
- Module password gate (P4)

## Decisions

### 1. Markup

Each module card: `.card-gear` button `position:absolute` top-left; `event.stopPropagation()`.

### 2. Modal sections

| Tab | Action |
|-----|--------|
| Status | Docker stats poll every 5s |
| Control | Start / Stop |
| Settings | `window.location` or fetch settings form |
| Logs | fetch `/api/modules/:id/logs` |
| Advanced | Git / Partial ZIP disabled with tooltip "Coming in P3" |

### 3. CSS

Reuse homepage RTL; modal overlay z-index above cards.

## Testing Strategy

- Unit: renderHomepage includes `.card-gear` when admin session mock
- Integration: gear absent for anonymous GET /
