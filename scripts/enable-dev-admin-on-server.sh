#!/usr/bin/env bash
# purpose --- Enable MODULEHUB_DEV_SUPER_ADMIN on production until phase 8 login ------
set -euo pipefail

ENV_FILE="${MODULEHUB_APP_DIR:-/opt/modulehub-cms}/.env"
DROPIN_DIR="/etc/systemd/system/modulehub-cms.service.d"
DROPIN_FILE="${DROPIN_DIR}/dev-admin.conf"

grep -q '^MODULEHUB_DEV_SUPER_ADMIN=1' "$ENV_FILE" 2>/dev/null || echo 'MODULEHUB_DEV_SUPER_ADMIN=1' >> "$ENV_FILE"

mkdir -p "$DROPIN_DIR"
cat > "$DROPIN_FILE" <<'EOF'
[Service]
Environment=MODULEHUB_DEV_SUPER_ADMIN=1
EOF

systemctl daemon-reload
systemctl restart modulehub-cms
sleep 2
curl -sf "http://127.0.0.1:4000/api/auth/status"
echo ""
echo "Done. isSuperAdmin should be true above."
