#!/usr/bin/env bash
# purpose --- Local health checks; optional package-cache smoke with MODULEHUB_RUN_SMOKE=1 ------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CMS_URL="${MODULEHUB_CMS_URL:-http://127.0.0.1:4000}"
RUN_SMOKE="${MODULEHUB_RUN_SMOKE:-0}"
FAILED=0

log() {
  printf '[run-checks] %s\n' "$*"
}

check_http() {
  local path="$1"
  local label="$2"
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 8 "${CMS_URL}${path}" || echo "000")"
  if [[ "${code}" =~ ^2 ]]; then
    log "OK ${label} (${code})"
  else
    log "FAIL ${label} (${code})"
    FAILED=1
  fi
}

usage() {
  cat <<'EOF'
Usage: bash scripts/run-checks.sh [options]

Default: HTTP health + auth status on MODULEHUB_CMS_URL (127.0.0.1:4000).

Options:
  --smoke          Run package-cache manual smoke (same as MODULEHUB_RUN_SMOKE=1)
  -h, --help       Show help

Environment:
  MODULEHUB_CMS_URL       Base URL (default http://127.0.0.1:4000)
  MODULEHUB_RUN_SMOKE=1   Also run scripts/smoke/test-package-cache.sh
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --smoke) RUN_SMOKE=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) log "Unknown option: $1"; usage; exit 1 ;;
  esac
done

log "url=${CMS_URL}"

check_http "/health" "health"
check_http "/api/auth/status" "auth-status"

if command -v systemctl >/dev/null 2>&1; then
  if systemctl is-active --quiet modulehub-cms 2>/dev/null; then
    log "OK systemd modulehub-cms (active)"
  else
    log "WARN systemd modulehub-cms (not active or no permission)"
  fi
fi

if [[ "${RUN_SMOKE}" == "1" ]]; then
  log "smoke: package-cache manual test"
  bash "${SCRIPT_DIR}/smoke/test-package-cache.sh" || FAILED=1
fi

if [[ "${FAILED}" -ne 0 ]]; then
  log "exit 1 — one or more checks failed"
  exit 1
fi

log "exit 0 — all checks passed"
exit 0
