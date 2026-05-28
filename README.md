# ModuleHub CMS

Modular CMS for [haderbash.ir](https://haderbash.ir) — add site modules via ZIP upload without changing core code.

## Quick start (local)

```bash
npm install
npm run build
# Until phase 8 auth: enable admin UI locally
set MODULEHUB_DEV_SUPER_ADMIN=1   # Windows CMD
npm run dev
curl http://127.0.0.1:4000/health
```

**Phase 2:** `POST /admin/upload`, `POST /admin/wizard/save`, `POST /admin/folder` — ZIP wizard + virtual folders.

**Phase 3:** `POST /admin/module/:id/start|stop`, `GET /modules/<id>/` — Static/SPA serve + backend proxy (systemd-run / Docker).

**Phase 4:** After ZIP upload — dependency cache at `/var/cache/modulehub/pkg/<hash>/` (SHA256 manifest, symlink, LRU). Smoke: `bash scripts/test-package-cache-manual.sh` on server.

**Phase 6:** Full backup/restore — `POST /admin/backup`, `POST /admin/restore` (no UI yet; per-module ZIP in ⚙). See `docs/developer-guide.md` §9.1.

**Phase 7.5:** Super Admin settings — `GET /admin/settings`, `GET/POST /admin/settings/data|settings` — upload limits, port range, defaults, auth TTL fields (consumed in phase 8).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server with reload |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Production server |
| `npm test` | Jest unit tests |
| `npm run lint` | ESLint |

## Server deploy

**مرجع:** [docs/dev-workflow.md](docs/dev-workflow.md) (لوکال + سرور + بازیابی)

```bash
source ~/.nvm/nvm.sh && nvm use 20
bash ~/ModuleHub-cms/scripts/deploy-full.sh
```

Manual steps: [docs/dev-workflow.md](docs/dev-workflow.md) §۲

- [docs/server-scripts.md](docs/server-scripts.md) — اسکریپت‌ها
- [docs/other docs/deploy-notes-for-ai.md](docs/other%20docs/deploy-notes-for-ai.md) — خلاصه برای AI
- [docs/AI-common-mistakes/](docs/AI-common-mistakes/readme.md) — خطاهای ثبت‌شده deploy
- [docs/session-walkthrough.md](docs/session-walkthrough.md) — گزارش جلسات (عامیانه)

**Cursor:** `/sync-docs` — بروزرسانی docs بعد از کار

## Docs

- [docs/proposal.md](docs/proposal.md) — overview
- [docs/design plan.md](docs/design%20plan.md) — architecture
- [openspec/changes/modulehub-cms-v1/](openspec/changes/modulehub-cms-v1/) — implementation tasks
