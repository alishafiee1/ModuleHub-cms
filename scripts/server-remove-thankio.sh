#!/usr/bin/env bash
# Remove thankio/tankio module from CMS — not a site module.
set -euo pipefail
source /opt/modulehub-cms/.env
COOKIE=/tmp/modulehub-cookies.txt
API=http://127.0.0.1:4000/api

if ! grep -q '"id": "thankio"' /home/ash/.local/share/modulehub/modules.json 2>/dev/null; then
  echo "thankio: not in registry — nothing to remove"
  exit 0
fi

curl -s -c "$COOKIE" -X POST "$API/login" \
  -H 'Content-Type: application/json' \
  -d "{\"password\":\"${ADMIN_PASSWORD}\"}" >/dev/null

CODE=$(curl -s -b "$COOKIE" -o /tmp/del.json -w '%{http_code}' \
  -X DELETE "$API/modules/thankio")
echo "DELETE thankio: HTTP ${CODE}"
cat /tmp/del.json
echo

# Stop leftover docker compose project if present
if [ -d /home/ash/ModuleHub-cms/standalone-modules/thankio ]; then
  (cd /home/ash/ModuleHub-cms/standalone-modules/thankio && docker compose down -v 2>/dev/null) || true
fi

# Remove stray source folder under demo-api (packaging artifact only)
rm -rf /home/ash/ModuleHub-cms/standalone-modules/demo-api/thankio
rm -f /tmp/thankio-flat.zip

python3 << 'PY'
import json
from pathlib import Path

layout = Path("/opt/modulehub-cms/data/site-layout.json")
if layout.exists():
    data = json.loads(layout.read_text(encoding="utf-8"))
    before = len(data.get("items", []))
    data["items"] = [i for i in data.get("items", []) if i.get("id") != "thankio"]
    if len(data["items"]) != before:
        layout.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("layout: removed thankio card")
PY

echo "remaining modules:"
python3 -c "import json; print([m['id'] for m in json.load(open('/home/ash/.local/share/modulehub/modules.json'))['modules']])"
