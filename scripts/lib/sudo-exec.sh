#!/usr/bin/env bash
# purpose --- Run privileged commands: passwordless sudo or one password prompt at deploy start ------
set -euo pipefail

SUDO_EXEC_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=deploy-common.sh
source "${SUDO_EXEC_LIB_DIR}/deploy-common.sh"

SUDO_EXEC_KEEPALIVE_PID=""
SUDO_EXEC_MODE="unknown"

sudo_exec_cleanup() {
  if [[ -n "${SUDO_EXEC_KEEPALIVE_PID}" ]]; then
    kill "${SUDO_EXEC_KEEPALIVE_PID}" 2>/dev/null || true
  fi
}
trap sudo_exec_cleanup EXIT

start_sudo_keepalive() {
  (
    while true; do
      sleep 60
      sudo -n true || exit
      kill -0 "$$" 2>/dev/null || exit
    done
  ) 2>/dev/null &
  SUDO_EXEC_KEEPALIVE_PID=$!
}

prompt_sudo_password() {
  local sudo_user=""
  sudo_user="$(whoami)"
  printf '[deploy-full] Linux sudo password (user %s): ' "${sudo_user}"
  local password=""
  read -rs password
  printf '\n'
  if ! printf '%s\n' "${password}" | sudo -S -v >/dev/null 2>&1; then
    log_error "sudo password validation failed"
    return 1
  fi
  unset password
  log_ok "sudo session ready"
  start_sudo_keepalive
  return 0
}

# ensure_sudo_session --- call once before steps that need root (password asked here if needed) ---
ensure_sudo_session() {
  if [[ "${SUDO_EXEC_MODE}" != "unknown" ]]; then
    return 0
  fi
  if [[ "${DEPLOY_DRY_RUN}" == true ]]; then
    SUDO_EXEC_MODE="dry-run"
    return 0
  fi
  if sudo -n true 2>/dev/null; then
    SUDO_EXEC_MODE="passwordless"
    log_ok "sudo: passwordless session available"
    return 0
  fi
  if [[ ! -t 0 ]]; then
    log_error "sudo required but no TTY — run deploy from an interactive SSH session"
    return 1
  fi
  SUDO_EXEC_MODE="interactive"
  if ! prompt_sudo_password; then
    return 1
  fi
  return 0
}

# detect_sudo_mode --- alias for older call sites ---
detect_sudo_mode() {
  ensure_sudo_session
}

sudo_exec_run() {
  local command="$1"
  if [[ "${DEPLOY_DRY_RUN}" == true ]]; then
    log_info "[dry-run] sudo: ${command}"
    return 0
  fi

  case "${SUDO_EXEC_MODE}" in
    passwordless|interactive)
      sudo bash -c "${command}"
      ;;
    dry-run)
      log_info "[dry-run] sudo: ${command}"
      ;;
    *)
      log_error "sudo session not initialized — call ensure_sudo_session first"
      return 1
      ;;
  esac
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  if [[ $# -lt 1 ]]; then
    echo "Usage: bash scripts/lib/sudo-exec.sh '<shell command>'" >&2
    exit 2
  fi
  ensure_sudo_session
  sudo_exec_run "$*"
fi
