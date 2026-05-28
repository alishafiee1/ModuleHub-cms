#!/usr/bin/env bash
# purpose --- Copy home clone to /opt/modulehub-cms with correct ownership ------
set -euo pipefail

SOURCE_DIR="${MODULEHUB_SOURCE:-${HOME}/ModuleHub-cms}"
TARGET_DIR="${MODULEHUB_APP_DIR:-/opt/modulehub-cms}"
OWNER="${MODULEHUB_OWNER:-ash}"

log() {
  printf '[install-to-opt] %s\n' "$*"
}

if [[ ! -d "${SOURCE_DIR}" ]]; then
  echo "[install-to-opt] ERROR: source not found: ${SOURCE_DIR}" >&2
  exit 1
fi

log "Creating ${TARGET_DIR}..."
sudo mkdir -p "${TARGET_DIR}"
sudo chown "${OWNER}:${OWNER}" "${TARGET_DIR}"

log "Syncing ${SOURCE_DIR} -> ${TARGET_DIR} (rsync)..."
rsync -a --delete \
  --exclude node_modules \
  --exclude .git \
  --exclude storage/logs \
  --exclude storage/backups \
  --exclude standalone-modules \
  "${SOURCE_DIR}/" "${TARGET_DIR}/"

log "Done. Next:"
echo "  cd ${TARGET_DIR}"
echo "  npm ci && npm run build"
echo "  cp .env.example .env   # if needed"
echo "  MODULEHUB_APP_DIR=${TARGET_DIR} bash scripts/install-systemd.sh"
