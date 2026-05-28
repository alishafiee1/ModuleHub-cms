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

if [[ ! -d "${TARGET_DIR}" ]]; then
  log "Creating ${TARGET_DIR}..."
  if sudo -n true 2>/dev/null; then
    sudo mkdir -p "${TARGET_DIR}"
    sudo chown "${OWNER}:${OWNER}" "${TARGET_DIR}"
  else
    echo "[install-to-opt] ERROR: ${TARGET_DIR} missing and sudo needs a terminal (run: sudo mkdir -p ${TARGET_DIR} && sudo chown ${OWNER}:${OWNER} ${TARGET_DIR})" >&2
    exit 1
  fi
elif [[ ! -w "${TARGET_DIR}" ]]; then
  log "Fixing ownership on ${TARGET_DIR}..."
  sudo chown "${OWNER}:${OWNER}" "${TARGET_DIR}"
fi

log "Syncing ${SOURCE_DIR} -> ${TARGET_DIR} (rsync)..."
rsync -a --delete \
  --exclude node_modules \
  --exclude .git \
  --exclude storage/logs \
  --exclude storage/backups \
  --exclude standalone-modules \
  "${SOURCE_DIR}/" "${TARGET_DIR}/"

log "Installing production dependencies in ${TARGET_DIR}..."
(
  cd "${TARGET_DIR}"
  if [[ -f package-lock.json ]]; then
    npm ci --omit=dev
  else
    npm install --omit=dev
  fi
)

log "Done. Next:"
echo "  cd ${TARGET_DIR}"
echo "  bash scripts/install-systemd.sh"
echo "  sudo systemctl restart modulehub-cms"
