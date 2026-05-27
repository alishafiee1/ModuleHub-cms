#!/usr/bin/env bash
set -euo pipefail
source /opt/modulehub-cms/.env
COOKIE=/tmp/modulehub-cookies.txt
API=http://127.0.0.1:4000/api

curl -s -c "$COOKIE" -X POST "$API/login" \
  -H 'Content-Type: application/json' \
  -d "{\"password\":\"${ADMIN_PASSWORD}\"}" >/dev/null

if grep -q '"id": "thankio"' /home/ash/.local/share/modulehub/modules.json 2>/dev/null; then
  echo "thankio: already exists"
  exit 0
fi

CODE=$(curl -s -b "$COOKIE" -o /tmp/upload.json -w '%{http_code}' \
  -F 'module=@/tmp/thankio-flat.zip' "$API/modules/upload")
echo "upload: HTTP ${CODE}"
cat /tmp/upload.json
echo

if [ "$CODE" = "200" ] || [ "$CODE" = "201" ]; then
  python3 ~/3x-ui/run_via_broker.py 'ip route add default via 192.168.88.1 dev enp63s0 metric 50' >/dev/null || true
  SETTINGS_CODE=$(curl -s -b "$COOKIE" -o /tmp/settings.json -w '%{http_code}' \
    -X PUT "$API/modules/thankio/settings" \
    -H 'Content-Type: application/json' \
    -d '{"ports":[3000],"internalPort":3000,"proxyPrefix":"/modules/thankio/","proxyPaths":["api"]}')
  echo "settings save: HTTP ${SETTINGS_CODE}"
  cat /tmp/settings.json
  echo
  python3 ~/3x-ui/run_via_broker.py 'ip route del default via 192.168.88.1 dev enp63s0 metric 50' >/dev/null || true
fi
