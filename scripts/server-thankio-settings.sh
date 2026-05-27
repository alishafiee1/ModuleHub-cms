#!/usr/bin/env bash
set -euo pipefail
source /opt/modulehub-cms/.env
COOKIE=/tmp/modulehub-cookies.txt
API=http://127.0.0.1:4000/api
THANKIO_DIR="/home/ash/ModuleHub-cms/standalone-modules/thankio"

# Fix CRLF in thankio module files (Windows zip artifacts)
if [ -d "$THANKIO_DIR" ]; then
  find "$THANKIO_DIR" -type f \( -name '*.json' -o -name 'Dockerfile' -o -name 'docker-compose.yml' \) \
    -exec sed -i 's/\r$//' {} +
  echo "thankio: fixed CRLF in key files"
fi

curl -s -c "$COOKIE" -X POST "$API/login" \
  -H 'Content-Type: application/json' \
  -d "{\"password\":\"${ADMIN_PASSWORD}\"}" >/dev/null

python3 ~/3x-ui/run_via_broker.py 'ip route add default via 192.168.88.1 dev enp63s0 metric 50' >/dev/null
trap 'python3 ~/3x-ui/run_via_broker.py "ip route del default via 192.168.88.1 dev enp63s0 metric 50" >/dev/null || true' EXIT

echo "docker pull node:20-alpine..."
docker pull node:20-alpine 2>&1 | tail -5

if [ -d "$THANKIO_DIR" ]; then
  echo "docker compose build thankio..."
  (cd "$THANKIO_DIR" && docker compose up -d --build) 2>&1 | tail -15
fi

SETTINGS_CODE=$(curl -s -b "$COOKIE" -o /tmp/settings.json -w '%{http_code}' \
  -X PUT "$API/modules/thankio/settings" \
  -H 'Content-Type: application/json' \
  -d '{"ports":[3000],"internalPort":3000,"proxyPrefix":"/modules/thankio/","proxyPaths":["api"]}')
echo "settings save: HTTP ${SETTINGS_CODE}"
cat /tmp/settings.json
echo

grep -A2 '"id": "thankio"' /home/ash/.local/share/modulehub/modules.json || true
