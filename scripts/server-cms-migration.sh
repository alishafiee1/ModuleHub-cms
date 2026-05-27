#!/usr/bin/env bash
# Server CMS migration + thankio flat ZIP upload (run on ubu as ash).
set -euo pipefail

ENV_FILE="/opt/modulehub-cms/.env"
COOKIE_JAR="/tmp/modulehub-cookies.txt"
API="http://127.0.0.1:4000/api"
THANKIO_SRC=""

append_env_if_missing() {
  local key="$1"
  local value="$2"
  if ! grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    echo "${key}=${value}" >> "$ENV_FILE"
    echo "env: added ${key}"
  fi
}

# shellcheck disable=SC1090
source "$ENV_FILE"
ADMIN_PASSWORD="${ADMIN_PASSWORD:?missing ADMIN_PASSWORD}"

append_env_if_missing "BOOTSTRAP_BUILTIN_LAYOUT" "false"
append_env_if_missing "SITE_LAYOUT_JSON_PATH" "/opt/modulehub-cms/data/site-layout.json"
append_env_if_missing "CATALOG_MODULES_DIR" "/opt/modulehub-cms/core/catalog-modules"

python3 ~/3x-ui/run_via_broker.py 'systemctl restart modulehub-cms' >/dev/null
sleep 2

rm -f "$COOKIE_JAR"
login_code=$(curl -s -c "$COOKIE_JAR" -o /tmp/login.json -w '%{http_code}' \
  -X POST "$API/login" \
  -H 'Content-Type: application/json' \
  -d "{\"password\":\"${ADMIN_PASSWORD}\"}")
echo "login: HTTP ${login_code}"
test "$login_code" = "200"

create_instance() {
  local template_id="$1"
  local instance_id="$2"
  local title="$3"
  local desc="$4"
  if grep -q "\"id\": \"${instance_id}\"" /home/ash/.local/share/modulehub/modules.json 2>/dev/null; then
    echo "instance ${instance_id}: already exists — skip"
    return 0
  fi
  local code
  code=$(curl -s -b "$COOKIE_JAR" -o /tmp/instance.json -w '%{http_code}' \
    -X POST "$API/instances" \
    -H 'Content-Type: application/json' \
    -d "{\"templateId\":\"${template_id}\",\"instanceId\":\"${instance_id}\",\"cardTitle\":\"${title}\",\"cardDescription\":\"${desc}\",\"folderId\":\"root\"}")
  echo "instance ${instance_id}: HTTP ${code}"
  test "$code" = "200" -o "$code" = "201"
}

create_instance "image-gallery" "site-gallery" "گالری سایت" "گالری catalog instance"
create_instance "markdown-viewer" "site-markdown" "مارک‌داون سایت" "نمایشگر markdown catalog instance"

# Remove legacy builtin cards from layout (keep demo-api + catalog instances)
python3 << 'PY'
import json
from pathlib import Path

layout_path = Path("/opt/modulehub-cms/data/site-layout.json")
data = json.loads(layout_path.read_text(encoding="utf-8"))
legacy = {"sample-gallery", "markdown-viewer"}
items = [item for item in data["items"] if item.get("id") not in legacy]
if len(items) != len(data["items"]):
    data["items"] = items
    for index, item in enumerate(data["items"], start=1):
        item["sortOrder"] = index
    layout_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("layout: removed builtin demo cards")
else:
    print("layout: no builtin cards to remove")
PY

python3 ~/3x-ui/run_via_broker.py 'systemctl restart modulehub-cms' >/dev/null
sleep 2

echo "done (thankio is not a site module — use server-remove-thankio.sh if accidentally installed)"
