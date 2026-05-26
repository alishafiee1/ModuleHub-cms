#!/usr/bin/env bash
# Deploy update from dev machine (run on server after rsync)
set -euo pipefail

PROJECT_DST="/opt/modulehub-cms"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cleanup() {
  bash "${SCRIPT_DIR}/network-metric.sh" off || true
}
trap cleanup EXIT

bash "${SCRIPT_DIR}/network-metric.sh" on

cd "$PROJECT_DST"
npm ci
npm run build
sudo systemctl restart modulehub-cms

echo "[+] Deploy complete — $(systemctl is-active modulehub-cms)"
