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
cd ~/ModuleHub-cms && bash scripts/run-with-free-wan.sh git pull origin main
bash scripts/install-to-opt.sh
cd /opt/modulehub-cms && bash scripts/deploy-on-server.sh --skip-pull
curl -sf http://127.0.0.1:4000/health
```

- [docs/server-scripts.md](docs/server-scripts.md) — اسکریپت‌ها
- [docs/deploy-notes-for-ai.md](docs/deploy-notes-for-ai.md) — خلاصه برای AI
- [docs/AI-common-mistakes/](docs/AI-common-mistakes/readme.md) — خطاهای ثبت‌شده deploy
- [docs/session-walkthrough.md](docs/session-walkthrough.md) — گزارش جلسات (عامیانه)

**Cursor:** `/sync-docs` — بروزرسانی docs بعد از کار

## Docs

- [docs/proposal.md](docs/proposal.md) — overview
- [docs/design plan.md](docs/design%20plan.md) — architecture
- [openspec/changes/modulehub-cms-v1/](openspec/changes/modulehub-cms-v1/) — implementation tasks
