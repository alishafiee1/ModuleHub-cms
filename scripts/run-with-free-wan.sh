#!/usr/bin/env bash
# purpose --- Run a command via free WAN NIC (temp route), then restore metrics ------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${MODULEHUB_APP_DIR:-$(cd "${SCRIPT_DIR}/.." && pwd)}"
TOGGLER="${SCRIPT_DIR}/network-metric-toggler.py"
DEFAULT_INTERFACE="${MODULEHUB_PACKAGE_INSTALL_INTERFACE:-enp63s0}"

log() {
  printf '[free-wan] %s\n' "$*"
}

resolve_install_interface() {
  if [[ -n "${MODULEHUB_PACKAGE_INSTALL_INTERFACE:-}" ]]; then
    printf '%s' "${MODULEHUB_PACKAGE_INSTALL_INTERFACE}"
    return
  fi
  local settings_file="${APP_DIR}/storage/system-settings.json"
  if [[ -f "${settings_file}" ]] && command -v python3 >/dev/null 2>&1; then
    python3 -c "import json,sys; d=json.load(open(sys.argv[1],encoding='utf-8')); print(d.get('packageInstallInterface','enp63s0'))" \
      "${settings_file}" 2>/dev/null && return
  fi
  printf '%s' "${DEFAULT_INTERFACE}"
}

if [[ $# -lt 1 ]]; then
  echo "Usage: bash scripts/run-with-free-wan.sh <command...>" >&2
  echo "Example: bash scripts/run-with-free-wan.sh git pull origin main" >&2
  exit 1
fi

if [[ "${MODULEHUB_SKIP_WAN:-}" == "1" ]]; then
  log "MODULEHUB_SKIP_WAN=1 — running without route toggle"
  exec "$@"
fi

if [[ ! -f "${TOGGLER}" ]]; then
  echo "[free-wan] ERROR: missing ${TOGGLER}" >&2
  exit 1
fi

INTERFACE="$(resolve_install_interface)"
SHELL_COMMAND="$(printf '%s ' "$@")"
SHELL_COMMAND="${SHELL_COMMAND%" "}"

log "interface=${INTERFACE}"
log "command=${SHELL_COMMAND}"

python3 "${TOGGLER}" --interface "${INTERFACE}" --command "${SHELL_COMMAND}"
exit $?
