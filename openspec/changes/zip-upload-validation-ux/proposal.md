## Why

ZIP uploads like `thankio.zip` often pack files inside a subfolder; generic `manifest.json not found` is confusing.

## What Changes

- `zip-manifest-analysis.ts` detects nested manifest paths
- Clear error: re-pack so `manifest.json` and `index.html` are at ZIP root

## Impact

- Better admin UX; no behavior change for correctly structured ZIPs
