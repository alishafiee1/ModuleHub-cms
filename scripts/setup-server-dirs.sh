#!/usr/bin/env bash
# purpose --- Create ModuleHub server directories outside the app tree (run once on Ubuntu) ------
set -euo pipefail

LOG_MODULES="${MODULEHUB_LOG_MODULES:-/var/log/modulehub/modules}"
CACHE_PKG="${MODULEHUB_CACHE_PKG:-/var/cache/modulehub/pkg}"
OWNER="${MODULEHUB_OWNER:-ash}"

usage() {
  cat <<'EOF'
Usage: setup-server-dirs.sh

Creates:
  /var/log/modulehub/modules
  /var/cache/modulehub/pkg

Environment:
  MODULEHUB_LOG_MODULES  (default: /var/log/modulehub/modules)
  MODULEHUB_CACHE_PKG    (default: /var/cache/modulehub/pkg)
  MODULEHUB_OWNER        (default: ash)
EOF
}

log() {
  printf '[setup-server-dirs] %s\n' "$*"
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

log "Creating ${LOG_MODULES}..."
sudo mkdir -p "$LOG_MODULES"
sudo chown -R "${OWNER}:${OWNER}" /var/log/modulehub

log "Creating ${CACHE_PKG}..."
sudo mkdir -p "$CACHE_PKG"
sudo chown -R "${OWNER}:${OWNER}" /var/cache/modulehub

log "Done."
ls -la /var/log/modulehub /var/cache/modulehub
