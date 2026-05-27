## Why

Admin controls today are **inline** on homepage tiles and admin dashboard tiles (Start/Stop/Logs). Product docs (`docs/proposal.md`) promise a **gear (⚙)** on each card opening a unified dialog: stats, settings, Start/Stop, delete, and hooks for Git/partial ZIP. A modal consolidates management without cluttering the card face for visitors.

## What Changes

- Add ⚙ icon on module cards (admin session or future module password)
- Modal dialog: live Docker stats, Start/Stop, link/open Settings (uses settings API from P2b), Delete, Logs viewer
- Stop click propagation on gear (card link still navigates content)
- Placeholder actions for Git pull and partial ZIP (disabled until P3)
- Reduce duplicate inline button row on homepage when gear is available (optional cleanup)
- Visitor never sees gear

## Capabilities

### New Capabilities

- `homepage-gear-dialog`: UI component, modal, action wiring to existing module APIs

### Modified Capabilities

- `public-homepage`: Card markup includes gear; admin overlay behavior
- `admin-dashboard`: Optional gear parity on admin tiles

## Impact

- **Frontend**: `homepage-renderer.ts`, `homepage.css`, small client JS module
- **APIs**: Reuses existing `/api/modules/:id/start|stop|logs|stats|delete`
- **Tests**: Gear not rendered anonymous; modal actions call APIs (jsdom or integration)
- **Depends on**: P2b settings API for Settings tab; P4 for password-gated gear
