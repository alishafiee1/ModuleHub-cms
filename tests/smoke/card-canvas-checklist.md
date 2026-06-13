# Card Canvas — Smoke Checklist

Manual checks after card-canvas changes:

1. **Empty root folder** — show message; resize window; old cards must not reappear.
2. **Canvas height drag** — edit mode; drag bottom handle; cards reposition without DOM flicker.
3. **Overlap reject** — fill grid; drop card on occupied cell; toast + revert to last valid position.
4. **Subfolder back card** — legacy node without `cardGrid` places at col ≥ 7, not under back card.
5. **Background URL with `&`** — save/load image background with query string in URL.
6. **Per-device layout (E2E-DCL-01)** — edit PC + mobile layouts; resize to 390px; mobile layout shown (not desktop scaled).
7. **Device toolbar** — edit mode shows PC/Tablet/Mobile; switch flushes save; each device keeps separate grid.
8. **Legacy JSON derive (E2E-DCL-02)** — site-layout with only `cardGrid`; reload; `cardGridTablet`/`cardGridMobile` appear in JSON after first read.

Run automated unit tests: `npm test`
