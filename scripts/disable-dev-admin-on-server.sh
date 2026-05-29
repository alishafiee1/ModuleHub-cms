#!/usr/bin/env bash
# purpose --- Remove MODULEHUB_DEV_SUPER_ADMIN override after phase 8 real login ------
set -euo pipefail

ENV_FILE="${MODULEHUB_APP_DIR:-/opt/modulehub-cms}/.env"
DROPIN_FILE="/etc/systemd/system/modulehub-cms.service.d/dev-admin.conf"

if [[ -f "$ENV_FILE" ]]; then
  sed -i 's/^MODULEHUB_DEV_SUPER_ADMIN=1$/# MODULEHUB_DEV_SUPER_ADMIN=1/' "$ENV_FILE" || true
fi

rm -f "$DROPIN_FILE"
systemctl daemon-reload
systemctl restart modulehub-cms
sleep 2
curl -sf "http://127.0.0.1:4000/api/auth/status"
echo ""
echo "Done. isSuperAdmin should be false above (until real login)."
