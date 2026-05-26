#!/usr/bin/env bash
# migrate-to-v2 --- convert legacy static registry entries to builtin ---
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODULES_JSON="${MODULES_JSON_PATH:-$ROOT/data/modules.json}"

if [[ ! -f "$MODULES_JSON" ]]; then
  echo "No modules.json at $MODULES_JSON"
  exit 0
fi

node -e "
const fs = require('fs');
const path = process.argv[1];
const root = process.argv[2];
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
let changed = false;
for (const mod of data.modules || []) {
  if (mod.id === 'sample-gallery' && mod.type === 'static') {
    mod.type = 'builtin';
    mod.status = 'static';
    mod.installPath = root + '/core/builtin-modules/sample-gallery';
    mod.permissionsApproved = true;
    mod.updatedAt = new Date().toISOString();
    changed = true;
  }
}
if (changed) {
  fs.copyFileSync(path, path + '.bak');
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
  console.log('Migrated sample-gallery to builtin');
} else {
  console.log('No legacy static entries to migrate');
}
" "$MODULES_JSON" "$ROOT"

echo "Done. Restart modulehub-cms if running."
