#!/usr/bin/env bash
# migrate site-layout.json from flat v2 to v3 (virtual folders)
set -euo pipefail

LAYOUT_PATH="${1:-${SITE_LAYOUT_JSON_PATH:-./data/site-layout.json}}"

if [[ ! -f "$LAYOUT_PATH" ]]; then
  echo "File not found: $LAYOUT_PATH" >&2
  exit 1
fi

node <<'NODE' "$LAYOUT_PATH"
const fs = require('fs');
const layoutPath = process.argv[1];
const raw = JSON.parse(fs.readFileSync(layoutPath, 'utf-8'));

if (Array.isArray(raw.folders) && raw.rootFolderId) {
  console.log('Already v3:', layoutPath);
  process.exit(0);
}

raw.rootFolderId = 'root';
raw.folders = [{ id: 'root', title: 'خانه', parentId: null }];
raw.items = (raw.items || []).map((item) => ({
  ...item,
  folderId: item.folderId ?? 'root',
  kind: item.kind ?? 'module',
}));

const backup = layoutPath + '.bak';
fs.copyFileSync(layoutPath, backup);
fs.writeFileSync(layoutPath, JSON.stringify(raw, null, 2));
console.log('Migrated to v3:', layoutPath);
console.log('Backup:', backup);
NODE
