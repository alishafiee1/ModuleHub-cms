# Card Canvas — Smoke Checklist

Manual checks after card-canvas changes:

1. **Empty root folder** — show message; resize window; old cards must not reappear.
2. **Canvas height drag** — edit mode; drag bottom handle; cards reposition without DOM flicker.
3. **Overlap reject** — fill grid; drop card on occupied cell; toast + revert to last valid position.
4. **Subfolder back card** — legacy node without `cardGrid` places at col ≥ 7, not under back card.
5. **Background URL with `&`** — save/load image background with query string in URL.

Run automated unit tests: `npm test`
