#!/usr/bin/env bash
# purpose --- One-shot fix: pull, CRLF strip, build, opt sync, systemd, health ------
set -euo pipefail

source "${HOME}/.nvm/nvm.sh"
nvm use 20

APP_HOME="${MODULEHUB_SOURCE:-${HOME}/ModuleHub-cms}"
cd "${APP_HOME}"

rm -f docs/server-scripts.md "docs/user rolls.md" scripts/install-to-opt.sh 2>/dev/null || true
git checkout -- README.md docs/dev-workflow.md scripts/ 2>/dev/null || true
git pull origin main

for shell_script in scripts/*.sh; do
  sed -i 's/\r$//' "${shell_script}"
done

bash scripts/setup-server-dirs.sh
npm ci
npm run build
bash scripts/install-to-opt.sh

cd /opt/modulehub-cms
for shell_script in scripts/*.sh; do
  sed -i 's/\r$//' "${shell_script}"
done

if [[ ! -f .env ]]; then
  cp "${APP_HOME}/.env" .env 2>/dev/null || cp .env.example .env
fi

bash scripts/install-systemd.sh
sudo systemctl daemon-reload
sudo systemctl restart modulehub-cms
sleep 2
curl -sf http://127.0.0.1:4000/health
echo ""
ss -tlnp | grep 4000 || true
