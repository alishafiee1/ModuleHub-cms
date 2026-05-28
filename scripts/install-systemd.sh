#!/usr/bin/env bash
# purpose --- Install and enable modulehub-cms systemd unit on the server ------
set -euo pipefail

APP_DIR="${MODULEHUB_APP_DIR:-/opt/modulehub-cms}"
SERVICE_NAME="${MODULEHUB_SERVICE:-modulehub-cms}"
SERVICE_FILE="${APP_DIR}/config/systemd/${SERVICE_NAME}.service"
SYSTEMD_DEST="/etc/systemd/system/${SERVICE_NAME}.service"

log() {
  printf '[install-systemd] %s\n' "$*"
}

if [[ ! -f "$SERVICE_FILE" ]]; then
  echo "[install-systemd] ERROR: missing $SERVICE_FILE" >&2
  exit 1
fi

log "Copying unit to $SYSTEMD_DEST..."
sudo cp "$SERVICE_FILE" "$SYSTEMD_DEST"
sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"
log "Restarting $SERVICE_NAME..."
sudo systemctl restart "$SERVICE_NAME"
sudo systemctl status "$SERVICE_NAME" --no-pager
