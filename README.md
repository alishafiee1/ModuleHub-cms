# ModuleHub CMS

Modular CMS for [haderbash.ir](https://haderbash.ir) — add site modules via ZIP upload without changing core code.

## Quick start (local)

```bash
npm install
npm run build
npm run dev
curl http://127.0.0.1:4000/health
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server with reload |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Production server |
| `npm test` | Jest unit tests |
| `npm run lint` | ESLint |

## Server deploy

- [docs/dev-workflow.md](docs/dev-workflow.md) — workflow روزانه
- [docs/server-scripts.md](docs/server-scripts.md) — خلاصه اسکریپت‌های استقرار

```bash
# Permission denied on ./script.sh? Use bash or chmod:
chmod +x scripts/*.sh
bash scripts/setup-server-dirs.sh

cd ~/ModuleHub-cms   # or /opt/modulehub-cms
npm ci && npm run build
bash scripts/install-systemd.sh
```

## Docs

- [docs/proposal.md](docs/proposal.md) — overview
- [docs/design plan.md](docs/design%20plan.md) — architecture
- [openspec/changes/modulehub-cms-v1/](openspec/changes/modulehub-cms-v1/) — implementation tasks
