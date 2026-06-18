#!/usr/bin/env bash
# purpose --- List or remove standalone module folders missing from site-layout ------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${MODULEHUB_APP_DIR:-$(cd "${SCRIPT_DIR}/.." && pwd)}"
DELETE=0

log() { printf '[cleanup-orphan-module-dirs] %s\n' "$*"; }

usage() {
  cat <<'EOF'
Usage: bash scripts/cleanup-orphan-module-dirs.sh [--delete]

Default: list orphan standalone module folders only.
Use --delete to remove folders that are not registered in storage/site-layout.json.

Environment:
  MODULEHUB_APP_DIR   App root (default: parent of scripts/)
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --delete) DELETE=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) log "Unknown option: $1"; usage; exit 1 ;;
  esac
done

node - "${APP_DIR}" "${DELETE}" <<'NODE'
const fs = require('fs');
const path = require('path');

const appDir = process.argv[2];
const shouldDelete = process.argv[3] === '1';
const layoutPath = path.join(appDir, 'storage', 'site-layout.json');
const modulesDir = path.join(appDir, 'standalone-modules');
const logDir = path.join(appDir, 'storage', 'logs', 'modules');

function log(message) {
  console.log(`[cleanup-orphan-module-dirs] ${message}`);
}

if (!fs.existsSync(layoutPath)) {
  throw new Error(`site-layout.json not found: ${layoutPath}`);
}

if (!fs.existsSync(modulesDir)) {
  log(`standalone-modules directory not found: ${modulesDir}`);
  process.exit(0);
}

const layout = JSON.parse(fs.readFileSync(layoutPath, 'utf8'));
const registered = new Set(Object.keys(layout.modules || {}));
const folders = fs.readdirSync(modulesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name.startsWith('mod-'))
  .map((entry) => entry.name);
const orphans = folders.filter((folder) => !registered.has(folder));

if (orphans.length === 0) {
  log('no orphan module directories found');
  process.exit(0);
}

for (const orphan of orphans) {
  const modulePath = path.join(modulesDir, orphan);
  const moduleLogPath = path.join(logDir, `${orphan}.log`);
  if (!shouldDelete) {
    log(`orphan: ${modulePath}`);
    continue;
  }
  fs.rmSync(modulePath, { recursive: true, force: true });
  fs.rmSync(moduleLogPath, { force: true });
  log(`removed: ${orphan}`);
}
NODE
