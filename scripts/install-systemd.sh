#!/usr/bin/env bash
# purpose --- Install systemd unit using actual app directory (opt or home) ------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${MODULEHUB_APP_DIR:-$(cd "${SCRIPT_DIR}/.." && pwd)}"
SERVICE_NAME="${MODULEHUB_SERVICE:-modulehub-cms}"
SYSTEMD_DEST="/etc/systemd/system/${SERVICE_NAME}.service"
GENERATED_UNIT="$(mktemp)"

log() {
  printf '[install-systemd] %s\n' "$*"
}

usage() {
  cat <<EOF
Usage: bash scripts/install-systemd.sh

Installs systemd unit for ModuleHub CMS at:
  APP_DIR=${APP_DIR}

Override:
  MODULEHUB_APP_DIR=/path/to/repo bash scripts/install-systemd.sh
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ ! -f "${APP_DIR}/dist/core/src/server/index.js" ]]; then
  echo "[install-systemd] ERROR: build missing. Run: cd ${APP_DIR} && npm ci && npm run build" >&2
  exit 1
fi

if [[ ! -f "${APP_DIR}/.env" ]]; then
  echo "[install-systemd] WARN: ${APP_DIR}/.env missing — copy from .env.example" >&2
fi

log "APP_DIR=${APP_DIR}"

cat > "${GENERATED_UNIT}" <<EOF
[Unit]
Description=ModuleHub CMS — Modular Docker CMS
After=network.target docker.service

[Service]
Type=simple
User=ash
Group=ash
WorkingDirectory=${APP_DIR}
EnvironmentFile=${APP_DIR}/.env
ExecStart=/usr/bin/node ${APP_DIR}/dist/core/src/server/index.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

log "Installing unit to ${SYSTEMD_DEST}..."
sudo cp "${GENERATED_UNIT}" "${SYSTEMD_DEST}"
rm -f "${GENERATED_UNIT}"
sudo systemctl daemon-reload
sudo systemctl enable "${SERVICE_NAME}"
log "Restarting ${SERVICE_NAME}..."
sudo systemctl restart "${SERVICE_NAME}"
sudo systemctl status "${SERVICE_NAME}" --no-pager
