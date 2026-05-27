## 1. Gear UI

- [x] 1.1 Add `.card-gear` button to module cards in `homepage-renderer.ts` (admin only)
- [x] 1.2 Add modal markup + CSS in `homepage.css`
- [x] 1.3 Client JS: open/close modal, stopPropagation on gear click
- [x] 1.4 Write Jest test: gear present with admin session mock, absent anonymous

## 2. Modal actions

- [x] 2.1 Wire Start/Stop to `/api/modules/:id/start|stop`
- [x] 2.2 Wire Logs to `/api/modules/:id/logs` display
- [x] 2.3 Wire stats polling to `/api/modules/:id/stats`
- [x] 2.4 Wire Settings to settings form (P2b API)
- [x] 2.5 Wire Delete with confirm dialog
- [x] 2.6 Disable Git / partial ZIP with "P3" tooltip

## 3. Admin dashboard parity (optional)

- [x] 3.1 Add gear or consolidate tile actions in `dashboard.html`

## 4. Tests

- [x] 4.1 Integration test: authenticated GET / contains gear + modal skeleton
- [x] 4.2 Unit test: modal action handlers call fetch with correct URLs (jsdom)

## Dependencies

- Requires: settings API (P2b) for Settings tab
- Extended by: P3 Git/partial, P4 password gate
