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

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server with reload |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Production server |
| `npm test` | Jest unit tests |
| `npm run lint` | ESLint |

## Server deploy

- [docs/dev-workflow.md](docs/dev-workflow.md) — push و deploy
- [docs/server-scripts.md](docs/server-scripts.md) — اسکریپت‌ها
- [docs/deploy-notes-for-ai.md](docs/deploy-notes-for-ai.md) — نکات استقرار (AI)

```bash
source ~/.nvm/nvm.sh && nvm use 20
cd ~/ModuleHub-cms && bash scripts/run-with-free-wan.sh git pull
bash scripts/install-to-opt.sh
cd /opt/modulehub-cms && bash scripts/deploy-on-server.sh --skip-pull
```

## Docs

- [docs/proposal.md](docs/proposal.md) — overview
- [docs/design plan.md](docs/design%20plan.md) — architecture
- [openspec/changes/modulehub-cms-v1/](openspec/changes/modulehub-cms-v1/) — implementation tasks
