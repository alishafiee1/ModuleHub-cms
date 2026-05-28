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

See [docs/dev-workflow.md](docs/dev-workflow.md) and `scripts/deploy-on-server.sh`.

## Docs

- [docs/proposal.md](docs/proposal.md) — overview
- [docs/design plan.md](docs/design%20plan.md) — architecture
- [openspec/changes/modulehub-cms-v1/](openspec/changes/modulehub-cms-v1/) — implementation tasks
