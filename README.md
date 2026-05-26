# ModuleHub CMS

Modular CMS with static and Docker standalone modules — **Ubuntu Server 22.04/24.04 LTS**.

## Features

- ZIP module upload with `manifest.json` validation
- Static modules served at `/modules/<id>/`
- Standalone modules in isolated Docker containers
- Dynamic reverse proxy routing
- Admin dashboard with Start/Stop/Logs and resource tooltips
- Role-based module access

## Quick Start (Ubuntu)

```bash
git clone https://github.com/alishafiee1/moduleHub-cms
cd moduleHub-cms
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:4000/admin` — default password from `.env`.

## Production

```bash
sudo bash scripts/ubuntu-install.sh
npm ci && npm run build
sudo cp config/systemd/modulehub-cms.service /etc/systemd/system/
sudo systemctl enable --now modulehub-cms
```

See [docs/ubuntu-deployment.md](docs/ubuntu-deployment.md).

## Development on Windows

Use **WSL2** or SSH to an Ubuntu server. Production target is Ubuntu only.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run production build |
| `npm test` | Jest unit tests |
| `npm run lint` | ESLint |

## Sample Modules

- `static-modules/sample-gallery/` — static HTML gallery
- `standalone-modules/demo-api/` — Node.js API in Docker

## OpenSpec

Implementation tracked in `openspec/changes/modulehub-cms-initial-core/`.
