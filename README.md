# ModuleHub CMS

Modular CMS — add site modules via ZIP upload without changing core code.

## Quick start (local)

See [docs/how-to-use.md](docs/how-to-use.md) for full guide.

```bash
npm install
npm run build
cp .env.example .env   # set SESSION_SECRET and ADMIN_PASSWORD_HASH
set MODULEHUB_DEV_SUPER_ADMIN=1   # Windows CMD — dev only
npm run dev
curl http://127.0.0.1:4000/health
```

**Phase 7.6:** Home card canvas — `cardGrid`, drag/resize editor. See [docs/ui-behavior.md](docs/ui-behavior.md).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server with reload |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Production server |
| `npm test` | Jest unit tests |
| `npm run test:e2e` | Playwright E2E (port `4010`) |
| `npm run lint` | ESLint |

## Server deploy

**Reference:** [docs/deploy-guide.md](docs/deploy-guide.md)

```bash
source ~/.nvm/nvm.sh && nvm use 20
bash ~/ModuleHub-cms/scripts/deploy-full.sh
```

- [docs/server-scripts.md](docs/server-scripts.md) — scripts
- [docs-for-ai/map.md](docs-for-ai/map.md) — AI doc entry
- [docs-for-ai/deploy-notes.md](docs-for-ai/deploy-notes.md) — AI deploy summary
- [docs-for-ai/ai-common-mistakes.md](docs-for-ai/ai-common-mistakes.md) — mistake rules

**Cursor:** `/sync-docs` — update docs after work (walkthrough in `docs-personal/`)

## Docs

| Doc | Purpose |
|-----|---------|
| [docs/readme.md](docs/readme.md) | Human doc map (Farsi) |
| [docs/proposal.md](docs/proposal.md) | Why — product story |
| [docs/design.md](docs/design.md) | Architecture |
| [docs/tasks.md](docs/tasks.md) | Phase checklist |
| [openspec/changes/modulehub-cms-v1/](openspec/changes/modulehub-cms-v1/) | OpenSpec tasks + specs |
