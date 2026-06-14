#!/usr/bin/env bash
# purpose --- Rsync home clone files to /opt (no npm, preserves opt secrets/storage) ------
set -euo pipefail

SOURCE_DIR="${MODULEHUB_SOURCE:-${HOME}/ModuleHub-cms}"
TARGET_DIR="${MODULEHUB_APP_DIR:-/opt/modulehub-cms}"
OWNER="${MODULEHUB_OWNER:-$(whoami)}"

log() {
  printf '[sync-app-to-opt] %s\n' "$*"
}

ensure_target_writable() {
  if [[ ! -d "${TARGET_DIR}" ]]; then
    log "Creating ${TARGET_DIR}..."
    if sudo -n true 2>/dev/null; then
      sudo mkdir -p "${TARGET_DIR}"
      sudo chown "${OWNER}:${OWNER}" "${TARGET_DIR}"
    else
      echo "[sync-app-to-opt] ERROR: ${TARGET_DIR} missing and sudo needs a terminal" >&2
      return 1
    fi
  elif [[ ! -w "${TARGET_DIR}" ]]; then
    log "Fixing ownership on ${TARGET_DIR}..."
    sudo chown "${OWNER}:${OWNER}" "${TARGET_DIR}"
  fi
}

sync_app_files_to_opt() {
  if [[ ! -d "${SOURCE_DIR}" ]]; then
    echo "[sync-app-to-opt] ERROR: source not found: ${SOURCE_DIR}" >&2
    return 1
  fi

  ensure_target_writable
  log "Syncing ${SOURCE_DIR} -> ${TARGET_DIR}"
  rsync -a --delete \
    --exclude node_modules \
    --exclude .git \
    --exclude .env \
    --exclude storage/logs \
    --exclude storage/backups \
    --exclude standalone-modules \
    "${SOURCE_DIR}/" "${TARGET_DIR}/"
}

sync_dist_to_opt() {
  if [[ ! -d "${SOURCE_DIR}/dist" ]]; then
    echo "[sync-app-to-opt] ERROR: dist missing in source — run npm run build first" >&2
    return 1
  fi
  log "Syncing dist/ only"
  rsync -a "${SOURCE_DIR}/dist/" "${TARGET_DIR}/dist/"
}
