# ModuleHub CMS

Modular CMS — add site modules via ZIP upload without changing core code.

## Quick start (local)

```bash
npm install
npm run build
cp .env.example .env   # set SESSION_SECRET and ADMIN_PASSWORD_HASH
# Until phase 8 auth: enable admin UI locally
set MODULEHUB_DEV_SUPER_ADMIN=1   # Windows CMD
npm run dev
curl http://127.0.0.1:4000/health
```

**Phase 2:** `POST /admin/upload`, `POST /admin/wizard/save`, `POST /admin/folder` — ZIP wizard + virtual folders.

**Phase 3:** `POST /admin/module/:id/start|stop`, `GET /modules/<id>/` — Static/SPA serve + backend proxy (systemd-run / Docker).

**Phase 4:** After ZIP upload — dependency cache at `/var/cache/modulehub/pkg/<hash>/` (SHA256 manifest, symlink, LRU). Smoke: `bash scripts/smoke/test-package-cache.sh` on server.

**Phase 6:** Full backup/restore — API + UI in `/admin/settings` (backup card); per-module ZIP in ⚙. See `docs/backup-restore.md` and `docs/developer-guide.md` §9.1.

**Phase 7.5:** Super Admin settings — card-based UI at `/admin/settings`. See `docs/developer-guide.md` §9.

**Phase 7.6 (2026-06):** Home card canvas — `cardGrid` layout, drag/resize editor, folder navigation, floating background. See `docs/UI-behavior.md` and `public/js/card-canvas/`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server with reload |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Production server |
| `npm test` | Jest unit tests |
| `npm run lint` | ESLint |

## Server deploy

**Reference:** [docs/deploy-guide.md](docs/deploy-guide.md)

```bash
source ~/.nvm/nvm.sh && nvm use 20
bash ~/ModuleHub-cms/scripts/deploy-full.sh
```

`.gitattributes` keeps `*.sh` as LF for Linux deploy.

- [docs/server-scripts.md](docs/server-scripts.md) — scripts
- [docs/other docs/deploy-notes-for-ai.md](docs/other%20docs/deploy-notes-for-ai.md) — AI deploy summary
- [docs/AI-common-mistakes/](docs/AI-common-mistakes/readme.md) — logged deploy mistakes
- [docs/session-walkthrough.md](docs/session-walkthrough.md) — session notes

**Cursor:** `/sync-docs` — update docs after work

## Docs

- [docs/proposal.md](docs/proposal.md) — overview
- [docs/design plan.md](docs/design%20plan.md) — architecture
- [openspec/changes/modulehub-cms-v1/](openspec/changes/modulehub-cms-v1/) — implementation tasks
