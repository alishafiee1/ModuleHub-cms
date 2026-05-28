#!/usr/bin/env bash
# purpose --- Install logrotate config for CMS and module logs ------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${MODULEHUB_APP_DIR:-$(cd "${SCRIPT_DIR}/.." && pwd)}"
SOURCE_FILE="${APP_DIR}/config/logrotate/modulehub-cms"
DEST_FILE="/etc/logrotate.d/modulehub-cms"

log() {
  printf '[install-logrotate] %s\n' "$*"
}

usage() {
  cat <<EOF
Usage: bash scripts/install-logrotate.sh

Installs logrotate config from:
  ${SOURCE_FILE}

Override app dir:
  MODULEHUB_APP_DIR=/path/to/repo bash scripts/install-logrotate.sh
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ ! -f "${SOURCE_FILE}" ]]; then
  echo "[install-logrotate] ERROR: missing ${SOURCE_FILE}" >&2
  exit 1
fi

log "Installing ${DEST_FILE}..."
sudo cp "${SOURCE_FILE}" "${DEST_FILE}"
sudo chmod 644 "${DEST_FILE}"

log "Dry-run validation..."
sudo logrotate -d "${DEST_FILE}" 2>&1 | tail -n 20

log "Done. Cron runs logrotate daily via /etc/cron.daily/logrotate."
