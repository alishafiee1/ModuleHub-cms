#!/usr/bin/env bash
set -euo pipefail
source /opt/modulehub-cms/.env
COOKIE=/tmp/modulehub-cookies.txt
API=http://127.0.0.1:4000/api

cd /home/ash/ModuleHub-cms/standalone-modules/thankio
docker compose up -d --build 2>&1 | tail -15

curl -s -c "$COOKIE" -X POST "$API/login" \
  -H 'Content-Type: application/json' \
  -d "{\"password\":\"${ADMIN_PASSWORD}\"}" >/dev/null

curl -s -b "$COOKIE" -X PUT "$API/modules/thankio/settings" \
  -H 'Content-Type: application/json' \
  -d '{"ports":[3000],"internalPort":3000,"proxyPrefix":"/modules/thankio/","proxyPaths":["api"]}'
echo
python3 -c "import json; d=json.load(open('/home/ash/.local/share/modulehub/modules.json')); print([m for m in d['modules'] if m['id']=='thankio'][0]['status'])"
