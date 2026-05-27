## Why

`modules.json` was loaded with `JSON.parse` only; drift from schema caused silent bugs. `site-layout.json` already uses Zod.

## What Changes

- `ModuleEntrySchema` + `ModuleRegistrySchema` in `types.ts`
- Validate on registry `load()`; log and keep empty on failure

## Impact

- Invalid registry files ignored at startup (logged) — safer than partial load
