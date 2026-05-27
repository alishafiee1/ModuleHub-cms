## Why

proposal-simple prefers catalog **instances** for gallery/markdown; empty layout bootstrap should not auto-add built-in demos.

## What Changes

- `bootstrapFromModules` skips `builtin` unless `BOOTSTRAP_BUILTIN_LAYOUT=true`
- `.env.example` documents flag
- Optional migration note in `scripts/migrate-builtin-to-catalog-instances.md`

## Impact

- Fresh installs: empty homepage until admin adds catalog/ZIP (unless legacy flag set)
- Existing `site-layout.json` unchanged
