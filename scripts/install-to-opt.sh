#!/usr/bin/env bash
# purpose --- Copy home clone to /opt: rsync files + runtime deps (build first in home) ------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/sync-app-to-opt.sh
source "${SCRIPT_DIR}/lib/sync-app-to-opt.sh"
# shellcheck source=lib/sync-runtime-deps.sh
source "${SCRIPT_DIR}/lib/sync-runtime-deps.sh"

log() {
  printf '[install-to-opt] %s\n' "$*"
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  cat <<'EOF'
Usage: bash scripts/install-to-opt.sh

Syncs ~/ModuleHub-cms → /opt/modulehub-cms (rsync, no .env / storage backups).

Before running:
  cd ~/ModuleHub-cms && npm run build

Does NOT run npm ci in opt first (registry outages should not block file sync).
Runtime deps: npm ci --omit=dev in opt, or copy node_modules from home on failure.

Full deploy (git + build + restart): bash scripts/deploy-full.sh --yes
EOF
  exit 0
fi

sync_app_files_to_opt
sync_runtime_dependencies

if [[ -x "${SCRIPT_DIR}/restore-linux-native-deps.sh" ]]; then
  MODULEHUB_APP_DIR="${TARGET_DIR}" bash "${SCRIPT_DIR}/restore-linux-native-deps.sh"
fi

log "Done. Restart: sudo systemctl restart modulehub-cms"
