#!/usr/bin/env bash
# Apply Nginx decoy config for ModuleHub — requires sudo or broker
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=sudo-run.sh
source "${SCRIPT_DIR}/sudo-run.sh"

CONF_SRC="${SCRIPT_DIR}/../config/nginx/haderbash-modulehub.conf"
CONF_DST="/etc/nginx/sites-available/haderbash"

if [ ! -f "$CONF_SRC" ]; then
  echo "Config not found: $CONF_SRC"
  exit 1
fi

run_sudo cp -a /var/www/haderbash "/var/www/haderbash.backup-$(date +%F)" 2>/dev/null || true
run_sudo cp -a "$CONF_DST" "${CONF_DST}.bak-$(date +%F)" 2>/dev/null || true

run_sudo cp "$CONF_SRC" "$CONF_DST"
run_sudo nginx -t
run_sudo systemctl reload nginx
echo "[+] Nginx updated — ModuleHub proxied on 127.0.0.1:8443"
