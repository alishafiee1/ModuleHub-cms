# Card Canvas — Smoke Checklist

Manual checks after card-canvas changes:

1. **Empty root folder** — show message; resize window; old cards must not reappear.
2. **Canvas height drag** — edit mode; drag bottom handle; cards reposition without DOM flicker.
3. **Overlap reject** — fill grid; drop card on occupied cell; toast + revert to last valid position.
4. **Subfolder back card** — legacy node without `cardGrid` places at col ≥ 7, not under back card.
5. **Background URL with `&`** — save/load image background with query string in URL.
6. **Per-device layout (E2E-DCL-01)** — edit PC + mobile layouts; resize to 390px; mobile layout shown (not desktop scaled). ✅ automated
7. **Device toolbar** — edit mode shows PC/Tablet/Mobile; switch flushes save; each device keeps separate grid. ✅ automated (partial)
8. **Legacy JSON derive (E2E-DCL-02)** — site-layout with only `cardGrid`; reload; `cardGridTablet`/`cardGridMobile` appear in JSON after first read. ✅ automated (+ E2E-DCL-02b idempotent)
9. **Full canvas corners** — tablet ~854px (or 900px): drag card to leftmost and rightmost columns; card stays inside `#cardCanvas` (no dead zone). ✅ automated (corner-coverage)
10. **Mobile 390px** — all 30 columns reachable in edit mode. (manual drag in edit)
11. **Desktop 1280px** — grid fills up to 1200px inner width with shell margin. ✅ automated (E2E-DCL-05)
12. **Exit edit without hard refresh** — end edit → layout visible immediately; PATCH shows correct breakpoint field in Network tab. ✅ automated (E2E-DCL-03)

Run automated tests: `npm test` · `npm run test:e2e` (requires `MODULEHUB_DEV_SUPER_ADMIN=1` — set by Playwright config)
