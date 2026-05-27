# ModuleHub CMS

Modular CMS with built-in pages and Docker standalone modules — **Ubuntu Server 22.04/24.04 LTS**.

## Features

- Public homepage at `/` with JSON-driven module cards (RODI Docs card UI)
- Built-in pages at `/pages/<id>/` (gallery, markdown viewer)
- Standalone ZIP upload (`index.html` + Docker) at `/modules/<id>/`
- Dynamic reverse proxy for module API paths
- Admin dashboard at `/admin` with Start/Stop/Logs
- Role-based module access

## Routes

| Path | Description |
|------|-------------|
| `/` | Public homepage (module tiles) |
| `/pages/<id>/` | Built-in core modules |
| `/modules/<id>/` | Standalone module landing + assets |
| `/admin` | System admin (upload, management) |

## Quick Start (Ubuntu)

```bash
git clone https://github.com/alishafiee1/moduleHub-cms
cd moduleHub-cms
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:4000/` — public homepage. Admin: `/admin`.

## Production

```bash
sudo bash scripts/ubuntu-install.sh
npm ci && npm run build
bash scripts/migrate-to-v2.sh
sudo systemctl restart modulehub-cms
```

See [docs/ubuntu-deployment.md](docs/ubuntu-deployment.md).

## Docs

See **[docs/README.md](docs/README.md)** for the full documentation index.

- [proposal.md](docs/proposal.md) — روایت و چشم‌انداز (فارسی)
- [proposal-simple.md](docs/proposal-simple.md) — نسخه ساده
- [design.md](docs/design.md) — معماری فنی و فازبندی
- [standalone-module-guide.md](docs/standalone-module-guide.md) — راهنمای ZIP

Each **Add** (catalog template or ZIP) creates an independent instance under `standalone-modules/<instance-id>/` with entries in `modules.json` and `site-layout.json`.

## Sample Modules

- `core/builtin-modules/sample-gallery/` — built-in gallery
- `core/builtin-modules/markdown-viewer/` — built-in markdown demo
- `standalone-modules/demo-api/` — Node.js API in Docker

## OpenSpec

- Initial core: `openspec/changes/modulehub-cms-initial-core/` (superseded)
- Public homepage v2: `openspec/changes/public-homepage-architecture-v2/` (complete)
- Roadmap P1–P4: see [docs/README.md](docs/README.md#openspec)
